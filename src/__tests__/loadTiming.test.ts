/**
 * Task 1 (RED): createPhaseTimer() contract.
 *
 * createPhaseTimer wraps a synchronous phase so callers get `start`/`end`
 * timing events with a computed durationMs, using an injectable clock so
 * tests are deterministic. A throwing phase must still emit an `end` event
 * with `failed: true` and rethrow the original error.
 */
import { createPhaseTimer } from '../loadTiming';
import type { PhaseTiming } from '../loadTiming';

describe('createPhaseTimer', () => {
  it('reports start then end with durationMs computed from the injected clock', () => {
    const events: PhaseTiming[] = [];
    const clockValues = [1000, 1250];
    let i = 0;
    const clock = () => clockValues[i++]!;

    const timer = createPhaseTimer((t) => events.push(t), clock);
    const result = timer.run('parseForm', () => 'ok');

    expect(result).toBe('ok');
    expect(events).toEqual([
      { phase: 'parseForm', event: 'start' },
      { phase: 'parseForm', event: 'end', durationMs: 250 },
    ]);
  });

  it('reports durationMs based on a different elapsed span for a different phase', () => {
    const events: PhaseTiming[] = [];
    const clockValues = [500, 500 + 4000];
    let i = 0;
    const clock = () => clockValues[i++]!;

    const timer = createPhaseTimer((t) => events.push(t), clock);
    timer.run('createFormSession', () => undefined);

    expect(events[1]).toEqual({
      phase: 'createFormSession',
      event: 'end',
      durationMs: 4000,
    });
  });

  it('preserves phase ordering across two sequential calls', () => {
    const events: PhaseTiming[] = [];
    const clockValues = [0, 10, 10, 30];
    let i = 0;
    const clock = () => clockValues[i++]!;

    const timer = createPhaseTimer((t) => events.push(t), clock);
    timer.run('parseForm', () => 'a');
    timer.run('resolveExternalInstances', () => 'b');

    expect(events.map((e) => e.phase)).toEqual([
      'parseForm',
      'parseForm',
      'resolveExternalInstances',
      'resolveExternalInstances',
    ]);
  });

  it('emits end with failed: true and rethrows when the wrapped phase throws', () => {
    const events: PhaseTiming[] = [];
    const clockValues = [100, 175];
    let i = 0;
    const clock = () => clockValues[i++]!;

    const timer = createPhaseTimer((t) => events.push(t), clock);
    const boom = new Error('boom');

    expect(() =>
      timer.run('resolveExternalInstances', () => {
        throw boom;
      })
    ).toThrow(boom);

    expect(events).toEqual([
      { phase: 'resolveExternalInstances', event: 'start' },
      {
        phase: 'resolveExternalInstances',
        event: 'end',
        durationMs: 75,
        failed: true,
      },
    ]);
  });

  it('runAsync reports start then end with durationMs computed across the awaited span', async () => {
    const events: PhaseTiming[] = [];
    const clockValues = [10, 60];
    let i = 0;
    const clock = () => clockValues[i++]!;

    const timer = createPhaseTimer((t) => events.push(t), clock);
    const result = await timer.runAsync('resolveExternalInstances', async () => {
      return 'resolved';
    });

    expect(result).toBe('resolved');
    expect(events).toEqual([
      { phase: 'resolveExternalInstances', event: 'start' },
      { phase: 'resolveExternalInstances', event: 'end', durationMs: 50 },
    ]);
  });

  it('runAsync emits end with failed: true and rethrows when the awaited phase rejects', async () => {
    const events: PhaseTiming[] = [];
    const clockValues = [20, 45];
    let i = 0;
    const clock = () => clockValues[i++]!;
    const boom = new Error('async boom');

    const timer = createPhaseTimer((t) => events.push(t), clock);

    await expect(
      timer.runAsync('resolveExternalInstances', async () => {
        throw boom;
      })
    ).rejects.toThrow(boom);

    expect(events).toEqual([
      { phase: 'resolveExternalInstances', event: 'start' },
      {
        phase: 'resolveExternalInstances',
        event: 'end',
        durationMs: 25,
        failed: true,
      },
    ]);
  });

  it('defaults the clock to globalThis.performance.now when none is injected', () => {
    const events: PhaseTiming[] = [];
    const timer = createPhaseTimer((t) => events.push(t));
    const result = timer.run('parseForm', () => 42);

    expect(result).toBe(42);
    expect(events[0]).toEqual({ phase: 'parseForm', event: 'start' });
    const endEvent = events[1]!;
    expect(endEvent.event).toBe('end');
    if (endEvent.event === 'end') {
      expect(typeof endEvent.durationMs).toBe('number');
      expect(endEvent.durationMs).toBeGreaterThanOrEqual(0);
    }
  });
});
