/** The persistent directory new media answers are copied into. */
export declare function mediaStorageDirectory(): string;
/**
 * Resolves a bare filename (exactly as stored by `persistMediaFile`/
 * `answerQuestion`, per the ODK/OpenRosa binary-answer convention) to the
 * full local URI a host app — or this package's own widgets — can read the
 * file from.
 */
export declare function resolveMediaUri(filename: string): string;
/**
 * Copies a picker/recorder source URI into the persistent media directory
 * under a generated collision-safe filename (preserving the source file's
 * extension), and returns the **bare filename** — never a path, never a
 * `jr://` scheme (that prefix is reserved for form-authored label/hint media,
 * a different concern — see `FormAdapter.ts`'s `getLabelMediaUri` doc
 * comment) — per the ODK/OpenRosa binary-answer convention (S2).
 *
 * Throws `MediaPersistenceError` when expo-file-system is unavailable, or
 * when the copy fails for any reason — it must NEVER return the raw
 * `sourceUri` as if it were a persisted bare filename, since that would
 * leak an internal, OS-purgeable picker/recorder cache path straight into
 * `answerQuestion` (the exact bug this module exists to fix) and would
 * double-prefix into garbage the next time `resolveMediaUri` reads it back.
 * Callers must catch this and respond explicitly (see each widget's capture
 * handler) rather than treating the rejection as a value to store.
 */
export declare class MediaPersistenceError extends Error {
    readonly cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}
export declare function persistMediaFile(sourceUri: string): Promise<string>;
//# sourceMappingURL=mediaStorage.d.ts.map