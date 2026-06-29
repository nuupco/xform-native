import type { DataType } from '@nuup/ts-rosa';

export interface IsWidgetAvailableOpts {
  mediatype?: string;
}

/**
 * Lazy require guard for optional native deps (ADR-6, REQ-20).
 * Lives behind a function — never executes at module import time.
 * P1: no native dep paths execute this; the seam exists for P2+.
 */
const tryRequire = (m: string): boolean => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require(m);
    return true;
  } catch {
    return false;
  }
};

/**
 * Static availability map: DataType → (opts?) => boolean.
 *
 * P1 types (all non-native): always return true.
 * Native-dep types (geopoint, binary, geoshape, geotrace): use tryRequire guard.
 * In P1 the optional-dep module names are placeholders — no real native module
 * exists yet; the seam is wired so P2+ can replace the string without API change.
 *
 * NOTE: 'note' and 'range' are NOT DataTypes in ts-rosa (SPEC GAP #1).
 * Their underlying DataTypes ('string', 'int'/'decimal') are covered by P1 entries.
 */
const availabilityRegistry = new Map<
  DataType,
  (opts?: IsWidgetAvailableOpts) => boolean
>([
  // P1 — non-native, always available
  ['string', () => true],
  ['int', () => true],
  ['decimal', () => true],
  ['boolean', () => true],
  ['date', () => true],
  ['time', () => true],
  ['dateTime', () => true],
  ['selectOne', () => true],
  ['selectMulti', () => true],
  ['long', () => true],
  ['uncast', () => true],
  ['unsupported', () => true],

  // Native-dep types — tryRequire seam (P2+)
  ['geopoint', () => tryRequire('@nuup/xform-native-geo')],
  ['geoshape', () => tryRequire('@nuup/xform-native-geo')],
  ['geotrace', () => tryRequire('@nuup/xform-native-geo')],

  // binary: gated by specific optional peer deps (M01-M02)
  [
    'binary',
    (opts) => {
      if (opts?.mediatype === 'image/*') {
        return tryRequire('expo-image-picker');
      }
      if (opts?.mediatype === 'audio/*') {
        return tryRequire('expo-av');
      }
      if (opts?.mediatype === 'video/*') {
        return false; // deferred to P3
      }
      if (opts?.mediatype != null) {
        // Unknown mediatype — check for any generic file picker dep (PR-4)
        return tryRequire('expo-document-picker');
      }
      // No mediatype — true if ANY media dep is present
      return (
        tryRequire('expo-image-picker') ||
        tryRequire('expo-av') ||
        tryRequire('react-native-svg') ||
        tryRequire('expo-document-picker')
      );
    },
  ],
]);

/**
 * Returns true if a widget is available for the given DataType.
 * Never throws — missing registry entry returns false (REQ-20).
 */
export function isWidgetAvailable(
  dataType: DataType,
  opts?: IsWidgetAvailableOpts
): boolean {
  const check = availabilityRegistry.get(dataType);
  if (check === undefined) return false;
  try {
    return check(opts);
  } catch {
    return false;
  }
}
