/**
 * StringWidget — Campo M3 field visual states (Phase 3, PR2).
 *
 * Regression behavior (value binding, onChangeText, readonly) is covered by
 * Form.test.tsx / widgets.test.tsx / campo-theme-regression.test.tsx and
 * must keep passing unmodified. This file covers the NEW visual states only:
 * default/focus/blur/readonly styling + multiline growth + theme override.
 */
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AnswerResult, type DataType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../test-support/makeFakeSession';
import { StringWidget } from '../widgets/StringWidget';
import { ThemeProvider } from '../theme/ThemeContext';
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

describe('StringWidget — Campo field visual states', () => {
  it('default: surfaceVariant bg, 1px outline border, top-corners-only radius, bodyLarge text', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/name', dataType: 'string' });
    await render(<StringWidget nodeRef={ref} store={store} />);
    const style = flatten(screen.getByTestId('string-input').props.style);
    expect(style.backgroundColor).toBe(tokens.color.roles.surfaceVariant);
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBe(tokens.color.roles.outline);
    expect(style.borderTopLeftRadius).toBe(tokens.radius.md);
    expect(style.borderTopRightRadius).toBe(tokens.radius.md);
    expect(style.borderBottomLeftRadius).toBe(0);
    expect(style.borderBottomRightRadius).toBe(0);
    expect(style.fontSize).toBe(tokens.typography.bodyLarge.fontSize);
  });

  it('focus: 2px primary border + elevation 2 tint', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/name', dataType: 'string' });
    await render(<StringWidget nodeRef={ref} store={store} />);
    const input = screen.getByTestId('string-input');
    await fireEvent(input, 'focus');
    const style = flatten(screen.getByTestId('string-input').props.style);
    expect(style.borderWidth).toBe(2);
    expect(style.borderColor).toBe(tokens.color.roles.primary);
    expect(style.backgroundColor).not.toBe(tokens.color.roles.surfaceVariant);
  });

  it('blur: returns to resting 1px outline border', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/name', dataType: 'string' });
    await render(<StringWidget nodeRef={ref} store={store} />);
    const input = screen.getByTestId('string-input');
    await fireEvent(input, 'focus');
    await fireEvent(input, 'blur');
    const style = flatten(screen.getByTestId('string-input').props.style);
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBe(tokens.color.roles.outline);
  });

  it('readonly: surfaceVariant@disabled-opacity, underline removed', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/name', dataType: 'string', readonly: true });
    await render(<StringWidget nodeRef={ref} store={store} />);
    const style = flatten(screen.getByTestId('string-input').props.style);
    expect(style.backgroundColor).toBe(tokens.color.roles.surfaceVariant);
    expect(style.opacity).toBe(tokens.disabled.contentOpacity);
    expect(style.borderWidth).toBe(0);
  });

  it('multiline variant: min-3-line height, max-8-line growth cap', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/bio',
      dataType: 'string',
      appearance: 'multiline',
    });
    await render(<StringWidget nodeRef={ref} store={store} appearance="multiline" />);
    const style = flatten(screen.getByTestId('string-input').props.style);
    const lineHeight = tokens.typography.bodyLarge.lineHeight;
    expect(style.minHeight).toBeGreaterThanOrEqual(lineHeight * 3);
    expect(style.maxHeight).toBeLessThanOrEqual(lineHeight * 8 + 24);
    expect(style.maxHeight).toBeGreaterThan(style.minHeight as number);
  });

  it('theme override reaches focus border color', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/name', dataType: 'string' });
    const OVERRIDE = '#7B2CBF';
    await render(
      <ThemeProvider theme={{ color: { primary: OVERRIDE } }}>
        <StringWidget nodeRef={ref} store={store} />
      </ThemeProvider>,
    );
    const input = screen.getByTestId('string-input');
    await fireEvent(input, 'focus');
    const style = flatten(screen.getByTestId('string-input').props.style);
    expect(style.borderColor).toBe(OVERRIDE);
  });
});
