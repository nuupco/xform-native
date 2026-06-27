/**
 * BottomSheet — StyleSheet layout primitive (REQ-18).
 *
 * Layout pattern ported from expo-enketo-form's BottomSheetPicker:
 *   transparent Modal + bottom-anchored panel (justifyContent: 'flex-end').
 * Layout only — no bridge logic, no Expo deps, RN-core only.
 */

import { Modal, Pressable, StyleSheet } from 'react-native';
import { tokens } from '../../tokens/tokens';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  testID?: string;
}

export function BottomSheet({ visible, onClose, children, testID }: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Full-screen pressable overlay — tap outside panel to dismiss */}
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Inner pressable stops propagation so tapping inside panel doesn't dismiss */}
        <Pressable style={styles.panel} testID={testID} onPress={() => {}}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: tokens.color.background,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl,
  },
});
