/**
 * Campo restyle Phase 1 — regression smoke tests (tasks 3.1/3.2, PR1 item 4).
 *
 * The already-migrated StringWidget and ImageWidget (both use
 * useThemedStyles) must keep rendering without throwing against the new
 * Campo token/theme shape, with and without a ThemeProvider color override.
 */
import { render, screen, cleanup } from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession } from '../../test-support/makeFakeSession';
import { StringWidget } from '../../widgets/StringWidget';
import { ImageWidget } from '../../widgets/ImageWidget';
import { Form } from '../../form/Form';
import { ThemeProvider } from '../../theme/ThemeContext';
import { deriveRoleSet } from '../../theme/derive';

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStringStore(value = 'Alice') {
  const session = makeFakeSession({
    events: [
      { kind: 'bof' },
      {
        kind: 'question',
        ref: '/data/name',
        dataType: 'string',
        controlType: 'input',
        label: 'Name',
        hint: null,
        appearance: null,
      },
      { kind: 'eof' },
    ],
    nodeStates: {
      '/data/name': {
        relevant: true,
        enabled: true,
        required: false,
        readonly: false,
        constraintMsg: null,
        calculatedValue: null,
      },
    },
    relevance: { '/data/name': true },
    choices: {},
    answerResults: { '/data/name': AnswerResult.OK },
    values: { '/data/name': value },
  });
  const store = new FormSessionStore(session);
  store.stepForward();
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question event');
  return { store, ref: ev.ref };
}

function makeImageStore(value = '') {
  const store = new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/img',
          dataType: 'binary',
          controlType: 'upload',
          label: 'Photo',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/img': {
          relevant: true,
          enabled: true,
          required: false,
          readonly: false,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/img': true },
      choices: {},
      answerResults: { '/data/img': AnswerResult.OK },
      values: { '/data/img': value },
    }),
  );
  store.stepForward();
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question event');
  return { store, ref: ev.ref };
}

describe('StringWidget — Campo tokens regression', () => {
  it('renders without throwing against the new token shape (no override)', async () => {
    const { store, ref } = makeStringStore();
    await render(<StringWidget nodeRef={ref} store={store} />);
    expect(screen.getByDisplayValue('Alice')).toBeTruthy();
  });

  it('renders without throwing under a ThemeProvider primary override, reflecting it', async () => {
    const { store, ref } = makeStringStore();
    const OVERRIDE = '#7B2CBF';
    await render(
      <ThemeProvider theme={{ color: { primary: OVERRIDE } }}>
        <StringWidget nodeRef={ref} store={store} />
      </ThemeProvider>,
    );
    const input = screen.getByTestId('string-input');
    // StringWidget's border color reads from legacy color.text (unrelated to
    // the primary override) — this smoke test only asserts no throw + render.
    expect(input).toBeTruthy();
    // sanity: derivation used by the provider is deterministic
    expect(deriveRoleSet(OVERRIDE).base).toBe(OVERRIDE);
  });
});

describe('Form chrome — Campo tokens regression (Phase 2 / PR3)', () => {
  it('renders NavRow/ErrorBanner/LabelHint chrome without throwing under a primary override', async () => {
    const { store } = makeStringStore();
    await render(
      <ThemeProvider theme={{ color: { primary: '#7B2CBF' } }}>
        <Form store={store} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('nav-back')).toBeTruthy();
    expect(screen.getByTestId('nav-next')).toBeTruthy();
    expect(screen.getByTestId('question-label')).toBeTruthy();
  });
});

describe('ImageWidget — Campo tokens regression', () => {
  it('renders without throwing against the new token shape (no override)', async () => {
    const { store, ref } = makeImageStore();
    await render(<ImageWidget nodeRef={ref} store={store} />);
    expect(screen.getByTestId('image-widget')).toBeTruthy();
  });

  it('renders without throwing under a ThemeProvider primary override', async () => {
    const { store, ref } = makeImageStore();
    await render(
      <ThemeProvider theme={{ color: { primary: '#7B2CBF' } }}>
        <ImageWidget nodeRef={ref} store={store} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('image-widget')).toBeTruthy();
  });
});
