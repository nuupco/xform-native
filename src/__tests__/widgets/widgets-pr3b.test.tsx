/**
 * T-11b: PR-3b widget components (REQ-13, REQ-14).
 *
 * Covers: SelectOneWidget, SelectMultiWidget, DateWidget, TimeWidget,
 *         DateTimeWidget, RangeWidget.
 *
 * TDD: these tests are written FIRST (RED) and drive the implementation (GREEN).
 *
 * Value shapes verified against ts-rosa source:
 *   selectOne   → string token           (AnswerValue.ts:30, codecs.ts:180-183)
 *   selectMulti → readonly string[]      (AnswerValue.ts:31, codecs.ts:185-189)
 *   date        → Date object            (AnswerValue.ts:27, codecs.ts:153-158)
 *   time        → Date object            (AnswerValue.ts:28, codecs.ts:162-169)
 *   dateTime    → Date object            (AnswerValue.ts:29, codecs.ts:172-176)
 *   range       → number (int/decimal)   (controlType=range, no dedicated AnswerValue kind)
 *
 * range bounds: FormElement.ts has no dedicated range bound fields on FormElement.
 * RangeWidget uses sane defaults (start=0, end=10, step=1) with optional props.
 */

import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult, type DataType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../../test-support/makeFakeSession';
import { SelectOneWidget } from '../../widgets/SelectOneWidget';
import { SelectMultiWidget } from '../../widgets/SelectMultiWidget';
import { DateWidget } from '../../widgets/DateWidget';
import { TimeWidget } from '../../widgets/TimeWidget';
import { DateTimeWidget } from '../../widgets/DateTimeWidget';
import { RangeWidget } from '../../widgets/RangeWidget';
import type { NodeRef } from '../../adapter/FormAdapter';
import type { ControlType } from '@nuup/ts-rosa';
import type { SelectChoice } from '@nuup/ts-rosa';

