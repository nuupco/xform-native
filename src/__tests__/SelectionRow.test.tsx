/**
 * SelectionRow / SelectionIndicator — RED-first tests (Phase 3 PR3).
 *
 * Design decisions 3/4: SelectionRow is a full-width, 56dp min-height
 * Pressable whose entire surface is the hit target; SelectionIndicator is
 * an internal component (also exported) rendering either a 'radio' (circle)
 * or 'checkbox' (square) shape depending on `control`.
 */
import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import {
  SelectionRow,
  SelectionIndicator,
} from '../widgets/primitives/SelectionRow';
import { tokens } from '../tokens/tokens';
import { ThemeProvider } from '../theme/ThemeContext';

function flatten(style: unknown) {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]));
}

afterEach(async () => {
  await cleanup();
});

describe('SelectionRow', () => {
  it('renders as a full-width Pressable with 56dp min height', async () => {
    const { getByTestId } = await render(
      <SelectionRow
        testID="row-1"
        control="radio"
        selected={false}
        label="Option A"
        onPress={() => {}}
      />
    );
    const row = flatten(getByTestId('row-1').props.style);
    expect(row.minHeight).toBe(56);
    expect(row.alignSelf).toBe('stretch');
  });

  it('renders the label text passed in', async () => {
    const { getByText } = await render(
      <SelectionRow
        testID="row-1"
        control="radio"
        selected={false}
        label="Option A"
        onPress={() => {}}
      />
    );
    expect(getByText('Option A')).toBeTruthy();
  });

  it('calls onPress when the row is tapped anywhere', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <SelectionRow
        testID="row-1"
        control="radio"
        selected={false}
        label="Option A"
        onPress={onPress}
      />
    );
    await fireEvent.press(getByTestId('row-1'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('tints the row background when selected (primaryContainer@40%)', async () => {
    const onPress = jest.fn();
    const unselected = await render(
      <SelectionRow
        testID="row-1"
        control="radio"
        selected={false}
        label="Option A"
        onPress={onPress}
      />
    );
    const selected = await render(
      <SelectionRow
        testID="row-1"
        control="radio"
        selected={true}
        label="Option A"
        onPress={onPress}
      />
    );
    const unselectedStyle = flatten(unselected.getByTestId('row-1').props.style);
    const selectedStyle = flatten(selected.getByTestId('row-1').props.style);
    expect(unselectedStyle.backgroundColor).toBeUndefined();
    expect(selectedStyle.backgroundColor).toBe(`${tokens.color.roles.primaryContainer}66`);
  });

  it('supports a custom render slot without a label via children', async () => {
    const { getByText } = await render(
      <SelectionRow testID="row-1" control="radio" selected={false} onPress={() => {}}>
        <Text>Custom content</Text>
      </SelectionRow>
    );
    expect(getByText('Custom content')).toBeTruthy();
  });

  it('defaults to density "default" — 56dp min height, full-width stretch', async () => {
    const { getByTestId } = await render(
      <SelectionRow testID="row-1" control="radio" selected={false} label="Option A" onPress={() => {}} />
    );
    const row = flatten(getByTestId('row-1').props.style);
    expect(row.minHeight).toBe(56);
    expect(row.alignSelf).toBe('stretch');
  });

  it('density "pack" renders a shorter 40dp min-height row (SelectOne columns-pack)', async () => {
    const { getByTestId } = await render(
      <SelectionRow
        testID="row-1"
        control="radio"
        selected={false}
        label="Option A"
        onPress={() => {}}
        density="pack"
      />
    );
    const row = flatten(getByTestId('row-1').props.style);
    expect(row.minHeight).toBe(40);
  });

  it('density "likert" renders a compact, non-stretched cell (SelectOne likert row)', async () => {
    const { getByTestId } = await render(
      <SelectionRow
        testID="row-1"
        control="radio"
        selected={false}
        label="Option A"
        onPress={() => {}}
        density="likert"
      />
    );
    const row = flatten(getByTestId('row-1').props.style);
    expect(row.minHeight).toBe(48);
    expect(row.minWidth).toBe(64);
    expect(row.alignSelf).not.toBe('stretch');
  });
});

describe('SelectionIndicator', () => {
  it('renders a radio (circle) shape resting: 20dp, 2px outline border', async () => {
    const { getByTestId } = await render(
      <SelectionIndicator testID="indicator-1" control="radio" selected={false} />
    );
    const style = flatten(getByTestId('indicator-1').props.style);
    expect(style.width).toBe(20);
    expect(style.height).toBe(20);
    expect(style.borderRadius).toBe(10);
    expect(style.borderWidth).toBe(2);
    expect(style.borderColor).toBe(tokens.color.roles.outline);
    expect(style.backgroundColor).toBeUndefined();
  });

  it('renders a radio selected: primary fill + onPrimary dot', async () => {
    const { getByTestId } = await render(
      <SelectionIndicator testID="indicator-1" control="radio" selected={true} />
    );
    const outer = flatten(getByTestId('indicator-1').props.style);
    expect(outer.backgroundColor).toBe(tokens.color.roles.primary);
    const dot = getByTestId('indicator-1-dot');
    const dotStyle = flatten(dot.props.style);
    expect(dotStyle.backgroundColor).toBe(tokens.color.roles.onPrimary);
  });

  it('renders a checkbox (square) shape resting with radius sm', async () => {
    const { getByTestId } = await render(
      <SelectionIndicator testID="indicator-2" control="checkbox" selected={false} />
    );
    const style = flatten(getByTestId('indicator-2').props.style);
    expect(style.borderRadius).toBe(tokens.radius.sm);
    expect(style.borderWidth).toBe(2);
    expect(style.backgroundColor).toBeUndefined();
  });

  it('renders a checkbox selected: onPrimary check on primary background', async () => {
    const { getByTestId } = await render(
      <SelectionIndicator testID="indicator-2" control="checkbox" selected={true} />
    );
    const outer = flatten(getByTestId('indicator-2').props.style);
    expect(outer.backgroundColor).toBe(tokens.color.roles.primary);
    expect(getByTestId('indicator-2-check')).toBeTruthy();
  });

  it('drives the 150ms check-draw animation via Animated.timing when a checkbox becomes selected', async () => {
    const timingSpy = jest.spyOn(require('react-native').Animated, 'timing');
    const { rerender, getByTestId } = await render(
      <SelectionIndicator testID="indicator-3" control="checkbox" selected={false} />
    );
    timingSpy.mockClear();
    await rerender(
      <SelectionIndicator testID="indicator-3" control="checkbox" selected={true} />
    );
    expect(timingSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 1, duration: 150 })
    );
    expect(getByTestId('indicator-3-check')).toBeTruthy();
    timingSpy.mockRestore();
  });

  it('reaches through a theme override for the primary color', async () => {
    const { getByTestId } = await render(
      <ThemeProvider theme={{ color: { primary: '#123456' } }}>
        <SelectionIndicator testID="indicator-4" control="radio" selected={true} />
      </ThemeProvider>
    );
    const style = flatten(getByTestId('indicator-4').props.style);
    expect(style.backgroundColor).toBe('#123456');
  });
});
