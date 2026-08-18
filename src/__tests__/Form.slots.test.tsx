/**
 * T19-T23: Form.tsx composition slots (design D6, spec capability
 * "form-composition-slots").
 *
 * T19: no-slots regression — Form's default markup/testIDs/copy MUST be
 *      byte-identical to pre-slots behavior (written before slots.ts / the
 *      `slots` prop exist — this is the non-negotiable regression gate).
 * T21: custom `renderNavigation` slot replaces default Back/Next, callbacks
 *      still function.
 * T22: custom `renderError` slot replaces default constraint/required
 *      surfaces.
 * T23: custom `renderGroup` slot replaces default group/repeat layout.
 */

import { act } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from '@testing-library/react-native';
import { FormSessionStore } from '../store/FormSessionStore';
import { Form } from '../form/Form';
import { makeFakeSession } from '../test-support/makeFakeSession';

afterEach(async () => {
  await cleanup();
});

function makeStore(script: Parameters<typeof makeFakeSession>[0]) {
  return new FormSessionStore(makeFakeSession(script));
}

function q1RequiredScript() {
  return {
    events: [
      { kind: 'bof' as const },
      {
        kind: 'question' as const,
        ref: '/data/q1',
        dataType: 'string' as const,
        controlType: 'input' as const,
        label: 'Name',
        hint: null,
        appearance: null,
      },
      { kind: 'eof' as const },
    ],
    nodeStates: {
      '/data/q1': {
        readonly: false,
        required: true,
        relevant: true,
        enabled: true,
        constraintMsg: null,
        calculatedValue: null,
      },
    },
    relevance: { '/data/q1': true },
    choices: {},
    answerResults: {},
    values: { '/data/q1': '' },
  };
}

function groupScript() {
  return {
    events: [
      { kind: 'bof' as const },
      {
        kind: 'group' as const,
        ref: '/data/g1',
        label: 'Group One',
        hint: null,
        index: 1,
      },
      { kind: 'eof' as const },
    ],
    nodeStates: {},
    relevance: { '/data/g1': true },
    choices: {},
    answerResults: {},
    values: {},
  };
}

describe('Form — composition slots', () => {
  it('T19: no slots -> default markup/testIDs/copy unchanged (regression gate)', async () => {
    const store = makeStore(q1RequiredScript());
    await render(<Form store={store} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });

    expect(screen.getByTestId('nav-back')).toBeTruthy();
    expect(screen.getByTestId('nav-next')).toBeTruthy();
    expect(screen.getByText('Atrás')).toBeTruthy();
    expect(screen.getByText('Siguiente')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByTestId('required-indicator')).toBeTruthy();
  });

  it('T21: custom renderNavigation slot replaces default nav, callbacks still work', async () => {
    const store = makeStore(q1RequiredScript());

    await render(
      <Form
        store={store}
        slots={{
          renderNavigation: ({ onNext }) => (
            <TouchableOpacity testID="custom-nav" onPress={onNext}>
              <Text>Custom Nav</Text>
            </TouchableOpacity>
          ),
        }}
      />
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });

    expect(screen.getByTestId('custom-nav')).toBeTruthy();
    expect(screen.queryByTestId('nav-back')).toBeNull();
    expect(screen.queryByTestId('nav-next')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByTestId('custom-nav'));
    });
    expect(screen.getByTestId('required-indicator')).toBeTruthy();
  });

  it('T22: custom renderError slot replaces default required/constraint surfaces', async () => {
    const store = makeStore(q1RequiredScript());

    await render(
      <Form
        store={store}
        slots={{
          renderError: ({ block }) => (
            <Text testID="custom-error">{`custom:${block.type}:${block.message}`}</Text>
          ),
        }}
      />
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    expect(screen.getByTestId('custom-error')).toBeTruthy();
    expect(screen.getByText('custom:required:This field is required')).toBeTruthy();
  });

  it('T23: custom renderGroup slot replaces default group layout', async () => {
    const store = makeStore(groupScript());

    await render(
      <Form
        store={store}
        slots={{
          renderGroup: ({ event }) => (
            <Text testID="custom-group">{`custom-group:${
              event.kind === 'group' ? event.label : ''
            }`}</Text>
          ),
        }}
      />
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });

    expect(screen.getByTestId('custom-group')).toBeTruthy();
    expect(screen.getByText('custom-group:Group One')).toBeTruthy();
  });
});
