/**
 * BarcodeWidget absent-dep test.
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
import { BarcodeWidget } from '../widgets/BarcodeWidget';

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

describe('BarcodeWidget absent dep', () => {
  it('renders UnsupportedWidget when dep is absent', async () => {
    const store = new FormSessionStore(
      makeFakeSession({
        events: [
          { kind: 'bof' },
          {
            kind: 'question',
            ref: '/data/barcode',
            dataType: 'binary',
            controlType: 'input',
            label: 'Barcode',
            hint: null,
            appearance: 'barcode',
          },
          { kind: 'eof' },
        ],
        nodeStates: {
          '/data/barcode': {
            relevant: true,
            enabled: true,
            required: false,
            readonly: false,
            constraintMsg: null,
            calculatedValue: null,
          },
        },
        relevance: { '/data/barcode': true },
        choices: {},
        answerResults: { '/data/barcode': AnswerResult.OK },
        values: { '/data/barcode': null },
      }),
    );
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(
      <BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('unsupported-widget')).toBeTruthy();
  });
});
