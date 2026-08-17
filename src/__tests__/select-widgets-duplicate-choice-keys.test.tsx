/**
 * Duplicate-value choice resilience for SelectOneWidget / SelectMultiWidget.
 *
 * REQ: React key uniqueness must not depend on `choice.value` uniqueness.
 * ts-rosa's SelectChoice list is built from real secondary-instance (CSV) rows
 * and the XForm spec never guarantees a unique `name`/value column. Curated
 * field data can legitimately contain duplicate values (e.g. two rows with
 * name="1121"). Using `key={choice.value}` collapses React's reconciliation
 * of same-keyed siblings, so a duplicate value must still render as TWO
 * distinct elements in the tree, not one.
 */
import { act } from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult, type DataType, type SelectChoice, type ControlType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../test-support/makeFakeSession';
import { SelectOneWidget } from '../widgets/SelectOneWidget';
import { SelectMultiWidget } from '../widgets/SelectMultiWidget';
import type { NodeRef } from '../adapter/FormAdapter';

let errorSpy: jest.SpyInstance;

beforeEach(() => {
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
  jest.restoreAllMocks();
  await cleanup();
});

// Asserts React never logged its "two children with the same key" warning —
// that warning is the signal that reconciliation may silently duplicate or
// omit siblings, which is the actual production bug (not merely cosmetic).
function expectNoDuplicateKeyWarning() {
  const duplicateKeyWarnings = errorSpy.mock.calls.filter((args) =>
    String(args[0]).includes('same key'),
  );
  expect(duplicateKeyWarnings).toHaveLength(0);
}

function makeStoreFor(opts: {
  ref: string;
  dataType: DataType;
  controlType?: ControlType;
  value?: unknown;
  choices?: readonly SelectChoice[];
}): { store: FormSessionStore; ref: NodeRef } {
  const script: FakeSessionScript = {
    events: [
      { kind: 'bof' },
      {
        kind: 'question',
        ref: opts.ref,
        dataType: opts.dataType,
        controlType: opts.controlType ?? 'select1',
        label: 'Test field',
        hint: null,
        appearance: null,
      },
      { kind: 'eof' },
    ],
    nodeStates: {
      [opts.ref]: {
        readonly: false,
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

// Simulates a secondary-instance (CSV) select_one_from_file with a duplicate
// value in the id/name column — plausible with hand-curated field data.
const duplicateChoices: SelectChoice[] = [
  { value: '1121', label: 'Encuestador A' },
  { value: '1121', label: 'Encuestador B' },
  { value: '1122', label: 'Encuestador C' },
];

describe('SelectOneWidget — duplicate choice values render without collapsing', () => {
  it('default variant renders all choices, including both duplicates by value', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/s1',
      dataType: 'selectOne',
      controlType: 'select1',
      choices: duplicateChoices,
    });
    const { getAllByTestId } = await render(
      <SelectOneWidget nodeRef={ref} store={store} appearance={null} />,
    );
    expect(getAllByTestId('select-one-option-1121')).toHaveLength(2);
    expect(getAllByTestId('select-one-option-1122')).toHaveLength(1);
    expectNoDuplicateKeyWarning();
  });

  it('autocomplete variant (unified bottom-sheet) renders all choices, including both duplicates', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/s3',
      dataType: 'selectOne',
      controlType: 'select1',
      choices: duplicateChoices,
    });
    const { getAllByTestId, getByTestId } = await render(
      <SelectOneWidget nodeRef={ref} store={store} appearance="autocomplete" />,
    );
    await act(async () => {
      fireEvent.press(getByTestId('select-one-dropdown-trigger'));
    });
    expect(getAllByTestId('select-one-option-1121')).toHaveLength(2);
    expectNoDuplicateKeyWarning();
  });
});

describe('SelectMultiWidget — duplicate choice values render without collapsing', () => {
  it('default variant renders all choices, including both duplicates by value', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/m1',
      dataType: 'selectMulti',
      controlType: 'select',
      choices: duplicateChoices,
      value: [],
    });
    const { getAllByTestId } = await render(
      <SelectMultiWidget nodeRef={ref} store={store} appearance={null} />,
    );
    expect(getAllByTestId('select-multi-option-1121')).toHaveLength(2);
    expect(getAllByTestId('select-multi-option-1122')).toHaveLength(1);
    expectNoDuplicateKeyWarning();
  });

  it('autocomplete variant (unified bottom-sheet) renders all choices, including both duplicates', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/m2',
      dataType: 'selectMulti',
      controlType: 'select',
      choices: duplicateChoices,
      value: [],
    });
    const { getAllByTestId, getByTestId } = await render(
      <SelectMultiWidget nodeRef={ref} store={store} appearance="autocomplete" />,
    );
    await act(async () => {
      fireEvent.press(getByTestId('select-multi-dropdown-trigger'));
    });
    expect(getAllByTestId('select-multi-sheet-option-1121')).toHaveLength(2);
    expectNoDuplicateKeyWarning();
  });
});
