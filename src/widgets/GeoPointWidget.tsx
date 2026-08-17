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
import { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { AppModal } from './primitives/Modal';
import { tokens } from '../tokens/tokens';

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

export interface GeoPointWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function GeoPointWidget({ nodeRef, store, appearance: _appearance }: GeoPointWidgetProps) {
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
  // Live GPS position (blue dot), used as fallback when the map hasn't been tapped
  const [currentPoint, setCurrentPoint] = useState<GeoPoint | null>(null);

  // When resolved value changes externally, sync local state
  useEffect(() => {
    if (isGeoPoint(resolved)) {
      setCoordinate(resolved);
    }
  }, [resolved]);

  const mountedRef = useRef(true);
  const watchRef = useRef<{ remove: () => void } | null>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      watchRef.current?.remove();
    };
  }, []);

  const stopWatch = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
  }, []);

  const startWatching = useCallback(async () => {
    if (!geo || readonly) return;
    try {
      const { status } = await geo.Location.requestForegroundPermissionsAsync();
      if (!mountedRef.current || status !== 'granted') return;

      const sub = await geo.Location.watchPositionAsync(
        {
          accuracy: geo.Location.Accuracy?.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 0,
        },
        (loc: any) => {
          if (!mountedRef.current) return;
          setCurrentPoint({
            lat: loc.coords.latitude,
            lon: loc.coords.longitude,
            alt: loc.coords.altitude ?? 0,
            acc: loc.coords.accuracy ?? 0,
          });
        },
      );

      if (!mountedRef.current) {
        sub.remove();
        return;
      }
      watchRef.current = sub;
    } catch {
      // GPS capture is best-effort
    }
  }, [geo, readonly]);

  const openMap = useCallback(() => {
    setModalVisible(true);
    setTappedPoint(isGeoPoint(coordinate) ? coordinate : null);
    void startWatching();
  }, [coordinate, startWatching]);

  const closeMap = useCallback(() => {
    stopWatch();
    setModalVisible(false);
  }, [stopWatch]);

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
    if (!currentPoint) return;
    cameraRef.current?.flyTo?.({ center: [currentPoint.lon, currentPoint.lat], duration: 400 });
  }, [currentPoint]);

  const handleAccept = useCallback(() => {
    // Manually tapped pin takes precedence over live GPS position
    const point = tappedPoint ?? currentPoint;
    if (point) {
      store.answerQuestion(nodeRef, point);
    }
    closeMap();
  }, [tappedPoint, currentPoint, nodeRef, store, closeMap]);

  const handleCancel = useCallback(() => {
    stopWatch();
    setTappedPoint(null);
    setCurrentPoint(null);
    if (isGeoPoint(resolved)) {
      setCoordinate(resolved);
    } else {
      setCoordinate(null);
    }
    closeMap();
  }, [resolved, closeMap, stopWatch]);

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
        style={styles.button}
        testID="geo-open-map-button"
      >
        <Text style={styles.buttonText}>Open Map</Text>
      </Pressable>

      <AppModal
        visible={modalVisible}
        onRequestClose={handleCancel}
        testID="geo-map-modal"
        fullScreen
        animationType="slide"
      >
        <View style={styles.modalContent}>
          <View style={styles.mapContainer}>
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

            <Pressable
              onPress={handleRecenter}
              style={styles.recenterButton}
              testID="geo-recenter-button"
              disabled={!currentPoint}
            >
              <Text style={styles.buttonText}>⊙</Text>
            </Pressable>

            {!currentPoint && (
              <View style={styles.statusOverlay} pointerEvents="none">
                <ActivityIndicator size="small" />
                <Text style={styles.statusText}>Adquiriendo señal GPS…</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            {tappedPoint && (
              <Pressable
                onPress={handleUndo}
                style={[styles.button, styles.undoButton]}
                testID="geo-undo-button"
              >
                <Text style={styles.buttonText}>Undo</Text>
              </Pressable>
            )}
            <Pressable
              onPress={canAccept ? handleAccept : undefined}
              style={[styles.button, styles.acceptButton, !canAccept && styles.buttonDisabled]}
              disabled={!canAccept}
              testID="geo-accept-button"
            >
              <Text style={styles.buttonText}>Accept</Text>
            </Pressable>
            <Pressable
              onPress={handleCancel}
              style={[styles.button, styles.cancelButton]}
              testID="geo-cancel-button"
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.sm,
  },
  label: {
    fontSize: tokens.font.sm,
    color: tokens.color.text,
  },
  button: {
    padding: tokens.spacing.sm,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
  },
  buttonText: {
    color: tokens.color.text,
    fontSize: tokens.font.sm,
  },
  acceptButton: {
    backgroundColor: tokens.color.primary,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: tokens.color.error,
    flex: 1,
  },
  undoButton: {
    backgroundColor: tokens.color.surface,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  modalContent: {
    flex: 1,
    width: '100%',
    gap: tokens.spacing.md,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  pin: {
    width: 20,
    height: 20,
    backgroundColor: tokens.color.error,
    borderRadius: 10,
  },
  gpsDotOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(33,150,243,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  gpsDotInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#2196F3',
  },
  recenterButton: {
    position: 'absolute',
    top: tokens.spacing.sm,
    right: tokens.spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOverlay: {
    position: 'absolute',
    bottom: tokens.spacing.sm,
    left: tokens.spacing.sm,
    right: tokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.xs,
  },
  statusText: {
    color: '#fff',
    fontSize: tokens.font.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
});
