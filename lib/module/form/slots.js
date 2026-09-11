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
 * Invokes `slot` with `ctx` when present; otherwise returns
 * `ctx.defaultElement` unchanged. Keeps the "no slot -> default JSX"
 * invariant in one place instead of repeating `slot ? slot(ctx) : default`
 * at every call site.
 */
export function renderSlot(slot, ctx) {
  return slot ? slot(ctx) : ctx.defaultElement;
}
//# sourceMappingURL=slots.js.map