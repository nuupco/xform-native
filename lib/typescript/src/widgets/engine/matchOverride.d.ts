/**
 * matchOverride.ts — matchScore/pickBest specificity matcher (design D4/D8).
 *
 * Shared by the widget override registry (registry.ts) and the future
 * validation override registry — the matcher is shared, the lists are not
 * (D8: overriding a widget's look must not silently replace its validation).
 *
 * Specificity: controlType=4, dataType=2, appearance=1. A matcher with no
 * fields matches anything with score 0. Any specified field that mismatches
 * makes the whole matcher not match (returns null). Ties -> last registered
 * wins (pickBest uses >= so a later equal-or-better score replaces the
 * current best).
 */
import type { DataType, ControlType } from '@nuup/ts-rosa';
export interface WidgetMatcher {
    controlType?: ControlType;
    dataType?: DataType;
    appearance?: string;
}
export interface MatchArgs {
    controlType: ControlType;
    dataType: DataType;
    appearance: string | null | undefined;
}
/**
 * Score a matcher against a candidate (controlType, dataType, appearance)
 * triple. Returns null when the matcher does not match at all.
 */
export declare function matchScore(matcher: WidgetMatcher, args: MatchArgs): number | null;
/**
 * Pick the highest-scoring entry from a list of `{ match: WidgetMatcher }`
 * entries. Ties go to the LAST registered entry (later entries in the list
 * win over earlier ones at equal score).
 */
export declare function pickBest<T extends {
    match: WidgetMatcher;
}>(list: readonly T[], args: MatchArgs): T | null;
//# sourceMappingURL=matchOverride.d.ts.map