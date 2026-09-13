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

import type { ReactNode } from 'react';
import type { DataType, ControlType } from '@nuup/ts-rosa';
import type { AdaptedEvent, NodeRef, PathSegment } from '../adapter/FormAdapter';
import type { AdvanceBlock } from './validation';

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
export type FormErrorBlock = AdvanceBlock;

export interface FormNavigationSlotContext {
  onBack: () => void;
  onNext: () => void;
  defaultElement: ReactNode;
}

export interface FormErrorSlotContext {
  block: FormErrorBlock;
  defaultElement: ReactNode;
}

export interface FormGroupSlotContext {
  event: AdaptedEvent;
  defaultElement: ReactNode;
}

/**
 * Phase 7 decision 10: the section/repeat position indicator's slot
 * context. Separate from `FormGroupSlotContext` because it fires on
 * `question` stops too (not only container stops) and carries `path`
 * rather than `event`.
 */
export interface FormSectionIndicatorSlotContext {
  path: readonly PathSegment[];
  defaultElement: ReactNode;
}

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
export interface InjectValuesField {
  ref: NodeRef;
  /** Stable, human/host-readable field identifier (`refToString(ref)`) — safe to use as a map/object key or to send to a backend instead of `ref`. */
  name: string;
  label: string | null;
  /** Question's data type, as already resolved by the engine (e.g. 'string', 'int', 'select1'). */
  dataType: DataType;
  /** Question's control/widget type, as already resolved by the engine. */
  controlType: ControlType;
  /** Already-evaluated engine state (`FormAdapter.getNodeState`) — NOT re-validated here. `true` means the engine currently requires/considers relevant this field. */
  required: boolean;
  /** Already-evaluated engine state (`FormAdapter.getNodeState`) — whether this field is currently relevant given the form's live conditions. */
  relevant: boolean;
  /** Already-evaluated engine state (`FormAdapter.getNodeState().constraintMsg`) — the field's last constraint-violation message, if any. `null` when no constraint is currently violated. This code does not run new validation. */
  constraintMessage: string | null;
}

export interface InjectValuesSlotContext {
  /** Every direct question child of the paused group, in document order. */
  fields: readonly InjectValuesField[];
  /**
   * Resolves the pause: injects `values` (keyed by the exact `NodeRef`s
   * handed back in `fields`) in one store commit, then advances the
   * navigator past the whole group. Call this once, whenever the host is
   * ready (immediately, or after navigating through its own screens).
   */
  submit: (values: ReadonlyMap<NodeRef, unknown>) => void;
  /**
   * Always `null` — there is no default UI for this pause (design
   * contract: the group never renders on its own). Present only so
   * `injectValues` fits the same `renderSlot`/`defaultElement` shape as
   * every other slot; a form that declares an inject-values group without
   * wiring this slot simply renders nothing at that step.
   */
  defaultElement: null;
}

export interface FormSlots {
  renderNavigation?: (ctx: FormNavigationSlotContext) => ReactNode;
  renderError?: (ctx: FormErrorSlotContext) => ReactNode;
  renderGroup?: (ctx: FormGroupSlotContext) => ReactNode;
  /** Additive (Phase 7 decision 8/10): override or opt out (return `null`) of the default `SectionIndicator`. */
  renderSectionIndicator?: (ctx: FormSectionIndicatorSlotContext) => ReactNode;
  /** Additive (inject-values group appearance): the ONLY way to surface a paused inject-values group's fields — see `INJECT_VALUES_APPEARANCE`. */
  injectValues?: (ctx: InjectValuesSlotContext) => ReactNode;
}

/**
 * Invokes `slot` with `ctx` when present; otherwise returns
 * `ctx.defaultElement` unchanged. Keeps the "no slot -> default JSX"
 * invariant in one place instead of repeating `slot ? slot(ctx) : default`
 * at every call site.
 */
export function renderSlot<C extends { defaultElement: ReactNode }>(
  slot: ((ctx: C) => ReactNode) | undefined,
  ctx: C
): ReactNode {
  return slot ? slot(ctx) : ctx.defaultElement;
}
