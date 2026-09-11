"use strict";

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

/**
 * Score a matcher against a candidate (controlType, dataType, appearance)
 * triple. Returns null when the matcher does not match at all.
 */
export function matchScore(matcher, args) {
  let score = 0;
  if (matcher.controlType !== undefined) {
    if (matcher.controlType !== args.controlType) return null;
    score += 4;
  }
  if (matcher.dataType !== undefined) {
    if (matcher.dataType !== args.dataType) return null;
    score += 2;
  }
  if (matcher.appearance !== undefined) {
    const tokens = args.appearance != null ? args.appearance.toLowerCase().trim().split(/\s+/) : [];
    if (!tokens.includes(matcher.appearance.toLowerCase())) return null;
    score += 1;
  }
  return score;
}

/**
 * Pick the highest-scoring entry from a list of `{ match: WidgetMatcher }`
 * entries. Ties go to the LAST registered entry (later entries in the list
 * win over earlier ones at equal score).
 */
export function pickBest(list, args) {
  let best = null;
  let bestScore = -1;
  for (const entry of list) {
    const score = matchScore(entry.match, args);
    if (score === null) continue;
    if (score >= bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return best;
}
//# sourceMappingURL=matchOverride.js.map