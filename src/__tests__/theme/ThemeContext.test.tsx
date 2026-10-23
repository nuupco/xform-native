/**
 * ThemeContext — reactive theming (form-theming capability, D1/D2/D3).
 *
 * Strict TDD: this file starts RED against theme.ts/ThemeContext.tsx that
 * do not exist yet.
 */
import { useRef } from 'react';
import { act, render, renderHook } from '@testing-library/react-native';
import { Text, TextInput } from 'react-native';
import { tokens } from '../../tokens/tokens';
import { ThemeProvider, useTheme, useThemedStyles } from '../../theme/ThemeContext';

describe('useThemedStyles — WeakMap cache keyed by theme identity', () => {
  it('returns a referentially equal styles object across renders for the same theme', async () => {
    const factory = (t: typeof tokens) => ({
      box: { backgroundColor: t.color.surface },
    });

    const { result, rerender } = await renderHook(() => useThemedStyles(factory));
    const first = result.current;
    rerender({});
    const second = result.current;

    expect(second).toBe(first);
  });

  it('returns a different styles object identity for a different theme identity', async () => {
    const factory = (t: typeof tokens) => ({
      box: { backgroundColor: t.color.surface },
    });

    const themeA = { ...tokens };
    const themeB = { ...tokens };

    const { result: resultA } = await renderHook(() => useThemedStyles(factory), {
      wrapper: ({ children }) => (
        <ThemeProvider theme={themeA}>{children}</ThemeProvider>
      ),
    });
    const { result: resultB } = await renderHook(() => useThemedStyles(factory), {
      wrapper: ({ children }) => (
        <ThemeProvider theme={themeB}>{children}</ThemeProvider>
      ),
    });

    expect(resultA.current).not.toBe(resultB.current);
  });
});

describe('useTheme — no provider present', () => {
  it('returns default tokens exactly when no ThemeProvider is in the tree', async () => {
    const { result } = await renderHook(() => useTheme());
    expect(result.current).toEqual(tokens);
  });
});

describe('ThemeProvider — reactive theme prop (D3)', () => {
  it('propagates a theme prop change to already-mounted consumers without a remount', async () => {
    function Probe() {
      const theme = useTheme();
      return <Text testID="probe-color">{theme.color.primary}</Text>;
    }

    function Harness({ primary }: { primary: string }) {
      return (
        <ThemeProvider theme={{ color: { primary } }}>
          <Probe />
        </ThemeProvider>
      );
    }

    const { getByTestId, rerender } = await render(<Harness primary="#111111" />);
    expect(getByTestId('probe-color').props.children).toBe('#111111');

    await act(async () => {
      rerender(<Harness primary="#222222" />);
    });
    expect(getByTestId('probe-color').props.children).toBe('#222222');
  });

  it('updates in place (no remount): ref identity survives the theme change', async () => {
    let mountCount = 0;

    function Probe() {
      const theme = useTheme();
      const ref = useRef<TextInput>(null);
      if (ref.current === null) {
        mountCount += 1;
      }
      return (
        <TextInput
          ref={ref}
          testID="probe-input"
          defaultValue="hello"
          style={{ color: theme.color.primary }}
        />
      );
    }

    function Harness({ primary }: { primary: string }) {
      return (
        <ThemeProvider theme={{ color: { primary } }}>
          <Probe />
        </ThemeProvider>
      );
    }

    const { getByTestId, rerender } = await render(<Harness primary="#111111" />);
    const inputBefore = getByTestId('probe-input');
    expect(mountCount).toBe(1);

    await act(async () => {
      rerender(<Harness primary="#222222" />);
    });
    const inputAfter = getByTestId('probe-input');

    // Same host element instance across the theme change -> no remount.
    expect(inputAfter).toBe(inputBefore);
    expect(inputAfter.props.style).toEqual({ color: '#222222' });
  });
});
