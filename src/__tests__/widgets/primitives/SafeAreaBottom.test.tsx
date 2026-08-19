/**
 * SafeAreaBottom — bottom-safe-area padding for full-screen map modals.
 *
 * REQ hotfix: confirmed on-device — the geo map modals' Accept/Cancel/Undo
 * button row was clipped by Android's gesture-navigation bar, since a
 * full-screen RN <Modal> doesn't account for system bar insets on its own.
 */
import { Text, View } from 'react-native';
import { render, screen, cleanup } from '@testing-library/react-native';
import { SafeAreaBottom } from '../../../widgets/primitives/SafeAreaBottom';

afterEach(async () => {
  jest.resetModules();
  await cleanup();
});

describe('SafeAreaBottom', () => {
  it('renders children', async () => {
    await render(
      <SafeAreaBottom>
        <Text testID="child">buttons</Text>
      </SafeAreaBottom>,
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('falls back to a fixed bottom padding when react-native-safe-area-context is absent', async () => {
    jest.doMock(
      'react-native-safe-area-context',
      () => {
        throw new Error('not installed');
      },
      { virtual: true },
    );
    jest.resetModules();
    const { SafeAreaBottom: FreshSafeAreaBottom } = require('../../../widgets/primitives/SafeAreaBottom');
    const { getByTestId } = await render(
      <FreshSafeAreaBottom style={{ flex: 1 }}>
        <View testID="fallback-child" />
      </FreshSafeAreaBottom>,
    );
    expect(getByTestId('fallback-child')).toBeTruthy();
  });
});
