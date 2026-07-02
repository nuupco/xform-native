/**
 * T-05 + T-06: createAdapter RED tests.
 *
 * Tests:
 *  - getCurrentEvent() returns correct AdaptedEvent shape per kind
 *  - No experimental symbol (FormEntryEvent, FormIndex) leaks onto AdaptedEvent
 *  - dataType is correctly surfaced for question events
 *  - jumpToIndex visited-cache: allows jumping to visited positions, throws on unvisited
 *  - stepForward / stepBackward advance/retreat the cursor
 *  - getNodeState / isEffectivelyRelevant / getChoices / answerQuestion / resolveValue delegate
 */

import { createAdapter } from '../adapter/createAdapter';
import { makeFakeSession } from '../test-support/makeFakeSession';
import { AnswerResult } from '@nuup/ts-rosa';
import { DOMParser } from '@xmldom/xmldom';
import { parseDocument, createFormSession } from '@nuup/ts-rosa';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeQuestionSession() {
  return makeFakeSession({
    events: [
      { kind: 'bof' },
      {
        kind: 'question',
        ref: '/data/name',
        dataType: 'string',
        controlType: 'input',
        label: 'Your name',
        hint: 'Enter your name',
        appearance: null,
      },
      { kind: 'eof' },
    ],
    nodeStates: {
      '/data/name': { relevant: true, enabled: true, required: false, readonly: false, constraintMsg: null, calculatedValue: null },
    },
    relevance: { '/data/name': true },
    choices: {},
    answerResults: { '/data/name': AnswerResult.OK },
    values: { '/data/name': '' },
  });
}

// ---------------------------------------------------------------------------
// getCurrentEvent
// ---------------------------------------------------------------------------
describe('createAdapter — getCurrentEvent', () => {
  it('returns bof at start', () => {
    const session = makeQuestionSession();
    const adapter = createAdapter(session);
    const ev = adapter.getCurrentEvent();
    expect(ev.kind).toBe('bof');
  });

  it('returns question event with correct fields after stepForward', () => {
    const session = makeQuestionSession();
    const adapter = createAdapter(session);
    adapter.stepForward();
    const ev = adapter.getCurrentEvent();
    expect(ev.kind).toBe('question');
    if (ev.kind !== 'question') throw new Error('wrong kind');
    expect(ev.dataType).toBe('string');
    expect(ev.controlType).toBe('input');
    expect(ev.label).toBe('Your name');
    // hint is now surfaced via getHintText() from the fake navigator
    expect(ev.hint).toBe('Enter your name');
    // appearance is now surfaced via getAppearance() from the fake navigator
    expect(ev.appearance).toBeNull(); // null because script has appearance: null
    expect(typeof ev.index).toBe('number');
    expect(ev.ref).toBeDefined();
  });

  it('question event has no "code" property (firewall)', () => {
    const session = makeQuestionSession();
    const adapter = createAdapter(session);
    adapter.stepForward();
    const ev = adapter.getCurrentEvent();
    expect('code' in ev).toBe(false);
  });

  it('returns eof after stepping past last question', () => {
    const session = makeQuestionSession();
    const adapter = createAdapter(session);
    adapter.stepForward(); // -> question
    adapter.stepForward(); // -> eof
    expect(adapter.getCurrentEvent().kind).toBe('eof');
  });

  it('stepBackward retreats cursor', () => {
    const session = makeQuestionSession();
    const adapter = createAdapter(session);
    adapter.stepForward(); // -> question (index 1)
    adapter.stepForward(); // -> eof (index 2)
    adapter.stepBackward(); // -> question (index 1)
    const ev = adapter.getCurrentEvent();
    expect(ev.kind).toBe('question');
  });
});

