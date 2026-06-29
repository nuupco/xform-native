/**
 * ImageWidget — binary image capture/pick (REQ-M03..M06).
 *
 * Gated on expo-image-picker (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 */
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  type ImageSourcePropType,
} from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { tokens } from '../tokens/tokens';

let _ImagePicker: any | null = null;
let _pickerLoaded: boolean | undefined;

function getImagePicker(): any | null {
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

export interface ImageWidgetProps {
  ref: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function ImageWidget({ ref, store, appearance: _appearance }: ImageWidgetProps) {
  const picker = getImagePicker();
  const resolved = store.adapter.resolveValue(ref);
  const uri: string | null =
    typeof resolved === 'string' && resolved.length > 0 ? resolved : null;
  const nodeState = store.adapter.getNodeState(ref);
  const readonly = nodeState.readonly;

  const [thumbnailUri, setThumbnailUri] = useState<string | null>(uri);

  const source: ImageSourcePropType | undefined = thumbnailUri
    ? { uri: thumbnailUri }
    : undefined;

  const handleResult = useCallback(
    (result: { canceled: boolean; assets?: Array<{ uri: string }> }) => {
      if (result.canceled || !result.assets?.[0]) return;
      const newUri = result.assets[0].uri;
      setThumbnailUri(newUri);
      store.answerQuestion(ref, newUri);
    },
    [ref, store],
  );

  const handleCamera = useCallback(async () => {
    if (!picker || readonly) return;
    const result = await picker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    handleResult(result);
  }, [picker, readonly, handleResult]);

  const handleLibrary = useCallback(async () => {
    if (!picker || readonly) return;
    const result = await picker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    handleResult(result);
  }, [picker, readonly, handleResult]);

  if (!picker) {
    return <UnsupportedWidget dataType="binary" />;
  }

  return (
    <View style={styles.container} testID="image-widget">
      {source && (
        <Image
          source={source}
          style={styles.thumbnail}
          testID="image-thumbnail"
          accessibilityLabel="Selected image"
        />
      )}
      <View style={styles.buttonRow}>
        <Pressable
          onPress={handleCamera}
          disabled={readonly}
          style={[styles.button, readonly && styles.buttonDisabled]}
          testID="image-camera-button"
        >
          <Text style={styles.buttonText}>Take Photo</Text>
        </Pressable>
        <Pressable
          onPress={handleLibrary}
          disabled={readonly}
          style={[styles.button, readonly && styles.buttonDisabled]}
          testID="image-library-button"
        >
          <Text style={styles.buttonText}>Pick from Library</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.sm },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.surface,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  button: {
    padding: tokens.spacing.sm,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: tokens.color.text, fontSize: tokens.font.sm },
});
