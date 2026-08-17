/**
 * DateWidget absent-dep test — native picker button UX (RN-D07).
 *
 * @react-native-community/datetimepicker is an optional peer dep. When it is
 * absent, DateWidget must behave exactly as before: manual TextInput only,
 * no picker button, no warnings/errors.
 */
jest.mock('@react-native-community/datetimepicker', () => {
  throw new Error('not found');
});

import { render, screen, cleanup } from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession } from '../test-support/makeFakeSession';
import { DateWidget } from '../widgets/DateWidget';

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStore(value: unknown = null) {
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/dob',
          dataType: 'date',
          controlType: 'input',
          label: 'Date of birth',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/dob': {
          relevant: true,
          enabled: true,
          required: false,
          readonly: false,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/dob': true },
      choices: {},
      answerResults: { '/data/dob': AnswerResult.OK },
      values: { '/data/dob': value },
    }),
  );
}

describe('DateWidget absent dep', () => {
  it('renders only the manual TextInput, no picker button', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(
      <DateWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );

    expect(screen.getByTestId('date-input')).toBeTruthy();
    expect(screen.queryByTestId('date-picker-button')).toBeNull();
    expect(screen.queryByTestId('date-native-picker')).toBeNull();
  });
});
