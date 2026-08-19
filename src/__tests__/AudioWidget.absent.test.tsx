/**
 * AudioWidget absent-dep test — REQ-M14.
 */
jest.mock('expo-audio', () => {
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
import { AudioWidget } from '../widgets/AudioWidget';

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

describe('AudioWidget absent dep', () => {
  it('renders UnsupportedWidget when dep is absent', async () => {
    const store = new FormSessionStore(
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
            readonly: false,
            constraintMsg: null,
            calculatedValue: null,
          },
        },
        relevance: { '/data/audio': true },
        choices: {},
        answerResults: { '/data/audio': AnswerResult.OK },
        values: { '/data/audio': '' },
      }),
    );
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(
      <AudioWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('unsupported-widget')).toBeTruthy();
  });
});
