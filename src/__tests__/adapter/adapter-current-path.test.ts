/**
 * PR1 slice 1b — FormAdapter.getCurrentPath() (design decisions 1-3, 6, 15,
 * 16 / spec "Adapter exposes current ancestor path").
 *
 * Most scenarios use the REAL ts-rosa engine (navigator.resolvePath +
 * countRepeatInstances need a real FormDefinition.body / InstanceTree to
 * exercise faithfully — the fake session's tree is flat and cannot model
 * nested repeat totals). The decision-16 positive/negative gates use the
 * fake session, since those are specifically about fake-support presence,
 * not tree-walking fidelity.
 */
import { DOMParser } from '@xmldom/xmldom';
import { parseDocument, createFormSession } from '@nuup/ts-rosa';
import { createAdapter } from '../../adapter/createAdapter';
import { makeFakeSession } from '../../test-support/makeFakeSession';

function parseXml(xml: string) {
  const doc = new DOMParser().parseFromString(
    xml,
    'text/xml'
  ) as unknown as Document;
  return parseDocument(doc);
}

function makeRealAdapter(xml: string) {
  const def = parseXml(xml);
  const session = createFormSession(def);
  return { adapter: createAdapter(session), session };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FLAT_QUESTION_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Flat</h:title>
    <model>
      <instance><data id="flat"><name/></data></instance>
      <bind nodeset="/data/name" type="string"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/name"><label>Name</label></input>
  </h:body>
</h:html>`;

const ONE_GROUP_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>One Group</h:title>
    <model>
      <instance><data id="one-group"><grp><name/></grp></data></instance>
      <bind nodeset="/data/grp/name" type="string"/>
    </model>
  </h:head>
  <h:body>
    <group ref="/data/grp">
      <label>Datos del productor</label>
      <input ref="/data/grp/name"><label>Name</label></input>
    </group>
  </h:body>
</h:html>`;

const UNLABELED_GROUP_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Unlabeled Group</h:title>
    <model>
      <instance><data id="unlabeled-group"><grp><name/></grp></data></instance>
      <bind nodeset="/data/grp/name" type="string"/>
    </model>
  </h:head>
  <h:body>
    <group ref="/data/grp">
      <input ref="/data/grp/name"><label>Name</label></input>
    </group>
  </h:body>
</h:html>`;

const GROUP_REPEAT_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Group Repeat</h:title>
    <model>
      <instance>
        <data id="group-repeat">
          <grp>
            <items jr:template="">
              <q/>
            </items>
          </grp>
        </data>
      </instance>
      <bind nodeset="/data/grp/items/q" type="string"/>
    </model>
  </h:head>
  <h:body>
    <group ref="/data/grp">
      <label>Grupo</label>
      <repeat nodeset="/data/grp/items">
        <label>Item</label>
        <input ref="/data/grp/items/q"><label>Q</label></input>
      </repeat>
    </group>
  </h:body>
</h:html>`;

const MANUAL_REPEAT_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Manual Repeat</h:title>
    <model>
      <instance>
        <data id="manual-repeat">
          <parcela jr:template=""><q/></parcela>
        </data>
      </instance>
      <bind nodeset="/data/parcela/q" type="string"/>
    </model>
  </h:head>
  <h:body>
    <repeat nodeset="/data/parcela">
      <label>Parcela</label>
      <input ref="/data/parcela/q"><label>Q</label></input>
    </repeat>
  </h:body>
</h:html>`;

const NESTED_REPEAT_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Nested Repeat</h:title>
    <model>
      <instance>
        <data id="nested-repeat">
          <outer jr:template="">
            <inner jr:template=""><q/></inner>
          </outer>
        </data>
      </instance>
      <bind nodeset="/data/outer/inner/q" type="string"/>
    </model>
  </h:head>
  <h:body>
    <repeat nodeset="/data/outer">
      <label>Outer</label>
      <repeat nodeset="/data/outer/inner">
        <label>Inner</label>
        <input ref="/data/outer/inner/q"><label>Q</label></input>
      </repeat>
    </repeat>
  </h:body>
</h:html>`;

function countRepeatXml(n: number) {
  return `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Count Repeat</h:title>
    <model>
      <instance>
        <data id="count-repeat">
          <n>${n}</n>
          <parcela jr:template=""><q/></parcela>
        </data>
      </instance>
      <bind nodeset="/data/n" type="int"/>
      <bind nodeset="/data/parcela/q" type="string"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/n"><label>N</label></input>
    <repeat nodeset="/data/parcela" jr:count="/data/n">
      <label>Parcela</label>
      <input ref="/data/parcela/q"><label>Q</label></input>
    </repeat>
  </h:body>
</h:html>`;
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

describe('createAdapter — getCurrentPath', () => {
  it('flat top-level question ⇒ []', () => {
    const { adapter } = makeRealAdapter(FLAT_QUESTION_XML);
    adapter.stepForward(); // -> question
    expect(adapter.getCurrentEvent().kind).toBe('question');
    expect(adapter.getCurrentPath()).toEqual([]);
  });

  it('bof ⇒ []', () => {
    const { adapter } = makeRealAdapter(FLAT_QUESTION_XML);
    expect(adapter.getCurrentEvent().kind).toBe('bof');
    expect(adapter.getCurrentPath()).toEqual([]);
  });

  it('eof ⇒ []', () => {
    const { adapter } = makeRealAdapter(FLAT_QUESTION_XML);
    adapter.stepForward(); // -> question
    adapter.stepForward(); // -> eof
    expect(adapter.getCurrentEvent().kind).toBe('eof');
    expect(adapter.getCurrentPath()).toEqual([]);
  });

  it('question nested inside one group ⇒ one group segment', () => {
    const { adapter } = makeRealAdapter(ONE_GROUP_XML);
    adapter.stepForward(); // -> group
    adapter.stepForward(); // -> question inside group
    expect(adapter.getCurrentEvent().kind).toBe('question');
    expect(adapter.getCurrentPath()).toEqual([
      { kind: 'group', label: 'Datos del productor', multiplicity: null, total: null, countBound: false },
    ]);
  });

  it('group with a null label ⇒ segment carries label: null, chain does not shift', () => {
    const { adapter } = makeRealAdapter(UNLABELED_GROUP_XML);
    adapter.stepForward(); // -> group
    adapter.stepForward(); // -> question inside group
    const path = adapter.getCurrentPath();
    expect(path).toHaveLength(1);
    expect(path[0]).toMatchObject({ kind: 'group', label: null });
  });

  it('walker sitting ON the group event itself ⇒ the group is the (only) segment', () => {
    const { adapter } = makeRealAdapter(ONE_GROUP_XML);
    adapter.stepForward(); // -> group
    expect(adapter.getCurrentEvent().kind).toBe('group');
    expect(adapter.getCurrentPath()).toEqual([
      { kind: 'group', label: 'Datos del productor', multiplicity: null, total: null, countBound: false },
    ]);
  });

  it('question nested inside group → repeat ⇒ two segments, root→leaf order', () => {
    const { adapter } = makeRealAdapter(GROUP_REPEAT_XML);
    adapter.stepForward(); // -> group (Grupo)
    adapter.stepForward(); // -> prompt-new-repeat (items, no instances yet)
    const promptEv = adapter.getCurrentEvent();
    if (promptEv.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat');
    adapter.createRepeatInstance(promptEv.ref);
    adapter.stepForward(); // -> question inside the new instance
    expect(adapter.getCurrentEvent().kind).toBe('question');

    const path = adapter.getCurrentPath();
    expect(path).toHaveLength(2);
    expect(path[0]).toEqual({
      kind: 'group',
      label: 'Grupo',
      multiplicity: null,
      total: null,
      countBound: false,
    });
    expect(path[1]).toMatchObject({
      kind: 'repeat',
      label: 'Item',
      multiplicity: 0,
      total: 1,
      countBound: false,
    });
  });

  it('walker sitting ON a prompt-new-repeat event ⇒ the pending repeat is the final segment', () => {
    const { adapter } = makeRealAdapter(GROUP_REPEAT_XML);
    adapter.stepForward(); // -> group
    adapter.stepForward(); // -> prompt-new-repeat
    expect(adapter.getCurrentEvent().kind).toBe('prompt-new-repeat');
    const path = adapter.getCurrentPath();
    expect(path).toHaveLength(2);
    expect(path[1]).toMatchObject({ kind: 'repeat', label: 'Item', total: 0 });
  });

  it('repeat with no ancestor groups ⇒ exactly one segment', () => {
    const { adapter } = makeRealAdapter(MANUAL_REPEAT_XML);
    adapter.stepForward(); // -> prompt-new-repeat (no ancestor group)
    const ev = adapter.getCurrentEvent();
    if (ev.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat');
    expect(adapter.getCurrentPath()).toEqual([
      { kind: 'repeat', label: 'Parcela', multiplicity: 0, total: 0, countBound: false },
    ]);
  });

  it('walker sitting ON a repeat event (post-creation) ⇒ the repeat itself is the final segment', () => {
    const { adapter } = makeRealAdapter(MANUAL_REPEAT_XML);
    adapter.stepForward(); // -> prompt-new-repeat
    const promptEv = adapter.getCurrentEvent();
    if (promptEv.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat');
    adapter.createRepeatInstance(promptEv.ref);
    adapter.stepForward(); // -> question inside new instance (manual repeats have no 'repeat' stop distinct from the question — verify actual kind)
    const ev = adapter.getCurrentEvent();
    expect(ev.kind).toBe('question');
    expect(adapter.getCurrentPath()).toEqual([
      { kind: 'repeat', label: 'Parcela', multiplicity: 0, total: 1, countBound: false },
    ]);
  });

  it('question inside repeat-within-repeat ⇒ both repeats carry independent multiplicity/total', () => {
    const { adapter } = makeRealAdapter(NESTED_REPEAT_XML);
    adapter.stepForward(); // -> prompt-new-repeat (outer, no instances)
    const outerPrompt = adapter.getCurrentEvent();
    if (outerPrompt.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat (outer)');
    adapter.createRepeatInstance(outerPrompt.ref);
    adapter.stepForward(); // -> prompt-new-repeat (inner, within outer[0], no instances)
    const innerPrompt = adapter.getCurrentEvent();
    if (innerPrompt.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat (inner)');
    adapter.createRepeatInstance(innerPrompt.ref);
    adapter.stepForward(); // -> question q
    expect(adapter.getCurrentEvent().kind).toBe('question');

    const path = adapter.getCurrentPath();
    expect(path).toHaveLength(2);
    expect(path[0]).toMatchObject({ kind: 'repeat', label: 'Outer', multiplicity: 0, total: 1 });
    expect(path[1]).toMatchObject({ kind: 'repeat', label: 'Inner', multiplicity: 0, total: 1 });
  });

  it('repeat with countExpr set ⇒ countBound: true, total is the live instance count, not a parse of the expression', () => {
    const { adapter } = makeRealAdapter(countRepeatXml(1));
    adapter.stepForward(); // -> question /data/n
    adapter.stepForward(); // -> auto-created repeat instance stop (walker lands ON the repeat itself)
    expect(adapter.getCurrentEvent().kind).toBe('repeat');

    const path = adapter.getCurrentPath();
    expect(path).toHaveLength(1);
    // countExpr is "/data/n" (a raw XPath string) and n=1; total must equal
    // the live instance count (1), not a stringified/parsed countExpr.
    expect(path[0]).toMatchObject({ kind: 'repeat', countBound: true, total: 1 });
  });

  it('exhausted count-bound repeat (n=0) ⇒ landing on eof, no repeat segment to derive', () => {
    const { adapter } = makeRealAdapter(countRepeatXml(0));
    adapter.stepForward(); // -> question /data/n
    adapter.stepForward(); // count=0 -> repeat exhausted -> eof
    expect(adapter.getCurrentEvent().kind).toBe('eof');
    expect(adapter.getCurrentPath()).toEqual([]);
  });

  it('total updates after createRepeatInstance + a version bump (no stale caching)', () => {
    const { adapter } = makeRealAdapter(MANUAL_REPEAT_XML);
    adapter.stepForward(); // -> prompt-new-repeat
    const promptEv = adapter.getCurrentEvent();
    if (promptEv.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat');

    // Before creation: total is 0.
    expect(adapter.getCurrentPath()).toEqual([
      { kind: 'repeat', label: 'Parcela', multiplicity: 0, total: 0, countBound: false },
    ]);

    adapter.createRepeatInstance(promptEv.ref);
    adapter.stepForward(); // -> question inside the newly created instance

    // After creation: total reflects the new instance immediately, with no
    // separate cache-invalidation step.
    expect(adapter.getCurrentPath()).toEqual([
      { kind: 'repeat', label: 'Parcela', multiplicity: 0, total: 1, countBound: false },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Decision-16 gates: fake-session resolvePath presence/absence
// ---------------------------------------------------------------------------

describe('createAdapter — getCurrentPath decision-16 gates (fake session)', () => {
  it('negative gate: resolvePath absent from the fake navigator ⇒ [], no throw', () => {
    const session = makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/name',
          dataType: 'string',
          controlType: 'input',
          label: 'Name',
          hint: null,
          appearance: null,
          ancestors: [{ kind: 'group', ref: '/data/grp', label: 'Group A' }],
        },
        { kind: 'eof' },
      ],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (session.navigator as any).resolvePath;
    const adapter = createAdapter(session);
    adapter.stepForward();
    expect(() => adapter.getCurrentPath()).not.toThrow();
    expect(adapter.getCurrentPath()).toEqual([]);
  });

  it('positive gate: a non-empty path really flows through the fake\'s resolvePath (spy-asserted)', () => {
    const session = makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/grp/name',
          dataType: 'string',
          controlType: 'input',
          label: 'Name',
          hint: null,
          appearance: null,
          ancestors: [{ kind: 'group', ref: '/data/grp', label: 'Group A' }],
        },
        { kind: 'eof' },
      ],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    const resolvePathSpy = jest.spyOn(
      session.navigator as unknown as { resolvePath: (p: unknown) => unknown },
      'resolvePath'
    );
    const adapter = createAdapter(session);
    adapter.stepForward();
    const path = adapter.getCurrentPath();
    expect(path).toEqual([
      { kind: 'group', label: 'Group A', multiplicity: null, total: null, countBound: false },
    ]);
    expect(resolvePathSpy).toHaveBeenCalled();
  });
});
