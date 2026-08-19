/**
 * useGeoGps tests — shared GPS/camera state machine hook (PR1 of geo-widget-field-parity).
 *
 * Uses mocked @nuup/xform-native-geo (MapLibre + expo-location) — same seam
 * the widget tests already rely on.
 */
import { act } from 'react';
import { Linking } from 'react-native';
import { renderHook, waitFor, cleanup } from '@testing-library/react-native';
import { useGeoGps } from '../widgets/primitives/useGeoGps';

const mockGeo = require('@nuup/xform-native-geo');

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

describe('useGeoGps', () => {
  it('transitions idle -> denied when permission is denied', async () => {
    mockGeo.Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
    });

    const { result } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

    expect(result.current.status).toBe('idle');

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe('denied'));
    expect(result.current.currentPoint).toBeNull();
  });

  it('transitions to tracking with accuracy on a granted watch fix', async () => {
    const { result } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe('tracking'));
    expect(result.current.currentPoint).toEqual({
      lat: mockGeo.__mockLocation.coords.latitude,
      lon: mockGeo.__mockLocation.coords.longitude,
      alt: mockGeo.__mockLocation.coords.altitude,
      acc: mockGeo.__mockLocation.coords.accuracy,
    });
  });

  it('awaits getLastKnownPositionAsync before watchPositionAsync and flies to 600 then 800 on first live fix', async () => {
    const flyTo = jest.fn();
    const callOrder: string[] = [];
    mockGeo.Location.getLastKnownPositionAsync.mockImplementationOnce(async () => {
      callOrder.push('lastKnown');
      return mockGeo.__mockLocation;
    });
    const originalWatch = mockGeo.Location.watchPositionAsync.getMockImplementation();
    mockGeo.Location.watchPositionAsync.mockImplementationOnce((options: any, callback: any) => {
      callOrder.push('watch');
      return originalWatch!(options, callback);
    });

    const { result } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

    await act(async () => {
      result.current.cameraRef.current = { flyTo };
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe('tracking'));

    expect(callOrder).toEqual(['lastKnown', 'watch']);
    expect(flyTo).toHaveBeenCalledTimes(2);
    expect(flyTo.mock.calls[0][0]).toMatchObject({ duration: 600 });
    expect(flyTo.mock.calls[1][0]).toMatchObject({ duration: 800 });
  });

  it('transitions to error when watchPositionAsync rejects', async () => {
    mockGeo.Location.watchPositionAsync.mockImplementationOnce(() =>
      Promise.reject(new Error('gps hardware error')),
    );

    const { result } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('removes the watch subscription on unmount', async () => {
    const removeSpy = jest.fn();
    mockGeo.Location.watchPositionAsync.mockImplementationOnce((_options: any, callback: any) => {
      callback(mockGeo.__mockLocation);
      return Promise.resolve({ remove: removeSpy });
    });

    const { result, unmount } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe('tracking'));

    await act(async () => {
      await unmount();
    });

    expect(removeSpy).toHaveBeenCalled();
  });

  it('recenter re-flies the camera to the current point', async () => {
    const flyTo = jest.fn();
    const { result } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

    await act(async () => {
      result.current.cameraRef.current = { flyTo };
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe('tracking'));
    flyTo.mockClear();

    act(() => {
      result.current.recenter();
    });

    expect(flyTo).toHaveBeenCalledTimes(1);
    expect(flyTo.mock.calls[0][0]).toMatchObject({
      center: [
        mockGeo.__mockLocation.coords.longitude,
        mockGeo.__mockLocation.coords.latitude,
      ],
    });
  });

  // --- Phase 5: GPS permission flow (PR1 — state machine) ---

  it('undetermined pre-check shows rationale without calling requestForegroundPermissionsAsync', async () => {
    mockGeo.Location.getForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'undetermined',
      granted: false,
      canAskAgain: true,
      expires: 'never',
    });

    const { result } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe('rationale'));
    expect(mockGeo.Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('requestPermission from rationale granted leads to acquiring then tracking', async () => {
    mockGeo.Location.getForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'undetermined',
      granted: false,
      canAskAgain: true,
      expires: 'never',
    });

    const { result } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe('rationale'));

    await act(async () => {
      await result.current.requestPermission();
    });

    await waitFor(() => expect(result.current.status).toBe('tracking'));
  });

  it('dismissRationale moves to denied without an OS call', async () => {
    mockGeo.Location.getForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'undetermined',
      granted: false,
      canAskAgain: true,
      expires: 'never',
    });

    const { result } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe('rationale'));

    act(() => {
      result.current.dismissRationale();
    });

    expect(result.current.status).toBe('denied');
    expect(mockGeo.Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('pre-check denied with canAskAgain lets requestPermission re-ask', async () => {
    mockGeo.Location.getForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: true,
      expires: 'never',
    });

    const { result } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe('denied'));

    await act(async () => {
      await result.current.requestPermission();
    });

    await waitFor(() => expect(result.current.status).toBe('tracking'));
    expect(mockGeo.Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('pre-check denied without canAskAgain blocks and requestPermission is a no-op', async () => {
    mockGeo.Location.getForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: false,
      expires: 'never',
    });

    const { result } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe('blocked'));

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.status).toBe('blocked');
    expect(mockGeo.Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('requestPermission denial without canAskAgain escalates denied to blocked', async () => {
    mockGeo.Location.getForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: true,
      expires: 'never',
    });
    mockGeo.Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: false,
      expires: 'never',
    });

    const { result } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe('denied'));

    await act(async () => {
      await result.current.requestPermission();
    });

    await waitFor(() => expect(result.current.status).toBe('blocked'));
  });

  it('openLocationSettings calls Linking.openSettings and stays blocked when it rejects', async () => {
    mockGeo.Location.getForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: false,
      expires: 'never',
    });
    (Linking.openSettings as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('cannot open settings')),
    );

    const { result } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe('blocked'));

    expect(() => {
      act(() => {
        result.current.openLocationSettings();
      });
    }).not.toThrow();

    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('blocked');
  });

  it('recovers from blocked when AppState becomes active and permission is now granted', async () => {
    mockGeo.Location.getForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: false,
      expires: 'never',
    });

    const { result, unmount } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe('blocked'));

    const { AppState } = require('react-native');
    const addEventListenerMock = AppState.addEventListener as jest.Mock;
    expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
    const lastCallIndex = addEventListenerMock.mock.calls.length - 1;
    const changeHandler = addEventListenerMock.mock.calls[lastCallIndex]![1];
    const removeSpy = addEventListenerMock.mock.results[lastCallIndex]!.value.remove as jest.Mock;

    mockGeo.Location.getForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never',
    });

    await act(async () => {
      await changeHandler('active');
    });

    await waitFor(() => expect(result.current.status).toBe('tracking'));
    expect(removeSpy).toHaveBeenCalled();

    await act(async () => {
      await unmount();
    });
  });

  it('falls back to legacy direct-request behavior when getForegroundPermissionsAsync is absent', async () => {
    const original = mockGeo.Location.getForegroundPermissionsAsync;
    delete mockGeo.Location.getForegroundPermissionsAsync;
    mockGeo.Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: true,
      expires: 'never',
    });

    try {
      const { result } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

      await act(async () => {
        await result.current.start();
      });

      await waitFor(() => expect(result.current.status).toBe('denied'));
      expect(result.current.currentPoint).toBeNull();
    } finally {
      mockGeo.Location.getForegroundPermissionsAsync = original;
    }
  });

  it('granted pre-check still yields lastKnown-then-watch order and 600/800 flyTo durations', async () => {
    const flyTo = jest.fn();
    const callOrder: string[] = [];
    mockGeo.Location.getLastKnownPositionAsync.mockImplementationOnce(async () => {
      callOrder.push('lastKnown');
      return mockGeo.__mockLocation;
    });
    const originalWatch = mockGeo.Location.watchPositionAsync.getMockImplementation();
    mockGeo.Location.watchPositionAsync.mockImplementationOnce((options: any, callback: any) => {
      callOrder.push('watch');
      return originalWatch!(options, callback);
    });

    const { result } = await renderHook(() => useGeoGps(mockGeo, { enabled: true }));

    await act(async () => {
      result.current.cameraRef.current = { flyTo };
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe('tracking'));

    expect(callOrder).toEqual(['lastKnown', 'watch']);
    expect(flyTo).toHaveBeenCalledTimes(2);
    expect(flyTo.mock.calls[0][0]).toMatchObject({ duration: 600 });
    expect(flyTo.mock.calls[1][0]).toMatchObject({ duration: 800 });
  });
});
