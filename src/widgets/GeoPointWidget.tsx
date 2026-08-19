/**
 * GeoPointWidget — geopoint data capture via map (REQ-GEO03..GEO08).
 *
 * Gated on @nuup/xform-native-geo (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 *
 * Value shape: { lat: number, lon: number, alt: number, acc: number } | null
 *
 * UX ported from expo-enketo-form's GeoBridge (WebView-bridge modal),
 * adapted to this repo's inline-widget architecture: no WebView/bridge
 * layer here — the widget itself renders the map inline inside its own
 * modal, driven directly by `store.answerQuestion` / `resolveValue`.
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
import { useGeoGps, isPermissionState } from './primitives/useGeoGps';
import {
  GeoMapChrome,
  MapActionButton,
  GpsStatusPill,
  GpsPermissionNotice,
  PrewarmStatusPill,
  GeoActionBar,
} from './primitives/GeoMapChrome';

const GPS_FALLBACK_HINT = 'También puedes tocar el mapa para ubicar el punto manualmente.';

interface GeoPoint {
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

function isGeoPoint(value: unknown): value is GeoPoint {
  return (
    value !== null &&
    typeof value === 'object' &&
    'lat' in value &&
    'lon' in value &&
    'alt' in value &&
    'acc' in value &&
    typeof (value as GeoPoint).lat === 'number' &&
    typeof (value as GeoPoint).lon === 'number' &&
    typeof (value as GeoPoint).alt === 'number' &&
    typeof (value as GeoPoint).acc === 'number'
  );
}

// OSM raster base — no API key required
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

// ESRI World Imagery — free satellite tiles, no API key.
// ESRI URL order is z/y/x (row before column).
const ESRI_TILES = [
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
];
const ESRI_MAX_ZOOM = 17;

const DEFAULT_CENTER: [number, number] = [-99.1332, 19.4326];

// Offline tile pre-warm: fixed ~2km half-box around the current fix, zooms 12-17
// (see design's "Prewarm bbox" decision — avoids depending on an unverified
// MapLibre v11 viewport-bounds API; the GPS fix is already a single source of truth).
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

export interface GeoPointWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function GeoPointWidget({ nodeRef, store, appearance: _appearance }: GeoPointWidgetProps) {
  const styles = useThemedStyles(createStyles);
  const geo = getGeoModule();
  const resolved = store.adapter.resolveValue(nodeRef);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const readonly = nodeState.readonly;

  const [modalVisible, setModalVisible] = useState(false);
  const [coordinate, setCoordinate] = useState<GeoPoint | null>(
    isGeoPoint(resolved) ? resolved : null,
  );
  // Manually tapped pin (takes precedence over live GPS on accept)
  const [tappedPoint, setTappedPoint] = useState<GeoPoint | null>(null);

  // When resolved value changes externally, sync local state
  useEffect(() => {
    if (isGeoPoint(resolved)) {
      setCoordinate(resolved);
    }
  }, [resolved]);

  const gps = useGeoGps(geo, { enabled: !readonly });
  const currentPoint = gps.currentPoint;
  const cameraRef = gps.cameraRef;

  const openMap = useCallback(() => {
    setModalVisible(true);
    setTappedPoint(isGeoPoint(coordinate) ? coordinate : null);
    void gps.start();
  }, [coordinate, gps]);

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
      setTappedPoint({ lat, lon, alt: 0, acc: 0 });
    },
    [readonly],
  );

  const handleUndo = useCallback(() => {
    setTappedPoint(null);
  }, []);

  const handleRecenter = useCallback(() => {
    gps.recenter();
  }, [gps]);

  const [prewarmStatus, setPrewarmStatus] = useState<PrewarmStatus>('idle');

  const handlePrewarm = useCallback(async () => {
    const source = currentPoint ?? tappedPoint ?? coordinate;
    const center: [number, number] = source ? [source.lon, source.lat] : DEFAULT_CENTER;
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
  }, [currentPoint, tappedPoint, coordinate, geo]);

  const handleAccept = useCallback(() => {
    // Manually tapped pin takes precedence over live GPS position
    const point = tappedPoint ?? currentPoint;
    if (point) {
      store.answerQuestion(nodeRef, point);
    }
    closeMap();
  }, [tappedPoint, currentPoint, nodeRef, store, closeMap]);

  const handleCancel = useCallback(() => {
    setTappedPoint(null);
    if (isGeoPoint(resolved)) {
      setCoordinate(resolved);
    } else {
      setCoordinate(null);
    }
    closeMap();
  }, [resolved, closeMap]);

  if (!geo) {
    return <UnsupportedWidget dataType="geopoint" />;
  }

  const { MapLibre } = geo;
  const canAccept = tappedPoint !== null || currentPoint !== null;
  const mapCenter = tappedPoint
    ? [tappedPoint.lon, tappedPoint.lat]
    : coordinate
      ? [coordinate.lon, coordinate.lat]
      : DEFAULT_CENTER;

  if (readonly) {
    return (
      <View style={styles.container} testID="geo-readonly">
        <Text style={styles.label}>
          {coordinate
            ? `Lat: ${coordinate.lat.toFixed(5)}, Lon: ${coordinate.lon.toFixed(5)}`
            : 'No location set'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="geo-widget">
      <Text style={styles.label}>
        {coordinate
          ? `Lat: ${coordinate.lat.toFixed(5)}, Lon: ${coordinate.lon.toFixed(5)}`
          : 'Select location'}
      </Text>
      <Pressable
        onPress={openMap}
        style={styles.openButton}
        testID="geo-open-map-button"
      >
        <Text style={styles.openButtonText}>Open Map</Text>
      </Pressable>

      <AppModal
        visible={modalVisible}
        onRequestClose={handleCancel}
        testID="geo-map-modal"
        fullScreen
        animationType="slide"
      >
        <View style={styles.modalContent}>
          <GeoMapChrome>
            <MapLibre.Map
              style={styles.map}
              mapStyle={OSM_STYLE}
              onPress={handleMapPress}
              testID="geo-maplibre-map"
            >
              <MapLibre.Camera
                ref={cameraRef}
                initialViewState={{ center: mapCenter, zoom: 15 }}
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

              {tappedPoint && (
                <MapLibre.Marker id="tapped-pin" lngLat={[tappedPoint.lon, tappedPoint.lat]}>
                  <View style={styles.pin} testID="geo-map-pin" />
                </MapLibre.Marker>
              )}

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
              testID="geo-recenter-button"
              disabled={!currentPoint}
            />

            <MapActionButton
              icon="⤓"
              onPress={handlePrewarm}
              style={styles.prewarmButtonPosition}
              testID="geo-prewarm-button"
              disabled={prewarmStatus === 'running'}
            />

            {isPermissionState(gps.status) ? (
              <GpsPermissionNotice
                status={gps.status}
                onRequestPermission={gps.requestPermission}
                onDismiss={gps.dismissRationale}
                onOpenSettings={gps.openLocationSettings}
                fallbackHint={GPS_FALLBACK_HINT}
                testID="gps-permission-notice"
              />
            ) : (
              <GpsStatusPill status={gps.status} accuracyM={currentPoint?.acc} />
            )}

            <PrewarmStatusPill status={prewarmStatus} testID="geo-prewarm-status" />
          </GeoMapChrome>

          <GeoActionBar
            undo={tappedPoint ? { onPress: handleUndo, testID: 'geo-undo-button' } : undefined}
            accept={{ onPress: handleAccept, disabled: !canAccept, testID: 'geo-accept-button' }}
            cancel={{ onPress: handleCancel, testID: 'geo-cancel-button' }}
          />
        </View>
      </AppModal>
    </View>
  );
}

// Live-GPS marker uses `roles.tertiary` — a role distinct from the
// tapped-pin's `roles.error`, so the two marker kinds stay visually
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