// Ensure RNTL cleanup runs between tests (async cleanup guarantee)
afterEach(async () => {
  await cleanup();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStoreFor(opts: {
  ref: string;
  dataType: DataType;
  controlType?: ControlType;
  value?: unknown;
  readonly?: boolean;
  required?: boolean;
  choices?: readonly SelectChoice[];
}): { store: FormSessionStore; ref: NodeRef } {
  const script: FakeSessionScript = {
    events: [
      { kind: 'bof' },
      {
        kind: 'question',
        ref: opts.ref,
        dataType: opts.dataType,
        controlType: opts.controlType ?? 'input',
        label: 'Test field',
        hint: null,
        appearance: null,
      },
      { kind: 'eof' },
    ],
    nodeStates: {
      [opts.ref]: {
        readonly: opts.readonly ?? false,
        required: opts.required ?? false,
        relevant: true,
        enabled: true,
        constraintMsg: null,
        calculatedValue: null,
      },
    },
    relevance: { [opts.ref]: true },
    choices: { [opts.ref]: opts.choices ?? [] },
    answerResults: { [opts.ref]: AnswerResult.OK },
    values: { [opts.ref]: opts.value ?? null },
  };
  const session = makeFakeSession(script);
  const store = new FormSessionStore(session);
  store.stepForward();
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question event');
  return { store, ref: ev.ref };
}

// ---------------------------------------------------------------------------
// SelectOneWidget
// ---------------------------------------------------------------------------

describe('SelectOneWidget', () => {
  const choices: SelectChoice[] = [
    { value: 'val1', label: 'Option One' },
    { value: 'val2', label: 'Option Two' },
    { value: 'val3', label: 'Option Three' },
  ];

  it('renders 3 choices by label', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/color',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} />);
    expect(screen.getByText('Option One')).toBeTruthy();
    expect(screen.getByText('Option Two')).toBeTruthy();
    expect(screen.getByText('Option Three')).toBeTruthy();
  });

  it('selecting a choice commits SelectChoice.value (not label)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/color',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectOneWidget nodeRef={ref} store={store} />);
    fireEvent.press(screen.getByTestId('select-one-option-val1'));
    expect(spy).toHaveBeenCalledWith(ref, 'val1');
  });

  it('does not call answerQuestion when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/color',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      readonly: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectOneWidget nodeRef={ref} store={store} />);
    fireEvent.press(screen.getByTestId('select-one-option-val1'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('minimal variant renders a bottom-sheet trigger button', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/color',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="minimal" />);
    expect(screen.getByTestId('select-one-dropdown-trigger')).toBeTruthy();
  });

  it('does not render its own required indicator (Form.tsx owns it)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/color',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      required: true,
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} />);
    expect(screen.queryByTestId('required-indicator')).toBeNull();
  });

  it('minimal+autocomplete appearance renders a bottom-sheet WITH a search box that filters choices', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/color',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
    });
    await render(
      <SelectOneWidget nodeRef={ref} store={store} appearance="minimal autocomplete" />,
    );
    // Still a bottom-sheet dropdown trigger (minimal behavior)
    const trigger = screen.getByTestId('select-one-dropdown-trigger');
    expect(trigger).toBeTruthy();
    await act(async () => {
      fireEvent.press(trigger);
    });
    // But also has a search box (autocomplete behavior layered on top)
    const search = screen.getByTestId('select-one-minimal-autocomplete-search');
    expect(search).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(search, 'Two');
    });
    expect(screen.getByText('Option Two')).toBeTruthy();
    expect(screen.queryByText('Option One')).toBeNull();
    expect(screen.queryByText('Option Three')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SelectMultiWidget
// ---------------------------------------------------------------------------

describe('SelectMultiWidget', () => {
  const choices: SelectChoice[] = [
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
    { value: 'c', label: 'Cherry' },
  ];

  it('renders all choices by label', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/fruits',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
    });
    await render(<SelectMultiWidget nodeRef={ref} store={store} />);
    expect(screen.getByText('Apple')).toBeTruthy();
    expect(screen.getByText('Banana')).toBeTruthy();
    expect(screen.getByText('Cherry')).toBeTruthy();
  });

  it('autocomplete variant (unified bottom-sheet) persists taps while the search keyboard is open (REQ hotfix)', async () => {
    // 'autocomplete' is unified with 'minimal-autocomplete': a trigger opens
    // a BottomSheet whose internal ScrollView carries
    // keyboardShouldPersistTaps="handled" — without it, the first tap on a
    // result below a focused search TextInput only dismisses the keyboard
    // instead of firing onPress (the on-device bug this unification fixes).
    const { store, ref } = makeStoreFor({
      ref: '/data/fruits',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      value: [],
    });
    const { getByTestId } = await render(
      <SelectMultiWidget nodeRef={ref} store={store} appearance="autocomplete" />,
    );
    await act(async () => {
      fireEvent.press(getByTestId('select-multi-dropdown-trigger'));
    });
    const scroll = getByTestId('select-multi-sheet-scroll');
    expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('selecting multiple choices commits readonly string[] (space-separated tokens)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/fruits',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      value: [],
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectMultiWidget nodeRef={ref} store={store} />);

    // Select 'a' then 'b' — wrap each in act() to flush React updates between presses
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-option-a'));
    });
    expect(spy).toHaveBeenCalledWith(ref, ['a']);

    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-option-b'));
    });
    expect(spy).toHaveBeenCalledWith(ref, ['a', 'b']);
  });

  it('deselecting a choice removes it from the committed value', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/fruits',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      value: ['a', 'b'],
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectMultiWidget nodeRef={ref} store={store} />);

    // Deselect 'a' — should commit ['b'] only
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-option-a'));
    });
    expect(spy).toHaveBeenCalledWith(ref, ['b']);
  });

  it('does not call answerQuestion when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/fruits',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      readonly: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectMultiWidget nodeRef={ref} store={store} />);
    fireEvent.press(screen.getByTestId('select-multi-option-a'));
    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// DateWidget
// ---------------------------------------------------------------------------

