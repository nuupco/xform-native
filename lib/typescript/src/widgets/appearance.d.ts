/**
 * appearance.ts — APPEARANCE_TABLE + resolveVariant (ADR-3).
 *
 * Resolution rule:
 *   1. Lowercase + trim the appearance string.
 *   2. Split on whitespace (ODK allows multiple tokens).
 *   3. First recognized token wins.
 *   4. Unknown or absent → that widget's 'default' variant (never throws).
 *
 * Covers PR-3a widget types:
 *   string, int, decimal, long, boolean
 *
 * PR-3b types (selectOne, selectMulti, date, time, dateTime, range) are
 * included in the table for completeness but their widgets are deferred.
 */
import type { DataType } from '@nuup/ts-rosa';
import type { ControlType } from '@nuup/ts-rosa';
export type VariantId = string;
/** Map of recognized appearance tokens → variant id, per (dataType, controlType) bucket. */
export type VariantMap = Readonly<Record<string, VariantId>>;
/**
 * APPEARANCE_TABLE — keyed by dataType (and controlType override when needed).
 * Each entry maps recognized appearance tokens to a variant id.
 * The sentinel key '__default' holds the fallback variant id.
 */
export declare const APPEARANCE_TABLE: Readonly<Partial<Record<DataType | `controlType:${ControlType}`, VariantMap & {
    __default: VariantId;
}>>>;
/**
 * resolveVariant — pick the VariantId for a (dataType, controlType, appearance) triple.
 *
 * Never throws. Unknown input → 'default'.
 */
export declare function resolveVariant(dataType: DataType, controlType: ControlType, appearance: string | null | undefined): VariantId;
//# sourceMappingURL=appearance.d.ts.map