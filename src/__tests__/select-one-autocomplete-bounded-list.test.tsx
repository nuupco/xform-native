/**
 * SelectOneWidget `autocomplete` variant — unified with `minimal-autocomplete`
 * (trigger + BottomSheet with search TextInput + filtered option list).
 *
 * REQ hotfix history: the previous inline TextInput+FlatList implementation
 * of 'autocomplete' had bounded-height (FlatList maxHeight) and
 * keyboardShouldPersistTaps fixes applied, but selecting a result on-device
 * still didn't fire. Rather than keep debugging that inline path, 'autocomplete'
 * was unified to render the SAME BottomSheet-based implementation as
 * 'minimal-autocomplete' — already solid and confirmed on-device today
 * (bounded height via BottomSheet's own maxHeight + internal ScrollView,
 * keyboardShouldPersistTaps, KeyboardAvoidingView). These tests now assert
 * that bound + tap-persistence behavior through the shared BottomSheet.
 */
import { act } from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react-native';
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

describe('SelectOneWidget — autocomplete variant (unified bottom-sheet) bounded scroll', () => {
  it('bottom-sheet panel style defines a maxHeight so it does not grow without limit', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/s1',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
    });
    const { getByTestId } = await render(
      <SelectOneWidget nodeRef={ref} store={store} appearance="autocomplete" />,
    );
    await act(async () => {
      fireEvent.press(getByTestId('select-one-dropdown-trigger'));
    });
    const panel = getByTestId('select-one-sheet');
    const panelStyle = Object.assign({}, ...[panel.props.style].flat());
    expect(panelStyle.maxHeight).toBeDefined();
  });

  it('internal ScrollView persists taps while the search TextInput keyboard is open (REQ hotfix)', async () => {
    // Without keyboardShouldPersistTaps="handled", the FIRST tap on a result
    // below a focused TextInput only dismisses the keyboard instead of
    // firing onPress — a well-known RN gotcha. Confirmed on-device: user
    // types a filter, taps the matching result, and selection doesn't fire.
    const { store, ref } = makeStoreFor({
      ref: '/data/s1',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
    });
    const { getByTestId } = await render(
      <SelectOneWidget nodeRef={ref} store={store} appearance="autocomplete" />,
    );
    await act(async () => {
      fireEvent.press(getByTestId('select-one-dropdown-trigger'));
    });
    const scroll = getByTestId('select-one-sheet-scroll');
    expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('selecting a result after filtering commits the value (on-device regression coverage)', async () => {
    // This is the exact scenario reported broken on-device with the old
    // inline TextInput+FlatList 'autocomplete': type a filter, tap the
    // matching result, selection must fire.
    const { store, ref } = makeStoreFor({
      ref: '/data/s1',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    const { getByTestId } = await render(
      <SelectOneWidget nodeRef={ref} store={store} appearance="autocomplete" />,
    );
    await act(async () => {
      fireEvent.press(getByTestId('select-one-dropdown-trigger'));
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('select-one-minimal-autocomplete-search'), 'Option 42');
    });
    await act(async () => {
      fireEvent.press(getByTestId('select-one-option-val42'));
    });
    expect(spy).toHaveBeenCalledWith(ref, 'val42');
  });
});
