"use strict";

/**
 * GeoShapeWidget — polygon drawing via map modal (REQ-GEO20..GEO25).
 *
 * Gated on @nuup/xform-native-geo (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 *
 * Value shape: ODK semicolon-separated geopoint string
 *   "lat lon alt acc; lat lon alt acc; ..."
 * The ring is closed (first vertex repeated at the end) on commit.
 *
 * UX ported from expo-enketo-form's GeoBridge, adapted to this repo's
 * inline-widget architecture (no WebView/bridge/Modal-hook layer — the
 * widget itself owns an inline modal driven by `store.answerQuestion`).
 */
import { useCallback, useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { UnsupportedWidget } from "./UnsupportedWidget.js";
import { AppModal } from "./primitives/Modal.js";
import { useThemedStyles } from "../theme/ThemeContext.js";
import { useGeoGps, isPermissionState } from "./primitives/useGeoGps.js";
import { GeoMapChrome, MapActionButton, GpsStatusPill, GpsPermissionNotice, PrewarmStatusPill, GeoActionBar } from "./primitives/GeoMapChrome.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const GPS_FALLBACK_HINT = 'También puedes tocar el mapa para ubicar el vértice manualmente.';
let _geoModule = null;
let _geoLoaded;
function getGeoModule() {
  if (_geoLoaded === undefined) {
    try {
      _geoModule = require('@nuup/xform-native-geo');
      _geoLoaded = true;
    } catch {
      _geoLoaded = false;
    }
  }
  return _geoModule;
}
function parseVertices(value) {
  if (typeof value !== 'string' || value.trim().length === 0) return [];
  const parts = value.split(';').map(part => {
    const [lat, lon, alt, acc] = part.trim().split(/\s+/);
    return {
      lat: parseFloat(lat ?? '0') || 0,
      lon: parseFloat(lon ?? '0') || 0,
      alt: parseFloat(alt ?? '0') || 0,
      acc: parseFloat(acc ?? '0') || 0
    };
  });
  // Drop a trailing closing vertex that just repeats the first one, so
  // editing an existing shape doesn't duplicate it further.
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (parts.length > 1 && first && last && first.lat === last.lat && first.lon === last.lon) {
    return parts.slice(0, -1);
  }
  return parts;
}
function serializeVertices(vertices) {
  return vertices.map(v => `${v.lat} ${v.lon} ${v.alt} ${v.acc}`).join('; ');
}

// Closes the ring (repeats the first vertex at the end) per ODK geoshape format.
function closeRing(vertices) {
  const first = vertices[0];
  if (!first) return vertices;
  return [...vertices, first];
}
const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [{
    id: 'osm-layer',
    type: 'raster',
    source: 'osm'
  }]
};
const ESRI_TILES = ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'];
const ESRI_MAX_ZOOM = 17;
const DEFAULT_CENTER = [-99.1332, 19.4326];
const MIN_POINTS = 3;

