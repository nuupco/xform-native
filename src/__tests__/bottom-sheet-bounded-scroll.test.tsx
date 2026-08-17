/**
 * BottomSheet panel must be height-bounded with its own internal scroll.
 *
 * REQ hotfix: with 100+ choices, the panel (anchored bottom via
 * justifyContent: 'flex-end') grew taller than the screen, pushing the top
 * of the panel (including the search box in minimal-autocomplete) off-screen
 * with no way to scroll to it. Fix: bound panel height + wrap children in a
 * scrollable container.
 */
import { render, cleanup } from '@testing-library/react-native';
import { BottomSheet } from '../widgets/primitives/BottomSheet';

afterEach(async () => {
  jest.restoreAllMocks();
  await cleanup();
});

describe('BottomSheet — bounded height with internal scroll', () => {
  it('panel style defines a maxHeight so it cannot grow past the screen', async () => {
    const { getByTestId } = await render(
      <BottomSheet visible onClose={() => {}} testID="sheet-panel">
        <></>
      </BottomSheet>,
    );
    const panel = getByTestId('sheet-panel');
    const flatStyle = Object.assign({}, ...[panel.props.style].flat());
    expect(flatStyle.maxHeight).toBeDefined();
  });

  it('wraps children in a ScrollView so long content scrolls internally', async () => {
    const { getByTestId } = await render(
      <BottomSheet visible onClose={() => {}} testID="sheet-panel">
        <></>
      </BottomSheet>,
    );
    expect(() => getByTestId('sheet-panel-scroll')).not.toThrow();
  });

  it('wraps the panel in a KeyboardAvoidingView so a short filtered list is not hidden behind the keyboard (REQ hotfix)', async () => {
    // The panel is bottom-anchored (overlay justifyContent: 'flex-end') and
    // sizes to its content up to maxHeight. When a search narrows the list
    // to a handful of results, the panel shrinks and ends up positioned
    // right where the on-screen keyboard now sits, hiding the results —
    // confirmed on-device. KeyboardAvoidingView shifts the panel up above
    // the keyboard instead of leaving it anchored to the (now covered) bottom.
    const { getByTestId } = await render(
      <BottomSheet visible onClose={() => {}} testID="sheet-panel">
        <></>
      </BottomSheet>,
    );
    expect(() => getByTestId('sheet-panel-keyboard-avoiding')).not.toThrow();
  });
});
