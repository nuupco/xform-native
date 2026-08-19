/**
 * T28-T32: Form.tsx validation-registry wiring (design D7/D8, spec
 * "form-validation-hooks").
 *
 * T30: with no custom validators registered, behavior must be byte-identical
 * to pre-change Form.tsx (regression, non-negotiable).
 * T31: a custom validator registered for a controlType overrides default
 * blocking behavior for that controlType.
 * T32: non-overridden controlTypes still use the extracted default logic.
 */

import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import type { ControlType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { Form } from '../../form/Form';
import { makeFakeSession } from '../../test-support/makeFakeSession';
import type { ValidatorOverride } from '../../form/validation';

afterEach(async () => {
  await cleanup();
});

function makeStore(script: Parameters<typeof makeFakeSession>[0]) {
  return new FormSessionStore(makeFakeSession(script));
}

function q1Script(
  overrides: Partial<Record<string, unknown>> = {},
  controlType: ControlType = 'input' as ControlType
) {
  return {
    events: [
      { kind: 'bof' as const },
      {
        kind: 'question' as const,
        ref: '/data/q1',
        dataType: 'string' as const,
        controlType,
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
    answerResults: { '/data/q1': AnswerResult.OK },
    values: { '/data/q1': '' },
    ...overrides,
  };
}

async function start() {
  await act(async () => {
    fireEvent.press(screen.getByTestId('bof-start-button'));
  });
}

describe('Form — validation-registry wiring', () => {
  it('T30: no custom validators registered -> required-empty blocks exactly like before', async () => {
    const store = makeStore(q1Script());
    await render(<Form store={store} />);
    await start();

    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    expect(screen.getByTestId('required-message')).toBeTruthy();
  });

  it('T31: custom validator for controlType "note" overrides default (bypasses required block)', async () => {
    const store = makeStore(q1Script({}, 'note' as ControlType));
    const alwaysAllow: ValidatorOverride = {
      match: { controlType: 'note' as ControlType },
      validate: () => null,
    };
    await render(<Form store={store} validators={[alwaysAllow]} />);
    await start();

    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    expect(screen.queryByTestId('required-message')).toBeNull();
  });

  it('T31b: custom validator can block with a custom type/message', async () => {
    const store = makeStore(q1Script({}, 'note' as ControlType));
    const alwaysBlock: ValidatorOverride = {
      match: { controlType: 'note' as ControlType },
      validate: () => ({ type: 'custom-rule', message: 'Nope' }),
    };
    await render(<Form store={store} validators={[alwaysBlock]} />);
    await start();

    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    expect(screen.getByText('Nope')).toBeTruthy();
  });

  it('T32: non-overridden controlType ("input") still uses default validation when a "note" validator is registered', async () => {
    const store = makeStore(q1Script({}, 'input'));
    const alwaysAllow: ValidatorOverride = {
      match: { controlType: 'note' as ControlType },
      validate: () => null,
    };
    await render(<Form store={store} validators={[alwaysAllow]} />);
    await start();

    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    expect(screen.getByTestId('required-message')).toBeTruthy();
  });

  it('composes over defaultValidate via ctx.defaultValidate()', async () => {
    const store = makeStore(q1Script({}, 'note' as ControlType));
    const compose: ValidatorOverride = {
      match: { controlType: 'note' as ControlType },
      validate: (ctx) => ctx.defaultValidate(),
    };
    await render(<Form store={store} validators={[compose]} />);
    await start();

    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    expect(screen.getByTestId('required-message')).toBeTruthy();
  });
});
