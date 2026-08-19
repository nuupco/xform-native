/**
 * T-11: Widget components (REQ-13, REQ-15, REQ-16, REQ-09).
 *
 * Tests per widget:
 * - renders current value
 * - value change calls answerQuestion with correctly typed value
 * - readonly disables input (answerQuestion NOT called on interaction)
 * - appearance selects variant (spot-check)
 * - required indicator shown when nodeState.required === true
 *
 * Uses makeFakeSession + FormSessionStore.
 * RNTL v14: render() is async, fireEvent is sync.
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { AnswerResult, type DataType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../../test-support/makeFakeSession';
import { StringWidget } from '../../widgets/StringWidget';
import { IntWidget } from '../../widgets/IntWidget';
import { DecimalWidget } from '../../widgets/DecimalWidget';
import { LongWidget } from '../../widgets/LongWidget';
import { BooleanWidget } from '../../widgets/BooleanWidget';
import { NoteWidget } from '../../widgets/NoteWidget';
import { UncastWidget } from '../../widgets/UncastWidget';
import { UnsupportedWidget } from '../../widgets/UnsupportedWidget';
import type { NodeRef } from '../../adapter/FormAdapter';
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
  // Step forward to the question
  store.stepForward();
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question event');
  return { store, ref: ev.ref };
}

// ---------------------------------------------------------------------------
// StringWidget
// ---------------------------------------------------------------------------

describe('StringWidget', () => {
  it('renders current value', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/name', dataType: 'string', value: 'Alice' });
    await render(<StringWidget nodeRef={ref} store={store} />);
    expect(screen.getByDisplayValue('Alice')).toBeTruthy();
  });

  it('calls answerQuestion with string value on change', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/name', dataType: 'string', value: '' });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<StringWidget nodeRef={ref} store={store} />);
    fireEvent.changeText(screen.getByTestId('string-input'), 'Bob');
    expect(spy).toHaveBeenCalledWith(ref, 'Bob');
  });

  it('disables input when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/name',
      dataType: 'string',
      value: 'locked',
      readonly: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<StringWidget nodeRef={ref} store={store} />);
    const input = screen.getByTestId('string-input');
    expect(input.props.editable).toBe(false);
    // Attempting to change text should not call answerQuestion
    fireEvent.changeText(input, 'new');
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not render its own required indicator (Form.tsx owns it)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/name',
      dataType: 'string',
      required: true,
    });
    await render(<StringWidget nodeRef={ref} store={store} />);
    expect(screen.queryByTestId('required-indicator')).toBeNull();
  });

  it('renders multiline variant when appearance=multiline', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/name', dataType: 'string', value: '' });
    await render(<StringWidget nodeRef={ref} store={store} appearance="multiline" />);
    const input = screen.getByTestId('string-input');
    expect(input.props.multiline).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// IntWidget
// ---------------------------------------------------------------------------

describe('IntWidget', () => {
  it('renders current value as string', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/age', dataType: 'int', value: 42 });
    await render(<IntWidget nodeRef={ref} store={store} />);
    expect(screen.getByDisplayValue('42')).toBeTruthy();
  });

  it('calls answerQuestion with parsed integer', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/age', dataType: 'int', value: 0 });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<IntWidget nodeRef={ref} store={store} />);
    fireEvent.changeText(screen.getByTestId('int-input'), '25');
    expect(spy).toHaveBeenCalledWith(ref, 25);
  });

  it('disables input when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/age',
      dataType: 'int',
      value: 5,
      readonly: true,
    });
    await render(<IntWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('int-input').props.editable).toBe(false);
  });

  it('does not render its own required indicator (Form.tsx owns it)', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/age', dataType: 'int', required: true });
    await render(<IntWidget nodeRef={ref} store={store} />);
    expect(screen.queryByTestId('required-indicator')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// DecimalWidget
// ---------------------------------------------------------------------------

describe('DecimalWidget', () => {
  it('renders current value as string', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/price',
      dataType: 'decimal',
      value: 3.14,
    });
    await render(<DecimalWidget nodeRef={ref} store={store} />);
    expect(screen.getByDisplayValue('3.14')).toBeTruthy();
  });

  it('calls answerQuestion with parsed float', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/price', dataType: 'decimal', value: 0 });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DecimalWidget nodeRef={ref} store={store} />);
    fireEvent.changeText(screen.getByTestId('decimal-input'), '1.99');
    expect(spy).toHaveBeenCalledWith(ref, 1.99);
  });

  it('disables input when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/price',
      dataType: 'decimal',
      value: 1.0,
      readonly: true,
    });
    await render(<DecimalWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('decimal-input').props.editable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LongWidget
// ---------------------------------------------------------------------------

describe('LongWidget', () => {
  it('renders current value', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/big',
      dataType: 'long',
      value: 9999999,
    });
    await render(<LongWidget nodeRef={ref} store={store} />);
    expect(screen.getByDisplayValue('9999999')).toBeTruthy();
  });

  it('calls answerQuestion with parsed number', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/big', dataType: 'long', value: 0 });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<LongWidget nodeRef={ref} store={store} />);
    fireEvent.changeText(screen.getByTestId('long-input'), '123456');
    expect(spy).toHaveBeenCalledWith(ref, 123456);
  });

  it('disables input when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/big',
      dataType: 'long',
      value: 1,
      readonly: true,
    });
    await render(<LongWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('long-input').props.editable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BooleanWidget
// ---------------------------------------------------------------------------

describe('BooleanWidget', () => {
  it('renders SegmentedButton with Sí selected when value is true', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/flag',
      dataType: 'boolean',
      value: true,
    });
    await render(<BooleanWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('boolean-switch')).toBeTruthy();
    const yes = screen.getByTestId('boolean-switch-segment-true');
    const no = screen.getByTestId('boolean-switch-segment-false');
    expect(yes.props.accessibilityState.selected).toBe(true);
    expect(no.props.accessibilityState.selected).toBe(false);
  });

  it('renders SegmentedButton with No selected when value is false', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/flag',
      dataType: 'boolean',
      value: false,
    });
    await render(<BooleanWidget nodeRef={ref} store={store} />);
    const yes = screen.getByTestId('boolean-switch-segment-true');
    const no = screen.getByTestId('boolean-switch-segment-false');
    expect(yes.props.accessibilityState.selected).toBe(false);
    expect(no.props.accessibilityState.selected).toBe(true);
  });

  it('renders neither segment selected when value is unanswered', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/flag',
      dataType: 'boolean',
      value: null,
    });
    await render(<BooleanWidget nodeRef={ref} store={store} />);
    const yes = screen.getByTestId('boolean-switch-segment-true');
    const no = screen.getByTestId('boolean-switch-segment-false');
    expect(yes.props.accessibilityState.selected).toBe(false);
    expect(no.props.accessibilityState.selected).toBe(false);
  });

  it('calls answerQuestion(true) when Sí is tapped', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/flag',
      dataType: 'boolean',
      value: false,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<BooleanWidget nodeRef={ref} store={store} />);
    fireEvent.press(screen.getByTestId('boolean-switch-segment-true'));
    expect(spy).toHaveBeenCalledWith(ref, true);
  });

  it('calls answerQuestion(false) when No is tapped', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/flag',
      dataType: 'boolean',
      value: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<BooleanWidget nodeRef={ref} store={store} />);
    fireEvent.press(screen.getByTestId('boolean-switch-segment-false'));
    expect(spy).toHaveBeenCalledWith(ref, false);
  });

  it('disables segments when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/flag',
      dataType: 'boolean',
      value: false,
      readonly: true,
    });
    await render(<BooleanWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('boolean-switch-segment-true').props.accessibilityState.disabled).toBe(true);
  });

  it('does not render its own required indicator (Form.tsx owns it)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/flag',
      dataType: 'boolean',
      required: true,
    });
    await render(<BooleanWidget nodeRef={ref} store={store} />);
    expect(screen.queryByTestId('required-indicator')).toBeNull();
  });

  it('renders checkbox variant when appearance=checkbox', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/flag', dataType: 'boolean', value: false });
    await render(<BooleanWidget nodeRef={ref} store={store} appearance="checkbox" />);
    expect(screen.getByTestId('boolean-checkbox')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// NoteWidget (REQ-15 — readonly text, never calls answerQuestion)
// ---------------------------------------------------------------------------

describe('NoteWidget', () => {
  it('renders note text', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/note',
      dataType: 'string',
      value: 'Please read this carefully.',
    });
    await render(<NoteWidget nodeRef={ref} store={store} />);
    expect(screen.getByText('Please read this carefully.')).toBeTruthy();
  });

  it('never calls answerQuestion', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/note', dataType: 'string', value: 'note' });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<NoteWidget nodeRef={ref} store={store} />);
    // NoteWidget should have no interactive element — just confirm no call happened
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not render an editable input', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/note', dataType: 'string', value: 'note' });
    await render(<NoteWidget nodeRef={ref} store={store} />);
    // There should be no testID string-input or editable TextInput
    expect(screen.queryByTestId('string-input')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// UncastWidget (REQ-16)
// ---------------------------------------------------------------------------

describe('UncastWidget', () => {
  it('renders without crashing', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/unknown',
      dataType: 'uncast',
      value: 'raw-value',
    });
    await render(<UncastWidget nodeRef={ref} store={store} />);
    expect(true).toBe(true);
  });

  it('displays the raw string value when available', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/unknown',
      dataType: 'uncast',
      value: 'raw-value',
    });
    await render(<UncastWidget nodeRef={ref} store={store} />);
    expect(screen.getByText('raw-value')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// UnsupportedWidget (REQ-09)
// ---------------------------------------------------------------------------

describe('UnsupportedWidget', () => {
  it('renders without crashing', async () => {
    await render(<UnsupportedWidget dataType="date" />);
    expect(true).toBe(true);
  });

  it('displays the dataType label', async () => {
    await render(<UnsupportedWidget dataType="date" />);
    expect(screen.getByText(/date/i)).toBeTruthy();
  });
});
