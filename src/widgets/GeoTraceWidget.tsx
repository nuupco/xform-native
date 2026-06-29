/**
 * GeoTraceWidget — polyline drawing via map modal (REQ-GEO30..GEO35).
 *
 * Gated on @nuup/xform-native-geo (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 *
 * Value shape: ODK semicolon-separated geopoint string
 *   "lat lon alt acc; lat lon alt acc; ..."
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

export interface GeoTraceWidgetProps {
  ref: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function GeoTraceWidget({ ref, store, appearance: _appearance }: GeoTraceWidgetProps) {
  const geo = getGeoModule();
  const resolved = store.adapter.resolveValue(ref);
  const nodeState = store.adapter.getNodeState(ref);
  const readonly = nodeState.readonly;

  const [modalVisible, setModalVisible] = useState(false);
  const [vertices, setVertices] = useState<Vertex[]>(parseVertices(resolved));

  // When resolved value changes externally, sync local state
  useEffect(() => {
    setVertices(parseVertices(resolved));
  }, [resolved]);

  const openMap = useCallback(() => {
    setModalVisible(true);
  }, []);

  const closeMap = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleMapPress = useCallback(
    (feature: any) => {
      if (readonly || !feature?.geometry?.coordinates) return;
      const [lon, lat] = feature.geometry.coordinates as [number, number];
      setVertices((prev) => [...prev, { lat, lon, alt: 0, acc: 0 }]);
    },
    [readonly]
  );

  const handleAccept = useCallback(() => {
    if (vertices.length > 0) {
      store.answerQuestion(ref, serializeVertices(vertices));
    }
    closeMap();
  }, [vertices, ref, store, closeMap]);

  const handleCancel = useCallback(() => {
    setVertices(parseVertices(resolved));
    closeMap();
  }, [resolved, closeMap]);

  if (!geo) {
    return <UnsupportedWidget dataType="geotrace" />;
  }

  const { MapLibre } = geo;

  const lineGeoJSON =
    vertices.length > 0
      ? {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: vertices.map((v) => [v.lon, v.lat]),
          },
        }
      : null;

  const center =
    vertices.length > 0 && vertices[0] != null
      ? [vertices[0].lon, vertices[0].lat]
      : [-99.1332, 19.4326];

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
        style={styles.button}
        testID="geo-trace-open-map-button"
      >
        <Text style={styles.buttonText}>Draw Trace</Text>
      </Pressable>

      <AppModal
        visible={modalVisible}
        onRequestClose={handleCancel}
        testID="geo-trace-modal"
      >
        <View style={styles.modalContent}>
          <View style={styles.mapContainer}>
            <MapLibre.MapView
              style={styles.map}
              onPress={handleMapPress}
              testID="geo-trace-map"
            >
              <MapLibre.Camera
                centerCoordinate={center}
                zoomLevel={15}
              />
              {lineGeoJSON && (
                <MapLibre.ShapeSource id="trace" shape={lineGeoJSON}>
                  <MapLibre.LineLayer
                    id="line"
                    style={{ lineColor: '#009688', lineWidth: 3 }}
                  />
                </MapLibre.ShapeSource>
              )}
              {vertices.map((v, i) => (
                <MapLibre.MarkerView
                  key={i}
                  coordinate={[v.lon, v.lat]}
                >
                  <View style={styles.pin} testID={`geo-trace-pin-${i}`} />
                </MapLibre.MarkerView>
              ))}
            </MapLibre.MapView>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={handleAccept}
              style={[styles.button, styles.acceptButton]}
              testID="geo-trace-accept-button"
            >
              <Text style={styles.buttonText}>Accept</Text>
            </Pressable>
            <Pressable
              onPress={handleCancel}
              style={[styles.button, styles.cancelButton]}
              testID="geo-trace-cancel-button"
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
  },
  cancelButton: {
    backgroundColor: tokens.color.error,
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
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
});
