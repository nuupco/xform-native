/**
 * MediaCaptureCard tests (design decision 7) — primitive-only PR (slice 10).
 *
 * No widget consumes this yet (Image/Audio/Video/File/Barcode wire in
 * PR11/PR12); these tests exercise the primitive directly.
 */
import { cleanup, fireEvent, render, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { MediaCaptureCard } from '../widgets/primitives/MediaCaptureCard';
import { tokens } from '../tokens/tokens';

function flatten(style: unknown) {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]));
}

afterEach(async () => {
  jest.clearAllMocks();
  await cleanup();
});

describe('MediaCaptureCard', () => {
  it('renders icon, title, and hint in the empty state', async () => {
    const { getByTestId, getByText } = await render(
      <MediaCaptureCard
        state="empty"
        icon={<Text testID="capture-icon">◉</Text>}
        title="No photo yet"
        hint="Take a photo or pick one from your library"
        actions={[]}
        testID="media-card"
      />,
    );

    expect(getByTestId('media-card')).toBeTruthy();
    expect(getByTestId('capture-icon')).toBeTruthy();
    expect(getByText('No photo yet')).toBeTruthy();
    expect(getByText('Take a photo or pick one from your library')).toBeTruthy();
  });

  it('renders preview content in the captured state instead of icon/title/hint', async () => {
    const { getByTestId, queryByTestId, queryByText } = await render(
      <MediaCaptureCard
        state="captured"
        icon={<Text testID="capture-icon">◉</Text>}
        title="No photo yet"
        actions={[]}
        preview={<Text testID="capture-preview">preview content</Text>}
        testID="media-card"
      />,
    );

    expect(getByTestId('capture-preview')).toBeTruthy();
    expect(queryByTestId('capture-icon')).toBeNull();
    expect(queryByText('No photo yet')).toBeNull();
  });

  it('renders each action with its label/testID and fires onPress', async () => {
    const onPressCamera = jest.fn();
    const onPressLibrary = jest.fn();

    const { getByTestId, getByText } = await render(
      <MediaCaptureCard
        state="empty"
        icon={<Text>◉</Text>}
        title="No photo yet"
        actions={[
          { label: 'Take Photo', onPress: onPressCamera, testID: 'media-camera-button' },
          { label: 'Pick from Library', onPress: onPressLibrary, testID: 'media-library-button' },
        ]}
        testID="media-card"
      />,
    );

    expect(getByTestId('media-camera-button')).toBeTruthy();
    expect(getByText('Take Photo')).toBeTruthy();
    expect(getByTestId('media-library-button')).toBeTruthy();
    expect(getByText('Pick from Library')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('media-camera-button'));
    });
    expect(onPressCamera).toHaveBeenCalledTimes(1);
    expect(onPressLibrary).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(getByTestId('media-library-button'));
    });
    expect(onPressLibrary).toHaveBeenCalledTimes(1);
  });

  it('applies error-tone styling to actions with tone: "error"', async () => {
    const { getByText } = await render(
      <MediaCaptureCard
        state="active"
        icon={<Text>●</Text>}
        title="Recording…"
        actions={[{ label: 'Stop', tone: 'error', onPress: jest.fn(), testID: 'media-stop-button' }]}
        testID="media-card"
      />,
    );

    const flatStyle = flatten(getByText('Stop').props.style);
    expect(flatStyle.color).toBe(tokens.color.roles.error);
  });

  it('disables all actions and applies disabled.contentOpacity when disabled', async () => {
    const onPress = jest.fn();
    const { getByTestId, getByText } = await render(
      <MediaCaptureCard
        state="empty"
        icon={<Text>◉</Text>}
        title="No photo yet"
        disabled
        actions={[{ label: 'Take Photo', onPress, testID: 'media-camera-button' }]}
        testID="media-card"
      />,
    );

    const button = getByTestId('media-camera-button');
    expect(button.props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();

    const flatStyle = flatten(getByText('Take Photo').props.style);
    expect(flatStyle.opacity).toBe(tokens.disabled.contentOpacity);
  });
});
