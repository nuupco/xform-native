"use strict";

/**
 * useFormSession — React hook wrapping useSyncExternalStore.
 *
 * REQ-06: components subscribing to a FormSessionStore re-render
 * whenever any mutation occurs (version bump).
 */

import { useSyncExternalStore } from 'react';
export function useFormSession(store) {
  return useSyncExternalStore(store.subscribe.bind(store), store.getSnapshot.bind(store));
}
//# sourceMappingURL=useFormSession.js.map