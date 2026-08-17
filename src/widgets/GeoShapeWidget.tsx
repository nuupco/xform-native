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
import { SafeAreaBottom } from './primitives/SafeAreaBottom';
import { tokens } from '../tokens/tokens';

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
  const parts = value.split(';').map((part) => {
    const [lat, lon, alt, acc] = part.trim().split(/\s+/);
    return {
      lat: parseFloat(lat ?? '0') || 0,
      lon: parseFloat(lon ?? '0') || 0,
      alt: parseFloat(alt ?? '0') || 0,
      acc: parseFloat(acc ?? '0') || 0,
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

function serializeVertices(vertices: Vertex[]): string {
  return vertices
    .map((v) => `${v.lat} ${v.lon} ${v.alt} ${v.acc}`)
    .join('; ');
}

// Closes the ring (repeats the first vertex at the end) per ODK geoshape format.
function closeRing(vertices: Vertex[]): Vertex[] {
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
const MIN_POINTS = 3;

export interface GeoShapeWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function GeoShapeWidget({ nodeRef, store, appearance: _appearance }: GeoShapeWidgetProps) {
  const geo = getGeoModule();
  const resolved = store.adapter.resolveValue(nodeRef);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const readonly = nodeState.readonly;

  const [modalVisible, setModalVisible] = useState(false);
  const [vertices, setVertices] = useState<Vertex[]>(parseVertices(resolved));
  const [currentPoint, setCurrentPoint] = useState<Vertex | null>(null);

  useEffect(() => {
    setVertices(parseVertices(resolved));
  }, [resolved]);

  const mountedRef = useRef(true);
  const watchRef = useRef<{ remove: () => void } | null>(null);

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
    void startWatching();
  }, [startWatching]);

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
      setVertices((prev) => [...prev, { lat, lon, alt: 0, acc: 0 }]);
    },
    [readonly],
  );

  const handleUndo = useCallback(() => {
    setVertices((prev) => prev.slice(0, -1));
  }, []);

  const handleAccept = useCallback(() => {
    if (vertices.length >= MIN_POINTS) {
      store.answerQuestion(nodeRef, serializeVertices(closeRing(vertices)));
    }
    closeMap();
  }, [vertices, nodeRef, store, closeMap]);

  const handleCancel = useCallback(() => {
    stopWatch();
    setVertices(parseVertices(resolved));
    closeMap();
  }, [resolved, closeMap, stopWatch]);

  if (!geo) {
    return <UnsupportedWidget dataType="geoshape" />;
  }

  const { MapLibre } = geo;
  const canAccept = vertices.length >= MIN_POINTS;

  const firstVertex = vertices[0];
  const shapeGeoJSON =
    vertices.length >= 3 && firstVertex
      ? {
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [
              [...vertices.map((v) => [v.lon, v.lat]), [firstVertex.lon, firstVertex.lat]],
            ],
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
      <View style={styles.container} testID="geo-shape-readonly">
        <Text style={styles.label}>
          {vertices.length > 0
            ? `${vertices.length} vertices`
            : 'No shape set'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="geo-shape-widget">
      <Text style={styles.label}>
        {vertices.length > 0
          ? `${vertices.length} vertices`
          : 'Draw shape'}
      </Text>
      <Pressable
        onPress={openMap}
        style={styles.button}
        testID="geo-shape-open-map-button"
      >
        <Text style={styles.buttonText}>Draw Shape</Text>
      </Pressable>

      <AppModal
        visible={modalVisible}
        onRequestClose={handleCancel}
        testID="geo-shape-modal"
        fullScreen
        animationType="slide"
      >
        <View style={styles.modalContent}>
          <View style={styles.mapContainer}>
            <MapLibre.Map
              style={styles.map}
              mapStyle={OSM_STYLE}
              onPress={handleMapPress}
              testID="geo-shape-map"
            >
              <MapLibre.Camera initialViewState={{ center, zoom: 15 }} />

              <MapLibre.RasterSource
                id="esri-satellite"
                tiles={ESRI_TILES}
                tileSize={256}
                maxzoom={ESRI_MAX_ZOOM}
              >
                <MapLibre.Layer id="esri-satellite-layer" type="raster" layerIndex={1} />
              </MapLibre.RasterSource>

              {shapeGeoJSON && (
                <MapLibre.GeoJSONSource id="shape" data={shapeGeoJSON}>
                  <MapLibre.Layer
                    id="shape-fill-layer"
                    type="fill"
                    layerIndex={2}
                    paint={{ 'fill-color': 'rgba(0,150,136,0.3)', 'fill-outline-color': '#009688' }}
                  />
                  <MapLibre.Layer
                    id="shape-line-layer"
                    type="line"
                    layerIndex={3}
                    paint={{ 'line-color': '#009688', 'line-width': 3 }}
                  />
                </MapLibre.GeoJSONSource>
              )}

              {vertices.map((v, i) => (
                <MapLibre.Marker key={i} id={`shape-pt-${i}`} lngLat={[v.lon, v.lat]}>
                  <View style={styles.pin} testID={`geo-shape-pin-${i}`} />
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

            {!currentPoint && (
              <View style={styles.statusOverlay} pointerEvents="none">
                <ActivityIndicator size="small" />
                <Text style={styles.statusText}>Adquiriendo señal GPS…</Text>
              </View>
            )}
          </View>

          <SafeAreaBottom style={styles.buttonRow}>
            {vertices.length > 0 && (
              <Pressable
                onPress={handleUndo}
                style={[styles.button, styles.undoButton]}
                testID="geo-shape-undo-button"
              >
                <Text style={styles.buttonText}>Undo</Text>
              </Pressable>
            )}
            <Pressable
              onPress={canAccept ? handleAccept : undefined}
              style={[styles.button, styles.acceptButton, !canAccept && styles.buttonDisabled]}
              disabled={!canAccept}
              testID="geo-shape-accept-button"
            >
              <Text style={styles.buttonText}>Accept</Text>
            </Pressable>
            <Pressable
              onPress={handleCancel}
              style={[styles.button, styles.cancelButton]}
              testID="geo-shape-cancel-button"
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </SafeAreaBottom>
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
