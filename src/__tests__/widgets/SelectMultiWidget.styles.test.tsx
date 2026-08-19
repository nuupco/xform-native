/**
 * Phase 3 PR7 — SelectMultiWidget restyle: SelectionRow (checkbox) +
 * "N seleccionadas" counter (spec: SelectMulti Widget requirement).
 */
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native';
import { AnswerResult, type DataType, type ControlType, type SelectChoice } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../../test-support/makeFakeSession';
import { SelectMultiWidget } from '../../widgets/SelectMultiWidget';
import type { NodeRef } from '../../adapter/FormAdapter';

afterEach(async () => {
  jest.clearAllMocks();
  await cleanup();
});

const choices: SelectChoice[] = [
  { value: 'val1', label: 'Option One' },
  { value: 'val2', label: 'Option Two' },
  { value: 'val3', label: 'Option Three' },
];

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
        controlType: opts.controlType ?? 'select',
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

describe('SelectMultiWidget — SelectionRow(checkbox) consumption', () => {
  it('default variant rows expose accessibilityRole="checkbox" (SelectionRow control)', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/default', dataType: 'selectMulti' });
    await render(<SelectMultiWidget nodeRef={ref} store={store} />);
    const row = screen.getByTestId('select-multi-option-val1');
    expect(row.props.accessibilityRole).toBe('checkbox');
  });

  it('columns variant rows expose accessibilityRole="checkbox"', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/columns',
      dataType: 'selectMulti',
      appearance: 'columns',
    });
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="columns" />);
    const row = screen.getByTestId('select-multi-columns-option-val1');
    expect(row.props.accessibilityRole).toBe('checkbox');
  });

  it('likert variant rows expose accessibilityRole="checkbox"', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/likert',
      dataType: 'selectMulti',
      appearance: 'likert',
    });
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="likert" />);
    const row = screen.getByTestId('select-multi-likert-option-val1');
    expect(row.props.accessibilityRole).toBe('checkbox');
  });
});

describe('SelectMultiWidget — "N seleccionadas" counter', () => {
  it('shows "0 seleccionadas" when nothing is selected', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/counter', dataType: 'selectMulti' });
    await render(<SelectMultiWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('select-multi-counter')).toHaveTextContent('0 seleccionadas');
  });

  it('shows "1 seleccionada" (singular) with one selection', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/counter1',
      dataType: 'selectMulti',
      value: ['val1'],
    });
    await render(<SelectMultiWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('select-multi-counter')).toHaveTextContent('1 seleccionada');
  });

  it('updates the counter after toggling a selection', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/counter2', dataType: 'selectMulti' });
    await render(<SelectMultiWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('select-multi-counter')).toHaveTextContent('0 seleccionadas');
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-option-val1'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-option-val2'));
    });
    expect(screen.getByTestId('select-multi-counter')).toHaveTextContent('2 seleccionadas');
  });
});

describe('SelectMultiWidget — Phase 8 PR3 markdown strip in joined minimal summary', () => {
  it('strips markdown from each selected label before joining into the collapsed summary', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/minimal-md',
      dataType: 'selectMulti',
      choices: [
        { value: 'val1', label: '**Rojo**' },
        { value: 'val2', label: '_Azul_' },
      ],
      value: ['val1', 'val2'],
      appearance: 'minimal',
    });
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="minimal" />);
    expect(screen.getByText('Rojo, Azul')).toBeTruthy();
    expect(screen.queryByText(/[*_]/)).toBeNull();
  });
});
