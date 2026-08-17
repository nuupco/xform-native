/**
 * formMedia — fetches KoBoToolbox asset media files (e.g. `jr://file-csv/*.csv`
 * secondary instance sources) so they can be resolved into a form's external
 * instances via `createFormStore`'s `externalInstanceResolver`.
 *
 * KPI (KoBoToolbox API v2) contract, best-effort confirmed from the
 * `AssetFileSerializer` source (kobotoolbox/kpi, kpi/serializers/v2/asset_file.py)
 * rather than a live/authenticated fetch of the interactive docs:
 *   GET {baseUrl}/api/v2/assets/{uid}/files/?format=json
 *     -> { results: [{ uid, url, content, metadata: { filename }, file_type, ... }] }
 *   `content` is itself a URL (the asset-file-content endpoint) that must be
 *   fetched with the same auth headers as the rest of the API to get the raw
 *   file bytes/text. This part (that `content` requires a second authenticated
 *   GET rather than being inline data) is not independently verified against a
 *   live server and should be treated as best-effort, not confirmed.
 */

import { getConfig, buildAuthHeader } from './apiClient';

function trimSlash(url: string): string {
  return url.replace(/\/$/, '');
}

type KoboAssetFile = {
  content: string;
  metadata?: { filename?: string };
};

/**
 * Lists the media files attached to an asset (uid), as returned by KPI.
 */
export async function listAssetFiles(uid: string): Promise<KoboAssetFile[]> {
  const config = await getConfig();
  const headers = buildAuthHeader(config.auth);
  const url = `${trimSlash(config.baseUrl)}/api/v2/assets/${uid}/files/?format=json`;

  let res: Response;
  try {
    res = await fetch(url, { headers });
  } catch {
    throw new Error('KoBo request failed: network error');
  }
  if (!res.ok) throw new Error(`KoBo request failed: ${res.status}`);

  const json = await res.json();
  return (json.results ?? []) as KoboAssetFile[];
}

/**
 * Downloads the content of a named media file attached to an asset (e.g.
 * "listado_encuestadores.csv"), returning it as text, or `null` if the asset
 * has no media file with that name (or the download itself 404s).
 */
export async function fetchAssetFileContent(
  uid: string,
  filename: string
): Promise<string | null> {
  const files = await listAssetFiles(uid);
  const match = files.find((f) => f.metadata?.filename === filename);
  if (!match) return null;

  const config = await getConfig();
  const headers = buildAuthHeader(config.auth);

  let res: Response;
  try {
    res = await fetch(match.content, { headers });
  } catch {
    throw new Error('KoBo request failed: network error');
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`KoBo request failed: ${res.status}`);
  return res.text();
}
