/**
 * MarkdownText — Phase 8 PR2 tests.
 *
 * Covers the decision-15 anti-false-pass gates (positive: markdown-bearing
 * value produces nested styled <Text> children; negative: markdown-free
 * value produces exactly the single string child — the fast path), bold
 * weight 700 vs. a 600 base, header->typography mapping, color pass-through,
 * and multi-block layout.
 */
import { render, screen, cleanup } from '@testing-library/react-native';
import { MarkdownText } from '../../text/MarkdownText';
import { typography } from '../../tokens/typography';

afterEach(async () => {
  await cleanup();
});

const titleLargeBase = {
  fontSize: typography.titleLarge.fontSize,
  lineHeight: typography.titleLarge.lineHeight,
  fontWeight: String(typography.titleLarge.fontWeight) as any,
  fontFamily: typography.titleLarge.fontFamily,
  color: '#111111',
};

describe('MarkdownText — fast path (negative gate)', () => {
  it('renders a markdown-free value as the single direct string child of one outer Text', async () => {
    await render(<MarkdownText value="Nombre completo" baseStyle={titleLargeBase} testID="question-label" />);
    const outer = screen.getByTestId('question-label');
    // Fast path: exactly one child, and it is the raw string itself (not an
    // element). This is the gate that would fail if someone always ran the
    // full parse/render tree even for plain strings — a always-full-render
    // implementation would produce a React.Fragment/array child here
    // instead of the bare string, which this assertion rejects.
    expect(outer.children).toHaveLength(1);
    expect(outer.children[0]).toBe('Nombre completo');
  });

  it('produces byte-identical text content to a plain <Text> for a markdown-free value', async () => {
    await render(<MarkdownText value="Costo * cantidad" baseStyle={titleLargeBase} testID="question-label" />);
    const outer = screen.getByTestId('question-label');
    // Real-world false-positive guard string (design decision 5): must stay
    // on the fast path even though it contains a bare `*`.
    expect(outer.children).toHaveLength(1);
    expect(outer.children[0]).toBe('Costo * cantidad');
  });
});

describe('MarkdownText — positive gate', () => {
  it('renders a markdown-bearing value as multiple nested Text children', async () => {
    await render(<MarkdownText value="a **b** c" baseStyle={titleLargeBase} testID="question-label" />);
    const outer = screen.getByTestId('question-label');
    // Positive gate: NOT a single bare string child — must be an element
    // tree (array of nested <Text> nodes), proving the full render path ran.
    expect(outer.children.length).toBeGreaterThan(1);
    expect(typeof outer.children[0]).not.toBe('string');
  });

  it('renders the bold span at fontWeight 700, distinguishable from a 600 base', async () => {
    await render(<MarkdownText value="a **b** c" baseStyle={titleLargeBase} testID="question-label" />);
    const boldText = screen.getByText('b');
    const style = Array.isArray(boldText.props.style)
      ? Object.assign({}, ...boldText.props.style.filter(Boolean))
      : boldText.props.style;
    expect(style.fontWeight).toBe('700');
    expect(titleLargeBase.fontWeight).toBe('600');
  });

  it('renders italic spans with fontStyle italic', async () => {
    await render(<MarkdownText value="revisa _el nivel_ de agua" baseStyle={titleLargeBase} testID="question-label" />);
    const italicText = screen.getByText('el nivel');
    const style = Array.isArray(italicText.props.style)
      ? Object.assign({}, ...italicText.props.style.filter(Boolean))
      : italicText.props.style;
    expect(style.fontStyle).toBe('italic');
  });
});

describe('MarkdownText — testID / passthrough props', () => {
  it('places testID on the outer Text exactly once', async () => {
    await render(<MarkdownText value="a **b** c" baseStyle={titleLargeBase} testID="question-label" />);
    expect(screen.getAllByTestId('question-label')).toHaveLength(1);
  });

  it('forwards numberOfLines and ellipsizeMode to the outer Text', async () => {
    await render(
      <MarkdownText
        value="a **b** c"
        baseStyle={titleLargeBase}
        testID="question-label"
        numberOfLines={2}
        ellipsizeMode="tail"
      />
    );
    const outer = screen.getByTestId('question-label');
    expect(outer.props.numberOfLines).toBe(2);
    expect(outer.props.ellipsizeMode).toBe('tail');
  });
});

