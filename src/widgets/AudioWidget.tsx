/**
 * AudioWidget — binary audio capture/playback (REQ-M11..M14).
 *
 * Gated on expo-av (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 */
import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { tokens } from '../tokens/tokens';

let _AudioModule: any | null = null;
let _avLoaded: boolean | undefined;

function getAudioModule(): any | null {
  if (_avLoaded === undefined) {
    try {
      _AudioModule = require('expo-av');
      _avLoaded = true;
    } catch {
      _avLoaded = false;
    }
  }
  return _AudioModule;
}

export interface AudioWidgetProps {
  ref: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function AudioWidget({ ref, store, appearance: _appearance }: AudioWidgetProps) {
  const av = getAudioModule();
  const resolved = store.adapter.resolveValue(ref);
  const storedUri: string | null =
    typeof resolved === 'string' && resolved.length > 0 ? resolved : null;
  const nodeState = store.adapter.getNodeState(ref);
  const readonly = nodeState.readonly;

  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<any>(null);
  const soundRef = useRef<any>(null);

  const handleRecord = useCallback(async () => {
    if (!av || readonly) return;
    const { Audio } = av;
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    recordingRef.current = recording;
    setIsRecording(true);
  }, [av, readonly]);

  const handleStop = useCallback(async () => {
    if (!av || readonly || !recordingRef.current) return;
    const recording = recordingRef.current;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recordingRef.current = null;
    if (uri) {
      store.answerQuestion(ref, uri);
    }
    setIsRecording(false);
  }, [av, readonly, ref, store]);

  const handlePlay = useCallback(async () => {
    if (!av || readonly) return;
    const uri = storedUri;
    if (!uri) return;
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    const { Audio } = av;
    const { sound } = await Audio.Sound.createAsync({ uri });
    soundRef.current = sound;
    await sound.playAsync();
  }, [av, readonly, storedUri]);

  if (!av) {
    return <UnsupportedWidget dataType="binary" />;
  }

  return (
    <View style={styles.container} testID="audio-widget">
      {isRecording ? (
        <Pressable
          onPress={handleStop}
          disabled={readonly}
          style={[styles.button, styles.stopButton, readonly && styles.buttonDisabled]}
          testID="audio-stop-button"
        >
          <Text style={styles.buttonText}>Stop</Text>
        </Pressable>
      ) : storedUri ? (
        <Pressable
          onPress={handlePlay}
          disabled={readonly}
          style={[styles.button, readonly && styles.buttonDisabled]}
          testID="audio-play-button"
        >
          <Text style={styles.buttonText}>Play</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={handleRecord}
          disabled={readonly}
          style={[styles.button, readonly && styles.buttonDisabled]}
          testID="audio-record-button"
        >
          <Text style={styles.buttonText}>Record</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.sm },
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
