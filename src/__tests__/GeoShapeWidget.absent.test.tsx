/**
 * GeoShapeWidget absent-dep test.
 */
jest.mock('@nuup/xform-native-geo', () => {
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
import { GeoShapeWidget } from '../widgets/GeoShapeWidget';

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

describe('GeoShapeWidget absent dep', () => {
  it('renders UnsupportedWidget when dep is absent', async () => {
    const store = new FormSessionStore(
      makeFakeSession({
        events: [
          { kind: 'bof' },
          {
            kind: 'question',
            ref: '/data/shape',
            dataType: 'geoshape',
            controlType: 'input',
            label: 'Shape',
            hint: null,
            appearance: null,
          },
          { kind: 'eof' },
        ],
        nodeStates: {
          '/data/shape': {
            relevant: true,
            enabled: true,
            required: false,
            readonly: false,
            constraintMsg: null,
            calculatedValue: null,
          },
        },
        relevance: { '/data/shape': true },
        choices: {},
        answerResults: { '/data/shape': AnswerResult.OK },
        values: { '/data/shape': null },
      }),
    );
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(
      <GeoShapeWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('unsupported-widget')).toBeTruthy();
  });
});
