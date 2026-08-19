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
      <ImageWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('image-camera-button')).toBeTruthy();
    expect(screen.getByTestId('image-library-button')).toBeTruthy();
  });

  it('shows thumbnail when value exists', async () => {
    const store = makeStore('file://test/photo.jpg');
    store.stepForward();
    const ev = getRef(store);
    await render(
      <ImageWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
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
      <ImageWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
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
      <ImageWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('image-library-button'));
    });
    expect(answerSpy).not.toHaveBeenCalled();
  });
});

describe('ImageWidget independent camera/library permission gating', () => {
  it('shows rationale notice and does not open camera when camera permission is undetermined', async () => {
    picker.getCameraPermissionsAsync.mockResolvedValueOnce({
      status: 'undetermined',
      granted: false,
      canAskAgain: true,
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <ImageWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('image-camera-button'));
    });
    expect(screen.getByTestId('permission-notice')).toBeTruthy();
    expect(picker.__mockLaunchCamera).not.toHaveBeenCalled();
    expect(screen.getByText('Usar la cámara')).toBeTruthy();
  });

  it('shows library rationale notice and does not open library when library permission is undetermined', async () => {
    picker.getMediaLibraryPermissionsAsync.mockResolvedValueOnce({
      status: 'undetermined',
      granted: false,
      canAskAgain: true,
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <ImageWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('image-library-button'));
    });
    expect(screen.getByTestId('permission-notice')).toBeTruthy();
    expect(picker.__mockLaunchLibrary).not.toHaveBeenCalled();
    expect(screen.getByText('Usar tus fotos')).toBeTruthy();
  });

  it('camera blocked + library granted: library button still works and no notice on render', async () => {
    picker.getCameraPermissionsAsync.mockResolvedValue({
      status: 'denied',
      granted: false,
      canAskAgain: false,
    });
    picker.__mockLaunchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://library.jpg' }],
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <ImageWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    // No notice shown on initial render — gate is only checked on tap.
    expect(screen.queryByTestId('permission-notice')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByTestId('image-library-button'));
    });
    expect(answerSpy).toHaveBeenCalledWith(ev.ref, 'file://library.jpg');
    expect(screen.queryByTestId('permission-notice')).toBeNull();
  });

  it('camera blocked + library granted: camera notice appears only after tapping camera button', async () => {
    picker.getCameraPermissionsAsync.mockResolvedValue({
      status: 'denied',
      granted: false,
      canAskAgain: false,
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <ImageWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.queryByTestId('permission-notice')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByTestId('image-camera-button'));
    });
    expect(screen.getByTestId('permission-notice')).toBeTruthy();
    expect(screen.getByText('Abrir ajustes')).toBeTruthy();
    expect(screen.queryByTestId('permission-notice-dismiss')).toBeNull();
    expect(picker.__mockLaunchCamera).not.toHaveBeenCalled();
  });
});
