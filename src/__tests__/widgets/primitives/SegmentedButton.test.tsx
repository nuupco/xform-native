/**
 * SegmentedButton — RED-first tests (Phase 3 PR3).
 *
 * Design decision 5: replaces the native Switch for Boolean's `default`
 * variant. Two-option Sí/No control, pill radius, 44dp height. Must support
 * an "unanswered" state (value === null) distinct from either option
 * selected — the whole point of dropping Switch.
 */
import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { SegmentedButton } from '../../../widgets/primitives/SegmentedButton';
import { tokens } from '../../../tokens/tokens';

const OPTIONS = [
  { value: 'yes', label: 'Sí' },
  { value: 'no', label: 'No' },
] as const;

function flatten(style: unknown) {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]));
}

afterEach(async () => {
  await cleanup();
});

describe('SegmentedButton', () => {
  it('renders exactly 2 option segments with the given labels', async () => {
    const { getByText } = await render(
      <SegmentedButton testID="sb-1" options={OPTIONS} value={null} onChange={() => {}} />
    );
    expect(getByText('Sí')).toBeTruthy();
    expect(getByText('No')).toBeTruthy();
  });

  it('renders the container with pill radius and 44dp height', async () => {
    const { getByTestId } = await render(
      <SegmentedButton testID="sb-1" options={OPTIONS} value={null} onChange={() => {}} />
    );
    const style = flatten(getByTestId('sb-1').props.style);
    expect(style.borderRadius).toBe(tokens.radius.pill);
    expect(style.height).toBe(44);
  });

  it('shows neither segment as selected when value is null (unanswered)', async () => {
    const { getByTestId } = await render(
      <SegmentedButton testID="sb-1" options={OPTIONS} value={null} onChange={() => {}} />
    );
    const yesStyle = flatten(getByTestId('sb-1-segment-yes').props.style);
    const noStyle = flatten(getByTestId('sb-1-segment-no').props.style);
    expect(yesStyle.backgroundColor).not.toBe(tokens.color.roles.primaryContainer);
    expect(noStyle.backgroundColor).not.toBe(tokens.color.roles.primaryContainer);
  });

  it('shows the matching segment selected (primaryContainer/onPrimaryContainer) when value is set', async () => {
    const { getByTestId, getByText } = await render(
      <SegmentedButton testID="sb-1" options={OPTIONS} value="no" onChange={() => {}} />
    );
    const yesStyle = flatten(getByTestId('sb-1-segment-yes').props.style);
    const noStyle = flatten(getByTestId('sb-1-segment-no').props.style);
    expect(yesStyle.backgroundColor).toBe(tokens.color.roles.surface);
    expect(noStyle.backgroundColor).toBe(tokens.color.roles.primaryContainer);
    const noText = flatten(getByText('No').props.style);
    expect(noText.color).toBe(tokens.color.roles.onPrimaryContainer);
  });

  it('gives unselected segments a surface background + outline border', async () => {
    const { getByTestId } = await render(
      <SegmentedButton testID="sb-1" options={OPTIONS} value="no" onChange={() => {}} />
    );
    const yesStyle = flatten(getByTestId('sb-1-segment-yes').props.style);
    expect(yesStyle.backgroundColor).toBe(tokens.color.roles.surface);
    expect(yesStyle.borderColor).toBe(tokens.color.roles.outline);
  });

  it('calls onChange with the tapped segment value', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(
      <SegmentedButton testID="sb-1" options={OPTIONS} value={null} onChange={onChange} />
    );
    await fireEvent.press(getByTestId('sb-1-segment-yes'));
    expect(onChange).toHaveBeenCalledWith('yes');
    await fireEvent.press(getByTestId('sb-1-segment-no'));
    expect(onChange).toHaveBeenCalledWith('no');
  });

  it('does not call onChange when disabled', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(
      <SegmentedButton
        testID="sb-1"
        options={OPTIONS}
        value={null}
        onChange={onChange}
        disabled
      />
    );
    await fireEvent.press(getByTestId('sb-1-segment-yes'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
