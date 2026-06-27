"use strict";

/**
 * Lazy require guard for optional native deps (ADR-6, REQ-20).
 * Lives behind a function — never executes at module import time.
 * P1: no native dep paths execute this; the seam exists for P2+.
 */
const tryRequire = m => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require(m);
    return true;
  } catch {
    return false;
  }
};

/**
 * Static availability map: DataType → () => boolean.
 *
 * P1 types (all non-native): always return true.
 * Native-dep types (geopoint, binary, geoshape, geotrace): use tryRequire guard.
 * In P1 the optional-dep module names are placeholders — no real native module
 * exists yet; the seam is wired so P2+ can replace the string without API change.
 *
 * NOTE: 'note' and 'range' are NOT DataTypes in ts-rosa (SPEC GAP #1).
 * Their underlying DataTypes ('string', 'int'/'decimal') are covered by P1 entries.
 */
const availabilityRegistry = new Map([
// P1 — non-native, always available
['string', () => true], ['int', () => true], ['decimal', () => true], ['boolean', () => true], ['date', () => true], ['time', () => true], ['dateTime', () => true], ['selectOne', () => true], ['selectMulti', () => true], ['long', () => true], ['uncast', () => true], ['unsupported', () => true],
// Native-dep types — tryRequire seam (P2+)
// In P1 the module names are intentional non-existent placeholders so the
// seam returns false, which is the correct P1 behavior for these types.
['geopoint', () => tryRequire('@nuup/xform-native-geo')], ['binary', () => tryRequire('@nuup/xform-native-binary')], ['geoshape', () => tryRequire('@nuup/xform-native-geo')], ['geotrace', () => tryRequire('@nuup/xform-native-geo')]]);

/**
 * Returns true if a widget is available for the given DataType.
 * Never throws — missing registry entry returns false (REQ-20).
 */
export function isWidgetAvailable(dataType) {
  const check = availabilityRegistry.get(dataType);
  if (check === undefined) return false;
  try {
    return check();
  } catch {
    return false;
  }
}
//# sourceMappingURL=registry.js.map