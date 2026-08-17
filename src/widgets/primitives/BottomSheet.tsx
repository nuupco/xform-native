/**
 * BottomSheet — StyleSheet layout primitive (REQ-18).
 *
 * Layout pattern ported from expo-enketo-form's BottomSheetPicker:
 *   transparent Modal + bottom-anchored panel (justifyContent: 'flex-end').
 * Layout only — no bridge logic, no Expo deps, RN-core only.
 */

import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { tokens } from '../../tokens/tokens';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  testID?: string;
}

// Panel is anchored to the bottom of the screen (overlay: justifyContent:
// 'flex-end'). Without a cap, a long options list (100+ choices) makes the
// panel grow taller than the screen; since it's bottom-anchored, the TOP of
// the panel (including the search box in minimal-autocomplete) is pushed
// off-screen with no way to scroll to it. Bounding height + wrapping
// children in a ScrollView keeps the whole panel on-screen with its own
// internal scroll.
const PANEL_MAX_HEIGHT_PERCENT = '75%';

export function BottomSheet({ visible, onClose, children, testID }: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Shifts the bottom-anchored overlay/panel above the keyboard instead
          of leaving a short (few-results) panel anchored to the screen
          bottom, where the keyboard now sits and hides it. */}
      <KeyboardAvoidingView
        testID={testID ? `${testID}-keyboard-avoiding` : undefined}
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Full-screen pressable overlay — tap outside panel to dismiss */}
        <Pressable style={styles.overlay} onPress={onClose}>
          {/* Inner pressable stops propagation so tapping inside panel doesn't dismiss */}
          <Pressable style={styles.panel} testID={testID} onPress={() => {}}>
            <ScrollView
              testID={testID ? `${testID}-scroll` : undefined}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
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
    maxHeight: PANEL_MAX_HEIGHT_PERCENT,
  },
});