// Offline tile pre-warm: fixed ~2km half-box around the current fix (fallback:
// first vertex), zooms 12-17 (see design's "Prewarm bbox" decision).
const PREWARM_HALF_BOX_DEG = 0.018;
const PREWARM_MIN_ZOOM = 12;
const PREWARM_MAX_ZOOM = 17;
function computePrewarmBBox(center) {
  const [lon, lat] = center;
  return [lon - PREWARM_HALF_BOX_DEG, lat - PREWARM_HALF_BOX_DEG, lon + PREWARM_HALF_BOX_DEG, lat + PREWARM_HALF_BOX_DEG];
}
export function GeoShapeWidget({
  nodeRef,
  store,
  appearance: _appearance
}) {
  const styles = useThemedStyles(createStyles);
  const geo = getGeoModule();
  const resolved = store.adapter.resolveValue(nodeRef);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const readonly = nodeState.readonly;
  const [modalVisible, setModalVisible] = useState(false);
  const [vertices, setVertices] = useState(parseVertices(resolved));
  useEffect(() => {
    setVertices(parseVertices(resolved));
  }, [resolved]);
  const gps = useGeoGps(geo, {
    enabled: !readonly
  });
  const currentPoint = gps.currentPoint;
  const openMap = useCallback(() => {
    setModalVisible(true);
    void gps.start();
  }, [gps]);
  const closeMap = useCallback(() => {
    gps.stop();
    setModalVisible(false);
  }, [gps]);
  const handleMapPress = useCallback(event => {
    if (readonly) return;
    const lngLat = event?.nativeEvent?.lngLat;
    if (!lngLat) return;
    const [lon, lat] = lngLat;
    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return;
    }
    setVertices(prev => [...prev, {
      lat,
      lon,
      alt: 0,
      acc: 0
    }]);
  }, [readonly]);
  const handleUndo = useCallback(() => {
    setVertices(prev => prev.slice(0, -1));
  }, []);
  const handleAddGpsPoint = useCallback(() => {
    if (!currentPoint) return;
    setVertices(prev => [...prev, currentPoint]);
  }, [currentPoint]);
  const handleRecenter = useCallback(() => {
    gps.recenter();
  }, [gps]);
  const [prewarmStatus, setPrewarmStatus] = useState('idle');
  const handlePrewarm = useCallback(async () => {
    const first = vertices[0];
    const center = currentPoint ? [currentPoint.lon, currentPoint.lat] : first ? [first.lon, first.lat] : DEFAULT_CENTER;
    setPrewarmStatus('running');
    try {
      const result = await geo.preWarmSatelliteTiles(computePrewarmBBox(center), PREWARM_MIN_ZOOM, PREWARM_MAX_ZOOM);
      setPrewarmStatus(result?.capReached ? 'cap' : 'done');
    } catch {
      setPrewarmStatus('error');
    }
  }, [currentPoint, vertices, geo]);
  const handleAccept = useCallback(() => {
    if (vertices.length >= MIN_POINTS) {
      store.answerQuestion(nodeRef, serializeVertices(closeRing(vertices)));
    }
    closeMap();
  }, [vertices, nodeRef, store, closeMap]);
  const handleCancel = useCallback(() => {
    setVertices(parseVertices(resolved));
    closeMap();
  }, [resolved, closeMap]);
  if (!geo) {
    return /*#__PURE__*/_jsx(UnsupportedWidget, {
      dataType: "geoshape"
    });
  }
  const {
    MapLibre
  } = geo;
  const canAccept = vertices.length >= MIN_POINTS;
  const firstVertex = vertices[0];
  const shapeGeoJSON = vertices.length >= 3 && firstVertex ? {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[...vertices.map(v => [v.lon, v.lat]), [firstVertex.lon, firstVertex.lat]]]
    },
    properties: {}
  } : null;
  const center = vertices.length > 0 && vertices[0] != null ? [vertices[0].lon, vertices[0].lat] : DEFAULT_CENTER;
  if (readonly) {
    return /*#__PURE__*/_jsx(View, {
      style: styles.container,
      testID: "geo-shape-readonly",
      children: /*#__PURE__*/_jsx(Text, {
        style: styles.label,
        children: vertices.length > 0 ? `${vertices.length} vertices` : 'No shape set'
      })
    });
  }
  return /*#__PURE__*/_jsxs(View, {
    style: styles.container,
    testID: "geo-shape-widget",
    children: [/*#__PURE__*/_jsx(Text, {
      style: styles.label,
      children: vertices.length > 0 ? `${vertices.length} vertices` : 'Draw shape'
    }), /*#__PURE__*/_jsx(Pressable, {
      onPress: openMap,
      style: styles.openButton,
      testID: "geo-shape-open-map-button",
      children: /*#__PURE__*/_jsx(Text, {
        style: styles.openButtonText,
        children: "Draw Shape"
      })
    }), /*#__PURE__*/_jsx(AppModal, {
      visible: modalVisible,
      onRequestClose: handleCancel,
      testID: "geo-shape-modal",
      fullScreen: true,
      animationType: "slide",
      children: /*#__PURE__*/_jsxs(View, {
        style: styles.modalContent,
        children: [/*#__PURE__*/_jsxs(GeoMapChrome, {
          children: [/*#__PURE__*/_jsxs(MapLibre.Map, {
            style: styles.map,
            mapStyle: OSM_STYLE,
            onPress: handleMapPress,
            testID: "geo-shape-map",
            children: [/*#__PURE__*/_jsx(MapLibre.Camera, {
              ref: gps.cameraRef,
              initialViewState: {
                center,
                zoom: 15
              }
            }), /*#__PURE__*/_jsx(MapLibre.RasterSource, {
              id: "esri-satellite",
              tiles: ESRI_TILES,
              tileSize: 256,
              maxzoom: ESRI_MAX_ZOOM,
              children: /*#__PURE__*/_jsx(MapLibre.Layer, {
                id: "esri-satellite-layer",
                type: "raster",
                layerIndex: 1
              })
            }), /*#__PURE__*/_jsx(MapLibre.RasterSource, {
              id: "esri-offline",
              tiles: [geo.SATELLITE_TILE_URI_TEMPLATE],
              tileSize: 256,
              maxzoom: ESRI_MAX_ZOOM,
              children: /*#__PURE__*/_jsx(MapLibre.Layer, {
                id: "esri-offline-layer",
                type: "raster",
                layerIndex: 2
              })
            }), shapeGeoJSON && /*#__PURE__*/_jsxs(MapLibre.GeoJSONSource, {
              id: "shape",
              data: shapeGeoJSON,
              children: [/*#__PURE__*/_jsx(MapLibre.Layer, {
                id: "shape-fill-layer",
                type: "fill",
                layerIndex: 3,
                paint: {
                  'fill-color': 'rgba(0,150,136,0.3)',
                  'fill-outline-color': '#009688'
                }
              }), /*#__PURE__*/_jsx(MapLibre.Layer, {
                id: "shape-line-layer",
                type: "line",
                layerIndex: 4,
                paint: {
                  'line-color': '#009688',
                  'line-width': 3
                }
              })]
            }), vertices.map((v, i) => /*#__PURE__*/_jsx(MapLibre.Marker, {
              id: `shape-pt-${i}`,
              lngLat: [v.lon, v.lat],
              children: /*#__PURE__*/_jsx(View, {
                style: styles.pin,
                testID: `geo-shape-pin-${i}`
              })
            }, i)), currentPoint && /*#__PURE__*/_jsx(MapLibre.Marker, {
              id: "current-pos",
              lngLat: [currentPoint.lon, currentPoint.lat],
              children: /*#__PURE__*/_jsx(View, {
                style: styles.gpsDotOuter,
                children: /*#__PURE__*/_jsx(View, {
                  style: styles.gpsDotInner
                })
              })
            })]
          }), /*#__PURE__*/_jsx(MapActionButton, {
            icon: "\u2299",
            onPress: handleRecenter,
            style: styles.recenterButtonPosition,
            testID: "geo-shape-recenter-button",
            disabled: !currentPoint
          }), /*#__PURE__*/_jsx(MapActionButton, {
            icon: "\u2913",
            onPress: handlePrewarm,
            style: styles.prewarmButtonPosition,
            testID: "geo-shape-prewarm-button",
            disabled: prewarmStatus === 'running'
          }), isPermissionState(gps.status) ? /*#__PURE__*/_jsx(GpsPermissionNotice, {
            status: gps.status,
            onRequestPermission: gps.requestPermission,
            onDismiss: gps.dismissRationale,
            onOpenSettings: gps.openLocationSettings,
            fallbackHint: GPS_FALLBACK_HINT,
            testID: "gps-permission-notice"
          }) : /*#__PURE__*/_jsx(GpsStatusPill, {
            status: gps.status,
            accuracyM: currentPoint?.acc
          }), /*#__PURE__*/_jsx(PrewarmStatusPill, {
            status: prewarmStatus,
            testID: "geo-shape-prewarm-status"
          })]
        }), /*#__PURE__*/_jsx(GeoActionBar, {
          undo: vertices.length > 0 ? {
            onPress: handleUndo,
            testID: 'geo-shape-undo-button'
          } : undefined,
          addPoint: {
            onPress: handleAddGpsPoint,
            disabled: !currentPoint,
            testID: 'geo-shape-add-point-button'
          },
          accept: {
            onPress: handleAccept,
            disabled: !canAccept,
            testID: 'geo-shape-accept-button'
          },
          cancel: {
            onPress: handleCancel,
            testID: 'geo-shape-cancel-button'
          }
        })]
      })
    })]
  });
}

