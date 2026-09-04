/**
 * SelectMultiWidget — renders a multi-select question (REQ-13, REQ-14).
 *
 * Value shape (ts-rosa codecs.ts:185-189, AnswerValue.ts:31):
 *   selectMulti value = readonly string[] (array of selected tokens).
 *   store.answerQuestion receives string[] directly.
 *
 * Variants (ADR-3 selectMulti, 8 render branches):
 *   default      → checkbox list, SelectionRow (control:'checkbox')
 *   minimal      → bottom-sheet dropdown, SelectionRow rows
 *   autocomplete → minimal + a filled pill search bar (SearchIcon) on top
 *                  ("search" appearance alias resolves here)
 *   likert       → horizontal row of SelectionRow cells (density: 'likert')
 *   columns      → multi-column FlatList, SelectionRow (default density)
 *   columns-pack → compact multi-column FlatList, SelectionRow (density: 'pack')
 *   compact      → same multi-column FlatList as `columns` — see
 *                  SelectOneWidget's docblock: ts-rosa's SelectChoice never
 *                  carries media, so the label is always shown.
 * list-nolabel → horizontal row of SelectionRow cells (density: 'likert'),
 *                  checkbox only, choice label text suppressed — ODK
 *                  Collect's ListMultiWidget with displayLabel=false.
 * columns-n    → same multi-column FlatList as `columns`, column count
 *                  parsed from the appearance string (columns-3, ...)
 *                  instead of fixed at 2 — mirrors ODK's
 *                  Appearances.getNumberOfColumns.
 *
 * x-timed-grid — PARTIALLY implemented (see appearance.ts). ODK Collect's
 * real TimedGridWidget (timedgrid/src/main/java/org/odk/collect/timedgrid/)
 * is a full timed literacy-assessment widget: a countdown timer with
 * pause/resume persisted per-question via a ViewModel, an "early finish"
 * confirmation dialog, a special sentinel answer value for "all answered
 * correctly", an auto-picked "last attempted" item, a navigation-blocking
 * warning while the assessment is in progress, and a
 * `TimedGridSummaryAnswerCreator` that scans the WHOLE form for other
 * questions whose appearance matches
 * `x-timed-grid-answer(<this-question-ref>,<metadata-name>)` and writes the
 * computed summary (time-remaining, attempted/correct/incorrect counts,
 * etc.) into each match.
 *
 * This pass closes only the timer + navigation-block half of that gap:
 *   - a basic in-memory countdown (React state + setInterval) — NOT
 *     persisted across app backgrounding or a component remount (see the
 *     `secondsRemaining` state comment below).
 *   - navigation is blocked while the countdown is running, via
 *     `timedGridValidatorOverride` (exported below) — a HOST APP MUST pass
 *     it in `<Form validators={[...]}>` (or a `ValidationRegistryProvider`)
 *     for the block to actually apply; this widget has no way to mutate
 *     Form.tsx's frozen-at-mount validator list itself (see form/validation.ts
 *     D7/D8 — overrides are registered by the host, not by a widget
 *     instance).
 *
 * Deliberately LEFT OUT (documented here, not as a new appearance-gap-list
 * entry — this is a known limitation of this SAME variant, not a distinct
 * appearance):
 *   - the cross-field summary write (`x-timed-grid-answer(...)` scanning).
 *     FormAdapter intentionally firewalls FormElement/FormDefinition out of
 *     its public surface (ADR-2, see adapter/FormAdapter.ts) — there is no
 *     "list every question's appearance in the form" capability to scan
 *     for `x-timed-grid-answer(...)` matches without adding a new adapter
 *     capability that breaches that firewall. That's a bigger, separate
 *     feature than a widget render-variant change, so it stays undone here.
 *   - the "early finish" confirmation dialog.
 *   - pause/resume and any countdown persistence across sessions.
 *   - the "all answered correctly" sentinel value and "last attempted item"
 *     auto-pick, both of which are meaningless without the summary write
 *     above.
 * A fixed 60s duration is used (appearance params like
 * `x-timed-grid(duration=…)` are out of scope: this engine's
 * `resolveVariant` matches whole appearance tokens verbatim, see
 * appearance.ts, and adding parametrized-token parsing is its own change).
 *
 * Spec (SelectMulti Widget requirement): reuses the SelectOne row pattern
 * with a square checkbox (radius sm) instead of a circle, and shows an
 * "N seleccionadas" counter (labelMedium/onSurfaceVariant) above the list.
 */

import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  TextInput,
} from 'react-native';
import { refToString } from '@nuup/ts-rosa';
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
import type { ValidatorOverride } from '../form/validation';

/** Seconds for the x-timed-grid countdown (see docblock above re: no param parsing). */
const TIMED_GRID_DURATION_SECONDS = 60;

// Keyed by refKey(nodeRef) (see below) — true while that x-timed-grid
// question's countdown is still running. Read by `timedGridValidatorOverride`
// to decide whether to block `stepForward`. Module-scoped because
// ValidatorOverride.validate is a plain function with no access to this
// widget instance's React state.
const timedGridRunning = new Map<string, boolean>();

