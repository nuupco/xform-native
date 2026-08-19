/**
 * GeoPointWidget absent-dep test — REQ-GEO10.
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
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession } from '../../test-support/makeFakeSession';
import { GeoPointWidget } from '../../widgets/GeoPointWidget';

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

describe('GeoPointWidget absent dep', () => {
  it('renders UnsupportedWidget when dep is absent', async () => {
    const store = new FormSessionStore(
      makeFakeSession({
        events: [
          { kind: 'bof' },
          {
            kind: 'question',
            ref: '/data/location',
            dataType: 'geopoint',
            controlType: 'input',
            label: 'Location',
            hint: null,
            appearance: null,
          },
          { kind: 'eof' },
        ],
        nodeStates: {
          '/data/location': {
            relevant: true,
            enabled: true,
            required: false,
            readonly: false,
            constraintMsg: null,
            calculatedValue: null,
          },
        },
        relevance: { '/data/location': true },
        choices: {},
        answerResults: { '/data/location': AnswerResult.OK },
        values: { '/data/location': null },
      }),
    );
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('unsupported-widget')).toBeTruthy();
  });
});
