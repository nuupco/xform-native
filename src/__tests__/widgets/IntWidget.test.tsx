/**
 * IntWidget integration with useDraftValue (widget-draft-value, Phase 3).
 *
 * Covers REQ-2/3/6/7/8/9/10 as observed through the rendered widget.
 */

import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { AnswerResult, type DataType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../../test-support/makeFakeSession';
import { IntWidget } from '../../widgets/IntWidget';
import type { NodeRef } from '../../adapter/FormAdapter';
import type { ControlType } from '@nuup/ts-rosa';

function makeStoreFor(opts: {
  ref: string;
  dataType: DataType;
  controlType?: ControlType;
  value?: unknown;
  readonly?: boolean;
  appearance?: string | null;
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
        appearance: opts.appearance ?? null,
      },
      { kind: 'eof' },
    ],
    nodeStates: {
      [opts.ref]: {
        readonly: opts.readonly ?? false,
        required: false,
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

describe('IntWidget draft behavior', () => {
  it('clear-to-empty commits null live (REQ-2/9)', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/age', dataType: 'int', value: 42 });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<IntWidget nodeRef={ref} store={store} />);
    const input = screen.getByTestId('int-input');
    await fireEvent(input, 'focus');
    await fireEvent.changeText(input, '');
    expect(spy).toHaveBeenCalledWith(ref, null);
    expect(screen.getByTestId('int-input').props.value).toBe('');
  });

  it('typing lone "-" holds as draft, does not commit (REQ-3)', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/age', dataType: 'int', value: null });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<IntWidget nodeRef={ref} store={store} />);
    const input = screen.getByTestId('int-input');
    await fireEvent(input, 'focus');
    await fireEvent.changeText(input, '-');
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByTestId('int-input').props.value).toBe('-');
  });

  it('blur reverts an uncommitted draft without fabricating a parse (REQ-4/6)', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/age', dataType: 'int', value: null });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<IntWidget nodeRef={ref} store={store} />);
    const input = screen.getByTestId('int-input');
    await fireEvent(input, 'focus');
    await fireEvent.changeText(input, '-');
    await fireEvent(input, 'blur');
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByTestId('int-input').props.value).toBe('');
  });

  it('external store update is visible when blurred (REQ-7)', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/age', dataType: 'int', value: 10 });
    await render(<IntWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('int-input').props.value).toBe('10');
    await act(() => {
      store.answerQuestion(ref, 25);
    });
    expect(screen.getByTestId('int-input').props.value).toBe('25');
  });

  it('external store update does not clobber an in-progress focused draft (REQ-8)', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/age', dataType: 'int', value: 0 });
    await render(<IntWidget nodeRef={ref} store={store} />);
    const input = screen.getByTestId('int-input');
    await fireEvent(input, 'focus');
    await fireEvent.changeText(input, '-');
    await act(() => {
      store.answerQuestion(ref, 99);
    });
    expect(screen.getByTestId('int-input').props.value).toBe('-');
  });

  it('thousands-sep: raw while focused, formatted while blurred (REQ-10)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/age',
      dataType: 'int',
      value: 1234567,
      appearance: 'thousands-sep',
    });
    await render(<IntWidget nodeRef={ref} store={store} appearance="thousands-sep" />);
    const input = screen.getByTestId('int-input');
    expect(input.props.value).toBe('1,234,567');
    await fireEvent(input, 'focus');
    expect(screen.getByTestId('int-input').props.value).toBe('1234567');
    await fireEvent.changeText(input, '12345678');
    expect(screen.getByTestId('int-input').props.value).toBe('12345678');
    await fireEvent(input, 'blur');
    expect(screen.getByTestId('int-input').props.value).toBe('12,345,678');
  });

  it('does not commit a decimal point (rejects instead of truncating)', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/age', dataType: 'int', value: null });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<IntWidget nodeRef={ref} store={store} />);
    const input = screen.getByTestId('int-input');
    await fireEvent(input, 'focus');
    await fireEvent.changeText(input, '1.');
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByTestId('int-input').props.value).toBe('1.');
  });
});
