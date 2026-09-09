/**
 * VideoWidget — binary video capture/playback (REQ-V01..V04).
 *
 * Capture opens the system's native camera app via expo-image-picker's
 * `launchCameraAsync({ mediaTypes: ['videos'], ... })` (optional peer dep) —
 * same module/pattern ImageWidget uses for photos, just with `mediaTypes`
 * pointed at video. There is no in-app camera preview to keep mounted: the
 * native camera UI owns its own record/stop/cancel controls and the call
 * resolves once the user is done.
 *
 * Permission gating stays on expo-camera (also optional peer dep) because
 * expo-image-picker exposes camera permission functions but no microphone
 * ones — recording video needs both camera AND mic permission, so
 * expo-camera remains the single source for both gates even though it no
 * longer performs the capture itself. Falls back to UnsupportedWidget when
 * expo-camera is absent at runtime.
 *
 * Playback uses expo-video's `useVideoPlayer` hook + `<VideoView>` component
 * (optional peer dep; expo-av dropped per the SDK-56 migration). The hook is
 * called unconditionally through the lazily-`require`d module reference
 * (`av?.useVideoPlayer?.(...)`) — see AudioWidget's equivalent comment for
 * why this is hooks-rules-safe with the optional-peer-dep firewall.
 *
 * Restyle (design decision 7, per-widget mapping table, PR12): chrome moves
 * onto `MediaCaptureCard`. The video player (while playing back) is neither
 * of MediaCaptureCard's icon/title/hint slots — following BarcodeWidget's
 * precedent (PR11), it renders through `state:'captured'` + `preview` as a
 * generic "custom content" region. It keeps the fixed 240x180 size,
 * upgraded to `radius.md` per the mapping table (was `radius.sm`).
 */
import { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { MediaCaptureCard } from './primitives/MediaCaptureCard';
import { VideoIcon } from './primitives/Icon';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import {
  usePermissionGate,
  isPermissionBlockingState,
  type PermissionGateStatus,
} from './primitives/usePermissionGate';
import { PermissionNotice } from './primitives/PermissionNotice';

let _CameraModule: any | null = null;
let _cameraLoaded: boolean | undefined;

function getCameraModule(): any | null {
  if (_cameraLoaded === undefined) {
    try {
      _CameraModule = require('expo-camera');
      _cameraLoaded = true;
    } catch {
      _cameraLoaded = false;
    }
  }
  return _CameraModule;
}

let _ImagePickerModule: any | null = null;
let _pickerLoaded: boolean | undefined;

function getImagePicker(): any | null {
  if (_pickerLoaded === undefined) {
    try {
      _ImagePickerModule = require('expo-image-picker');
      _pickerLoaded = true;
    } catch {
      _pickerLoaded = false;
    }
  }
  return _ImagePickerModule;
}

let _AvModule: any | null = null;
let _avLoaded: boolean | undefined;

function getAvModule(): any | null {
  if (_avLoaded === undefined) {
    try {
      _AvModule = require('expo-video');
      _avLoaded = true;
    } catch {
      _avLoaded = false;
    }
  }
  return _AvModule;
}

export interface VideoWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    preview: {
      width: 240,
      height: 180,
      borderRadius: t.radius.md,
      backgroundColor: t.color.roles.surfaceVariant,
    },
  });
}

function getCameraNoticeCopy(status: PermissionGateStatus) {
  switch (status) {
    case 'rationale':
      return {
        title: 'Usar la cámara',
        body: 'Necesitamos la cámara para grabar el video.',
      };
    case 'blocked':
      return {
        title: 'Permiso de cámara bloqueado',
        body: 'Actívalo en los ajustes del sistema para grabar el video.',
      };
    case 'denied':
    default:
      return {
        title: 'Sin permiso de cámara',
        body: 'Permite el acceso para grabar el video.',
      };
  }
}

function getMicNoticeCopy(status: PermissionGateStatus) {
  switch (status) {
    case 'rationale':
      return {
        title: 'Usar el micrófono',
        body: 'Necesitamos el micrófono para grabar el audio del video.',
      };
    case 'blocked':
      return {
        title: 'Permiso de micrófono bloqueado',
        body: 'Actívalo en los ajustes del sistema para grabar audio.',
      };
    case 'denied':
    default:
      return {
        title: 'Sin permiso de micrófono',
        body: 'Permite el acceso para grabar audio.',
      };
  }
}

