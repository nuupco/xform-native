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
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession } from '../../test-support/makeFakeSession';
import { SignatureWidget } from '../../widgets/SignatureWidget';

const { __FAKE_SIGNATURE_DATA_URI } = require('react-native-signature-canvas');

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStore(value: string | null = '') {
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
      values: { '/data/sig': value },
    }),
  );
}

function getRef(store: FormSessionStore) {
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev;
}

describe('SignatureWidget', () => {
  it('renders MediaCaptureCard in empty state with a "Firmar" button', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <SignatureWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('signature-widget')).toBeTruthy();
    expect(screen.getByTestId('signature-open-button')).toBeTruthy();
  });

  it('opens the fullscreen modal on "Firmar" and saves the signed PNG data URI', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <SignatureWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('signature-open-button'));
    });
    expect(screen.getByTestId('signature-canvas')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('signature-save-button'));
    });
    expect(answerSpy).toHaveBeenCalledWith(ev.ref, __FAKE_SIGNATURE_DATA_URI);
  });

  it('clear button clears the in-progress pad without closing the modal', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <SignatureWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('signature-open-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('signature-clear-button'));
    });
    expect(screen.getByTestId('signature-canvas')).toBeTruthy();
  });

  it('cancel button closes the modal without saving', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <SignatureWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('signature-open-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('signature-cancel-button'));
    });
    expect(answerSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('signature-open-button')).toBeTruthy();
  });

  it('shows captured state with an Image preview and Firmar de nuevo/Borrar actions when a signature exists', async () => {
    const store = makeStore('data:image/png;base64,abc123');
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <SignatureWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('signature-preview')).toBeTruthy();
    expect(screen.getByTestId('signature-edit-button')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('signature-delete-button'));
    });
    expect(answerSpy).toHaveBeenCalledWith(ev.ref, null);
  });
});