/**
 * `refToString` throws on the plain path-string refs used by this repo's
 * test fixtures (see form/Form.tsx's `fieldNameOf` for the same tradeoff) —
 * fall back to the raw value so the running-map key is still stable.
 */
function refKey(ref: NodeRef): string {
  try {
    return refToString(ref as Parameters<typeof refToString>[0]);
  } catch {
    return String(ref);
  }
}

/**
 * Navigation-blocking half of x-timed-grid (see docblock above). Matches
 * only `selectMulti`/`select`/`x-timed-grid` questions. A HOST APP must
 * include this in `<Form validators={[timedGridValidatorOverride, ...]}>`
 * (or register it via `ValidationRegistryProvider`) for the block to take
 * effect — see form/validation.ts D7/D8.
 */
export const timedGridValidatorOverride: ValidatorOverride = {
  match: { dataType: 'selectMulti', controlType: 'select', appearance: 'x-timed-grid' },
  validate: (ctx) => {
    if (timedGridRunning.get(refKey(ctx.nodeRef))) {
      return { type: 'x-timed-grid-running', message: 'Assessment still in progress' };
    }
    return null;
  },
};

export interface SelectMultiWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

/** Column count for the `columns-n` variant, parsed from the raw appearance string (e.g. `columns-3`). */
function parseColumnsN(appearance: string | null | undefined): number {
  const match = (appearance ?? '').toLowerCase().match(/columns-(\d+)/);
  const n = match ? parseInt(match[1] ?? '', 10) : 1;
  return n >= 1 ? n : 1;
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

  // x-timed-grid countdown — in-memory only (see docblock above): resets to
  // TIMED_GRID_DURATION_SECONDS on every mount, so backgrounding/remounting
  // the app mid-assessment restarts the clock rather than resuming it.
  const [secondsRemaining, setSecondsRemaining] = useState(TIMED_GRID_DURATION_SECONDS);
  useEffect(() => {
    if (variant !== 'x-timed-grid') return;
    const key = refKey(nodeRef);
    timedGridRunning.set(key, true);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          timedGridRunning.set(key, false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      clearInterval(interval);
      timedGridRunning.set(key, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, nodeRef]);

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

  if (variant === 'autocomplete') {
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

  if (variant === 'compact') {
    return (
      <View style={styles.container}>
        {counter}
        <FlatList
          testID="select-multi-compact-list"
          data={choices}
          keyExtractor={(item, index) => `${item.value}__${index}`}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.columnsCell}>
              <SelectionRow
                testID={`select-multi-compact-option-${item.value}`}
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

  if (variant === 'list-nolabel') {
    return (
      <View style={styles.container}>
        {counter}
        <View testID="select-multi-list-container" style={styles.likertRow}>
          {choices.map((choice, index) => (
            <SelectionRow
              key={`${choice.value}__${index}`}
              testID={`select-multi-list-option-${choice.value}`}
              control="checkbox"
              density="likert"
              selected={selections.includes(choice.value)}
              label={undefined}
              disabled={isReadonly}
              onPress={() => handleToggle(choice.value)}
            />
          ))}
        </View>
      </View>
    );
  }

  if (variant === 'columns-n') {
    const numColumns = parseColumnsN(appearance);
    return (
      <View style={styles.container}>
        {counter}
        <FlatList
          testID="select-multi-columns-n-list"
          data={choices}
          keyExtractor={(item, index) => `${item.value}__${index}`}
          numColumns={numColumns}
          renderItem={({ item }) => (
            <View style={[styles.columnsCell, { minWidth: `${100 / numColumns}%` }]}>
              <SelectionRow
                testID={`select-multi-columns-n-option-${item.value}`}
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

  if (variant === 'x-timed-grid') {
    const timeUp = secondsRemaining <= 0;
    const mm = String(Math.floor(secondsRemaining / 60)).padStart(2, '0');
    const ss = String(secondsRemaining % 60).padStart(2, '0');
    return (
      <View style={styles.container}>
        <Text testID="select-multi-timed-grid-countdown" style={styles.counter}>
          {`${mm}:${ss}`}
        </Text>
        {counter}
        {/* Plain map, not FlatList (unlike the other multi-column variants
            above): FlatList cells here would need to re-render purely from a
            timer tick with no change to `choices`/`data` itself, and
            VirtualizedList's cell recycling does not reliably pick that up
            even via `extraData` in this RN test renderer — a plain map has
            no such staleness risk. */}
        <View testID="select-multi-timed-grid-list" style={styles.likertRow}>
          {choices.map((choice, index) => (
            <View key={`${choice.value}__${index}`} style={styles.columnsCell}>
              <SelectionRow
                testID={`select-multi-timed-grid-option-${choice.value}`}
                control="checkbox"
                selected={selections.includes(choice.value)}
                label={choice.label ?? choice.value}
                disabled={isReadonly || timeUp}
                onPress={() => handleToggle(choice.value)}
              />
            </View>
          ))}
        </View>
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
