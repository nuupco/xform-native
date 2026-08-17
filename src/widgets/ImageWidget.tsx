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
import { useThemedStyles, type Theme } from '../theme/ThemeContext';

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
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { gap: t.spacing.sm },
    thumbnail: {
      width: 120,
      height: 120,
      borderRadius: t.radius.sm,
      backgroundColor: t.color.surface,
    },
    buttonRow: {
      flexDirection: 'row' as const,
      gap: t.spacing.sm,
    },
    button: {
      padding: t.spacing.sm,
      backgroundColor: t.color.surface,
      borderRadius: t.radius.sm,
    },
    buttonDisabled: { opacity: 0.4 },
    buttonText: { color: t.color.text, fontSize: t.font.sm },
  });
}

export function ImageWidget({ nodeRef, store, appearance: _appearance }: ImageWidgetProps) {
  // Theming (D2): useThemedStyles MUST stay the first statement, before the
  // peer-dependency gating early return below, to preserve hook-order
  // stability (select-widgets-hook-order invariant).
  const styles = useThemedStyles(createStyles);
  const picker = getImagePicker();
  const resolved = store.adapter.resolveValue(nodeRef);
  const uri: string | null =
    typeof resolved === 'string' && resolved.length > 0 ? resolved : null;
  const nodeState = store.adapter.getNodeState(nodeRef);
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
      store.answerQuestion(nodeRef, newUri);
    },
    [nodeRef, store],
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

