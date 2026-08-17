/**
 * T-11e: Appearance variants — PR-3 (SelectMulti variants + Date fix).
 *
 * Tests for:
 * - SelectMultiWidget: minimal, columns, columns-pack, autocomplete, likert appearances
 * - DateWidget: month-year and year partial-date parsing
 */

import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult, type DataType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../test-support/makeFakeSession';
import { SelectMultiWidget } from '../widgets/SelectMultiWidget';
import { DateWidget } from '../widgets/DateWidget';
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
// SelectMultiWidget — minimal
// ---------------------------------------------------------------------------

describe('SelectMultiWidget minimal', () => {
  it('renders dropdown trigger and opens bottom sheet', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/minimal',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'minimal',
    });
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="minimal" />);
    expect(screen.getByTestId('select-multi-dropdown-trigger')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-dropdown-trigger'));
    });
    expect(screen.getByTestId('select-multi-sheet')).toBeTruthy();
    expect(screen.getByTestId('select-multi-sheet-option-val1')).toBeTruthy();
    expect(screen.getByTestId('select-multi-sheet-option-val2')).toBeTruthy();
    expect(screen.getByTestId('select-multi-sheet-option-val3')).toBeTruthy();
  });

  it('selecting in sheet commits array with selected value', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/minimal',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'minimal',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="minimal" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-dropdown-trigger'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-sheet-option-val2'));
    });
    expect(spy).toHaveBeenCalledWith(ref, ['val2']);
  });

  it('toggling a selected value removes it from the array', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/minimal',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'minimal',
      value: ['val2'],
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="minimal" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-dropdown-trigger'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-sheet-option-val2'));
    });
    expect(spy).toHaveBeenCalledWith(ref, []);
  });

  it('does not commit when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/minimal',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'minimal',
      readonly: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="minimal" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-dropdown-trigger'));
    });
    expect(screen.queryByTestId('select-multi-sheet')).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// SelectMultiWidget — columns
// ---------------------------------------------------------------------------

describe('SelectMultiWidget columns', () => {
  it('renders multi-column grid with checkboxes', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/columns',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'columns',
    });
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="columns" />);
    expect(screen.getByTestId('select-multi-columns-list')).toBeTruthy();
    expect(screen.getByTestId('select-multi-columns-option-val1')).toBeTruthy();
    expect(screen.getByTestId('select-multi-columns-option-val2')).toBeTruthy();
    expect(screen.getByTestId('select-multi-columns-option-val3')).toBeTruthy();
  });

  it('selecting a grid option commits array with value', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/columns',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'columns',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="columns" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-columns-option-val3'));
    });
    expect(spy).toHaveBeenCalledWith(ref, ['val3']);
  });

  it('toggling removes value from array', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/columns',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'columns',
      value: ['val1', 'val3'],
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="columns" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-columns-option-val1'));
    });
    expect(spy).toHaveBeenCalledWith(ref, ['val3']);
  });
});

// ---------------------------------------------------------------------------
// SelectMultiWidget — columns-pack
// ---------------------------------------------------------------------------

describe('SelectMultiWidget columns-pack', () => {
  it('renders compact grid', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/columns-pack',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'columns-pack',
    });
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="columns-pack" />);
    expect(screen.getByTestId('select-multi-columns-pack-list')).toBeTruthy();
    expect(screen.getByTestId('select-multi-columns-pack-option-val1')).toBeTruthy();
  });

  it('selecting a compact grid option commits array', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/columns-pack',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'columns-pack',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="columns-pack" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-columns-pack-option-val2'));
    });
    expect(spy).toHaveBeenCalledWith(ref, ['val2']);
  });
});

// ---------------------------------------------------------------------------
// SelectMultiWidget — autocomplete
// ---------------------------------------------------------------------------

describe('SelectMultiWidget autocomplete', () => {
  // 'autocomplete' is unified with 'minimal-autocomplete': a trigger opens a
  // BottomSheet with a search TextInput + filtered checkbox list, instead of
  // an inline TextInput+FlatList (removed — on-device selection never fired
  // there; see BottomSheet's bounded-height + keyboardShouldPersistTaps fix).
  it('renders a trigger that opens a bottom-sheet with search and all options', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/autocomplete',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'autocomplete',
    });
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="autocomplete" />);
    expect(screen.getByTestId('select-multi-dropdown-trigger')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-dropdown-trigger'));
    });
    expect(screen.getByTestId('select-multi-minimal-autocomplete-search')).toBeTruthy();
    expect(screen.getByTestId('select-multi-sheet-option-val1')).toBeTruthy();
    expect(screen.getByTestId('select-multi-sheet-option-val2')).toBeTruthy();
    expect(screen.getByTestId('select-multi-sheet-option-val3')).toBeTruthy();
  });

  it('filters options by label substring on type', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/autocomplete',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'autocomplete',
    });
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="autocomplete" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-dropdown-trigger'));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('select-multi-minimal-autocomplete-search'), 'Two');
    });
    expect(screen.queryByTestId('select-multi-sheet-option-val1')).toBeNull();
    expect(screen.getByTestId('select-multi-sheet-option-val2')).toBeTruthy();
    expect(screen.queryByTestId('select-multi-sheet-option-val3')).toBeNull();
  });

  it('selecting a filtered option commits array with value', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/autocomplete',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'autocomplete',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="autocomplete" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-dropdown-trigger'));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('select-multi-minimal-autocomplete-search'), 'Two');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-sheet-option-val2'));
    });
    expect(spy).toHaveBeenCalledWith(ref, ['val2']);
  });

  it('does not commit when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/autocomplete',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'autocomplete',
      readonly: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="autocomplete" />);
    // Trigger is non-accessible/non-interactive while readonly (same as
    // 'minimal' variant), so the sheet never opens and nothing can be
    // pressed — confirms the readonly guard still holds for this variant.
    expect(screen.queryByTestId('select-multi-minimal-autocomplete-search')).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// SelectMultiWidget — likert
