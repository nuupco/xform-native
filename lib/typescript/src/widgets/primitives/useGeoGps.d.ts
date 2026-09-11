export type GpsStatus = 'idle' | 'rationale' | 'requesting' | 'denied' | 'blocked' | 'acquiring' | 'tracking' | 'error';
export declare function isPermissionState(status: GpsStatus): boolean;
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
    start: () => Promise<void> | undefined;
    stop: () => void;
    recenter: () => void;
    requestPermission: () => Promise<void>;
    dismissRationale: () => void;
    openLocationSettings: () => void;
}
export declare function useGeoGps(geo: any, opts: UseGeoGpsOptions): UseGeoGpsResult;
//# sourceMappingURL=useGeoGps.d.ts.map