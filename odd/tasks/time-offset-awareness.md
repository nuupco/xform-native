# time-offset-awareness

## Objective
Thread ts-rosa v0.7.4's offset-aware `time` codec end-to-end through
xform-native, so a `time` question's wire value carries the device's real
UTC offset (e.g. `15:59:00.000-06:00`) instead of always collapsing to `Z`.

## Problem / Why
ts-rosa v0.7.4 (commit `eb105eb`) changed the `time` codec (`cast`/`uncast`
in `src/model/data/codecs.ts`) to preserve whatever offset the raw string
carries, instead of always normalizing to `Z`. Confirmed by reading the
actual v0.7.4 source (not guessed):

- `AnswerValue` for `"time"` gained an optional field:
  `{ kind: "time", value: Date, offset?: string, displayText: string }`.
- On parse (`cast`), `new Date("1970-01-01T" + raw)` correctly resolves the
  real UTC instant when `raw` carries an offset (e.g. `-06:00`); the raw
  offset string is captured separately via `parseTrailingOffset` and stored
  in `record.offset`.
- On format (`uncast`), `formatTime(v.value, v.offset)` reformats using the
  stored offset (via `Temporal`), falling back to the legacy `formatUtcTime`
  (`Z`) only when no offset was recorded — so legacy/offset-less data is
  unaffected (backward compatible).
- Only `"time"` changed. `"date"` and `"dateTime"` codecs are untouched.

xform-native currently treats `time` as epoch-anchored and
**timezone-neutral** everywhere:
- `src/widgets/TimeWidget.tsx`: `parseTimeInput` builds
  `new Date('1970-01-01T${h}:${m}:00.000Z')` (entered wall-clock hours
  treated as literal UTC, no real offset concept). `formatTimeDisplay` reads
  `getUTCHours()/getUTCMinutes()`.
- `src/adapter/encodeAnswer.ts`: `toRawString` for `'time'` does
  `primitive.toISOString().slice(11)` — `toISOString()` always ends in `Z`,
  so any offset is impossible to express through this path today.
- `src/adapter/createAdapter.ts`: `resolveValue(ref)` unwraps the
  `AnswerValue` object down to its bare `.value` (the `Date`), discarding
  any `.offset` field — the only place in the adapter that reads answer
  values, so this is where the new `.offset` field currently gets dropped.

## Product decision (resolved with user)
When an existing `time` answer's stored offset differs from the device's
*current* offset (e.g. user traveled after data was captured), the value
displays using **the offset it was captured with**, not the device's
current offset. This preserves data fidelity — matches why ts-rosa
preserves the offset in the first place instead of always normalizing to
the runtime's current zone.

## Design (resolved, ready to implement)
**Write path** (capturing a new answer) — self-contained in `TimeWidget` +
`encodeAnswer`, no signature changes needed on `answerQuestion`/`FormAdapter`:
- `TimeWidget.parseTimeInput`: build the `Date` via the **local** Date
  constructor (`new Date(1970, 0, 0, h, m, 0, 0)`, local components — NOT
  appending `Z`), so the JS runtime resolves it to the correct absolute
  instant using the device's actual current offset rules.
- `encodeAnswer.toRawString`'s `'time'` branch: format using the Date's
  **local** getters (`getHours/getMinutes/getSeconds/getMilliseconds`) plus
  the device's current offset computed from `date.getTimezoneOffset()`
  (sign-inverted, `±HH:MM`), producing e.g. `"15:59:00.000-06:00"` instead
  of `.toISOString().slice(11)`. Because both construction and formatting
  happen in the same call using the same runtime's local rules, this is
  self-consistent without needing to pass an offset as a separate
  parameter anywhere.

**Read path** (displaying an existing answer) — requires exposing the
`AnswerValue.offset` field that `resolveValue` currently discards:
- Add `getAnswerOffset(ref: NodeRef): string | undefined` to `FormAdapter`
  (`src/adapter/FormAdapter.ts`) and implement it in `createAdapter.ts` by
  reading the raw (pre-unwrap) `AnswerValue` at that ref and returning its
  `.offset` field (only meaningful when `kind === 'time'`; return
  `undefined` otherwise). This is additive — does NOT change
  `resolveValue`'s existing "raw primitive" contract (ADR-D-A3/A7), so no
  other widget is affected.
- Add a small pure helper (e.g. in `TimeWidget.tsx` or a shared date-utils
  module if one exists) that, given a `Date` (a correct absolute instant)
  and an offset string (`"Z"` or `"±HH:MM"`), computes the wall-clock
  hour/minute in that fixed offset WITHOUT depending on ts-rosa's internal
  `Temporal` polyfill: shift the instant by the offset's minutes and read
  UTC getters off the shifted instant. `"Z"`/`undefined` offset behaves
  identically to today's `getUTCHours()` path (backward compatible for
  legacy/offset-less data).
- `TimeWidget.formatTimeDisplay`: use `store.adapter.getAnswerOffset(nodeRef)`
  together with the new helper instead of raw `getUTCHours()/getUTCMinutes()`.

**Out of scope**: `date` and `dateTime` question types (codec unchanged
upstream). `DateTimeWidget.tsx`'s own UTC-getter usage is untouched.

## Scope
- `src/adapter/FormAdapter.ts` — new `getAnswerOffset` method signature.
- `src/adapter/createAdapter.ts` — implementation, bump ts-rosa dep already
  done (package.json → v0.7.4, this commit).
- `src/adapter/encodeAnswer.ts` — `'time'` raw-string formatting.
- `src/widgets/TimeWidget.tsx` — local-time construction, offset-aware
  display, new wall-clock-at-offset helper.
