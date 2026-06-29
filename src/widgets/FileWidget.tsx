/**
 * FileWidget — generic file picker for binary fields (REQ-M15..M16).
 *
 * Gated on expo-document-picker (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 */
import { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { tokens } from '../tokens/tokens';

let _DocPicker: any | null = null;
let _docLoaded: boolean | undefined;

function getDocPicker(): any | null {
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

export interface FileWidgetProps {
  ref: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function FileWidget({ ref, store, appearance: _appearance }: FileWidgetProps) {
  const picker = getDocPicker();
  const nodeState = store.adapter.getNodeState(ref);
  const readonly = nodeState.readonly;

  const handlePick = useCallback(async () => {
    if (!picker || readonly) return;
    const result = await picker.getDocumentAsync({ type: '*/*' });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    store.answerQuestion(ref, uri);
  }, [picker, readonly, ref, store]);

  if (!picker) {
    return <UnsupportedWidget dataType="binary" />;
  }

  return (
    <View style={styles.container} testID="file-widget">
      <Pressable
        onPress={handlePick}
        disabled={readonly}
        style={[styles.button, readonly && styles.buttonDisabled]}
        testID="file-pick-button"
      >
        <Text style={styles.buttonText}>Pick File</Text>
      </Pressable>
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
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: tokens.color.text, fontSize: tokens.font.sm },
});
