/**
 * useFormSession — React hook wrapping useSyncExternalStore.
 *
 * REQ-06: components subscribing to a FormSessionStore re-render
 * whenever any mutation occurs (version bump).
 */
import type { FormSessionStore, FormSessionSnapshot } from './FormSessionStore.js';
export declare function useFormSession(store: FormSessionStore): FormSessionSnapshot;
//# sourceMappingURL=useFormSession.d.ts.map