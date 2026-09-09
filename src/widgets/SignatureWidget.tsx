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
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { useThemedStyles, useTheme, type Theme } from '../theme/ThemeContext';
import { PressableButton } from './primitives/PressableButton';
import { MediaCaptureCard } from './primitives/MediaCaptureCard';
import { AppModal } from './primitives/Modal';

export interface SignatureWidgetProps {
  nodeRef: NodeRef; store: FormSessionStore; appearance?: string | null;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    previewCanvas: { height: 100, width: 200, borderRadius: t.radius.sm, backgroundColor: t.color.roles.surfaceVariant },
    modalContent: { flex: 1, gap: t.spacing.sm, padding: t.spacing.md },
    modalCanvas: { flex: 1, borderWidth: 1, borderColor: t.color.roles.outline, borderRadius: t.radius.sm, backgroundColor: t.color.roles.surface },
    buttonRow: { flexDirection: 'row', gap: t.spacing.sm },
  });
}

function isSignatureDataUri(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:image/');
}

export function SignatureWidget({ nodeRef, store }: SignatureWidgetProps) {
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
  const canvasRef = useRef<any>(null);

  // signature_pad has no supported way to reload a PNG back into editable
  // strokes, so "Editar" always reopens with a blank pad — the user redraws
  // from scratch rather than continuing the previous signature.
  const openModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const handleClear = useCallback(() => {
    canvasRef.current?.clearSignature();
  }, []);
  const handleCancel = useCallback(() => { setModalVisible(false); }, []);
  // onOK fires asynchronously (WebView -> native bridge) once readSignature()
  // resolves — the actual save/close happens here, not in handleSave.
  const handleOK = useCallback((signature: string) => {
    store.answerQuestion(nodeRef, signature);
    setModalVisible(false);
  }, [nodeRef, store]);
  const handleSave = useCallback(() => {
    canvasRef.current?.readSignature();
  }, []);
  const handleDelete = useCallback(() => { store.answerQuestion(nodeRef, null); }, [nodeRef, store]);

  const webStyle = useMemo(
    () => `.m-signature-pad--footer { display: none; margin: 0; } body,html { background-color: ${canvasBackground}; }`,
    [canvasBackground],
  );

  if (!SignatureCanvas) return <UnsupportedWidget dataType="binary" />;

  return (
    <View testID="signature-widget">
      <MediaCaptureCard
        testID="signature-card"
        state={hasSignature ? 'captured' : 'empty'}
        icon={<Text>✍️</Text>}
        title="Sin firma"
        hint={readonly ? undefined : 'Toca para firmar'}
        disabled={readonly}
        preview={
          hasSignature ? (
            <Image
              source={{ uri: resolved as string }}
              style={styles.previewCanvas}
              resizeMode="contain"
              testID="signature-preview"
            />
          ) : undefined
        }
        actions={readonly ? [] : hasSignature ? [
          { label: 'Firmar de nuevo', onPress: openModal, testID: 'signature-edit-button' },
          { label: 'Borrar', onPress: handleDelete, tone: 'error', testID: 'signature-delete-button' },
        ] : [
          { label: 'Firmar', onPress: openModal, testID: 'signature-open-button' },
        ]}
      />

      <AppModal
        visible={modalVisible}
        onRequestClose={handleCancel}
        testID="signature-modal"
        fullScreen
        animationType="slide"
      >
        <View style={styles.modalContent}>
          <View style={styles.modalCanvas} testID="signature-canvas">
            <SignatureCanvas
              ref={canvasRef}
              onOK={handleOK}
              penColor={penColor}
              backgroundColor={canvasBackground}
              webStyle={webStyle}
              autoClear={false}
              testID="signature-canvas-webview"
            />
          </View>
          <View style={styles.buttonRow}>
            <PressableButton label="Cancelar" onPress={handleCancel} variant="text" testID="signature-cancel-button" />
            <PressableButton label="Limpiar" onPress={handleClear} variant="text" testID="signature-clear-button" />
            <PressableButton label="Guardar" onPress={handleSave} variant="filled" testID="signature-save-button" />
          </View>
        </View>
      </AppModal>
    </View>
  );
}

let _SignatureCanvasModule: any | null = null;
let _signatureCanvasLoaded: boolean | undefined;
function getSignatureCanvas(): any | null {
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
