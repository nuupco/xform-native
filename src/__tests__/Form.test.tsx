/**
 * Form tests — T-12 (component behavior) + T-13 (e2e cascade with real session).
 *
 * TDD: tests written FIRST (RED) before Form.tsx / surfaces.tsx implementation.
 */

import { act } from 'react';
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import type { NodeState } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { Form } from '../form/Form';
import { makeFakeSession } from '../test-support/makeFakeSession';

// ---------------------------------------------------------------------------
// T-13: real-session helpers
// ---------------------------------------------------------------------------

import { DOMParser } from '@xmldom/xmldom';
import { parseDocument, createFormSession } from '@nuup/ts-rosa';

function parseXml(xml: string) {
  const doc = new DOMParser().parseFromString(
    xml,
    'text/xml'
  ) as unknown as Document;
  return parseDocument(doc);
}

function makeRealStore(xml: string) {
  const def = parseXml(xml);
  const session = createFormSession(def);
  return new FormSessionStore(session);
}

const E2E_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>E2E Cascade</h:title>
    <model>
      <instance>
        <data id="cascade">
          <name/>
          <age/>
          <category/>
          <greeting/>
        </data>
      </instance>
      <bind nodeset="/data/name" type="string" required="true()"/>
      <bind nodeset="/data/age" type="int" constraint=". &gt;= 0" jr:constraintMsg="Age must be non-negative"/>
      <bind nodeset="/data/category" type="string" relevant="/data/age &gt;= 18"/>
      <bind nodeset="/data/greeting" type="string" calculate="/data/name" readonly="true()"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/name"><label>Name</label></input>
    <input ref="/data/age"><label>Age</label></input>
    <input ref="/data/category"><label>Category</label></input>
    <input ref="/data/greeting"><label>Greeting</label></input>
  </h:body>
