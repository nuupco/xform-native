/**
 * ImageWidget tests — T-M06 (REQ-M03..M06).
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
import { ImageWidget } from '../widgets/ImageWidget';

// Manual mock at src/__mocks__/expo-image-picker.js
const picker = require('expo-image-picker');

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStore(value = '') {
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/img',
          dataType: 'binary',
          controlType: 'upload',
          label: 'Photo',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/img': {
          relevant: true,
          enabled: true,
          required: false,
          readonly: false,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/img': true },
      choices: {},
      answerResults: { '/data/img': AnswerResult.OK },
      values: { '/data/img': value },
    }),
  );
}

function getRef(store: FormSessionStore) {
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev;
}

describe('ImageWidget', () => {
  it('renders camera and library buttons', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <ImageWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('image-camera-button')).toBeTruthy();
    expect(screen.getByTestId('image-library-button')).toBeTruthy();
  });

  it('shows thumbnail when value exists', async () => {
    const store = makeStore('file://test/photo.jpg');
    store.stepForward();
    const ev = getRef(store);
    await render(
      <ImageWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('image-thumbnail')).toBeTruthy();
  });

  it('calls answerQuestion with URI after camera capture', async () => {
    picker.__mockLaunchCamera.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://captured.jpg' }],
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <ImageWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('image-camera-button'));
    });
    expect(answerSpy).toHaveBeenCalledWith(ev.ref, 'file://captured.jpg');
  });

  it('does not call answerQuestion on cancel', async () => {
    picker.__mockLaunchLibrary.mockResolvedValueOnce({ canceled: true });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <ImageWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('image-library-button'));
    });
    expect(answerSpy).not.toHaveBeenCalled();
  });
});
