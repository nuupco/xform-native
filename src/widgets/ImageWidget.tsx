/**
 * ImageWidget — binary image capture/pick (REQ-M03..M06).
 *
 * Gated on expo-image-picker (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 */
import { useCallback, useState } from 'react';
import { Text, Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import { MediaCaptureCard } from './primitives/MediaCaptureCard';

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
    thumbnail: {
      width: 120,
      height: 120,
      borderRadius: t.radius.sm,
      backgroundColor: t.color.roles.surfaceVariant,
    },
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
    <MediaCaptureCard
      testID="image-widget"
      state={source ? 'captured' : 'empty'}
      icon={<Text>📷</Text>}
      title="No photo yet"
      disabled={readonly}
      preview={
        source && (
          <Image
            source={source}
            style={styles.thumbnail}
            testID="image-thumbnail"
            accessibilityLabel="Selected image"
          />
        )
      }
      actions={[
        { label: 'Take Photo', onPress: handleCamera, testID: 'image-camera-button' },
        { label: 'Pick from Library', onPress: handleLibrary, testID: 'image-library-button' },
      ]}
    />
  );
}

