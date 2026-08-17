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
import type { AdaptedEvent } from '../adapter/FormAdapter';

/** Shape of the current validation-block state Form already tracks internally. */
export interface FormErrorBlock {
  type: 'required' | 'constraint';
  message: string;
}

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

export interface FormSlots {
  renderNavigation?: (ctx: FormNavigationSlotContext) => ReactNode;
  renderError?: (ctx: FormErrorSlotContext) => ReactNode;
  renderGroup?: (ctx: FormGroupSlotContext) => ReactNode;
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
