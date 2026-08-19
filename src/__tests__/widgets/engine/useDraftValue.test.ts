/**
 * useDraftValue — shared draft-editing hook for numeric widgets (widget-draft-value).
 *
 * Covers REQ-1 through REQ-10 at the hook level using an injected int-shaped
 * parse predicate (`/^-?\d+$/`) unless a scenario specifically needs decimal
 * or thousands-sep behavior.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useDraftValue, type DraftConfig } from '../../../widgets/engine/useDraftValue';

function intParse(text: string): { committable: boolean; value: number | null } {
  const s = text.replace(/,/g, '').trim();
  if (s === '') return { committable: true, value: null };
  if (/^-?\d+$/.test(s)) return { committable: true, value: parseInt(s, 10) };
  return { committable: false, value: null };
}

function decimalParse(text: string): { committable: boolean; value: number | null } {
  const s = text.replace(/,/g, '').trim();
  if (s === '') return { committable: true, value: null };
  if (/^-?\d+(\.\d+)?$/.test(s)) return { committable: true, value: parseFloat(s) };
  return { committable: false, value: null };
}

async function setup(cfg: Partial<DraftConfig<number>> & { storeValue: unknown }) {
  const commit = jest.fn();
  const base: DraftConfig<number> = {
    storeValue: cfg.storeValue,
    commit,
    parse: cfg.parse ?? intParse,
    format: cfg.format,
    readonly: cfg.readonly,
  };
  const { result, rerender } = await renderHook(
    (props: DraftConfig<number>) => useDraftValue(props),
    { initialProps: base }
  );
  return { result, rerender, commit, base };
}

describe('useDraftValue', () => {
  it('clear-to-empty commits null live (REQ-2/9)', async () => {
    const { result, commit } = await setup({ storeValue: 42 });

    await act(() => {
      result.current.onFocus();
    });
    await act(() => {
      result.current.onChangeText('');
    });

    expect(result.current.value).toBe('');
    expect(commit).toHaveBeenCalledWith(null);
  });

  it('typing lone "-" holds as draft, does NOT commit (REQ-3)', async () => {
    const { result, commit } = await setup({ storeValue: null });

    await act(() => {
      result.current.onFocus();
    });
    await act(() => {
      result.current.onChangeText('-');
    });

    expect(result.current.value).toBe('-');
    expect(commit).not.toHaveBeenCalled();
  });

  it('blur reverts uncommitted draft "1." to last committed value formatted form (REQ-4/6.1)', async () => {
    const { result, commit, rerender, base } = await setup({ storeValue: null, parse: decimalParse });

    await act(() => {
      result.current.onFocus();
    });
    await act(() => {
      result.current.onChangeText('1.');
    });

    expect(result.current.value).toBe('1.');
    expect(commit).not.toHaveBeenCalled();

    await act(() => {
      result.current.onBlur();
    });
    await rerender(base);

    expect(result.current.value).toBe('');
    expect(commit).not.toHaveBeenCalled();
  });

  it('live commit while parseable calls commit synchronously per keystroke (REQ-5)', async () => {
    const { result, commit } = await setup({ storeValue: 0 });

    await act(() => {
      result.current.onFocus();
    });
    await act(() => {
      result.current.onChangeText('7');
    });

    expect(commit).toHaveBeenCalledWith(7);
  });

  it('blurred + external storeValue change updates returned value (REQ-7)', async () => {
    const { result, rerender, base } = await setup({ storeValue: 10 });

    expect(result.current.value).toBe('10');

    await rerender({ ...base, storeValue: 25 });

    expect(result.current.value).toBe('25');
  });

  it('focused + external storeValue change does NOT clobber in-progress draft (REQ-8)', async () => {
    const { result, rerender, base } = await setup({ storeValue: 0 });

    await act(() => {
      result.current.onFocus();
    });
    await act(() => {
      result.current.onChangeText('-');
    });

    expect(result.current.value).toBe('-');

    // external update while focused (e.g. an unrelated calculate cascade)
    await rerender({ ...base, storeValue: 99 });

    expect(result.current.value).toBe('-');
  });

  it('thousands-sep: raw digits while focused, format() applied only while blurred (REQ-10.1/10.2)', async () => {
    const format = (raw: string) => (raw !== '' ? Number(raw).toLocaleString('en-US') : raw);
    const { result, commit, rerender, base } = await setup({
      storeValue: 1234567,
      format,
    });

    // blurred initial render: formatted
    expect(result.current.value).toBe('1,234,567');

    await act(() => {
      result.current.onFocus();
    });
    await rerender({ ...base, format });

    // focused: raw, unformatted
    expect(result.current.value).toBe('1234567');

    await act(() => {
      result.current.onChangeText('12345678');
    });

    expect(commit).toHaveBeenCalledWith(12345678);
    expect(result.current.value).toBe('12345678');

    await act(() => {
      result.current.onBlur();
    });
    await rerender({ ...base, storeValue: 12345678, format });

    expect(result.current.value).toBe('12,345,678');
  });
});
