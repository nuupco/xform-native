/**
 * BarcodeWidget tests — camera barcode scan.
 *
 * Uses mocked expo-camera.
 */
import { act } from 'react';
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession } from '../test-support/makeFakeSession';
import { BarcodeWidget } from '../widgets/BarcodeWidget';

const mockCamera = require('expo-camera');

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStore(
  value: string | null = null,
  readonly = false,
) {
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/barcode',
          dataType: 'binary',
          controlType: 'input',
          label: 'Barcode',
          hint: null,
          appearance: 'barcode',
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/barcode': {
          relevant: true,
          enabled: true,
          required: false,
          readonly,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/barcode': true },
      choices: {},
      answerResults: { '/data/barcode': AnswerResult.OK },
      values: { '/data/barcode': value },
    }),
  );
}

function getRef(store: FormSessionStore) {
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev;
}

describe('BarcodeWidget', () => {
  it('renders "Scan Barcode" button when no value exists', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <BarcodeWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('barcode-scan-button')).toBeTruthy();
  });

  it('opens camera on button press', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <BarcodeWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('barcode-scan-button'));
    });
    expect(screen.getByTestId('barcode-camera')).toBeTruthy();
  });

  it('stores barcode value on scan detection', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <BarcodeWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('barcode-scan-button'));
    });
    await act(async () => {
      mockCamera.__triggerBarcode('TEST-12345');
    });
    expect(answerSpy).toHaveBeenCalledWith(ev.ref, 'TEST-12345');
  });

  it('shows scanned value and re-scan button after scan', async () => {
    const store = makeStore('OLD-123');
    store.stepForward();
    const ev = getRef(store);
    await render(
      <BarcodeWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByText('OLD-123')).toBeTruthy();
    expect(screen.getByTestId('barcode-rescan-button')).toBeTruthy();
  });

  it('re-scan clears value and reopens camera', async () => {
    const store = makeStore('OLD-123');
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <BarcodeWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('barcode-rescan-button'));
    });
    expect(screen.getByTestId('barcode-camera')).toBeTruthy();
    await act(async () => {
      mockCamera.__triggerBarcode('NEW-999');
    });
    expect(answerSpy).toHaveBeenCalledWith(ev.ref, 'NEW-999');
  });

  it('closes camera after scan', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <BarcodeWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('barcode-scan-button'));
    });
    expect(screen.getByTestId('barcode-camera')).toBeTruthy();
    await act(async () => {
      mockCamera.__triggerBarcode('SCAN-001');
    });
    expect(screen.queryByTestId('barcode-camera')).toBeNull();
  });
});

describe('BarcodeWidget readonly mode', () => {
  it('shows value but disables scan button when readonly', async () => {
    const store = makeStore('READ-ONLY-99', true);
    store.stepForward();
    const ev = getRef(store);
    await render(
      <BarcodeWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByText('READ-ONLY-99')).toBeTruthy();
    expect(screen.queryByTestId('barcode-scan-button')).toBeNull();
  });
});
