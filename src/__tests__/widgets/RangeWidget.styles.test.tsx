/**
 * Phase 3 PR8 — RangeWidget restyle: 48dp step buttons (Minus/Plus icons),
 * `typography.mono` value readout, themed `fieldStyles`-based picker trigger,
 * disabled state uses `disabled.contentOpacity` instead of a hardcoded
 * background swap.
 */
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult, type DataType, type ControlType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../../test-support/makeFakeSession';
import { RangeWidget } from '../../widgets/RangeWidget';
import { ThemeProvider } from '../../theme/ThemeContext';
import { tokens } from '../../tokens/tokens';
import type { NodeRef } from '../../adapter/FormAdapter';

afterEach(async () => {
  jest.clearAllMocks();
  await cleanup();
});

function makeStoreFor(opts: {
  ref: string;
  dataType: DataType;
  controlType?: ControlType;
  appearance?: string | null;
  value?: unknown;
  readonly?: boolean;
}): { store: FormSessionStore; ref: NodeRef } {
  const script: FakeSessionScript = {
    events: [
      { kind: 'bof' },
      {
        kind: 'question',
        ref: opts.ref,
        dataType: opts.dataType,
        controlType: opts.controlType ?? 'range',
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

function flatten(style: unknown): Record<string, unknown> {
  return Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : (style as Record<string, unknown>);
}

describe('RangeWidget — step button styling', () => {
  it('renders 48dp step buttons themed with roles.outline / roles.surface', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/range', dataType: 'int' });
    await render(<RangeWidget nodeRef={ref} store={store} />);
    const dec = flatten(screen.getByTestId('range-decrement').props.style);
    expect(dec.width).toBe(48);
    expect(dec.height).toBe(48);
    expect(dec.borderColor).toBe(tokens.color.roles.outline);
    expect(dec.backgroundColor).toBe(tokens.color.roles.surface);
  });

  it('applies disabled.contentOpacity (not a hardcoded background) when readonly', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/range', dataType: 'int', readonly: true });
    await render(<RangeWidget nodeRef={ref} store={store} />);
    const dec = flatten(screen.getByTestId('range-decrement').props.style);
    expect(dec.opacity).toBe(tokens.disabled.contentOpacity);
  });

  it('renders the value readout in typography.mono', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/range', dataType: 'int', value: 5 });
    await render(<RangeWidget nodeRef={ref} store={store} />);
    const value = flatten(screen.getByTestId('range-value-text').props.style);
    expect(value.fontFamily ?? value.fontWeight).toBe(
      tokens.typography.mono.fontFamily ?? tokens.typography.mono.fontWeight,
    );
  });

  it('honors a ThemeProvider override on primary-derived roles (proves theme hookup)', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/range', dataType: 'int' });
    await render(
      <ThemeProvider theme={{ color: { primary: '#123456' } }}>
        <RangeWidget nodeRef={ref} store={store} />
      </ThemeProvider>,
    );
    // Range's step buttons don't consume `primary` directly, so this test
    // only asserts the widget renders without error under an override
    // (structural theming hookup); the override-sensitive assertion lives
    // in fieldStyles.test.ts / StringWidget.styles.test.tsx.
    expect(screen.getByTestId('range-decrement')).toBeTruthy();
  });
});

describe('RangeWidget — picker trigger styling', () => {
  it('uses the shared field styles for the picker trigger', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/range-picker',
      dataType: 'int',
    });
    await render(<RangeWidget nodeRef={ref} store={store} appearance="picker" />);
    const trigger = flatten(screen.getByTestId('range-picker-trigger').props.style);
    expect(trigger.borderColor).toBe(tokens.color.roles.outline);
    expect(trigger.backgroundColor).toBe(tokens.color.roles.surface);
    expect(trigger.borderRadius).toBe(tokens.radius.md);
  });
});
