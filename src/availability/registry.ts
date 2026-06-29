import type { DataType } from '@nuup/ts-rosa';

export interface IsWidgetAvailableOpts {
  mediatype?: string;
}

// ---------------------------------------------------------------------------
// Static availability checks — one per optional peer dep.
// Metro can statically analyze try/catch with string literals but NOT
// require(variable). Each dep gets its own explicit guard function.
// ---------------------------------------------------------------------------

function hasExpoImagePicker(): boolean {
  try {
    require('expo-image-picker');
    return true;
  } catch {
    return false;
  }
}

function hasExpoAv(): boolean {
  try {
    require('expo-av');
    return true;
  } catch {
    return false;
  }
}

function hasExpoCamera(): boolean {
  try {
    require('expo-camera');
    return true;
  } catch {
    return false;
  }
}

function hasExpoDocumentPicker(): boolean {
  try {
    require('expo-document-picker');
    return true;
  } catch {
    return false;
  }
}

function hasReactNativeSvg(): boolean {
  try {
    require('react-native-svg');
    return true;
  } catch {
    return false;
  }
}

function hasGeo(): boolean {
  try {
    require('@nuup/xform-native-geo');
    return true;
  } catch {
    return false;
  }
}

const hasAnyMediaDep = (): boolean =>
  hasExpoImagePicker() ||
  hasExpoAv() ||
  hasReactNativeSvg() ||
  hasExpoDocumentPicker() ||
  hasExpoCamera();

// ---------------------------------------------------------------------------
// Availability registry
// ---------------------------------------------------------------------------

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

  // Native-dep types
  ['geopoint', () => hasGeo()],
  ['geoshape', () => hasGeo()],
  ['geotrace', () => hasGeo()],

  // binary: gated by specific optional peer deps
  [
    'binary',
    (opts) => {
      if (opts?.mediatype === 'image/*') return hasExpoImagePicker();
      if (opts?.mediatype === 'audio/*') return hasExpoAv();
      if (opts?.mediatype === 'video/*') return hasExpoCamera();
      if (opts?.mediatype != null) return hasExpoDocumentPicker();
      return hasAnyMediaDep();
    },
  ],
]);

export function isWidgetAvailable(
  dataType: DataType,
  opts?: IsWidgetAvailableOpts,
): boolean {
  const check = availabilityRegistry.get(dataType);
  if (check === undefined) return false;
  try {
    return check(opts);
  } catch {
    return false;
  }
}
