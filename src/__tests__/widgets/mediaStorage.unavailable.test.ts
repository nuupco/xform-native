/**
 * mediaStorage test — persistMediaFile when expo-file-system is absent.
 *
 * Correction (verifier blocker, media-widget-persistence-and-mediatype-matcher):
 * must throw `MediaPersistenceError`, never silently return the raw source
 * URI. Kept in its own file (no `expo-file-system/legacy` mock) so the
 * module's lazy `require` genuinely fails, same as a host app without the
 * optional peer dep installed.
 */
const { persistMediaFile, MediaPersistenceError } = require('../../widgets/media/mediaStorage');

describe('mediaStorage — expo-file-system unavailable', () => {
  it('throws MediaPersistenceError (never returns the raw source URI)', async () => {
    await expect(
      persistMediaFile('file:///cache/ImagePicker/abc.jpeg'),
    ).rejects.toBeInstanceOf(MediaPersistenceError);
  });
});
