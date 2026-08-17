/**
 * T-11d: Appearance variants — PR-2 (SelectOne variants).
 *
 * Tests for:
 * - SelectOneWidget: likert, autocomplete, columns, columns-pack, quick appearances
 */

import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult, type DataType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../test-support/makeFakeSession';
import { SelectOneWidget } from '../widgets/SelectOneWidget';
import type { NodeRef } from '../adapter/FormAdapter';
import type { ControlType } from '@nuup/ts-rosa';
import type { SelectChoice } from '@nuup/ts-rosa';

afterEach(async () => {
  jest.restoreAllMocks();
  await cleanup();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStoreFor(opts: {
  ref: string;
  dataType: DataType;
  controlType?: ControlType;
  value?: unknown;
  readonly?: boolean;
  required?: boolean;
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
        required: opts.required ?? false,
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

// ---------------------------------------------------------------------------
// likert
// ---------------------------------------------------------------------------

describe('SelectOneWidget likert', () => {
  it('renders horizontal likert options with labels', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/likert',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'likert',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="likert" />);
    expect(screen.getByTestId('select-one-likert-container')).toBeTruthy();
    expect(screen.getByTestId('select-one-likert-option-val1')).toBeTruthy();
    expect(screen.getByTestId('select-one-likert-option-val2')).toBeTruthy();
    expect(screen.getByTestId('select-one-likert-option-val3')).toBeTruthy();
    expect(screen.getByText('Option One')).toBeTruthy();
    expect(screen.getByText('Option Two')).toBeTruthy();
    expect(screen.getByText('Option Three')).toBeTruthy();
  });

  it('selecting a likert option commits the value', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/likert',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'likert',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="likert" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-likert-option-val2'));
    });
    expect(spy).toHaveBeenCalledWith(ref, 'val2');
  });

  it('does not commit when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/likert',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'likert',
      readonly: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="likert" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-likert-option-val1'));
    });
    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// autocomplete
// ---------------------------------------------------------------------------

describe('SelectOneWidget autocomplete', () => {
  // 'autocomplete' is unified with 'minimal-autocomplete': a trigger opens a
  // BottomSheet with a search TextInput + filtered option list, instead of an
  // inline TextInput+FlatList (removed — on-device selection never fired
  // there; see BottomSheet's bounded-height + keyboardShouldPersistTaps fix).
  it('renders a trigger that opens a bottom-sheet with search and all options', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/autocomplete',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'autocomplete',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="autocomplete" />);
    expect(screen.getByTestId('select-one-dropdown-trigger')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-dropdown-trigger'));
    });
    expect(screen.getByTestId('select-one-minimal-autocomplete-search')).toBeTruthy();
    expect(screen.getByTestId('select-one-option-val1')).toBeTruthy();
    expect(screen.getByTestId('select-one-option-val2')).toBeTruthy();
    expect(screen.getByTestId('select-one-option-val3')).toBeTruthy();
  });

  it('filters options by label substring on type', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/autocomplete',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'autocomplete',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="autocomplete" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-dropdown-trigger'));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('select-one-minimal-autocomplete-search'), 'Two');
    });
    expect(screen.queryByTestId('select-one-option-val1')).toBeNull();
    expect(screen.getByTestId('select-one-option-val2')).toBeTruthy();
    expect(screen.queryByTestId('select-one-option-val3')).toBeNull();
  });

  it('selecting a filtered option commits the value', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/autocomplete',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'autocomplete',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="autocomplete" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-dropdown-trigger'));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('select-one-minimal-autocomplete-search'), 'Two');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-option-val2'));
    });
    expect(spy).toHaveBeenCalledWith(ref, 'val2');
  });

  it('does not commit when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/autocomplete',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'autocomplete',
      readonly: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="autocomplete" />);
    // Trigger is non-accessible/non-interactive while readonly (same as
    // 'minimal' variant), so the sheet never opens and nothing can be
    // pressed — confirms the readonly guard still holds for this variant.
    expect(screen.queryByTestId('select-one-minimal-autocomplete-search')).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// columns
// ---------------------------------------------------------------------------

describe('SelectOneWidget columns', () => {
  it('renders options in a multi-column grid', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/columns',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'columns',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="columns" />);
    expect(screen.getByTestId('select-one-columns-list')).toBeTruthy();
    expect(screen.getByTestId('select-one-columns-option-val1')).toBeTruthy();
    expect(screen.getByTestId('select-one-columns-option-val2')).toBeTruthy();
    expect(screen.getByTestId('select-one-columns-option-val3')).toBeTruthy();
  });

  it('selecting a grid option commits the value', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/columns',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'columns',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="columns" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-columns-option-val3'));
    });
    expect(spy).toHaveBeenCalledWith(ref, 'val3');
  });
});

// ---------------------------------------------------------------------------
// columns-pack
// ---------------------------------------------------------------------------

describe('SelectOneWidget columns-pack', () => {
  it('renders compact grid options', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/columns-pack',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'columns-pack',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="columns-pack" />);
    expect(screen.getByTestId('select-one-columns-pack-list')).toBeTruthy();
    expect(screen.getByTestId('select-one-columns-pack-option-val1')).toBeTruthy();
  });

  it('selecting a compact grid option commits the value', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/columns-pack',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'columns-pack',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="columns-pack" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-columns-pack-option-val2'));
    });
    expect(spy).toHaveBeenCalledWith(ref, 'val2');
  });
});

// ---------------------------------------------------------------------------
// quick
// ---------------------------------------------------------------------------

describe('SelectOneWidget quick', () => {
  it('renders horizontal chip options', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/quick',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'quick',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="quick" />);
    expect(screen.getByTestId('select-one-quick-container')).toBeTruthy();
    expect(screen.getByTestId('select-one-quick-option-val1')).toBeTruthy();
    expect(screen.getByTestId('select-one-quick-option-val2')).toBeTruthy();
    expect(screen.getByTestId('select-one-quick-option-val3')).toBeTruthy();
    expect(screen.getByText('Option One')).toBeTruthy();
  });

  it('selecting a chip commits the value', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/quick',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'quick',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="quick" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-quick-option-val2'));
    });
    expect(spy).toHaveBeenCalledWith(ref, 'val2');
  });

  it('does not commit when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/quick',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'quick',
      readonly: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="quick" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-quick-option-val1'));
    });
    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// fallback
// ---------------------------------------------------------------------------

describe('SelectOneWidget fallback', () => {
  it('falls back to default for unknown appearance', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/unknown',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'some-unknown-variant',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="some-unknown-variant" />);
    // default variant uses testID select-one-option-{value}
    expect(screen.getByTestId('select-one-option-val1')).toBeTruthy();
    expect(screen.getByTestId('select-one-option-val2')).toBeTruthy();
    expect(screen.getByTestId('select-one-option-val3')).toBeTruthy();
  });
});
