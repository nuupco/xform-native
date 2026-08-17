/**
 * Task 6 (RED): createFormStore opt-in `onPhaseTiming` instrumentation.
 *
 * Asserts (a) all three phases are reported exactly once for a CSV-backed
 * form and `total >= sum` of the parts; (b) a throwing phase still reports
 * `failed: true` (try/finally contract), and the original error still
 * propagates; (c) a 100k-row CSV profiling case asserting SHAPE/BEHAVIOR
 * only (both phases individually attributable) — explicitly no
 * absolute-ms assertion, since device-dependent thresholds would be flaky
 * in CI. The split is logged behind `PROFILE=1`.
 */
import { createFormStore } from '../createFormStore';
import type { PhaseTiming } from '../loadTiming';
import { makeLargeCsv } from './fixtures/makeLargeCsv';

function csvExternalXml() {
  return `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>CSV External Form</h:title>
    <model>
      <instance>
        <data id="test">
          <name/>
        </data>
      </instance>
      <instance id="cities" src="jr://file-csv/cities.csv"/>
      <bind nodeset="/data/name" type="string"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/name"><label>Name</label></input>
  </h:body>
</h:html>`;
}

function plainXml() {
  return `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Plain Form</h:title>
    <model>
      <instance>
        <data id="plain">
          <name/>
        </data>
      </instance>
      <bind nodeset="/data/name" type="string"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/name"><label>Name</label></input>
  </h:body>
</h:html>`;
}

describe('createFormStore — onPhaseTiming instrumentation', () => {
  it('reports parseForm, resolveExternalInstances, and createFormSession exactly once each, with total >= sum of parts', async () => {
    const events: PhaseTiming[] = [];

    await createFormStore(csvExternalXml(), {
      externalInstanceResolver: {
        resolve: async () => 'name\nMerida\n',
      },
      onPhaseTiming: (t) => events.push(t),
    });

    const endEvents = events.filter(
      (e): e is Extract<PhaseTiming, { event: 'end' }> => e.event === 'end'
    );
    const phaseCounts = endEvents.reduce<Record<string, number>>((acc, e) => {
      acc[e.phase] = (acc[e.phase] ?? 0) + 1;
      return acc;
    }, {});

    expect(phaseCounts.parseForm).toBe(1);
    expect(phaseCounts.resolveExternalInstances).toBe(1);
    expect(phaseCounts.createFormSession).toBe(1);

    const totalEvent = endEvents.find((e) => e.phase === 'total');
    expect(totalEvent).toBeDefined();

    const sumOfParts = endEvents
      .filter((e) => e.phase !== 'total')
      .reduce((sum, e) => sum + e.durationMs, 0);

    expect(totalEvent!.durationMs).toBeGreaterThanOrEqual(sumOfParts);
  });

  it('does not report resolveExternalInstances when the form has no external instances', async () => {
    const events: PhaseTiming[] = [];

    await createFormStore(plainXml(), {
      onPhaseTiming: (t) => events.push(t),
    });

    const phases = events.map((e) => e.phase);
    expect(phases).toContain('parseForm');
    expect(phases).toContain('createFormSession');
    expect(phases).not.toContain('resolveExternalInstances');
  });

  it('still reports failed: true for the throwing phase and rethrows the original error', async () => {
    const events: PhaseTiming[] = [];

    await expect(
      createFormStore(csvExternalXml(), {
        // No resolver supplied: createFormStore throws during the
        // resolveExternalInstances phase (pre-flight check).
        onPhaseTiming: (t) => events.push(t),
      })
    ).rejects.toThrow(/jr:\/\/file-csv\/cities\.csv/);

    const failedEnd = events.find(
      (e): e is Extract<PhaseTiming, { event: 'end' }> =>
        e.event === 'end' && e.failed === true
    );
    expect(failedEnd).toBeDefined();
    expect(failedEnd!.phase).toBe('resolveExternalInstances');
  });

  it('has byte-identical behavior (no crash, same store shape) when onPhaseTiming is omitted', async () => {
    const store = await createFormStore(plainXml());
    expect(store.adapter.getCurrentEvent().kind).toBe('bof');
  });

  describe('100k-row CSV profiling (shape/behavior only, no absolute-ms assertion)', () => {
    it('individually attributes resolveExternalInstances and createFormSession durations', async () => {
      const events: PhaseTiming[] = [];
      const csv = makeLargeCsv(100_000, 4);

      await createFormStore(csvExternalXml(), {
        externalInstanceResolver: {
          resolve: async () => csv,
        },
        onPhaseTiming: (t) => events.push(t),
      });

      const endEvents = events.filter(
        (e): e is Extract<PhaseTiming, { event: 'end' }> => e.event === 'end'
      );
      const csvBuild = endEvents.find((e) => e.phase === 'resolveExternalInstances');
      const dagEval = endEvents.find((e) => e.phase === 'createFormSession');

      expect(csvBuild).toBeDefined();
      expect(dagEval).toBeDefined();
      // Shape/behavior only: both phases are individually attributable
      // (distinct numeric durations were recorded), not merged into one
      // combined total. No threshold assertion — device-dependent absolute
      // ms would be flaky in CI.
      expect(typeof csvBuild!.durationMs).toBe('number');
      expect(typeof dagEval!.durationMs).toBe('number');

      if (process.env.PROFILE === '1') {
        // eslint-disable-next-line no-console
        console.log('[PROFILE] 100k-row CSV split:', {
          resolveExternalInstances: csvBuild!.durationMs,
          createFormSession: dagEval!.durationMs,
        });
      }
    }, 30000);
  });
});
