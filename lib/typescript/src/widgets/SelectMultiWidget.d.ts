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
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
import type { ValidatorOverride } from '../form/validation.js';
/**
 * Navigation-blocking half of x-timed-grid (see docblock above). Matches
 * only `selectMulti`/`select`/`x-timed-grid` questions. A HOST APP must
 * include this in `<Form validators={[timedGridValidatorOverride, ...]}>`
 * (or register it via `ValidationRegistryProvider`) for the block to take
 * effect — see form/validation.ts D7/D8.
 */
export declare const timedGridValidatorOverride: ValidatorOverride;
export interface SelectMultiWidgetProps {
    nodeRef: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function SelectMultiWidget({ nodeRef, store, appearance }: SelectMultiWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=SelectMultiWidget.d.ts.map