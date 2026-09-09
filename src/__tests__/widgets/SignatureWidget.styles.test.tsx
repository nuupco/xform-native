/**
 * SignatureWidget.styles.test.tsx — Campo theming for the signature canvas
 * frame and action row (design doc, per-widget mapping table, PR13).
 *
 * The pad itself now lives inside react-native-signature-canvas's WebView
 * (mocked in tests) — only the surrounding frame and the action row
 * (Cancelar/Limpiar/Guardar), which still reuses `PressableButton`
 * (decision 7, "action row only" annotation), are themed on our side.
 */
import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession } from '../../test-support/makeFakeSession';
import { SignatureWidget } from '../../widgets/SignatureWidget';
import { tokens } from '../../tokens/tokens';

function flatten(style: unknown) {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]));
}

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStore(readonly = false) {
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/sig',
          dataType: 'binary',
          controlType: 'upload',
          label: 'Signature',
          hint: null,
          appearance: 'draw',
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/sig': {
          relevant: true,
          enabled: true,
          required: false,
          readonly,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/sig': true },
      choices: {},
      answerResults: { '/data/sig': AnswerResult.OK },
      values: { '/data/sig': '' },
    }),
  );
}

function getRef(store: FormSessionStore) {
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev;
}

async function openModal(store: FormSessionStore, ev: ReturnType<typeof getRef>) {
  await render(
    <SignatureWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
  );
  await act(async () => {
    fireEvent.press(screen.getByTestId('signature-open-button'));
  });
}

describe('SignatureWidget — Campo theming', () => {
  it('canvas frame uses roles.surface background for ink contrast', async () => {
    const store = makeStore(false);
    store.stepForward();
    const ev = getRef(store);
    await openModal(store, ev);
    const canvas = flatten(screen.getByTestId('signature-canvas').props.style);
    expect(canvas.backgroundColor).toBe(tokens.color.roles.surface);
  });

  it('action row buttons use PressableButton (accessibilityRole button, disabled matrix)', async () => {
    const store = makeStore(false);
    store.stepForward();
    const ev = getRef(store);
    await openModal(store, ev);
    const clearBtn = screen.getByTestId('signature-clear-button');
    const saveBtn = screen.getByTestId('signature-save-button');
    expect(clearBtn.props.accessibilityRole).toBe('button');
    expect(saveBtn.props.accessibilityRole).toBe('button');
  });
});
