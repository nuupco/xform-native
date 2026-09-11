"use strict";

/**
 * ADR-3: discard-on-resolve cancellation for synchronous-CPU-stretch loads.
 *
 * `parseForm` / `resolveExternalInstances` / `createFormSession` are
 * synchronous CPU work — no JS-level signal can interrupt a running tick,
 * so an `AbortController` threaded into `createFormStore` would be a lie.
 * Instead, `createCancellableFormLoad` uses an epoch/token pattern: cancel
 * flips a flag, and when the wrapped loader eventually settles, a stale
 * (cancelled) result is discarded and the returned promise resolves `null`
 * instead of surfacing the value or a subsequent error. This module is
 * framework/ts-rosa-agnostic — generic over `T`.
 */

/**
 * Wraps `loader()` so that calling `cancel()` before it settles causes the
 * returned promise to resolve `null` instead of the loader's value/error.
 * Cancelling after the loader has already settled is a no-op. Calling
 * `cancel()` more than once is idempotent.
 */
export function createCancellableFormLoad(loader) {
  let cancelled = false;
  let settled = false;
  const promise = loader().then(value => cancelled ? null : value, err => {
    if (cancelled) return null;
    throw err;
  });
  promise.finally(() => {
    settled = true;
  }).catch(() => {
    // Swallow here — the real rejection is already surfaced (or discarded)
    // via `promise` itself; this branch only exists to mark settlement
    // without producing a second unhandled-rejection warning.
  });
  return {
    promise,
    cancel() {
      if (settled) return;
      cancelled = true;
    },
    isCancelled() {
      return cancelled;
    }
  };
}
//# sourceMappingURL=loadCancellation.js.map