/**
 * T-11c: Appearance variants — PR-1 (Numeric thousands-sep + Range variants).
 *
 * Tests for:
 * - IntWidget, DecimalWidget, LongWidget: thousands-sep appearance
 * - RangeWidget: no-ticks, picker, vertical appearances
 */

import { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AnswerResult, type DataType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../test-support/makeFakeSession';
import { IntWidget } from '../widgets/IntWidget';
import { DecimalWidget } from '../widgets/DecimalWidget';
import { LongWidget } from '../widgets/LongWidget';
import { RangeWidget } from '../widgets/RangeWidget';
import type { NodeRef } from '../adapter/FormAdapter';
import type { ControlType } from '@nuup/ts-rosa';

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
    choices: {},
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
// IntWidget — thousands-sep
// ---------------------------------------------------------------------------

describe('IntWidget thousands-sep', () => {
  it('formats value with commas when appearance=thousands-sep', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/age', dataType: 'int', value: 1234567 });
    await render(<IntWidget ref={ref} store={store} appearance="thousands-sep" />);
    expect(screen.getByDisplayValue('1,234,567')).toBeTruthy();
  });

  it('shows raw value on focus and formatted on blur', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/age', dataType: 'int', value: 1234 });
    await render(<IntWidget ref={ref} store={store} appearance="thousands-sep" />);
    const input = screen.getByTestId('int-input');

    // Initially formatted
    expect(input.props.value).toBe('1,234');

    // On focus — raw value
    await act(async () => {
      fireEvent(input, 'focus');
    });
    expect(input.props.value).toBe('1234');

    // On blur — formatted again
    await act(async () => {
      fireEvent(input, 'blur');
    });
    expect(input.props.value).toBe('1,234');
  });

  it('still commits parsed integer on change', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/age', dataType: 'int', value: 0 });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<IntWidget ref={ref} store={store} appearance="thousands-sep" />);
    fireEvent.changeText(screen.getByTestId('int-input'), '999');
    expect(spy).toHaveBeenCalledWith(ref, 999);
  });

  it('shows unformatted value for default appearance', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/age', dataType: 'int', value: 1234567 });
    await render(<IntWidget ref={ref} store={store} />);
    expect(screen.getByDisplayValue('1234567')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// DecimalWidget — thousands-sep
// ---------------------------------------------------------------------------

describe('DecimalWidget thousands-sep', () => {
  it('formats value with commas when appearance=thousands-sep', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/price', dataType: 'decimal', value: 1234.56 });
    await render(<DecimalWidget ref={ref} store={store} appearance="thousands-sep" />);
    expect(screen.getByDisplayValue('1,234.56')).toBeTruthy();
  });

  it('shows raw value on focus and formatted on blur', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/price', dataType: 'decimal', value: 1234.5 });
    await render(<DecimalWidget ref={ref} store={store} appearance="thousands-sep" />);
    const input = screen.getByTestId('decimal-input');

    expect(input.props.value).toBe('1,234.5');
    await act(async () => {
      fireEvent(input, 'focus');
    });
    expect(input.props.value).toBe('1234.5');
    await act(async () => {
      fireEvent(input, 'blur');
    });
    expect(input.props.value).toBe('1,234.5');
  });

  it('still commits parsed float on change', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/price', dataType: 'decimal', value: 0 });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DecimalWidget ref={ref} store={store} appearance="thousands-sep" />);
    fireEvent.changeText(screen.getByTestId('decimal-input'), '1.99');
    expect(spy).toHaveBeenCalledWith(ref, 1.99);
  });
});

// ---------------------------------------------------------------------------
// LongWidget — thousands-sep
// ---------------------------------------------------------------------------

describe('LongWidget thousands-sep', () => {
  it('formats value with commas when appearance=thousands-sep', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/big', dataType: 'long', value: 9999999 });
    await render(<LongWidget ref={ref} store={store} appearance="thousands-sep" />);
    expect(screen.getByDisplayValue('9,999,999')).toBeTruthy();
  });

  it('shows raw value on focus and formatted on blur', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/big', dataType: 'long', value: 123456 });
    await render(<LongWidget ref={ref} store={store} appearance="thousands-sep" />);
    const input = screen.getByTestId('long-input');

    expect(input.props.value).toBe('123,456');
    await act(async () => {
      fireEvent(input, 'focus');
    });
    expect(input.props.value).toBe('123456');
    await act(async () => {
      fireEvent(input, 'blur');
    });
    expect(input.props.value).toBe('123,456');
  });

  it('still commits parsed number on change', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/big', dataType: 'long', value: 0 });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<LongWidget ref={ref} store={store} appearance="thousands-sep" />);
    fireEvent.changeText(screen.getByTestId('long-input'), '123456');
    expect(spy).toHaveBeenCalledWith(ref, 123456);
  });
});

// ---------------------------------------------------------------------------
// RangeWidget — variants
// ---------------------------------------------------------------------------

describe('RangeWidget no-ticks', () => {
  it('hides the value display but buttons still work', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/score',
      dataType: 'int',
      controlType: 'range',
      value: 5,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<RangeWidget ref={ref} store={store} start={0} end={10} step={1} appearance="no-ticks" />);

    expect(screen.queryByTestId('range-value-display')).toBeNull();
    fireEvent.press(screen.getByTestId('range-increment'));
    expect(spy).toHaveBeenCalledWith(ref, 6);
  });
});

describe('RangeWidget picker', () => {
  it('renders a picker trigger instead of stepper', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/score',
      dataType: 'int',
      controlType: 'range',
      value: 5,
    });
    await render(<RangeWidget ref={ref} store={store} start={0} end={5} step={1} appearance="picker" />);

    expect(screen.queryByTestId('range-increment')).toBeNull();
    expect(screen.queryByTestId('range-decrement')).toBeNull();
    expect(screen.getByTestId('range-picker-trigger')).toBeTruthy();
  });

  it('opens picker and selecting a value commits it', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/score',
      dataType: 'int',
      controlType: 'range',
      value: 0,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<RangeWidget ref={ref} store={store} start={0} end={3} step={1} appearance="picker" />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('range-picker-trigger'));
    });
    expect(screen.getByTestId('range-picker-sheet')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('range-picker-option-2'));
    });
    expect(spy).toHaveBeenCalledWith(ref, 2);
  });
});

describe('RangeWidget vertical', () => {
  it('renders stepper in vertical layout', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/score',
      dataType: 'int',
      controlType: 'range',
      value: 5,
    });
    await render(<RangeWidget ref={ref} store={store} start={0} end={10} step={1} appearance="vertical" />);

    expect(screen.getByTestId('range-stepper')).toBeTruthy();
    expect(screen.getByTestId('range-increment')).toBeTruthy();
    expect(screen.getByTestId('range-decrement')).toBeTruthy();
  });

  it('increment and decrement still work', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/score',
      dataType: 'int',
      controlType: 'range',
      value: 5,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<RangeWidget ref={ref} store={store} start={0} end={10} step={1} appearance="vertical" />);

    fireEvent.press(screen.getByTestId('range-increment'));
    expect(spy).toHaveBeenCalledWith(ref, 6);

    fireEvent.press(screen.getByTestId('range-decrement'));
    expect(spy).toHaveBeenCalledWith(ref, 4);
  });
});
