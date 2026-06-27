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
    // hint is null in P1 — the real navigator does not expose hintText yet
    expect(ev.hint).toBeNull();
    expect(ev.appearance).toBeNull();
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
    // Initial value in fake session is ''
    expect(val).toBe('');
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
