/**
 * T6/T7: Form.tsx widget registry wiring (design D5, spec "Custom widget
 * implements contract").
 *
 * T6: <Form widgets> prop entries win the tie-break over
 *     WidgetRegistryProvider context entries at equal matchScore.
 * T7: a custom widget implementing XFormWidgetProps can call
 *     useFormSession(store) and commit via store.answerQuestion, identically
 *     to a built-in widget.
 */

import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { Form } from '../form/Form';
import { makeFakeSession } from '../test-support/makeFakeSession';
import { WidgetRegistryProvider } from '../widgets/registry';
import type { XFormWidgetProps, WidgetOverride } from '../widgets/registry';
import { useFormSession } from '../store/useFormSession';

afterEach(async () => {
  await cleanup();
});

function makeStore(script: Parameters<typeof makeFakeSession>[0]) {
  return new FormSessionStore(makeFakeSession(script));
}

function q1Script(overrides: Partial<Record<string, unknown>> = {}) {
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
        required: false,
        relevant: true,
        enabled: true,
        constraintMsg: null,
        calculatedValue: null,
      },
    },
    relevance: { '/data/q1': true },
    choices: {},
    answerResults: { '/data/q1': AnswerResult.OK },
    values: { '/data/q1': '' },
    ...overrides,
  };
}

function ContextWidget(_props: XFormWidgetProps) {
  return <Text testID="context-widget">from-context</Text>;
}

function PropWidget(_props: XFormWidgetProps) {
  return <Text testID="prop-widget">from-prop</Text>;
}

describe('Form — widget registry wiring', () => {
  it('T6: <Form widgets> prop wins tie-break over WidgetRegistryProvider context', async () => {
    const store = makeStore(q1Script());
    const contextOverride: WidgetOverride = {
      match: { controlType: 'input', dataType: 'string' },
      Widget: ContextWidget,
    };
    const propOverride: WidgetOverride = {
      match: { controlType: 'input', dataType: 'string' },
      Widget: PropWidget,
    };

    await render(
      <WidgetRegistryProvider widgets={[contextOverride]}>
        <Form store={store} widgets={[propOverride]} />
      </WidgetRegistryProvider>
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });

    expect(screen.getByTestId('prop-widget')).toBeTruthy();
    expect(screen.queryByTestId('context-widget')).toBeNull();
  });

  it('T7: a custom widget can useFormSession(store) and commit via store.answerQuestion', async () => {
    const store = makeStore(q1Script());

    function CustomWidget({ nodeRef, store: s }: XFormWidgetProps) {
      useFormSession(s);
      return (
        <View>
          <TouchableOpacity
            testID="custom-commit"
            onPress={() => s.answerQuestion(nodeRef, 'hello')}
          >
            <Text>Commit</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const override: WidgetOverride = {
      match: { controlType: 'input', dataType: 'string' },
      Widget: CustomWidget,
    };

    await render(<Form store={store} widgets={[override]} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });

    expect(screen.getByTestId('custom-commit')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('custom-commit'));
    });
    expect(store.lastAnswerResult?.ref).toBeDefined();
    expect(store.lastAnswerResult?.result).toBe(AnswerResult.OK);
  });
});
