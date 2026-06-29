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
 *   autocomplete → TextInput with filtered FlatList of checkboxes
 *   likert       → horizontal row of labeled checkbox Pressables
 */

import { useRef, useState, useMemo } from 'react';
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
  ref: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function SelectMultiWidget({ ref, store, appearance }: SelectMultiWidgetProps) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(ref);
  const choices = store.adapter.getChoices(ref);
  const rawValue = store.adapter.resolveValue(ref);
  const variant = resolveVariant('selectMulti', 'select', appearance);
  const isReadonly = nodeState?.readonly ?? false;
  const isRequired = nodeState?.required ?? false;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Use a ref to track the current selections synchronously, avoiding stale-closure
  // issues with useState batching in React 19 when fireEvent fires multiple times.
  // The ref is initialized from resolveValue and updated on each toggle before commit.
  const rawArray: string[] = Array.isArray(rawValue) ? (rawValue as string[]) : [];
  const selectionsRef = useRef<string[]>(rawArray);
  // Keep ref in sync with store value when it changes externally (store re-render path).
  if (JSON.stringify(selectionsRef.current) !== JSON.stringify(rawArray) && rawArray.length > 0) {
    selectionsRef.current = rawArray;
  }
  const selections = selectionsRef.current;

  function handleToggle(value: string) {
    if (isReadonly) return;
    const current = selectionsRef.current;
    let next: string[];
    if (current.includes(value)) {
      next = current.filter((v) => v !== value);
    } else {
      next = [...current, value];
    }
    selectionsRef.current = next;
    store.answerQuestion(ref, next);
  }

  // Shared: render required indicator
  const requiredIndicator = isRequired ? (
    <Text testID="required-indicator" style={styles.required}>
      *
    </Text>
  ) : null;

  if (variant === 'minimal') {
    const selectedLabels = choices
      .filter((c) => selections.includes(c.value))
      .map((c) => c.label ?? c.value)
      .join(', ');
    return (
      <View style={styles.container}>
        {requiredIndicator}
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
          {choices.map((choice) => {
            const isSelected = selections.includes(choice.value);
            return (
              <Pressable
                key={choice.value}
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
        {requiredIndicator}
        <View testID="select-multi-likert-container" style={styles.likertRow}>
          {choices.map((choice) => {
            const isSelected = selections.includes(choice.value);
            return (
              <Pressable
                key={choice.value}
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

  if (variant === 'autocomplete') {
    const filtered = useMemo(() => {
      if (!query.trim()) return choices;
      const q = query.toLowerCase();
      return choices.filter(
        (c) =>
          (c.label ?? c.value).toLowerCase().includes(q) ||
          c.value.toLowerCase().includes(q),
      );
    }, [choices, query]);

    return (
      <View style={styles.container}>
        {requiredIndicator}
        <TextInput
          testID="select-multi-autocomplete-input"
          style={styles.autocompleteInput}
          value={query}
          onChangeText={setQuery}
          editable={!isReadonly}
          placeholder="Search…"
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => {
            const isSelected = selections.includes(item.value);
            return (
              <Pressable
                testID={`select-multi-autocomplete-option-${item.value}`}
                style={[styles.autocompleteOption, isSelected && styles.autocompleteOptionSelected]}
                onPress={() => handleToggle(item.value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected, disabled: isReadonly }}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.autocompleteOptionLabel}>{item.label ?? item.value}</Text>
              </Pressable>
            );
          }}
        />
      </View>
    );
  }

  if (variant === 'columns') {
    return (
      <View style={styles.container}>
        {requiredIndicator}
        <FlatList
          testID="select-multi-columns-list"
          data={choices}
          keyExtractor={(item) => item.value}
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
        {requiredIndicator}
        <FlatList
          testID="select-multi-columns-pack-list"
          data={choices}
          keyExtractor={(item) => item.value}
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
      {isRequired && (
        <Text testID="required-indicator" style={styles.required}>
          *
        </Text>
      )}
      {choices.map((choice) => {
        const isSelected = selections.includes(choice.value);
        return (
          <Pressable
            key={choice.value}
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
  required: {
    color: tokens.color.error,
    fontSize: tokens.font.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
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
  likertCell: {
    alignItems: 'center',
    padding: tokens.spacing.sm,
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
  // autocomplete
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
  autocompleteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
    marginVertical: 2,
    borderRadius: tokens.radius.sm,
  },
  autocompleteOptionSelected: {
    backgroundColor: tokens.color.surface,
  },
  autocompleteOptionLabel: {
    fontSize: tokens.font.md,
    color: tokens.color.text,
    marginLeft: tokens.spacing.sm,
  },
  // columns
  columnsOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.sm,
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
  columnsPackOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.xs,
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
