/**
 * T-07: FormSessionStore — pure node tests (no RNTL).
 *
 * REQ-01..REQ-05: subscribe, snapshot referential stability,
 * version monotonicity, delegation, notification on violation.
 */

import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession } from '../../test-support/makeFakeSession';
import { AnswerResult } from '@nuup/ts-rosa';
import type { InstanceTree } from '@nuup/ts-rosa';
import { DOMParser } from '@xmldom/xmldom';
import { parseDocument, createFormSession } from '@nuup/ts-rosa';

function makeStore() {
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
  return new FormSessionStore(session);
}

// ---------------------------------------------------------------------------
// REQ-02: version starts at 0
// ---------------------------------------------------------------------------
describe('FormSessionStore — initial state', () => {
  it('getSnapshot returns version 0 initially', () => {
    const store = makeStore();
    expect(store.getSnapshot().version).toBe(0);
  });

  it('getSnapshot returns the same frozen object when nothing mutates', () => {
    const store = makeStore();
    const s1 = store.getSnapshot();
    const s2 = store.getSnapshot();
    expect(s1).toBe(s2); // same reference
  });

  it('snapshot is frozen', () => {
    const store = makeStore();
    const snap = store.getSnapshot();
    expect(Object.isFrozen(snap)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Slice C: serializeToXml() passthrough
// ---------------------------------------------------------------------------
describe('FormSessionStore — serializeToXml', () => {
  it('delegates to the underlying session and returns its result', () => {
    const session = makeFakeSession({
      events: [{ kind: 'bof' }, { kind: 'eof' }],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    const spy = jest
      .spyOn(session, 'serializeToXml')
      .mockReturnValue('<xml-from-session/>');

    const store = new FormSessionStore(session);

    expect(store.serializeToXml()).toBe('<xml-from-session/>');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// REQ-01: subscribe fires on mutations
// ---------------------------------------------------------------------------
describe('FormSessionStore — subscribe', () => {
  it('subscriber fires once per stepForward', () => {
    const store = makeStore();
    const cb = jest.fn();
    store.subscribe(cb);
    store.stepForward();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('subscriber fires once per stepBackward', () => {
    const store = makeStore();
    store.stepForward(); // move away from bof first
    const cb = jest.fn();
    store.subscribe(cb);
    store.stepBackward();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('subscriber fires once per jumpToIndex', () => {
    const store = makeStore();
    store.stepForward(); // visit index 1
    const cb = jest.fn();
    store.subscribe(cb);
    store.jumpToIndex(0);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('subscriber fires once per answerQuestion', () => {
    const store = makeStore();
    store.stepForward(); // get to question
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');
    const cb = jest.fn();
    store.subscribe(cb);
    store.answerQuestion(ev.ref, 'Alice');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe stops notifications', () => {
    const store = makeStore();
    const cb = jest.fn();
    const unsub = store.subscribe(cb);
    unsub();
    store.stepForward();
    expect(cb).not.toHaveBeenCalled();
  });

  it('multiple subscribers all fire', () => {
    const store = makeStore();
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    store.subscribe(cb1);
    store.subscribe(cb2);
    store.stepForward();
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// REQ-03: snapshot referential stability (new ref after mutation)
// ---------------------------------------------------------------------------
describe('FormSessionStore — snapshot identity', () => {
  it('returns NEW snapshot reference after mutation', () => {
    const store = makeStore();
    const s1 = store.getSnapshot();
    store.stepForward();
    const s2 = store.getSnapshot();
    expect(s2).not.toBe(s1);
  });

  it('version increments by 1 per mutation', () => {
    const store = makeStore();
    expect(store.getSnapshot().version).toBe(0);
    store.stepForward();
    expect(store.getSnapshot().version).toBe(1);
    store.stepForward();
    expect(store.getSnapshot().version).toBe(2);
  });

  it('snapshot remains same ref between mutations', () => {
    const store = makeStore();
    const s1 = store.getSnapshot();
    const s2 = store.getSnapshot();
    expect(s1).toBe(s2);
    store.stepForward();
    const s3 = store.getSnapshot();
    const s4 = store.getSnapshot();
    expect(s3).toBe(s4);
  });
});

// ---------------------------------------------------------------------------
// REQ-05: answerQuestion returns AnswerResult unchanged + notifies on violation
// ---------------------------------------------------------------------------
describe('FormSessionStore — answerQuestion', () => {
  it('returns AnswerResult.OK for valid answer', () => {
    const store = makeStore();
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');
    const result = store.answerQuestion(ev.ref, 'Bob');
    expect(result).toBe(AnswerResult.OK);
  });

  it('notifies subscribers even on CONSTRAINT_VIOLATED', () => {
    const session = makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/age',
          dataType: 'int',
          controlType: 'input',
          label: 'Age',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/age': { relevant: true, enabled: true, required: false, readonly: false, constraintMsg: 'Must be positive', calculatedValue: null },
      },
      relevance: { '/data/age': true },
      choices: {},
      answerResults: { '/data/age': AnswerResult.CONSTRAINT_VIOLATED },
      values: { '/data/age': 0 },
    });
    const store = new FormSessionStore(session);
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');
    const cb = jest.fn();
    store.subscribe(cb);
    const result = store.answerQuestion(ev.ref, -1);
    expect(result).toBe(AnswerResult.CONSTRAINT_VIOLATED);
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// REQ-4: fake FormSession stores AnswerValue-shaped values after a commit
// (mirrors real ts-rosa FormEvaluator storage shape, per ADR-D-A6).
// ---------------------------------------------------------------------------
describe('FormSessionStore — fake session mirrors AnswerValue storage (REQ-4)', () => {
  it('stores an AnswerValue-shaped object on the tree after answerQuestion, not a raw primitive', () => {
    const store = makeStore();
    store.stepForward(); // get to /data/name question
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');
    store.answerQuestion(ev.ref, 'Alice');

    const raw = store.adapter.resolveValue(ev.ref);
    // Decode path must still hand back the primitive to widgets.
    expect(raw).toBe('Alice');
  });

  it("the underlying fake tree node holds an AnswerValue ({kind,value,displayText}), not the raw primitive", () => {
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
    const store = new FormSessionStore(session);
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');
    store.answerQuestion(ev.ref, 'Alice');

    const tree = session.tree as InstanceTree;
    const node = tree.root.children.find((c) => c.name === 'name');
    expect(node?.value).not.toBe('Alice');
    expect(node?.value).toMatchObject({ kind: 'string', value: 'Alice' });
  });
});

// ---------------------------------------------------------------------------
// notifyExternalMutation — public bump/notify hook for out-of-band mutations
// ---------------------------------------------------------------------------
describe('FormSessionStore — notifyExternalMutation', () => {
  it('notifies subscribers and bumps the snapshot after a direct external mutation', () => {
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
    const store = new FormSessionStore(session);
    const s1 = store.getSnapshot();
    const cb = jest.fn();
    store.subscribe(cb);

    // External mutation bypassing store's four mutators:
    const tree = session.tree as InstanceTree;
    const node = tree.root.children.find((c) => c.name === 'name');
    if (!node) throw new Error('expected node');
    node.value = { kind: 'string', value: 'External', displayText: 'External' };

    store.notifyExternalMutation();

    expect(cb).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().version).toBe(s1.version + 1);
    expect(store.getSnapshot()).not.toBe(s1);
  });

  it('is a pure delegation — bumps and notifies even with no prior external change', () => {
    const store = makeStore();
    const s1 = store.getSnapshot();
    const cb = jest.fn();
    store.subscribe(cb);

    store.notifyExternalMutation();

    expect(cb).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().version).toBe(s1.version + 1);
  });
});

// ---------------------------------------------------------------------------
// T3 (sdd/repeat-instance-creation): createRepeatInstance — REAL ENGINE.
// createRepeatInstance is a pure engine mutation (addRepeatInstance +
// evaluator.initializeRepeatInstance); makeFakeSession cannot model repeat
// creation, so this is tested against the real ts-rosa engine per design.
// ---------------------------------------------------------------------------
function parseXml(xml: string) {
  const doc = new DOMParser().parseFromString(
    xml,
    'text/xml'
  ) as unknown as Document;
  return parseDocument(doc);
}

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

function makeRealStore() {
  const def = parseXml(MANUAL_REPEAT_XML);
  const session = createFormSession(def);
  return new FormSessionStore(session);
}

describe('FormSessionStore — createRepeatInstance (T3, real engine)', () => {
  it('delegates to the adapter: a new instance appears in the tree', () => {
    const store = makeRealStore();
    store.stepForward(); // -> prompt-new-repeat
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat');

    store.createRepeatInstance(ev.ref);

    // Verify via subsequent navigation instead of reaching into the tree
    // directly (store has no raw tree accessor by design/ADR-2 firewall).
    store.stepForward();
    const next = store.adapter.getCurrentEvent();
    expect(next.kind).toBe('question');
  });

  it('bumps the snapshot and notifies subscribers when createRepeatInstance is called', () => {
    const store = makeRealStore();
    store.stepForward(); // -> prompt-new-repeat
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat');

    const s1 = store.getSnapshot();
    const cb = jest.fn();
    store.subscribe(cb);

    store.createRepeatInstance(ev.ref);

    expect(cb).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().version).toBe(s1.version + 1);
    expect(store.getSnapshot()).not.toBe(s1);
  });

  it('createRepeatInstance followed by stepForward fires two notifications (each mutator bumps once) — React batches these into one render at the component layer (verified in Form.test.tsx)', () => {
    const store = makeRealStore();
    store.stepForward(); // -> prompt-new-repeat
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat');

    const cb = jest.fn();
    store.subscribe(cb);

    store.createRepeatInstance(ev.ref);
    store.stepForward();

    expect(cb).toHaveBeenCalledTimes(2);
    const finalEvent = store.adapter.getCurrentEvent();
    expect(finalEvent.kind).toBe('question');
  });
});
