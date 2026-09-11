"use strict";

/**
 * FileWidget — generic file picker for binary fields (REQ-M15..M16).
 *
 * Gated on expo-document-picker (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 */
import { useCallback } from 'react';
import { Text } from 'react-native';
import { UnsupportedWidget } from "./UnsupportedWidget.js";
import { MediaCaptureCard } from "./primitives/MediaCaptureCard.js";
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
  nodeRef,
  store,
  appearance: _appearance
}) {
  const picker = getDocPicker();
  const nodeState = store.adapter.getNodeState(nodeRef);
  const readonly = nodeState.readonly;
  const handlePick = useCallback(async () => {
    if (!picker || readonly) return;
    const result = await picker.getDocumentAsync({
      type: '*/*'
    });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    store.answerQuestion(nodeRef, uri);
  }, [picker, readonly, nodeRef, store]);
  if (!picker) {
    return /*#__PURE__*/_jsx(UnsupportedWidget, {
      dataType: "binary"
    });
  }
  return /*#__PURE__*/_jsx(MediaCaptureCard, {
    testID: "file-widget",
    state: "empty",
    icon: /*#__PURE__*/_jsx(Text, {
      children: "\uD83D\uDCCE"
    }),
    title: "No file selected",
    disabled: readonly,
    actions: [{
      label: 'Pick File',
      onPress: handlePick,
      testID: 'file-pick-button'
    }]
  });
}
//# sourceMappingURL=FileWidget.js.map