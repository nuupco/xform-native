"use strict";

/**
 * SatelliteTileCache — offline satellite tile pre-warming stub (REQ-GEO09).
 *
 * For P4 this is a stub that delegates to MapLibre's offline manager when available.
 * If MapLibre is not available, all methods return empty/zero.
 */

export async function preWarmSatelliteTiles(_bbox, _zooms) {
  // P4 stub: no-op
}
export async function clearSatelliteTileCache() {
  // P4 stub: no-op
}
export function getCacheStatus() {
  return {
    tileCount: 0,
    sizeBytes: 0
  };
}
//# sourceMappingURL=SatelliteTileCache.js.map