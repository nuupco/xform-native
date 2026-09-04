/**
 * select-multi-timed-grid — separate test file (not part of
 * appearance-gaps-closed.test.tsx) because it is the only widget test in
 * this repo that needs `jest.useFakeTimers()`. Sharing a file with
 * real-timer-dependent widgets (e.g. GeoPointWidget's placement-map, which
 * opens its map via a real Promise-scheduled effect) was observed to leak
 * fake-timer state into those later tests and break them, even with a
 * careful useFakeTimers/useRealTimers afterEach ordering — isolating the
 * whole describe block into its own file sidesteps that entirely.
 */
import { act } from 'react';
import { render, screen, cleanup } from '@testing-library/react-native';
import { AnswerResult, type DataType, type ControlType, type SelectChoice } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../../test-support/makeFakeSession';
import { SelectMultiWidget, timedGridValidatorOverride } from '../../widgets/SelectMultiWidget';
import type { NodeRef } from '../../adapter/FormAdapter';

function makeStoreFor(opts: {
  ref: string;
  dataType: DataType;
  controlType?: ControlType;
  value?: unknown;
  readonly?: boolean;
  choices?: readonly SelectChoice[];
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

const choices: SelectChoice[] = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];

describe('selectMulti/select/x-timed-grid', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(async () => {
    // Explicit unmount BEFORE switching timers back: an unflushed
    // interval/effect cleanup must run under the SAME fake-timer regime it
    // was created in, or it can leak real-timer state into later tests.
    await cleanup();
    jest.useRealTimers();
  });

  function makeTimedGridStore() {
    return makeStoreFor({
      ref: '/data/tg',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'x-timed-grid',
      value: [],
    });
  }

  it('renders a MM:SS countdown and the grid of choices', async () => {
    const { store, ref } = makeTimedGridStore();
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="x-timed-grid" />);
    expect(screen.getByTestId('select-multi-timed-grid-countdown').props.children).toBe('01:00');
    expect(screen.getByTestId('select-multi-timed-grid-list')).toBeTruthy();
    expect(screen.getByTestId('select-multi-timed-grid-option-a')).toBeTruthy();
  });

  it('counts down every second and disables selection once it reaches 0', async () => {
    const { store, ref } = makeTimedGridStore();
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="x-timed-grid" />);
    await act(async () => {
      jest.advanceTimersByTime(59_000);
    });
    expect(screen.getByTestId('select-multi-timed-grid-countdown').props.children).toBe('00:01');
    expect(
      screen.getByTestId('select-multi-timed-grid-option-a').props.accessibilityState.disabled,
    ).toBeFalsy();

    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });
    expect(screen.getByTestId('select-multi-timed-grid-countdown').props.children).toBe('00:00');
    expect(
      screen.getByTestId('select-multi-timed-grid-option-a').props.accessibilityState.disabled,
    ).toBe(true);
  });

  it('timedGridValidatorOverride blocks stepForward while the countdown runs, and clears once it finishes', async () => {
    const { store, ref } = makeTimedGridStore();
    const { unmount } = await render(
      <SelectMultiWidget nodeRef={ref} store={store} appearance="x-timed-grid" />,
    );

    const event = {
      kind: 'question' as const,
      ref,
      dataType: 'selectMulti' as const,
      controlType: 'select' as const,
      appearance: 'x-timed-grid',
      label: 'Test field',
      hint: null,
      index: 0,
      rangeBounds: null,
      mediatype: null,
    };
    const ctx = {
      nodeRef: ref,
      store,
      event,
      defaultValidate: () => null,
    };

    expect(timedGridValidatorOverride.validate(ctx)?.type).toBe('x-timed-grid-running');

    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(timedGridValidatorOverride.validate(ctx)).toBeNull();

    unmount();
  });

  it('clears the running flag on unmount too (so it never blocks navigation forever)', async () => {
    const { store, ref } = makeTimedGridStore();
    const { unmount } = await render(
      <SelectMultiWidget nodeRef={ref} store={store} appearance="x-timed-grid" />,
    );
    const event = {
      kind: 'question' as const,
      ref,
      dataType: 'selectMulti' as const,
      controlType: 'select' as const,
      appearance: 'x-timed-grid',
      label: 'Test field',
      hint: null,
      index: 0,
      rangeBounds: null,
      mediatype: null,
    };
    const ctx = { nodeRef: ref, store, event, defaultValidate: () => null };

    expect(timedGridValidatorOverride.validate(ctx)?.type).toBe('x-timed-grid-running');
    act(() => {
      unmount();
    });
    expect(timedGridValidatorOverride.validate(ctx)).toBeNull();
  });
});
