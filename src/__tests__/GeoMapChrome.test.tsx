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
import { ThemeProvider } from '../theme/ThemeContext';
import { tokens } from '../tokens/tokens';

afterEach(async () => {
  await cleanup();
});

function flatten(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style.flat(Infinity) : [style]).filter(Boolean));
}

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

  it('is a 48dp roles.surface-elevated circle with an onSurface icon (PR15 restyle)', async () => {
    await render(<MapActionButton icon="⊙" onPress={() => {}} testID="action-btn" />);
    const style = flatten(screen.getByTestId('action-btn').props.style);
    expect(style.width).toBe(48);
    expect(style.height).toBe(48);
    expect(style.borderRadius).toBe(24);
    // elevationStyle mixes surface+primary; verify the theme override reaches
    // the surface-tinted background rather than the old flat rgba(0,0,0,0.5).
    expect(style.backgroundColor).not.toBe('rgba(0,0,0,0.5)');
    const iconStyle = flatten(screen.getByText('⊙').props.style);
    expect(iconStyle.color).toBe(tokens.color.roles.onSurface);
  });

  it('keeps rendering inside a ThemeProvider (theme reaches the primitive)', async () => {
    await render(
      <ThemeProvider theme={{ color: { primary: '#7B2CBF' } }}>
        <MapActionButton icon="⊙" onPress={() => {}} testID="action-btn" />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('action-btn')).toBeTruthy();
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

  it('renders as a pill with Campo surface/onSurface roles (PR15 restyle)', async () => {
    await render(<GpsStatusPill status="tracking" accuracyM={4.2} testID="gps-pill" />);
    const pillStyle = flatten(screen.getByTestId('gps-pill').props.style);
    expect(pillStyle.borderRadius).toBe(tokens.radius.pill);
    expect(pillStyle.backgroundColor).toBe(tokens.color.roles.surface);
    const textStyle = flatten(screen.getByText('GPS ±4.2 m').props.style);
    expect(textStyle.color).toBe(tokens.color.roles.onSurface);
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

  it('renders as a pill with Campo surface/onSurface roles (PR15 restyle)', async () => {
    await render(<PrewarmStatusPill status="running" testID="prewarm-status" />);
    const pillStyle = flatten(screen.getByTestId('prewarm-status').props.style);
    expect(pillStyle.borderRadius).toBe(tokens.radius.pill);
    expect(pillStyle.backgroundColor).toBe(tokens.color.roles.surface);
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

  it('renders Accept/Cancel via PressableButton with primary/error tones (PR15 restyle)', async () => {
    await render(
      <GeoActionBar
        undo={{ onPress: () => {}, testID: 'undo-btn' }}
        addPoint={{ onPress: () => {}, testID: 'add-point-btn' }}
        accept={{ onPress: () => {}, testID: 'accept-btn' }}
        cancel={{ onPress: () => {}, testID: 'cancel-btn' }}
      />,
    );
    const accept = screen.getByTestId('accept-btn');
    const cancel = screen.getByTestId('cancel-btn');
    expect(accept.props.accessibilityRole).toBe('button');
    expect(cancel.props.accessibilityRole).toBe('button');
    const acceptStyle = flatten(
      typeof accept.props.style === 'function' ? accept.props.style({ pressed: false }) : accept.props.style,
    );
    const cancelStyle = flatten(
      typeof cancel.props.style === 'function' ? cancel.props.style({ pressed: false }) : cancel.props.style,
    );
    expect(acceptStyle.backgroundColor).toBe(tokens.color.roles.primary);
    expect(cancelStyle.backgroundColor).toBe(tokens.color.roles.error);
    expect(screen.getByText('Accept')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });
});
