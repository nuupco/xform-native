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
 *   no-ticks  → same as default in P1
 *   picker    → same as default in P1
 *   vertical  → same as default in P1
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { tokens } from '../tokens/tokens';
import { resolveVariant } from './appearance';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface RangeWidgetProps {
  ref: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
  /** Range start bound (inclusive). Defaults to 0 when absent. */
  start?: number;
  /** Range end bound (inclusive). Defaults to 10 when absent. */
  end?: number;
  /** Step increment. Defaults to 1 when absent. */
  step?: number;
}

export function RangeWidget({
  ref,
  store,
  appearance,
  start = 0,
  end = 10,
  step = 1,
}: RangeWidgetProps) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(ref);
  const rawValue = store.adapter.resolveValue(ref);
  resolveVariant('int', 'range', appearance); // variant resolved but all map to stepper in P1
  const isReadonly = nodeState?.readonly ?? false;
  const isRequired = nodeState?.required ?? false;

  // Normalize current value to a number, default to start if null
  const currentValue: number =
    typeof rawValue === 'number' ? rawValue : start;

  function handleDecrement() {
    if (isReadonly) return;
    const next = currentValue - step;
    if (next < start) return; // at lower bound — no-op
    store.answerQuestion(ref, next);
  }

  function handleIncrement() {
    if (isReadonly) return;
    const next = currentValue + step;
    if (next > end) return; // at upper bound — no-op
    store.answerQuestion(ref, next);
  }

  return (
    <View style={styles.container}>
      {isRequired && (
        <Text testID="required-indicator" style={styles.required}>
          *
        </Text>
      )}
      <View style={styles.stepper}>
        <Pressable
          testID="range-decrement"
          style={[styles.stepButton, isReadonly && styles.disabled]}
          onPress={handleDecrement}
          accessibilityLabel="Decrease value"
          disabled={isReadonly}
        >
          <Text style={styles.stepButtonText}>−</Text>
        </Pressable>

        <View testID="range-value-display" style={styles.valueContainer}>
          <Text style={styles.valueText}>{String(currentValue)}</Text>
        </View>

        <Pressable
          testID="range-increment"
          style={[styles.stepButton, isReadonly && styles.disabled]}
          onPress={handleIncrement}
          accessibilityLabel="Increase value"
          disabled={isReadonly}
        >
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.spacing.xs,
  },
  required: {
    color: tokens.color.error,
    fontSize: tokens.font.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  stepButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: tokens.color.text,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.color.background,
  },
  disabled: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.surface,
  },
  stepButtonText: {
    fontSize: tokens.font.lg,
    color: tokens.color.text,
    fontWeight: 'bold',
  },
  valueContainer: {
    minWidth: 60,
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.sm,
  },
  valueText: {
    fontSize: tokens.font.md,
    color: tokens.color.text,
  },
});
