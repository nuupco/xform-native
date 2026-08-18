/**
 * GeoTraceWidget — polyline drawing via map modal (REQ-GEO30..GEO35).
 *
 * Gated on @nuup/xform-native-geo (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 *
 * Value shape: ODK semicolon-separated geopoint string
 *   "lat lon alt acc; lat lon alt acc; ..."
 *
 * UX ported from expo-enketo-form's GeoBridge, adapted to this repo's
 * inline-widget architecture (no WebView/bridge/Modal-hook layer — the
 * widget itself owns an inline modal driven by `store.answerQuestion`).
 */
import { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { AppModal } from './primitives/Modal';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import { useGeoGps } from './primitives/useGeoGps';
import {
  GeoMapChrome,
  MapActionButton,
  GpsStatusPill,
  PrewarmStatusPill,
  GeoActionBar,
} from './primitives/GeoMapChrome';

interface Vertex {
  lat: number;
  lon: number;
  alt: number;
  acc: number;
}

let _geoModule: any | null = null;
let _geoLoaded: boolean | undefined;

function getGeoModule(): any | null {
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

function parseVertices(value: unknown): Vertex[] {
  if (typeof value !== 'string' || value.trim().length === 0) return [];
  return value.split(';').map((part) => {
    const [lat, lon, alt, acc] = part.trim().split(/\s+/);
    return {
      lat: parseFloat(lat ?? '0') || 0,
      lon: parseFloat(lon ?? '0') || 0,
      alt: parseFloat(alt ?? '0') || 0,
      acc: parseFloat(acc ?? '0') || 0,
    };
  });
}

function serializeVertices(vertices: Vertex[]): string {
  return vertices
    .map((v) => `${v.lat} ${v.lon} ${v.alt} ${v.acc}`)
    .join('; ');
}

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm-layer', type: 'raster', source: 'osm' }],
};

const ESRI_TILES = [
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
];
const ESRI_MAX_ZOOM = 17;
const DEFAULT_CENTER: [number, number] = [-99.1332, 19.4326];
const MIN_POINTS = 2;

// Offline tile pre-warm: fixed ~2km half-box around the current fix (fallback:
// first vertex), zooms 12-17 (see design's "Prewarm bbox" decision).
const PREWARM_HALF_BOX_DEG = 0.018;
const PREWARM_MIN_ZOOM = 12;
const PREWARM_MAX_ZOOM = 17;

type PrewarmStatus = 'idle' | 'running' | 'done' | 'cap' | 'error';

function computePrewarmBBox(center: [number, number]): [number, number, number, number] {
  const [lon, lat] = center;
  return [
    lon - PREWARM_HALF_BOX_DEG,
    lat - PREWARM_HALF_BOX_DEG,
    lon + PREWARM_HALF_BOX_DEG,
    lat + PREWARM_HALF_BOX_DEG,
  ];
}

export interface GeoTraceWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function GeoTraceWidget({ nodeRef, store, appearance: _appearance }: GeoTraceWidgetProps) {
  const styles = useThemedStyles(createStyles);
  const geo = getGeoModule();
  const resolved = store.adapter.resolveValue(nodeRef);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const readonly = nodeState.readonly;

  const [modalVisible, setModalVisible] = useState(false);
  const [vertices, setVertices] = useState<Vertex[]>(parseVertices(resolved));

  useEffect(() => {
    setVertices(parseVertices(resolved));
  }, [resolved]);

  const gps = useGeoGps(geo, { enabled: !readonly });
  const currentPoint = gps.currentPoint;

  const openMap = useCallback(() => {
    setModalVisible(true);
    void gps.start();
  }, [gps]);

  const closeMap = useCallback(() => {
    gps.stop();
    setModalVisible(false);
  }, [gps]);

  const handleMapPress = useCallback(
    (event: any) => {
      if (readonly) return;
      const lngLat = event?.nativeEvent?.lngLat;
      if (!lngLat) return;
      const [lon, lat] = lngLat;
      if (
        typeof lat !== 'number' || typeof lon !== 'number' ||
        isNaN(lat) || isNaN(lon) ||
        lat < -90 || lat > 90 || lon < -180 || lon > 180
      ) {
        return;
      }
      setVertices((prev) => [...prev, { lat, lon, alt: 0, acc: 0 }]);
    },
    [readonly],
  );

  const handleUndo = useCallback(() => {
    setVertices((prev) => prev.slice(0, -1));
  }, []);

  const handleAddGpsPoint = useCallback(() => {
    if (!currentPoint) return;
    setVertices((prev) => [...prev, currentPoint]);
  }, [currentPoint]);

  const handleRecenter = useCallback(() => {
    gps.recenter();
  }, [gps]);

  const [prewarmStatus, setPrewarmStatus] = useState<PrewarmStatus>('idle');

  const handlePrewarm = useCallback(async () => {
    const first = vertices[0];
    const center: [number, number] = currentPoint
      ? [currentPoint.lon, currentPoint.lat]
      : first
        ? [first.lon, first.lat]
        : DEFAULT_CENTER;
    setPrewarmStatus('running');
    try {
      const result = await geo.preWarmSatelliteTiles(
        computePrewarmBBox(center),
        PREWARM_MIN_ZOOM,
        PREWARM_MAX_ZOOM,
      );
      setPrewarmStatus(result?.capReached ? 'cap' : 'done');
    } catch {
      setPrewarmStatus('error');
    }
  }, [currentPoint, vertices, geo]);

  const handleAccept = useCallback(() => {
    if (vertices.length >= MIN_POINTS) {
      store.answerQuestion(nodeRef, serializeVertices(vertices));
    }
    closeMap();
  }, [vertices, nodeRef, store, closeMap]);

  const handleCancel = useCallback(() => {
    setVertices(parseVertices(resolved));
    closeMap();
  }, [resolved, closeMap]);

  if (!geo) {
    return <UnsupportedWidget dataType="geotrace" />;
  }

  const { MapLibre } = geo;
  const canAccept = vertices.length >= MIN_POINTS;

  const lineGeoJSON =
    vertices.length >= 2
      ? {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: vertices.map((v) => [v.lon, v.lat]),
          },
          properties: {},
        }
      : null;

  const center =
    vertices.length > 0 && vertices[0] != null
      ? ([vertices[0].lon, vertices[0].lat] as [number, number])
      : DEFAULT_CENTER;

  if (readonly) {
    return (
      <View style={styles.container} testID="geo-trace-readonly">
        <Text style={styles.label}>
          {vertices.length > 0
            ? `${vertices.length} vertices`
            : 'No trace set'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="geo-trace-widget">
      <Text style={styles.label}>
        {vertices.length > 0
          ? `${vertices.length} vertices`
          : 'Draw trace'}
      </Text>
      <Pressable
        onPress={openMap}
        style={styles.openButton}
        testID="geo-trace-open-map-button"
      >
        <Text style={styles.openButtonText}>Draw Trace</Text>
      </Pressable>

      <AppModal
        visible={modalVisible}
        onRequestClose={handleCancel}
        testID="geo-trace-modal"
        fullScreen
        animationType="slide"
      >
        <View style={styles.modalContent}>
          <GeoMapChrome>
            <MapLibre.Map
              style={styles.map}
              mapStyle={OSM_STYLE}
              onPress={handleMapPress}
              testID="geo-trace-map"
            >
              <MapLibre.Camera
                ref={gps.cameraRef}
                initialViewState={{ center, zoom: 15 }}
              />

              <MapLibre.RasterSource
                id="esri-satellite"
                tiles={ESRI_TILES}
                tileSize={256}
                maxzoom={ESRI_MAX_ZOOM}
              >
                <MapLibre.Layer id="esri-satellite-layer" type="raster" layerIndex={1} />
              </MapLibre.RasterSource>

              <MapLibre.RasterSource
                id="esri-offline"
                tiles={[geo.SATELLITE_TILE_URI_TEMPLATE]}
                tileSize={256}
                maxzoom={ESRI_MAX_ZOOM}
              >
                <MapLibre.Layer id="esri-offline-layer" type="raster" layerIndex={2} />
              </MapLibre.RasterSource>

              {lineGeoJSON && (
                <MapLibre.GeoJSONSource id="trace" data={lineGeoJSON}>
                  <MapLibre.Layer
                    id="trace-line-layer"
                    type="line"
                    layerIndex={3}
                    paint={{ 'line-color': '#009688', 'line-width': 3 }}
                  />
                </MapLibre.GeoJSONSource>
              )}

              {vertices.map((v, i) => (
                <MapLibre.Marker key={i} id={`trace-pt-${i}`} lngLat={[v.lon, v.lat]}>
                  <View style={styles.pin} testID={`geo-trace-pin-${i}`} />
                </MapLibre.Marker>
              ))}

              {currentPoint && (
                <MapLibre.Marker id="current-pos" lngLat={[currentPoint.lon, currentPoint.lat]}>
                  <View style={styles.gpsDotOuter}>
                    <View style={styles.gpsDotInner} />
                  </View>
                </MapLibre.Marker>
              )}
            </MapLibre.Map>

            <MapActionButton
              icon="⊙"
              onPress={handleRecenter}
              style={styles.recenterButtonPosition}
              testID="geo-trace-recenter-button"
              disabled={!currentPoint}
            />

            <MapActionButton
              icon="⤓"
              onPress={handlePrewarm}
              style={styles.prewarmButtonPosition}
              testID="geo-trace-prewarm-button"
              disabled={prewarmStatus === 'running'}
            />

            <GpsStatusPill status={gps.status} accuracyM={currentPoint?.acc} />

            <PrewarmStatusPill status={prewarmStatus} testID="geo-trace-prewarm-status" />
          </GeoMapChrome>

          <GeoActionBar
            undo={vertices.length > 0 ? { onPress: handleUndo, testID: 'geo-trace-undo-button' } : undefined}
            addPoint={{
              onPress: handleAddGpsPoint,
              disabled: !currentPoint,
              testID: 'geo-trace-add-point-button',
            }}
            accept={{ onPress: handleAccept, disabled: !canAccept, testID: 'geo-trace-accept-button' }}
            cancel={{ onPress: handleCancel, testID: 'geo-trace-cancel-button' }}
          />
        </View>
      </AppModal>
    </View>
  );
}

// Live-GPS marker uses `roles.tertiary` — a role distinct from the
// dropped-vertex pin's `roles.error`, so the two marker kinds stay visually
// distinguishable after moving off the old hardcoded red/blue pair.
function createStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      gap: t.spacing.sm,
    },
    label: {
      ...t.typography.mono,
      color: t.color.roles.onSurface,
    },
    openButton: {
      padding: t.spacing.sm,
      borderRadius: t.radius.sm,
      backgroundColor: t.color.roles.primary,
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: t.spacing.md,
    },
    openButtonText: {
      color: t.color.roles.onPrimary,
      ...t.typography.labelLarge,
    },
    modalContent: {
      flex: 1,
      width: '100%',
      gap: t.spacing.md,
    },
    map: {
      flex: 1,
      width: '100%',
    },
    pin: {
      width: 20,
      height: 20,
      backgroundColor: t.color.roles.error,
      borderRadius: 10,
    },
    gpsDotOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: t.color.roles.tertiaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: t.color.roles.tertiary,
    },
    gpsDotInner: {
      width: 9,
      height: 9,
      borderRadius: 4.5,
      backgroundColor: t.color.roles.tertiary,
    },
    // Position-only overrides layered onto GeoMapChrome's MapActionButton
    // (see GeoMapChrome.tsx docblock).
    recenterButtonPosition: {
      top: t.spacing.sm,
      right: t.spacing.sm,
    },
    prewarmButtonPosition: {
      top: t.spacing.sm + 44,
      right: t.spacing.sm,
    },
  });
}
