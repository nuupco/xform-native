# field-list-nav-and-constraints

## Objective
Fix two bugs surfaced against a real production XForm
(`/home/erick/Downloads/axmY3Z7Ds7qeeLPPYK6rG6 (1).xml`):

1. A `field-list` group loses its field-list rendering when the user
   navigates back into it after finishing its fields.
2. `constraint`/`jr:constraintMsg` validation messages are not shown for
   fields inside a field-list group (only the single most-recently-edited
   field in the whole session can ever surface one).

## Problem / Why
Diagnosed by read-only investigation (confirmed by reading the code, not
guessed):

- **Bug 1**: `handleBack` in `src/form/Form.tsx` does one raw
  `store.stepBackward()`, with no field-list-aware equivalent of
  `handleNext`'s `totalSteps` jump. Stepping back from just past a
  field-list group lands on its last inner leaf question (or, for nested
  field-lists, inside the innermost nested group), so `renderContent()`
  renders it as a single-question screen instead of jumping back to the
  group's own event.
- **Bug 2**: `FormSessionStore.lastAnswerResult` (`src/store/FormSessionStore.ts`)
  is a single global scalar, not scoped per field. `defaultAdvanceValidator`
  (`src/form/validation.ts`) only reports a constraint block when
  `lastAnswerResult.ref === event.ref`. `Form.tsx`'s field-list batch-validate
  loop (`handleNext`) calls this per question across the whole flattened
  field-list plan, but only the single most-recently-touched field anywhere
  in the session can ever match — earlier constraint violations in other
  fields of the same field-list are silently dropped.
- **Secondary/minor**: the fallback message for a bind with no
  `jr:constraintMsg` is the hardcoded English `'Invalid value'`
  (`validation.ts`, mirrored in `createAdapter.ts`), inconsistent with the
  rest of the UI's Spanish copy (e.g. `RequiredSurface`'s
  `'Este campo es obligatorio'`).

