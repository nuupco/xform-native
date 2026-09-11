"use strict";

/**
 * DecimalWidget — decimal (float) input (REQ-13).
 *
 * Parses input via parseFloat. Draft-vs-committed-store separation
 * delegated to useDraftValue (widget-draft-value); trailing "." / lone
 * "-" are held as an uncommitted draft rather than truncated or rejected.
 */

import { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { resolveVariant } from "./engine/appearance.js";
import { useDraftValue } from "./engine/useDraftValue.js";
import { useThemedStyles } from "../theme/ThemeContext.js";
import { createFieldStyles } from "./primitives/fieldStyles.js";
import { jsx as _jsx } from "react/jsx-runtime";
function createStyles(t) {
  const f = createFieldStyles(t);
  return StyleSheet.create({
    container: {
      marginVertical: t.spacing.xs
    },
    input: {
      ...f.field,
      ...f.fieldNumeric,
      textAlign: 'left'
    },
    focused: f.fieldFocused,
    readonly: f.fieldDisabled
  });
}
export function DecimalWidget({
  nodeRef,
  store,
  appearance
}) {
  const styles = useThemedStyles(createStyles);
  useFormSession(store);
  const [focused, setFocused] = useState(false);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const value = store.adapter.resolveValue(nodeRef);
  const variant = resolveVariant('decimal', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;
  function parse(text) {
    const s = text.replace(/,/g, '').trim();
    if (s === '') return {
      committable: true,
      value: null
    };
    if (/^-?\d+(\.\d+)?$/.test(s)) return {
      committable: true,
      value: parseFloat(s)
    };
    return {
      committable: false,
      value: null
    };
  }
  function format(raw) {
    return variant === 'thousands-sep' && raw !== '' ? Number(raw).toLocaleString('en-US') : raw;
  }
  const draft = useDraftValue({
    storeValue: value,
    commit: v => store.answerQuestion(nodeRef, v),
    parse,
    format,
    readonly: isReadonly
  });
  return /*#__PURE__*/_jsx(View, {
    style: styles.container,
    children: /*#__PURE__*/_jsx(TextInput, {
      testID: "decimal-input",
      style: [styles.input, focused && !isReadonly && styles.focused, isReadonly && styles.readonly],
      value: draft.value,
      onChangeText: draft.onChangeText,
      editable: !isReadonly,
      keyboardType: "decimal-pad",
      onFocus: () => {
        setFocused(true);
        draft.onFocus();
      },
      onBlur: () => {
        setFocused(false);
        draft.onBlur();
      }
    })
  });
}
//# sourceMappingURL=DecimalWidget.js.map