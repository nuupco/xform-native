/**
 * TriggerWidget style tests (Phase 3, PR4) — tertiaryContainer card, 24dp
 * checkbox + bodyLarge text, entire card tappable, 2px tertiary border +
 * filled check when checked.
 */

import { render, screen, cleanup, fireEvent } from '@testing-library/react-native';
import { AnswerResult, type DataType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../test-support/makeFakeSession';
import { TriggerWidget } from '../widgets/TriggerWidget';
import { tokens } from '../tokens/tokens';
import type { NodeRef } from '../adapter/FormAdapter';
import type { ControlType } from '@nuup/ts-rosa';

function makeStoreFor(opts: {
  ref: string;
  dataType: DataType;
  controlType?: ControlType;
  value?: unknown;
  readonly?: boolean;
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

describe('TriggerWidget styles', () => {
  afterEach(async () => {
    await cleanup();
  });

  it('renders a tertiaryContainer card', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/ack', dataType: 'string', value: null });
    await render(<TriggerWidget nodeRef={ref} store={store} />);
    const card = screen.getByTestId('trigger-checkbox');
    const flat = Array.isArray(card.props.style) ? Object.assign({}, ...card.props.style.filter(Boolean)) : card.props.style;
    expect(flat.backgroundColor).toBe(tokens.color.roles.tertiaryContainer);
  });

  it('shows a 2px tertiary border on the card when checked', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/ack', dataType: 'string', value: 'OK' });
    await render(<TriggerWidget nodeRef={ref} store={store} />);
    const card = screen.getByTestId('trigger-checkbox');
    const flat = Array.isArray(card.props.style) ? Object.assign({}, ...card.props.style.filter(Boolean)) : card.props.style;
    expect(flat.borderWidth).toBe(2);
    expect(flat.borderColor).toBe(tokens.color.roles.tertiary);
  });

  it('does not show a tertiary border when unchecked', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/ack', dataType: 'string', value: null });
    await render(<TriggerWidget nodeRef={ref} store={store} />);
    const card = screen.getByTestId('trigger-checkbox');
    const flat = Array.isArray(card.props.style) ? Object.assign({}, ...card.props.style.filter(Boolean)) : card.props.style;
    expect(flat.borderWidth ?? 0).not.toBe(2);
  });

  it('makes the entire card tappable, committing OK', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/ack', dataType: 'string', value: null });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<TriggerWidget nodeRef={ref} store={store} />);
    fireEvent.press(screen.getByTestId('trigger-checkbox'));
    expect(spy).toHaveBeenCalledWith(ref, 'OK');
  });

  it('renders bodyLarge label text', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/ack', dataType: 'string', value: null });
    await render(<TriggerWidget nodeRef={ref} store={store} />);
    const label = screen.getByTestId('trigger-label');
    const flat = Array.isArray(label.props.style) ? Object.assign({}, ...label.props.style.filter(Boolean)) : label.props.style;
    expect(flat.fontSize).toBe(tokens.typography.bodyLarge.fontSize);
  });
});
