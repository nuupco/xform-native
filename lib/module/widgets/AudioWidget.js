"use strict";

/**
 * AudioWidget — binary audio capture/playback (REQ-M11..M14).
 *
 * Gated on expo-av (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 */
import { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { UnsupportedWidget } from "./UnsupportedWidget.js";
import { tokens } from "../tokens/tokens.js";
import { jsx as _jsx } from "react/jsx-runtime";
let _AudioModule = null;
let _avLoaded;
function getAudioModule() {
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
export function AudioWidget({
  ref,
  store,
  appearance: _appearance
}) {
  const av = getAudioModule();
  const resolved = store.adapter.resolveValue(ref);
  const storedUri = typeof resolved === 'string' && resolved.length > 0 ? resolved : null;
  const nodeState = store.adapter.getNodeState(ref);
  const readonly = nodeState.readonly;
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const handleRecord = useCallback(async () => {
    if (!av || readonly) return;
    const {
      Audio
    } = av;
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
    const {
      Audio
    } = av;
    const {
      sound
    } = await Audio.Sound.createAsync({
      uri
    });
    soundRef.current = sound;
    await sound.playAsync();
  }, [av, readonly, storedUri]);
  if (!av) {
    return /*#__PURE__*/_jsx(UnsupportedWidget, {
      dataType: "binary"
    });
  }
  return /*#__PURE__*/_jsx(View, {
    style: styles.container,
    testID: "audio-widget",
    children: isRecording ? /*#__PURE__*/_jsx(Pressable, {
      onPress: handleStop,
      disabled: readonly,
      style: [styles.button, styles.stopButton, readonly && styles.buttonDisabled],
      testID: "audio-stop-button",
      children: /*#__PURE__*/_jsx(Text, {
        style: styles.buttonText,
        children: "Stop"
      })
    }) : storedUri ? /*#__PURE__*/_jsx(Pressable, {
      onPress: handlePlay,
      disabled: readonly,
      style: [styles.button, readonly && styles.buttonDisabled],
      testID: "audio-play-button",
      children: /*#__PURE__*/_jsx(Text, {
        style: styles.buttonText,
        children: "Play"
      })
    }) : /*#__PURE__*/_jsx(Pressable, {
      onPress: handleRecord,
      disabled: readonly,
      style: [styles.button, readonly && styles.buttonDisabled],
      testID: "audio-record-button",
      children: /*#__PURE__*/_jsx(Text, {
        style: styles.buttonText,
        children: "Record"
      })
    })
  });
}
const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.sm
  },
  button: {
    padding: tokens.spacing.sm,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm
  },
  stopButton: {
    backgroundColor: tokens.color.error
  },
  buttonDisabled: {
    opacity: 0.4
  },
  buttonText: {
    color: tokens.color.text,
    fontSize: tokens.font.sm
  }
});
//# sourceMappingURL=AudioWidget.js.map