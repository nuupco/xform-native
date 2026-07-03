/**
 * GeoTraceWidget absent-dep test.
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
import { GeoTraceWidget } from '../widgets/GeoTraceWidget';

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

describe('GeoTraceWidget absent dep', () => {
  it('renders UnsupportedWidget when dep is absent', async () => {
    const store = new FormSessionStore(
      makeFakeSession({
        events: [
          { kind: 'bof' },
          {
            kind: 'question',
            ref: '/data/trace',
            dataType: 'geotrace',
            controlType: 'input',
            label: 'Trace',
            hint: null,
            appearance: null,
          },
          { kind: 'eof' },
        ],
        nodeStates: {
          '/data/trace': {
            relevant: true,
            enabled: true,
            required: false,
            readonly: false,
            constraintMsg: null,
            calculatedValue: null,
          },
        },
        relevance: { '/data/trace': true },
        choices: {},
        answerResults: { '/data/trace': AnswerResult.OK },
        values: { '/data/trace': null },
      }),
    );
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(
      <GeoTraceWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('unsupported-widget')).toBeTruthy();
  });
});
