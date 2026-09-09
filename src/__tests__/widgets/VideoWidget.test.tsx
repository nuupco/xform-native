/**
 * VideoWidget tests — T-V01..V04.
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
import { VideoWidget } from '../../widgets/VideoWidget';

const camera = require('expo-camera');
const picker = require('expo-image-picker');

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStore(value = '', readonly = false) {
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/video',
          dataType: 'binary',
          controlType: 'upload',
          label: 'Video',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/video': {
          relevant: true,
          enabled: true,
          required: false,
          readonly,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/video': true },
      choices: {},
      answerResults: { '/data/video': AnswerResult.OK },
      values: { '/data/video': value },
    }),
  );
}

function getRef(store: FormSessionStore) {
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev;
}

describe('VideoWidget', () => {
  it('renders Record button when dep is available', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('video-record-button')).toBeTruthy();
  });

  it('Record opens the native camera and stores the returned URI via answerQuestion', async () => {
    picker.__mockLaunchCamera.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://video.mp4' }],
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-record-button'));
    });
    expect(picker.launchCameraAsync).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ['videos'], videoMaxDuration: 60 }),
    );
    expect(answerSpy).toHaveBeenCalledWith(ev.ref, 'file://video.mp4');
  });

  it('Play button renders when a value URI exists', async () => {
    const store = makeStore('file://existing.mp4');
    store.stepForward();
    const ev = getRef(store);
    await render(
      <VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('video-play-button')).toBeTruthy();
  });

  it('readonly mode disables Record; Play remains available', async () => {
    const store = makeStore('file://existing.mp4', true);
    store.stepForward();
    const ev = getRef(store);
    await render(
      <VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('video-play-button')).toBeTruthy();
    const recordButton = screen.getByTestId('video-record-button');
    expect(recordButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('pressing Play renders the video player', async () => {
    const store = makeStore('file://existing.mp4');
    store.stepForward();
    const ev = getRef(store);
    await render(
      <VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-play-button'));
    });
    expect(screen.getByTestId('video-player')).toBeTruthy();
  });

  it('canceling the native camera does not store a URI', async () => {
    picker.__mockLaunchCamera.mockResolvedValueOnce({ canceled: true });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-record-button'));
    });
    expect(answerSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('video-record-button')).toBeTruthy();
  });

  it('re-record overwrites previous value', async () => {
    picker.__mockLaunchCamera.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://video.mp4' }],
    });
    const store = makeStore('file://old.mp4');
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-record-button'));
    });
    expect(answerSpy).toHaveBeenCalledWith(ev.ref, 'file://video.mp4');
  });

  it('camera denied only: notice names camera specifically and the native camera never opens', async () => {
    camera.getCameraPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: true,
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-record-button'));
    });
    expect(screen.getByText('Sin permiso de cámara')).toBeTruthy();
    expect(picker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('microphone denied only: notice names microphone specifically and the native camera never opens', async () => {
    camera.getMicrophonePermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: true,
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-record-button'));
    });
    expect(screen.getByText('Sin permiso de micrófono')).toBeTruthy();
    expect(picker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('both denied: notice reflects camera (checked first) and the native camera never opens', async () => {
    camera.getCameraPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: true,
    });
    // Mic mock is deliberately not queued: handleRecord short-circuits after
    // the camera check fails, so mic.get() is never called for this press.
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-record-button'));
    });
    expect(screen.getByText('Sin permiso de cámara')).toBeTruthy();
    expect(picker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('both granted proceeds unchanged: launchCameraAsync is invoked', async () => {
    picker.__mockLaunchCamera.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://video.mp4' }],
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-record-button'));
    });
    expect(picker.launchCameraAsync).toHaveBeenCalled();
  });

  it('camera blocked shows "Abrir ajustes" and no dismiss', async () => {
    camera.getCameraPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: false,
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-record-button'));
    });
    expect(screen.getByText('Abrir ajustes')).toBeTruthy();
    expect(screen.queryByTestId('permission-notice-dismiss')).toBeNull();
  });
});
