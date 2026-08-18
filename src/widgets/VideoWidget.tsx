/**
 * VideoWidget — binary video capture/playback (REQ-V01..V04).
 *
 * Gated on expo-camera (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 * Playback uses expo-av Video component (already an optional peer dep).
 *
 * Restyle (design decision 7, per-widget mapping table, PR12): chrome moves
 * onto `MediaCaptureCard`. The live camera preview (while recording) and the
 * video player (while playing back) are neither of MediaCaptureCard's
 * icon/title/hint slots — following BarcodeWidget's precedent (PR11), both
 * render through `state:'captured'` + `preview` as a generic "custom
 * content" region. Camera/video preview keep the fixed 240x180 size,
 * upgraded to `radius.md` per the mapping table (was `radius.sm`).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { MediaCaptureCard } from './primitives/MediaCaptureCard';
import { VideoIcon } from './primitives/Icon';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';

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

let _AvModule: any | null = null;
let _avLoaded: boolean | undefined;

function getAvModule(): any | null {
  if (_avLoaded === undefined) {
    try {
      _AvModule = require('expo-av');
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

export function VideoWidget({ nodeRef, store, appearance: _appearance }: VideoWidgetProps) {
  // Theming (D2): useThemedStyles MUST stay the first statement, before the
  // peer-dependency gating early return below.
  const styles = useThemedStyles(createStyles);
  const camera = getCameraModule();
  const av = getAvModule();
  const resolved = store.adapter.resolveValue(nodeRef);
  const storedUri: string | null =
    typeof resolved === 'string' && resolved.length > 0 ? resolved : null;
  const nodeState = store.adapter.getNodeState(nodeRef);
  const readonly = nodeState.readonly;

  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const cameraRef = useRef<any>(null);
  const activeCameraRef = useRef<any>(null);
  const isCancelledRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      isCancelledRef.current = true;
      if (activeCameraRef.current) {
        try {
          activeCameraRef.current.stopRecording();
        } catch {
          // Ignore if not currently recording
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!isRecording || !cameraRef.current) return;
    activeCameraRef.current = cameraRef.current;
    isCancelledRef.current = false;
    cameraRef.current
      .recordAsync({ maxDuration: 60 })
      .then((result: { uri?: string } | undefined) => {
        if (!isCancelledRef.current && result?.uri) {
          store.answerQuestion(nodeRef, result.uri);
        }
      })
      .catch(() => {
        // Recording failed — ignore
      })
      .finally(() => {
        if (mountedRef.current) {
          setIsRecording(false);
        }
      });
  }, [isRecording, nodeRef, store]);

  const handleRecord = useCallback(() => {
    if (!camera || readonly) return;
    setIsRecording(true);
  }, [camera, readonly]);

  const handleStop = useCallback(() => {
    if (!cameraRef.current) return;
    isCancelledRef.current = false;
    try {
      cameraRef.current.stopRecording();
    } catch {
      // Ignore if not currently recording
    }
  }, []);

  const handleCancel = useCallback(() => {
    if (!cameraRef.current) return;
    isCancelledRef.current = true;
    try {
      cameraRef.current.stopRecording();
    } catch {
      // Ignore if not currently recording
    }
  }, []);

  const handlePlay = useCallback(() => {
    if (!av || !storedUri) return;
    setIsPlaying(true);
  }, [av, storedUri]);

  const handleClosePlayer = useCallback(() => {
    setIsPlaying(false);
  }, []);

  if (!camera) {
    return <UnsupportedWidget dataType="binary" />;
  }

  const { CameraView } = camera;
  const { Video } = av || {};

  if (isPlaying && storedUri && Video) {
    return (
      <MediaCaptureCard
        testID="video-widget"
        state="captured"
        icon={<VideoIcon />}
        title="No video recorded"
        disabled={readonly}
        preview={
          <View style={styles.preview}>
            <Video
              source={{ uri: storedUri }}
              style={styles.preview}
              resizeMode="contain"
              shouldPlay
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

  if (isRecording) {
    return (
      <MediaCaptureCard
        testID="video-widget"
        state="captured"
        icon={<VideoIcon />}
        title="No video recorded"
        disabled={readonly}
        preview={
          <CameraView ref={cameraRef} style={styles.preview} testID="video-camera-view" />
        }
        actions={[
          { label: 'Stop', onPress: handleStop, tone: 'error', testID: 'video-stop-button' },
          { label: 'Cancel', onPress: handleCancel, testID: 'video-cancel-button' },
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
