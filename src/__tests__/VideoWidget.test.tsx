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
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession } from '../test-support/makeFakeSession';
import { VideoWidget } from '../widgets/VideoWidget';

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
      <VideoWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('video-record-button')).toBeTruthy();
  });

  it('Record -> Stop stores URI via answerQuestion', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <VideoWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-record-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-stop-button'));
    });
    expect(answerSpy).toHaveBeenCalledWith(ev.ref, 'file://video.mp4');
  });

  it('Play button renders when a value URI exists', async () => {
    const store = makeStore('file://existing.mp4');
    store.stepForward();
    const ev = getRef(store);
    await render(
      <VideoWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('video-play-button')).toBeTruthy();
  });

  it('readonly mode disables Record and Stop; Play remains available', async () => {
    const store = makeStore('file://existing.mp4', true);
    store.stepForward();
    const ev = getRef(store);
    await render(
      <VideoWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
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
      <VideoWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-play-button'));
    });
    expect(screen.getByTestId('video-player')).toBeTruthy();
  });

  it('shows Stop while recording and hides Record', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <VideoWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-record-button'));
    });
    expect(screen.getByTestId('video-stop-button')).toBeTruthy();
    expect(screen.queryByTestId('video-record-button')).toBeNull();
  });

  it('cancel recording does not store URI', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <VideoWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-record-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-cancel-button'));
    });
    expect(answerSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('video-record-button')).toBeTruthy();
  });

  it('re-record overwrites previous value', async () => {
    const store = makeStore('file://old.mp4');
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <VideoWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-record-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-stop-button'));
    });
    expect(answerSpy).toHaveBeenCalledWith(ev.ref, 'file://video.mp4');
  });
});
