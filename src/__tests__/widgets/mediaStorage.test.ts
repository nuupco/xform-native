/**
 * mediaStorage tests — S4(b): `resolveMediaUri`/`mediaStorageDirectory`'s
 * exact URI shape (media-widget-persistence-and-mediatype-matcher).
 *
 * `expo-file-system/legacy` mocking pattern mirrors
 * `src/__tests__/integration/satelliteTileCache.test.ts`.
 */

const mockFs = {
  documentDirectory: 'file:///mock-documents/',
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
};

jest.mock('expo-file-system/legacy', () => mockFs, { virtual: true });

// Plain `require` (not a static ES `import`) — same rationale as
// satelliteTileCache.test.ts: ES imports are hoisted above the `jest.mock`
// factory's closed-over `mockFs` const.
const { mediaStorageDirectory, resolveMediaUri, persistMediaFile } =
  require('../../widgets/media/mediaStorage');

beforeEach(() => {
  jest.clearAllMocks();
  mockFs.makeDirectoryAsync.mockResolvedValue(undefined);
  mockFs.copyAsync.mockResolvedValue(undefined);
});

describe('mediaStorage', () => {
  it('mediaStorageDirectory uses expo-file-system/legacy documentDirectory + the xform-media subdirectory', () => {
    expect(mediaStorageDirectory()).toBe('file:///mock-documents/xform-media/');
  });

  it('resolveMediaUri returns the exact same shape persistMediaFile stores to', async () => {
    mockFs.copyAsync.mockImplementation(async ({ to }: { to: string }) => {
      expect(to.startsWith(mediaStorageDirectory())).toBe(true);
    });

    const filename = await persistMediaFile('file:///cache/ImagePicker/abc.jpeg');

    expect(resolveMediaUri(filename)).toBe(`${mediaStorageDirectory()}${filename}`);
    expect(resolveMediaUri(filename)).toBe(`file:///mock-documents/xform-media/${filename}`);
  });

  it('resolveMediaUri never includes a path or jr:// scheme for a bare filename', () => {
    const uri = resolveMediaUri('photo-123.jpg');
    expect(uri).toBe('file:///mock-documents/xform-media/photo-123.jpg');
    expect(uri.startsWith('jr://')).toBe(false);
  });
});
