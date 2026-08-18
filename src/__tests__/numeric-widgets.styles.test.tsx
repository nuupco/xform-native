/**
 * Long/Int/Decimal widgets — Campo M3 field visual states (Phase 3, PR2).
 *
 * Regression behavior (draft binding, commit/reject, thousands-sep) is
 * covered by LongWidget.test.tsx / IntWidget.test.tsx / DecimalWidget.test.tsx
 * and must keep passing unmodified. This file covers the NEW visual states:
 * default/focus/blur/readonly styling, mono typography, left alignment.
 */
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AnswerResult, type DataType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../test-support/makeFakeSession';
import { LongWidget } from '../widgets/LongWidget';
import { IntWidget } from '../widgets/IntWidget';
import { DecimalWidget } from '../widgets/DecimalWidget';
import { tokens } from '../tokens/tokens';
import type { NodeRef } from '../adapter/FormAdapter';
import type { ControlType } from '@nuup/ts-rosa';

function flatten(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

function makeStoreFor(opts: {
  ref: string;
  dataType: DataType;
  controlType?: ControlType;
  value?: unknown;
  readonly?: boolean;
  appearance?: string | null;
}): { store: FormSessionStore; ref: NodeRef } {
  const script: FakeSessionScript = {
    events: [
      { kind: 'bof' },
      {
        kind: 'question',
        ref: opts.ref,
        dataType: opts.dataType,
        controlType: opts.controlType ?? 'input',
        label: 'Test field',
        hint: null,
        appearance: opts.appearance ?? null,
      },
      { kind: 'eof' },
    ],
    nodeStates: {
      [opts.ref]: {
        readonly: opts.readonly ?? false,
        required: false,
        relevant: true,
        enabled: true,
        constraintMsg: null,
        calculatedValue: null,
      },
    },
    relevance: { [opts.ref]: true },
    choices: {},
    answerResults: { [opts.ref]: AnswerResult.OK },
    values: { [opts.ref]: opts.value ?? null },
  };
  const session = makeFakeSession(script);
  const store = new FormSessionStore(session);
  store.stepForward();
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question event');
  return { store, ref: ev.ref };
}

describe.each([
  { name: 'LongWidget', Widget: LongWidget, testID: 'long-input', dataType: 'long' as DataType, ref: '/data/big' },
  { name: 'IntWidget', Widget: IntWidget, testID: 'int-input', dataType: 'int' as DataType, ref: '/data/age' },
  {
    name: 'DecimalWidget',
    Widget: DecimalWidget,
    testID: 'decimal-input',
    dataType: 'decimal' as DataType,
    ref: '/data/price',
  },
])('$name — Campo field visual states', ({ Widget, testID, dataType, ref }) => {
  it('default: mono typography, left-aligned, surfaceVariant field bg, 1px outline', async () => {
    const { store, ref: nodeRef } = makeStoreFor({ ref, dataType });
    await render(<Widget nodeRef={nodeRef} store={store} />);
    const style = flatten(screen.getByTestId(testID).props.style);
    expect(style.fontFamily).toBe(tokens.typography.mono.fontFamily);
    expect(style.fontSize).toBe(tokens.typography.mono.fontSize);
    expect(style.textAlign).toBe('left');
    expect(style.backgroundColor).toBe(tokens.color.roles.surface);
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBe(tokens.color.roles.outline);
  });

  it('focus: 2px primary border', async () => {
    const { store, ref: nodeRef } = makeStoreFor({ ref, dataType });
    await render(<Widget nodeRef={nodeRef} store={store} />);
    const input = screen.getByTestId(testID);
    await fireEvent(input, 'focus');
    const style = flatten(screen.getByTestId(testID).props.style);
    expect(style.borderWidth).toBe(2);
    expect(style.borderColor).toBe(tokens.color.roles.primary);
  });

  it('blur: returns to resting 1px outline border', async () => {
    const { store, ref: nodeRef } = makeStoreFor({ ref, dataType });
    await render(<Widget nodeRef={nodeRef} store={store} />);
    const input = screen.getByTestId(testID);
    await fireEvent(input, 'focus');
    await fireEvent(input, 'blur');
    const style = flatten(screen.getByTestId(testID).props.style);
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBe(tokens.color.roles.outline);
  });

  it('readonly: surfaceVariant@disabled-opacity', async () => {
    const { store, ref: nodeRef } = makeStoreFor({ ref, dataType, readonly: true });
    await render(<Widget nodeRef={nodeRef} store={store} />);
    const style = flatten(screen.getByTestId(testID).props.style);
    expect(style.backgroundColor).toBe(tokens.color.roles.surfaceVariant);
    expect(style.opacity).toBe(tokens.disabled.contentOpacity);
  });
});

describe('numeric widgets keep numeric keyboardType', () => {
  it('LongWidget uses number-pad', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/big', dataType: 'long' });
    await render(<LongWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('long-input').props.keyboardType).toBe('number-pad');
  });

  it('IntWidget uses number-pad', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/age', dataType: 'int' });
    await render(<IntWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('int-input').props.keyboardType).toBe('number-pad');
  });

  it('DecimalWidget uses decimal-pad', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/price', dataType: 'decimal' });
    await render(<DecimalWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('decimal-input').props.keyboardType).toBe('decimal-pad');
  });
});
