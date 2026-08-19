/**
 * T26/T27: validation.ts — defaultAdvanceValidator + resolveValidator
 * (design D7/D8, spec "form-validation-hooks").
 *
 * defaultAdvanceValidator cases are ported 1:1 from the pre-existing inline
 * `handleNext` logic (required-empty check, then CONSTRAINT_VIOLATED check).
 */

import { AnswerResult } from '@nuup/ts-rosa';
import {
  defaultAdvanceValidator,
  resolveValidator,
  type QuestionEvent,
} from '../../form/validation';
import type { ValidatorOverride } from '../../form/validation';
import type { NodeRef } from '../../adapter/FormAdapter';

function makeEvent(overrides: Partial<QuestionEvent> = {}): QuestionEvent {
  return {
    kind: 'question',
    ref: '/data/q1' as unknown as NodeRef,
    dataType: 'string',
    controlType: 'input',
    appearance: null,
    label: 'Name',
    hint: null,
    index: 0,
    rangeBounds: null,
    mediatype: null,
    ...overrides,
  };
}

function makeStore(opts: {
  value?: unknown;
  required?: boolean;
  constraintMsg?: string | null;
  lastResult?: { ref: NodeRef; result: AnswerResult } | null;
}) {
  return {
    lastAnswerResult: opts.lastResult ?? null,
    adapter: {
      resolveValue: () => opts.value ?? '',
      getNodeState: () => ({
        readonly: false,
        required: opts.required ?? false,
        relevant: true,
        enabled: true,
        constraintMsg: opts.constraintMsg ?? null,
        calculatedValue: null,
      }),
    },
  } as unknown as import('../../store/FormSessionStore').FormSessionStore;
}

describe('defaultAdvanceValidator', () => {
  it('returns null when value is present and not constraint-violated', () => {
    const event = makeEvent();
    const store = makeStore({ value: 'hello', required: true });
    const result = defaultAdvanceValidator({
      nodeRef: event.ref,
      store,
      event,
      defaultValidate: () => null,
    });
    expect(result).toBeNull();
  });

  it('blocks with required when required field is empty', () => {
    const event = makeEvent();
    const store = makeStore({ value: '', required: true });
    const result = defaultAdvanceValidator({
      nodeRef: event.ref,
      store,
      event,
      defaultValidate: () => null,
    });
    expect(result).toEqual({ type: 'required', message: 'This field is required' });
  });

  it('blocks with constraint when lastAnswerResult is CONSTRAINT_VIOLATED for this ref', () => {
    const event = makeEvent();
    const store = makeStore({
      value: 'bad',
      required: false,
      constraintMsg: 'Invalid value',
      lastResult: { ref: event.ref, result: AnswerResult.CONSTRAINT_VIOLATED },
    });
    const result = defaultAdvanceValidator({
      nodeRef: event.ref,
      store,
      event,
      defaultValidate: () => null,
    });
    expect(result).toEqual({ type: 'constraint', message: 'Invalid value' });
  });

  it('falls back to a generic message when constraintMsg is null', () => {
    const event = makeEvent();
    const store = makeStore({
      value: 'bad',
      required: false,
      constraintMsg: null,
      lastResult: { ref: event.ref, result: AnswerResult.CONSTRAINT_VIOLATED },
    });
    const result = defaultAdvanceValidator({
      nodeRef: event.ref,
      store,
      event,
      defaultValidate: () => null,
    });
    expect(result).toEqual({ type: 'constraint', message: 'Invalid value' });
  });

  it('ignores CONSTRAINT_VIOLATED from a different ref', () => {
    const event = makeEvent();
    const store = makeStore({
      value: 'ok',
      required: false,
      lastResult: {
        ref: '/data/other' as unknown as NodeRef,
        result: AnswerResult.CONSTRAINT_VIOLATED,
      },
    });
    const result = defaultAdvanceValidator({
      nodeRef: event.ref,
      store,
      event,
      defaultValidate: () => null,
    });
    expect(result).toBeNull();
  });
});

describe('resolveValidator', () => {
  it('returns null when no overrides registered', () => {
    expect(resolveValidator(makeEvent(), [])).toBeNull();
  });

  it('returns the matching override validator for controlType', () => {
    const custom = jest.fn(() => null);
    const overrides: ValidatorOverride[] = [{ match: { controlType: 'input' }, validate: custom }];
    expect(resolveValidator(makeEvent(), overrides)).toBe(custom);
  });

  it('returns null when no override matches the event', () => {
    const custom = jest.fn(() => null);
    const overrides: ValidatorOverride[] = [
      { match: { controlType: 'select1' }, validate: custom },
    ];
    expect(resolveValidator(makeEvent(), overrides)).toBeNull();
  });
});
