/**
 * T-08: useFormSession hook — RNTL tier.
 *
 * REQ-06: a component using useFormSession(store) re-renders on store mutation.
 *
 * Note: RNTL v14 render() is async (uses await act internally).
 */

import { Text } from 'react-native';
import { render, screen, act } from '@testing-library/react-native';
import { FormSessionStore } from '../../store/FormSessionStore';
import { useFormSession } from '../../store/useFormSession';
import { makeFakeSession } from '../../test-support/makeFakeSession';
import { AnswerResult } from '@nuup/ts-rosa';

function makeStore() {
  const session = makeFakeSession({
    events: [
      { kind: 'bof' },
      {
        kind: 'question',
        ref: '/data/x',
        dataType: 'string',
        controlType: 'input',
        label: 'X',
        hint: null,
        appearance: null,
      },
      { kind: 'eof' },
    ],
    nodeStates: {},
    relevance: {},
    choices: {},
    answerResults: { '/data/x': AnswerResult.OK },
    values: { '/data/x': '' },
  });
  return new FormSessionStore(session);
}

function VersionDisplay({ store }: { store: FormSessionStore }) {
  const snap = useFormSession(store);
  return <Text testID="version">{snap.version}</Text>;
}

describe('useFormSession', () => {
  it('renders with initial version 0', async () => {
    const store = makeStore();
    await render(<VersionDisplay store={store} />);
    expect(screen.getByTestId('version').props.children).toBe(0);
  });

  it('re-renders with incremented version after stepForward', async () => {
    const store = makeStore();
    await render(<VersionDisplay store={store} />);
    await act(async () => {
      store.stepForward();
    });
    expect(screen.getByTestId('version').props.children).toBe(1);
  });

  it('re-renders after answerQuestion', async () => {
    const store = makeStore();
    await render(<VersionDisplay store={store} />);
    await act(async () => {
      store.stepForward(); // move to question (version 1)
    });
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');
    await act(async () => {
      store.answerQuestion(ev.ref, 'hello'); // version 2
    });
    expect(screen.getByTestId('version').props.children).toBe(2);
  });
});
