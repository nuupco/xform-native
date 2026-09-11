"use strict";

/**
 * NoteWidget — read-only display of note text (REQ-15), with optional label
 * media (image/audio/video).
 *
 * Never calls answerQuestion. No editable input element.
 * Renders text from resolveValue(nodeRef). Renders nothing at all when
 * that value is empty AND the label carries no usable media — an empty
 * note (e.g. a readonly/calculated field whose expression hasn't resolved
 * to anything yet) with no media has no information to show, so it
 * shouldn't reserve visual space or leak an empty box.
 *
 * Label media (getLabelMediaUri, same mechanism as SelectOneWidget's
 * image-map variant): a note's label can carry a `jr://` itext media
 * reference for 'image', 'audio', or 'video'. store.mediaResolver (a
 * host-provisioned, opt-in seam) resolves that raw reference to a
 * loadable URI. Falls back to text-only (or nothing) when mediaResolver
 * is absent, no form carries media, or resolution fails — same silent
 * fallback principle as image-map/map.
 */

import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { useThemedStyles } from "../theme/ThemeContext.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
let _AvModule = null;
let _avLoaded;
function getAvModule() {
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
let _AudioModule = null;
let _audioLoaded;
function getAudioModule() {
  if (_audioLoaded === undefined) {
    try {
      _AudioModule = require('expo-audio');
      _audioLoaded = true;
    } catch {
      _audioLoaded = false;
    }
  }
  return _AudioModule;
}
export function NoteWidget({
  nodeRef,
  store
}) {
  const styles = useThemedStyles(createStyles);
  useFormSession(store);
  const value = store.adapter.resolveValue(nodeRef);
  const text = value != null ? String(value) : '';
  const rawImageUri = store.adapter.getLabelMediaUri('image');
  const rawAudioUri = store.adapter.getLabelMediaUri('audio');
  const rawVideoUri = store.adapter.getLabelMediaUri('video');
  const [imageUri, setImageUri] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const av = getAvModule();
  const audio = getAudioModule();

  // Unconditional Hook Ordering: these hooks run for every note, regardless
  // of whether the label actually carries media — only the effect bodies
  // branch on that.
  useEffect(() => {
    if (!rawImageUri || !store.mediaResolver) {
      setImageUri(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const uri = await store.mediaResolver.resolve(rawImageUri);
      if (!cancelled) setImageUri(uri);
    })();
    return () => {
      cancelled = true;
    };
  }, [rawImageUri, store]);
  useEffect(() => {
    if (!rawAudioUri || !store.mediaResolver) {
      setAudioUri(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const uri = await store.mediaResolver.resolve(rawAudioUri);
      if (!cancelled) setAudioUri(uri);
    })();
    return () => {
      cancelled = true;
    };
  }, [rawAudioUri, store]);
  useEffect(() => {
    if (!rawVideoUri || !store.mediaResolver) {
      setVideoUri(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const uri = await store.mediaResolver.resolve(rawVideoUri);
      if (!cancelled) setVideoUri(uri);
    })();
    return () => {
      cancelled = true;
    };
  }, [rawVideoUri, store]);

  // Hooks-rules-safe unconditional call through the lazily-`require`d
  // module reference (see AudioWidget/VideoWidget's equivalent comment):
  // `audio`/`av`'s truthiness is decided once at module-require time and
  // never varies across this component instance's lifetime.
  const audioPlayer = audio?.useAudioPlayer?.(audioUri ? {
    uri: audioUri
  } : null);
  const videoPlayer = av?.useVideoPlayer?.(videoUri ? {
    uri: videoUri
  } : null);
  const handleToggleAudio = () => {
    if (!audio || !audioPlayer || !audioUri) return;
    try {
      if (isPlayingAudio) {
        audioPlayer.pause();
      } else {
        audioPlayer.play();
      }
    } catch {
      // best-effort; playback failure has no dedicated UI state
    }
    setIsPlayingAudio(prev => !prev);
  };
  const hasMedia = Boolean(imageUri || audio && audioUri || av && videoUri && videoPlayer);
  if (text.trim().length === 0 && !hasMedia) {
    return null;
  }
  const VideoView = av?.VideoView;
  return /*#__PURE__*/_jsxs(View, {
    style: styles.container,
    testID: "note-widget",
    children: [text.trim().length > 0 && /*#__PURE__*/_jsx(Text, {
      style: styles.text,
      children: text
    }), imageUri && /*#__PURE__*/_jsx(Image, {
      testID: "note-label-image",
      source: {
        uri: imageUri
      },
      style: styles.mediaPreview,
      resizeMode: "contain"
    }), audio && audioUri && /*#__PURE__*/_jsx(Pressable, {
      testID: "note-label-audio-play-button",
      style: styles.audioButton,
      onPress: handleToggleAudio,
      children: /*#__PURE__*/_jsx(Text, {
        style: styles.audioButtonText,
        children: isPlayingAudio ? 'Pause' : 'Play'
      })
    }), av && videoUri && VideoView && videoPlayer && /*#__PURE__*/_jsx(VideoView, {
      testID: "note-label-video",
      player: videoPlayer,
      style: styles.mediaPreview,
      contentFit: "contain"
    })]
  });
}
function createStyles(t) {
  return StyleSheet.create({
    container: {
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      backgroundColor: t.color.roles.secondaryContainer,
      borderRadius: t.radius.md
    },
    text: {
      ...t.typography.bodyMedium,
      color: t.color.roles.onSecondaryContainer
    },
    mediaPreview: {
      width: 240,
      height: 180,
      marginTop: t.spacing.sm,
      borderRadius: t.radius.md,
      backgroundColor: t.color.roles.surfaceVariant
    },
    audioButton: {
      marginTop: t.spacing.sm,
      alignSelf: 'flex-start',
      paddingVertical: t.spacing.xs,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radius.pill,
      backgroundColor: t.color.roles.primary
    },
    audioButtonText: {
      ...t.typography.bodyMedium,
      color: t.color.roles.onPrimary
    }
  });
}
//# sourceMappingURL=NoteWidget.js.map