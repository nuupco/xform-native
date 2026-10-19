"use strict";

/**
 * FileWidget — generic file picker for binary fields (REQ-M15..M16).
 *
 * Gated on expo-document-picker (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 */
import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { UnsupportedWidget } from "./UnsupportedWidget.js";
import { MediaCaptureCard } from "./primitives/MediaCaptureCard.js";
import { persistMediaFile, MediaPersistenceError } from "./media/mediaStorage.js";
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

  // Set only when persistMediaFile fails (dep absent or copy error). This
  // widget has no permission gate to piggyback an error UI on (unlike
  // Image/Video/Audio), so — per decision — it falls back to the simplest
  // safe behavior: leave the question unanswered rather than ever storing
  // the raw, unpersisted picker URI.
  const [persistError, setPersistError] = useState(false);
  const handlePick = useCallback(async () => {
    if (!picker || readonly) return;
    const result = await picker.getDocumentAsync({
      type: '*/*'
    });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    setPersistError(false);
    try {
      const filename = await persistMediaFile(uri);
      store.answerQuestion(nodeRef, filename);
    } catch (err) {
      if (!(err instanceof MediaPersistenceError)) throw err;
      setPersistError(true);
    }
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
    hint: persistError ? 'No se pudo guardar el archivo. Inténtalo de nuevo.' : undefined,
    disabled: readonly,
    actions: [{
      label: 'Pick File',
      onPress: handlePick,
      testID: 'file-pick-button'
    }]
  });
}
//# sourceMappingURL=FileWidget.js.map