describe('MarkdownText — header -> typography ladder', () => {
  const cases: Array<[string, 1 | 2 | 3 | 4 | 5 | 6, keyof typeof typography]> = [
    ['# H1', 1, 'headlineLarge'],
    ['## H2', 2, 'headlineSmall'],
    ['### H3', 3, 'titleLarge'],
    ['#### H4', 4, 'titleMedium'],
    ['##### H5', 5, 'titleSmall'],
    ['###### H6', 6, 'labelMedium'],
  ];

  it.each(cases)('maps %s to the correct typography role', async (value, _level, roleName) => {
    await render(<MarkdownText value={value} baseStyle={titleLargeBase} testID="question-label" />);
    const headerText = screen.getByText(value.replace(/^#+\s/, ''));
    // Header styling is applied on the wrapping block <Text>, one level
    // above the leaf span <Text> that carries the literal text.
    const headerBlock = headerText.parent!;
    const style = Array.isArray(headerBlock.props.style)
      ? Object.assign({}, ...headerBlock.props.style.filter(Boolean))
      : headerBlock.props.style;
    const role = typography[roleName];
    expect(style.fontSize).toBe(role.fontSize);
    expect(style.lineHeight).toBe(role.lineHeight);
    expect(style.fontWeight).toBe(String(role.fontWeight));
  });

  it('does not override an inherited color on a header block', async () => {
    await render(<MarkdownText value="# Titulo" baseStyle={titleLargeBase} testID="question-label" />);
    const headerText = screen.getByText('Titulo');
    const headerBlock = headerText.parent!;
    const style = Array.isArray(headerBlock.props.style)
      ? Object.assign({}, ...headerBlock.props.style.filter(Boolean))
      : headerBlock.props.style;
    expect(style.color).toBeUndefined();
  });
});

describe('MarkdownText — color span pass-through', () => {
  it('renders a valid inline color raw, not mapped to a theme role', async () => {
    await render(
      <MarkdownText value='texto <span style="color:#FF0000">rojo</span> fin' baseStyle={titleLargeBase} testID="question-label" />
    );
    const coloredText = screen.getByText('rojo');
    const style = Array.isArray(coloredText.props.style)
      ? Object.assign({}, ...coloredText.props.style.filter(Boolean))
      : coloredText.props.style;
    expect(style.color).toBe('#FF0000');
  });

  it('renders siblings of a colored span without the color leaking', async () => {
    await render(
      <MarkdownText value='texto <span style="color:#FF0000">rojo</span> normal' baseStyle={titleLargeBase} testID="question-label" />
    );
    const normalText = screen.getByText(' normal');
    const style = Array.isArray(normalText.props.style)
      ? Object.assign({}, ...normalText.props.style.filter(Boolean))
      : normalText.props.style;
    expect(style).toBeUndefined();
  });
});

describe('MarkdownText — multi-block layout', () => {
  it('renders each line as its own block, separated in the outer Text children', async () => {
    await render(<MarkdownText value={'# Seccion A\nsub-pregunta'} baseStyle={titleLargeBase} testID="question-label" />);
    const outer = screen.getByTestId('question-label');
    // Two blocks joined by a literal newline separator child.
    expect(outer.children.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText('Seccion A')).toBeTruthy();
    expect(screen.getByText('sub-pregunta')).toBeTruthy();
  });

  it('a header on line 1 does not affect the typography of body text on line 2', async () => {
    await render(<MarkdownText value={'# Seccion A\nsub-pregunta'} baseStyle={titleLargeBase} testID="question-label" />);
    const bodyText = screen.getByText('sub-pregunta');
    const style = Array.isArray(bodyText.props.style)
      ? Object.assign({}, ...bodyText.props.style.filter(Boolean))
      : bodyText.props.style;
    expect(style).toBeUndefined();
  });
});
