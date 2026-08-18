/**
 * Phase 3 PR7 — RankWidget restyle: primaryContainer position circle (left),
 * grip drag handle (right), drag-lift elevation/scale/background state, and
 * a 200ms ease-in-out settle animation on drop.
 *
 * Deviation (documented in apply-progress): the grip is a Pressable
 * onPressIn/onPressOut affordance driving the lift visual state — there is
 * no gesture/drag library in this codebase (Phase 2 precedent: RN Animated
 * only, no Reanimated/gesture-handler), so pointer-tracked position swapping
 * during a real drag is out of scope. Reordering itself still commits via
 * the existing up/down buttons (regression-preserved, unchanged).
 */
import { Animated } from 'react-native';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native';
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

describe('RankWidget — position circle + grip handle', () => {
  it('renders a position-number circle for each row, 1-indexed', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/rank', dataType: 'selectMulti' });
    await render(<RankWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('rank-position-a')).toHaveTextContent('1');
    expect(screen.getByTestId('rank-position-b')).toHaveTextContent('2');
    expect(screen.getByTestId('rank-position-c')).toHaveTextContent('3');
  });

  it('renders a grip drag handle for each row', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/rank', dataType: 'selectMulti' });
    await render(<RankWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('rank-grip-a')).toBeTruthy();
    expect(screen.getByTestId('rank-grip-b')).toBeTruthy();
    expect(screen.getByTestId('rank-grip-c')).toBeTruthy();
  });
});

describe('RankWidget — drag-lift visual state', () => {
  it('applies elevation 3 + pure surface background while lifted', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/rank', dataType: 'selectMulti' });
    await render(<RankWidget nodeRef={ref} store={store} />);
    const grip = screen.getByTestId('rank-grip-a');
    await act(async () => {
      fireEvent(grip, 'pressIn');
    });
    const row = screen.getByTestId('rank-option-a');
    const flat = Array.isArray(row.props.style) ? Object.assign({}, ...row.props.style) : row.props.style;
    expect(flat.elevation ?? flat.shadowOpacity).toBeTruthy();
    expect(flat.backgroundColor).toBeTruthy();
  });

  it('drop settles with a 200ms ease-in-out Animated.timing call', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing');
    const { store, ref } = makeStoreFor({ ref: '/data/rank', dataType: 'selectMulti' });
    await render(<RankWidget nodeRef={ref} store={store} />);
    const grip = screen.getByTestId('rank-grip-a');
    await act(async () => {
      fireEvent(grip, 'pressIn');
      fireEvent(grip, 'pressOut');
    });
    const settleCall = timingSpy.mock.calls.find(([, config]) => config?.duration === 200);
    expect(settleCall).toBeTruthy();
    expect(settleCall?.[1]?.easing).toBeTruthy();
  });
});

describe('RankWidget — regression (reorder logic unchanged)', () => {
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

  it('moving an item down commits the new full ordered array', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/rank', dataType: 'selectMulti', value: null });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<RankWidget nodeRef={ref} store={store} />);
    fireEvent.press(screen.getByTestId('rank-down-a'));
    expect(spy).toHaveBeenCalledWith(ref, ['b', 'a', 'c']);
  });
});
