"use strict";

/**
 * RangeWidget — renders a range/numeric stepper (REQ-13, controlType=range).
 *
 * RN-core only — no @react-native-community/slider (ZERO native deps constraint).
 * Implemented as a stepper (decrement/value display/increment) using Pressable + Text.
 *
 * Range bounds (start/end/step): ts-rosa FormElement (FormElement.ts) has NO dedicated
 * range bound fields on the FormElement union — the 'question' kind carries only
 * controlType, binding, choices, appearance, etc. Range bounds are NOT accessible via
 * ts-rosa at the FormElement level. Resolution strategy:
 *   - Accept start/end/step as optional props (caller passes them from the XForm definition
 *     when available, e.g. parsed from the raw body element attributes).
 *   - Sane defaults: start=0, end=10, step=1 when props are absent.
 *   - This is documented as a P2 improvement: expose range bounds through FormElement/adapter.
 *
 * Value shape: numeric (number). ts-rosa range uses underlying int/decimal dataType.
 *   store.answerQuestion receives the number directly.
 *
 * Variants (ADR-3 controlType:range):
 *   default   → horizontal stepper (−  value  +)
 *   no-ticks  → stepper without value text display
 *   picker    → BottomSheet picker with scrollable list of values
 *   vertical  → vertical stepper layout
 *   rating    → row of 1..N touch-to-select stars, N = end - start + 1
 *               (falls back to 5 stars when start/end are absent, matching
 *               this widget's existing start=0/end=10 default-prop story)
 */

