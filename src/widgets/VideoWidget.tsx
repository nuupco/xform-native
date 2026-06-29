/**
 * VideoWidget — binary video capture/playback (REQ-V01..V04).
 *
 * Gated on expo-camera (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 * Playback uses expo-av Video component (already an optional peer dep).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { tokens } from '../tokens/tokens';

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
  ref: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function VideoWidget({ ref, store, appearance: _appearance }: VideoWidgetProps) {
  const camera = getCameraModule();
  const av = getAvModule();
  const resolved = store.adapter.resolveValue(ref);
  const storedUri: string | null =
    typeof resolved === 'string' && resolved.length > 0 ? resolved : null;
  const nodeState = store.adapter.getNodeState(ref);
  const readonly = nodeState.readonly;

  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const cameraRef = useRef<any>(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    if (!isRecording || !cameraRef.current) return;
    isCancelledRef.current = false;
    cameraRef.current
      .recordAsync({ maxDuration: 60 })
      .then((result: { uri?: string } | undefined) => {
        if (!isCancelledRef.current && result?.uri) {
          store.answerQuestion(ref, result.uri);
        }
      })
      .catch(() => {
        // Recording failed — ignore
      })
      .finally(() => {
        setIsRecording(false);
      });
  }, [isRecording, ref, store]);

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

  return (
    <View style={styles.container} testID="video-widget">
      {isPlaying && storedUri && Video ? (
        <View style={styles.playerContainer}>
          <Video
            source={{ uri: storedUri }}
            style={styles.video}
            resizeMode="contain"
            shouldPlay
            testID="video-player"
          />
          <Pressable
            onPress={handleClosePlayer}
            style={[styles.button, styles.stopButton]}
            testID="video-close-player-button"
          >
            <Text style={styles.buttonText}>Close</Text>
          </Pressable>
        </View>
      ) : isRecording ? (
        <View style={styles.recordingContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            testID="video-camera-view"
          />
          <View style={styles.buttonRow}>
            <Pressable
              onPress={handleStop}
              disabled={readonly}
              style={[styles.button, styles.stopButton, readonly && styles.buttonDisabled]}
              testID="video-stop-button"
            >
              <Text style={styles.buttonText}>Stop</Text>
            </Pressable>
            <Pressable
              onPress={handleCancel}
              disabled={readonly}
              style={[styles.button, readonly && styles.buttonDisabled]}
              testID="video-cancel-button"
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : storedUri ? (
        <View style={styles.buttonRow}>
          <Pressable
            onPress={handlePlay}
            disabled={readonly}
            style={[styles.button, readonly && styles.buttonDisabled]}
            testID="video-play-button"
          >
            <Text style={styles.buttonText}>Play</Text>
          </Pressable>
          <Pressable
            onPress={handleRecord}
            disabled={readonly}
            style={[styles.button, readonly && styles.buttonDisabled]}
            testID="video-record-button"
          >
            <Text style={styles.buttonText}>Record</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={handleRecord}
          disabled={readonly}
          style={[styles.button, readonly && styles.buttonDisabled]}
          testID="video-record-button"
        >
          <Text style={styles.buttonText}>Record</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.sm },
  recordingContainer: { gap: tokens.spacing.sm },
  playerContainer: { gap: tokens.spacing.sm },
  camera: {
    width: 240,
    height: 180,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.surface,
  },
  video: {
    width: 240,
    height: 180,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.surface,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  button: {
    padding: tokens.spacing.sm,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
  },
  stopButton: {
    backgroundColor: tokens.color.error,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: tokens.color.text, fontSize: tokens.font.sm },
});
