/**
 * AudioWidget — binary audio capture/playback (REQ-M11..M14).
 *
 * Gated on expo-av (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 *
 * Restyle (design decision 7, per-widget mapping table, PR12): chrome moves
 * onto `MediaCaptureCard`. `state:'captured'` has no natural preview for
 * audio (no visual media), so — following BarcodeWidget's precedent (PR11)
 * of reusing the `preview` slot as a generic "custom content" region — the
 * "recording exists" case renders a `MicIcon` + label through `preview`
 * while it still surfaces the Play action. `active` covers the
 * in-progress-recording state (`MicIcon` pulsing via `recordingPulse`,
 * `Stop` action with `tone:'error'`).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { MediaCaptureCard } from './primitives/MediaCaptureCard';
import { MicIcon } from './primitives/Icon';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import {
  usePermissionGate,
  isPermissionBlockingState,
  type PermissionGateStatus,
} from './primitives/usePermissionGate';
import { PermissionNotice } from './primitives/PermissionNotice';

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
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    savedReadout: { ...t.typography.bodyMedium, color: t.color.roles.onSurface },
  });
}

function getMicNoticeCopy(status: PermissionGateStatus) {
  switch (status) {
    case 'rationale':
      return {
        title: 'Usar el micrófono',
        body: 'Necesitamos el micrófono para grabar tu respuesta de audio.',
      };
    case 'blocked':
      return {
        title: 'Permiso de micrófono bloqueado',
        body: 'Actívalo en los ajustes del sistema para grabar audio.',
      };
    case 'error':
      return {
        title: 'No se pudo iniciar la grabación',
        body: 'Vuelve a intentarlo.',
      };
    case 'denied':
    default:
      return {
        title: 'Sin permiso de micrófono',
        body: 'Permite el acceso para grabar audio.',
      };
  }
}

export function AudioWidget({ nodeRef, store, appearance: _appearance }: AudioWidgetProps) {
  // Theming (D2): useThemedStyles MUST stay the first statement, before the
  // peer-dependency gating early return below.
  const styles = useThemedStyles(createStyles);
  const av = getAudioModule();
  const resolved = store.adapter.resolveValue(nodeRef);
  const storedUri: string | null =
    typeof resolved === 'string' && resolved.length > 0 ? resolved : null;
  const nodeState = store.adapter.getNodeState(nodeRef);
  const readonly = nodeState.readonly;

  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<any>(null);
  const soundRef = useRef<any>(null);

  const micAdapter = useMemo(
    () => ({
      get: () => av?.Audio?.getPermissionsAsync?.(),
      request: () => av?.Audio?.requestPermissionsAsync?.(),
    }),
    [av]
  );
  const gate = usePermissionGate(micAdapter);

  // Recording pulse — one-shot opacity dip (not a repeating loop: the global
  // `Animated.timing` jest stub resolves `start()` synchronously, which would
  // recurse forever through `Animated.loop`, see PR7's gotcha). Mirrors
  // RankWidget's lift animation shape: animate to a value on state change.
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(pulseOpacity, {
      toValue: isRecording ? 0.5 : 1,
      duration: isRecording ? 500 : 200,
      useNativeDriver: true,
    }).start();
  }, [isRecording, pulseOpacity]);

  const handleRecord = useCallback(async () => {
    if (!av || readonly) return;
    if (!(await gate.ensure())) return;
    try {
      const { Audio } = av;
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
    } catch {
      // Genuine runtime failure (device busy, hardware issue) despite a
      // granted permission — design decision 9. Never leave this as an
      // unhandled rejection.
      gate.markError();
      setIsRecording(false);
    }
  }, [av, readonly, gate]);

  const handleStop = useCallback(async () => {
    if (!av || readonly || !recordingRef.current) return;
    try {
      const recording = recordingRef.current;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      if (uri) {
        store.answerQuestion(nodeRef, uri);
      }
    } catch {
      // best-effort; nothing else to do on a failed stop
    } finally {
      setIsRecording(false);
    }
  }, [av, readonly, nodeRef, store]);

  const handlePlay = useCallback(async () => {
    if (!av || readonly) return;
    const uri = storedUri;
    if (!uri) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { Audio } = av;
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      await sound.playAsync();
    } catch {
      // best-effort; playback failure has no dedicated UI state
    }
  }, [av, readonly, storedUri]);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        try {
          recordingRef.current.stopAndUnloadAsync();
        } catch {
          // best-effort cleanup on unmount
        }
        recordingRef.current = null;
      }
      if (soundRef.current) {
        try {
          soundRef.current.unloadAsync();
        } catch {
          // best-effort cleanup on unmount
        }
        soundRef.current = null;
      }
    };
  }, []);

  if (!av) {
    return <UnsupportedWidget dataType="binary" />;
  }

  if (
    !readonly &&
    !isRecording &&
    (isPermissionBlockingState(gate.status) || gate.status === 'error')
  ) {
    const copy = getMicNoticeCopy(gate.status);
    return (
      <MediaCaptureCard
        testID="audio-widget"
        state="captured"
        icon={<MicIcon />}
        title="No recording"
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

  if (isRecording) {
    return (
      <MediaCaptureCard
        testID="audio-widget"
        state="active"
        icon={
          <Animated.View testID="audio-recording-pulse" style={{ opacity: pulseOpacity }}>
            <MicIcon />
          </Animated.View>
        }
        title="Recording…"
        disabled={readonly}
        actions={[
          { label: 'Stop', onPress: handleStop, tone: 'error', testID: 'audio-stop-button' },
        ]}
      />
    );
  }

  if (storedUri) {
    return (
      <MediaCaptureCard
        testID="audio-widget"
        state="captured"
        icon={<MicIcon />}
        title="Recording saved"
        disabled={readonly}
        preview={
          <>
            <MicIcon />
            <Text style={styles.savedReadout}>Recording saved</Text>
          </>
        }
        actions={[{ label: 'Play', onPress: handlePlay, testID: 'audio-play-button' }]}
      />
    );
  }

  return (
    <MediaCaptureCard
      testID="audio-widget"
      state="empty"
      icon={<MicIcon />}
      title="No recording"
      disabled={readonly}
      actions={[{ label: 'Record', onPress: handleRecord, testID: 'audio-record-button' }]}
    />
  );
}
