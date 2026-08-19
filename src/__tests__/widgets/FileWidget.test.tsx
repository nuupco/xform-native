/**
 * FileWidget tests — T-M12 (REQ-M15..M16).
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
import { FileWidget } from '../../widgets/FileWidget';

const docPicker = require('expo-document-picker');

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStore(readonly = false) {
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/file',
          dataType: 'binary',
          controlType: 'upload',
          label: 'File',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/file': {
          relevant: true,
          enabled: true,
          required: false,
          readonly,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/file': true },
      choices: {},
      answerResults: { '/data/file': AnswerResult.OK },
      values: { '/data/file': '' },
    }),
  );
}

function getRef(store: FormSessionStore) {
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev;
}

describe('FileWidget', () => {
  it('renders Pick File button when dep is available', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <FileWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('file-pick-button')).toBeTruthy();
  });

  it('calls answerQuestion with URI after picking a file', async () => {
    docPicker.__mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://document.pdf' }],
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <FileWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('file-pick-button'));
    });
    expect(answerSpy).toHaveBeenCalledWith(ev.ref, 'file://document.pdf');
  });

  it('does not call answerQuestion on cancel', async () => {
    docPicker.__mockGetDocument.mockResolvedValueOnce({ canceled: true });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <FileWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('file-pick-button'));
    });
    expect(answerSpy).not.toHaveBeenCalled();
  });

  it('readonly mode disables button', async () => {
    const store = makeStore(true);
    store.stepForward();
    const ev = getRef(store);
    await render(
      <FileWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    const button = screen.getByTestId('file-pick-button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('calls getDocumentAsync with wildcard type', async () => {
    docPicker.__mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://doc.txt' }],
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <FileWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('file-pick-button'));
    });
    expect(docPicker.__mockGetDocument).toHaveBeenCalledWith({ type: '*/*' });
  });
});
