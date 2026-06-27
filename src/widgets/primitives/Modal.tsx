/**
 * AppModal — StyleSheet layout primitive (REQ-18).
 *
 * Wraps React Native core Modal with design-token styling.
 * No WebView, no third-party layout library. RN-core only.
 */

import {
  Modal,
  View,
  StyleSheet,
  type ViewStyle,
  type ModalProps,
} from 'react-native';
import { tokens } from '../../tokens/tokens';

export interface AppModalProps {
  visible: boolean;
  onRequestClose?: () => void;
  /** testID forwarded to the inner container View */
  testID?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
  animationType?: ModalProps['animationType'];
}

export function AppModal({
  visible,
  onRequestClose,
  testID,
  style,
  children,
  animationType = 'fade',
}: AppModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onRequestClose}
    >
      <View testID={testID} style={[styles.overlay, style]}>
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: `rgba(0,0,0,0.45)`,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.md,
  },
});
