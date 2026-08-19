/**
 * PermissionNotice tests — shared presentational permission card (Phase 6,
 * PR1). Reuses GpsPermissionNotice's visual design but is copy-driven via
 * props (design decision 6) rather than status-driven, since multiple
 * distinct permission kinds consume it.
 */
import { render, fireEvent, screen, cleanup } from '@testing-library/react-native';
import { PermissionNotice } from '../widgets/primitives/PermissionNotice';

afterEach(async () => {
  await cleanup();
});

describe('PermissionNotice', () => {
  it('renders title, body, and primary action; fires onPrimary on press', async () => {
    const onPrimary = jest.fn();
    await render(
      <PermissionNotice
        title="Usar la cámara"
        body="Necesitamos la cámara para tomar la foto de esta pregunta."
        primaryLabel="Permitir"
        onPrimary={onPrimary}
      />,
    );

    expect(screen.getByText('Usar la cámara')).toBeTruthy();
    expect(screen.getByText('Necesitamos la cámara para tomar la foto de esta pregunta.')).toBeTruthy();

    fireEvent.press(screen.getByTestId('permission-notice-primary'));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it('renders a dismiss action only when both dismissLabel and onDismiss are given', async () => {
    const onPrimary = jest.fn();
    const onDismiss = jest.fn();
    await render(
      <PermissionNotice
        title="Sin permiso de cámara"
        body="Permite el acceso para tomar una foto."
        primaryLabel="Permitir"
        onPrimary={onPrimary}
        dismissLabel="Ahora no"
        onDismiss={onDismiss}
      />,
    );

    const dismiss = screen.getByTestId('permission-notice-dismiss');
    expect(dismiss).toBeTruthy();
    fireEvent.press(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('omits the dismiss action when dismissLabel/onDismiss are absent (blocked state)', async () => {
    await render(
      <PermissionNotice
        title="Permiso de cámara bloqueado"
        body="Actívalo en los ajustes del sistema para tomar fotos."
        primaryLabel="Abrir ajustes"
        onPrimary={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('permission-notice-dismiss')).toBeNull();
  });

  it('applies a custom testID prefix to the root and derived action testIDs', async () => {
    await render(
      <PermissionNotice
        title="Usar el micrófono"
        body="Necesitamos el micrófono para grabar tu respuesta de audio."
        primaryLabel="Permitir"
        onPrimary={jest.fn()}
        dismissLabel="Ahora no"
        onDismiss={jest.fn()}
        testID="permission-notice"
      />,
    );

    expect(screen.getByTestId('permission-notice')).toBeTruthy();
    expect(screen.getByTestId('permission-notice-primary')).toBeTruthy();
    expect(screen.getByTestId('permission-notice-dismiss')).toBeTruthy();
  });
});