</h:html>`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

afterEach(async () => {
  await cleanup();
});

function makeStore(script: Parameters<typeof makeFakeSession>[0]) {
  return new FormSessionStore(makeFakeSession(script));
}

// ---------------------------------------------------------------------------
// T-12: Form component behavior
// ---------------------------------------------------------------------------

describe('Form component', () => {
  it('renders bof surface with start button', async () => {
    const store = makeStore({
      events: [{ kind: 'bof' }, { kind: 'eof' }],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    await render(<Form store={store} />);
    expect(screen.getByText('Beginning of Form')).toBeTruthy();
    expect(screen.getByTestId('bof-start-button')).toBeTruthy();
  });

  it('advances from bof to first question on start', async () => {
    const store = makeStore({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/q1',
          dataType: 'string',
          controlType: 'input',
          label: 'Name',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/q1': {
          readonly: false,
          required: false,
          relevant: true,
          enabled: true,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/q1': true },
      choices: {},
      answerResults: { '/data/q1': AnswerResult.OK },
      values: { '/data/q1': '' },
    });
    await render(<Form store={store} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByTestId('string-input')).toBeTruthy();
  });

  it('renders eof surface after advancing past last question', async () => {
    const store = makeStore({
      events: [{ kind: 'bof' }, { kind: 'eof' }],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    store.stepForward();
    await render(<Form store={store} />);
    expect(screen.getByText('Form Complete')).toBeTruthy();
  });

  it('blocks advance and shows constraint message on constraint violation', async () => {
    const store = makeStore({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/q1',
          dataType: 'string',
          controlType: 'input',
          label: 'Name',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/q1': {
          readonly: false,
          required: false,
          relevant: true,
          enabled: true,
          constraintMsg: 'Invalid value',
          calculatedValue: null,
        },
      },
      relevance: { '/data/q1': true },
      choices: {},
      answerResults: { '/data/q1': AnswerResult.CONSTRAINT_VIOLATED },
      values: { '/data/q1': 'bad' },
    });
    store.stepForward();
    await render(<Form store={store} />);
    // Per ADR-D-A5 (REQ-3, validate-only Next): handleNext no longer
    // unconditionally re-commits. It reads store.lastAnswerResult, which is
    // set by the widget's own onChange commit — simulate that commit here,
    // mirroring what the real widget would have already done.
    const currentEv = store.adapter.getCurrentEvent();
    if (currentEv.kind !== 'question') throw new Error('expected question');
    store.answerQuestion(currentEv.ref, 'bad');
    const spyStepForward = jest.spyOn(store, 'stepForward');
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByText('Invalid value')).toBeTruthy();
    expect(spyStepForward).not.toHaveBeenCalled();
  });

  it('blocks advance and shows required message when required field is empty', async () => {
    const store = makeStore({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/q1',
          dataType: 'string',
          controlType: 'input',
          label: 'Name',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/q1': {
          readonly: false,
          required: true,
          relevant: true,
          enabled: true,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/q1': true },
      choices: {},
      answerResults: { '/data/q1': AnswerResult.REQUIRED_BUT_EMPTY },
      values: { '/data/q1': '' },
    });
    store.stepForward();
    await render(<Form store={store} />);
    const spyStepForward = jest.spyOn(store, 'stepForward');
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByTestId('required-message')).toBeTruthy();
    expect(spyStepForward).not.toHaveBeenCalled();
  });

  it('renders exactly one required-indicator for a required question (Form.tsx sole owner, REQ-1)', async () => {
    const store = makeStore({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/q1',
          dataType: 'string',
          controlType: 'input',
          label: 'Name',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/q1': {
          readonly: false,
          required: true,
          relevant: true,
          enabled: true,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/q1': true },
      choices: {},
      answerResults: {},
      values: { '/data/q1': '' },
    });
    store.stepForward();
    await render(<Form store={store} />);
    expect(screen.getAllByTestId('required-indicator')).toHaveLength(1);
  });

  it('renders zero required-indicators for a non-required question (REQ-1)', async () => {
    const store = makeStore({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/q1',
          dataType: 'string',
          controlType: 'input',
          label: 'Name',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/q1': {
          readonly: false,
          required: false,
          relevant: true,
          enabled: true,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/q1': true },
      choices: {},
      answerResults: {},
      values: { '/data/q1': '' },
    });
    store.stepForward();
    await render(<Form store={store} />);
    expect(screen.queryByTestId('required-indicator')).toBeNull();
  });

  it('skips non-relevant node on advance', async () => {
    const store = makeStore({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/q1',
          dataType: 'string',
          controlType: 'input',
          label: 'Q1',
          hint: null,
          appearance: null,
        },
        {
          kind: 'question',
          ref: '/data/q2',
          dataType: 'string',
          controlType: 'input',
          label: 'Q2',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/q1': {
          readonly: false,
          required: false,
          relevant: true,
          enabled: true,
          constraintMsg: null,
          calculatedValue: null,
        },
        '/data/q2': {
          readonly: false,
          required: false,
          relevant: true,
          enabled: true,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/q1': false, '/data/q2': true },
      choices: {},
      answerResults: {
        '/data/q1': AnswerResult.OK,
        '/data/q2': AnswerResult.OK,
      },
      values: { '/data/q1': '', '/data/q2': '' },
    });
    await render(<Form store={store} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });
    expect(screen.getByText('Q2')).toBeTruthy();
    expect(screen.queryByText('Q1')).toBeNull();
  });

  it('navigates back with back button', async () => {
    const store = makeStore({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/q1',
          dataType: 'string',
          controlType: 'input',
          label: 'Q1',
          hint: null,
          appearance: null,
        },
        {
          kind: 'question',
          ref: '/data/q2',
          dataType: 'string',
          controlType: 'input',
          label: 'Q2',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/q1': {
          readonly: false,
          required: false,
          relevant: true,
          enabled: true,
          constraintMsg: null,
          calculatedValue: null,
        },
        '/data/q2': {
          readonly: false,
          required: false,
          relevant: true,
          enabled: true,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/q1': true, '/data/q2': true },
      choices: {},
      answerResults: {
        '/data/q1': AnswerResult.OK,
        '/data/q2': AnswerResult.OK,
      },
      values: { '/data/q1': 'a', '/data/q2': 'b' },
    });
    store.stepForward(); // bof → q1
    store.stepForward(); // q1 → q2
    await render(<Form store={store} />);
    expect(screen.getByText('Q2')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-back'));
    });
    expect(screen.getByText('Q1')).toBeTruthy();
  });

  it('does not carry over selectMulti state between adjacent same-type questions (stable key)', async () => {
    const store = makeStore({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/sm1',
          dataType: 'selectMulti',
          controlType: 'select',
          label: 'SM1',
          hint: null,
          appearance: null,
        },
        {
          kind: 'question',
          ref: '/data/sm2',
          dataType: 'selectMulti',
          controlType: 'select',
          label: 'SM2',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/sm1': {
          readonly: false,
          required: false,
          relevant: true,
          enabled: true,
          constraintMsg: null,
          calculatedValue: null,
        },
        '/data/sm2': {
          readonly: false,
          required: false,
          relevant: true,
          enabled: true,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/sm1': true, '/data/sm2': true },
      choices: {
        '/data/sm1': [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
        '/data/sm2': [{ value: 'a', label: 'A' }, { value: 'y', label: 'Y' }],
      },
      answerResults: {},
      values: { '/data/sm1': [], '/data/sm2': [] },
    });
    store.stepForward(); // bof -> sm1
    await render(<Form store={store} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-option-a'));
    });
    expect(
      screen.getByTestId('select-multi-option-a').props.accessibilityState
        ?.checked,
    ).toBe(true);
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByText('SM2')).toBeTruthy();
    // SM2 must render its OWN options, fresh (unselected) — not SM1's stale
    // selection carried over via a reused component instance. SM2 also has an
    // option with value 'a' (same token as SM1's selected option) to expose
    // the leak if the widget instance/local state were reused.
    expect(
      screen.getByTestId('select-multi-option-a').props.accessibilityState
        ?.checked,
    ).toBe(false);
  });

  it('SelectMulti: no stale selections across questions, and clear-all works on revisit', async () => {
    const store = makeStore({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/sm1',
          dataType: 'selectMulti',
          controlType: 'select',
          label: 'SM1',
          hint: null,
          appearance: null,
        },
        {
          kind: 'question',
          ref: '/data/sm2',
          dataType: 'selectMulti',
          controlType: 'select',
          label: 'SM2',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/sm1': {
          readonly: false,
          required: false,
          relevant: true,
          enabled: true,
          constraintMsg: null,
          calculatedValue: null,
        },
        '/data/sm2': {
          readonly: false,
          required: false,
          relevant: true,
          enabled: true,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/sm1': true, '/data/sm2': true },
      choices: {
        '/data/sm1': [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
        '/data/sm2': [{ value: 'a', label: 'A' }, { value: 'y', label: 'Y' }],
      },
      answerResults: {},
      values: { '/data/sm1': [], '/data/sm2': [] },
    });
    store.stepForward(); // bof -> sm1
    await render(<Form store={store} />);

    // Toggle both options on SM1
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-option-a'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-option-b'));
    });
    expect(
      screen.getByTestId('select-multi-option-a').props.accessibilityState?.checked,
    ).toBe(true);
    expect(
      screen.getByTestId('select-multi-option-b').props.accessibilityState?.checked,
    ).toBe(true);

    // Navigate to SM2 — must show its OWN (empty) selections, not SM1's.
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByText('SM2')).toBeTruthy();
    expect(
      screen.getByTestId('select-multi-option-a').props.accessibilityState?.checked,
    ).toBe(false);

    // Navigate back to SM1 — its selections must still be there.
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-back'));
    });
    expect(screen.getByText('SM1')).toBeTruthy();
    expect(
      screen.getByTestId('select-multi-option-a').props.accessibilityState?.checked,
    ).toBe(true);

    // Clear all selections on SM1 (toggle both off) — must render as cleared.
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-option-a'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-option-b'));
    });
    expect(
      screen.getByTestId('select-multi-option-a').props.accessibilityState?.checked,
    ).toBe(false);
    expect(
      screen.getByTestId('select-multi-option-b').props.accessibilityState?.checked,
    ).toBe(false);
  });

  it('renders group header', async () => {
    const store = makeStore({
      events: [
        { kind: 'bof' },
        { kind: 'group', ref: '/data/g1', label: 'Group One', hint: null },
        { kind: 'eof' },
      ],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    store.stepForward();
    await render(<Form store={store} />);
    expect(screen.getByText('Group One')).toBeTruthy();
  });

  it('renders repeat with a 1-based entry count (multiplicity is a 0-based instance index, not a count)', async () => {
    // REQ hotfix: confirmed on-device that landing on the FIRST populated
    // repeat instance (multiplicity 0 — the engine correctly auto-created
    // it per jr:count) displayed "Entries: 0", which reads as "nothing was
    // created" even though one valid entry exists. `ev.multiplicity` is the
    // 0-based index of the instance you're currently on, not a total count —
    // display it as multiplicity + 1 so landing on the first entry reads
    // "Entries: 1", matching what actually exists.
    const store = makeStore({
      events: [
        { kind: 'bof' },
        {
          kind: 'repeat',
          ref: '/data/r1',
          label: 'Repeat One',
          multiplicity: 2,
        },
        { kind: 'eof' },
      ],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    store.stepForward();
    await render(<Form store={store} />);
    expect(screen.getByText('Repeat One')).toBeTruthy();
    expect(screen.getByText('Entries: 3')).toBeTruthy();
  });

  it('renders "Entries: 1" when landing on the first auto-created repeat instance (multiplicity 0)', async () => {
    const store = makeStore({
      events: [
        { kind: 'bof' },
        {
          kind: 'repeat',
          ref: '/data/r1',
          label: 'Repeat One',
          multiplicity: 0,
        },
        { kind: 'eof' },
      ],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    store.stepForward();
    await render(<Form store={store} />);
    expect(screen.getByText('Entries: 1')).toBeTruthy();
  });

  it('renders prompt-new-repeat', async () => {
    const store = makeStore({
      events: [
        { kind: 'bof' },
        { kind: 'prompt-new-repeat', ref: '/data/r1', label: 'Add more?' },
        { kind: 'eof' },
      ],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    store.stepForward();
    await render(<Form store={store} />);
    expect(screen.getByText('Add more?')).toBeTruthy();
    expect(screen.getByTestId('prompt-continue')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// T-13: End-to-end cascade test (real createFormSession)
// ---------------------------------------------------------------------------

describe('Form e2e cascade', () => {
  it('full navigation flow: bof → questions → eof', async () => {
    const store = makeRealStore(E2E_XML);
    await render(<Form store={store} />);
    expect(screen.getByText('Beginning of Form')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });
    expect(screen.getByText('Name')).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('string-input'), 'Alice');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByText('Age')).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('int-input'), '20');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByText('Category')).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('string-input'), 'Adult');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByText('Greeting')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByText('Form Complete')).toBeTruthy();
  });

  it('relevance skip: field hidden when age &lt; 18', async () => {
    const store = makeRealStore(E2E_XML);
    await render(<Form store={store} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('string-input'), 'Bob');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    // Age question
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('int-input'), '10');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    // Category should be skipped; next is Greeting
    expect(screen.queryByText('Category')).toBeNull();
    expect(screen.getByText('Greeting')).toBeTruthy();
  });

  it('calculate cascade: greeting updates after name is answered', async () => {
    const store = makeRealStore(E2E_XML);
    await render(<Form store={store} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('string-input'), 'Alice');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('int-input'), '20');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('string-input'), 'Adult');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    // Greeting should show calculated value (mirrors /data/name)
    expect(screen.getByText('Alice')).toBeTruthy();
  });

  it('constraint violation: shows message and does not advance', async () => {
    const store = makeRealStore(E2E_XML);
    await render(<Form store={store} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('string-input'), 'Alice');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    // Age question
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('int-input'), '-5');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByText('Invalid value')).toBeTruthy();
    expect(screen.getByText('Age')).toBeTruthy();
  });

  it('required blocks advance when empty', async () => {
    const store = makeRealStore(E2E_XML);
    await render(<Form store={store} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });
    // Name is required; press Next without answering
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByTestId('required-message')).toBeTruthy();
    expect(screen.getByText('Name')).toBeTruthy();
  });

  // REQ-3: handleNext validates without redundant re-commit.
  it('does not re-call answerQuestion when pressing Next repeatedly on an unchanged, already-valid answer', async () => {
    const store = makeRealStore(E2E_XML);
    await render(<Form store={store} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('string-input'), 'Alice');
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByText('Age')).toBeTruthy();
    // The widget's onChangeText already committed via store.answerQuestion once.
    // handleNext itself must not issue a second, redundant commit call.
    expect(spy).not.toHaveBeenCalled();
  });

  it('still blocks navigation via required validation without a spurious commit call', async () => {
    const store = makeRealStore(E2E_XML);
    await render(<Form store={store} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByTestId('required-message')).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });

  it('commits a genuinely changed value via answerQuestion before navigating', async () => {
    const store = makeRealStore(E2E_XML);
    await render(<Form store={store} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('string-input'), 'Alice');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByText('Age')).toBeTruthy();
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('int-input'), '20');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByText('Category')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// T4 (sdd/repeat-instance-creation): Continue creates and enters a new
// manual repeat instance (real engine — prompt-new-repeat -> Continue ->
// first question of the newly created instance).
// ---------------------------------------------------------------------------

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
      <bind nodeset="/data/repeat/q" type="string"/>
    </model>
  </h:head>
  <h:body>
    <repeat nodeset="/data/repeat">
      <input ref="/data/repeat/q"><label>Repeat Question</label></input>
    </repeat>
  </h:body>
</h:html>`;

