/**
 * RankWidget — reorder control for controlType 'rank'.
 *
 * Value shape: same order-preserving `string[]` codec as SelectMultiWidget
 * (dataType 'selectMulti'). Display order is a pure function of the store,
 * derived fresh on every render — no local ordering state, no useEffect
 * (rank-widget-support ADR-B1). `store.answerQuestion` is called ONLY from
 * the reorder handler, never on mount.
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { tokens } from '../tokens/tokens';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';
import type { SelectChoice } from '@nuup/ts-rosa';

export interface RankWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

/**
 * Reconcile `choices` (the full, authoritative set) against `tokens` (a
 * possibly partial/stale committed order): choices named by tokens come
 * first (in token order, de-duped, unknown tokens skipped), followed by any
 * remaining choices not covered by tokens. Result always contains every
 * choice exactly once (ADR-B2) — guards against ever rendering/committing a
 * partial ranking.
 */
function orderByTokens(
  choices: readonly SelectChoice[],
  tokens: readonly string[],
): SelectChoice[] {
  const byValue = new Map(choices.map((c) => [c.value, c]));
  const seen = new Set<string>();
  const ordered: SelectChoice[] = [];
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

export function RankWidget({ nodeRef, store }: RankWidgetProps) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const choices = store.adapter.getChoices(nodeRef);
  const committed = store.adapter.resolveValue(nodeRef);
  const isReadonly = nodeState?.readonly ?? false;

  const ordered: SelectChoice[] =
    Array.isArray(committed) && committed.length > 0
      ? orderByTokens(choices, committed as string[])
      : [...choices];

  function handleMove(index: number, dir: -1 | 1) {
    if (isReadonly) return;
    const target = index + dir;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    store.answerQuestion(
      nodeRef,
      next.map((c) => c.value),
    );
  }

  return (
    <View style={styles.container}>
      {ordered.map((choice, index) => {
        const isFirst = index === 0;
        const isLast = index === ordered.length - 1;
        const upDisabled = isReadonly || isFirst;
        const downDisabled = isReadonly || isLast;
        return (
          <View key={choice.value} testID={`rank-option-${choice.value}`} style={styles.row}>
            <Text style={styles.label}>{choice.label ?? choice.value}</Text>
            <View style={styles.controls}>
              <Pressable
                testID={`rank-up-${choice.value}`}
                style={[styles.button, upDisabled && styles.disabled]}
                onPress={() => handleMove(index, -1)}
                accessibilityRole="button"
                accessibilityLabel="Move up"
                accessibilityState={{ disabled: upDisabled }}
              >
                <Text style={styles.glyph}>↑</Text>
              </Pressable>
              <Pressable
                testID={`rank-down-${choice.value}`}
                style={[styles.button, downDisabled && styles.disabled]}
                onPress={() => handleMove(index, 1)}
                accessibilityRole="button"
                accessibilityLabel="Move down"
                accessibilityState={{ disabled: downDisabled }}
              >
                <Text style={styles.glyph}>↓</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    marginVertical: 2,
    borderRadius: tokens.radius.sm,
  },
  label: {
    fontSize: tokens.font.md,
    color: tokens.color.text,
  },
  controls: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  button: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: tokens.color.text,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    color: tokens.color.text,
    fontSize: tokens.font.md,
  },
  disabled: {
    opacity: 0.5,
  },
});
