"use strict";

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

import { cast } from '@nuup/ts-rosa';

/**
 * Normalize a widget primitive (string | number | boolean | Date | string[])
 * to the raw string shape `cast()` expects for the given DataType.
 * Returns null for null/undefined (no cast should be attempted).
 */
export function toRawString(dataType, primitive) {
  if (primitive === null || primitive === undefined) {
    return null;
  }
  if (typeof primitive === 'string') {
    return primitive;
  }
  if (typeof primitive === 'number') {
    return String(primitive);
  }
  if (typeof primitive === 'boolean') {
    return primitive ? '1' : '0';
  }
  if (primitive instanceof Date) {
    if (dataType === 'date') {
      return primitive.toISOString().slice(0, 10);
    }
    if (dataType === 'time') {
      // Local getters + the device's CURRENT UTC offset (not toISOString(),
      // which always collapses to "Z") — so cast() resolves the correct
      // absolute instant instead of misreading local wall-clock as UTC.
      const h = String(primitive.getHours()).padStart(2, '0');
      const mi = String(primitive.getMinutes()).padStart(2, '0');
      const s = String(primitive.getSeconds()).padStart(2, '0');
      const ms = String(primitive.getMilliseconds()).padStart(3, '0');
      const offsetMinutes = -primitive.getTimezoneOffset();
      const sign = offsetMinutes >= 0 ? '+' : '-';
      const abs = Math.abs(offsetMinutes);
      const oh = String(Math.floor(abs / 60)).padStart(2, '0');
      const om = String(abs % 60).padStart(2, '0');
      return `${h}:${mi}:${s}.${ms}${sign}${oh}:${om}`;
    }
    // dateTime and any other Date-bearing DataType: full ISO string.
    return primitive.toISOString();
  }
  if (Array.isArray(primitive)) {
    return primitive.join(' ');
  }

  // GeoPoint object (geopoint) — out of scope this slice, documented only.
  if (typeof primitive === 'object' && primitive !== null) {
    const geo = primitive;
    if ('lat' in geo && 'lon' in geo) {
      return `${geo.lat} ${geo.lon} ${geo.alt ?? 0} ${geo.acc ?? 0}`;
    }
  }
  return String(primitive);
}

/**
 * Encode a widget primitive to an AnswerValue | null for the given DataType.
 * Empty string (after normalization) always encodes to null, matching
 * JavaRosa no-answer semantics (REQ-1.3).
 */
export function encodeAnswer(dataType, primitive) {
  const raw = toRawString(dataType, primitive);
  if (raw === null || raw === '') {
    return null;
  }
  return cast(dataType, raw);
}
//# sourceMappingURL=encodeAnswer.js.map