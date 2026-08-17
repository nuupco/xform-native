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
  /**
   * Opt out of the centered-dialog overlay (justifyContent: 'center' +
   * shrink-to-fit inset with padding) in favor of an unbounded flex:1
   * container that fills the whole screen edge-to-edge. Use for content
   * that itself needs the full screen (e.g. a full-screen map) — a child
   * `flex:1` has nothing to flex into inside the default centered dialog
   * (which has no explicit height), so it collapses to near-zero height.
   */
  fullScreen?: boolean;
}

export function AppModal({
  visible,
  onRequestClose,
  testID,
  style,
  children,
  animationType = 'fade',
  fullScreen = false,
}: AppModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onRequestClose}
    >
      <View
        testID={testID}
        style={[fullScreen ? styles.fullScreenOverlay : styles.overlay, style]}
      >
        {fullScreen ? children : <View style={styles.inset}>{children}</View>}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // RN 0.85 Fabric: padding must not share a node with centering/minWidth (collapses Text)
  // Edge inset lives on an inner wrapper so the centering node carries no padding.
  overlay: {
    flex: 1,
    backgroundColor: `rgba(0,0,0,0.45)`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inset: {
    width: '100%',
    padding: tokens.spacing.md,
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: 'black',
  },
});
