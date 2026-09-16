"use strict";

/**
 * slots.ts — form-composition-slots (design D6, spec capability
 * "form-composition-slots").
 *
 * Render-prop slots let a consumer wrap/replace a piece of Form's default
 * JSX without duplicating its logic, testIDs, or copy: every slot context
 * carries `defaultElement`, the exact JSX Form would have rendered on its
 * own, so a consumer can do `slot: (c) => <MyWrapper>{c.defaultElement}</MyWrapper>`.
 *
 * Omitting `slots` (or any individual slot) must be byte-identical to
 * pre-slots Form output — enforced by `renderSlot`, which returns
 * `defaultElement` unchanged when no render-prop is supplied.
 */

/**
 * Shape of the current validation-block state Form tracks internally.
 *
 * Reconciled with Group D (form-validation-hooks): this is now a re-export
 * alias of `AdvanceBlock` (design D7, `src/form/validation.ts`) rather than a
 * separate duplicate type. Group C defined this locally as a placeholder
 * (`{type: 'required'|'constraint', message}`) because `AdvanceBlock` did not
 * exist yet; now that it does, `renderError`'s block must be exactly the same
 * type a custom validator can produce (including its arbitrary custom `type`
 * tags), so keeping two divergent shapes would silently break custom
 * validators paired with a custom `renderError` slot.
 */

/**
 * Phase 7 decision 10: the section/repeat position indicator's slot
 * context. Separate from `FormGroupSlotContext` because it fires on
 * `question` stops too (not only container stops) and carries `path`
 * rather than `event`.
 */

/**
 * "inject-values" group appearance (design: "inject-values group").
 *
 * A group-only appearance the host app claims exclusively. When the render
 * engine reaches a `group` whose `appearance === INJECT_VALUES_APPEARANCE`,
 * that group — and ALL of its children, injected or not — is NEVER
 * rendered by `Form`. Instead `Form` pauses at the group's own position,
 * collects every DIRECT `question` child's `{ ref, label }` in one
 * side-effect-free look-ahead (mirroring `planFieldList`'s pattern), and
 * hands that list to the `injectValues` slot below along with a `submit`
 * callback that resolves the pause: the host calls it (typically after its
 * own screen/flow completes) to inject the batch in one store commit, let
 * ts-rosa's calculate cascade re-run as a normal consequence of answering,
 * and step the navigator past the whole group in one shot.
 *
 * Exported as a named constant (not inlined at every `appearance === '...'`
 * check) so a future rename of the appearance string only touches one place.
 *
 * KNOWN LIMIT (by design, not a bug): an inject-values group must be flat
 * (question children only). A nested `repeat`/`prompt-new-repeat` is a form
 * configuration error — unsupported, logged as a dev error, and skipped
 * (see `planInjectValues` in `Form.tsx`) rather than silently included.
 */
export const INJECT_VALUES_APPEARANCE = 'inject-values';

/**
 * One pending field of a paused inject-values group, ready for host-side
 * injection. Deliberately flat and JSON-serializable (no functions, no
 * class instances) so a host app can build its own submission UI/logic —
 * validate, render a summary, POST to a backend — from this object alone,
 * without importing anything from `@nuup/ts-rosa` directly. `ref` is the
 * one exception (an opaque branded object, not a plain scalar): it is kept
 * only as the required key for `submit()`'s value map and is not meant to
 * be inspected or serialized itself — everything else on this type is a
 * plain string/boolean/null a host can freely serialize.
 */

/**
 * Invokes `slot` with `ctx` when present; otherwise returns
 * `ctx.defaultElement` unchanged. Keeps the "no slot -> default JSX"
 * invariant in one place instead of repeating `slot ? slot(ctx) : default`
 * at every call site.
 */
export function renderSlot(slot, ctx) {
  return slot ? slot(ctx) : ctx.defaultElement;
}
//# sourceMappingURL=slots.js.map