export function VideoWidget({ nodeRef, store, appearance: _appearance }: VideoWidgetProps) {
  // Theming (D2): useThemedStyles MUST stay the first statement, before the
  // peer-dependency gating early return below.
  const styles = useThemedStyles(createStyles);
  const camera = getCameraModule();
  const picker = getImagePicker();
  const av = getAvModule();
  const resolved = store.adapter.resolveValue(nodeRef);
  const storedUri: string | null =
    typeof resolved === 'string' && resolved.length > 0 ? resolved : null;
  const nodeState = store.adapter.getNodeState(nodeRef);
  const readonly = nodeState.readonly;

  const [isPlaying, setIsPlaying] = useState(false);
  // Hooks-rules-safe unconditional call through the lazily-`require`d
  // module reference — `av`'s truthiness never varies across this
  // component instance's lifetime (see AudioWidget's equivalent comment).
  const player = av?.useVideoPlayer?.(storedUri ? { uri: storedUri } : null);

  const cameraAdapter = useMemo(
    () => ({
      get: () => camera?.getCameraPermissionsAsync?.(),
      request: () => camera?.requestCameraPermissionsAsync?.(),
    }),
    [camera]
  );
  const cameraGate = usePermissionGate(cameraAdapter);

  const micAdapter = useMemo(
    () => ({
      get: () => camera?.getMicrophonePermissionsAsync?.(),
      request: () => camera?.requestMicrophonePermissionsAsync?.(),
    }),
    [camera]
  );
  const micGate = usePermissionGate(micAdapter);

  // Decision 8: camera checked first, then microphone; the notice reflects
  // the first non-granted permission. Recording is blocked until BOTH are
  // granted (maintainer decision — no silent audio-less fallback).
  const blockingGate = isPermissionBlockingState(cameraGate.status)
    ? cameraGate
    : isPermissionBlockingState(micGate.status)
      ? micGate
      : null;
  const blockingGateKind: 'camera' | 'mic' | null = isPermissionBlockingState(cameraGate.status)
    ? 'camera'
    : isPermissionBlockingState(micGate.status)
      ? 'mic'
      : null;

  const handleRecord = useCallback(async () => {
    if (!camera || !picker || readonly) return;
    const cameraGranted = await cameraGate.ensure();
    if (!cameraGranted) return;
    const micGranted = await micGate.ensure();
    if (!micGranted) return;
    const result = await picker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets?.[0]) return;
    store.answerQuestion(nodeRef, result.assets[0].uri);
  }, [camera, picker, readonly, cameraGate, micGate, nodeRef, store]);

  const handlePlay = useCallback(() => {
    if (!av || !storedUri || !player) return;
    try {
      player.play();
    } catch {
      // best-effort; playback failure has no dedicated UI state
    }
    setIsPlaying(true);
  }, [av, storedUri, player]);

  const handleClosePlayer = useCallback(() => {
    try {
      player?.pause?.();
    } catch {
      // best-effort
    }
    setIsPlaying(false);
  }, [player]);

  if (!camera) {
    return <UnsupportedWidget dataType="binary" />;
  }

  const VideoView = av?.VideoView;

  if (!readonly && blockingGate && blockingGateKind) {
    const copy =
      blockingGateKind === 'camera'
        ? getCameraNoticeCopy(blockingGate.status)
        : getMicNoticeCopy(blockingGate.status);
    return (
      <MediaCaptureCard
        testID="video-widget"
        state="captured"
        icon={<VideoIcon />}
        title="No video recorded"
        actions={[]}
        preview={
          <PermissionNotice
            title={copy.title}
            body={copy.body}
            primaryLabel={blockingGate.status === 'blocked' ? 'Abrir ajustes' : 'Permitir'}
            onPrimary={
              blockingGate.status === 'blocked'
                ? blockingGate.openSettings
                : blockingGate.requestPermission
            }
            dismissLabel={blockingGate.status === 'blocked' ? undefined : 'Ahora no'}
            onDismiss={
              blockingGate.status === 'blocked' ? undefined : blockingGate.dismissRationale
            }
          />
        }
      />
    );
  }

  if (isPlaying && storedUri && VideoView && player) {
    return (
      <MediaCaptureCard
        testID="video-widget"
        state="captured"
        icon={<VideoIcon />}
        title="No video recorded"
        disabled={readonly}
        preview={
          <View style={styles.preview}>
            <VideoView
              player={player}
              style={styles.preview}
              contentFit="contain"
              testID="video-player"
            />
          </View>
        }
        actions={[
          { label: 'Close', onPress: handleClosePlayer, tone: 'error', testID: 'video-close-player-button' },
        ]}
      />
    );
  }

  if (storedUri) {
    return (
      <MediaCaptureCard
        testID="video-widget"
        state="captured"
        icon={<VideoIcon />}
        title="No video recorded"
        disabled={readonly}
        preview={<VideoIcon />}
        actions={[
          { label: 'Play', onPress: handlePlay, testID: 'video-play-button' },
          { label: 'Record', onPress: handleRecord, testID: 'video-record-button' },
        ]}
      />
    );
  }

  return (
    <MediaCaptureCard
      testID="video-widget"
      state="empty"
      icon={<VideoIcon />}
      title="No video recorded"
      disabled={readonly}
      actions={[{ label: 'Record', onPress: handleRecord, testID: 'video-record-button' }]}
    />
  );
}
