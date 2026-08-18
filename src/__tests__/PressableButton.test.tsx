import {
  render,
  screen,
  cleanup,
  fireEvent,
} from '@testing-library/react-native';
import {
  PressableButton,
  resolveButtonBackground,
  resolveButtonTextColor,
  resolveContainerStyle,
  resolveContentStyle,
  androidRippleColor,
  hexToRgba,
} from '../widgets/primitives/PressableButton';
import { tokens } from '../tokens/tokens';
import { ThemeProvider } from '../theme/ThemeContext';

afterEach(async () => {
  await cleanup();
});

describe('hexToRgba / androidRippleColor (pure)', () => {
  it('converts a hex color + alpha to an rgba() string', () => {
    expect(hexToRgba('#265A36', 0.12)).toBe('rgba(38, 90, 54, 0.12)');
  });

  it('android ripple color is roles.primary at 12% alpha', () => {
    const hex = tokens.color.roles.primary.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    expect(androidRippleColor()).toBe(`rgba(${r}, ${g}, ${b}, 0.12)`);
  });
});

describe('resolveButtonBackground / resolveButtonTextColor — tone:"error" (design decision, PR1 scope)', () => {
  it("filled + tone:'error' → error bg / onError text", () => {
    expect(resolveButtonBackground('filled', 'error')).toBe(
      tokens.color.roles.error
    );
    expect(resolveButtonTextColor('filled', 'error')).toBe(
      tokens.color.roles.onError
    );
  });

  it("variant:'text' + tone:'error' → no background, error-colored text (not primary)", () => {
    expect(resolveButtonBackground('text', 'error')).toBeUndefined();
    expect(resolveButtonTextColor('text', 'error')).toBe(
      tokens.color.roles.error
    );
  });
});

describe('resolveButtonBackground / resolveButtonTextColor — theme param (design decision 10)', () => {
  const purpleTheme = {
    ...tokens,
    color: {
      ...tokens.color,
      roles: {
        ...tokens.color.roles,
        primary: '#7B2CBF',
        onPrimary: '#FFFFFF',
      },
    },
  } as unknown as typeof tokens;

  it('accepts a trailing theme arg and resolves colors from it instead of the raw tokens singleton', () => {
    expect(resolveButtonBackground('filled', 'primary', purpleTheme)).toBe(
      '#7B2CBF'
    );
    expect(resolveButtonBackground('filled', 'primary')).toBe(
      tokens.color.roles.primary
    );
  });

  it('androidRippleColor also accepts a trailing theme arg', () => {
    expect(androidRippleColor(purpleTheme)).toBe(hexToRgba('#7B2CBF', 0.12));
    expect(androidRippleColor()).toBe(
      hexToRgba(tokens.color.roles.primary, 0.12)
    );
  });
});

describe('resolveButtonBackground / resolveButtonTextColor (pure)', () => {
  it('filled + primary tone → primary bg / onPrimary text', () => {
    expect(resolveButtonBackground('filled', 'primary')).toBe(
      tokens.color.roles.primary
    );
    expect(resolveButtonTextColor('filled', 'primary')).toBe(
      tokens.color.roles.onPrimary
    );
  });

  it("filled + tone:'secondary' → secondary bg / onSecondary text", () => {
    expect(resolveButtonBackground('filled', 'secondary')).toBe(
      tokens.color.roles.secondary
    );
    expect(resolveButtonTextColor('filled', 'secondary')).toBe(
      tokens.color.roles.onSecondary
    );
  });

  it("variant:'text' → no background, primary text regardless of tone", () => {
    expect(resolveButtonBackground('text', 'primary')).toBeUndefined();
    expect(resolveButtonBackground('text', 'secondary')).toBeUndefined();
    expect(resolveButtonTextColor('text', 'secondary')).toBe(
      tokens.color.roles.primary
    );
  });
});

