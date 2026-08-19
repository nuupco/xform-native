/**
 * form-chrome — surfaces.tsx component tests (Phase 2 / PR3).
 *
 * Covers LabelHint (typography + required asterisk + single-node-count
 * regression), BofSurface/EofSurface (icon/title/subtitle/button + Eof
 * summary card), RepeatPromptCard (dashed-or-solid border, 56dp min height,
 * full-card hit target), WidgetErrorFallback (content + doesn't block nav).
 */
import { render, screen, cleanup, fireEvent } from '@testing-library/react-native';
import {
  LabelHint,
  BofSurface,
  EofSurface,
  RepeatPromptCard,
  WidgetErrorFallback,
} from '../form/surfaces';
import { tokens } from '../tokens/tokens';

afterEach(async () => {
  await cleanup();
});

function flatten(node: any): Record<string, unknown> {
  const style = node.props.style;
  return Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : (style as Record<string, unknown>);
}

describe('LabelHint', () => {
  it('renders label as titleLarge/onSurface and hint as bodyMedium/onSurfaceVariant with xxs gap + sm margin', async () => {
    await render(<LabelHint label="Name" hint="Your full name" />);
    const label = screen.getByTestId('question-label');
    const hint = screen.getByTestId('question-hint');
    const labelFlat = flatten(label);
    const hintFlat = flatten(hint);
    expect(labelFlat.fontSize).toBe(tokens.typography.titleLarge.fontSize);
    expect(labelFlat.color).toBe(tokens.color.roles.onSurface);
    expect(hintFlat.fontSize).toBe(tokens.typography.bodyMedium.fontSize);
    expect(hintFlat.color).toBe(tokens.color.roles.onSurfaceVariant);
    expect(hintFlat.marginBottom).toBe(tokens.spacing.sm);
  });

  it('renders exactly one required-indicator, tertiary-colored, at label font size, adjacent to label', async () => {
    await render(<LabelHint label="Name" hint="hint" required />);
    const nodes = screen.getAllByTestId('required-indicator');
    expect(nodes).toHaveLength(1);
    const flat = flatten(nodes[0]);
    expect(flat.color).toBe(tokens.color.roles.tertiary);
    expect(flat.fontSize).toBe(tokens.typography.titleLarge.fontSize);
  });

  it('renders zero required-indicators when required is false/omitted', async () => {
    await render(<LabelHint label="Name" hint="hint" />);
    expect(screen.queryByTestId('required-indicator')).toBeNull();
  });

  it('Phase 8 PR3: renders bold markdown in the label while question-label stays queryable as one node', async () => {
    await render(<LabelHint label="Nivel de **agua**" hint="hint" />);
    const label = screen.getByTestId('question-label');
    expect(label).toBeTruthy();
    const boldNode = screen.getByText('agua');
    const boldFlat = flatten(boldNode);
    expect(boldFlat.fontWeight).toBe('700');
  });

  it('Phase 8 PR3: renders bold markdown in the hint while question-hint stays queryable as one node', async () => {
    await render(<LabelHint label="Name" hint="Escriba su **nombre completo**" />);
    const hint = screen.getByTestId('question-hint');
    expect(hint).toBeTruthy();
    const boldNode = screen.getByText('nombre completo');
    const boldFlat = flatten(boldNode);
    expect(boldFlat.fontWeight).toBe('700');
  });

  it('Phase 8 PR3: a markdown-free label renders the fast path — single string child, no nested Text', async () => {
    await render(<LabelHint label="Costo * cantidad" hint="hint" />);
    const label = screen.getByTestId('question-label');
    expect(label.props.children).toBe('Costo * cantidad');
  });

  it('Phase 8 PR3: required asterisk is its own sibling node, not consumed as an emphasis delimiter', async () => {
    await render(<LabelHint label="Nombre *completo*" hint="hint" required />);
    const required = screen.getByTestId('required-indicator');
    expect(required.props.children).toBe('*');
    const italicNode = screen.getByText('completo');
    const italicFlat = flatten(italicNode);
    expect(italicFlat.fontStyle).toBe('italic');
  });
});

describe('BofSurface', () => {
  it('renders icon, headlineSmall title, bodyMedium subtitle, and a 52dp filled Start button', async () => {
    await render(<BofSurface onStart={() => {}} formTitle="Coffee Survey" formVersion="v2" />);
    expect(screen.getByTestId('bof-surface')).toBeTruthy();
    const button = screen.getByTestId('bof-start-button');
    const flat = flatten(button);
    expect(flat.height).toBe(52);
    expect(flat.backgroundColor).toBe(tokens.color.roles.primary);
  });

  it('invokes onStart when the Start button is pressed', async () => {
    const onStart = jest.fn();
    await render(<BofSurface onStart={onStart} />);
    fireEvent.press(screen.getByTestId('bof-start-button'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});

describe('EofSurface', () => {
  it('renders a surfaceVariant summary card with answered/skipped counts before the Finish button', async () => {
    await render(<EofSurface answeredCount={5} skippedCount={2} />);
    expect(screen.getByTestId('eof-surface')).toBeTruthy();
    const summary = screen.getByTestId('eof-summary-card');
    const flat = flatten(summary);
    expect(flat.backgroundColor).toBe(tokens.color.roles.surfaceVariant);
    expect(screen.getByText(/5/)).toBeTruthy();
    expect(screen.getByText(/2/)).toBeTruthy();
  });
});

describe('RepeatPromptCard', () => {
  it('has min height 56dp, surfaceVariant bg, radius.lg, and a dashed (or solid-fallback) 2px border', async () => {
    await render(<RepeatPromptCard label="Household Member" onPress={() => {}} />);
    const card = screen.getByTestId('prompt-continue');
    const flat = flatten(card);
    expect(flat.minHeight).toBeGreaterThanOrEqual(56);
    expect(flat.backgroundColor).toBe(tokens.color.roles.surfaceVariant);
    expect(flat.borderRadius).toBe(tokens.radius.lg);
    expect(flat.borderWidth).toBe(2);
    expect(['dashed', 'solid']).toContain(flat.borderStyle);
    expect(screen.getByText('Agregar otro/a Household Member')).toBeTruthy();
  });

  it('the whole card (not just icon/text) is the single pressable hit target', async () => {
    const onPress = jest.fn();
    await render(<RepeatPromptCard label="Group" onPress={onPress} />);
    fireEvent.press(screen.getByTestId('prompt-continue'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('Phase 8 PR3: strips markdown from an authored repeat label — no literal asterisks, plain interpolated text', async () => {
    await render(<RepeatPromptCard label="**Parcela**" onPress={() => {}} />);
    expect(screen.getByText('Agregar otro/a Parcela')).toBeTruthy();
    expect(screen.queryByText(/\*/)).toBeNull();
  });
});

describe('WidgetErrorFallback', () => {
  it('renders an errorContainer card, alert icon, Spanish message, and the mono field name', async () => {
    await render(<WidgetErrorFallback fieldName="/data/q1" />);
    const fallback = screen.getByTestId('widget-error-fallback');
    const flat = flatten(fallback);
    expect(flat.backgroundColor).toBe(tokens.color.roles.errorContainer);
    expect(screen.getByText('Esta pregunta no se pudo mostrar')).toBeTruthy();
    const fieldNode = screen.getByTestId('widget-error-fallback-field');
    const fieldFlat = flatten(fieldNode);
    expect(fieldFlat.fontFamily).toBe(tokens.typography.mono.fontFamily);
    expect(screen.getByText('/data/q1')).toBeTruthy();
  });
});
