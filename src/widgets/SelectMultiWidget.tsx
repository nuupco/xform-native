/**
 * SelectMultiWidget — renders a multi-select question (REQ-13, REQ-14).
 *
 * Value shape (ts-rosa codecs.ts:185-189, AnswerValue.ts:31):
 *   selectMulti value = readonly string[] (array of selected tokens).
 *   store.answerQuestion receives string[] directly.
 *
 * Variants (ADR-3 selectMulti, 6 render branches — resolveVariant untouched):
 *   default      → checkbox list, SelectionRow (control:'checkbox')
 *   minimal      → bottom-sheet dropdown, SelectionRow rows
 *   autocomplete → minimal + a filled pill search bar (SearchIcon) on top
 *                  ("search" appearance alias resolves here)
 *   likert       → horizontal row of SelectionRow cells (density: 'likert')
 *   columns      → multi-column FlatList, SelectionRow (default density)
 *   columns-pack → compact multi-column FlatList, SelectionRow (density: 'pack')
 *
 * Spec (SelectMulti Widget requirement): reuses the SelectOne row pattern
 * with a square checkbox (radius sm) instead of a circle, and shows an
 * "N seleccionadas" counter (labelMedium/onSurfaceVariant) above the list.
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
import { resolveVariant } from './engine/appearance';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import { createFieldStyles } from './primitives/fieldStyles';
import { SelectionRow } from './primitives/SelectionRow';
import { SearchIcon } from './primitives/Icon';
import { BottomSheet } from './primitives/BottomSheet';
import { stripOdkMarkdown } from '../text/parseOdkMarkdown';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface SelectMultiWidgetProps {
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
    counter: {
      ...t.typography.labelMedium,
      color: t.color.roles.onSurfaceVariant,
      marginBottom: t.spacing.xs,
    },
    dropdownTrigger: {
      ...f.field,
    },
    dropdownTriggerText: {
      ...f.fieldText,
    },
    // Search bar (spec: fixed filled search bar, magnifying-glass icon, pill radius)
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
  });
}

function selectedCountLabel(n: number): string {
  return n === 1 ? '1 seleccionada' : `${n} seleccionadas`;
}

export function SelectMultiWidget({ nodeRef, store, appearance }: SelectMultiWidgetProps) {
  const styles = useThemedStyles(createStyles);
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

  const counter = (
    <Text testID="select-multi-counter" style={styles.counter}>
      {selectedCountLabel(selections.length)}
    </Text>
  );

  if (variant === 'minimal') {
    const selectedLabels = choices
      .filter((c) => selections.includes(c.value))
      .map((c) => stripOdkMarkdown(c.label ?? c.value))
      .join(', ');
    return (
      <View style={styles.container}>
        {counter}
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
          {choices.map((choice, index) => (
            <SelectionRow
              key={`${choice.value}__${index}`}
              testID={`select-multi-sheet-option-${choice.value}`}
              control="checkbox"
              selected={selections.includes(choice.value)}
              label={choice.label ?? choice.value}
              onPress={() => handleToggle(choice.value)}
            />
          ))}
        </BottomSheet>
      </View>
    );
  }

  if (variant === 'minimal-autocomplete' || variant === 'autocomplete') {
    const selectedLabels = choices
      .filter((c) => selections.includes(c.value))
      .map((c) => stripOdkMarkdown(c.label ?? c.value))
      .join(', ');
    return (
      <View style={styles.container}>
        {counter}
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
          <View style={styles.searchBar}>
            <SearchIcon testID="select-multi-search-icon" />
            <TextInput
              testID="select-multi-minimal-autocomplete-search"
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
              testID={`select-multi-sheet-option-${choice.value}`}
              control="checkbox"
              selected={selections.includes(choice.value)}
              label={choice.label ?? choice.value}
              onPress={() => handleToggle(choice.value)}
            />
          ))}
        </BottomSheet>
      </View>
    );
  }

  if (variant === 'likert') {
    return (
      <View style={styles.container}>
        {counter}
        <View testID="select-multi-likert-container" style={styles.likertRow}>
          {choices.map((choice, index) => (
            <SelectionRow
              key={`${choice.value}__${index}`}
              testID={`select-multi-likert-option-${choice.value}`}
              control="checkbox"
              density="likert"
              selected={selections.includes(choice.value)}
              label={choice.label ?? choice.value}
              disabled={isReadonly}
              onPress={() => handleToggle(choice.value)}
            />
          ))}
        </View>
      </View>
    );
  }

  if (variant === 'columns') {
    return (
      <View style={styles.container}>
        {counter}
        <FlatList
          testID="select-multi-columns-list"
          data={choices}
          keyExtractor={(item, index) => `${item.value}__${index}`}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.columnsCell}>
              <SelectionRow
                testID={`select-multi-columns-option-${item.value}`}
                control="checkbox"
                selected={selections.includes(item.value)}
                label={item.label ?? item.value}
                disabled={isReadonly}
                onPress={() => handleToggle(item.value)}
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
        {counter}
        <FlatList
          testID="select-multi-columns-pack-list"
          data={choices}
          keyExtractor={(item, index) => `${item.value}__${index}`}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.columnsPackCell}>
              <SelectionRow
                testID={`select-multi-columns-pack-option-${item.value}`}
                control="checkbox"
                density="pack"
                selected={selections.includes(item.value)}
                label={item.label ?? item.value}
                disabled={isReadonly}
                onPress={() => handleToggle(item.value)}
              />
            </View>
          )}
        />
      </View>
    );
  }

  // default (checkbox list) — fallback for unrecognized variants
  return (
    <View style={styles.container}>
      {counter}
      {choices.map((choice, index) => (
        <SelectionRow
          key={`${choice.value}__${index}`}
          testID={`select-multi-option-${choice.value}`}
          control="checkbox"
          selected={selections.includes(choice.value)}
          label={choice.label ?? choice.value}
          disabled={isReadonly}
          onPress={() => handleToggle(choice.value)}
        />
      ))}
    </View>
  );
}
