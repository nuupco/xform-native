"use strict";

/**
 * BooleanWidget — boolean input (REQ-13).
 *
 * ODK Collect has no boolean appearance variants — always the same control.
 * default → SegmentedButton (Sí/No), replaces the native `Switch` (design
 *   decision 5): `Switch` is native-rendered (only tintable, not M3-shaped)
 *   and its ~30dp thumb fails the glove-use target. `testID="boolean-switch"`
 *   is preserved on the container as a compatibility contract.
 *
 * Unanswered state maps to SegmentedButton's `value: null`, so it is visually
 * distinct from an explicit "No" — neither segment renders as selected.
 */

import { View, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { useThemedStyles } from "../theme/ThemeContext.js";
import { SegmentedButton } from "./primitives/SegmentedButton.js";
import { jsx as _jsx } from "react/jsx-runtime";
function createStyles(t) {
  return StyleSheet.create({
    container: {
      marginVertical: t.spacing.xs
      // No flexDirection: 'row' here — the single SegmentedButton child has
      // no width of its own (its two Pressables are flex: 1), so a row
      // parent gives it zero main-axis size to distribute. Default column
      // layout's stretch cross-axis gives it the full container width.
    },
    disabled: {
      opacity: t.disabled.contentOpacity
    }
  });
}

/** Maps the resolved store value to the SegmentedButton's tri-state value. */
function toSegmentValue(value) {
  if (value === true || value === 'true' || value === '1') return 'true';
  if (value === false || value === 'false' || value === '0') return 'false';
  return null;
}
const BOOLEAN_OPTIONS = [{
  value: 'true',
  label: 'Sí'
}, {
  value: 'false',
  label: 'No'
}];
export function BooleanWidget({
  nodeRef,
  store
}) {
  const styles = useThemedStyles(createStyles);
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const value = store.adapter.resolveValue(nodeRef);
  const isReadonly = nodeState?.readonly ?? false;
  function handleChange(newValue) {
    if (isReadonly) return;
    store.answerQuestion(nodeRef, newValue);
  }
  return /*#__PURE__*/_jsx(View, {
    style: styles.container,
    children: /*#__PURE__*/_jsx(SegmentedButton, {
      testID: "boolean-switch",
      options: BOOLEAN_OPTIONS,
      value: toSegmentValue(value),
      onChange: segment => handleChange(segment === 'true'),
      disabled: isReadonly
    })
  });
}
//# sourceMappingURL=BooleanWidget.js.map