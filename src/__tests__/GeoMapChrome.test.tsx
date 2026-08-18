/**
 * GeoMapChrome — unit tests for the shared geo overlay primitives extracted
 * from GeoPointWidget/GeoTraceWidget/GeoShapeWidget (Phase 3, PR14).
 *
 * This is ADDITIVE coverage for the primitives in isolation. It does not
 * replace the existing GeoPointWidget.test.tsx / GeoTraceWidget.test.tsx /
 * GeoShapeWidget.test.tsx (+ .absent.) regression suites, which must keep
 * passing unmodified.
 */
import { act } from 'react';
import { Text } from 'react-native';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import {
  GeoMapChrome,
  MapActionButton,
  GpsStatusPill,
  PrewarmStatusPill,
  GeoActionBar,
} from '../widgets/primitives/GeoMapChrome';

afterEach(async () => {
  await cleanup();
});

describe('GeoMapChrome', () => {
  it('renders its children inside the overlay container', async () => {
    await render(
      <GeoMapChrome>
        <Text testID="child">map</Text>
      </GeoMapChrome>,
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });
});

describe('MapActionButton', () => {
  it('renders the icon glyph and forwards testID', async () => {
    await render(<MapActionButton icon="⊙" onPress={() => {}} testID="action-btn" />);
    expect(screen.getByTestId('action-btn')).toBeTruthy();
    expect(screen.getByText('⊙')).toBeTruthy();
  });

  it('fires onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<MapActionButton icon="⤓" onPress={onPress} testID="action-btn" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('action-btn'));
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('respects disabled', async () => {
    const onPress = jest.fn();
    await render(<MapActionButton icon="⊙" onPress={onPress} disabled testID="action-btn" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('action-btn'));
    });
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('GpsStatusPill', () => {
  it('shows the acquiring copy by default', async () => {
    await render(<GpsStatusPill status="idle" />);
    expect(screen.getByText('Adquiriendo señal GPS…')).toBeTruthy();
  });

  it('shows accuracy when tracking with a fix', async () => {
    await render(<GpsStatusPill status="tracking" accuracyM={4.2} />);
    expect(screen.getByText('GPS ±4.2 m')).toBeTruthy();
  });

  it('shows the denied copy', async () => {
    await render(<GpsStatusPill status="denied" />);
    expect(screen.getByText('Sin permiso de ubicación')).toBeTruthy();
  });

  it('shows the error copy', async () => {
    await render(<GpsStatusPill status="error" />);
    expect(screen.getByText('No se pudo obtener la ubicación')).toBeTruthy();
  });
});

describe('PrewarmStatusPill', () => {
  it('renders nothing when idle', async () => {
    const { toJSON } = await render(
      <PrewarmStatusPill status="idle" testID="prewarm-status" />,
    );
    expect(toJSON()).toBeNull();
  });

  it('shows the running copy with the given testID', async () => {
    await render(<PrewarmStatusPill status="running" testID="prewarm-status" />);
    expect(screen.getByTestId('prewarm-status')).toBeTruthy();
    expect(screen.getByText('Descargando mapas sin conexión…')).toBeTruthy();
  });

  it('shows the done copy', async () => {
    await render(<PrewarmStatusPill status="done" testID="prewarm-status" />);
    expect(screen.getByText('Mapas descargados para uso sin conexión')).toBeTruthy();
  });

  it('shows the cap copy', async () => {
    await render(<PrewarmStatusPill status="cap" testID="prewarm-status" />);
    expect(screen.getByText('Límite de almacenamiento alcanzado')).toBeTruthy();
  });

  it('shows the error copy', async () => {
    await render(<PrewarmStatusPill status="error" testID="prewarm-status" />);
    expect(screen.getByText('No se pudieron descargar los mapas')).toBeTruthy();
  });
});

describe('GeoActionBar', () => {
  it('always renders accept and cancel', async () => {
    const accept = jest.fn();
    const cancel = jest.fn();
    await render(
      <GeoActionBar
        accept={{ onPress: accept, testID: 'accept-btn' }}
        cancel={{ onPress: cancel, testID: 'cancel-btn' }}
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('accept-btn'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('cancel-btn'));
    });
    expect(accept).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('omits undo/addPoint slots when not provided', async () => {
    await render(
      <GeoActionBar
        accept={{ onPress: () => {}, testID: 'accept-btn' }}
        cancel={{ onPress: () => {}, testID: 'cancel-btn' }}
      />,
    );
    expect(screen.queryByText('Undo')).toBeNull();
    expect(screen.queryByText('Agregar punto')).toBeNull();
  });

  it('renders undo when provided and fires onPress', async () => {
    const undo = jest.fn();
    await render(
      <GeoActionBar
        undo={{ onPress: undo, testID: 'undo-btn' }}
        accept={{ onPress: () => {}, testID: 'accept-btn' }}
        cancel={{ onPress: () => {}, testID: 'cancel-btn' }}
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('undo-btn'));
    });
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it('renders addPoint with default label and fires onPress when enabled', async () => {
    const addPoint = jest.fn();
    await render(
      <GeoActionBar
        addPoint={{ onPress: addPoint, testID: 'add-point-btn' }}
        accept={{ onPress: () => {}, testID: 'accept-btn' }}
        cancel={{ onPress: () => {}, testID: 'cancel-btn' }}
      />,
    );
    expect(screen.getByText('Agregar punto')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('add-point-btn'));
    });
    expect(addPoint).toHaveBeenCalledTimes(1);
  });

  it('does not fire addPoint onPress when disabled', async () => {
    const addPoint = jest.fn();
    await render(
      <GeoActionBar
        addPoint={{ onPress: addPoint, disabled: true, testID: 'add-point-btn' }}
        accept={{ onPress: () => {}, testID: 'accept-btn' }}
        cancel={{ onPress: () => {}, testID: 'cancel-btn' }}
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('add-point-btn'));
    });
    expect(addPoint).not.toHaveBeenCalled();
  });

  it('does not fire accept onPress when disabled', async () => {
    const accept = jest.fn();
    await render(
      <GeoActionBar
        accept={{ onPress: accept, disabled: true, testID: 'accept-btn' }}
        cancel={{ onPress: () => {}, testID: 'cancel-btn' }}
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('accept-btn'));
    });
    expect(accept).not.toHaveBeenCalled();
  });
});
