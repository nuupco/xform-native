/**
 * SatelliteTileCache — offline satellite tile pre-warming for the geo capture map.
 *
 * Tiles are downloaded from ESRI World Imagery (free, no API key required) and
 * stored under the app's document directory so they survive OS cache purges —
 * this is a deliberate deviation from a `cacheDirectory`-based reference
 * implementation: the user explicitly requested an offline download, and the
 * OS is free to evict `cacheDirectory` contents at any time, which would
 * silently defeat that request.
 *
 * Pre-warming is strictly user-triggered (never automatic) and enforces a
 * fixed tile-count cap: when reached, downloading stops and the result is
 * reported via `capReached` so the calling UI can surface a visible message.
 * There is no eviction/LRU here by design — only a manual `clearSatelliteTileCache`.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FileSystem = require('expo-file-system/legacy');

// ESRI World Imagery — free satellite, no API key, good resolution for agriculture.
// Note: ESRI's URL order is z/y/x (row before column).
const ESRI_BASE =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';

const CACHE_BASE = `${FileSystem.documentDirectory ?? 'file:///tmp/'}xform-satellite-tiles`;

/**
 * MapLibre raster tile template. Tiles are stored as {z}/{x}/{y}.png
 * (standard XYZ order); MapLibre substitutes {z}/{x}/{y} at render time.
 * Missing files simply fail to render that tile — no special handling needed.
 */
export const SATELLITE_TILE_URI_TEMPLATE = `${CACHE_BASE}/{z}/{x}/{y}.png`;

/** Fixed storage cap (~120 MB at ~30 KB/tile average). No eviction — stop + notify. */
export const MAX_CACHED_TILES = 4000;

export interface PreWarmResult {
  downloaded: number;
  skipped: number;
  capReached: boolean;
}

// ─── Tile math ────────────────────────────────────────────────────────────────

function lonToX(lon: number, z: number): number {
  return Math.floor(((lon + 180) / 360) * 2 ** z);
}

function latToY(lat: number, z: number): number {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
}

/**
 * Lazily enumerates tiles for a bbox/zoom range, generator-style, so a huge
 * bbox/zoom-range combination never materializes the full list in memory —
 * callers stop pulling once they've seen enough (e.g. the cap).
 */
function* iterTiles(
  bbox: [number, number, number, number],
  minZoom: number,
  maxZoom: number,
): Generator<[number, number, number]> {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  for (let z = minZoom; z <= maxZoom; z++) {
    const x0 = lonToX(minLon, z);
    const x1 = lonToX(maxLon, z);
    const y0 = latToY(maxLat, z); // Y is inverted — maxLat -> minY
    const y1 = latToY(minLat, z);
    const xLo = Math.min(x0, x1);
    const xHi = Math.max(x0, x1);
    const yLo = Math.min(y0, y1);
    const yHi = Math.max(y0, y1);
    for (let x = xLo; x <= xHi; x++) {
      for (let y = yLo; y <= yHi; y++) {
        yield [z, x, y];
      }
    }
  }
}


// ─── Download helpers ─────────────────────────────────────────────────────────

async function downloadTile(z: number, x: number, y: number): Promise<'downloaded' | 'skipped'> {
  const localPath = `${CACHE_BASE}/${z}/${x}/${y}.png`;

  const { exists } = await FileSystem.getInfoAsync(localPath);
  if (exists) return 'skipped';

  const dir = `${CACHE_BASE}/${z}/${x}`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});

  // ESRI uses z/y/x (row-column order, opposite of standard XYZ)
  const url = `${ESRI_BASE}/${z}/${y}/${x}`;
  await FileSystem.downloadAsync(url, localPath);
  return 'downloaded';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Estimates the number of tiles for a bounding box + zoom range. Useful to
 * show a size/cap warning before pre-warming.
 */
export function estimateSatelliteTileCount(
  bbox: [number, number, number, number],
  minZoom: number,
  maxZoom: number,
): number {
  let count = 0;
  for (const _tile of iterTiles(bbox, minZoom, maxZoom)) count++;
  return count;
}

/**
 * Downloads ESRI World Imagery tiles for the given region to local storage.
 * Skips already-cached tiles. Stops once the fixed `MAX_CACHED_TILES` cap
 * would be exceeded and reports `capReached: true` — never fails silently,
 * never downloads unbounded.
 *
 * @param bbox       [minLon, minLat, maxLon, maxLat] in WGS-84 decimal degrees
 * @param minZoom    Minimum zoom level (inclusive).
 * @param maxZoom    Maximum zoom level (inclusive).
 * @param onProgress Optional callback fired after each tile: (downloaded, total)
 */
export async function preWarmSatelliteTiles(
  bbox: [number, number, number, number],
  minZoom: number,
  maxZoom: number,
  onProgress?: (downloaded: number, total: number) => void,
): Promise<PreWarmResult> {
  let processed = 0;
  let downloaded = 0;
  let skipped = 0;
  let capReached = false;

  for (const [z, x, y] of iterTiles(bbox, minZoom, maxZoom)) {
    if (processed >= MAX_CACHED_TILES) {
      // Stop-and-notify: never download past the fixed cap, never fail silently.
      capReached = true;
      break;
    }
    try {
      const outcome = await downloadTile(z, x, y);
      if (outcome === 'downloaded') downloaded++;
      else skipped++;
    } catch {
      // Individual tile failures (404, network error) are non-fatal — skip and continue.
      skipped++;
    }
    processed++;
    onProgress?.(processed, MAX_CACHED_TILES);
  }

  return { downloaded, skipped, capReached };
}

/**
 * Removes all cached satellite tiles to free storage space.
 */
export async function clearSatelliteTileCache(): Promise<void> {
  const { exists } = await FileSystem.getInfoAsync(CACHE_BASE);
  if (exists) {
    await FileSystem.deleteAsync(CACHE_BASE, { idempotent: true });
  }
}
