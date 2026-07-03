/**
 * VideoWidget absent-dep test — REQ-V03.
 */
jest.mock('expo-camera', () => {
  throw new Error('not found');
});

import {
  render,
  screen,
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

describe('VideoWidget absent dep', () => {
  it('renders UnsupportedWidget when dep is absent', async () => {
    const store = new FormSessionStore(
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
            readonly: false,
            constraintMsg: null,
            calculatedValue: null,
          },
        },
        relevance: { '/data/video': true },
        choices: {},
        answerResults: { '/data/video': AnswerResult.OK },
        values: { '/data/video': '' },
      }),
    );
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(
      <VideoWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('unsupported-widget')).toBeTruthy();
  });
});
