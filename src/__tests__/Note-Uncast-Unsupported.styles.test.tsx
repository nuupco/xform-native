/**
 * Phase 3 PR9 — Note/Uncast/Unsupported restyle:
 *  - NoteWidget: `secondaryContainer` band, `radius.md`, `bodyMedium`, no italic.
 *  - UncastWidget: `surfaceVariant` background, value in `typography.mono`.
 *  - UnsupportedWidget: `errorContainer` background + 1px `roles.error` border, `bodySmall`.
 */
import { render, screen, cleanup } from '@testing-library/react-native';
import { AnswerResult, type DataType, type ControlType } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../test-support/makeFakeSession';
import { NoteWidget } from '../widgets/NoteWidget';
import { UncastWidget } from '../widgets/UncastWidget';
import { UnsupportedWidget } from '../widgets/UnsupportedWidget';
import { ThemeProvider } from '../theme/ThemeContext';
import { tokens } from '../tokens/tokens';
import type { NodeRef } from '../adapter/FormAdapter';

afterEach(async () => {
  jest.clearAllMocks();
  await cleanup();
});

function makeStoreFor(opts: {
  ref: string;
  dataType: DataType;
  controlType?: ControlType;
  value?: unknown;
}): { store: FormSessionStore; ref: NodeRef } {
  const script: FakeSessionScript = {
    events: [
      { kind: 'bof' },
      {
        kind: 'question',
        ref: opts.ref,
        dataType: opts.dataType,
        controlType: opts.controlType ?? 'note',
        label: 'Test field',
        hint: null,
        appearance: null,
      },
      { kind: 'eof' },
    ],
    nodeStates: {
      [opts.ref]: {
        readonly: false,
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

describe('NoteWidget — styling', () => {
  it('renders the secondaryContainer band with radius.md and bodyMedium text (no italic)', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/note', dataType: 'string', value: 'Hello' });
    await render(<NoteWidget nodeRef={ref} store={store} />);
    const container = flatten(screen.getByTestId('note-widget').props.style);
    expect(container.backgroundColor).toBe(tokens.color.roles.secondaryContainer);
    expect(container.borderRadius).toBe(tokens.radius.md);

    const text = flatten(screen.getByText('Hello').props.style);
    expect(text.fontSize).toBe(tokens.typography.bodyMedium.fontSize);
    expect(text.fontStyle).not.toBe('italic');
  });

  it('honors a ThemeProvider override without crashing (structural hookup)', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/note', dataType: 'string', value: 'Hi' });
    await render(
      <ThemeProvider theme={{ color: { primary: '#123456' } }}>
        <NoteWidget nodeRef={ref} store={store} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('note-widget')).toBeTruthy();
  });
});

describe('UncastWidget — styling', () => {
  it('renders surfaceVariant background with the value in typography.mono', async () => {
    const { store, ref } = makeStoreFor({ ref: '/data/uncast', dataType: 'string', value: 'raw-value' });
    await render(<UncastWidget nodeRef={ref} store={store} />);
    const container = flatten(screen.getByTestId('uncast-widget').props.style);
    expect(container.backgroundColor).toBe(tokens.color.roles.surfaceVariant);

    const value = flatten(screen.getByText('raw-value').props.style);
    expect(value.fontFamily).toBe(tokens.typography.mono.fontFamily);
  });
});

describe('UnsupportedWidget — styling', () => {
  it('renders errorContainer background with a 1px roles.error border and bodySmall text', async () => {
    await render(<UnsupportedWidget dataType="unknown" />);
    const container = flatten(screen.getByTestId('unsupported-widget').props.style);
    expect(container.backgroundColor).toBe(tokens.color.roles.errorContainer);
    expect(container.borderWidth).toBe(1);
    expect(container.borderColor).toBe(tokens.color.roles.error);

    const label = flatten(screen.getByText(/Unsupported field type/).props.style);
    expect(label.fontSize).toBe(tokens.typography.bodySmall.fontSize);
  });
});
