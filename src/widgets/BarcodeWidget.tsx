/**
 * BarcodeWidget — camera barcode scan (REQ-B01..B05).
 *
 * Gated on expo-camera (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 *
 * Value shape: string (barcode content)
 *
 * Deviation note (PR11): `MediaCaptureCard`'s `state:'captured'` slot is the
 * only one that renders arbitrary child content (via `preview`); `'active'`
 * only renders icon/title/hint. This widget needs an arbitrary custom
 * region for two distinct things that are not literally "captured" media —
 * the live `CameraView` + reticle overlay while scanning, and the scanned
 * value readout once a value exists. Both are rendered through `state:
 * 'captured'` + `preview`, reusing that slot as a generic "custom content"
 * region rather than expanding MediaCaptureCard's API. `state:'empty'` is
 * used only for the true empty case (no value, not scanning).
 */
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { MediaCaptureCard } from './primitives/MediaCaptureCard';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import {
  usePermissionGate,
  isPermissionBlockingState,
  type PermissionGateStatus,
} from './primitives/usePermissionGate';
import { PermissionNotice } from './primitives/PermissionNotice';

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

function createStyles(t: Theme) {
  return StyleSheet.create({
    readonlyContainer: { gap: t.spacing.sm },
    valueReadout: { ...t.typography.mono, color: t.color.roles.onSurface },
    cameraStack: { position: 'relative' },
    camera: {
      width: 240,
      height: 180,
      borderRadius: t.radius.sm,
      backgroundColor: t.color.roles.surfaceVariant,
    },
    reticleOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reticleBox: {
      width: 200,
      height: 100,
      borderWidth: 2,
      borderColor: t.color.roles.primary,
      borderRadius: t.radius.sm,
    },
  });
}

function getCameraNoticeCopy(status: PermissionGateStatus) {
  switch (status) {
    case 'rationale':
      return {
        title: 'Usar la cámara',
        body: 'Necesitamos la cámara para escanear el código.',
      };
    case 'blocked':
      return {
        title: 'Permiso de cámara bloqueado',
        body: 'Actívalo en los ajustes del sistema para escanear códigos.',
      };
    case 'denied':
    default:
      return {
        title: 'Sin permiso de cámara',
        body: 'Permite el acceso para escanear códigos.',
      };
  }
}

export function BarcodeWidget({ nodeRef, store, appearance: _appearance }: BarcodeWidgetProps) {
  // Theming (D2): useThemedStyles MUST stay the first statement, before the
  // peer-dependency gating early return below.
  const styles = useThemedStyles(createStyles);
  const camera = getCameraModule();
  const resolved = store.adapter.resolveValue(nodeRef);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const readonly = nodeState.readonly;

  const [scanning, setScanning] = useState(false);
  const [value, setValue] = useState<string>(
    typeof resolved === 'string' ? resolved : ''
  );

  const cameraAdapter = useMemo(
    () => ({
      get: () => camera?.getCameraPermissionsAsync?.(),
      request: () => camera?.requestCameraPermissionsAsync?.(),
    }),
    [camera]
  );
  const gate = usePermissionGate(cameraAdapter);
  const pendingIntentRef = useRef<'scan' | 'rescan' | null>(null);

  // When resolved value changes externally, sync local state
  useEffect(() => {
    if (typeof resolved === 'string') {
      setValue(resolved);
    } else {
      setValue('');
    }
  }, [resolved]);

  // If the user retries permission (rationale/denied) from the notice and it
  // is granted, resume the scan they originally intended instead of leaving
  // them back at the empty/captured card.
  useEffect(() => {
    if (gate.status !== 'granted' || !pendingIntentRef.current) return;
    if (pendingIntentRef.current === 'rescan') {
      setValue('');
    }
    pendingIntentRef.current = null;
    setScanning(true);
  }, [gate.status]);

  const handleScanPress = useCallback(async () => {
    if (readonly || !camera) return;
    if (!(await gate.ensure())) {
      pendingIntentRef.current = 'scan';
      return;
    }
    setScanning(true);
  }, [camera, readonly, gate]);

  const handleBarcodeScanned = useCallback(
    (result: { data: string }) => {
      setValue(result.data);
      store.answerQuestion(nodeRef, result.data);
      setScanning(false);
    },
    [nodeRef, store]
  );

  const handleRescan = useCallback(async () => {
    if (readonly || !camera) return;
    if (!(await gate.ensure())) {
      pendingIntentRef.current = 'rescan';
      return;
    }
    setValue('');
    setScanning(true);
  }, [camera, readonly, gate]);

  if (!camera) {
    return <UnsupportedWidget dataType="barcode" />;
  }

  const { CameraView } = camera;

  if (!readonly && !scanning && isPermissionBlockingState(gate.status)) {
    const copy = getCameraNoticeCopy(gate.status);
    return (
      <MediaCaptureCard
        testID="barcode-widget"
        state="captured"
        icon={<Text>📷</Text>}
        title="No barcode scanned"
        actions={[]}
        preview={
          <PermissionNotice
            title={copy.title}
            body={copy.body}
            primaryLabel={gate.status === 'blocked' ? 'Abrir ajustes' : 'Permitir'}
            onPrimary={gate.status === 'blocked' ? gate.openSettings : gate.requestPermission}
            dismissLabel={gate.status === 'blocked' ? undefined : 'Ahora no'}
            onDismiss={gate.status === 'blocked' ? undefined : gate.dismissRationale}
          />
        }
      />
    );
  }

  if (readonly) {
    return (
      <View style={styles.readonlyContainer} testID="barcode-readonly">
        <Text style={styles.valueReadout}>{value || 'No barcode scanned'}</Text>
      </View>
    );
  }

  if (scanning) {
    return (
      <MediaCaptureCard
        testID="barcode-widget"
        state="captured"
        icon={<Text>📷</Text>}
        title="No barcode scanned"
        actions={[]}
        preview={
          <View style={styles.cameraStack}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={handleBarcodeScanned}
              testID="barcode-camera"
            />
            <View style={styles.reticleOverlay} pointerEvents="none">
              <View style={styles.reticleBox} />
            </View>
          </View>
        }
      />
    );
  }

  return (
    <MediaCaptureCard
      testID="barcode-widget"
      state={value ? 'captured' : 'empty'}
      icon={<Text>📷</Text>}
      title="No barcode scanned"
      preview={<Text style={styles.valueReadout}>{value}</Text>}
      actions={
        value
          ? [{ label: 'Re-scan', onPress: handleRescan, testID: 'barcode-rescan-button' }]
          : [{ label: 'Scan Barcode', onPress: handleScanPress, testID: 'barcode-scan-button' }]
      }
    />
  );
}
