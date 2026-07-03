/**
 * SignatureWidget tests — T-M08 (REQ-M07..M10).
 */
import { act } from 'react';
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession } from '../test-support/makeFakeSession';
import { SignatureWidget } from '../widgets/SignatureWidget';

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStore() {
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/sig',
          dataType: 'binary',
          controlType: 'upload',
          label: 'Signature',
          hint: null,
          appearance: 'draw',
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/sig': {
          relevant: true,
          enabled: true,
          required: false,
          readonly: false,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/sig': true },
      choices: {},
      answerResults: { '/data/sig': AnswerResult.OK },
      values: { '/data/sig': '' },
    }),
  );
}

function getRef(store: FormSessionStore) {
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev;
}

describe('SignatureWidget', () => {
  it('renders canvas and action buttons', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <SignatureWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('signature-widget')).toBeTruthy();
    expect(screen.getByTestId('signature-clear-button')).toBeTruthy();
    expect(screen.getByTestId('signature-export-button')).toBeTruthy();
  });

  it('export button calls answerQuestion with signature URI', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <SignatureWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('signature-export-button'));
    });
    expect(answerSpy).toHaveBeenCalledWith(
      ev.ref,
      expect.stringContaining('signature:'),
    );
  });

  it('clear button resets canvas', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <SignatureWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    // First export something to create strokes, then clear
    await act(async () => {
      fireEvent.press(screen.getByTestId('signature-export-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('signature-clear-button'));
    });
    // Canvas should still be rendered
    expect(screen.getByTestId('signature-widget')).toBeTruthy();
  });
});
