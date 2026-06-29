/**
 * AudioWidget tests — T-M10 (REQ-M11..M14).
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
import { AudioWidget } from '../widgets/AudioWidget';

const av = require('expo-av');

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
          ref: '/data/audio',
          dataType: 'binary',
          controlType: 'upload',
          label: 'Audio',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/audio': {
          relevant: true,
          enabled: true,
          required: false,
          readonly,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/audio': true },
      choices: {},
      answerResults: { '/data/audio': AnswerResult.OK },
      values: { '/data/audio': value },
    }),
  );
}

function getRef(store: FormSessionStore) {
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev;
}

describe('AudioWidget', () => {
  it('renders Record button when dep is available', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <AudioWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('audio-record-button')).toBeTruthy();
  });

  it('Record -> Stop stores URI via answerQuestion', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <AudioWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('audio-record-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('audio-stop-button'));
    });
    expect(answerSpy).toHaveBeenCalledWith(ev.ref, 'file://recording.m4a');
  });

  it('Play button renders when recording exists', async () => {
    const store = makeStore('file://existing.m4a');
    store.stepForward();
    const ev = getRef(store);
    await render(
      <AudioWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('audio-play-button')).toBeTruthy();
  });

  it('readonly mode disables buttons', async () => {
    const store = makeStore('file://existing.m4a', true);
    store.stepForward();
    const ev = getRef(store);
    await render(
      <AudioWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    const playButton = screen.getByTestId('audio-play-button');
    expect(playButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('pressing Play calls playAsync on the sound', async () => {
    const store = makeStore('file://existing.m4a');
    store.stepForward();
    const ev = getRef(store);
    await render(
      <AudioWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('audio-play-button'));
    });
    expect(av.__mockSound.playAsync).toHaveBeenCalled();
  });

  it('shows Stop while recording and hides Record', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <AudioWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('audio-record-button'));
    });
    expect(screen.getByTestId('audio-stop-button')).toBeTruthy();
    expect(screen.queryByTestId('audio-record-button')).toBeNull();
  });
});
