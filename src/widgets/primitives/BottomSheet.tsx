/**
 * BottomSheet — StyleSheet layout primitive (REQ-18).
 *
 * Layout pattern ported from expo-enketo-form's BottomSheetPicker:
 *   transparent Modal + bottom-anchored panel (justifyContent: 'flex-end').
 * Layout only — no bridge logic, no Expo deps, RN-core only.
 */

import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useThemedStyles, type Theme } from '../../theme/ThemeContext';
import { elevationStyle } from '../../theme/elevationStyle';

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

function createStyles(t: Theme) {
  return StyleSheet.create({
    keyboardAvoiding: {
      flex: 1,
    },
    overlay: {
      flex: 1,
      backgroundColor: t.color.roles.scrim,
      justifyContent: 'flex-end',
    },
    // design decision 11: surface + elevation 3 + radius.xl top corners.
    panel: {
      ...elevationStyle(t, 3, { direction: 'up' }),
      backgroundColor: t.color.roles.surface,
      borderTopLeftRadius: t.radius.xl,
      borderTopRightRadius: t.radius.xl,
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.md,
      paddingBottom: t.spacing.xl,
      maxHeight: PANEL_MAX_HEIGHT_PERCENT,
    },
    dragHandle: {
      alignSelf: 'center',
      width: 32,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.color.roles.outlineVariant,
      marginBottom: t.spacing.sm,
    },
  });
}

export function BottomSheet({ visible, onClose, children, testID }: BottomSheetProps) {
  const styles = useThemedStyles(createStyles);
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
        {/* Full-screen pressable overlay — tap outside panel to dismiss.
            The panel itself is a plain View (NOT a nested Pressable): a
            Pressable-inside-Pressable-inside-Pressable chain (overlay > panel
            > option rows) works fine with RNTL's fireEvent.press (which
            invokes onPress directly, bypassing responder negotiation) but on
            real Android devices the ancestor Pressables can win the touch
            responder negotiation, silently swallowing taps on the option rows
            — confirmed on-device: checkbox rows inside this sheet did not
            respond to taps at all. A non-interactive View doesn't compete for
            the responder, so touches pass through to whichever descendant
            Pressable actually claims them (the option rows), while taps on
            the panel's own empty padding still land on the overlay Pressable
            underneath and close the sheet — an acceptable trade-off. */}
        <Pressable style={styles.overlay} onPress={onClose}>
          <View style={styles.panel} testID={testID}>
            <View
              testID={testID ? `${testID}-drag-handle` : undefined}
              style={styles.dragHandle}
            />
            <ScrollView
              testID={testID ? `${testID}-scroll` : undefined}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
