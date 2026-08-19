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
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession } from '../../test-support/makeFakeSession';
import { BarcodeWidget } from '../../widgets/BarcodeWidget';

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
      <BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('barcode-scan-button')).toBeTruthy();
  });

  it('opens camera on button press', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
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
      <BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
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
      <BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
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
      <BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
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
      <BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
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

describe('BarcodeWidget camera permission gate', () => {
  it('shows rationale notice and does not open camera when permission is undetermined', async () => {
    mockCamera.getCameraPermissionsAsync.mockResolvedValueOnce({
      status: 'undetermined',
      granted: false,
      canAskAgain: true,
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('barcode-scan-button'));
    });
    expect(screen.getByTestId('permission-notice')).toBeTruthy();
    expect(screen.queryByTestId('barcode-camera')).toBeNull();
    expect(screen.getByText('Usar la cámara')).toBeTruthy();
  });

  it('re-requests permission on rationale primary press and opens camera when granted', async () => {
    mockCamera.getCameraPermissionsAsync.mockResolvedValueOnce({
      status: 'undetermined',
      granted: false,
      canAskAgain: true,
    });
    mockCamera.requestCameraPermissionsAsync.mockResolvedValueOnce({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('barcode-scan-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('permission-notice-primary'));
    });
    expect(screen.getByTestId('barcode-camera')).toBeTruthy();
  });

  it('shows denied notice with dismiss action when permission is denied but retryable', async () => {
    mockCamera.getCameraPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: true,
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('barcode-scan-button'));
    });
    expect(screen.getByText('Sin permiso de cámara')).toBeTruthy();
    expect(screen.getByTestId('permission-notice-dismiss')).toBeTruthy();
    expect(screen.queryByTestId('barcode-camera')).toBeNull();
  });

  it('shows blocked notice with "Abrir ajustes" and no dismiss when permission cannot be asked again', async () => {
    mockCamera.getCameraPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: false,
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('barcode-scan-button'));
    });
    expect(screen.getByText('Permiso de cámara bloqueado')).toBeTruthy();
    expect(screen.getByText('Abrir ajustes')).toBeTruthy();
    expect(screen.queryByTestId('permission-notice-dismiss')).toBeNull();
    expect(screen.queryByTestId('barcode-camera')).toBeNull();
  });

  it('gates re-scan the same way as initial scan', async () => {
    mockCamera.getCameraPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: true,
    });
    const store = makeStore('OLD-123');
    store.stepForward();
    const ev = getRef(store);
    await render(
      <BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('barcode-rescan-button'));
    });
    expect(screen.getByTestId('permission-notice')).toBeTruthy();
    expect(screen.queryByTestId('barcode-camera')).toBeNull();
  });
});

describe('BarcodeWidget readonly mode', () => {
  it('shows value but disables scan button when readonly', async () => {
    const store = makeStore('READ-ONLY-99', true);
    store.stepForward();
    const ev = getRef(store);
    await render(
      <BarcodeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByText('READ-ONLY-99')).toBeTruthy();
    expect(screen.queryByTestId('barcode-scan-button')).toBeNull();
  });
});
