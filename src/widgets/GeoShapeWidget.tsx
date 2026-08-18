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
import { useGeoGps } from './primitives/useGeoGps';

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
      store.answerQuestion(nodeRef, serializeVertices(closeRing(vertices)));
    }
    closeMap();
  }, [vertices, nodeRef, store, closeMap]);

  const handleCancel = useCallback(() => {
    setVertices(parseVertices(resolved));
    closeMap();
  }, [resolved, closeMap]);

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
        style={styles.openButton}
        testID="geo-shape-open-map-button"
      >
        <Text style={styles.openButtonText}>Draw Shape</Text>
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

              {shapeGeoJSON && (
                <MapLibre.GeoJSONSource id="shape" data={shapeGeoJSON}>
                  <MapLibre.Layer
                    id="shape-fill-layer"
                    type="fill"
                    layerIndex={3}
                    paint={{ 'fill-color': 'rgba(0,150,136,0.3)', 'fill-outline-color': '#009688' }}
                  />
                  <MapLibre.Layer
                    id="shape-line-layer"
                    type="line"
                    layerIndex={4}
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

            <Pressable
              onPress={handleRecenter}
              style={styles.recenterButton}
              testID="geo-shape-recenter-button"
              disabled={!currentPoint}
            >
              <Text style={styles.buttonText}>⊙</Text>
            </Pressable>

            <Pressable
              onPress={handlePrewarm}
              style={styles.prewarmButton}
              testID="geo-shape-prewarm-button"
              disabled={prewarmStatus === 'running'}
            >
              <Text style={styles.buttonText}>⤓</Text>
            </Pressable>

            <View style={styles.statusOverlay} pointerEvents="none">
              {(gps.status === 'requesting' || gps.status === 'acquiring') && (
                <ActivityIndicator size="small" />
              )}
              <Text style={styles.statusText}>
                {gps.status === 'denied'
                  ? 'Sin permiso de ubicación'
                  : gps.status === 'error'
                    ? 'No se pudo obtener la ubicación'
                    : gps.status === 'tracking' && currentPoint
                      ? `GPS ±${currentPoint.acc.toFixed(1)} m`
                      : 'Adquiriendo señal GPS…'}
              </Text>
            </View>

            {prewarmStatus !== 'idle' && (
              <View style={styles.prewarmStatusOverlay} pointerEvents="none">
                <Text style={styles.statusText} testID="geo-shape-prewarm-status">
                  {prewarmStatus === 'running'
                    ? 'Descargando mapas sin conexión…'
                    : prewarmStatus === 'cap'
                      ? 'Límite de almacenamiento alcanzado'
                      : prewarmStatus === 'error'
                        ? 'No se pudieron descargar los mapas'
                        : 'Mapas descargados para uso sin conexión'}
                </Text>
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
              onPress={currentPoint ? handleAddGpsPoint : undefined}
              style={[styles.button, styles.undoButton, !currentPoint && styles.buttonDisabled]}
              disabled={!currentPoint}
              testID="geo-shape-add-point-button"
            >
              <Text style={styles.buttonText}>Agregar punto</Text>
            </Pressable>
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
  // Confirmed on-device: the trigger used styles.button, whose
  // backgroundColor (tokens.color.surface, #F5F5F5) is the SAME color the
  // host app uses for its page background — zero contrast made the button
  // render as plain unstyled text. Use the primary color (matching the
  // modal's own Accept button) so it reads as an actionable button.
  openButton: {
    padding: tokens.spacing.sm,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.primary,
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: tokens.spacing.md,
  },
  openButtonText: {
    color: '#fff',
    fontSize: tokens.font.sm,
    fontWeight: '600',
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
  // Stacked directly under the recenter button, same size/style — functional
  // "download tiles for offline use" trigger, no visual redesign.
  prewarmButton: {
    position: 'absolute',
    top: tokens.spacing.sm + 44,
    right: tokens.spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prewarmStatusOverlay: {
    position: 'absolute',
    bottom: tokens.spacing.sm + 44,
    left: tokens.spacing.sm,
    right: tokens.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
});
