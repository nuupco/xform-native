export type PermissionGateStatus = 'idle' | 'checking' | 'rationale' | 'requesting' | 'granted' | 'denied' | 'blocked' | 'error';
export declare function isPermissionBlockingState(status: PermissionGateStatus): boolean;
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
    /**
     * Marks the gate as `error` — for a genuine runtime failure that occurs
     * *after* a granted permission check (e.g. device busy), distinct from a
     * permission-adapter failure that `ensure()`/`requestPermission()` already
     * catch internally (design decision 9).
     */
    markError: () => void;
}
export declare function usePermissionGate(adapter: PermissionAdapter): UsePermissionGateResult;
//# sourceMappingURL=usePermissionGate.d.ts.map