import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import { useFormSession } from "../store/useFormSession.js";
import { useThemedStyles } from "../theme/ThemeContext.js";
import { createFieldStyles } from "./primitives/fieldStyles.js";
import { MinusIcon, PlusIcon } from "./primitives/Icon.js";
import { resolveVariant } from "./engine/appearance.js";
import { BottomSheet } from "./primitives/BottomSheet.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function RangeWidget({
  nodeRef,
  store,
  appearance,
  start: startProp,
  end: endProp,
  step = 1
}) {
  const styles = useThemedStyles(createStyles);
  useFormSession(store);
  const [pickerOpen, setPickerOpen] = useState(false);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const rawValue = store.adapter.resolveValue(nodeRef);
  const variant = resolveVariant('int', 'range', appearance);
  const isReadonly = nodeState?.readonly ?? false;
  const start = startProp ?? 0;
  const end = endProp ?? 10;

  // Normalize current value to a number, default to start if null
  const currentValue = typeof rawValue === 'number' ? rawValue : start;
  function handleDecrement() {
    if (isReadonly) return;
    const next = currentValue - step;
    if (next < start) return; // at lower bound — no-op
    store.answerQuestion(nodeRef, next);
  }
  function handleIncrement() {
    if (isReadonly) return;
    const next = currentValue + step;
    if (next > end) return; // at upper bound — no-op
    store.answerQuestion(nodeRef, next);
  }
  function handlePickValue(value) {
    if (isReadonly) return;
    store.answerQuestion(nodeRef, value);
    setPickerOpen(false);
  }

  // Generate picker options from start to end by step
  const pickerOptions = [];
  for (let v = start; v <= end; v += step) {
    pickerOptions.push(v);
  }
  const isVertical = variant === 'vertical';
  const isNoTicks = variant === 'no-ticks';
  const isPicker = variant === 'picker';
  const isRating = variant === 'rating';
  function handleRate(value) {
    if (isReadonly) return;
    store.answerQuestion(nodeRef, value);
  }
  if (isRating) {
    const starCount = startProp != null && endProp != null ? endProp - startProp + 1 : 5;
    const ratingBase = startProp ?? 1;
    const stars = Array.from({
      length: starCount
    }, (_, i) => ratingBase + i);
    return /*#__PURE__*/_jsx(View, {
      style: styles.container,
      children: /*#__PURE__*/_jsx(View, {
        testID: "range-rating",
        style: styles.ratingRow,
        children: stars.map(value => {
          const filled = currentValue >= value;
          return /*#__PURE__*/_jsx(Pressable, {
            testID: `range-rating-star-${value}`,
            onPress: () => handleRate(value),
            disabled: isReadonly,
            style: isReadonly && styles.disabled,
            accessibilityRole: "button",
            accessibilityState: {
              selected: filled,
              disabled: isReadonly
            },
            children: /*#__PURE__*/_jsx(Text, {
              style: filled ? styles.ratingStarFilled : styles.ratingStarEmpty,
              children: filled ? '★' : '☆'
            })
          }, value);
        })
      })
    });
  }
  if (isPicker) {
    return /*#__PURE__*/_jsxs(View, {
      style: styles.container,
      children: [/*#__PURE__*/_jsx(Pressable, {
        testID: "range-picker-trigger",
        style: [styles.pickerTrigger, isReadonly && styles.disabled],
        onPress: () => setPickerOpen(true),
        disabled: isReadonly,
        children: /*#__PURE__*/_jsx(Text, {
          style: styles.pickerTriggerText,
          children: String(currentValue)
        })
      }), /*#__PURE__*/_jsx(BottomSheet, {
        visible: pickerOpen,
        onClose: () => setPickerOpen(false),
        testID: "range-picker-sheet",
        children: /*#__PURE__*/_jsx(ScrollView, {
          children: pickerOptions.map(opt => /*#__PURE__*/_jsx(Pressable, {
            testID: `range-picker-option-${opt}`,
            style: styles.pickerOption,
            onPress: () => handlePickValue(opt),
            children: /*#__PURE__*/_jsx(Text, {
              style: styles.pickerOptionText,
              children: String(opt)
            })
          }, opt))
        })
      })]
    });
  }
  return /*#__PURE__*/_jsx(View, {
    style: styles.container,
    children: /*#__PURE__*/_jsxs(View, {
      testID: "range-stepper",
      style: [styles.stepper, isVertical && styles.stepperVertical],
      children: [/*#__PURE__*/_jsx(Pressable, {
        testID: "range-decrement",
        style: [styles.stepButton, isReadonly && styles.disabled],
        onPress: handleDecrement,
        accessibilityLabel: "Decrease value",
        disabled: isReadonly,
        children: /*#__PURE__*/_jsx(MinusIcon, {
          testID: "range-decrement-icon"
        })
      }), !isNoTicks && /*#__PURE__*/_jsx(View, {
        testID: "range-value-display",
        style: styles.valueContainer,
        children: /*#__PURE__*/_jsx(Text, {
          testID: "range-value-text",
          style: styles.valueText,
          children: String(currentValue)
        })
      }), /*#__PURE__*/_jsx(Pressable, {
        testID: "range-increment",
        style: [styles.stepButton, isReadonly && styles.disabled],
        onPress: handleIncrement,
        accessibilityLabel: "Increase value",
        disabled: isReadonly,
        children: /*#__PURE__*/_jsx(PlusIcon, {
          testID: "range-increment-icon"
        })
      })]
    })
  });
}
function createStyles(t) {
  const f = createFieldStyles(t);
  return StyleSheet.create({
    container: {
      marginVertical: t.spacing.xs
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: t.spacing.sm
    },
    stepperVertical: {
      flexDirection: 'column'
    },
    stepButton: {
      width: 48,
      height: 48,
      borderWidth: 1,
      borderColor: t.color.roles.outline,
      borderRadius: t.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.color.roles.surface
    },
    disabled: {
      opacity: t.disabled.contentOpacity
    },
    // RN 0.85 Fabric: padding must not share a node with centering/minWidth (collapses Text)
    valueContainer: {
      minWidth: 60,
      alignItems: 'center',
      justifyContent: 'center'
    },
    valueText: {
      ...t.typography.mono,
      color: t.color.roles.onSurface
    },
    // RN 0.85 Fabric: padding must not share a node with centering/minWidth (collapses Text)
    pickerTrigger: {
      ...f.field,
      height: 48,
      justifyContent: 'center',
      alignSelf: 'flex-start',
      minWidth: 80
    },
    pickerTriggerText: {
      ...f.fieldNumeric,
      textAlign: 'center'
    },
    pickerOption: {
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: t.color.roles.outlineVariant
    },
    pickerOptionText: {
      ...f.fieldText,
      textAlign: 'center'
    },
    ratingRow: {
      flexDirection: 'row',
      gap: t.spacing.xs,
      alignSelf: 'flex-start'
    },
    ratingStarFilled: {
      fontSize: 32,
      color: t.color.roles.primary
    },
    ratingStarEmpty: {
      fontSize: 32,
      color: t.color.roles.outline
    }
  });
}
//# sourceMappingURL=RangeWidget.js.map