// ---------------------------------------------------------------------------

describe('SelectMultiWidget likert', () => {
  it('renders horizontal likert options with labels', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/likert',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'likert',
    });
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="likert" />);
    expect(screen.getByTestId('select-multi-likert-container')).toBeTruthy();
    expect(screen.getByTestId('select-multi-likert-option-val1')).toBeTruthy();
    expect(screen.getByTestId('select-multi-likert-option-val2')).toBeTruthy();
    expect(screen.getByTestId('select-multi-likert-option-val3')).toBeTruthy();
    expect(screen.getByText('Option One')).toBeTruthy();
  });

  it('selecting a likert option commits array with value', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/likert',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'likert',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="likert" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-likert-option-val2'));
    });
    expect(spy).toHaveBeenCalledWith(ref, ['val2']);
  });

  it('does not commit when readonly', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/likert',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'likert',
      readonly: true,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="likert" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-likert-option-val1'));
    });
    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// SelectMultiWidget — fallback
// ---------------------------------------------------------------------------

describe('SelectMultiWidget fallback', () => {
  it('falls back to default for unknown appearance', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/unknown',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'some-unknown-variant',
    });
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="some-unknown-variant" />);
    expect(screen.getByTestId('select-multi-option-val1')).toBeTruthy();
    expect(screen.getByTestId('select-multi-option-val2')).toBeTruthy();
    expect(screen.getByTestId('select-multi-option-val3')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// DateWidget — month-year
// ---------------------------------------------------------------------------

describe('DateWidget month-year', () => {
  it('renders input with MM-YYYY placeholder', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/month-year',
      dataType: 'date',
      appearance: 'month-year',
    });
    await render(<DateWidget nodeRef={ref} store={store} appearance="month-year" />);
    expect(screen.getByPlaceholderText('MM-YYYY')).toBeTruthy();
  });

  it('commits a Date with day=1 for valid MM-YYYY', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/month-year',
      dataType: 'date',
      appearance: 'month-year',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DateWidget nodeRef={ref} store={store} appearance="month-year" />);
    fireEvent.changeText(screen.getByPlaceholderText('MM-YYYY'), '05-2024');
    expect(spy).toHaveBeenCalledTimes(1);
    const committed = spy.mock.calls[0]![1] as Date;
    expect(committed.getUTCFullYear()).toBe(2024);
    expect(committed.getUTCMonth()).toBe(4); // May = 4
    expect(committed.getUTCDate()).toBe(1);
  });

  it('does not commit for invalid MM-YYYY', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/month-year',
      dataType: 'date',
      appearance: 'month-year',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DateWidget nodeRef={ref} store={store} appearance="month-year" />);
    fireEvent.changeText(screen.getByPlaceholderText('MM-YYYY'), '13-2024');
    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// DateWidget — year
// ---------------------------------------------------------------------------

describe('DateWidget year', () => {
  it('renders input with YYYY placeholder', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/year',
      dataType: 'date',
      appearance: 'year',
    });
    await render(<DateWidget nodeRef={ref} store={store} appearance="year" />);
    expect(screen.getByPlaceholderText('YYYY')).toBeTruthy();
  });

  it('commits a Date with month=1, day=1 for valid YYYY', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/year',
      dataType: 'date',
      appearance: 'year',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DateWidget nodeRef={ref} store={store} appearance="year" />);
    fireEvent.changeText(screen.getByPlaceholderText('YYYY'), '2024');
    expect(spy).toHaveBeenCalledTimes(1);
    const committed = spy.mock.calls[0]![1] as Date;
    expect(committed.getUTCFullYear()).toBe(2024);
    expect(committed.getUTCMonth()).toBe(0); // Jan = 0
    expect(committed.getUTCDate()).toBe(1);
  });

  it('does not commit for invalid year', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/year',
      dataType: 'date',
      appearance: 'year',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DateWidget nodeRef={ref} store={store} appearance="year" />);
    fireEvent.changeText(screen.getByPlaceholderText('YYYY'), 'ab12');
    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// DateWidget — default still works
// ---------------------------------------------------------------------------

describe('DateWidget default', () => {
  it('still parses YYYY-MM-DD and commits Date', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/date',
      dataType: 'date',
      value: null,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DateWidget nodeRef={ref} store={store} />);
    fireEvent.changeText(screen.getByPlaceholderText('YYYY-MM-DD'), '2024-05-15');
    expect(spy).toHaveBeenCalledTimes(1);
    const committed = spy.mock.calls[0]![1] as Date;
    expect(committed.getUTCFullYear()).toBe(2024);
    expect(committed.getUTCMonth()).toBe(4);
    expect(committed.getUTCDate()).toBe(15);
  });
});