// Live-GPS marker uses `roles.tertiary` — a role distinct from the
// dropped-vertex pin's `roles.error`, so the two marker kinds stay visually
// distinguishable after moving off the old hardcoded red/blue pair.
function createStyles(t) {
  return StyleSheet.create({
    container: {
      gap: t.spacing.sm
    },
    label: {
      ...t.typography.mono,
      color: t.color.roles.onSurface
    },
    openButton: {
      padding: t.spacing.sm,
      borderRadius: t.radius.sm,
      backgroundColor: t.color.roles.primary,
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: t.spacing.md
    },
    openButtonText: {
      color: t.color.roles.onPrimary,
      ...t.typography.labelLarge
    },
    modalContent: {
      flex: 1,
      width: '100%',
      gap: t.spacing.md
    },
    map: {
      flex: 1,
      width: '100%'
    },
    pin: {
      width: 20,
      height: 20,
      backgroundColor: t.color.roles.error,
      borderRadius: 10
    },
    gpsDotOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: t.color.roles.tertiaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: t.color.roles.tertiary
    },
    gpsDotInner: {
      width: 9,
      height: 9,
      borderRadius: 4.5,
      backgroundColor: t.color.roles.tertiary
    },
    // Position-only overrides layered onto GeoMapChrome's MapActionButton
    // (see GeoMapChrome.tsx docblock).
    recenterButtonPosition: {
      top: t.spacing.sm,
      right: t.spacing.sm
    },
    prewarmButtonPosition: {
      top: t.spacing.sm + 44,
      right: t.spacing.sm
    }
  });
}
//# sourceMappingURL=GeoShapeWidget.js.map