describe('DateWidget', () => {
  it('renders current date value as YYYY-MM-DD string', async () => {
    const d = new Date('2024-03-15T00:00:00.000Z');
    const { store, ref } = makeStoreFor({
      ref: '/data/dob',
      dataType: 'date',
      value: d,
    });
    await render(<DateWidget nodeRef={ref} store={store} />);
    expect(screen.getByDisplayValue('2024-03-15')).toBeTruthy();
  });

  it('editing commits a Date object via answerQuestion', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/dob',
      dataType: 'date',
      value: null,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DateWidget nodeRef={ref} store={store} />);
    fireEvent.changeText(screen.getByTestId('date-input'), '2025-06-01');
    expect(spy).toHaveBeenCalledWith(
      ref,
      expect.objectContaining({ getUTCFullYear: expect.any(Function) }),
    );
    const calledValue = spy.mock.calls[0]?.[1] as Date;
    expect(calledValue.getUTCFullYear()).toBe(2025);
    expect(calledValue.getUTCMonth()).toBe(5); // June = 5 (0-indexed)
    expect(calledValue.getUTCDate()).toBe(1);
  });

  it('is disabled when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/dob',
      dataType: 'date',
      value: null,
      readonly: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DateWidget nodeRef={ref} store={store} />);
    const input = screen.getByTestId('date-input');
    expect(input.props.editable).toBe(false);
    fireEvent.changeText(input, '2025-01-01');
    expect(spy).not.toHaveBeenCalled();
  });

  it('ignores invalid date strings (does not commit)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/dob',
      dataType: 'date',
      value: null,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DateWidget nodeRef={ref} store={store} />);
    fireEvent.changeText(screen.getByTestId('date-input'), 'not-a-date');
    expect(spy).not.toHaveBeenCalled();
  });

  it('auto-masks digits-only input into YYYY-MM-DD as the user types (numeric keyboard, no separator key)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/dob',
      dataType: 'date',
      value: null,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DateWidget nodeRef={ref} store={store} />);
    const input = screen.getByTestId('date-input');

    // Numeric keyboard cannot type "-": user only ever types digits.
    await act(async () => {
      fireEvent.changeText(input, '20250115');
    });
    expect(screen.getByDisplayValue('2025-01-15')).toBeTruthy();
    expect(spy).toHaveBeenCalledWith(
      ref,
      expect.objectContaining({ getUTCFullYear: expect.any(Function) }),
    );
    const calledValue = spy.mock.calls[spy.mock.calls.length - 1]?.[1] as Date;
    expect(calledValue.getUTCFullYear()).toBe(2025);
    expect(calledValue.getUTCMonth()).toBe(0);
    expect(calledValue.getUTCDate()).toBe(15);
  });

  it('month-year variant auto-masks digits into MM-YYYY', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/dob',
      dataType: 'date',
      value: null,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DateWidget nodeRef={ref} store={store} appearance="month-year" />);
    const input = screen.getByTestId('date-input');
    await act(async () => {
      fireEvent.changeText(input, '062025');
    });
    expect(screen.getByDisplayValue('06-2025')).toBeTruthy();
    const calledValue = spy.mock.calls[spy.mock.calls.length - 1]?.[1] as Date;
    expect(calledValue.getUTCFullYear()).toBe(2025);
    expect(calledValue.getUTCMonth()).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// TimeWidget
// ---------------------------------------------------------------------------

describe('TimeWidget', () => {
  it('renders current time value as HH:MM string', async () => {
    const d = new Date('1970-01-01T14:30:00.000Z');
    const { store, ref } = makeStoreFor({
      ref: '/data/arrival',
      dataType: 'time',
      value: d,
    });
    await render(<TimeWidget nodeRef={ref} store={store} />);
    expect(screen.getByDisplayValue('14:30')).toBeTruthy();
  });

  it('editing commits a Date object anchored to epoch date', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/arrival',
      dataType: 'time',
      value: null,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<TimeWidget nodeRef={ref} store={store} />);
    fireEvent.changeText(screen.getByTestId('time-input'), '09:15');
    expect(spy).toHaveBeenCalledWith(
      ref,
      expect.objectContaining({ getUTCHours: expect.any(Function) }),
    );
    const calledValue = spy.mock.calls[0]?.[1] as Date;
    expect(calledValue.getUTCHours()).toBe(9);
    expect(calledValue.getUTCMinutes()).toBe(15);
  });

  it('is disabled when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/arrival',
      dataType: 'time',
      value: null,
      readonly: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<TimeWidget nodeRef={ref} store={store} />);
    const input = screen.getByTestId('time-input');
    expect(input.props.editable).toBe(false);
    fireEvent.changeText(input, '10:00');
    expect(spy).not.toHaveBeenCalled();
  });

  it('auto-masks digits-only input into HH:MM as the user types (numeric keyboard, no separator key)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/arrival',
      dataType: 'time',
      value: null,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<TimeWidget nodeRef={ref} store={store} />);
    const input = screen.getByTestId('time-input');

    await act(async () => {
      fireEvent.changeText(input, '0930');
    });
    expect(screen.getByDisplayValue('09:30')).toBeTruthy();
    const calledValue = spy.mock.calls[spy.mock.calls.length - 1]?.[1] as Date;
    expect(calledValue.getUTCHours()).toBe(9);
    expect(calledValue.getUTCMinutes()).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// DateTimeWidget
