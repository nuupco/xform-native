/**
 * xformCache — persists XForm XML to the device filesystem for offline use.
 *
 * Ported from expo-enketo-form example.
 * Storage layout: {documentDirectory}xform-cache/
 *   {uid}.xml — raw XForm XML string
 */

import * as FileSystem from 'expo-file-system';

function cacheDir(): string {
  return `${FileSystem.documentDirectory}xform-cache/`;
}

function xmlPath(uid: string): string {
  return `${cacheDir()}${uid}.xml`;
}

export async function saveXForm(uid: string, xml: string): Promise<void> {
  const dir = cacheDir();
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  await FileSystem.writeAsStringAsync(xmlPath(uid), xml, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

export async function loadXForm(
  uid: string
): Promise<{ xml: string } | null> {
  const info = await FileSystem.getInfoAsync(xmlPath(uid));
  if (!info.exists) return null;
  const xml = await FileSystem.readAsStringAsync(xmlPath(uid), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return { xml };
}

export async function clearXForm(uid: string): Promise<void> {
  await FileSystem.deleteAsync(xmlPath(uid), { idempotent: true });
}
