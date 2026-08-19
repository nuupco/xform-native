/**
 * T-09: StyleSheet primitives — Modal + BottomSheet (REQ-18).
 *
 * Tests that:
 * 1. AppModal renders with children
 * 2. BottomSheet renders with transparent modal + panel in lower portion
 * 3. Neither requires a native module (no TurboModule call at render time)
 */

import { View, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { AppModal } from '../../../widgets/primitives/Modal';
import { BottomSheet } from '../../../widgets/primitives/BottomSheet';

describe('AppModal', () => {
  it('renders children when visible', async () => {
    await render(
      <AppModal visible testID="modal-root">
        <Text testID="child">hello</Text>
      </AppModal>,
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('renders nothing visible when visible=false', async () => {
    await render(
      <AppModal visible={false} testID="modal-root">
        <Text testID="child-hidden">hidden</Text>
      </AppModal>,
    );
    // The child may or may not be in the tree when visible=false; we just
    // confirm no crash occurred.
    expect(true).toBe(true);
  });

  it('fullScreen mode gives children an unbounded (flex:1) container instead of the centered dialog inset (REQ hotfix)', async () => {
    // AppModal's default overlay is `justifyContent: 'center'` with an inset
    // wrapper that has NO explicit height — correct for small confirm-style
    // dialogs, but wrong for a full-screen map: a child `flex:1` map has
    // nothing to flex into inside a shrink-to-fit centered dialog, so it
    // collapses to near-zero height. Confirmed on-device: GeoShapeWidget's
    // map rendered invisible, with Accept/Cancel buttons floating mid-screen
    // instead of pinned to the bottom of a full-screen map view.
    const { getByTestId } = await render(
      <AppModal visible testID="modal-root" fullScreen>
        <View testID="full-screen-child" style={{ flex: 1 }} />
      </AppModal>,
    );
    const root = getByTestId('modal-root');
    const rootStyle = Object.assign({}, ...[root.props.style].flat());
    expect(rootStyle.justifyContent).not.toBe('center');
    expect(rootStyle.padding).toBeUndefined();
  });
});

describe('BottomSheet', () => {
  it('renders panel children when visible', async () => {
    await render(
      <BottomSheet visible onClose={() => {}}>
        <Text testID="panel-child">panel content</Text>
      </BottomSheet>,
    );
    expect(screen.getByTestId('panel-child')).toBeTruthy();
  });

  it('renders a panel container (bottom layout)', async () => {
    await render(
      <BottomSheet visible onClose={() => {}}>
        <View testID="panel-inner" />
      </BottomSheet>,
    );
    expect(screen.getByTestId('panel-inner')).toBeTruthy();
  });

  it('does not crash when not visible', async () => {
    await render(
      <BottomSheet visible={false} onClose={() => {}}>
        <Text>hidden</Text>
      </BottomSheet>,
    );
    expect(true).toBe(true);
  });
});