// ---------------------------------------------------------------------------

describe('DateTimeWidget', () => {
  it('renders current dateTime value as YYYY-MM-DDTHH:MM string', async () => {
    const d = new Date('2024-05-20T10:30:00.000Z');
    const { store, ref } = makeStoreFor({
      ref: '/data/timestamp',
      dataType: 'dateTime',
      value: d,
    });
    await render(<DateTimeWidget nodeRef={ref} store={store} />);
    expect(screen.getByDisplayValue('2024-05-20T10:30')).toBeTruthy();
  });

  it('editing commits a Date object', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/timestamp',
      dataType: 'dateTime',
      value: null,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DateTimeWidget nodeRef={ref} store={store} />);
    fireEvent.changeText(screen.getByTestId('datetime-input'), '2025-01-15T08:00');
    expect(spy).toHaveBeenCalledWith(
      ref,
      expect.objectContaining({ getUTCFullYear: expect.any(Function) }),
    );
    const calledValue = spy.mock.calls[0]?.[1] as Date;
    expect(calledValue.getUTCFullYear()).toBe(2025);
  });

  it('is disabled when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/timestamp',
      dataType: 'dateTime',
      value: null,
      readonly: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DateTimeWidget nodeRef={ref} store={store} />);
    const input = screen.getByTestId('datetime-input');
    expect(input.props.editable).toBe(false);
    fireEvent.changeText(input, '2025-01-01T00:00');
    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// RangeWidget
// ---------------------------------------------------------------------------

describe('RangeWidget', () => {
  it('renders current numeric value', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/score',
      dataType: 'int',
      controlType: 'range',
      value: 5,
    });
    await render(<RangeWidget nodeRef={ref} store={store} start={0} end={10} step={1} />);
    expect(screen.getByTestId('range-value-display')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('increment button commits value + step', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/score',
      dataType: 'int',
      controlType: 'range',
      value: 3,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<RangeWidget nodeRef={ref} store={store} start={0} end={10} step={1} />);
    fireEvent.press(screen.getByTestId('range-increment'));
    expect(spy).toHaveBeenCalledWith(ref, 4);
  });

  it('decrement button commits value - step', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/score',
      dataType: 'int',
      controlType: 'range',
      value: 5,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<RangeWidget nodeRef={ref} store={store} start={0} end={10} step={1} />);
    fireEvent.press(screen.getByTestId('range-decrement'));
    expect(spy).toHaveBeenCalledWith(ref, 4);
  });

  it('does not exceed end bound', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/score',
      dataType: 'int',
      controlType: 'range',
      value: 10,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<RangeWidget nodeRef={ref} store={store} start={0} end={10} step={1} />);
    fireEvent.press(screen.getByTestId('range-increment'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not go below start bound', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/score',
      dataType: 'int',
      controlType: 'range',
      value: 0,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<RangeWidget nodeRef={ref} store={store} start={0} end={10} step={1} />);
    fireEvent.press(screen.getByTestId('range-decrement'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('is disabled when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/score',
      dataType: 'int',
      controlType: 'range',
      value: 5,
      readonly: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<RangeWidget nodeRef={ref} store={store} start={0} end={10} step={1} />);
    fireEvent.press(screen.getByTestId('range-increment'));
    expect(spy).not.toHaveBeenCalled();
  });
});
