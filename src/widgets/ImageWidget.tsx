/**
 * ImageWidget — binary image capture/pick (REQ-M03..M06).
 *
 * Gated on expo-image-picker (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 */
import { useCallback, useMemo, useState } from 'react';
import { Text, Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import { MediaCaptureCard } from './primitives/MediaCaptureCard';
import {
  usePermissionGate,
  isPermissionBlockingState,
  type PermissionGateStatus,
} from './primitives/usePermissionGate';
import { PermissionNotice } from './primitives/PermissionNotice';

let _ImagePicker: any | null = null;
let _pickerLoaded: boolean | undefined;

function getImagePicker(): any | null {
  if (_pickerLoaded === undefined) {
    try {
      _ImagePicker = require('expo-image-picker');
      _pickerLoaded = true;
    } catch {
      _pickerLoaded = false;
    }
  }
  return _ImagePicker;
}

export interface ImageWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    thumbnail: {
      width: 120,
      height: 120,
      borderRadius: t.radius.sm,
      backgroundColor: t.color.roles.surfaceVariant,
    },
  });
}

function getCameraNoticeCopy(status: PermissionGateStatus) {
  switch (status) {
    case 'rationale':
      return {
        title: 'Usar la cámara',
        body: 'Necesitamos la cámara para tomar la foto de esta pregunta.',
      };
    case 'blocked':
      return {
        title: 'Permiso de cámara bloqueado',
        body: 'Actívalo en los ajustes del sistema para tomar fotos.',
      };
    case 'denied':
    default:
      return {
        title: 'Sin permiso de cámara',
        body: 'Permite el acceso para tomar una foto.',
      };
  }
}

function getLibraryNoticeCopy(status: PermissionGateStatus) {
  switch (status) {
    case 'rationale':
      return {
        title: 'Usar tus fotos',
        body: 'Necesitamos acceso a tu galería para elegir una foto.',
      };
    case 'blocked':
      return {
        title: 'Permiso de galería bloqueado',
        body: 'Actívalo en los ajustes del sistema para elegir fotos.',
      };
    case 'denied':
    default:
      return {
        title: 'Sin permiso de galería',
        body: 'Permite el acceso para elegir una foto.',
      };
  }
}

export function ImageWidget({ nodeRef, store, appearance: _appearance }: ImageWidgetProps) {
  // Theming (D2): useThemedStyles MUST stay the first statement, before the
  // peer-dependency gating early return below, to preserve hook-order
  // stability (select-widgets-hook-order invariant).
  const styles = useThemedStyles(createStyles);
  const picker = getImagePicker();
  const resolved = store.adapter.resolveValue(nodeRef);
  const uri: string | null =
    typeof resolved === 'string' && resolved.length > 0 ? resolved : null;
  const nodeState = store.adapter.getNodeState(nodeRef);
  const readonly = nodeState.readonly;

  const [thumbnailUri, setThumbnailUri] = useState<string | null>(uri);

  const cameraAdapter = useMemo(
    () => ({
      get: () => picker?.getCameraPermissionsAsync?.(),
      request: () => picker?.requestCameraPermissionsAsync?.(),
    }),
    [picker],
  );
  const libraryAdapter = useMemo(
    () => ({
      get: () => picker?.getMediaLibraryPermissionsAsync?.(),
      request: () => picker?.requestMediaLibraryPermissionsAsync?.(),
    }),
    [picker],
  );
  const cameraGate = usePermissionGate(cameraAdapter);
  const libraryGate = usePermissionGate(libraryAdapter);

  const source: ImageSourcePropType | undefined = thumbnailUri
    ? { uri: thumbnailUri }
    : undefined;

  const handleResult = useCallback(
    (result: { canceled: boolean; assets?: Array<{ uri: string }> }) => {
      if (result.canceled || !result.assets?.[0]) return;
      const newUri = result.assets[0].uri;
      setThumbnailUri(newUri);
      store.answerQuestion(nodeRef, newUri);
    },
    [nodeRef, store],
  );

  const handleCamera = useCallback(async () => {
    if (!picker || readonly) return;
    if (!(await cameraGate.ensure())) return;
    const result = await picker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    handleResult(result);
  }, [picker, readonly, cameraGate, handleResult]);

  const handleLibrary = useCallback(async () => {
    if (!picker || readonly) return;
    if (!(await libraryGate.ensure())) return;
    const result = await picker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    handleResult(result);
  }, [picker, readonly, libraryGate, handleResult]);

  if (!picker) {
    return <UnsupportedWidget dataType="binary" />;
  }

  // Each gate is independent (design/spec: camera blocked + library granted
  // must still allow "Pick from Library" to work). A notice only appears
  // once its own gate has been exercised via ensure() (i.e. the user tapped
  // that specific action) — never on mount.
  const cameraBlocking = isPermissionBlockingState(cameraGate.status);
  const libraryBlocking = isPermissionBlockingState(libraryGate.status);

  if (cameraBlocking || libraryBlocking) {
    const gate = cameraBlocking ? cameraGate : libraryGate;
    const copy = cameraBlocking
      ? getCameraNoticeCopy(cameraGate.status)
      : getLibraryNoticeCopy(libraryGate.status);
    return (
      <MediaCaptureCard
        testID="image-widget"
        state="captured"
        icon={<Text>📷</Text>}
        title="No photo yet"
        disabled={readonly}
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
        actions={[
          { label: 'Take Photo', onPress: handleCamera, testID: 'image-camera-button' },
          { label: 'Pick from Library', onPress: handleLibrary, testID: 'image-library-button' },
        ]}
      />
    );
  }

  return (
    <MediaCaptureCard
      testID="image-widget"
      state={source ? 'captured' : 'empty'}
      icon={<Text>📷</Text>}
      title="No photo yet"
      disabled={readonly}
      preview={
        source && (
          <Image
            source={source}
            style={styles.thumbnail}
            testID="image-thumbnail"
            accessibilityLabel="Selected image"
          />
        )
      }
      actions={[
        { label: 'Take Photo', onPress: handleCamera, testID: 'image-camera-button' },
        { label: 'Pick from Library', onPress: handleLibrary, testID: 'image-library-button' },
      ]}
    />
  );
}

