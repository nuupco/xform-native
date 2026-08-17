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
});
