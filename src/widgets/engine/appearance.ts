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
    masked: 'masked',
    // 'thousands-sep' resolves to default for string (only valid for int/decimal/long)
  },
  int: {
    __default: 'default',
    'thousands-sep': 'thousands-sep',
    bearing: 'bearing',
    counter: 'counter',
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
    __default: 'default', // default = switch; ODK Collect has no boolean appearance variants
  },
  // PR-3b types — table entries exist but widgets deferred
  selectOne: {
    __default: 'default',
    minimal: 'minimal',
    likert: 'likert',
    autocomplete: 'autocomplete',
    columns: 'columns',
    'columns-pack': 'columns-pack',
    compact: 'compact',
    'no-buttons': 'no-buttons',
    quick: 'quick',
    'list-nolabel': 'list-nolabel',
    list: 'list',
    label: 'label',
    map: 'map',
    'image-map': 'image-map',
  },
  selectMulti: {
    __default: 'default',
    minimal: 'minimal',
    columns: 'columns',
    'columns-pack': 'columns-pack',
    compact: 'compact',
    autocomplete: 'autocomplete',
    likert: 'likert',
    'list-nolabel': 'list-nolabel',
    'x-timed-grid': 'x-timed-grid',
  },
  date: {
    __default: 'default',
    'month-year': 'month-year',
    year: 'year',
    'no-calendar': 'no-calendar',
    ethiopian: 'ethiopian',
    coptic: 'coptic',
    islamic: 'islamic',
    persian: 'persian',
    buddhist: 'buddhist',
    // bikram-sambat, myanmar → default: ODK Collect delegates those
    // conversions to external compiled/complex libraries with no published,
    // independently-verifiable source (see calendars.ts docblock) — left as
    // documented gaps.
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
    annotate: 'annotate',
    selfie: 'selfie',
    'front-camera': 'front-camera',
    'new-front': 'new-front',
    new: 'new',
  },
  geopoint: {
    __default: 'default',
    'placement-map': 'placement-map',
  },
  // controlType override for range
  'controlType:range': {
    __default: 'default',
    'no-ticks': 'no-ticks',
    picker: 'picker',
    vertical: 'vertical',
    rating: 'rating',
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

  // ODK Collect evaluates 'minimal' and 'autocomplete' as independent flags
  // (contains()), not a single compound variant. This table resolves by
  // first-recognized-token only, so "minimal autocomplete" lands on
  // 'minimal' — a known limitation: this engine doesn't support real layout
  // composition.
  for (const token of tokens) {
    // columns-n is parametrized (columns-3, columns-12, ...) — the number
    // itself is read from the raw appearance string by the widget, not
    // carried through VariantId, so any recognized numbered token collapses
    // to the same 'columns-n' variant id here.
    if ('columns' in bucket && /^columns-\d+$/.test(token)) {
      return 'columns-n';
    }
    // ODK Collect's Appearances.isMasked() is `contains(MASKED) && !contains(NUMBERS)`
    // — 'numbers' always wins over 'masked' regardless of token order.
    if (token === 'masked' && tokens.includes('numbers')) {
      continue;
    }
    if (token !== '__default' && token in bucket) {
      return bucket[token] as VariantId;
    }
  }

  return bucket.__default;
}
