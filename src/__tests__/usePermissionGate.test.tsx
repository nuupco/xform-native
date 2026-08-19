/**
 * usePermissionGate tests — shared media permission state machine hook
 * (Phase 6, PR1). Mirrors useGeoGps.test.tsx's permission-flow tests but
 * exercises the adapter-parameterized hook directly with a fake
 * `PermissionAdapter`, since this hook has no expo module of its own.
 */
import { act } from 'react';
import { Linking } from 'react-native';
import { renderHook, waitFor, cleanup } from '@testing-library/react-native';
import { usePermissionGate, type PermissionAdapter } from '../widgets/primitives/usePermissionGate';

function makeAdapter(overrides: Partial<PermissionAdapter> = {}): PermissionAdapter {
  return {
    get: jest.fn().mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    }),
    request: jest.fn().mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    }),
    ...overrides,
  };
}

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

describe('usePermissionGate', () => {
  it('granted pre-check resolves ensure() true and never calls request()', async () => {
    const adapter = makeAdapter();
    const { result } = await renderHook(() => usePermissionGate(adapter));

    let resolved: boolean | undefined;
    await act(async () => {
      resolved = await result.current.ensure();
    });

    expect(resolved).toBe(true);
    expect(result.current.status).toBe('granted');
    expect(adapter.request).not.toHaveBeenCalled();
  });

  it('undetermined pre-check shows rationale and does not call request()', async () => {
    const adapter = makeAdapter({
      get: jest.fn().mockResolvedValue({ status: 'undetermined', granted: false, canAskAgain: true }),
    });
    const { result } = await renderHook(() => usePermissionGate(adapter));

    let resolved: boolean | undefined;
    await act(async () => {
      resolved = await result.current.ensure();
    });

    expect(resolved).toBe(false);
    expect(result.current.status).toBe('rationale');
    expect(adapter.request).not.toHaveBeenCalled();
  });

  it('rationale + requestPermission granted leads to granted', async () => {
    const adapter = makeAdapter({
      get: jest.fn().mockResolvedValue({ status: 'undetermined', granted: false, canAskAgain: true }),
    });
    const { result } = await renderHook(() => usePermissionGate(adapter));

    await act(async () => {
      await result.current.ensure();
    });
    expect(result.current.status).toBe('rationale');

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.status).toBe('granted');
  });

  it('dismissRationale moves to denied without an OS call', async () => {
    const adapter = makeAdapter({
      get: jest.fn().mockResolvedValue({ status: 'undetermined', granted: false, canAskAgain: true }),
    });
    const { result } = await renderHook(() => usePermissionGate(adapter));

    await act(async () => {
      await result.current.ensure();
    });
    expect(result.current.status).toBe('rationale');

    act(() => {
      result.current.dismissRationale();
    });

    expect(result.current.status).toBe('denied');
    expect(adapter.request).not.toHaveBeenCalled();
  });

  it('denied with canAskAgain:true lets requestPermission re-ask', async () => {
    const adapter = makeAdapter({
      get: jest.fn().mockResolvedValue({ status: 'denied', granted: false, canAskAgain: true }),
      request: jest.fn().mockResolvedValue({ status: 'granted', granted: true, canAskAgain: true }),
    });
    const { result } = await renderHook(() => usePermissionGate(adapter));

    await act(async () => {
      await result.current.ensure();
    });
    expect(result.current.status).toBe('denied');

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.status).toBe('granted');
    expect(adapter.request).toHaveBeenCalledTimes(1);
  });

  it('denied with canAskAgain:false blocks and requestPermission is a no-op', async () => {
    const adapter = makeAdapter({
      get: jest.fn().mockResolvedValue({ status: 'denied', granted: false, canAskAgain: false }),
    });
    const { result } = await renderHook(() => usePermissionGate(adapter));

    await act(async () => {
      await result.current.ensure();
    });
    expect(result.current.status).toBe('blocked');

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.status).toBe('blocked');
    expect(adapter.request).not.toHaveBeenCalled();
  });

  it('requestPermission returning canAskAgain:false escalates denied to blocked', async () => {
    const adapter = makeAdapter({
      get: jest.fn().mockResolvedValue({ status: 'denied', granted: false, canAskAgain: true }),
      request: jest.fn().mockResolvedValue({ status: 'denied', granted: false, canAskAgain: false }),
    });
    const { result } = await renderHook(() => usePermissionGate(adapter));

    await act(async () => {
      await result.current.ensure();
    });
    expect(result.current.status).toBe('denied');

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.status).toBe('blocked');
  });

  it('openSettings calls Linking.openSettings once and stays blocked when it rejects', async () => {
    const adapter = makeAdapter({
      get: jest.fn().mockResolvedValue({ status: 'denied', granted: false, canAskAgain: false }),
    });
    (Linking.openSettings as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('cannot open settings')),
    );

    const { result } = await renderHook(() => usePermissionGate(adapter));

    await act(async () => {
      await result.current.ensure();
    });
    expect(result.current.status).toBe('blocked');

    expect(() => {
      act(() => {
        result.current.openSettings();
      });
    }).not.toThrow();

    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('blocked');
  });

  it('recovers from blocked when AppState becomes active and permission is now granted', async () => {
    const adapter = makeAdapter({
      get: jest.fn().mockResolvedValue({ status: 'denied', granted: false, canAskAgain: false }),
    });

    const { result, unmount } = await renderHook(() => usePermissionGate(adapter));

    await act(async () => {
      await result.current.ensure();
    });
    expect(result.current.status).toBe('blocked');

    const { AppState } = require('react-native');
    const addEventListenerMock = AppState.addEventListener as jest.Mock;
    expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
    const lastCallIndex = addEventListenerMock.mock.calls.length - 1;
    const changeHandler = addEventListenerMock.mock.calls[lastCallIndex]![1];
    const removeSpy = addEventListenerMock.mock.results[lastCallIndex]!.value.remove as jest.Mock;

    (adapter.get as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });

    await act(async () => {
      await changeHandler('active');
    });

    await waitFor(() => expect(result.current.status).toBe('granted'));
    expect(removeSpy).toHaveBeenCalled();

    await act(async () => {
      await unmount();
    });
  });

  it('removes the AppState subscription once the gate leaves blocked', async () => {
    const adapter = makeAdapter({
      get: jest.fn().mockResolvedValue({ status: 'denied', granted: false, canAskAgain: false }),
    });

    const { result, rerender } = await renderHook(
      ({ a }: { a: PermissionAdapter }) => usePermissionGate(a),
      { initialProps: { a: adapter } },
    );

    await act(async () => {
      await result.current.ensure();
    });
    expect(result.current.status).toBe('blocked');

    const { AppState } = require('react-native');
    const addEventListenerMock = AppState.addEventListener as jest.Mock;
    const lastCallIndex = addEventListenerMock.mock.calls.length - 1;
    const removeSpy = addEventListenerMock.mock.results[lastCallIndex]!.value.remove as jest.Mock;

    act(() => {
      result.current.reset();
    });
    rerender({ a: adapter });

    expect(removeSpy).toHaveBeenCalled();
  });

  it('falls back to legacy proceed-as-today behavior when adapter.get is absent', async () => {
    const adapter: PermissionAdapter = {
      request: jest.fn().mockResolvedValue({ status: 'granted', granted: true, canAskAgain: true }),
    };

    const { result } = await renderHook(() => usePermissionGate(adapter));

    let resolved: boolean | undefined;
    await act(async () => {
      resolved = await result.current.ensure();
    });

    expect(resolved).toBe(true);
    expect(adapter.request).not.toHaveBeenCalled();
  });

  it('does not throw or update state after unmount', async () => {
    let resolveGet: (value: any) => void = () => {};
    const adapter = makeAdapter({
      get: jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveGet = resolve;
          }),
      ),
    });

    const { result, unmount } = await renderHook(() => usePermissionGate(adapter));

    const ensurePromise = act(async () => {
      await result.current.ensure();
    });

    await act(async () => {
      await unmount();
    });

    expect(() => {
      resolveGet({ status: 'granted', granted: true, canAskAgain: true });
    }).not.toThrow();

    await ensurePromise;
  });

  it('reset() returns status to idle', async () => {
    const adapter = makeAdapter({
      get: jest.fn().mockResolvedValue({ status: 'denied', granted: false, canAskAgain: true }),
    });
    const { result } = await renderHook(() => usePermissionGate(adapter));

    await act(async () => {
      await result.current.ensure();
    });
    expect(result.current.status).toBe('denied');

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
  });
});
