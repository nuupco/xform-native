/**
 * TriggerWidget — acknowledge/toggle control (widget-hygiene-fixes spec).
 *
 * Uses makeFakeSession + FormSessionStore, mirrors BooleanWidget test harness.
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { AnswerResult, type DataType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../../test-support/makeFakeSession';
import { TriggerWidget } from '../../widgets/TriggerWidget';
import type { NodeRef } from '../../adapter/FormAdapter';
import type { ControlType } from '@nuup/ts-rosa';

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
        controlType: opts.controlType ?? 'trigger',
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

describe('TriggerWidget', () => {
  it('renders unchecked when value is not OK', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/ack', dataType: 'string', value: null });
    await render(<TriggerWidget nodeRef={ref} store={store} />);
    const checkbox = screen.getByTestId('trigger-checkbox');
    expect(checkbox.props.accessibilityState.checked).toBe(false);
  });

  it('renders checked when value is OK', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/ack', dataType: 'string', value: 'OK' });
    await render(<TriggerWidget nodeRef={ref} store={store} />);
    const checkbox = screen.getByTestId('trigger-checkbox');
    expect(checkbox.props.accessibilityState.checked).toBe(true);
  });

  it('commits OK when tapped while unset', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/ack', dataType: 'string', value: null });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<TriggerWidget nodeRef={ref} store={store} />);
    fireEvent.press(screen.getByTestId('trigger-checkbox'));
    expect(spy).toHaveBeenCalledWith(ref, 'OK');
  });

  it('clears to null when tapped while already OK', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/ack', dataType: 'string', value: 'OK' });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<TriggerWidget nodeRef={ref} store={store} />);
    fireEvent.press(screen.getByTestId('trigger-checkbox'));
    expect(spy).toHaveBeenCalledWith(ref, null);
  });

  it('does not call answerQuestion when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/ack',
      dataType: 'string',
      value: null,
      readonly: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<TriggerWidget nodeRef={ref} store={store} />);
    fireEvent.press(screen.getByTestId('trigger-checkbox'));
    expect(spy).not.toHaveBeenCalled();
  });
});
