/**
 * NoteWidget label media (image/audio/video) — same getLabelMediaUri +
 * mediaResolver mechanism as SelectOneWidget's image-map variant (see
 * appearance-gaps-closed.test.tsx's 'selectOne/select1/image-map' suite).
 */
import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult, type DataType, type ControlType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../../test-support/makeFakeSession';
import { NoteWidget } from '../../widgets/NoteWidget';
import type { NodeRef } from '../../adapter/FormAdapter';

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStoreFor(opts: {
  ref: string;
  dataType: DataType;
  controlType?: ControlType;
  value?: unknown;
}): { store: FormSessionStore; ref: NodeRef } {
  const script: FakeSessionScript = {
    events: [
      { kind: 'bof' },
      {
        kind: 'question',
        ref: opts.ref,
        dataType: opts.dataType,
        controlType: opts.controlType ?? ('note' as ControlType),
        label: 'Test field',
        hint: null,
        appearance: null,
      },
      { kind: 'eof' },
    ],
    nodeStates: {
      [opts.ref]: {
        readonly: false,
        required: false,
        relevant: true,
        enabled: true,
        constraintMsg: null,
        calculatedValue: null,
      },
    },
    relevance: { [opts.ref]: true },
    choices: {},
    answerResults: { [opts.ref]: AnswerResult.OK },
    values: { [opts.ref]: opts.value ?? null },
  };
  const session = makeFakeSession(script);
  const store = new FormSessionStore(session);
  store.stepForward();
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question event');
  return { store, ref: ev.ref };
}

function setMediaResolver(store: FormSessionStore, resolvedUri: string | null) {
  (store as unknown as { mediaResolver: unknown }).mediaResolver = {
    resolve: jest.fn().mockResolvedValue(resolvedUri),
  };
}

describe('NoteWidget — text only (unchanged behavior)', () => {
  it('renders just the text when the label carries no media', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/note', dataType: 'string', value: 'Hello' });
    await render(<NoteWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('note-widget')).toBeTruthy();
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.queryByTestId('note-label-image')).toBeNull();
    expect(screen.queryByTestId('note-label-audio-play-button')).toBeNull();
    expect(screen.queryByTestId('note-label-video')).toBeNull();
  });

  it('renders nothing when the text is empty and there is no media', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/note', dataType: 'string', value: '' });
    await render(<NoteWidget nodeRef={ref} store={store} />);
    expect(screen.queryByTestId('note-widget')).toBeNull();
  });
});

describe('NoteWidget — label image', () => {
  it('renders the resolved image alongside the text', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/note', dataType: 'string', value: 'Hello' });
    jest.spyOn(store.adapter, 'getLabelMediaUri').mockImplementation((form) =>
      form === 'image' ? 'jr://images/test.jpg' : null,
    );
    setMediaResolver(store, 'file:///test.jpg');

    await render(<NoteWidget nodeRef={ref} store={store} />);
    expect(await screen.findByTestId('note-label-image')).toBeTruthy();
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('falls back to text-only when mediaResolver is not configured', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/note', dataType: 'string', value: 'Hello' });
    jest.spyOn(store.adapter, 'getLabelMediaUri').mockImplementation((form) =>
      form === 'image' ? 'jr://images/test.jpg' : null,
    );

    await render(<NoteWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('note-widget')).toBeTruthy();
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.queryByTestId('note-label-image')).toBeNull();
  });
});

describe('NoteWidget — label audio', () => {
  it('renders a play/pause button that toggles playback', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/note', dataType: 'string', value: 'Hello' });
    jest.spyOn(store.adapter, 'getLabelMediaUri').mockImplementation((form) =>
      form === 'audio' ? 'jr://audio/test.mp3' : null,
    );
    setMediaResolver(store, 'file:///test.mp3');

    await render(<NoteWidget nodeRef={ref} store={store} />);
    const button = await screen.findByTestId('note-label-audio-play-button');
    expect(button).toBeTruthy();
    expect(screen.getByText('Play')).toBeTruthy();

    await act(async () => {
      fireEvent.press(button);
    });
    expect(screen.getByText('Pause')).toBeTruthy();
  });
});

describe('NoteWidget — label video', () => {
  it('renders a VideoView player for the resolved video', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/note', dataType: 'string', value: 'Hello' });
    jest.spyOn(store.adapter, 'getLabelMediaUri').mockImplementation((form) =>
      form === 'video' ? 'jr://video/test.mp4' : null,
    );
    setMediaResolver(store, 'file:///test.mp4');

    await render(<NoteWidget nodeRef={ref} store={store} />);
    expect(await screen.findByTestId('note-label-video')).toBeTruthy();
  });
});
