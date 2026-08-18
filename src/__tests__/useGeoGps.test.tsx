/**
 * useGeoGps tests — shared GPS/camera state machine hook (PR1 of geo-widget-field-parity).
 *
 * Uses mocked @nuup/xform-native-geo (MapLibre + expo-location) — same seam
 * the widget tests already rely on.
 */
import { act } from 'react';
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
});
