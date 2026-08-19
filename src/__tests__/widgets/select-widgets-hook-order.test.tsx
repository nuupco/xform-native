/**
 * Hook-order stability for SelectOneWidget / SelectMultiWidget.
 *
 * REQ: Unconditional Hook Ordering in Select Widgets — useMemo (autocomplete
 * branch) must be called unconditionally, before any variant-based branching,
 * so re-rendering the same instance with a different `variant` (appearance)
 * never changes the number/order of hooks invoked.
 */
import { render, cleanup } from '@testing-library/react-native';
import { AnswerResult, type DataType, type SelectChoice, type ControlType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../../test-support/makeFakeSession';
import { SelectOneWidget } from '../../widgets/SelectOneWidget';
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

const choices: SelectChoice[] = [
  { value: 'val1', label: 'Option One' },
  { value: 'val2', label: 'Option Two' },
];

describe('SelectOneWidget — hook order stable across variant switch', () => {
  it('re-rendering the same instance from minimal to autocomplete does not throw a hook-order error', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/s1',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
    });
    const { rerender } = await render(
      <SelectOneWidget nodeRef={ref} store={store} appearance="minimal" />,
    );
    expect(() => {
      rerender(<SelectOneWidget nodeRef={ref} store={store} appearance="autocomplete" />);
    }).not.toThrow();
  });
});

describe('SelectMultiWidget — hook order stable across variant switch', () => {
  it('re-rendering the same instance from minimal to autocomplete does not throw a hook-order error', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/m1',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      value: [],
    });
    const { rerender } = await render(
      <SelectMultiWidget nodeRef={ref} store={store} appearance="minimal" />,
    );
    expect(() => {
      rerender(<SelectMultiWidget nodeRef={ref} store={store} appearance="autocomplete" />);
    }).not.toThrow();
  });
});
