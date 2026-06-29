"use strict";

/**
 * SelectOneWidget — renders a single-select question (REQ-13, REQ-14).
 *
 * Value shape (ts-rosa codecs.ts:180-183, AnswerValue.ts:30):
 *   selectOne value = string (a single choice token).
 *   store.answerQuestion receives the token string directly.
 *
 * Variants (ADR-3 selectOne):
 *   default  → radio-style list (Pressable per option)
 *   minimal  → bottom-sheet dropdown (BottomSheet primitive)
 *   likert / autocomplete / columns / columns-pack / quick → fall back to default (P1)
 */

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { tokens } from "../tokens/tokens.js";
import { resolveVariant } from "./appearance.js";
import { BottomSheet } from "./primitives/BottomSheet.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SelectOneWidget({
  ref,
  store,
  appearance
}) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(ref);
  const choices = store.adapter.getChoices(ref);
  const currentValue = store.adapter.resolveValue(ref);
  const variant = resolveVariant('selectOne', 'select1', appearance);
  const isReadonly = nodeState?.readonly ?? false;
  const isRequired = nodeState?.required ?? false;
  const [sheetOpen, setSheetOpen] = useState(false);
  function handleSelect(value) {
    if (isReadonly) return;
    store.answerQuestion(ref, value);
    setSheetOpen(false);
  }
  if (variant === 'minimal') {
    // Bottom-sheet dropdown variant
    const selected = choices.find(c => c.value === currentValue);
    return /*#__PURE__*/_jsxs(View, {
      style: styles.container,
      children: [isRequired && /*#__PURE__*/_jsx(Text, {
        testID: "required-indicator",
        style: styles.required,
        children: "*"
      }), /*#__PURE__*/_jsx(Pressable, {
        testID: "select-one-dropdown-trigger",
        style: styles.dropdownTrigger,
        onPress: () => !isReadonly && setSheetOpen(true),
        accessible: !isReadonly,
        children: /*#__PURE__*/_jsx(Text, {
          style: styles.dropdownTriggerText,
          children: selected?.label ?? selected?.value ?? 'Select…'
        })
      }), /*#__PURE__*/_jsx(BottomSheet, {
        visible: sheetOpen,
        onClose: () => setSheetOpen(false),
        children: choices.map(choice => /*#__PURE__*/_jsx(Pressable, {
          testID: `select-one-option-${choice.value}`,
          style: styles.option,
          onPress: () => handleSelect(choice.value),
          children: /*#__PURE__*/_jsx(Text, {
            style: styles.optionLabel,
            children: choice.label ?? choice.value
          })
        }, choice.value))
      })]
    });
  }

  // default (radio-style) — also handles likert, autocomplete, columns fallback
  return /*#__PURE__*/_jsxs(View, {
    style: styles.container,
    children: [isRequired && /*#__PURE__*/_jsx(Text, {
      testID: "required-indicator",
      style: styles.required,
      children: "*"
    }), choices.map(choice => {
      const isSelected = choice.value === currentValue;
      return /*#__PURE__*/_jsxs(Pressable, {
        testID: `select-one-option-${choice.value}`,
        style: [styles.option, isSelected && styles.optionSelected],
        onPress: () => handleSelect(choice.value),
        accessibilityRole: "radio",
        accessibilityState: {
          checked: isSelected,
          disabled: isReadonly
        },
        children: [/*#__PURE__*/_jsx(View, {
          style: [styles.radio, isSelected && styles.radioSelected]
        }), /*#__PURE__*/_jsx(Text, {
          style: styles.optionLabel,
          children: choice.label ?? choice.value
        })]
      }, choice.value);
    })]
  });
}
const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.spacing.xs
  },
  required: {
    color: tokens.color.error,
    fontSize: tokens.font.sm
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
    marginVertical: 2,
    borderRadius: tokens.radius.sm
  },
  optionSelected: {
    backgroundColor: tokens.color.surface
  },
  optionLabel: {
    fontSize: tokens.font.md,
    color: tokens.color.text,
    marginLeft: tokens.spacing.sm
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: tokens.color.text
  },
  radioSelected: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primary
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: tokens.color.text,
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.sm,
    backgroundColor: tokens.color.background
  },
  dropdownTriggerText: {
    fontSize: tokens.font.md,
    color: tokens.color.text
  }
});
//# sourceMappingURL=SelectOneWidget.js.map