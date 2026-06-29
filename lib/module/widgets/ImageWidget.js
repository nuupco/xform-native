"use strict";

/**
 * ImageWidget — binary image capture/pick (REQ-M03..M06).
 *
 * Gated on expo-image-picker (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 */
import { useCallback, useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { UnsupportedWidget } from "./UnsupportedWidget.js";
import { tokens } from "../tokens/tokens.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
let _ImagePicker = null;
let _pickerLoaded;
function getImagePicker() {
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
export function ImageWidget({
  ref,
  store,
  appearance: _appearance
}) {
  const picker = getImagePicker();
  const resolved = store.adapter.resolveValue(ref);
  const uri = typeof resolved === 'string' && resolved.length > 0 ? resolved : null;
  const nodeState = store.adapter.getNodeState(ref);
  const readonly = nodeState.readonly;
  const [thumbnailUri, setThumbnailUri] = useState(uri);
  const source = thumbnailUri ? {
    uri: thumbnailUri
  } : undefined;
  const handleResult = useCallback(result => {
    if (result.canceled || !result.assets?.[0]) return;
    const newUri = result.assets[0].uri;
    setThumbnailUri(newUri);
    store.answerQuestion(ref, newUri);
  }, [ref, store]);
  const handleCamera = useCallback(async () => {
    if (!picker || readonly) return;
    const result = await picker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8
    });
    handleResult(result);
  }, [picker, readonly, handleResult]);
  const handleLibrary = useCallback(async () => {
    if (!picker || readonly) return;
    const result = await picker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8
    });
    handleResult(result);
  }, [picker, readonly, handleResult]);
  if (!picker) {
    return /*#__PURE__*/_jsx(UnsupportedWidget, {
      dataType: "binary"
    });
  }
  return /*#__PURE__*/_jsxs(View, {
    style: styles.container,
    testID: "image-widget",
    children: [source && /*#__PURE__*/_jsx(Image, {
      source: source,
      style: styles.thumbnail,
      testID: "image-thumbnail",
      accessibilityLabel: "Selected image"
    }), /*#__PURE__*/_jsxs(View, {
      style: styles.buttonRow,
      children: [/*#__PURE__*/_jsx(Pressable, {
        onPress: handleCamera,
        disabled: readonly,
        style: [styles.button, readonly && styles.buttonDisabled],
        testID: "image-camera-button",
        children: /*#__PURE__*/_jsx(Text, {
          style: styles.buttonText,
          children: "Take Photo"
        })
      }), /*#__PURE__*/_jsx(Pressable, {
        onPress: handleLibrary,
        disabled: readonly,
        style: [styles.button, readonly && styles.buttonDisabled],
        testID: "image-library-button",
        children: /*#__PURE__*/_jsx(Text, {
          style: styles.buttonText,
          children: "Pick from Library"
        })
      })]
    })]
  });
}
const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.sm
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.surface
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm
  },
  button: {
    padding: tokens.spacing.sm,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm
  },
  buttonDisabled: {
    opacity: 0.4
  },
  buttonText: {
    color: tokens.color.text,
    fontSize: tokens.font.sm
  }
});
//# sourceMappingURL=ImageWidget.js.map