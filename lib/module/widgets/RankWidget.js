"use strict";

/**
 * RankWidget — reorder control for controlType 'rank'.
 *
 * Value shape: same order-preserving `string[]` codec as SelectMultiWidget
 * (dataType 'selectMulti'). Display order is a pure function of the store,
 * derived fresh on every render — no local ordering state, no useEffect
 * (rank-widget-support ADR-B1). `store.answerQuestion` is called ONLY from
 * the reorder handler, never on mount.
 *
 * Spec (Rank Widget requirement): position number in a `primaryContainer`
 * circle (left), item text (center), grip icon as the drag handle (right).
 * While a row is being lifted: elevation 3, scale 1.02, pure `surface`
 * background. On drop: 200ms ease-in-out settle animation.
 *
 * Deviation: the grip is a Pressable onPressIn/onPressOut affordance driving
 * the lift visual state (elevation/scale/background); there is no gesture
 * or drag library available in this codebase (Phase 2 precedent: RN
 * `Animated` only, no Reanimated/gesture-handler — design doc's
 * `SelectionRow` `control:'none'` deferral note), so pointer-tracked
 * position-swapping mid-drag is out of scope for this PR. The actual
 * reorder commit still goes through the existing up/down buttons
 * (`rank-up-*`/`rank-down-*`), unchanged, preserving the regression suite.
 */

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, Text, Pressable, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { useTheme, useThemedStyles } from "../theme/ThemeContext.js";
import { elevationStyle } from "../theme/elevationStyle.js";
import { GripIcon } from "./primitives/Icon.js";
import { MarkdownText } from "../text/MarkdownText.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Reconcile `choices` (the full, authoritative set) against `tokens` (a
 * possibly partial/stale committed order): choices named by tokens come
 * first (in token order, de-duped, unknown tokens skipped), followed by any
 * remaining choices not covered by tokens. Result always contains every
 * choice exactly once (ADR-B2) — guards against ever rendering/committing a
 * partial ranking.
 */
function orderByTokens(choices, tokens) {
  const byValue = new Map(choices.map(c => [c.value, c]));
  const seen = new Set();
  const ordered = [];
  for (const token of tokens) {
    const choice = byValue.get(token);
    if (choice && !seen.has(token)) {
      ordered.push(choice);
      seen.add(token);
    }
  }
  for (const choice of choices) {
    if (!seen.has(choice.value)) {
      ordered.push(choice);
    }
  }
  return ordered;
}
function createStyles(t) {
  return StyleSheet.create({
    container: {
      marginVertical: t.spacing.xs
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
      marginVertical: t.spacing.xxs,
      paddingHorizontal: t.spacing.sm,
      borderRadius: t.radius.sm,
      backgroundColor: t.color.roles.surface
    },
    rowAlt: {
      backgroundColor: t.color.roles.surfaceVariant
    },
    positionCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.color.roles.primaryContainer
    },
    positionText: {
      ...t.typography.labelMedium,
      color: t.color.roles.onPrimaryContainer
    },
    label: {
      ...t.typography.bodyLarge,
      color: t.color.roles.onSurface,
      flex: 1,
      marginHorizontal: t.spacing.sm
    },
    grip: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center'
    },
    controls: {
      flexDirection: 'row',
      gap: t.spacing.sm
    },
    button: {
      width: 32,
      height: 32,
      borderWidth: 2,
      borderColor: t.color.roles.outline,
      borderRadius: t.radius.sm,
      alignItems: 'center',
      justifyContent: 'center'
    },
    glyph: {
      color: t.color.roles.onSurface,
      ...t.typography.bodyLarge
    },
    disabled: {
      opacity: t.disabled.contentOpacity
    }
  });
}

/** One rank row — owns its own lift/scale animation via the grip handle. */
function RankRow({
  choice,
  index,
  isAlt,
  isFirst,
  isLast,
  isReadonly,
  onMove,
  styles,
  theme
}) {
  const [lifted, setLifted] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(scale, {
      toValue: lifted ? 1.02 : 1,
      duration: lifted ? 0 : 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true
    }).start();
  }, [lifted, scale]);
  const liftedStyle = lifted ? {
    ...elevationStyle(theme, 3, {
      tintOver: theme.color.roles.surface
    })
  } : null;
  const upDisabled = isReadonly || isFirst;
  const downDisabled = isReadonly || isLast;
  return /*#__PURE__*/_jsxs(Animated.View, {
    testID: `rank-option-${choice.value}`,
    style: [styles.row, isAlt && !lifted && styles.rowAlt, liftedStyle, {
      transform: [{
        scale
      }]
    }],
    children: [/*#__PURE__*/_jsx(View, {
      style: styles.positionCircle,
      children: /*#__PURE__*/_jsx(Text, {
        testID: `rank-position-${choice.value}`,
        style: styles.positionText,
        children: index + 1
      })
    }), /*#__PURE__*/_jsx(MarkdownText, {
      value: choice.label ?? choice.value,
      baseStyle: styles.label
    }), /*#__PURE__*/_jsxs(View, {
      style: styles.controls,
      children: [/*#__PURE__*/_jsx(Pressable, {
        testID: `rank-up-${choice.value}`,
        style: [styles.button, upDisabled && styles.disabled],
        onPress: () => onMove(index, -1),
        accessibilityRole: "button",
        accessibilityLabel: "Move up",
        accessibilityState: {
          disabled: upDisabled
        },
        children: /*#__PURE__*/_jsx(Text, {
          style: styles.glyph,
          children: "\u2191"
        })
      }), /*#__PURE__*/_jsx(Pressable, {
        testID: `rank-down-${choice.value}`,
        style: [styles.button, downDisabled && styles.disabled],
        onPress: () => onMove(index, 1),
        accessibilityRole: "button",
        accessibilityLabel: "Move down",
        accessibilityState: {
          disabled: downDisabled
        },
        children: /*#__PURE__*/_jsx(Text, {
          style: styles.glyph,
          children: "\u2193"
        })
      })]
    }), /*#__PURE__*/_jsx(Pressable, {
      testID: `rank-grip-${choice.value}`,
      style: styles.grip,
      onPressIn: () => setLifted(true),
      onPressOut: () => setLifted(false),
      accessibilityRole: "adjustable",
      accessibilityLabel: "Drag to reorder",
      children: /*#__PURE__*/_jsx(GripIcon, {
        testID: `rank-grip-icon-${choice.value}`
      })
    })]
  });
}
export function RankWidget({
  nodeRef,
  store
}) {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const choices = store.adapter.getChoices(nodeRef);
  const committed = store.adapter.resolveValue(nodeRef);
  const isReadonly = nodeState?.readonly ?? false;
  const ordered = Array.isArray(committed) && committed.length > 0 ? orderByTokens(choices, committed) : [...choices];
  function handleMove(index, dir) {
    if (isReadonly) return;
    const target = index + dir;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    store.answerQuestion(nodeRef, next.map(c => c.value));
  }
  return /*#__PURE__*/_jsx(View, {
    style: styles.container,
    children: ordered.map((choice, index) => /*#__PURE__*/_jsx(RankRow, {
      choice: choice,
      index: index,
      isAlt: index % 2 === 1,
      isFirst: index === 0,
      isLast: index === ordered.length - 1,
      isReadonly: isReadonly,
      onMove: handleMove,
      styles: styles,
      theme: theme
    }, choice.value))
  });
}
//# sourceMappingURL=RankWidget.js.map