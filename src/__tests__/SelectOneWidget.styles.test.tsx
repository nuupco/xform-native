/**
 * SelectOneWidget — restyle tests (Phase 3 PR6).
 *
 * Verifies each of the 7 appearance-variant render branches dispatches via
 * `resolveVariant` unchanged AND renders its rows through the shared
 * `SelectionRow`/`SelectionIndicator` primitives (radio shape), plus the
 * search variant's filled pill search bar with the magnifying-glass icon.
 * Existing behavioral/value-binding tests are NOT modified — this file adds
 * new, additive coverage only.
 */
import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult, type DataType, type ControlType, type SelectChoice } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../test-support/makeFakeSession';
import { SelectOneWidget } from '../widgets/SelectOneWidget';
import { tokens } from '../tokens/tokens';
import type { NodeRef } from '../adapter/FormAdapter';

afterEach(async () => {
  jest.restoreAllMocks();
  await cleanup();
});

function flatten(style: unknown) {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]));
}

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

describe('SelectOneWidget — restyle (SelectionRow radio, all 7 variants)', () => {
  it('default variant: row renders via SelectionIndicator (radio) and tints when selected', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/default',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      value: 'val2',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance={null} />);
    const selectedRow = screen.getByTestId('select-one-option-val2');
    expect(flatten(selectedRow.props.style).backgroundColor).toBe(
      `${tokens.color.roles.primaryContainer}66`,
    );
    const unselectedRow = screen.getByTestId('select-one-option-val1');
    expect(flatten(unselectedRow.props.style).backgroundColor).toBeUndefined();
  });

  it('minimal variant: bottom-sheet options render via SelectionRow', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/minimal',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      value: 'val1',
      appearance: 'minimal',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="minimal" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-dropdown-trigger'));
    });
    const row = screen.getByTestId('select-one-option-val1');
    expect(flatten(row.props.style).backgroundColor).toBe(
      `${tokens.color.roles.primaryContainer}66`,
    );
  });

  it('search (autocomplete) variant: shows a filled pill search bar with the search icon', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/search',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'search',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="search" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-dropdown-trigger'));
    });
    expect(screen.getByTestId('select-one-search-icon')).toBeTruthy();
    const searchInput = screen.getByTestId('select-one-minimal-autocomplete-search');
    expect(flatten(searchInput.props.style).borderRadius).toBe(tokens.radius.pill);
  });

  it('search variant filtering is unaffected (only visual chrome changed)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/search2',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'search',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="search" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-dropdown-trigger'));
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('select-one-minimal-autocomplete-search'),
        'Two',
      );
    });
    expect(screen.queryByTestId('select-one-option-val1')).toBeNull();
    expect(screen.getByTestId('select-one-option-val2')).toBeTruthy();
    expect(screen.queryByTestId('select-one-option-val3')).toBeNull();
  });

  it('likert variant: cells use SelectionRow density="likert" (compact, non-stretched)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/likert',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      value: 'val3',
      appearance: 'likert',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="likert" />);
    const cell = screen.getByTestId('select-one-likert-option-val3');
    const style = flatten(cell.props.style);
    expect(style.minHeight).toBe(48);
    expect(style.minWidth).toBe(64);
    expect(style.alignSelf).not.toBe('stretch');
  });

  it('columns variant: options render via SelectionRow (radio, default density)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/columns',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      value: 'val2',
      appearance: 'columns',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="columns" />);
    const row = screen.getByTestId('select-one-columns-option-val2');
    expect(flatten(row.props.style).backgroundColor).toBe(
      `${tokens.color.roles.primaryContainer}66`,
    );
  });

  it('columns-pack variant: options render via SelectionRow density="pack" (40dp)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/columns-pack',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'columns-pack',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="columns-pack" />);
    const row = screen.getByTestId('select-one-columns-pack-option-val1');
    expect(flatten(row.props.style).minHeight).toBe(40);
  });

  it('quick variant: still renders as a chip row (unchanged chrome, not a SelectionRow)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/quick',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      value: 'val1',
      appearance: 'quick',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="quick" />);
    expect(screen.getByTestId('select-one-quick-option-val1')).toBeTruthy();
  });

  it('Phase 8 PR3: quick chip renders bold markdown in the choice label', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/quick-md',
      dataType: 'selectOne',
      controlType: 'select1',
      choices: [{ value: 'val1', label: 'Opción **fuerte**' }],
      appearance: 'quick',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="quick" />);
    const boldNode = screen.getByText('fuerte');
    expect(flatten(boldNode.props.style).fontWeight).toBe('700');
  });

  it('Phase 8 PR3: minimal variant dropdown trigger strips markdown while the sheet row renders it styled', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/minimal-md',
      dataType: 'selectOne',
      controlType: 'select1',
      choices: [{ value: 'val1', label: '# Opción **A**' }],
      value: 'val1',
      appearance: 'minimal',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="minimal" />);
    expect(screen.getByText('Opción A')).toBeTruthy();
    expect(screen.queryByText(/[#*]/)).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-dropdown-trigger'));
    });
    const boldNode = screen.getByText('A');
    expect(flatten(boldNode.props.style).fontWeight).toBe('700');
  });
});
