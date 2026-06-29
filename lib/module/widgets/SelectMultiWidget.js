"use strict";

/**
 * SelectMultiWidget — renders a multi-select question (REQ-13, REQ-14).
 *
 * Value shape (ts-rosa codecs.ts:185-189, AnswerValue.ts:31):
 *   selectMulti value = readonly string[] (array of selected tokens).
 *   store.answerQuestion receives string[] directly.
 *
 * Variants (ADR-3 selectMulti):
 *   default  → checkbox list (Pressable per option)
 *   minimal  → bottom-sheet (P1 falls back to default; P2 can add sheet)
 *   others   → fall back to default (P1)
 */

import { useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { tokens } from "../tokens/tokens.js";
import { resolveVariant } from "./appearance.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SelectMultiWidget({
  ref,
  store,
  appearance
}) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(ref);
  const choices = store.adapter.getChoices(ref);
  const rawValue = store.adapter.resolveValue(ref);
  const isReadonly = nodeState?.readonly ?? false;
  const isRequired = nodeState?.required ?? false;
  resolveVariant('selectMulti', 'select', appearance); // resolves but default/minimal both render same in P1

  // Use a ref to track the current selections synchronously, avoiding stale-closure
  // issues with useState batching in React 19 when fireEvent fires multiple times.
  // The ref is initialized from resolveValue and updated on each toggle before commit.
  const rawArray = Array.isArray(rawValue) ? rawValue : [];
  const selectionsRef = useRef(rawArray);
  // Keep ref in sync with store value when it changes externally (store re-render path).
  if (JSON.stringify(selectionsRef.current) !== JSON.stringify(rawArray) && rawArray.length > 0) {
    selectionsRef.current = rawArray;
  }
  const selections = selectionsRef.current;
  function handleToggle(value) {
    if (isReadonly) return;
    const current = selectionsRef.current;
    let next;
    if (current.includes(value)) {
      next = current.filter(v => v !== value);
    } else {
      next = [...current, value];
    }
    selectionsRef.current = next;
    store.answerQuestion(ref, next);
  }
  return /*#__PURE__*/_jsxs(View, {
    style: styles.container,
    children: [isRequired && /*#__PURE__*/_jsx(Text, {
      testID: "required-indicator",
      style: styles.required,
      children: "*"
    }), choices.map(choice => {
      const isSelected = selections.includes(choice.value);
      return /*#__PURE__*/_jsxs(Pressable, {
        testID: `select-multi-option-${choice.value}`,
        style: [styles.option, isSelected && styles.optionSelected],
        onPress: () => handleToggle(choice.value),
        accessibilityRole: "checkbox",
        accessibilityState: {
          checked: isSelected,
          disabled: isReadonly
        },
        children: [/*#__PURE__*/_jsx(View, {
          style: [styles.checkbox, isSelected && styles.checkboxSelected],
          children: isSelected && /*#__PURE__*/_jsx(Text, {
            style: styles.checkmark,
            children: "\u2713"
          })
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
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: tokens.color.text,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxSelected: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primary
  },
  checkmark: {
    color: tokens.color.background,
    fontSize: tokens.font.sm,
    fontWeight: 'bold'
  }
});
//# sourceMappingURL=SelectMultiWidget.js.map