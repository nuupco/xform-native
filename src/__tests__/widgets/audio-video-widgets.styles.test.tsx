/**
 * audio-video-widgets.styles.test.tsx — Audio/Video MediaCaptureCard wiring
 * (design decision 7, per-widget mapping table, PR12).
 */
import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession } from '../../test-support/makeFakeSession';
import { AudioWidget } from '../../widgets/AudioWidget';
import { VideoWidget } from '../../widgets/VideoWidget';
import { tokens } from '../../tokens/tokens';

function flatten(style: unknown) {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]));
}

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStore(
  ref: string,
  dataType: string,
  overrides: { value?: unknown; readonly?: boolean } = {},
) {
  const { value = '', readonly = false } = overrides;
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref,
          dataType,
          controlType: 'upload',
          label: 'Field',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        [ref]: {
          relevant: true,
          enabled: true,
          required: false,
          readonly,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { [ref]: true },
      choices: {},
      answerResults: { [ref]: AnswerResult.OK },
      values: { [ref]: value },
    }),
  );
}

function getRef(store: FormSessionStore) {
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev;
}

describe('AudioWidget — MediaCaptureCard wiring', () => {
  it('Stop action uses tone:"error" (PressableButton error text color)', async () => {
    const store = makeStore('/data/audio', 'binary');
    store.stepForward();
    const ev = getRef(store);
    await render(<AudioWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('audio-record-button'));
    });
    const flat = flatten(screen.getByText('Stop').props.style);
    expect(flat.color).toBe(tokens.color.roles.error);
  });

  it('shows a recording-pulse element while recording', async () => {
    const store = makeStore('/data/audio', 'binary');
    store.stepForward();
    const ev = getRef(store);
    await render(<AudioWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('audio-record-button'));
    });
    expect(screen.getByTestId('audio-recording-pulse')).toBeTruthy();
  });

  it('does not show the recording pulse when not recording', async () => {
    const store = makeStore('/data/audio', 'binary');
    store.stepForward();
    const ev = getRef(store);
    await render(<AudioWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    expect(screen.queryByTestId('audio-recording-pulse')).toBeNull();
  });
});

describe('VideoWidget — MediaCaptureCard wiring', () => {
  it('camera preview keeps a fixed 240x180 size with radius.md', async () => {
    const store = makeStore('/data/video', 'binary');
    store.stepForward();
    const ev = getRef(store);
    await render(<VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-record-button'));
    });
    const camera = screen.getByTestId('video-camera-view');
    const flat = flatten(camera.props.style);
    expect(flat.width).toBe(240);
    expect(flat.height).toBe(180);
    expect(flat.borderRadius).toBe(tokens.radius.md);
  });

  it('video player preview keeps a fixed 240x180 size with radius.md', async () => {
    const store = makeStore('/data/video', 'binary', { value: 'file://existing.mp4' });
    store.stepForward();
    const ev = getRef(store);
    await render(<VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-play-button'));
    });
    const player = screen.getByTestId('video-player');
    const flat = flatten(player.props.style);
    expect(flat.width).toBe(240);
    expect(flat.height).toBe(180);
    expect(flat.borderRadius).toBe(tokens.radius.md);
  });

  it('Stop action uses tone:"error" (PressableButton error text color)', async () => {
    const store = makeStore('/data/video', 'binary');
    store.stepForward();
    const ev = getRef(store);
    await render(<VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-record-button'));
    });
    const flat = flatten(screen.getByText('Stop').props.style);
    expect(flat.color).toBe(tokens.color.roles.error);
  });
});
