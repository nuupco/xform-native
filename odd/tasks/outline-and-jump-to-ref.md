# Outline and jumpToRef (question tree + read-only document view)

Objective: additive `adapter.getOutline()` and `adapter.jumpToRef(ref)` (also on `FormSessionStore`) for tlacuache_app. Branch: `feat/outline-and-jump-to-ref`. Delivery: ask-on-risk. Runner: `npx jest`. Target: xform-native 1.6.0; needs ts-rosa 0.8.0 (group/repeat itext labels, `getLabelAt`).

## Specs

- S1. `getOutline()` walks the form without moving the cursor or touching `visitedCache`/`stepCount`; lists only relevant nodes (group | repeat instance | question) in document order with `depth`; ignores `prompt-new-repeat`.
- S2. Question nodes carry label, ref, dataType, controlType, required, answered, value (`resolveValue`) and `displayValue` (selected choice label(s) for selects); repeat nodes carry multiplicity.
- S3. `getOutline()` is read-only: `serializeToXml()` is identical before and after, also for stores created with `{ instanceXml }`.
- S4. `jumpToRef(ref)` moves to any currently relevant position and rebuilds `visitedCache` as the linear relevant prefix BOF→target, `stepCount` = target ordinal, so `stepBackward`/`jumpToIndex(n<=target)` stay coherent. Targets inside field-list / inject-values groups land on the group stop. Non-relevant or uncreated jr:count targets are rejected.
- S5. Purely additive: existing adapter/store behavior unchanged (1.5.7 differential).
- S6. Group/repeat labels use ts-rosa `getLabelAt` once 0.8.0 ships; `labelText` fallback until then.

## Tasks

- [x] T1 (S1-S3) `getOutline` + tests + store passthrough. inline (commit: see git log)
- [x] T2 (S4, S5) `jumpToRef` + cache rebuild + tests; field-list ancestor landing (path-based match). inject-values ancestors land on the group likewise.
- [x] T3 (S6) ts-rosa pinned to v0.8.0; group/repeat labels via `navigator.getLabelAt`.
- [~] T4 README + CHANGELOG done; version bump to 1.6.0, dist, tag, push and release pending the user's go-ahead.

## Log

- L1 (2026-11-10, user): "si vamos, que la version se 0.8.0," (ts-rosa 0.8.0) after the analysis; original ask from tlacuache_app: getOutline/jumpToRef for question tree and read-only document view.
- L2: ts-rosa-4c confirmed: no group/repeat itext label today; incrementIndex/eventAt/resolvePath non-mutating; instanceXml load re-runs calculates and load setvalues (document view not literal for calculated fields).
