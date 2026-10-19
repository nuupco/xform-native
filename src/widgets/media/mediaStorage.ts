/**
 * mediaStorage — persistent on-device storage for binary/media question
 * answers (S2/S3, media-widget-persistence-and-mediatype-matcher).
 *
 * Mirrors the existing persistent-storage convention from
 * `packages/xform-native-geo/src/SatelliteTileCache.ts`: `expo-file-system/legacy`'s
 * `documentDirectory` (not `cacheDirectory`) so persisted media survives OS
 * cache purges, and the `/legacy` subpath (not the new expo-file-system API)
 * for parity with that existing convention.
 *
 * Gated on expo-file-system (optional peer dep, same lazy-require pattern
 * every other optional media dep in this package uses — see ImageWidget's
 * `getImagePicker`, etc.). Unlike those widgets, there is no
 * UnsupportedWidget fallback here: expo-file-system only affects *where* a
 * captured file durably lives, not whether capture itself works, so
 * `persistMediaFile` degrades gracefully to returning the original source
 * URI unchanged when the dep is absent (or the copy fails for any reason)
 * rather than making the whole widget unavailable.
 */
let _FileSystem: any | null = null;
let _fsLoaded: boolean | undefined;

function getFileSystem(): any | null {
  if (_fsLoaded === undefined) {
    try {
      _FileSystem = require('expo-file-system/legacy');
      _fsLoaded = true;
    } catch {
      _fsLoaded = false;
    }
  }
  return _FileSystem;
}

const MEDIA_SUBDIR = 'xform-media';

/** The persistent directory new media answers are copied into. */
export function mediaStorageDirectory(): string {
  const fs = getFileSystem();
  const base = fs?.documentDirectory ?? 'file:///tmp/';
  return `${base}${MEDIA_SUBDIR}/`;
}

/**
 * Resolves a bare filename (exactly as stored by `persistMediaFile`/
 * `answerQuestion`, per the ODK/OpenRosa binary-answer convention) to the
 * full local URI a host app — or this package's own widgets — can read the
 * file from.
 */
export function resolveMediaUri(filename: string): string {
  return `${mediaStorageDirectory()}${filename}`;
}

function extensionOf(uri: string): string {
  const withoutQuery = uri.split('?')[0].split('#')[0];
  const lastSegment = withoutQuery.split('/').pop() ?? '';
  const dotIndex = lastSegment.lastIndexOf('.');
  return dotIndex > 0 ? lastSegment.slice(dotIndex) : '';
}

/**
 * Generates a collision-safe filename stem. No `uuid` package is currently a
 * dependency of this library, so this is a small local RFC4122-v4-shaped
 * generator — good enough for local collision-avoidance, not intended as a
 * cryptographic guarantee.
 */
function generateId(): string {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

/**
 * Copies a picker/recorder source URI into the persistent media directory
 * under a generated collision-safe filename (preserving the source file's
 * extension), and returns the **bare filename** — never a path, never a
 * `jr://` scheme (that prefix is reserved for form-authored label/hint media,
 * a different concern — see `FormAdapter.ts`'s `getLabelMediaUri` doc
 * comment) — per the ODK/OpenRosa binary-answer convention (S2).
 *
 * Best-effort: if expo-file-system is unavailable, or the copy fails for any
 * reason, falls back to returning the original source URI unchanged so
 * capture still "works" (just without durable persistence) rather than
 * throwing.
 */
export async function persistMediaFile(sourceUri: string): Promise<string> {
  const fs = getFileSystem();
  if (!fs) return sourceUri;
  try {
    const dir = mediaStorageDirectory();
    await fs.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const filename = `${generateId()}${extensionOf(sourceUri)}`;
    const destination = `${dir}${filename}`;
    await fs.copyAsync({ from: sourceUri, to: destination });
    return filename;
  } catch {
    return sourceUri;
  }
}
