"use strict";

/**
 * IntWidget — integer input (REQ-13).
 *
 * Draft-vs-committed-store separation delegated to useDraftValue
 * (widget-draft-value). Parse predicate rejects decimal points and lone
 * `-` rather than truncating/rejecting silently.
 *
 * `bearing` variant is gated on expo-sensors' Magnetometer (optional peer
 * dep, same lazy-require gating pattern as expo-camera/expo-image-picker —
 * see ImageWidget/VideoWidget). When absent, falls back to the plain
 * numeric TextInput — never crashes.
 */

import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { resolveVariant } from "./engine/appearance.js";
import { useDraftValue } from "./engine/useDraftValue.js";
import { useThemedStyles } from "../theme/ThemeContext.js";
import { createFieldStyles } from "./primitives/fieldStyles.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
let _Sensors = null;
let _sensorsLoaded;
function getSensors() {
  if (_sensorsLoaded === undefined) {
    try {
      _Sensors = require('expo-sensors');
      _sensorsLoaded = true;
    } catch {
      _Sensors = null;
      _sensorsLoaded = false;
    }
  }
  return _Sensors;
}

/** Magnetometer {x,y,z} field readout → compass heading in degrees [0,360). */
function headingFromMagnetometer(data) {
  let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
  angle = 90 - angle;
  if (angle < 0) angle += 360;
  return Math.round(angle) % 360;
}
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
    readonly: f.fieldDisabled,
    bearingRow: {
      ...f.fieldRow,
      marginTop: t.spacing.xs
    },
    bearingReadout: {
      ...t.typography.mono,
      color: t.color.roles.onSurface,
      flex: 1
    },
    bearingButton: f.fieldAffordance,
    bearingButtonText: {
      ...t.typography.labelLarge,
      color: t.color.roles.primary
    },
    counterRow: {
      ...f.fieldRow,
      justifyContent: 'center'
    },
    counterButton: f.fieldAffordance,
    counterButtonText: {
      ...t.typography.titleLarge,
      color: t.color.roles.primary
    },
    counterValue: {
      ...t.typography.headlineSmall,
      color: t.color.roles.onSurface,
      minWidth: 80,
      textAlign: 'center'
    }
  });
}

// ODK Collect's CounterWidget clamps to [0, MAX_VALUE], disables minus at 0
// and plus at MAX_VALUE, and has no direct-edit/reset affordance — only the
// two tap buttons (CounterWidget.kt).
const COUNTER_MAX_VALUE = 999999999;
export function IntWidget({
  nodeRef,
  store,
  appearance
}) {
  const styles = useThemedStyles(createStyles);
  useFormSession(store);
  const [focused, setFocused] = useState(false);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const value = store.adapter.resolveValue(nodeRef);
  const variant = resolveVariant('int', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;
  function parse(text) {
    const s = text.replace(/,/g, '').trim();
    if (s === '') return {
      committable: true,
      value: null
    };
    if (/^-?\d+$/.test(s)) return {
      committable: true,
      value: parseInt(s, 10)
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
  const isBearing = variant === 'bearing';
  const sensors = isBearing ? getSensors() : null;
  const [liveHeading, setLiveHeading] = useState(null);
  useEffect(() => {
    if (!sensors) return undefined;
    const sub = sensors.Magnetometer.addListener(data => {
      setLiveHeading(headingFromMagnetometer(data));
    });
    return () => sub.remove();
  }, [sensors]);
  function handleCaptureBearing() {
    if (isReadonly || liveHeading === null) return;
    store.answerQuestion(nodeRef, liveHeading);
  }
  if (variant === 'counter') {
    const counterValue = typeof value === 'number' ? value : null;
    function step(delta) {
      if (isReadonly) return;
      const next = (counterValue ?? 0) + delta;
      if (next < 0 || next > COUNTER_MAX_VALUE) return;
      store.answerQuestion(nodeRef, next);
    }
    return /*#__PURE__*/_jsx(View, {
      style: styles.container,
      children: /*#__PURE__*/_jsxs(View, {
        style: styles.counterRow,
        children: [/*#__PURE__*/_jsx(Pressable, {
          testID: "int-counter-minus",
          style: styles.counterButton,
          onPress: () => step(-1),
          disabled: isReadonly || counterValue === null || counterValue <= 0,
          children: /*#__PURE__*/_jsx(Text, {
            style: styles.counterButtonText,
            children: "\u2212"
          })
        }), /*#__PURE__*/_jsx(Text, {
          testID: "int-counter-value",
          style: styles.counterValue,
          children: counterValue !== null ? String(counterValue) : ''
        }), /*#__PURE__*/_jsx(Pressable, {
          testID: "int-counter-plus",
          style: styles.counterButton,
          onPress: () => step(1),
          disabled: isReadonly || counterValue !== null && counterValue >= COUNTER_MAX_VALUE,
          children: /*#__PURE__*/_jsx(Text, {
            style: styles.counterButtonText,
            children: "+"
          })
        })]
      })
    });
  }
  return /*#__PURE__*/_jsxs(View, {
    style: styles.container,
    children: [/*#__PURE__*/_jsx(TextInput, {
      testID: "int-input",
      style: [styles.input, focused && !isReadonly && styles.focused, isReadonly && styles.readonly],
      value: draft.value,
      onChangeText: draft.onChangeText,
      editable: !isReadonly,
      keyboardType: "number-pad",
      onFocus: () => {
        setFocused(true);
        draft.onFocus();
      },
      onBlur: () => {
        setFocused(false);
        draft.onBlur();
      }
    }), isBearing && sensors && /*#__PURE__*/_jsxs(View, {
      style: styles.bearingRow,
      children: [/*#__PURE__*/_jsx(Text, {
        testID: "int-bearing-live",
        style: styles.bearingReadout,
        children: liveHeading !== null ? `${liveHeading}°` : 'Leyendo brújula…'
      }), /*#__PURE__*/_jsx(Pressable, {
        testID: "int-bearing-capture",
        style: styles.bearingButton,
        onPress: handleCaptureBearing,
        disabled: isReadonly || liveHeading === null,
        children: /*#__PURE__*/_jsx(Text, {
          style: styles.bearingButtonText,
          children: "Capturar rumbo"
        })
      })]
    })]
  });
}
//# sourceMappingURL=IntWidget.js.map