Engine-level constraint classification (ts-rosa's `evaluator`/`getNodeState`)
is NOT suspected — `validateAll`'s full-form sweep already has test coverage
for constraint classification, and the traced root causes are both in
xform-native's own navigation/validation-scalar code. No ts-rosa change is
expected to be needed; will only ask `ts-rosa-19` if a repro during
implementation proves otherwise.

## Scope
- `src/form/Form.tsx` — field-list-aware back navigation.
- `src/store/FormSessionStore.ts` and/or `src/form/validation.ts` — replace
  the single global `lastAnswerResult` scalar with per-field-ref tracking
  sufficient for the field-list batch-validate loop to see every field's
  own last result, not just the globally-last one.
- `src/form/validation.ts` / `src/adapter/createAdapter.ts` — Spanish
  fallback constraint message.
- Tests colocated with each change (TDD: RED before implementation).

## Constraints
- Strict TDD Mode: enabled (per user's global CLAUDE.md). Runner: `jest`
  (`npx jest <path>`), source confirmed from repo's existing test setup —
  no project-level override found.
- Don't break existing single-question-at-a-time validation behavior
  (outside field-list groups) which currently relies on the same
  `lastAnswerResult` mechanism.
- No ts-rosa dependency changes expected for this feature.

## Tasks
- [x] T1: RED — write a failing test in `src/__tests__/form/Form.test.tsx`
      (or new file) reproducing bug 1: enter a field-list group, advance
      past it, step back, assert the rendered content is the field-list
      group again (not a single inner question).
      Evidence: added to `src/__tests__/form/Form.field-list.test.tsx`
      (plain + nested field-list back-nav cases). RED confirmed via
      `npx jest src/__tests__/form/Form.field-list.test.tsx -t "bug 1"` —
      both failed on `screen.getByText('Campo A')` (landed on the trailing
      question / inner "Adentro" screen instead of the field-list group).
- [x] T2: GREEN — implement field-list-aware back navigation in
      `handleBack` (Form.tsx): when stepping back lands inside a group
      whose ancestor is a field-list, jump back to that ancestor's event
      (symmetric with `handleNext`'s forward jump).
      Evidence: `src/form/Form.tsx` `handleBack` (~line 685) rewritten to
      unwind via `store.adapter` to the OUTERMOST enclosing field-list
      group's own event (nested field-lists are already flattened into the
      outer group's plan by `scanFieldListBlocks`, so back must match that
      same unit). Confirmed GREEN:
      `npx jest src/__tests__/form/Form.field-list.test.tsx` — 12/12 pass.
- [x] T3: REFACTOR if needed; confirm existing Form navigation tests still
      pass.
      Evidence: `npx jest src/__tests__/form/Form.test.tsx
      src/__tests__/form/Form.inject-values.test.tsx` — 45/45 pass. One
      pre-existing spy-count assertion (`Form.test.tsx` scenario 8) was
      updated (2 → 1) since the explicit back-step now walks via
      `store.adapter` (not `store.stepBackward`) as part of the
      field-list-aware unwind; final rendered behavior (lands at bof) is
      unchanged.
- [x] T4: RED — write a failing test reproducing bug 2: two fields inside
      the same field-list group both get constraint-violating input in the
      same `handleNext` validate pass; assert both surface their
      constraint block (not just the last-edited one).
      Evidence: added to `src/__tests__/form/Form.field-list.test.tsx`
      ("field-list batch validate surfaces every field's own constraint").
      RED confirmed by stashing the fix and re-running: `npx jest
      src/__tests__/form/Form.field-list.test.tsx -t "bug 2"` failed — 0
      `constraint-message` elements rendered. Real root cause turned out
      slightly broader than the doc's literal premise: `planFieldList`
      recomputes fresh `QuestionEvent`/ref objects every render, so the
      pre-fix `lastResult?.ref === event.ref` reference-equality check
      never matched ANY field-list field (not just "all but the
      last-edited one"). The string-keyed per-ref fix (T5) fixes both.
- [x] T5: GREEN — replace the single global `lastAnswerResult` scalar
      (or extend it) with a per-field-ref-keyed structure the batch
      validator can query for the field currently being checked, not just
      "the last field edited anywhere."
      Evidence: `src/store/FormSessionStore.ts` adds a private
      `_lastAnswerResultByRef: Map<string, {ref, result}>` (keyed by a new
      `refKey()` helper using `refToString`, alongside the untouched
      `lastAnswerResult` scalar), populated in `answerQuestion` and
      `injectValues`, plus a public `getLastAnswerResult(ref)` lookup.
      `src/form/validation.ts`'s `defaultAdvanceValidator` now calls
      `store.getLastAnswerResult(event.ref)` instead of the scalar
      comparison. Confirmed GREEN: `npx jest
      src/__tests__/form/Form.field-list.test.tsx` — 13/13 pass.
- [x] T6: REFACTOR if needed; confirm existing single-question validation
      tests still pass (outside field-list).
      Evidence: `npx jest src/__tests__/form/validation.test.ts
      src/__tests__/form/Form.test.tsx` — all pass (mock store in
      `validation.test.ts` extended with a `getLastAnswerResult` fake;
      `Form.tsx`'s progress-tracking effect, which deliberately still reads
      the untouched `lastAnswerResult` scalar for an unrelated reason, is
      unaffected).
- [x] T7: Spanish fallback constraint message — update the hardcoded
      `'Invalid value'` fallback (validation.ts / createAdapter.ts) to
      Spanish, matching `RequiredSurface`'s style. Add/adjust a test
      asserting the fallback string.
      Evidence: both fallbacks changed to `'Valor no válido'`
      (`src/form/validation.ts:80`, `src/adapter/createAdapter.ts:328`).
      Updated the tests that exercised the fallback path (not tests using
      an explicit `constraintMsg: 'Invalid value'` test fixture, which are
      unrelated to the fallback and left as-is):
      `src/__tests__/form/validation.test.ts` ("falls back to a generic
      message...") and `src/__tests__/form/Form.test.tsx` ("constraint
      violation: shows message and does not advance" — E2E_XML's real
      engine also hits the fallback path despite setting
      `jr:constraintMsg`, a pre-existing unrelated engine-resolution
      quirk, out of scope here).
- [x] T8: Full suite + typecheck + build; update this file with commit
      evidence per task.

## Acceptance Criteria
- Field-list groups keep field-list rendering after full back navigation
  from any depth (including nested field-lists like `dia1..dia9`).
- Every field inside a field-list group that fails its own `constraint`
  shows its own message on the batch-validate pass, independent of
  which field was edited last.
- Fallback constraint message (no `jr:constraintMsg`) is in Spanish.
- No regressions in existing Form/validation test suites.

## Progress / Evidence

All 8 tasks (T1-T8) complete. Both bugs fixed, TDD RED→GREEN observed for
each, no commit made (left in working tree per instructions).

- `npx jest --silent`: 2070/2071 pass. Sole failure is the pre-existing,
  documented, unrelated `all-widgets-demo.test.tsx` (expects 83 questions,
  gets 85) — not touched.
- `npx tsc --noEmit -p .`: 23 pre-existing errors, identical set
  before/after this change (verified via `git stash`); none in any file
  this feature touched.
- Files changed: `src/form/Form.tsx` (`handleBack`), `src/store/
  FormSessionStore.ts` (`refKey`, `_lastAnswerResultByRef`,
  `getLastAnswerResult`), `src/form/validation.ts`
  (`defaultAdvanceValidator`), `src/adapter/createAdapter.ts` (fallback
  message); tests in `src/__tests__/form/Form.field-list.test.tsx`,
  `src/__tests__/form/validation.test.ts`, `src/__tests__/form/Form.test.tsx`.