describe('resolveContainerStyle (pure)', () => {
  const base = {
    variant: 'filled' as const,
    tone: 'primary' as const,
    height: 48,
    fullWidth: false,
  };

  it('filled, unpressed: height, radius.md, primary bg, no opacity', () => {
    const style = resolveContainerStyle({
      ...base,
      pressed: false,
      platformOS: 'ios',
    });
    expect(style.height).toBe(48);
    expect(style.borderRadius).toBe(tokens.radius.md);
    expect(style.backgroundColor).toBe(tokens.color.roles.primary);
    expect(style.opacity).toBeUndefined();
  });

  it('text variant has no backgroundColor key', () => {
    const style = resolveContainerStyle({
      ...base,
      variant: 'text',
      pressed: false,
      platformOS: 'ios',
    });
    expect(style.backgroundColor).toBeUndefined();
    expect(style.height).toBe(48);
  });

  it('iOS + pressed: opacity 0.7, background unchanged (no gray-out)', () => {
    const style = resolveContainerStyle({
      ...base,
      pressed: true,
      platformOS: 'ios',
    });
    expect(style.opacity).toBe(0.7);
    expect(style.backgroundColor).toBe(tokens.color.roles.primary);
  });

  it('iOS + unpressed: no opacity key at all', () => {
    const style = resolveContainerStyle({
      ...base,
      pressed: false,
      platformOS: 'ios',
    });
    expect(style.opacity).toBeUndefined();
  });

  it('Android + pressed: no opacity change (ripple handles press feedback)', () => {
    const style = resolveContainerStyle({
      ...base,
      pressed: true,
      platformOS: 'android',
    });
    expect(style.opacity).toBeUndefined();
    expect(style.backgroundColor).toBe(tokens.color.roles.primary);
  });
});

describe('resolveContentStyle (pure)', () => {
  it('enabled: no opacity override, tone/variant text color applied', () => {
    const style = resolveContentStyle('filled', 'primary', false);
    expect(style.opacity).toBeUndefined();
    expect(style.color).toBe(tokens.color.roles.onPrimary);
  });

  it('disabled: content opacity 0.38, color unaffected', () => {
    const style = resolveContentStyle('filled', 'primary', true);
    expect(style.opacity).toBe(tokens.disabled.contentOpacity);
    expect(style.color).toBe(tokens.color.roles.onPrimary);
  });
});

describe('PressableButton (component behavior)', () => {
  it('renders label text and invokes onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(
      <PressableButton label="Next" onPress={onPress} testID="btn-fire" />
    );
    expect(screen.getByText('Next')).toBeTruthy();
    fireEvent.press(screen.getByTestId('btn-fire'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled button does not invoke onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(
      <PressableButton
        label="Next"
        onPress={onPress}
        disabled
        testID="btn-disabled"
      />
    );
    fireEvent.press(screen.getByTestId('btn-disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("tone:'secondary' filled renders with roles.secondary container background", async () => {
    await render(
      <PressableButton
        label="Finalizar"
        onPress={() => {}}
        tone="secondary"
        testID="btn-finish"
      />
    );
    const node = screen.getByTestId('btn-finish');
    const flat = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style)
      : node.props.style;
    expect(flat.backgroundColor).toBe(tokens.color.roles.secondary);
  });

  it("tone:'error' filled renders with roles.error container background (Stop/Cancel actions)", async () => {
    await render(
      <PressableButton
        label="Detener"
        onPress={() => {}}
        tone="error"
        testID="btn-stop"
      />
    );
    const node = screen.getByTestId('btn-stop');
    const flat = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style)
      : node.props.style;
    expect(flat.backgroundColor).toBe(tokens.color.roles.error);
  });

  it('a host ThemeProvider primary override reaches the button without an explicit theme prop (design decision 10)', async () => {
    await render(
      <ThemeProvider theme={{ color: { primary: '#7B2CBF' } }}>
        <PressableButton
          label="Siguiente"
          onPress={() => {}}
          testID="btn-themed"
        />
      </ThemeProvider>
    );
    const node = screen.getByTestId('btn-themed');
    const flat = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style)
      : node.props.style;
    expect(flat.backgroundColor).toBe('#7B2CBF');
    expect(flat.backgroundColor).not.toBe(tokens.color.roles.primary);
  });
});
