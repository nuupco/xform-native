"use strict";

/**
 * SignatureWidget — binary signature capture (REQ-M07..M10).
 * Gated on react-native-signature-canvas (optional peer dep, itself
 * requiring react-native-webview). Falls back to UnsupportedWidget when
 * either dep is absent at runtime.
 *
 * Signing happens inside a fullscreen modal (AppModal, same shape as
 * GeoPointWidget/SelectOneWidget's map modal) instead of an inline canvas —
 * the form flow only ever shows a MediaCaptureCard (empty/captured), never
 * the drawing surface itself.
 *
 * Migrated off the custom PanResponder + react-native-svg canvas (real
 * coordinate bug per facebook/react-native#15290, plus per-point re-render
 * lag) onto react-native-signature-canvas, a maintained WebView wrapper
 * around signature_pad.js. react-native-webview is a required transitive
 * dependency of that package (it renders the pad inside a WebView), so it
 * is declared alongside it as an optional peer here.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { UnsupportedWidget } from "./UnsupportedWidget.js";
import { useThemedStyles, useTheme } from "../theme/ThemeContext.js";
import { PressableButton } from "./primitives/PressableButton.js";
import { MediaCaptureCard } from "./primitives/MediaCaptureCard.js";
import { AppModal } from "./primitives/Modal.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function createStyles(t) {
  return StyleSheet.create({
    previewCanvas: {
      height: 100,
      width: 200,
      borderRadius: t.radius.sm,
      backgroundColor: t.color.roles.surfaceVariant
    },
    modalContent: {
      flex: 1,
      gap: t.spacing.sm,
      padding: t.spacing.md
    },
    modalCanvas: {
      flex: 1,
      borderWidth: 1,
      borderColor: t.color.roles.outline,
      borderRadius: t.radius.sm,
      backgroundColor: t.color.roles.surface
    },
    buttonRow: {
      flexDirection: 'row',
      gap: t.spacing.sm
    }
  });
}
function isSignatureDataUri(value) {
  return typeof value === 'string' && value.startsWith('data:image/');
}
export function SignatureWidget({
  nodeRef,
  store
}) {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const SignatureCanvas = getSignatureCanvas();
  const nodeState = store.adapter.getNodeState(nodeRef);
  const readonly = nodeState.readonly;
  const resolved = store.adapter.resolveValue(nodeRef);
  const penColor = theme.color.roles.onSurface;
  const canvasBackground = theme.color.roles.surface;
  const hasSignature = isSignatureDataUri(resolved);
  const [modalVisible, setModalVisible] = useState(false);
  const canvasRef = useRef(null);

  // signature_pad has no supported way to reload a PNG back into editable
  // strokes, so "Editar" always reopens with a blank pad — the user redraws
  // from scratch rather than continuing the previous signature.
  const openModal = useCallback(() => {
    setModalVisible(true);
  }, []);
  const handleClear = useCallback(() => {
    canvasRef.current?.clearSignature();
  }, []);
  const handleCancel = useCallback(() => {
    setModalVisible(false);
  }, []);
  // onOK fires asynchronously (WebView -> native bridge) once readSignature()
  // resolves — the actual save/close happens here, not in handleSave.
  const handleOK = useCallback(signature => {
    store.answerQuestion(nodeRef, signature);
    setModalVisible(false);
  }, [nodeRef, store]);
  const handleSave = useCallback(() => {
    canvasRef.current?.readSignature();
  }, []);
  const handleDelete = useCallback(() => {
    store.answerQuestion(nodeRef, null);
  }, [nodeRef, store]);
  const webStyle = useMemo(() => `.m-signature-pad--footer { display: none; margin: 0; } body,html { background-color: ${canvasBackground}; }`, [canvasBackground]);
  if (!SignatureCanvas) return /*#__PURE__*/_jsx(UnsupportedWidget, {
    dataType: "binary"
  });
  return /*#__PURE__*/_jsxs(View, {
    testID: "signature-widget",
    children: [/*#__PURE__*/_jsx(MediaCaptureCard, {
      testID: "signature-card",
      state: hasSignature ? 'captured' : 'empty',
      icon: /*#__PURE__*/_jsx(Text, {
        children: "\u270D\uFE0F"
      }),
      title: "Sin firma",
      hint: readonly ? undefined : 'Toca para firmar',
      disabled: readonly,
      preview: hasSignature ? /*#__PURE__*/_jsx(Image, {
        source: {
          uri: resolved
        },
        style: styles.previewCanvas,
        resizeMode: "contain",
        testID: "signature-preview"
      }) : undefined,
      actions: readonly ? [] : hasSignature ? [{
        label: 'Firmar de nuevo',
        onPress: openModal,
        testID: 'signature-edit-button'
      }, {
        label: 'Borrar',
        onPress: handleDelete,
        tone: 'error',
        testID: 'signature-delete-button'
      }] : [{
        label: 'Firmar',
        onPress: openModal,
        testID: 'signature-open-button'
      }]
    }), /*#__PURE__*/_jsx(AppModal, {
      visible: modalVisible,
      onRequestClose: handleCancel,
      testID: "signature-modal",
      fullScreen: true,
      animationType: "slide",
      children: /*#__PURE__*/_jsxs(View, {
        style: styles.modalContent,
        children: [/*#__PURE__*/_jsx(View, {
          style: styles.modalCanvas,
          testID: "signature-canvas",
          children: /*#__PURE__*/_jsx(SignatureCanvas, {
            ref: canvasRef,
            onOK: handleOK,
            penColor: penColor,
            backgroundColor: canvasBackground,
            webStyle: webStyle,
            autoClear: false,
            testID: "signature-canvas-webview"
          })
        }), /*#__PURE__*/_jsxs(View, {
          style: styles.buttonRow,
          children: [/*#__PURE__*/_jsx(PressableButton, {
            label: "Cancelar",
            onPress: handleCancel,
            variant: "text",
            testID: "signature-cancel-button"
          }), /*#__PURE__*/_jsx(PressableButton, {
            label: "Limpiar",
            onPress: handleClear,
            variant: "text",
            testID: "signature-clear-button"
          }), /*#__PURE__*/_jsx(PressableButton, {
            label: "Guardar",
            onPress: handleSave,
            variant: "filled",
            testID: "signature-save-button"
          })]
        })]
      })
    })]
  });
}
let _SignatureCanvasModule = null;
let _signatureCanvasLoaded;
function getSignatureCanvas() {
  if (_signatureCanvasLoaded === undefined) {
    try {
      require('react-native-webview');
      _SignatureCanvasModule = require('react-native-signature-canvas').default;
      _signatureCanvasLoaded = true;
    } catch {
      _signatureCanvasLoaded = false;
    }
  }
  return _SignatureCanvasModule;
}
//# sourceMappingURL=SignatureWidget.js.map