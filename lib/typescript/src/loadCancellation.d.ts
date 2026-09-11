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
export interface CancellableLoad<T> {
    /** Resolves to the loader's value, or `null` if cancelled before settling. */
    promise: Promise<T | null>;
    cancel(): void;
    isCancelled(): boolean;
}
/**
 * Wraps `loader()` so that calling `cancel()` before it settles causes the
 * returned promise to resolve `null` instead of the loader's value/error.
 * Cancelling after the loader has already settled is a no-op. Calling
 * `cancel()` more than once is idempotent.
 */
export declare function createCancellableFormLoad<T>(loader: () => Promise<T>): CancellableLoad<T>;
//# sourceMappingURL=loadCancellation.d.ts.map