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
export const APPEARANCE_TABLE: Readonly<
  Partial<Record<DataType | `controlType:${ControlType}`, VariantMap & { __default: VariantId }>>
> = {
  string: {
    __default: 'default',
    multiline: 'multiline',
    numbers: 'numbers',
    url: 'url',
    // 'thousands-sep' resolves to default for string (only valid for int/decimal/long)
  },
  int: {
    __default: 'default',
    'thousands-sep': 'thousands-sep',
  },
  decimal: {
    __default: 'default',
    'thousands-sep': 'thousands-sep',
  },
  long: {
    __default: 'default',
    'thousands-sep': 'thousands-sep',
  },
  boolean: {
    __default: 'default', // default = switch
    checkbox: 'checkbox',
  },
  // PR-3b types — table entries exist but widgets deferred
  selectOne: {
    __default: 'default',
    minimal: 'minimal',
    likert: 'likert',
    autocomplete: 'autocomplete',
    'minimal-autocomplete': 'minimal-autocomplete',
    columns: 'columns',
    'columns-pack': 'columns-pack',
    quick: 'quick',
    // map/image → default (P4/P2 defer)
  },
  selectMulti: {
    __default: 'default',
    minimal: 'minimal',
    columns: 'columns',
    'columns-pack': 'columns-pack',
    autocomplete: 'autocomplete',
    'minimal-autocomplete': 'minimal-autocomplete',
    likert: 'likert',
  },
  date: {
    __default: 'default',
    'month-year': 'month-year',
    year: 'year',
  },
  time: {
    __default: 'default',
  },
  dateTime: {
    __default: 'default',
  },
  binary: {
    __default: 'default',
    draw: 'signature',
    signature: 'signature',
  },
  // controlType override for range
  'controlType:range': {
    __default: 'default',
    'no-ticks': 'no-ticks',
    picker: 'picker',
    vertical: 'vertical',
  },
};

/**
 * resolveVariant — pick the VariantId for a (dataType, controlType, appearance) triple.
 *
 * Never throws. Unknown input → 'default'.
 */
export function resolveVariant(
  dataType: DataType,
  controlType: ControlType,
  appearance: string | null | undefined,
): VariantId {
  // controlType:range overrides dataType lookup
  const bucket =
    controlType === 'range'
      ? APPEARANCE_TABLE['controlType:range']
      : APPEARANCE_TABLE[dataType];

  if (!bucket) return 'default';

  if (!appearance || appearance.trim() === '') return bucket.__default;

  const rawTokens = appearance.toLowerCase().trim().split(/\s+/);

  // 'search' is a real-world synonym for 'autocomplete' seen in production
  // XLSForms (e.g. appearance="minimal and search") — treat it identically.
  // Unrecognized filler tokens like 'and' are simply skipped below, same as
  // any other unknown token.
  const tokens = rawTokens.map((t) => (t === 'search' ? 'autocomplete' : t));

  // Special case: 'minimal' + 'autocomplete' are composable (not mutually
  // exclusive) for selectOne/selectMulti — 'minimal' picks the bottom-sheet
  // control style, 'autocomplete' layers a search box on top of it. This is
  // a known, explicit combination — not a general N-token composition system.
  if (
    (dataType === 'selectOne' || dataType === 'selectMulti') &&
    tokens.includes('minimal') &&
    tokens.includes('autocomplete') &&
    'minimal-autocomplete' in bucket
  ) {
    return bucket['minimal-autocomplete'] as VariantId;
  }

  for (const token of tokens) {
    if (token !== '__default' && token in bucket) {
      return bucket[token] as VariantId;
    }
  }

  return bucket.__default;
}
