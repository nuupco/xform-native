/**
 * SelectMultiWidget — renders a multi-select question (REQ-13, REQ-14).
 *
 * Value shape (ts-rosa codecs.ts:185-189, AnswerValue.ts:31):
 *   selectMulti value = readonly string[] (array of selected tokens).
 *   store.answerQuestion receives string[] directly.
 *
 * Variants (ADR-3 selectMulti):
 *   default      → checkbox list (Pressable per option)
 *   minimal      → bottom-sheet dropdown with checkboxes
 *   columns      → multi-column FlatList with numColumns={2}
 *   columns-pack → compact multi-column FlatList
 *   autocomplete → same as minimal-autocomplete (trigger + BottomSheet search)
 *   likert       → horizontal row of labeled checkbox Pressables
 */

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  TextInput,
} from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { tokens } from '../tokens/tokens';
import { resolveVariant } from './appearance';
import { BottomSheet } from './primitives/BottomSheet';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface SelectMultiWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function SelectMultiWidget({ nodeRef, store, appearance }: SelectMultiWidgetProps) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const choices = store.adapter.getChoices(nodeRef);
  const rawValue = store.adapter.resolveValue(nodeRef);
  const variant = resolveVariant('selectMulti', 'select', appearance);
  const isReadonly = nodeState?.readonly ?? false;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Derived directly from the store — resolveValue is the single source of
  // truth (per store version-bump model). With key={ev.index} on the Widget
  // element (Form.tsx), each logical question gets its own component
  // instance, so a ref-based selections cache/sync-guard is no longer needed
  // to avoid stale-closure issues across DIFFERENT questions. Rapid
  // same-instance fireEvent batching still reads/writes through the store,
  // which is authoritative.
  const selections: string[] = Array.isArray(rawValue) ? (rawValue as string[]) : [];

  // Hoisted above all variant branching (Unconditional Hook Ordering): this
  // widget re-renders as the SAME instance when only `appearance` changes,
  // so hook count/order must stay invariant across variants.
  const filtered = useMemo(() => {
    if (!query.trim()) return choices;
    const q = query.toLowerCase();
    return choices.filter(
      (c) =>
        (c.label ?? c.value).toLowerCase().includes(q) ||
        c.value.toLowerCase().includes(q),
    );
  }, [choices, query]);

  function handleToggle(value: string) {
    if (isReadonly) return;
    let next: string[];
    if (selections.includes(value)) {
      next = selections.filter((v) => v !== value);
    } else {
      next = [...selections, value];
    }
    store.answerQuestion(nodeRef, next);
  }

  if (variant === 'minimal') {
    const selectedLabels = choices
      .filter((c) => selections.includes(c.value))
      .map((c) => c.label ?? c.value)
      .join(', ');
    return (
      <View style={styles.container}>
        <Pressable
          testID="select-multi-dropdown-trigger"
          style={styles.dropdownTrigger}
          onPress={() => !isReadonly && setSheetOpen(true)}
          accessible={!isReadonly}
        >
          <Text style={styles.dropdownTriggerText}>
            {selectedLabels || 'Select…'}
          </Text>
        </Pressable>
        <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} testID="select-multi-sheet">
          {choices.map((choice, index) => {
            const isSelected = selections.includes(choice.value);
            return (
              <Pressable
                key={`${choice.value}__${index}`}
                testID={`select-multi-sheet-option-${choice.value}`}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleToggle(choice.value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected, disabled: isReadonly }}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.optionLabel}>{choice.label ?? choice.value}</Text>
              </Pressable>
            );
          })}
        </BottomSheet>
      </View>
    );
  }

  if (variant === 'minimal-autocomplete' || variant === 'autocomplete') {
    const selectedLabels = choices
      .filter((c) => selections.includes(c.value))
      .map((c) => c.label ?? c.value)
      .join(', ');
    return (
      <View style={styles.container}>
        <Pressable
          testID="select-multi-dropdown-trigger"
          style={styles.dropdownTrigger}
          onPress={() => !isReadonly && setSheetOpen(true)}
          accessible={!isReadonly}
        >
          <Text style={styles.dropdownTriggerText}>
            {selectedLabels || 'Select…'}
          </Text>
        </Pressable>
        <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} testID="select-multi-sheet">
          <TextInput
            testID="select-multi-minimal-autocomplete-search"
            style={styles.autocompleteInput}
            value={query}
            onChangeText={setQuery}
            editable={!isReadonly}
            placeholder="Search…"
          />
          {filtered.map((choice, index) => {
            const isSelected = selections.includes(choice.value);
            return (
              <Pressable
                key={`${choice.value}__${index}`}
                testID={`select-multi-sheet-option-${choice.value}`}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleToggle(choice.value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected, disabled: isReadonly }}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.optionLabel}>{choice.label ?? choice.value}</Text>
              </Pressable>
            );
          })}
        </BottomSheet>
      </View>
    );
  }

  if (variant === 'likert') {
    return (
      <View style={styles.container}>
        <View testID="select-multi-likert-container" style={styles.likertRow}>
          {choices.map((choice, index) => {
            const isSelected = selections.includes(choice.value);
            return (
              <Pressable
                key={`${choice.value}__${index}`}
                testID={`select-multi-likert-option-${choice.value}`}
                style={styles.likertCell}
                onPress={() => handleToggle(choice.value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected, disabled: isReadonly }}
              >
                <Text style={styles.likertLabel}>{choice.label ?? choice.value}</Text>
                <View style={[styles.likertCheckbox, isSelected && styles.likertCheckboxSelected]}>
                  {isSelected && <Text style={styles.likertCheckmark}>✓</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (variant === 'columns') {
    return (
      <View style={styles.container}>
        <FlatList
          testID="select-multi-columns-list"
          data={choices}
          keyExtractor={(item, index) => `${item.value}__${index}`}
          numColumns={2}
          renderItem={({ item }) => {
            const isSelected = selections.includes(item.value);
            return (
              <Pressable
                testID={`select-multi-columns-option-${item.value}`}
                style={[styles.columnsOption, isSelected && styles.columnsOptionSelected]}
                onPress={() => handleToggle(item.value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected, disabled: isReadonly }}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.columnsOptionLabel}>{item.label ?? item.value}</Text>
              </Pressable>
            );
          }}
        />
      </View>
    );
  }

  if (variant === 'columns-pack') {
    return (
      <View style={styles.container}>
        <FlatList
          testID="select-multi-columns-pack-list"
          data={choices}
          keyExtractor={(item, index) => `${item.value}__${index}`}
          numColumns={2}
          renderItem={({ item }) => {
            const isSelected = selections.includes(item.value);
            return (
              <Pressable
                testID={`select-multi-columns-pack-option-${item.value}`}
                style={[styles.columnsPackOption, isSelected && styles.columnsPackOptionSelected]}
                onPress={() => handleToggle(item.value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected, disabled: isReadonly }}
              >
                <View style={[styles.checkboxSmall, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Text style={styles.checkmarkSmall}>✓</Text>}
                </View>
                <Text style={styles.columnsPackOptionLabel}>{item.label ?? item.value}</Text>
              </Pressable>
            );
          }}
        />
      </View>
    );
  }

  // default (checkbox list) — fallback for unrecognized variants
  return (
    <View style={styles.container}>
      {choices.map((choice, index) => {
        const isSelected = selections.includes(choice.value);
        return (
          <Pressable
            key={`${choice.value}__${index}`}
            testID={`select-multi-option-${choice.value}`}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => handleToggle(choice.value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected, disabled: isReadonly }}
          >
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.optionLabel}>{choice.label ?? choice.value}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.spacing.xs,
  },
  // RN 0.85 Fabric: padding must not share a node with centering/minWidth (collapses Text)
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    marginVertical: 2,
    borderRadius: tokens.radius.sm,
  },
  optionSelected: {
    backgroundColor: tokens.color.surface,
  },
  optionLabel: {
    fontSize: tokens.font.md,
    color: tokens.color.text,
    marginLeft: tokens.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: tokens.color.text,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primary,
  },
  checkmark: {
    color: tokens.color.background,
    fontSize: tokens.font.sm,
    fontWeight: 'bold',
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: tokens.color.text,
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.sm,
    backgroundColor: tokens.color.background,
  },
  dropdownTriggerText: {
    fontSize: tokens.font.md,
    color: tokens.color.text,
  },
  // likert
  likertRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginVertical: tokens.spacing.sm,
  },
  // RN 0.85 Fabric: padding must not share a node with centering/minWidth (collapses Text)
  likertCell: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 64,
  },
  likertLabel: {
    fontSize: tokens.font.sm,
    color: tokens.color.text,
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  likertCheckbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: tokens.color.text,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likertCheckboxSelected: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primary,
  },
  likertCheckmark: {
    color: tokens.color.background,
    fontSize: tokens.font.xs,
    fontWeight: 'bold',
  },
  // autocomplete (used by both 'autocomplete' and 'minimal-autocomplete',
  // rendered inside BottomSheet's own bounded/scrollable content)
  autocompleteInput: {
    borderWidth: 1,
    borderColor: tokens.color.text,
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.sm,
    fontSize: tokens.font.md,
    color: tokens.color.text,
    backgroundColor: tokens.color.background,
    marginBottom: tokens.spacing.xs,
  },
  // columns
  // RN 0.85 Fabric: padding must not share a node with centering/minWidth (collapses Text)
  columnsOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    margin: 4,
    borderRadius: tokens.radius.sm,
    minWidth: '40%',
  },
  columnsOptionSelected: {
    backgroundColor: tokens.color.surface,
  },
  columnsOptionLabel: {
    fontSize: tokens.font.md,
    color: tokens.color.text,
    marginLeft: tokens.spacing.sm,
  },
  // columns-pack
  // RN 0.85 Fabric: padding must not share a node with centering/minWidth (collapses Text)
  columnsPackOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    margin: 2,
    borderRadius: tokens.radius.sm,
    minWidth: '40%',
  },
  columnsPackOptionSelected: {
    backgroundColor: tokens.color.surface,
  },
  columnsPackOptionLabel: {
    fontSize: tokens.font.sm,
    color: tokens.color.text,
    marginLeft: tokens.spacing.xs,
  },
  checkboxSmall: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: tokens.color.text,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkSmall: {
    color: tokens.color.background,
    fontSize: tokens.font.xs,
    fontWeight: 'bold',
  },
});
