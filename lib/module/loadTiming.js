"use strict";

/**
 * ADR-3: opt-in load-phase timing instrumentation.
 *
 * createPhaseTimer wraps synchronous phases of `createFormStore` (parseForm,
 * resolveExternalInstances, createFormSession) and reports `start`/`end`
 * timing events through a plain-data listener. No ts-rosa type ever appears
 * in this module's public surface — only phase names (strings) and numeric
 * durations cross the boundary, honoring the ADR-2 firewall.
 *
 * The clock defaults to `globalThis.performance.now()` when available
 * (Hermes exposes it) and falls back to `Date.now()` for Node/Jest.
 */

function defaultClock() {
  return globalThis.performance?.now?.() ?? Date.now();
}
/**
 * Creates a phase timer bound to the given listener (and optionally an
 * injected clock, for deterministic tests). `run` executes `fn` between a
 * `start` and `end` event, computing `durationMs` from the clock. If `fn`
 * throws, the `end` event still fires with `failed: true` and the original
 * error is rethrown unchanged.
 */
export function createPhaseTimer(listener, clock = defaultClock) {
  return {
    run(phase, fn) {
      listener({
        phase,
        event: 'start'
      });
      const startedAt = clock();
      try {
        const result = fn();
        const durationMs = clock() - startedAt;
        listener({
          phase,
          event: 'end',
          durationMs
        });
        return result;
      } catch (err) {
        const durationMs = clock() - startedAt;
        listener({
          phase,
          event: 'end',
          durationMs,
          failed: true
        });
        throw err;
      }
    },
    async runAsync(phase, fn) {
      listener({
        phase,
        event: 'start'
      });
      const startedAt = clock();
      try {
        const result = await fn();
        const durationMs = clock() - startedAt;
        listener({
          phase,
          event: 'end',
          durationMs
        });
        return result;
      } catch (err) {
        const durationMs = clock() - startedAt;
        listener({
          phase,
          event: 'end',
          durationMs,
          failed: true
        });
        throw err;
      }
    }
  };
}
//# sourceMappingURL=loadTiming.js.map