/**
 * DateWidget present-dep test — native picker button UX (RN-D07).
 *
 * @react-native-community/datetimepicker is an optional peer dep. When it is
 * present, DateWidget's `default` variant additionally renders a button that
 * opens the native picker, in ADDITION to (not instead of) the manual
 * TextInput. Selecting a date in the picker must commit via
 * store.answerQuestion just like typing does today.
 */
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  const MockDateTimePicker = (props: {
    onChange: (event: unknown, date?: Date) => void;
  }) =>
    React.createElement(
      Pressable,
      {
        testID: 'date-native-picker',
        onPress: () =>
          // Native pickers return a Date at local midnight for the picked
          // calendar date, not a UTC-midnight Date — mirror that here.
          props.onChange({}, new Date(2024, 5, 15)), // 2024-06-15 (local)
      },
      React.createElement(Text, null, 'mock-picker'),
    );
  return { __esModule: true, default: MockDateTimePicker };
});

import { act } from 'react';
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession } from '../../test-support/makeFakeSession';
import { DateWidget } from '../../widgets/DateWidget';

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

describe('DateWidget with native picker available', () => {
  it('renders both the manual TextInput and the picker button', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(
      <DateWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );

    expect(screen.getByTestId('date-input')).toBeTruthy();
    expect(screen.getByTestId('date-picker-button')).toBeTruthy();
  });

  it('commits the selected date via answerQuestion and updates the text', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');
    const answerSpy = jest.spyOn(store, 'answerQuestion');

    await render(
      <DateWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId('date-picker-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('date-native-picker'));
    });

    expect(answerSpy).toHaveBeenCalledWith(
      ev.ref,
      new Date(Date.UTC(2024, 5, 15)),
    );
    expect(screen.getByTestId('date-input').props.value).toBe('2024-06-15');
  });

  it('does not render the picker button for month-year variant', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(
      <DateWidget nodeRef={ev.ref} store={store} appearance="month-year" />,
    );

    expect(screen.queryByTestId('date-picker-button')).toBeNull();
  });
});
