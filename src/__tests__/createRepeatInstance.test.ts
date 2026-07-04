/**
 * T1 + T2: FormAdapter.createRepeatInstance — RED tests against the REAL
 * ts-rosa engine (createRepeatInstance is a pure engine mutation composing
 * addRepeatInstance + evaluator.initializeRepeatInstance; a fake session
 * cannot model this — see design ADR "Test-double implications").
 */

import { DOMParser } from '@xmldom/xmldom';
import { parseDocument, createFormSession } from '@nuup/ts-rosa';
import { createAdapter } from '../adapter/createAdapter';

function parseXml(xml: string) {
  const doc = new DOMParser().parseFromString(
    xml,
    'text/xml'
  ) as unknown as Document;
  return parseDocument(doc);
}

// Manual (non-jr:count) repeat with a single int question.
const MANUAL_REPEAT_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Manual Repeat</h:title>
    <model>
      <instance>
        <data id="manual-repeat">
          <repeat jr:template="">
            <q/>
          </repeat>
        </data>
      </instance>
      <bind nodeset="/data/repeat/q" type="int"/>
    </model>
  </h:head>
  <h:body>
    <repeat nodeset="/data/repeat">
      <input ref="/data/repeat/q"><label>Q</label></input>
    </repeat>
  </h:body>
</h:html>`;

// jr:count-bound repeat: auto-managed, not eligible for manual creation.
const COUNT_REPEAT_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Count Repeat</h:title>
    <model>
      <instance>
        <data id="count-repeat">
          <n>1</n>
          <repeat jr:template="">
            <q/>
          </repeat>
        </data>
      </instance>
      <bind nodeset="/data/n" type="int"/>
      <bind nodeset="/data/repeat/q" type="int"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/n"><label>N</label></input>
    <repeat nodeset="/data/repeat" jr:count="/data/n">
      <input ref="/data/repeat/q"><label>Q</label></input>
    </repeat>
  </h:body>
</h:html>`;

// Plain non-repeat question form.
const PLAIN_QUESTION_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Plain Question</h:title>
    <model>
      <instance>
        <data id="plain-question">
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

function countRepeatInstances(tree: { root: { children: readonly { name: string; multiplicity: number }[] } }, name: string): number {
  return tree.root.children.filter((c) => c.name === name && c.multiplicity >= 0).length;
}

describe('createAdapter — createRepeatInstance (Req 1: happy path)', () => {
  it('adds a new instance to the tree and the DAG initializes it', () => {
    const def = parseXml(MANUAL_REPEAT_XML);
    const session = createFormSession(def);
    const adapter = createAdapter(session);

    adapter.stepForward(); // bof -> prompt-new-repeat (no instances yet)
    const ev = adapter.getCurrentEvent();
    expect(ev.kind).toBe('prompt-new-repeat');
    if (ev.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat');

    expect(countRepeatInstances(session.tree, 'repeat')).toBe(0);

    adapter.createRepeatInstance(ev.ref);

    expect(countRepeatInstances(session.tree, 'repeat')).toBe(1);
  });

  it('the new instance becomes navigable via stepForward (lands on its first question)', () => {
    const def = parseXml(MANUAL_REPEAT_XML);
    const session = createFormSession(def);
    const adapter = createAdapter(session);

    adapter.stepForward(); // -> prompt-new-repeat
    const ev = adapter.getCurrentEvent();
    if (ev.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat');

    adapter.createRepeatInstance(ev.ref);
    adapter.stepForward(); // should descend into the new instance's first question

    const next = adapter.getCurrentEvent();
    expect(next.kind).toBe('question');
  });
});

// ---------------------------------------------------------------------------
// T5: jr:count regression — auto-create path remains unaffected by this
// slice. No call to createRepeatInstance is made anywhere in this path;
// this is a safety-net snapshot of pre-existing behavior.
// ---------------------------------------------------------------------------
describe('createAdapter — jr:count auto-create regression (Req 4)', () => {
  it('auto-creates the count-bound instance via plain stepForward, with no createRepeatInstance call', () => {
    const def = parseXml(COUNT_REPEAT_XML);
    const session = createFormSession(def);
    const adapter = createAdapter(session);

    expect(countRepeatInstances(session.tree, 'repeat')).toBe(0);

    adapter.stepForward(); // -> question /data/n
    adapter.stepForward(); // -> auto-created instance's question

    expect(countRepeatInstances(session.tree, 'repeat')).toBe(1);
    const ev = adapter.getCurrentEvent();
    expect(ev.kind).toBe('repeat');
  });

  it('skips an exhausted count repeat (n=0) on forward navigation, landing on eof', () => {
    const zeroCountXml = COUNT_REPEAT_XML.replace('<n>1</n>', '<n>0</n>');
    const def = parseXml(zeroCountXml);
    const session = createFormSession(def);
    const adapter = createAdapter(session);

    adapter.stepForward(); // -> question /data/n
    adapter.stepForward(); // count=0 -> repeat is exhausted/skipped -> eof

    expect(countRepeatInstances(session.tree, 'repeat')).toBe(0);
    expect(adapter.getCurrentEvent().kind).toBe('eof');
  });
});

describe('createAdapter — createRepeatInstance (Req 2: defensive throw)', () => {
  // ADR-D3: createRepeatInstance has no accessor to a repeat's countExpr, so
  // it cannot deep-inspect whether a ref belongs to a jr:count-bound repeat.
  // The manual-vs-count invariant is instead guaranteed STRUCTURALLY:
  // prompt-new-repeat events (the only legitimate source of a ref passed to
  // createRepeatInstance) never surface for jr:count-driven repeats — they
  // auto-create instead. This test asserts that structural guarantee: the
  // jr:count repeat auto-creates its instance via plain stepForward and never
  // emits a prompt-new-repeat event, so createRepeatInstance is never
  // reachable with a count-bound ref in practice.
  it('a jr:count-bound repeat never emits a prompt-new-repeat event (structurally unreachable)', () => {
    const def = parseXml(COUNT_REPEAT_XML);
    const session = createFormSession(def);
    const adapter = createAdapter(session);

    adapter.stepForward(); // -> question /data/n
    adapter.stepForward(); // -> auto-created repeat instance's question (not prompt-new-repeat)

    const ev = adapter.getCurrentEvent();
    expect(ev.kind).not.toBe('prompt-new-repeat');
    expect(countRepeatInstances(session.tree, 'repeat')).toBe(1);
  });

  it('throws when called with a non-repeat question ref', () => {
    const def = parseXml(PLAIN_QUESTION_XML);
    const session = createFormSession(def);
    const adapter = createAdapter(session);

    adapter.stepForward(); // -> question /data/name
    const ev = adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    expect(() => adapter.createRepeatInstance(ev.ref)).toThrow();
  });
});
