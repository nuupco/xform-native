/**
 * encodeAnswer — shared widget-primitive -> AnswerValue encode helper.
 *
 * Used by both createAdapter.answerQuestion (real engine commit path) and
 * makeFakeSession.buildFakeTree (test double), so the normalization rules
 * are single-sourced. Casting/formatting/displayText generation is entirely
 * delegated to ts-rosa's public `cast` — this module only normalizes the
 * heterogeneous widget primitive shapes to the raw string `cast` expects.
 *
 * ADR-D-A3 / ADR-D-A7.
 */
import type { AnswerValue, DataType } from '@nuup/ts-rosa';
/**
 * Normalize a widget primitive (string | number | boolean | Date | string[])
 * to the raw string shape `cast()` expects for the given DataType.
 * Returns null for null/undefined (no cast should be attempted).
 */
export declare function toRawString(dataType: DataType, primitive: unknown): string | null;
/**
 * Encode a widget primitive to an AnswerValue | null for the given DataType.
 * Empty string (after normalization) always encodes to null, matching
 * JavaRosa no-answer semantics (REQ-1.3).
 */
export declare function encodeAnswer(dataType: DataType, primitive: unknown): AnswerValue | null;
//# sourceMappingURL=encodeAnswer.d.ts.map