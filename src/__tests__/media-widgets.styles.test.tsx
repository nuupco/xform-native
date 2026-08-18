/**
 * media-widgets.styles.test.tsx — Image/File/Barcode MediaCaptureCard wiring
 * (design decision 7, per-widget mapping table, PR11).
 */
import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession } from '../test-support/makeFakeSession';
import { ImageWidget } from '../widgets/ImageWidget';
import { FileWidget } from '../widgets/FileWidget';
import { BarcodeWidget } from '../widgets/BarcodeWidget';
import { tokens } from '../tokens/tokens';

function flatten(style: unknown) {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]));
}

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeQuestionStore(
  ref: string,
  overrides: { value?: unknown; readonly?: boolean; appearance?: string | null } = {},
) {
  const { value = '', readonly = false, appearance = null } = overrides;
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref,
          dataType: 'binary',
          controlType: 'upload',
          label: 'Field',
          hint: null,
          appearance,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        [ref]: {
          relevant: true,
          enabled: true,
          required: false,
          readonly,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { [ref]: true },
      choices: {},
      answerResults: { [ref]: AnswerResult.OK },
      values: { [ref]: value },
    }),
  );
}

function getRef(store: FormSessionStore) {
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev;
}

describe('ImageWidget — MediaCaptureCard wiring', () => {
  it('disables both actions when readonly', async () => {
    const store = makeQuestionStore('/data/img', { readonly: true });
    store.stepForward();
    const ev = getRef(store);
    await render(<ImageWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    expect(screen.getByTestId('image-camera-button').props.accessibilityState?.disabled).toBe(
      true,
    );
    expect(screen.getByTestId('image-library-button').props.accessibilityState?.disabled).toBe(
      true,
    );
  });
});

describe('FileWidget — MediaCaptureCard wiring', () => {
  it('renders the Pick File action through MediaCaptureCard', async () => {
    const store = makeQuestionStore('/data/file');
    store.stepForward();
    const ev = getRef(store);
    await render(<FileWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    expect(screen.getByTestId('file-widget')).toBeTruthy();
    expect(screen.getByTestId('file-pick-button')).toBeTruthy();
    expect(screen.getByText('Pick File')).toBeTruthy();
  });
});

describe('BarcodeWidget — mono value readout + reticle overlay', () => {
  it('renders the scanned value in typography.mono', async () => {
    const store = makeQuestionStore('/data/barcode', { value: 'ABC-1', appearance: 'barcode' });
    store.stepForward();
    const ev = getRef(store);
    await render(<BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    const flat = flatten(screen.getByText('ABC-1').props.style);
    expect(flat.fontFamily).toBe(tokens.typography.mono.fontFamily);
  });

  it('renders a reticle overlay above the camera while scanning', async () => {
    const store = makeQuestionStore('/data/barcode', { appearance: 'barcode' });
    store.stepForward();
    const ev = getRef(store);
    await render(<BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('barcode-scan-button'));
    });
    expect(screen.getByTestId('barcode-camera')).toBeTruthy();
  });

  it('renders the readonly value in typography.mono', async () => {
    const store = makeQuestionStore('/data/barcode', {
      value: 'RO-1',
      readonly: true,
      appearance: 'barcode',
    });
    store.stepForward();
    const ev = getRef(store);
    await render(<BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    const flat = flatten(screen.getByText('RO-1').props.style);
    expect(flat.fontFamily).toBe(tokens.typography.mono.fontFamily);
  });
});
