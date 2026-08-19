/**
 * Modal / BottomSheet theming (PR5, design decision 11).
 *
 * AppModal's scrim migrates to `roles.scrim`; BottomSheet's panel migrates to
 * `roles.surface` + elevation level 3 + `radius.xl` top corners + a 4dp
 * `roles.outlineVariant` drag handle. Existing consumer behavior (children
 * render, bounded height + scroll, keyboard avoidance, non-Pressable panel,
 * fullScreen mode) must be unaffected — see primitives.test.tsx and
 * bottom-sheet-bounded-scroll.test.tsx, both unmodified by this PR.
 */
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { AppModal } from '../../../widgets/primitives/Modal';
import { BottomSheet } from '../../../widgets/primitives/BottomSheet';
import { tokens } from '../../../tokens/tokens';

function flatten(style: unknown) {
  return Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
}

describe('AppModal theming', () => {
  it('overlay scrim uses roles.scrim', async () => {
    await render(
      <AppModal visible testID="modal-root">
        <Text>child</Text>
      </AppModal>,
    );
    const style = flatten(screen.getByTestId('modal-root').props.style);
    expect(style.backgroundColor).toBe(tokens.color.roles.scrim);
  });
});

describe('BottomSheet theming', () => {
  it('panel uses roles.surface background and radius.xl top corners', async () => {
    await render(
      <BottomSheet visible onClose={() => {}} testID="sheet-panel">
        <Text>content</Text>
      </BottomSheet>,
    );
    const style = flatten(screen.getByTestId('sheet-panel').props.style);
    expect(style.backgroundColor).toBe(tokens.color.roles.surface);
    expect(style.borderTopLeftRadius).toBe(tokens.radius.xl);
    expect(style.borderTopRightRadius).toBe(tokens.radius.xl);
  });

  it('renders a drag handle styled with roles.outlineVariant', async () => {
    await render(
      <BottomSheet visible onClose={() => {}} testID="sheet-panel">
        <Text>content</Text>
      </BottomSheet>,
    );
    const handle = screen.getByTestId('sheet-panel-drag-handle');
    const style = flatten(handle.props.style);
    expect(style.backgroundColor).toBe(tokens.color.roles.outlineVariant);
    expect(style.height).toBe(4);
  });
});
