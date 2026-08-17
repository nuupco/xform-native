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

export type FormLoadPhase =
  | 'parseForm'
  | 'resolveExternalInstances'
  | 'createFormSession'
  | 'total';

export type PhaseTiming =
  | { phase: FormLoadPhase; event: 'start' }
  | { phase: FormLoadPhase; event: 'end'; durationMs: number; failed?: boolean };

export type PhaseTimingListener = (timing: PhaseTiming) => void;

export type PhaseClock = () => number;

function defaultClock(): number {
  return globalThis.performance?.now?.() ?? Date.now();
}

export interface PhaseTimer {
  run<T>(phase: FormLoadPhase, fn: () => T): T;
  /** Async counterpart of `run` — durationMs spans the awaited promise. */
  runAsync<T>(phase: FormLoadPhase, fn: () => Promise<T>): Promise<T>;
}

/**
 * Creates a phase timer bound to the given listener (and optionally an
 * injected clock, for deterministic tests). `run` executes `fn` between a
 * `start` and `end` event, computing `durationMs` from the clock. If `fn`
 * throws, the `end` event still fires with `failed: true` and the original
 * error is rethrown unchanged.
 */
export function createPhaseTimer(
  listener: PhaseTimingListener,
  clock: PhaseClock = defaultClock
): PhaseTimer {
  return {
    run<T>(phase: FormLoadPhase, fn: () => T): T {
      listener({ phase, event: 'start' });
      const startedAt = clock();
      try {
        const result = fn();
        const durationMs = clock() - startedAt;
        listener({ phase, event: 'end', durationMs });
        return result;
      } catch (err) {
        const durationMs = clock() - startedAt;
        listener({ phase, event: 'end', durationMs, failed: true });
        throw err;
      }
    },
    async runAsync<T>(phase: FormLoadPhase, fn: () => Promise<T>): Promise<T> {
      listener({ phase, event: 'start' });
      const startedAt = clock();
      try {
        const result = await fn();
        const durationMs = clock() - startedAt;
        listener({ phase, event: 'end', durationMs });
        return result;
      } catch (err) {
        const durationMs = clock() - startedAt;
        listener({ phase, event: 'end', durationMs, failed: true });
        throw err;
      }
    },
  };
}
