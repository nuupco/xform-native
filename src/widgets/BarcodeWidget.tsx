/**
 * BarcodeWidget — camera barcode scan (REQ-B01..B05).
 *
 * Gated on expo-camera (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 *
 * Value shape: string (barcode content)
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
import { tokens } from '../tokens/tokens';

let _cameraModule: any | null = null;
let _cameraLoaded: boolean | undefined;

function getCameraModule(): any | null {
  if (_cameraLoaded === undefined) {
    try {
      _cameraModule = require('expo-camera');
      _cameraLoaded = true;
    } catch {
      _cameraLoaded = false;
    }
  }
  return _cameraModule;
}

export interface BarcodeWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function BarcodeWidget({ nodeRef, store, appearance: _appearance }: BarcodeWidgetProps) {
  const camera = getCameraModule();
  const resolved = store.adapter.resolveValue(nodeRef);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const readonly = nodeState.readonly;

  const [scanning, setScanning] = useState(false);
  const [value, setValue] = useState<string>(
    typeof resolved === 'string' ? resolved : ''
  );

  // When resolved value changes externally, sync local state
  useEffect(() => {
    if (typeof resolved === 'string') {
      setValue(resolved);
    } else {
      setValue('');
    }
  }, [resolved]);

  const handleScanPress = useCallback(() => {
    if (readonly || !camera) return;
    setScanning(true);
  }, [camera, readonly]);

  const handleBarcodeScanned = useCallback(
    (result: { data: string }) => {
      setValue(result.data);
      store.answerQuestion(nodeRef, result.data);
      setScanning(false);
    },
    [nodeRef, store]
  );

  const handleRescan = useCallback(() => {
    if (readonly || !camera) return;
    setValue('');
    setScanning(true);
  }, [camera, readonly]);

  if (!camera) {
    return <UnsupportedWidget dataType="barcode" />;
  }

  const { CameraView } = camera;

  if (readonly) {
    return (
      <View style={styles.container} testID="barcode-readonly">
        <Text style={styles.label}>{value || 'No barcode scanned'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="barcode-widget">
      {scanning ? (
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleBarcodeScanned}
            testID="barcode-camera"
          />
        </View>
      ) : (
        <>
          <Text style={styles.label}>
            {value || 'No barcode scanned'}
          </Text>
          {value ? (
            <Pressable
              onPress={handleRescan}
              style={styles.button}
              testID="barcode-rescan-button"
            >
              <Text style={styles.buttonText}>Re-scan</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleScanPress}
              style={styles.button}
              testID="barcode-scan-button"
            >
              <Text style={styles.buttonText}>Scan Barcode</Text>
            </Pressable>
          )}
        </>
      )}
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
  scannerContainer: {
    gap: tokens.spacing.sm,
  },
  camera: {
    width: 240,
    height: 180,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.surface,
  },
});
