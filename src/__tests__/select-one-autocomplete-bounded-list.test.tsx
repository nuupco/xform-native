/**
 * SelectOneWidget `autocomplete` variant — FlatList must have a bounded
 * height so it scrolls internally instead of expanding without limit.
 *
 * REQ hotfix: with 100+ choices and no ScrollView anywhere in the page
 * hierarchy (Form.tsx / FormViewerScreen.tsx), an unbounded FlatList pushed
 * the rest of the page (including the app header) off-screen. Fix: give the
 * FlatList a maxHeight in its style so it owns its own bounded scroll area.
 */
import { render, cleanup } from '@testing-library/react-native';
import { AnswerResult, type DataType, type SelectChoice, type ControlType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../test-support/makeFakeSession';
import { SelectOneWidget } from '../widgets/SelectOneWidget';
import type { NodeRef } from '../adapter/FormAdapter';

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

const choices: SelectChoice[] = Array.from({ length: 120 }, (_, i) => ({
  value: `val${i}`,
  label: `Option ${i}`,
}));

describe('SelectOneWidget — autocomplete variant bounded FlatList', () => {
  it('FlatList style defines a maxHeight so it does not grow without limit', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/s1',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
    });
    const { getByTestId } = await render(
      <SelectOneWidget nodeRef={ref} store={store} appearance="autocomplete" />,
    );
    const list = getByTestId('select-one-autocomplete-list');
    const flatStyle = Object.assign({}, ...[list.props.style].flat());
    expect(flatStyle.maxHeight).toBeDefined();
  });
});
