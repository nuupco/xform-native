/**
 * SelectOneWidget — renders a single-select question (REQ-13, REQ-14).
 *
 * Value shape (ts-rosa codecs.ts:180-183, AnswerValue.ts:30):
 *   selectOne value = string (a single choice token).
 *   store.answerQuestion receives the token string directly.
 *
 * Variants (ADR-3 selectOne, 7 render branches — resolveVariant untouched):
 *   default      → radio-style list, SelectionRow (control:'radio')
 *   minimal      → bottom-sheet dropdown (BottomSheet + SelectionRow rows)
 *   autocomplete → minimal + a filled pill search bar (SearchIcon) on top
 *                  of the BottomSheet's SelectionRow rows ("search" appearance
 *                  alias resolves here — spec's "SelectOne search variant")
 *   likert       → horizontal row of SelectionRow cells (density: 'likert')
 *   columns      → multi-column FlatList, SelectionRow (default density)
 *   columns-pack → compact multi-column FlatList, SelectionRow (density: 'pack')
 *   quick        → horizontal ScrollView of chip/tag Pressables (unchanged
 *                  chrome — a chip is not a row, kept off SelectionRow per
 *                  the design doc's own per-widget key list: quickChip/
 *                  quickChipSelected stay distinct from the row primitive)
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
import { resolveVariant } from './engine/appearance';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import { createFieldStyles } from './primitives/fieldStyles';
import { SelectionRow } from './primitives/SelectionRow';
import { SearchIcon } from './primitives/Icon';
import { BottomSheet } from './primitives/BottomSheet';
import { MarkdownText } from '../text/MarkdownText';
import { stripOdkMarkdown } from '../text/parseOdkMarkdown';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';


export interface SelectOneWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

function createStyles(t: Theme) {
  const f = createFieldStyles(t);
  return StyleSheet.create({
    container: {
      marginVertical: t.spacing.xs,
    },
    dropdownTrigger: {
      ...f.field,
    },
    dropdownTriggerText: {
      ...f.fieldText,
    },
    // Search bar (spec: "SelectOne Widget (incl. search variant) ... fixed
    // filled search bar with magnifying-glass icon, pill radius, on top").
    searchBar: {
      ...f.fieldRow,
      paddingHorizontal: t.spacing.md,
      marginBottom: t.spacing.xs,
    },
    searchInput: {
      ...f.field,
      ...f.fieldText,
      flex: 1,
      borderRadius: t.radius.pill,
      backgroundColor: t.color.roles.surfaceVariant,
      borderWidth: 0,
    },
    // likert
    likertRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
      marginVertical: t.spacing.sm,
    },
    // columns
    columnsCell: {
      flex: 1,
      margin: 4,
      minWidth: '40%',
    },
    columnsPackCell: {
      flex: 1,
      margin: 2,
      minWidth: '40%',
    },
    // quick (unchanged chrome — chip design, not a SelectionRow)
    quickRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
    },
    quickChip: {
      paddingVertical: t.spacing.xs,
      paddingHorizontal: t.spacing.md,
      marginHorizontal: t.spacing.xs,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.color.roles.outline,
      backgroundColor: t.color.roles.surface,
    },
    quickChipSelected: {
      backgroundColor: t.color.roles.primary,
      borderColor: t.color.roles.primary,
    },
    quickChipLabel: {
      ...t.typography.bodyLarge,
      color: t.color.roles.onSurface,
    },
    quickChipLabelSelected: {
      color: t.color.roles.onPrimary,
    },
  });
}

export function SelectOneWidget({ nodeRef, store, appearance }: SelectOneWidgetProps) {
  const styles = useThemedStyles(createStyles);
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const choices = store.adapter.getChoices(nodeRef);
  const currentValue = store.adapter.resolveValue(nodeRef);
  const variant = resolveVariant('selectOne', 'select1', appearance);
  const isReadonly = nodeState?.readonly ?? false;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');

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

  function handleSelect(value: string) {
    if (isReadonly) return;
    store.answerQuestion(nodeRef, value);
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
            {stripOdkMarkdown(selected?.label ?? selected?.value ?? 'Select…')}
          </Text>
        </Pressable>
        <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} testID="select-one-sheet">
          {choices.map((choice, index) => (
            <SelectionRow
              key={`${choice.value}__${index}`}
              testID={`select-one-option-${choice.value}`}
              control="radio"
              selected={choice.value === currentValue}
              label={choice.label ?? choice.value}
              onPress={() => handleSelect(choice.value)}
            />
          ))}
        </BottomSheet>
      </View>
    );
  }

  if (variant === 'minimal-autocomplete' || variant === 'autocomplete') {
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
            {stripOdkMarkdown(selected?.label ?? selected?.value ?? 'Select…')}
          </Text>
        </Pressable>
        <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} testID="select-one-sheet">
          <View style={styles.searchBar}>
            <SearchIcon testID="select-one-search-icon" />
            <TextInput
              testID="select-one-minimal-autocomplete-search"
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              editable={!isReadonly}
              placeholder="Search…"
            />
          </View>
          {filtered.map((choice, index) => (
            <SelectionRow
              key={`${choice.value}__${index}`}
              testID={`select-one-option-${choice.value}`}
              control="radio"
              selected={choice.value === currentValue}
              label={choice.label ?? choice.value}
              onPress={() => handleSelect(choice.value)}
            />
          ))}
        </BottomSheet>
      </View>
    );
  }

  if (variant === 'likert') {
    return (
      <View style={styles.container}>
        <View testID="select-one-likert-container" style={styles.likertRow}>
          {choices.map((choice, index) => (
            <SelectionRow
              key={`${choice.value}__${index}`}
              testID={`select-one-likert-option-${choice.value}`}
              control="radio"
              density="likert"
              selected={choice.value === currentValue}
              label={choice.label ?? choice.value}
              disabled={isReadonly}
              onPress={() => handleSelect(choice.value)}
            />
          ))}
        </View>
      </View>
    );
  }

  if (variant === 'columns') {
    return (
      <View style={styles.container}>
        <FlatList
          testID="select-one-columns-list"
          data={choices}
          keyExtractor={(item, index) => `${item.value}__${index}`}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.columnsCell}>
              <SelectionRow
                testID={`select-one-columns-option-${item.value}`}
                control="radio"
                selected={item.value === currentValue}
                label={item.label ?? item.value}
                disabled={isReadonly}
                onPress={() => handleSelect(item.value)}
              />
            </View>
          )}
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
          keyExtractor={(item, index) => `${item.value}__${index}`}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.columnsPackCell}>
              <SelectionRow
                testID={`select-one-columns-pack-option-${item.value}`}
                control="radio"
                density="pack"
                selected={item.value === currentValue}
                label={item.label ?? item.value}
                disabled={isReadonly}
                onPress={() => handleSelect(item.value)}
              />
            </View>
          )}
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
          {choices.map((choice, index) => {
            const isSelected = choice.value === currentValue;
            return (
              <Pressable
                key={`${choice.value}__${index}`}
                testID={`select-one-quick-option-${choice.value}`}
                style={[styles.quickChip, isSelected && styles.quickChipSelected]}
                onPress={() => handleSelect(choice.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected, disabled: isReadonly }}
              >
                <MarkdownText
                  value={choice.label ?? choice.value}
                  baseStyle={[styles.quickChipLabel, isSelected && styles.quickChipLabelSelected]}
                />
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
      {choices.map((choice, index) => (
        <SelectionRow
          key={`${choice.value}__${index}`}
          testID={`select-one-option-${choice.value}`}
          control="radio"
          selected={choice.value === currentValue}
          label={choice.label ?? choice.value}
          disabled={isReadonly}
          onPress={() => handleSelect(choice.value)}
        />
      ))}
    </View>
  );
}
