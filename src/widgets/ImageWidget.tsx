/**
 * ImageWidget — binary image capture/pick (REQ-M03..M06).
 *
 * Gated on expo-image-picker (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 *
 * Variants (ADR-3 binary/upload — appearance token resolved via
 * resolveVariant('binary', 'upload', appearance), same bucket every upload
 * widget shares; only Image acts on these tokens):
 *   selfie | front-camera → camera opens with the front lens
 *                            (ImagePicker.CameraType.front)
 *   new                   → gallery ("Pick from Library") button hidden;
 *                            camera capture only
 *   new-front             → both of the above combined
 *   annotate              → after capture, an SVG+PanResponder drawing
 *                            overlay (same pattern as SignatureWidget) sits
 *                            on top of the photo so the respondent can mark
 *                            it up. The stroke overlay is NOT rasterized
 *                            into the photo file — this repo has no RN-core
 *                            way to composite SVG onto a raster image
 *                            (would need react-native-view-shot or a native
 *                            canvas), so annotations persist only as a
 *                            visual overlay in this widget's own preview,
 *                            not baked into the stored image URI.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Text,
  Image,
  View,
  PanResponder,
  StyleSheet,
  type GestureResponderEvent,
  type PanResponderGestureState,
  type ImageSourcePropType,
} from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { resolveVariant } from './engine/appearance';
import { useThemedStyles, useTheme, type Theme } from '../theme/ThemeContext';
import { MediaCaptureCard } from './primitives/MediaCaptureCard';
import { PressableButton } from './primitives/PressableButton';
import {
  usePermissionGate,
  isPermissionBlockingState,
  type PermissionGateStatus,
} from './primitives/usePermissionGate';
import { PermissionNotice } from './primitives/PermissionNotice';

let _SvgModule: any | null = null;
let _svgLoaded: boolean | undefined;

function getSvg(): any | null {
  if (_svgLoaded === undefined) {
    try {
      _SvgModule = require('react-native-svg');
      _svgLoaded = true;
    } catch {
      _svgLoaded = false;
    }
  }
  return _SvgModule;
}

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
    annotateWrapper: {
      width: 120,
      height: 120,
    },
    annotateOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    annotateButtonRow: {
      flexDirection: 'row',
      gap: t.spacing.sm,
      marginTop: t.spacing.xs,
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

export function ImageWidget({ nodeRef, store, appearance }: ImageWidgetProps) {
  // Theming (D2): useThemedStyles MUST stay the first statement, before the
  // peer-dependency gating early return below, to preserve hook-order
  // stability (select-widgets-hook-order invariant).
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const picker = getImagePicker();
  const svg = getSvg();
  const resolved = store.adapter.resolveValue(nodeRef);
  const uri: string | null =
    typeof resolved === 'string' && resolved.length > 0 ? resolved : null;
  const nodeState = store.adapter.getNodeState(nodeRef);
  const readonly = nodeState.readonly;

  const variant = resolveVariant('binary', 'upload', appearance);
  const isFrontCamera = variant === 'selfie' || variant === 'front-camera' || variant === 'new-front';
  const isCameraOnly = variant === 'new' || variant === 'new-front';
  const isAnnotate = variant === 'annotate';

  const [thumbnailUri, setThumbnailUri] = useState<string | null>(uri);

  // Annotate overlay strokes (SVG + PanResponder — SignatureWidget's
  // pattern). Declared unconditionally so hook order/count stays stable
  // across variants (Unconditional Hook Ordering, same invariant as the
  // select widgets).
  const [annotateStrokes, setAnnotateStrokes] = useState<string[]>([]);
  const annotateCurrentPath = useRef<string[]>([]);
  const annotatePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isAnnotate && !readonly,
      onMoveShouldSetPanResponder: () => isAnnotate && !readonly,
      onPanResponderGrant: () => {
        annotateCurrentPath.current = [];
        setAnnotateStrokes((prev) => [...prev, '']);
      },
      onPanResponderMove: (
        _evt: GestureResponderEvent,
        gs: PanResponderGestureState,
      ) => {
        const cmd =
          annotateCurrentPath.current.length === 0
            ? `M${gs.moveX},${gs.moveY}`
            : `L${gs.moveX},${gs.moveY}`;
        annotateCurrentPath.current.push(cmd);
        setAnnotateStrokes((prev) => {
          const next = [...prev];
          next[next.length - 1] = annotateCurrentPath.current.join(' ');
          return next;
        });
      },
      onPanResponderRelease: () => {
        annotateCurrentPath.current = [];
      },
    }),
  ).current;

  const handleClearAnnotations = useCallback(() => {
    setAnnotateStrokes([]);
  }, []);

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
      ...(isFrontCamera ? { cameraType: picker.CameraType?.front } : {}),
    });
    setAnnotateStrokes([]);
    handleResult(result);
  }, [picker, readonly, cameraGate, handleResult, isFrontCamera]);

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
  const libraryBlocking = !isCameraOnly && isPermissionBlockingState(libraryGate.status);

  const baseActions = [
    { label: 'Take Photo', onPress: handleCamera, testID: 'image-camera-button' },
    ...(isCameraOnly
      ? []
      : [{ label: 'Pick from Library', onPress: handleLibrary, testID: 'image-library-button' }]),
  ];

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
        actions={baseActions}
      />
    );
  }

  const annotateOverlay = isAnnotate && svg && (
    <View
      testID="image-annotate-overlay"
      style={styles.annotateOverlay}
      {...annotatePanResponder.panHandlers}
    >
      <svg.Svg width="100%" height="100%" viewBox="0 0 120 120">
        {annotateStrokes.map((path, i) => (
          <svg.Path
            key={i}
            d={path}
            stroke={theme.color.roles.error}
            strokeWidth={2}
            fill="none"
            testID={`image-annotate-stroke-${i}`}
          />
        ))}
      </svg.Svg>
    </View>
  );

  return (
    <MediaCaptureCard
      testID="image-widget"
      state={source ? 'captured' : 'empty'}
      icon={<Text>📷</Text>}
      title="No photo yet"
      disabled={readonly}
      preview={
        source && (
          <>
            <View style={styles.annotateWrapper}>
              <Image
                source={source}
                style={styles.thumbnail}
                testID="image-thumbnail"
                accessibilityLabel="Selected image"
              />
              {annotateOverlay}
            </View>
            {isAnnotate && svg && (
              <View style={styles.annotateButtonRow}>
                <PressableButton
                  label="Clear"
                  onPress={handleClearAnnotations}
                  variant="text"
                  testID="image-annotate-clear-button"
                  theme={theme}
                />
              </View>
            )}
          </>
        )
      }
      actions={baseActions}
    />
  );
}

