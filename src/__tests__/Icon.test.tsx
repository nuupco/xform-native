import { render, screen, cleanup } from '@testing-library/react-native';
import { AlertIcon, PlusIcon, LeafIcon } from '../widgets/primitives/Icon';

afterEach(async () => {
  await cleanup();
});

function flatten(style: unknown): Record<string, unknown> {
  return Array.isArray(style) ? Object.assign({}, ...style) : (style as Record<string, unknown>);
}

describe('Icon primitives', () => {
  it('AlertIcon renders at 16px with testID', async () => {
    await render(<AlertIcon testID="alert-icon" />);
    const node = screen.getByTestId('alert-icon');
    const style = flatten(node.props.style);
    expect(style.width).toBe(16);
    expect(style.height).toBe(16);
  });

  it('PlusIcon renders with testID', async () => {
    await render(<PlusIcon testID="plus-icon" />);
    expect(screen.getByTestId('plus-icon')).toBeTruthy();
  });

  it('LeafIcon renders svg when react-native-svg is available (test env mock)', async () => {
    await render(<LeafIcon testID="leaf-icon" />);
    const node = screen.getByTestId('leaf-icon');
    const style = flatten(node.props.style);
    expect(style.width).toBe(64);
    expect(style.height).toBe(64);
    expect(screen.getByTestId('svg-canvas')).toBeTruthy();
  });

  it('LeafIcon renders a fallback primaryContainer circle when react-native-svg is unavailable', async () => {
    let IsolatedLeafIcon: typeof LeafIcon = LeafIcon;
    jest.isolateModules(() => {
      jest.doMock('react-native-svg', () => {
        throw new Error('module not found');
      });
      IsolatedLeafIcon = require('../widgets/primitives/Icon').LeafIcon;
    });
    await render(<IsolatedLeafIcon testID="leaf-icon-fallback" />);
    const node = screen.getByTestId('leaf-icon-fallback');
    const style = flatten(node.props.style);
    expect(style.width).toBe(64);
    expect(style.height).toBe(64);
    expect(style.borderRadius).toBe(32);
    jest.dontMock('react-native-svg');
  });
});
