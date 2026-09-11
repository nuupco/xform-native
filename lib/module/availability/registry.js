"use strict";

// ---------------------------------------------------------------------------
// Static availability checks — one per optional peer dep.
// Metro can statically analyze try/catch with string literals but NOT
// require(variable). Each dep gets its own explicit guard function.
// ---------------------------------------------------------------------------

function hasExpoImagePicker() {
  try {
    require('expo-image-picker');
    return true;
  } catch {
    return false;
  }
}
function hasExpoAudio() {
  try {
    require('expo-audio');
    return true;
  } catch {
    return false;
  }
}
function hasExpoVideo() {
  try {
    require('expo-video');
    return true;
  } catch {
    return false;
  }
}
function hasExpoCamera() {
  try {
    require('expo-camera');
    return true;
  } catch {
    return false;
  }
}
function hasExpoDocumentPicker() {
  try {
    require('expo-document-picker');
    return true;
  } catch {
    return false;
  }
}
function hasReactNativeSvg() {
  try {
    require('react-native-svg');
    return true;
  } catch {
    return false;
  }
}
function hasGeo() {
  try {
    require('@nuup/xform-native-geo');
    return true;
  } catch {
    return false;
  }
}
const hasAnyMediaDep = () => hasExpoImagePicker() || hasExpoAudio() || hasExpoVideo() || hasReactNativeSvg() || hasExpoDocumentPicker() || hasExpoCamera();

// ---------------------------------------------------------------------------
// Availability registry
// ---------------------------------------------------------------------------

const availabilityRegistry = new Map([
// P1 — non-native, always available
['string', () => true], ['int', () => true], ['decimal', () => true], ['boolean', () => true], ['date', () => true], ['time', () => true], ['dateTime', () => true], ['selectOne', () => true], ['selectMulti', () => true], ['long', () => true], ['uncast', () => true], ['unsupported', () => true],
// Native-dep types
['geopoint', () => hasGeo()], ['geoshape', () => hasGeo()], ['geotrace', () => hasGeo()],
// binary: gated by specific optional peer deps
['binary', opts => {
  if (opts?.mediatype === 'image/*') return hasExpoImagePicker();
  if (opts?.mediatype === 'audio/*') return hasExpoAudio();
  if (opts?.mediatype === 'video/*') return hasExpoCamera();
  if (opts?.mediatype != null) return hasExpoDocumentPicker();
  return hasAnyMediaDep();
}]]);
export function isWidgetAvailable(dataType, opts) {
  const check = availabilityRegistry.get(dataType);
  if (check === undefined) return false;
  try {
    return check(opts);
  } catch {
    return false;
  }
}
//# sourceMappingURL=registry.js.map