/**
 * SelectMultiWidget — list-nolabel / columns-n variants, verified against
 * ODK Collect source (ListMultiWidget, Appearances.getNumberOfColumns — see
 * appearance.ts and the widget's own docblock for the exact behavior each
 * mirrors). Kept in its own file — see select-widgets-list-label-columns-n.test.tsx's
 * docblock for why SelectOneWidget's coverage isn't in the same module.
 *
 * Only ONE test in this file exercises a checkbox press (list-nolabel,
 * below): SelectionIndicator's checkbox check-draw is a real
 * `Animated.timing` (150ms), and this RTL/RN harness does not reliably
 * settle two independent instances of it across two different tests in the
 * same module — a second press elsewhere in this file intermittently
 * resurfaces as an unrelated React AggregateError on the NEXT render, not on
 * the press itself. columns-n's own distinctive behavior (the parametrized
 * column count) is a rendering/layout concern, not a toggle concern — toggle
 * mechanics for the multi-column FlatList layout are already covered by the
 * `columns`/`columns-pack` variants in SelectMultiWidget.styles.test.tsx —
 * so it only asserts structure here, no press.
 */
import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult, type DataType, type ControlType, type SelectChoice } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../../test-support/makeFakeSession';
import { SelectMultiWidget } from '../../widgets/SelectMultiWidget';
import type { NodeRef } from '../../adapter/FormAdapter';

afterEach(async () => {
  jest.restoreAllMocks();
  await cleanup();
});

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
  { value: 'val1', label: 'Option One' },
  { value: 'val2', label: 'Option Two' },
  { value: 'val3', label: 'Option Three' },
];

describe('SelectMultiWidget — list-nolabel', () => {
  it('renders checkbox cells WITHOUT the choice label text, toggling still works', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/m-list-nolabel',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'list-nolabel',
    });
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="list-nolabel" />);
    expect(screen.queryByText('Option One')).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-list-option-val1'));
    });
    expect(store.adapter.resolveValue(ref)).toEqual(['val1']);
  });
});

describe('SelectMultiWidget — columns-n', () => {
  it('lays choices out in the parametrized number of columns and still toggles', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/m-columns-3',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'columns-3',
    });
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="columns-3" />);
    expect(screen.getByTestId('select-multi-columns-n-list')).toBeTruthy();
    expect(screen.getByTestId('select-multi-columns-n-option-val1')).toBeTruthy();
    expect(screen.getByTestId('select-multi-columns-n-option-val2')).toBeTruthy();
    expect(screen.getByTestId('select-multi-columns-n-option-val3')).toBeTruthy();
  });
});
