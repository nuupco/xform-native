import { Animated, Easing } from 'react-native';
import { render, screen, cleanup } from '@testing-library/react-native';
import { ErrorBanner } from '../form/ErrorBanner';
import { tokens } from '../tokens/tokens';

// `useNativeDriver: true` requires the real Animated native module, which is
// not available/mocked in this jest env (and this repo's installed
// react-native-renderer/react version pairing throws on native-driver connect
// during tests regardless). Stub `Animated.timing` for every test so we
// assert the *call configuration* (per the task's own instruction to test
// config, not per-frame pixel output) without ever hitting the native path.
let timingSpy: jest.SpiedFunction<typeof Animated.timing>;

beforeEach(() => {
  timingSpy = jest.spyOn(Animated, 'timing').mockImplementation(
    () =>
      ({
        start: (cb?: (result: { finished: boolean }) => void) => cb?.({ finished: true }),
        stop: () => {},
        reset: () => {},
      }) as unknown as Animated.CompositeAnimation,
  );
});

afterEach(async () => {
  await cleanup();
  jest.restoreAllMocks();
});

function flatten(node: any): Record<string, unknown> {
  const style = node.props.style;
  return Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : (style as Record<string, unknown>);
}

describe('ErrorBanner', () => {
  it('renders errorContainer bg + AlertIcon + bodySmall/error text when a message is provided', async () => {
    await render(<ErrorBanner message="This field is required" testID="error-banner" />);
    const banner = screen.getByTestId('error-banner');
    const flat = flatten(banner);
    expect(flat.backgroundColor).toBe(tokens.color.roles.errorContainer);
    expect(flat.borderRadius).toBe(tokens.radius.sm);
    expect(flat.padding).toBe(tokens.spacing.sm);

    const text = screen.getByText('This field is required');
    const textFlat = flatten(text);
    expect(textFlat.fontSize).toBe(tokens.typography.bodySmall.fontSize);
    expect(textFlat.color).toBe(tokens.color.roles.error);
  });

  it('renders nothing when no message is provided', async () => {
    await render(<ErrorBanner testID="error-banner" />);
    expect(screen.queryByTestId('error-banner')).toBeNull();
  });

  it('animates opacity 0->1 and translateY 4->0 over 200ms with Easing.out on mount', async () => {
    await render(<ErrorBanner message="Blocked" testID="error-banner" />);

    expect(timingSpy).toHaveBeenCalled();
    const calls = timingSpy.mock.calls;
    const configs = calls.map((c) => c[1]);

    const opacityConfig = configs.find((c) => c.toValue === 1);
    const translateConfig = configs.find((c) => c.toValue === 0);

    expect(opacityConfig).toBeTruthy();
    expect(opacityConfig?.duration).toBe(200);
    expect(opacityConfig?.useNativeDriver).toBe(true);
    expect(typeof opacityConfig?.easing).toBe('function');
    expect(opacityConfig?.easing?.(0.5)).toBeCloseTo(Easing.out(Easing.quad)(0.5));

    expect(translateConfig).toBeTruthy();
    expect(translateConfig?.duration).toBe(200);
    expect(translateConfig?.useNativeDriver).toBe(true);
    expect(translateConfig?.easing?.(0.5)).toBeCloseTo(Easing.out(Easing.quad)(0.5));
  });
});
