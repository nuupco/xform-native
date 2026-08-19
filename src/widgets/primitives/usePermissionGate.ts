/**
 * usePermissionGate — shared media-permission state machine, generalized
 * from Phase 5's `useGeoGps` permission flow (rationale → denied → blocked,
 * Settings deep link, AppState recovery) into an adapter-parameterized
 * primitive reusable across camera, microphone, and photo-library gates
 * (design: Phase 6, decisions 1-4, 10-11).
 *
 * Every widget owns its own already-`require`d optional peer (expo-camera,
 * expo-av, expo-image-picker) and builds a `PermissionAdapter` from it; this
 * hook itself imports only `react`/`react-native`, never an expo package,
 * preserving the optional-peer-dep firewall the four `*.absent.test.tsx`
 * suites depend on.
 *
 * Deliberately a separate status vocabulary from `GpsStatus` (design
 * decision 2): a permission gate has no acquisition phase, so `granted` and
 * `checking` are first-class members here rather than folded into
 * `acquiring`/`requesting`.
 */
import { AppState, Linking } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';

export type PermissionGateStatus =
  | 'idle'
  | 'checking'
  | 'rationale'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'error';

export function isPermissionBlockingState(status: PermissionGateStatus): boolean {
  return status === 'rationale' || status === 'denied' || status === 'blocked';
}

/**
 * The shape every one of `expo-camera` / `expo-av` / `expo-image-picker`
 * resolves from their `get*`/`request*` permission pair — the verified
 * `expo-modules-core` `PermissionResponse` (design "Verified current
 * state").
 */
export interface PermissionLike {
  status?: string;
  granted?: boolean;
  canAskAgain?: boolean;
  expires?: string;
}

/**
 * Adapter a widget builds from its already-`require`d module. Both
 * functions are optional (decision 10): an absent `get` means "unknown",
 * falling through to legacy proceed-as-today behavior.
 */
export interface PermissionAdapter {
  get?: () => Promise<PermissionLike | null | undefined>;
  request?: () => Promise<PermissionLike | null | undefined>;
}

export interface UsePermissionGateResult {
  status: PermissionGateStatus;
  canAskAgain: boolean;
  /**
   * Non-prompting pre-check run at the point of user intent (design
   * decision 3). Resolves `true` when already granted (or unknown/legacy),
   * `false` otherwise, and parks the state machine in `rationale`/`denied`/
   * `blocked` for the notice to render from.
   */
  ensure: () => Promise<boolean>;
  requestPermission: () => Promise<void>;
  dismissRationale: () => void;
  openSettings: () => void;
  reset: () => void;
}

export function usePermissionGate(adapter: PermissionAdapter): UsePermissionGateResult {
  const [status, setStatus] = useState<PermissionGateStatus>('idle');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const ensure = useCallback(async () => {
    setStatus('checking');
    try {
      const precheck = await adapter.get?.();
      if (!mountedRef.current) return false;

      if (!precheck) {
        // Decision 10: unknown result (legacy/absent peer) — proceed as
        // today, no gate.
        setStatus('granted');
        setCanAskAgain(true);
        return true;
      }

      if (precheck.status === 'undetermined') {
        setStatus('rationale');
        return false;
      }

      if (precheck.granted || precheck.status === 'granted') {
        setStatus('granted');
        return true;
      }

      const askAgain = precheck.canAskAgain ?? true;
      setCanAskAgain(askAgain);
      setStatus(askAgain ? 'denied' : 'blocked');
      return false;
    } catch {
      if (mountedRef.current) setStatus('error');
      return false;
    }
  }, [adapter]);

  const requestPermission = useCallback(async () => {
    if (status === 'blocked') return;

    setStatus('requesting');
    try {
      const res = await adapter.request?.();
      if (!mountedRef.current) return;

      if (!res || res.granted || res.status === 'granted') {
        setStatus('granted');
        setCanAskAgain(true);
        return;
      }

      const askAgain = res.canAskAgain ?? true;
      setCanAskAgain(askAgain);
      setStatus(askAgain ? 'denied' : 'blocked');
    } catch {
      if (mountedRef.current) setStatus('error');
    }
  }, [adapter, status]);

  const dismissRationale = useCallback(() => {
    setStatus('denied');
  }, []);

  const openSettings = useCallback(() => {
    try {
      // openSettings() can reject on some Android OEM builds; swallow it so
      // it never surfaces as an unhandled rejection. Stay `blocked` —
      // never `error`, which means a genuine permission-adapter failure.
      Promise.resolve(Linking.openSettings()).catch(() => undefined);
    } catch {
      // Synchronous throw fallback, same handling.
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setCanAskAgain(true);
  }, []);

  // Recovery: while blocked, watch for the app returning to foreground
  // (e.g. after the user grants the permission in system Settings) and
  // re-run the pre-check once (design decision 11).
  useEffect(() => {
    if (status !== 'blocked') return undefined;

    const subscription = AppState.addEventListener('change', async (nextAppState: string) => {
      if (nextAppState !== 'active') return;
      const precheck = await adapter.get?.();
      if (!mountedRef.current) return;
      if (precheck?.granted || precheck?.status === 'granted') {
        setStatus('granted');
        setCanAskAgain(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [status, adapter]);

  return {
    status,
    canAskAgain,
    ensure,
    requestPermission,
    dismissRationale,
    openSettings,
    reset,
  };
}
