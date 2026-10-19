/**
 * FileWidget — generic file picker for binary fields (REQ-M15..M16).
 *
 * Gated on expo-document-picker (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 */
import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { MediaCaptureCard } from './primitives/MediaCaptureCard';
import { persistMediaFile, MediaPersistenceError } from './media/mediaStorage';

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
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function FileWidget({ nodeRef, store, appearance: _appearance }: FileWidgetProps) {
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
    const result = await picker.getDocumentAsync({ type: '*/*' });
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
    return <UnsupportedWidget dataType="binary" />;
  }

  return (
    <MediaCaptureCard
      testID="file-widget"
      state="empty"
      icon={<Text>📎</Text>}
      title="No file selected"
      hint={persistError ? 'No se pudo guardar el archivo. Inténtalo de nuevo.' : undefined}
      disabled={readonly}
      actions={[{ label: 'Pick File', onPress: handlePick, testID: 'file-pick-button' }]}
    />
  );
}
