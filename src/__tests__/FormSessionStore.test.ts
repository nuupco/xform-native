/**
 * T-07: FormSessionStore — pure node tests (no RNTL).
 *
 * REQ-01..REQ-05: subscribe, snapshot referential stability,
 * version monotonicity, delegation, notification on violation.
 */

import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession } from '../test-support/makeFakeSession';
import { AnswerResult } from '@nuup/ts-rosa';

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
