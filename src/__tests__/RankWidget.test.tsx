/**
 * RankWidget — reorder control for controlType 'rank' (rank-widget-support).
 *
 * Mirrors TriggerWidget.test.tsx harness. Rank questions carry dataType
 * 'selectMulti' with choices under the ref, and (when answered) an ordered
 * `values[ref]` string[] representing the committed rank.
 */

import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult, type DataType, type SelectChoice, type ControlType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../test-support/makeFakeSession';
import { RankWidget } from '../widgets/RankWidget';
import type { NodeRef } from '../adapter/FormAdapter';

afterEach(async () => {
  jest.clearAllMocks();
  await cleanup();
});

const choices: SelectChoice[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie' },
];

function makeStoreFor(opts: {
  ref: string;
  dataType: DataType;
  controlType?: ControlType;
  choices?: readonly SelectChoice[];
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
        controlType: opts.controlType ?? 'rank',
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
    choices: { [opts.ref]: opts.choices ?? choices },
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

describe('RankWidget', () => {
  it('renders definition-default order when unanswered', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/rank', dataType: 'selectMulti', value: null });
    await render(<RankWidget nodeRef={ref} store={store} />);
    const rows = screen.getAllByTestId(/^rank-option-/);
    expect(rows.map((r) => r.props.testID)).toEqual([
      'rank-option-a',
      'rank-option-b',
      'rank-option-c',
    ]);
  });

  it('renders committed order when answered', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/rank',
      dataType: 'selectMulti',
      value: ['c', 'a', 'b'],
    });
    await render(<RankWidget nodeRef={ref} store={store} />);
    const rows = screen.getAllByTestId(/^rank-option-/);
    expect(rows.map((r) => r.props.testID)).toEqual([
      'rank-option-c',
      'rank-option-a',
      'rank-option-b',
    ]);
  });

  it('does not call answerQuestion on mount when unanswered', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/rank', dataType: 'selectMulti', value: null });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<RankWidget nodeRef={ref} store={store} />);
    expect(spy).not.toHaveBeenCalled();
  });

  it('moving an item down commits the new full ordered array', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/rank', dataType: 'selectMulti', value: null });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<RankWidget nodeRef={ref} store={store} />);
    fireEvent.press(screen.getByTestId('rank-down-a'));
    expect(spy).toHaveBeenCalledWith(ref, ['b', 'a', 'c']);
  });

  it('moving an item up commits the new full ordered array', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/rank',
      dataType: 'selectMulti',
      value: ['a', 'b', 'c'],
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<RankWidget nodeRef={ref} store={store} />);
    fireEvent.press(screen.getByTestId('rank-up-b'));
    expect(spy).toHaveBeenCalledWith(ref, ['b', 'a', 'c']);
  });

  it('first item up button is disabled and a no-op', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/rank', dataType: 'selectMulti', value: null });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<RankWidget nodeRef={ref} store={store} />);
    const upBtn = screen.getByTestId('rank-up-a');
    expect(upBtn.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(upBtn);
    expect(spy).not.toHaveBeenCalled();
  });

  it('last item down button is disabled and a no-op', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/rank', dataType: 'selectMulti', value: null });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<RankWidget nodeRef={ref} store={store} />);
    const downBtn = screen.getByTestId('rank-down-c');
    expect(downBtn.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(downBtn);
    expect(spy).not.toHaveBeenCalled();
  });

  it('readonly disables all reorder controls', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/rank',
      dataType: 'selectMulti',
      value: null,
      readonly: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<RankWidget nodeRef={ref} store={store} />);
    const upButtons = screen.getAllByTestId(/^rank-up-/);
    const downButtons = screen.getAllByTestId(/^rank-down-/);
    for (const btn of [...upButtons, ...downButtons]) {
      expect(btn.props.accessibilityState.disabled).toBe(true);
    }
    fireEvent.press(screen.getByTestId('rank-down-a'));
    expect(spy).not.toHaveBeenCalled();
  });
});
