/**
 * validation.ts — injectable per-controlType validation callback (design D7/D8,
 * spec "form-validation-hooks").
 *
 * D7: this is a PLAIN CALLBACK, not a React hook. It is invoked from inside
 * Form.tsx's existing `handleNext` useCallback (no new hooks added there), so
 * it can never introduce conditional hook calls and cannot threaten the
 * `select-widgets-hook-order.test.tsx` invariant.
 *
 * D8: validator overrides use the SAME specificity matcher as widget
 * overrides (matchOverride.ts) but a SEPARATE registered list — overriding a
 * widget's look must not silently replace its validation.
 *
 * `defaultAdvanceValidator` is extracted 1:1 from the pre-existing inline
 * logic in Form.tsx's `handleNext` (required-empty check, then
 * CONSTRAINT_VIOLATED check against `store.lastAnswerResult`). A custom
 * validator receives `ctx.defaultValidate()` so it can compose over the
 * default instead of reimplementing it from scratch.
 */
import type { ReactNode } from 'react';
import type { AdaptedEvent, NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
import { type WidgetMatcher } from '../widgets/engine/matchOverride.js';
/** A question-kind AdaptedEvent — the only kind `handleNext` validates. */
export type QuestionEvent = Extract<AdaptedEvent, {
    kind: 'question';
}>;
/**
 * Result of a validation attempt. `type` is `'required' | 'constraint'` for
 * the built-in cases, but a custom validator may return any other string tag
 * (the `string & {}` trick keeps autocomplete for the two known literals
 * while still accepting arbitrary custom tags).
 */
export interface AdvanceBlock {
    type: 'required' | 'constraint' | (string & {});
    message: string;
}
export interface AdvanceValidatorCtx {
    nodeRef: NodeRef;
    store: FormSessionStore;
    event: QuestionEvent;
    /** Runs the extracted default (required/constraint) validation. */
    defaultValidate: () => AdvanceBlock | null;
}
export type AdvanceValidator = (ctx: AdvanceValidatorCtx) => AdvanceBlock | null;
export interface ValidatorOverride {
    match: WidgetMatcher;
    validate: AdvanceValidator;
}
/**
 * Extracted 1:1 from Form.tsx's pre-existing inline `handleNext` logic
 * (required-empty check, then CONSTRAINT_VIOLATED check against
 * `store.lastAnswerResult`). Byte-identical behavior to before this change.
 */
export declare const defaultAdvanceValidator: AdvanceValidator;
/**
 * Resolve the best-matching registered validator override for `event`, or
 * `null` when none matches (caller falls back to `defaultAdvanceValidator`).
 */
export declare function resolveValidator(event: QuestionEvent, overrides: readonly ValidatorOverride[]): AdvanceValidator | null;
export interface ValidationRegistryProviderProps {
    validators: readonly ValidatorOverride[];
    children: ReactNode;
}
export declare function ValidationRegistryProvider(p: ValidationRegistryProviderProps): import("react").FunctionComponentElement<import("react").ProviderProps<readonly ValidatorOverride[]>>;
export declare function useValidatorOverrides(): readonly ValidatorOverride[];
//# sourceMappingURL=validation.d.ts.map