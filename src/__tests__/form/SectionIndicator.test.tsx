/**
 * SectionIndicator — Phase 7 / PR2 (pure component, not wired into Form.tsx).
 *
 * Covers: group segment copy, repeat "N de M" copy, empty path renders
 * null, null-labeled segment omission, separator placement, final-segment
 * emphasis / no uppercase, tail truncation for long chains, and
 * group-inside-repeat ordering. See spec topic
 * sdd/material3-campo-restyle/phase7-spec and tasks topic
 * sdd/material3-campo-restyle/phase7-tasks (PR2).
 */
import { render, screen, cleanup } from '@testing-library/react-native';
import { SectionIndicator } from '../../form/SectionIndicator';
import type { PathSegment } from '../../adapter/FormAdapter';
import { tokens } from '../../tokens/tokens';

afterEach(async () => {
  await cleanup();
});

function flatten(node: any): Record<string, unknown> {
  const style = node.props.style;
  return Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : (style as Record<string, unknown>);
}

const group = (label: string | null): PathSegment => ({
  kind: 'group',
  label,
  multiplicity: null,
  total: null,
  countBound: false,
});

const repeat = (
  label: string | null,
  multiplicity: number,
  total: number,
  countBound = false,
): PathSegment => ({ kind: 'repeat', label, multiplicity, total, countBound });

describe('SectionIndicator', () => {
  it('renders a group segment label verbatim, no repeat-style suffix', async () => {
    await render(<SectionIndicator path={[group('Datos del productor')]} />);
    expect(screen.getByText('Datos del productor')).toBeTruthy();
  });

  it('renders a repeat segment as "Parcela 2 de 4" (1-indexed multiplicity)', async () => {
    await render(<SectionIndicator path={[repeat('Parcela', 1, 4)]} />);
    expect(screen.getByText('Parcela 2 de 4')).toBeTruthy();
  });

  it('renders null for an empty path — no placeholder, no root crumb', async () => {
    const result = await render(<SectionIndicator path={[]} />);
    expect(screen.queryByTestId('section-indicator')).toBeNull();
    expect(result.toJSON()).toBeNull();
  });

  it('omits a segment with label: null entirely, not as "null 2 de 4"', async () => {
    await render(<SectionIndicator path={[group('Datos del productor'), repeat(null, 1, 4)]} />);
    expect(screen.getByText('Datos del productor')).toBeTruthy();
    expect(screen.queryByText(/null/)).toBeNull();
    expect(screen.queryByText(/2 de 4/)).toBeNull();
  });

  it('renders a separator between segments, absent before the first', async () => {
    await render(<SectionIndicator path={[group('Datos del productor'), repeat('Parcela', 1, 4)]} />);
    expect(screen.getByText('Datos del productor › Parcela 2 de 4')).toBeTruthy();
  });

  it('final segment gets titleSmall/onSurface emphasis, earlier segments labelMedium/onSurfaceVariant, no uppercase transform', async () => {
    await render(<SectionIndicator path={[group('Datos del productor'), repeat('Parcela', 1, 4)]} />);
    const segments = screen.getAllByTestId('section-indicator-segment');
    expect(segments).toHaveLength(2);
    const first = flatten(segments[0]);
    const last = flatten(segments[1]);
    expect(first.fontSize).toBe(tokens.typography.labelMedium.fontSize);
    expect(first.color).toBe(tokens.color.roles.onSurfaceVariant);
    expect(last.fontSize).toBe(tokens.typography.titleSmall.fontSize);
    expect(last.color).toBe(tokens.color.roles.onSurface);
    expect(first.textTransform).not.toBe('uppercase');
    expect(last.textTransform).not.toBe('uppercase');
  });

  it('renders group-inside-repeat path in root→leaf order with correct copy per kind', async () => {
    await render(
      <SectionIndicator
        path={[group('Datos del productor'), repeat('Parcela', 1, 4), group('Riego')]}
      />,
    );
    expect(
      screen.getByText('Datos del productor › Parcela 2 de 4 › Riego'),
    ).toBeTruthy();
  });

  it('truncates a long chain with a leading ellipsis and numberOfLines=2 on the text container', async () => {
    await render(
      <SectionIndicator
        path={[
          group('Datos del productor'),
          group('Sección socioeconómica'),
          repeat('Parcela', 1, 4),
          repeat('Riego', 0, 2),
        ]}
      />,
    );
    const row = screen.getByTestId('section-indicator');
    expect(row).toBeTruthy();
    expect(screen.getByText(/^… ›/)).toBeTruthy();
    expect(screen.queryByText(/Datos del productor/)).toBeNull();
    const textNode = screen.getByTestId('section-indicator-text');
    expect(textNode.props.numberOfLines).toBe(2);
  });

  it('renders no Pressable/TouchableOpacity — non-interactive', async () => {
    await render(<SectionIndicator path={[group('Datos del productor')]} />);
    const row = screen.getByTestId('section-indicator');
    expect(row.props.onPress).toBeUndefined();
    expect(row.props.onStartShouldSetResponder).toBeUndefined();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
