/**
 * SelectOneWidget — renders a single-select question (REQ-13, REQ-14).
 *
 * Value shape (ts-rosa codecs.ts:180-183, AnswerValue.ts:30):
 *   selectOne value = string (a single choice token).
 *   store.answerQuestion receives the token string directly.
 *
 * Variants (ADR-3 selectOne):
 *   default      → radio-style list (Pressable per option)
 *   minimal      → bottom-sheet dropdown (BottomSheet primitive)
 *   likert       → horizontal row of labeled radio Pressables
 *   autocomplete → TextInput with filtered FlatList dropdown
 *   columns      → multi-column FlatList with numColumns={2}
 *   columns-pack → compact multi-column FlatList
 *   quick        → horizontal ScrollView of chip/tag Pressables
 */

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
} from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { tokens } from '../tokens/tokens';
import { resolveVariant } from './appearance';
import { BottomSheet } from './primitives/BottomSheet';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';


export interface SelectOneWidgetProps {
  ref: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function SelectOneWidget({ ref, store, appearance }: SelectOneWidgetProps) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(ref);
  const choices = store.adapter.getChoices(ref);
  const currentValue = store.adapter.resolveValue(ref);
  const variant = resolveVariant('selectOne', 'select1', appearance);
  const isReadonly = nodeState?.readonly ?? false;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');

  function handleSelect(value: string) {
    if (isReadonly) return;
    store.answerQuestion(ref, value);
    setSheetOpen(false);
  }

  if (variant === 'minimal') {
    const selected = choices.find((c) => c.value === currentValue);
    return (
      <View style={styles.container}>
        <Pressable
          testID="select-one-dropdown-trigger"
          style={styles.dropdownTrigger}
          onPress={() => !isReadonly && setSheetOpen(true)}
          accessible={!isReadonly}
        >
          <Text style={styles.dropdownTriggerText}>
            {selected?.label ?? selected?.value ?? 'Select…'}
          </Text>
        </Pressable>
        <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
          {choices.map((choice) => (
            <Pressable
              key={choice.value}
              testID={`select-one-option-${choice.value}`}
              style={styles.option}
              onPress={() => handleSelect(choice.value)}
            >
              <Text style={styles.optionLabel}>{choice.label ?? choice.value}</Text>
            </Pressable>
          ))}
        </BottomSheet>
      </View>
    );
  }

  if (variant === 'likert') {
    return (
      <View style={styles.container}>
        <View testID="select-one-likert-container" style={styles.likertRow}>
          {choices.map((choice) => {
            const isSelected = choice.value === currentValue;
            return (
              <Pressable
                key={choice.value}
                testID={`select-one-likert-option-${choice.value}`}
                style={styles.likertCell}
                onPress={() => handleSelect(choice.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected, disabled: isReadonly }}
              >
                <Text style={styles.likertLabel}>{choice.label ?? choice.value}</Text>
                <View style={[styles.likertRadio, isSelected && styles.likertRadioSelected]} />
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
        <TextInput
          testID="select-one-autocomplete-input"
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
            const isSelected = item.value === currentValue;
            return (
              <Pressable
                testID={`select-one-autocomplete-option-${item.value}`}
                style={[styles.autocompleteOption, isSelected && styles.autocompleteOptionSelected]}
                onPress={() => handleSelect(item.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected, disabled: isReadonly }}
              >
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
        <FlatList
          testID="select-one-columns-list"
          data={choices}
          keyExtractor={(item) => item.value}
          numColumns={2}
          renderItem={({ item }) => {
            const isSelected = item.value === currentValue;
            return (
              <Pressable
                testID={`select-one-columns-option-${item.value}`}
                style={[styles.columnsOption, isSelected && styles.columnsOptionSelected]}
                onPress={() => handleSelect(item.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected, disabled: isReadonly }}
              >
                <View style={[styles.radio, isSelected && styles.radioSelected]} />
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
          testID="select-one-columns-pack-list"
          data={choices}
          keyExtractor={(item) => item.value}
          numColumns={2}
          renderItem={({ item }) => {
            const isSelected = item.value === currentValue;
            return (
              <Pressable
                testID={`select-one-columns-pack-option-${item.value}`}
                style={[styles.columnsPackOption, isSelected && styles.columnsPackOptionSelected]}
                onPress={() => handleSelect(item.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected, disabled: isReadonly }}
              >
                <View style={[styles.radioSmall, isSelected && styles.radioSelected]} />
                <Text style={styles.columnsPackOptionLabel}>{item.label ?? item.value}</Text>
              </Pressable>
            );
          }}
        />
      </View>
    );
  }

  if (variant === 'quick') {
    return (
      <View style={styles.container}>
        <ScrollView
          testID="select-one-quick-container"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRow}
        >
          {choices.map((choice) => {
            const isSelected = choice.value === currentValue;
            return (
              <Pressable
                key={choice.value}
                testID={`select-one-quick-option-${choice.value}`}
                style={[styles.quickChip, isSelected && styles.quickChipSelected]}
                onPress={() => handleSelect(choice.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected, disabled: isReadonly }}
              >
                <Text style={[styles.quickChipLabel, isSelected && styles.quickChipLabelSelected]}>
                  {choice.label ?? choice.value}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // default (radio-style) — fallback for unrecognized variants
  return (
    <View style={styles.container}>
      {choices.map((choice) => {
        const isSelected = choice.value === currentValue;
        return (
          <Pressable
            key={choice.value}
            testID={`select-one-option-${choice.value}`}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => handleSelect(choice.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected, disabled: isReadonly }}
          >
            <View style={[styles.radio, isSelected && styles.radioSelected]} />
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
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: tokens.color.text,
  },
  radioSelected: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primary,
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
  likertRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: tokens.color.text,
  },
  likertRadioSelected: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primary,
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
  radioSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: tokens.color.text,
  },
  // quick
  // RN 0.85 Fabric: padding must not share a node with centering/minWidth (collapses Text)
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  quickChip: {
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md,
    marginHorizontal: tokens.spacing.xs,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.color.text,
    backgroundColor: tokens.color.background,
  },
  quickChipSelected: {
    backgroundColor: tokens.color.primary,
    borderColor: tokens.color.primary,
  },
  quickChipLabel: {
    fontSize: tokens.font.md,
    color: tokens.color.text,
  },
  quickChipLabelSelected: {
    color: tokens.color.background,
  },
});
