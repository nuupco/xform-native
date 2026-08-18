import { render, screen, cleanup } from '@testing-library/react-native';
import {
  AlertIcon,
  PlusIcon,
  LeafIcon,
  CheckIcon,
  MinusIcon,
  ChevronDownIcon,
  SearchIcon,
  CalendarIcon,
  ClockIcon,
  CameraIcon,
  MicIcon,
  VideoIcon,
  PaperclipIcon,
  QuestionIcon,
  TargetIcon,
  DownloadIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MapPinIcon,
  GripIcon,
} from '../widgets/primitives/Icon';
import { tokens } from '../tokens/tokens';

afterEach(async () => {
  await cleanup();
});

function flatten(style: unknown): Record<string, unknown> {
  return Array.isArray(style)
    ? Object.assign({}, ...style)
    : (style as Record<string, unknown>);
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

describe('Phase 3 icon expansion (decision 9 + 10) — View/Text composition only, no svg', () => {
  const NEW_ICONS: Array<{
    name: string;
    Component: (props: {
      testID?: string;
      color?: string;
      size?: number;
    }) => React.JSX.Element;
  }> = [
    { name: 'CheckIcon', Component: CheckIcon },
    { name: 'MinusIcon', Component: MinusIcon },
    { name: 'ChevronDownIcon', Component: ChevronDownIcon },
    { name: 'SearchIcon', Component: SearchIcon },
    { name: 'CalendarIcon', Component: CalendarIcon },
    { name: 'ClockIcon', Component: ClockIcon },
    { name: 'CameraIcon', Component: CameraIcon },
    { name: 'MicIcon', Component: MicIcon },
    { name: 'VideoIcon', Component: VideoIcon },
    { name: 'PaperclipIcon', Component: PaperclipIcon },
    { name: 'QuestionIcon', Component: QuestionIcon },
    { name: 'TargetIcon', Component: TargetIcon },
    { name: 'DownloadIcon', Component: DownloadIcon },
    { name: 'ArrowUpIcon', Component: ArrowUpIcon },
    { name: 'ArrowDownIcon', Component: ArrowDownIcon },
    { name: 'MapPinIcon', Component: MapPinIcon },
    { name: 'GripIcon', Component: GripIcon },
  ];

  it.each(NEW_ICONS)(
    '$name renders with its default size as a square footprint',
    async ({ name, Component }) => {
      const testID = `${name}-default`;
      await render(<Component testID={testID} />);
      const node = screen.getByTestId(testID);
      const style = flatten(node.props.style);
      expect(typeof style.width).toBe('number');
      expect(style.width).toBeGreaterThan(0);
      expect(style.height).toBe(style.width);
    }
  );

  it.each(NEW_ICONS)(
    '$name honors an explicit size prop',
    async ({ name, Component }) => {
      const testID = `${name}-sized`;
      await render(<Component testID={testID} size={40} />);
      const node = screen.getByTestId(testID);
      const style = flatten(node.props.style);
      expect(style.width).toBe(40);
      expect(style.height).toBe(40);
    }
  );

  it('exactly 17 new icon exports are added (decision 9 inventory)', () => {
    expect(NEW_ICONS).toHaveLength(17);
  });

  it('CheckIcon renders the default primary color in its tree and honors a color override', async () => {
    const defaultResult = await render(<CheckIcon testID="check-default" />);
    const defaultJson = JSON.stringify(defaultResult.toJSON());
    expect(defaultJson).toContain(tokens.color.roles.primary);
    await cleanup();

    const overrideResult = await render(
      <CheckIcon testID="check-override" color="#7B2CBF" />
    );
    const overrideJson = JSON.stringify(overrideResult.toJSON());
    expect(overrideJson).toContain('#7B2CBF');
    expect(overrideJson).not.toContain(tokens.color.roles.primary);
  });
});
