/**
 * useGeoGps — shared GPS/camera state machine for the geo widgets.
 *
 * Extracted from the byte-identical watch block previously duplicated in
 * GeoPointWidget, GeoTraceWidget, and GeoShapeWidget. Owns permission
 * request, last-known-position bootstrap (fast centering), the live watch
 * subscription, and the camera ref used to fly to fixes. Does NOT own map
 * chrome, markers, or geometry — those stay in each widget.
 *
 * The already-`require`d `geo` module (MapLibre + expo-location) is passed
 * in rather than required by the hook itself, preserving the optional
 * peer-dep firewall and the `__mocks__/@nuup/xform-native-geo.js` test seam.
 *
 * Phase 5 adds a permission pre-check + rationale/blocked states so the OS
 * one-shot prompt is never fired without user context, and a Settings deep
 * link + AppState recovery for permanently-denied permissions.
 */
import { AppState, Linking } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';

export type GpsStatus =
  | 'idle'
  | 'rationale'
  | 'requesting'
  | 'denied'
  | 'blocked'
  | 'acquiring'
  | 'tracking'
  | 'error';

export function isPermissionState(status: GpsStatus): boolean {
  return status === 'rationale' || status === 'denied' || status === 'blocked';
}

export interface GpsFix {
  lat: number;
  lon: number;
  alt: number;
  acc: number;
}

export interface UseGeoGpsOptions {
  enabled: boolean;
}

export interface UseGeoGpsResult {
  status: GpsStatus;
  currentPoint: GpsFix | null;
  cameraRef: React.MutableRefObject<any>;
  canAskAgain: boolean;
  // Returns a Promise so tests can await full settlement; widgets may
  // ignore the return value and call it fire-and-forget (design: void).
  start: () => Promise<void> | undefined;
  stop: () => void;
  recenter: () => void;
  requestPermission: () => Promise<void>;
  dismissRationale: () => void;
  openLocationSettings: () => void;
}

function toFix(loc: any): GpsFix {
  return {
    lat: loc.coords.latitude,
    lon: loc.coords.longitude,
    alt: loc.coords.altitude ?? 0,
    acc: loc.coords.accuracy ?? 0,
  };
}

export function useGeoGps(geo: any, opts: UseGeoGpsOptions): UseGeoGpsResult {
  const { enabled } = opts;
  const [status, setStatus] = useState<GpsStatus>('idle');
  const [currentPoint, setCurrentPoint] = useState<GpsFix | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);

  const cameraRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const watchRef = useRef<{ remove: () => void } | null>(null);
  // Two independent one-shot flags: cache-centering flies once from the
  // last-known position; live-centering flies once on the first live fix.
  // They are intentionally decoupled so both flights happen in sequence.
  const cacheCenteredRef = useRef(false);
  const liveCenteredRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
    cacheCenteredRef.current = false;
    liveCenteredRef.current = false;
    setStatus('idle');
  }, []);

  const beginWatch = useCallback(async () => {
    setStatus('acquiring');

    const lastKnown = await geo.Location.getLastKnownPositionAsync();
    if (!mountedRef.current) return;
    if (lastKnown && !cacheCenteredRef.current) {
      const fix = toFix(lastKnown);
      setCurrentPoint(fix);
      cacheCenteredRef.current = true;
      cameraRef.current?.flyTo?.({ center: [fix.lon, fix.lat], duration: 600 });
    }

    const sub = await geo.Location.watchPositionAsync(
      {
        accuracy: geo.Location.Accuracy?.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 0,
      },
      (loc: any) => {
        if (!mountedRef.current) return;
        const fix = toFix(loc);
        setCurrentPoint(fix);
        setStatus('tracking');
        if (!liveCenteredRef.current) {
          liveCenteredRef.current = true;
          cameraRef.current?.flyTo?.({ center: [fix.lon, fix.lat], duration: 800 });
        }
      },
    );

    if (!mountedRef.current) {
      sub.remove();
      return;
    }
    watchRef.current = sub;
  }, [geo]);

  const start = useCallback(() => {
    if (!geo || !enabled) return undefined;

    return (async () => {
      try {
        const precheck = await geo.Location.getForegroundPermissionsAsync?.();
        if (precheck) {
          if (!mountedRef.current) return;
          if (precheck.status === 'undetermined') {
            setStatus('rationale');
            return;
          }
          if (precheck.status !== 'granted') {
            const askAgain = precheck.canAskAgain ?? true;
            setCanAskAgain(askAgain);
            setStatus(askAgain ? 'denied' : 'blocked');
            return;
          }
          // precheck already granted: fall through to the direct-request
          // path below, which is a no-op OS call that resolves immediately.
        }

        setStatus('requesting');
        const { status: permStatus } = await geo.Location.requestForegroundPermissionsAsync();
        if (!mountedRef.current) return;
        if (permStatus !== 'granted') {
          setStatus('denied');
          return;
        }

        await beginWatch();
      } catch {
        if (mountedRef.current) setStatus('error');
      }
    })();
  }, [geo, enabled, beginWatch]);

  const requestPermission = useCallback(async () => {
    if (!geo) return;
    if (status === 'blocked') return;

    try {
      const { status: permStatus, canAskAgain: askAgain } =
        await geo.Location.requestForegroundPermissionsAsync();
      if (!mountedRef.current) return;
      if (permStatus === 'granted') {
        await beginWatch();
        return;
      }
      const nextCanAskAgain = askAgain ?? true;
      setCanAskAgain(nextCanAskAgain);
      setStatus(nextCanAskAgain ? 'denied' : 'blocked');
    } catch {
      if (mountedRef.current) setStatus('error');
    }
  }, [geo, status, beginWatch]);

  const dismissRationale = useCallback(() => {
    setStatus('denied');
  }, []);

  const openLocationSettings = useCallback(() => {
    try {
      // openSettings() can reject on some Android OEM builds; swallow it
      // here too so it never surfaces as an unhandled rejection. Stay
      // `blocked` — never `error`, which means GPS hardware failure.
      Promise.resolve(Linking.openSettings()).catch(() => undefined);
    } catch {
      // Synchronous throw fallback, same handling.
    }
  }, []);

  // Recovery: while blocked, watch for the app returning to foreground
  // (e.g. after the user grants the permission in system Settings) and
  // re-run the pre-check once.
  useEffect(() => {
    if (status !== 'blocked') return undefined;

    const subscription = AppState.addEventListener('change', async (nextAppState: string) => {
      if (nextAppState !== 'active') return;
      const precheck = await geo?.Location.getForegroundPermissionsAsync?.();
      if (!mountedRef.current) return;
      if (precheck?.status === 'granted') {
        await beginWatch();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [status, geo, beginWatch]);

  const recenter = useCallback(() => {
    if (!currentPoint) return;
    cameraRef.current?.flyTo?.({ center: [currentPoint.lon, currentPoint.lat], duration: 400 });
  }, [currentPoint]);

  return {
    status,
    currentPoint,
    cameraRef,
    canAskAgain,
    start,
    stop,
    recenter,
    requestPermission,
    dismissRationale,
    openLocationSettings,
  };
}
