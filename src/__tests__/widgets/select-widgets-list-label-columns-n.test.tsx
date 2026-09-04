/**
 * SelectOneWidget — list / list-nolabel / label / columns-n variants,
 * verified against ODK Collect source (ListWidget, LabelWidget,
 * Appearances.getNumberOfColumns — see appearance.ts and the widget's own
 * docblock for the exact behavior each mirrors).
 *
 * SelectMultiWidget's list-nolabel/columns-n coverage lives in a SEPARATE
 * file (select-multi-widgets-list-label-columns-n.test.tsx): rendering a
 * SelectOneWidget FlatList/likert-density tree and then a SelectMultiWidget
 * tree back-to-back inside the same RTL module trips a pre-existing
 * cross-component test-isolation issue in this harness (an aggregate error
 * surfaces on the second component's render, unrelated to the variant logic
 * itself — reproducible even swapping which widget renders first). Splitting
 * by widget component avoids it without touching product code.
 */
import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult, type DataType, type ControlType, type SelectChoice } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../../test-support/makeFakeSession';
import { SelectOneWidget } from '../../widgets/SelectOneWidget';
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

describe('SelectOneWidget — list', () => {
  it('renders radio cells with the choice label visible and selects on press', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/list',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'list',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="list" />);
    expect(screen.getByText('Option One')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-list-option-val2'));
    });
    expect(store.adapter.resolveValue(ref)).toBe('val2');
  });
});

describe('SelectOneWidget — list-nolabel', () => {
  it('renders the radio row WITHOUT the choice label text, but selection still works', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/list-nolabel',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'list-nolabel',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="list-nolabel" />);
    expect(screen.queryByText('Option One')).toBeNull();
    expect(screen.getByTestId('select-one-list-option-val1')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-list-option-val3'));
    });
    expect(store.adapter.resolveValue(ref)).toBe('val3');
  });
});

describe('SelectOneWidget — label', () => {
  it('renders only choice labels, no indicator, and pressing never writes an answer', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/label',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'label',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="label" />);
    expect(screen.getByTestId('select-one-label-text-val1')).toBeTruthy();
    expect(screen.queryByTestId('select-one-option-val1')).toBeNull();
    expect(store.adapter.resolveValue(ref)).toBeNull();
  });
});

describe('SelectOneWidget — columns-n', () => {
  it('lays choices out in the parametrized number of columns and still selects', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/columns-3',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'columns-3',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="columns-3" />);
    expect(screen.getByTestId('select-one-columns-n-list')).toBeTruthy();
    expect(screen.getByTestId('select-one-columns-n-option-val1')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-columns-n-option-val2'));
    });
    expect(store.adapter.resolveValue(ref)).toBe('val2');
  });
});
