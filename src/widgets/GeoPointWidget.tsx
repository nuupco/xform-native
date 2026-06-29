/**
 * GeoPointWidget — geopoint data capture via map (REQ-GEO03..GEO08).
 *
 * Gated on @nuup/xform-native-geo (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 *
 * Value shape: { lat: number, lon: number, alt: number, acc: number } | null
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

export interface GeoPointWidgetProps {
  ref: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function GeoPointWidget({ ref, store, appearance: _appearance }: GeoPointWidgetProps) {
  const geo = getGeoModule();
  const resolved = store.adapter.resolveValue(ref);
  const nodeState = store.adapter.getNodeState(ref);
  const readonly = nodeState.readonly;

  const [modalVisible, setModalVisible] = useState(false);
  const [coordinate, setCoordinate] = useState<GeoPoint | null>(
    isGeoPoint(resolved) ? resolved : null
  );

  // When resolved value changes externally, sync local state
  useEffect(() => {
    if (isGeoPoint(resolved)) {
      setCoordinate(resolved);
    }
  }, [resolved]);

  const openMap = useCallback(() => {
    setModalVisible(true);
  }, []);

  const closeMap = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleGpsCapture = useCallback(async () => {
    if (!geo || readonly) return;
    try {
      const { status } = await geo.Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await geo.Location.getCurrentPositionAsync({});
      if (location?.coords) {
        setCoordinate({
          lat: location.coords.latitude,
          lon: location.coords.longitude,
          alt: location.coords.altitude ?? 0,
          acc: location.coords.accuracy ?? 0,
        });
      }
    } catch {
      // GPS capture is best-effort
    }
  }, [geo, readonly]);

  const handleMapPress = useCallback(
    (feature: any) => {
      if (readonly || !feature?.geometry?.coordinates) return;
      const [lon, lat] = feature.geometry.coordinates as [number, number];
      setCoordinate({
        lat,
        lon,
        alt: 0,
        acc: 0,
      });
    },
    [readonly]
  );

  const handleAccept = useCallback(() => {
    if (coordinate) {
      store.answerQuestion(ref, coordinate);
    }
    closeMap();
  }, [coordinate, ref, store, closeMap]);

  const handleCancel = useCallback(() => {
    // Revert to the stored value on cancel
    if (isGeoPoint(resolved)) {
      setCoordinate(resolved);
    } else {
      setCoordinate(null);
    }
    closeMap();
  }, [resolved, closeMap]);

  // Auto-capture GPS when modal opens (only in edit mode)
  useEffect(() => {
    if (modalVisible && !readonly && !coordinate) {
      handleGpsCapture();
    }
  }, [modalVisible, readonly, coordinate, handleGpsCapture]);

  if (!geo) {
    return <UnsupportedWidget dataType="geopoint" />;
  }

  const { MapLibre } = geo;

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
      >
        <View style={styles.modalContent}>
          <View style={styles.mapContainer}>
            <MapLibre.MapView
              style={styles.map}
              onPress={handleMapPress}
              testID="geo-maplibre-map"
            >
              <MapLibre.Camera
                centerCoordinate={
                  coordinate
                    ? [coordinate.lon, coordinate.lat]
                    : [-99.1332, 19.4326]
                }
                zoomLevel={15}
              />
              {coordinate && (
                <MapLibre.MarkerView
                  coordinate={[coordinate.lon, coordinate.lat]}
                >
                  <View style={styles.pin} testID="geo-map-pin" />
                </MapLibre.MarkerView>
              )}
            </MapLibre.MapView>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={handleAccept}
              style={[styles.button, styles.acceptButton]}
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
