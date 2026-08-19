import { render, screen, cleanup } from '@testing-library/react-native';
import { NavRow } from '../../form/NavRow';
import { tokens } from '../../tokens/tokens';

afterEach(async () => {
  await cleanup();
});

function flatten(node: any): Record<string, unknown> {
  const style = node.props.style;
  return Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : (style as Record<string, unknown>);
}

describe('NavRow', () => {
  it('renders Next as filled/primary/48dp/radius.md by default', async () => {
    await render(<NavRow onBack={() => {}} onNext={() => {}} />);
    expect(screen.getByText('Siguiente')).toBeTruthy();
    const next = screen.getByTestId('nav-next');
    const flat = flatten(next);
    expect(flat.backgroundColor).toBe(tokens.color.roles.primary);
    expect(flat.height).toBe(48);
    expect(flat.borderRadius).toBe(tokens.radius.md);
  });

  it('isLastStep renders "Finalizar" in secondary/gold treatment', async () => {
    await render(<NavRow onBack={() => {}} onNext={() => {}} isLastStep />);
    expect(screen.getByText('Finalizar')).toBeTruthy();
    const next = screen.getByTestId('nav-next');
    const flat = flatten(next);
    expect(flat.backgroundColor).toBe(tokens.color.roles.secondary);
  });

  it('Back renders as ghost (no background), primary text, height 48', async () => {
    await render(<NavRow onBack={() => {}} onNext={() => {}} />);
    const back = screen.getByTestId('nav-back');
    const flat = flatten(back);
    expect(flat.backgroundColor).toBeUndefined();
    expect(flat.height).toBe(48);
    expect(screen.getByText('Atrás')).toBeTruthy();
  });

  it('disabled Next applies 38% content opacity without graying the row background', async () => {
    await render(<NavRow onBack={() => {}} onNext={() => {}} nextDisabled />);
    const label = screen.getByText('Siguiente');
    const labelFlat = flatten(label);
    expect(labelFlat.opacity).toBe(tokens.disabled.contentOpacity);
    const next = screen.getByTestId('nav-next');
    const flat = flatten(next);
    expect(flat.backgroundColor).toBe(tokens.color.roles.primary);
  });

  it('shows elevation-2/outlineVariant-border chrome on the pinned row', async () => {
    await render(<NavRow onBack={() => {}} onNext={() => {}} />);
    const row = screen.getByTestId('nav-row');
    const flat = flatten(row);
    expect(flat.borderTopWidth).toBe(1);
    expect(flat.borderTopColor).toBe(tokens.color.roles.outlineVariant);
  });
});
