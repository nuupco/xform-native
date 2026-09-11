"use strict";

/**
 * TriggerWidget — acknowledge/toggle control for controlType 'trigger'.
 *
 * Restyled per Phase 3 spec: `tertiaryContainer` container card, 24dp
 * checkbox + `bodyLarge` text, entire card tappable. Checked state adds a
 * 2px `tertiary` border and a filled check (`CheckIcon`).
 *
 * Commits the string sentinel 'OK' when tapped while unset, and clears the
 * answer to null when tapped while already 'OK' (toggleable, not one-way).
 */

import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { useThemedStyles, useTheme } from "../theme/ThemeContext.js";
import { CheckIcon } from "./primitives/Icon.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function createStyles(t) {
  return StyleSheet.create({
    container: {
      marginVertical: t.spacing.xs
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      padding: t.spacing.md,
      borderRadius: t.radius.md,
      backgroundColor: t.color.roles.tertiaryContainer,
      borderWidth: 0
    },
    cardChecked: {
      borderWidth: 2,
      borderColor: t.color.roles.tertiary
    },
    checkboxIndicator: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: t.color.roles.tertiary,
      borderRadius: t.radius.sm,
      alignItems: 'center',
      justifyContent: 'center'
    },
    checkboxChecked: {
      backgroundColor: t.color.roles.tertiary,
      borderColor: t.color.roles.tertiary
    },
    label: {
      ...t.typography.bodyLarge,
      color: t.color.roles.onTertiaryContainer,
      flex: 1
    },
    disabled: {
      opacity: t.disabled.contentOpacity
    }
  });
}
export function TriggerWidget({
  nodeRef,
  store
}) {
  const styles = useThemedStyles(createStyles);
  const t = useTheme();
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const value = store.adapter.resolveValue(nodeRef);
  const isChecked = value === 'OK';
  const isReadonly = nodeState?.readonly ?? false;
  function handlePress() {
    if (isReadonly) return;
    store.answerQuestion(nodeRef, isChecked ? null : 'OK');
  }
  return /*#__PURE__*/_jsx(View, {
    style: styles.container,
    children: /*#__PURE__*/_jsxs(Pressable, {
      testID: "trigger-checkbox",
      style: [styles.card, isChecked && styles.cardChecked, isReadonly && styles.disabled],
      onPress: handlePress,
      accessibilityRole: "checkbox",
      accessibilityLabel: "Acknowledge",
      accessibilityState: {
        checked: isChecked,
        disabled: isReadonly
      },
      children: [/*#__PURE__*/_jsx(View, {
        style: [styles.checkboxIndicator, isChecked && styles.checkboxChecked],
        children: isChecked && /*#__PURE__*/_jsx(CheckIcon, {
          size: 16,
          color: t.color.roles.onTertiary,
          theme: t
        })
      }), /*#__PURE__*/_jsx(Text, {
        testID: "trigger-label",
        style: styles.label,
        children: "Acknowledge"
      })]
    })
  });
}
//# sourceMappingURL=TriggerWidget.js.map