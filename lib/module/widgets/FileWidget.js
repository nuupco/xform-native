"use strict";

/**
 * FileWidget — generic file picker for binary fields (REQ-M15..M16).
 *
 * Gated on expo-document-picker (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 */
import { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { UnsupportedWidget } from "./UnsupportedWidget.js";
import { tokens } from "../tokens/tokens.js";
import { jsx as _jsx } from "react/jsx-runtime";
let _DocPicker = null;
let _docLoaded;
function getDocPicker() {
  if (_docLoaded === undefined) {
    try {
      _DocPicker = require('expo-document-picker');
      _docLoaded = true;
    } catch {
      _docLoaded = false;
    }
  }
  return _DocPicker;
}
export function FileWidget({
  ref,
  store,
  appearance: _appearance
}) {
  const picker = getDocPicker();
  const nodeState = store.adapter.getNodeState(ref);
  const readonly = nodeState.readonly;
  const handlePick = useCallback(async () => {
    if (!picker || readonly) return;
    const result = await picker.getDocumentAsync({
      type: '*/*'
    });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    store.answerQuestion(ref, uri);
  }, [picker, readonly, ref, store]);
  if (!picker) {
    return /*#__PURE__*/_jsx(UnsupportedWidget, {
      dataType: "binary"
    });
  }
  return /*#__PURE__*/_jsx(View, {
    style: styles.container,
    testID: "file-widget",
    children: /*#__PURE__*/_jsx(Pressable, {
      onPress: handlePick,
      disabled: readonly,
      style: [styles.button, readonly && styles.buttonDisabled],
      testID: "file-pick-button",
      children: /*#__PURE__*/_jsx(Text, {
        style: styles.buttonText,
        children: "Pick File"
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
  buttonDisabled: {
    opacity: 0.4
  },
  buttonText: {
    color: tokens.color.text,
    fontSize: tokens.font.sm
  }
});
//# sourceMappingURL=FileWidget.js.map