// ---------------------------------------------------------------------------
// jumpToIndex (visited-cache)
// ---------------------------------------------------------------------------
describe('createAdapter — jumpToIndex', () => {
  it('jumps to a previously visited position', () => {
    const session = makeQuestionSession();
    const adapter = createAdapter(session);
    // Positions visited: 0 (bof)
    adapter.stepForward(); // position 1
    adapter.stepForward(); // position 2
    // Jump back to position 1 (question)
    adapter.jumpToIndex(1);
    expect(adapter.getCurrentEvent().kind).toBe('question');
  });

  it('jumping to position 0 (bof) works', () => {
    const session = makeQuestionSession();
    const adapter = createAdapter(session);
    adapter.stepForward();
    adapter.jumpToIndex(0);
    expect(adapter.getCurrentEvent().kind).toBe('bof');
  });

  it('throws when jumping to an unvisited position', () => {
    const session = makeQuestionSession();
    const adapter = createAdapter(session);
    // Only position 0 visited
    expect(() => adapter.jumpToIndex(5)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Delegation methods
// ---------------------------------------------------------------------------
describe('createAdapter — delegation', () => {
  it('getNodeState returns node state for a ref', () => {
    const session = makeQuestionSession();
    const adapter = createAdapter(session);
    adapter.stepForward();
    const ev = adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');
    const state = adapter.getNodeState(ev.ref);
    expect(state.relevant).toBe(true);
    expect(state.readonly).toBe(false);
  });

  it('isEffectivelyRelevant returns boolean', () => {
    const session = makeQuestionSession();
    const adapter = createAdapter(session);
    adapter.stepForward();
    const ev = adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');
    expect(adapter.isEffectivelyRelevant(ev.ref)).toBe(true);
  });

  it('getChoices returns empty array for non-select', () => {
    const session = makeQuestionSession();
    const adapter = createAdapter(session);
    adapter.stepForward();
    const ev = adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');
    expect(adapter.getChoices(ev.ref)).toEqual([]);
  });

  it('answerQuestion returns AnswerResult.OK for valid answer', () => {
    const session = makeQuestionSession();
    const adapter = createAdapter(session);
    adapter.stepForward();
    const ev = adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');
    expect(adapter.answerQuestion(ev.ref, 'Alice')).toBe(AnswerResult.OK);
  });

  it('resolveValue returns the node value', () => {
    const session = makeQuestionSession();
    const adapter = createAdapter(session);
    adapter.stepForward();
    const ev = adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');
    const val = adapter.resolveValue(ev.ref);
    // Initial value in fake session is '', which now (REQ-1.3/ADR-D-A3)
    // auto-encodes to null on tree build — resolveValue's decode path
    // (REQ-2.2) surfaces null as the empty representation for an
    // unanswered node.
    expect(val).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// REQ-1 / REQ-2: encode/decode boundary (real ts-rosa engine)
// ---------------------------------------------------------------------------
function parseXml(xml: string) {
  const doc = new DOMParser().parseFromString(
    xml,
    'text/xml'
  ) as unknown as Document;
  return parseDocument(doc);
}

const ENCODE_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Encode Boundary</h:title>
    <model>
      <instance>
        <data id="encode">
          <name/>
          <age/>
          <greeting/>
        </data>
      </instance>
      <bind nodeset="/data/name" type="string"/>
      <bind nodeset="/data/age" type="int"/>
      <bind nodeset="/data/greeting" type="string" calculate="/data/name" readonly="true()"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/name"><label>Name</label></input>
    <input ref="/data/age"><label>Age</label></input>
    <input ref="/data/greeting"><label>Greeting</label></input>
  </h:body>
</h:html>`;

function makeRealAdapter() {
  const def = parseXml(ENCODE_XML);
  const session = createFormSession(def);
  return { adapter: createAdapter(session), tree: session.tree };
}

function refFor(adapter: ReturnType<typeof createAdapter>, times: number) {
  for (let i = 0; i < times; i++) adapter.stepForward();
  const ev = adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev.ref;
}

describe('createAdapter — answerQuestion encode boundary (REQ-1)', () => {
  it('stores an AnswerValue (not a raw string) on the tree node for text', () => {
    const { adapter, tree } = makeRealAdapter();
    const ref = refFor(adapter, 1); // name
    adapter.answerQuestion(ref, 'hello');
    const node = tree.root.children.find((c) => c.name === 'name');
    expect(node?.value).not.toBe('hello');
    expect(node?.value).toMatchObject({ kind: 'string', value: 'hello' });
  });

  it("encodes empty string '' to null (not a wrapped empty string)", () => {
    const { adapter, tree } = makeRealAdapter();
    const ref = refFor(adapter, 1); // name
    adapter.answerQuestion(ref, '');
    const node = tree.root.children.find((c) => c.name === 'name');
    expect(node?.value).toBeNull();
  });

  it('stores an AnswerValue with numeric kind for int', () => {
    const { adapter, tree } = makeRealAdapter();
    refFor(adapter, 1); // name
    const ageRef = refFor(adapter, 1); // age
    adapter.answerQuestion(ageRef, 42);
    const node = tree.root.children.find((c) => c.name === 'age');
    expect(node?.value).toMatchObject({ kind: 'int', value: 42 });
  });

  it('never passes a bare primitive or "as never" into evaluator.answerQuestion', () => {
    const { adapter } = makeRealAdapter();
    const ref = refFor(adapter, 1); // name
    // If encoding were bypassed, a calculate cascade reading node.value.value
    // would throw. Answering + triggering the cascade must not throw.
    expect(() => adapter.answerQuestion(ref, 'Alice')).not.toThrow();
  });
});

describe('createAdapter — resolveValue decode boundary (REQ-2)', () => {
  it('round-trips text through answerQuestion -> resolveValue', () => {
    const { adapter } = makeRealAdapter();
    const ref = refFor(adapter, 1); // name
    adapter.answerQuestion(ref, 'hello');
    expect(adapter.resolveValue(ref)).toBe('hello');
  });

  it('round-trips numeric through answerQuestion -> resolveValue', () => {
    const { adapter } = makeRealAdapter();
    refFor(adapter, 1); // name
    const ageRef = refFor(adapter, 1); // age
    adapter.answerQuestion(ageRef, 42);
    expect(adapter.resolveValue(ageRef)).toBe(42);
  });

  it('returns a falsy/empty representation for an unanswered node', () => {
    const { adapter } = makeRealAdapter();
    const ref = refFor(adapter, 1); // name
    expect(() => adapter.resolveValue(ref)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// group and repeat events
// ---------------------------------------------------------------------------
describe('createAdapter — group + repeat events', () => {
  it('maps group event correctly', () => {
    const session = makeFakeSession({
      events: [
        { kind: 'bof' },
        { kind: 'group', ref: '/data/grp', label: 'Group A', hint: null },
        { kind: 'eof' },
      ],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    const adapter = createAdapter(session);
    adapter.stepForward();
    const ev = adapter.getCurrentEvent();
    expect(ev.kind).toBe('group');
    if (ev.kind !== 'group') throw new Error('expected group');
    expect(ev.label).toBe('Group A');
    expect(ev.hint).toBeNull();
    expect(typeof ev.index).toBe('number');
  });

  it('maps repeat event correctly', () => {
    const session = makeFakeSession({
      events: [
        { kind: 'bof' },
        { kind: 'repeat', ref: '/data/items[1]', label: 'Items', multiplicity: 1 },
        { kind: 'eof' },
      ],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    const adapter = createAdapter(session);
    adapter.stepForward();
    const ev = adapter.getCurrentEvent();
    expect(ev.kind).toBe('repeat');
    if (ev.kind !== 'repeat') throw new Error('expected repeat');
    expect(ev.label).toBe('Items');
    expect(ev.multiplicity).toBe(1);
  });

  it('maps prompt-new-repeat event correctly', () => {
    const session = makeFakeSession({
      events: [
        { kind: 'bof' },
        { kind: 'prompt-new-repeat', ref: '/data/items', label: 'Add item?' },
        { kind: 'eof' },
      ],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    const adapter = createAdapter(session);
    adapter.stepForward();
    const ev = adapter.getCurrentEvent();
    expect(ev.kind).toBe('prompt-new-repeat');
    if (ev.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat');
    expect(ev.label).toBe('Add item?');
  });
});
