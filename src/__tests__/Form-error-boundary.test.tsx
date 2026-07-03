/**
 * Form.tsx + WidgetErrorBoundary integration.
 *
 * REQ: Widget Error Boundary — Form.tsx must wrap the question-rendering
 * widget subtree in a WidgetErrorBoundary keyed by the same stable
 * per-instance key as the Widget, so a throwing widget shows a fallback
 * instead of crashing the whole Form, and nav controls stay usable.
 */
import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession } from '../test-support/makeFakeSession';
import { Form } from '../form/Form';

jest.mock('../widgets/pickWidget', () => {
  const actual = jest.requireActual('../widgets/pickWidget');
  return {
    ...actual,
    pickWidget: (
      dataType: string,
      controlType: string,
      appearance: string | null,
      readonly: boolean,
      mediatype?: string | null,
    ) => {
      if (dataType === 'throwing-type') {
        function ThrowingWidget(): never {
          throw new Error('widget render failure');
        }
        return { Widget: ThrowingWidget, variant: 'default' };
      }
      return actual.pickWidget(dataType, controlType, appearance, readonly, mediatype);
    },
  };
});

afterEach(async () => {
  jest.restoreAllMocks();
  await cleanup();
});

function makeStore() {
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/bad',
          dataType: 'throwing-type' as any,
          controlType: 'input',
          label: 'Broken Question',
          hint: null,
          appearance: null,
        },
        {
          kind: 'question',
          ref: '/data/good',
          dataType: 'string',
          controlType: 'input',
          label: 'Good Question',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/bad': {
          readonly: false,
          required: false,
          relevant: true,
          enabled: true,
          constraintMsg: null,
          calculatedValue: null,
        },
        '/data/good': {
          readonly: false,
          required: false,
          relevant: true,
          enabled: true,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/bad': true, '/data/good': true },
      choices: {},
      answerResults: {},
      values: { '/data/bad': '', '/data/good': '' },
    }),
  );
}

describe('Form — WidgetErrorBoundary integration', () => {
  it('shows a fallback instead of crashing when a widget throws, nav stays usable', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const store = makeStore();
    store.stepForward(); // bof -> bad question
    await render(<Form store={store} />);

    expect(screen.queryByText('Broken Question')).toBeTruthy();
    expect(screen.getByTestId('nav-next')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByText('Good Question')).toBeTruthy();
    expect(screen.getByTestId('string-input')).toBeTruthy();
    errorSpy.mockRestore();
  });
});
