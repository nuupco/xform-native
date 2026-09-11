/**
 * SatelliteTileCache — offline satellite tile pre-warming stub (REQ-GEO09).
 *
 * For P4 this is a stub that delegates to MapLibre's offline manager when available.
 * If MapLibre is not available, all methods return empty/zero.
 */
export interface BBox {
    north: number;
    south: number;
    east: number;
    west: number;
}
export interface CacheStatus {
    tileCount: number;
    sizeBytes: number;
}
export declare function preWarmSatelliteTiles(_bbox: BBox, _zooms: number[]): Promise<void>;
export declare function clearSatelliteTileCache(): Promise<void>;
export declare function getCacheStatus(): CacheStatus;
//# sourceMappingURL=SatelliteTileCache.d.ts.map