"use strict";

/**
 * NavRow — pinned bottom navigation chrome (Back/Next, or Back/Finalizar on
 * the last step), design decisions 1/2/9.
 *
 * Pinned to bottom with an elevation-2 "upward" shadow (`elevationStyle(t, 2,
 * {direction:'up'})`) plus a 1px `outlineVariant` hairline separating it from
 * scroll content — the hairline is the cross-platform separator since
 * Android's `elevation` cannot point upward (decision 2). Back is a ghost
 * (`variant:'text'`) PressableButton; Next is filled `roles.primary` unless
 * `isLastStep`, in which case it renders "Finalizar" in `tone:'secondary'`
 * (gold) per decision 9. `Form.tsx` does not yet wire `isLastStep` (PR3
 * follow-up) — this component's own finish-variant rendering is complete and
 * tested here regardless.
 */
import { View, StyleSheet } from 'react-native';
import { useThemedStyles } from "../theme/ThemeContext.js";
import { elevationStyle } from "../theme/elevationStyle.js";
import { PressableButton } from "../widgets/primitives/PressableButton.js";
import { SafeAreaBottom } from "../widgets/primitives/SafeAreaBottom.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function createStyles(t) {
  return StyleSheet.create({
    row: {
      ...elevationStyle(t, 2, {
        direction: 'up'
      }),
      borderTopWidth: 1,
      borderTopColor: t.color.roles.outlineVariant,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: t.spacing.md
    }
  });
}
export function NavRow({
  onBack,
  onNext,
  isLastStep,
  backDisabled,
  nextDisabled
}) {
  const styles = useThemedStyles(createStyles);
  return /*#__PURE__*/_jsx(SafeAreaBottom, {
    children: /*#__PURE__*/_jsxs(View, {
      testID: "nav-row",
      style: styles.row,
      collapsable: false,
      children: [/*#__PURE__*/_jsx(PressableButton, {
        testID: "nav-back",
        label: "Atr\xE1s",
        variant: "text",
        onPress: onBack,
        disabled: backDisabled,
        height: 48
      }), /*#__PURE__*/_jsx(PressableButton, {
        testID: "nav-next",
        label: isLastStep ? 'Finalizar' : 'Siguiente',
        variant: "filled",
        tone: isLastStep ? 'secondary' : 'primary',
        onPress: onNext,
        disabled: nextDisabled,
        height: 48
      })]
    })
  });
}
//# sourceMappingURL=NavRow.js.map