- `src/test-support/makeFakeSession.ts` — check whether the fake session's
  `time`-kind handling needs an `offset` field too, for tests to cover this
  without a real ts-rosa engine.
- Tests colocated with each change (TDD: RED before implementation).

## Constraints
- Strict TDD Mode: enabled. Runner: `jest`.
- Must remain backward compatible with legacy `Z`/offset-less stored
  values (existing forms/data already in the field).
- No ts-rosa changes needed — v0.7.4 already ships the required codec
  behavior; this feature is xform-native-only wiring.

## Tasks
- [x] T0: bump `@nuup/ts-rosa` to v0.7.4 (package.json + lockfile),
      confirm no new typecheck/test regressions vs. pre-bump baseline.
- [x] T1: RED — test for write-path offset: answering a `time` question
      produces a raw/cast value whose wire string carries the device's
      real current offset (not always `Z`).
- [x] T2: GREEN — implement `TimeWidget.parseTimeInput` (local Date
      construction) + `encodeAnswer.toRawString`'s `'time'` branch (local
      getters + computed offset).
- [x] T3: RED — test for read-path offset: an answer with a stored offset
      different from a hypothetical "current" offset still displays using
      the STORED offset via `getAnswerOffset` + the wall-clock-at-offset
      helper.
- [x] T4: GREEN — implement `FormAdapter.getAnswerOffset` +
      `createAdapter.ts` implementation + the helper + wire into
      `TimeWidget.formatTimeDisplay`.
- [x] T5: REFACTOR if needed; confirm legacy `Z`/offset-less values still
      display/round-trip identically to before (regression coverage).
- [x] T6: Full suite + typecheck + build; update this file with commit
      evidence per task.

## Acceptance Criteria
- A newly-entered `time` answer's underlying `AnswerValue`/raw string
  carries the device's real current UTC offset.
- An existing `time` answer displays using the offset it was captured
  with, even if the "current" offset differs (per resolved product
  decision).
- Legacy/offset-less stored `time` values behave exactly as before
  (no regression).
- `date`/`dateTime` widgets unaffected.

## Progress / Evidence
- T0 done: `@nuup/ts-rosa` → `github:nuupco/ts-rosa#v0.7.4`. `npx tsc
  --noEmit -p .` and `npx jest --silent` both confirmed against the
  pre-bump baseline on `main` (2067/2068 pass, 1 pre-existing unrelated
  failure in `all-widgets-demo.test.tsx`; identical pre-existing typecheck
  errors, no new ones from the bump).
- T1/T2 done (write path): RED added in
  `src/__tests__/adapter/encodeAnswer.test.ts` ("formats Date for time
  dataType using LOCAL getters + the device current UTC offset") — failed
  first with `Received: "16:30:00.000Z"` vs expected
  `"10:30:00.000-06:00"` (old `.toISOString()` branch). GREEN:
  `src/adapter/encodeAnswer.ts` `toRawString`'s `'time'` branch now builds
  `HH:mm:ss.sss±HH:MM` from local getters + `-date.getTimezoneOffset()`;
  `src/widgets/TimeWidget.tsx` `parseTimeInput` now builds
  `new Date(1970, 0, 0, h, m, 0, 0)` (local components) instead of a
  `Z`-anchored ISO string.
- T3/T4 done (read path): RED added in
  `src/__tests__/adapter/createAdapter.test.ts` ("createAdapter —
  getAnswerOffset") — failed first with `TypeError: adapter.getAnswerOffset
  is not a function`. GREEN: added `getAnswerOffset(ref): string |
  undefined` to `src/adapter/FormAdapter.ts` (additive, `resolveValue`
  untouched) and implemented it in `src/adapter/createAdapter.ts` (reads
  the raw pre-unwrap `AnswerValue`, returns `.offset` only when
  `kind === 'time'`). Added `wallClockAtOffset` helper +
  `formatTimeDisplay(d, offset)` in `src/widgets/TimeWidget.tsx`, wired to
  `store.adapter.getAnswerOffset(nodeRef)`. New RED→GREEN test file
  `src/__tests__/widgets/TimeWidget.offset.test.tsx` covers captured-offset
  display (`-06:00`, `+02:00`) plus two legacy regression cases
  (offset-less and `"Z"`).
  `src/test-support/makeFakeSession.ts` needed NO change — its existing
  `isAnswerValueShaped` passthrough already lets tests pass a full
  `{ kind: 'time', value, offset, displayText }` object directly.
- T5 done: fixed 3 pre-existing tests in
  `src/__tests__/widgets/widgets-pr3b.test.tsx` whose assertions encoded
  the OLD contract (UTC-anchored write path): updated to assert local
  getters (`getHours`/`getMinutes`) on the Date passed to
  `answerQuestion`, and changed one raw-Date test fixture from a UTC ISO
  string to local components so it round-trips through the same
  `encodeAnswer`→`cast()` pipeline as a real answer.
- T6 done — final results vs. the stated T0 baseline (2067/2068, 1
  pre-existing unrelated failure, identical typecheck error set):
  - `npx jest --silent`: **2074/2075 pass**, the same 1 pre-existing
    unrelated failure (`all-widgets-demo.test.tsx`, `questionCount`
    83 vs 85) and none else. Net +7 tests (T1/T3/T5 new + updated cases),
    zero new failures.
  - `npx tsc --noEmit -p .`: **23 errors**, byte-for-byte identical to the
    baseline captured via `git stash` on this same tree (diff empty) — no
    new errors introduced.
  - Working tree left uncommitted per instructions.