describe('Form e2e — repeat-instance-creation (T4)', () => {
  it('pressing Continue on prompt-new-repeat creates and enters the new instance', async () => {
    const store = makeRealStore(MANUAL_REPEAT_XML);
    await render(<Form store={store} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });

    // Manual repeat with zero instances -> prompt-new-repeat screen.
    expect(screen.getByTestId('prompt-continue')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('prompt-continue'));
    });

    // Should now render the new instance's first (and only) question, not
    // the prompt again and not a repeat summary screen.
    expect(screen.queryByTestId('prompt-continue')).toBeNull();
    expect(screen.getByText('Repeat Question')).toBeTruthy();
  });

  it('the bottom nav-next button still steps past the prompt WITHOUT creating an instance', async () => {
    const store = makeRealStore(MANUAL_REPEAT_XML);
    await render(<Form store={store} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });
    expect(screen.getByTestId('prompt-continue')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    // No instance created — moved on to end of form.
    expect(screen.getByText('Form Complete')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// REQ-3: Auto-skip unlabeled groups, forward + backward
// ---------------------------------------------------------------------------

function questionEvent(ref: string, label: string) {
  return {
    kind: 'question' as const,
    ref,
    dataType: 'string' as const,
    controlType: 'input' as const,
    label,
    hint: null,
    appearance: null,
  };
}

function groupEvent(ref: string, label: string | null) {
  return { kind: 'group' as const, ref, label, hint: null };
}

function reqStates(refs: string[]) {
  const nodeStates: Record<string, NodeState> = {};
  const relevance: Record<string, boolean> = {};
  for (const ref of refs) {
    nodeStates[ref] = {
      readonly: false,
      required: false,
      relevant: true,
      enabled: true,
      constraintMsg: null,
      calculatedValue: null,
    };
    relevance[ref] = true;
  }
  return { nodeStates, relevance };
}

describe('Form — REQ-3 auto-skip unlabeled groups', () => {
  it('scenario 1: forward skip — single unlabeled group', async () => {
    const { nodeStates, relevance } = reqStates(['/data/q1', '/data/q2']);
    const store = makeStore({
      events: [
        { kind: 'bof' },
        questionEvent('/data/q1', 'Q1'),
        groupEvent('/data/g1', null),
        questionEvent('/data/q2', 'Q2'),
        { kind: 'eof' },
      ],
      nodeStates,
      relevance,
      choices: {},
      answerResults: {},
      values: { '/data/q1': 'a', '/data/q2': '' },
    });
    store.stepForward(); // bof -> q1
    await render(<Form store={store} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByText('Q2')).toBeTruthy();
  });

  it('scenario 2: backward skip — single unlabeled group', async () => {
    const { nodeStates, relevance } = reqStates(['/data/q1', '/data/q2']);
    const store = makeStore({
      events: [
        { kind: 'bof' },
        questionEvent('/data/q1', 'Q1'),
        groupEvent('/data/g1', null),
        questionEvent('/data/q2', 'Q2'),
        { kind: 'eof' },
      ],
      nodeStates,
      relevance,
      choices: {},
      answerResults: {},
      values: { '/data/q1': 'a', '/data/q2': 'b' },
    });
    store.stepForward(); // bof -> q1
    store.stepForward(); // q1 -> g1 (test setup only, bypasses the effect)
    store.stepForward(); // g1 -> q2 (test setup only, bypasses the effect)
    await render(<Form store={store} />);
    expect(screen.getByText('Q2')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-back'));
    });
    expect(screen.getByText('Q1')).toBeTruthy();
  });

  it('scenario 3: labeled group still renders (no skip)', async () => {
    const store = makeStore({
      events: [
        { kind: 'bof' },
        groupEvent('/data/g1', 'Group One'),
        { kind: 'eof' },
      ],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    store.stepForward(); // bof -> g1
    await render(<Form store={store} />);
    expect(screen.getByText('Group One')).toBeTruthy();
  });

  it('scenario 4: mutual exclusivity — relevance-skip wins over label-skip, exactly one step per render', async () => {
    // /data/g1 is both an unlabeled group AND non-relevant.
    const { nodeStates, relevance } = reqStates(['/data/q1', '/data/q2']);
    relevance['/data/g1'] = false;
    const store = makeStore({
      events: [
        { kind: 'bof' },
        questionEvent('/data/q1', 'Q1'),
        groupEvent('/data/g1', null),
        questionEvent('/data/q2', 'Q2'),
        { kind: 'eof' },
      ],
      nodeStates,
      relevance,
      choices: {},
      answerResults: {},
      values: { '/data/q1': 'a', '/data/q2': '' },
    });
    store.stepForward(); // bof -> q1
    await render(<Form store={store} />);
    const spy = jest.spyOn(store, 'stepForward');
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    // Settles directly on q2: relevance-skip (branch 1) consumed g1 in one
    // step; label-skip never independently double-steps past q2.
    expect(screen.getByText('Q2')).toBeTruthy();
    // 1 step for handleNext (q1 -> g1) + 1 auto-skip step (g1 -> q2) = 2 total,
    // never 3 (which would indicate a double-step / race).
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('scenario 5: bof/eof are never skipped for label', async () => {
    const store = makeStore({
      events: [{ kind: 'bof' }, groupEvent('/data/g1', null), { kind: 'eof' }],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    await render(<Form store={store} />);
    expect(screen.getByText('Beginning of Form')).toBeTruthy();
  });

  it('scenario 6: consecutive unlabeled groups skipped forward in one navigation action', async () => {
    const { nodeStates, relevance } = reqStates(['/data/q1', '/data/q2']);
    const store = makeStore({
      events: [
        { kind: 'bof' },
        questionEvent('/data/q1', 'Q1'),
        groupEvent('/data/g1', null),
        groupEvent('/data/g2', null),
        groupEvent('/data/g3', null),
        questionEvent('/data/q2', 'Q2'),
        { kind: 'eof' },
      ],
      nodeStates,
      relevance,
      choices: {},
      answerResults: {},
      values: { '/data/q1': 'a', '/data/q2': '' },
    });
    store.stepForward(); // bof -> q1
    await render(<Form store={store} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByText('Q2')).toBeTruthy();
  });

  it('scenario 7: consecutive unlabeled groups skipped backward in one navigation action', async () => {
    const { nodeStates, relevance } = reqStates(['/data/q1', '/data/q2']);
    const store = makeStore({
      events: [
        { kind: 'bof' },
        questionEvent('/data/q1', 'Q1'),
        groupEvent('/data/g1', null),
        groupEvent('/data/g2', null),
        groupEvent('/data/g3', null),
        questionEvent('/data/q2', 'Q2'),
        { kind: 'eof' },
      ],
      nodeStates,
      relevance,
      choices: {},
      answerResults: {},
      values: { '/data/q1': 'a', '/data/q2': 'b' },
    });
    store.stepForward(); // bof -> q1
    store.stepForward(); // q1 -> g1
    store.stepForward(); // g1 -> g2
    store.stepForward(); // g2 -> g3
    store.stepForward(); // g3 -> q2
    await render(<Form store={store} />);
    expect(screen.getByText('Q2')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-back'));
    });
    expect(screen.getByText('Q1')).toBeTruthy();
  });

  it('scenario 8: backward skip reaching bof settles at bof, no further stepping', async () => {
    const { nodeStates, relevance } = reqStates(['/data/q1']);
    const store = makeStore({
      events: [
        { kind: 'bof' },
        groupEvent('/data/g1', null),
        questionEvent('/data/q1', 'Q1'),
        { kind: 'eof' },
      ],
      nodeStates,
      relevance,
      choices: {},
      answerResults: {},
      values: { '/data/q1': 'a' },
    });
    store.stepForward(); // bof -> g1
    store.stepForward(); // g1 -> q1
    await render(<Form store={store} />);
    expect(screen.getByText('Q1')).toBeTruthy();
    const spy = jest.spyOn(store, 'stepBackward');
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-back'));
    });
    expect(screen.getByText('Beginning of Form')).toBeTruthy();
    // One explicit stepBackward (q1 -> g1) + one auto-skip stepBackward
    // (g1 -> bof) = 2. No further backward step is attempted past bof.
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('scenario 9: unlabeled group immediately before eof settles cleanly at eof going forward', async () => {
    const { nodeStates, relevance } = reqStates(['/data/q1']);
    const store = makeStore({
      events: [
        { kind: 'bof' },
        questionEvent('/data/q1', 'Q1'),
        groupEvent('/data/g1', null),
        { kind: 'eof' },
      ],
      nodeStates,
      relevance,
      choices: {},
      answerResults: {},
      values: { '/data/q1': 'a' },
    });
    store.stepForward(); // bof -> q1
    await render(<Form store={store} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByTestId('eof-surface')).toBeTruthy();
  });

  it('scenario 10: question with null label is never auto-skipped', async () => {
    const { nodeStates, relevance } = reqStates(['/data/q1']);
    const store = makeStore({
      events: [
        { kind: 'bof' },
        {
          kind: 'question' as const,
          ref: '/data/q1',
          dataType: 'string' as const,
          controlType: 'input' as const,
          label: null,
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates,
      relevance,
      choices: {},
      answerResults: {},
      values: { '/data/q1': 'a' },
    });
    store.stepForward(); // bof -> q1
    await render(<Form store={store} />);
    // The question itself renders (its testID-bearing widget input), even
    // though its label is null — question kind never label-skips.
    expect(screen.getByTestId('string-input')).toBeTruthy();
  });
});
