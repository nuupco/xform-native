/**
 * useFormSession — React hook wrapping useSyncExternalStore.
 *
 * REQ-06: components subscribing to a FormSessionStore re-render
 * whenever any mutation occurs (version bump).
 */

import { useSyncExternalStore } from 'react';
import type { FormSessionStore, FormSessionSnapshot } from './FormSessionStore';

export function useFormSession(store: FormSessionStore): FormSessionSnapshot {
  return useSyncExternalStore(
    store.subscribe.bind(store),
    store.getSnapshot.bind(store),
  );
}
