/**
 * T-05 + T-06: createAdapter RED tests.
 *
 * Tests:
 *  - getCurrentEvent() returns correct AdaptedEvent shape per kind
 *  - No experimental symbol (FormEntryEvent, FormIndex) leaks onto AdaptedEvent
 *  - dataType is correctly surfaced for question events
 *  - jumpToIndex visited-cache: allows jumping to visited positions, throws on unvisited
 *  - stepForward / stepBackward advance/retreat the cursor
 *  - getNodeState / isEffectivelyRelevant / getChoices / answerQuestion / resolveValue delegate
 */
export {};
//# sourceMappingURL=createAdapter.test.d.ts.map