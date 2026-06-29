/**
 * apiClient — KoBoToolbox API client.
 *
 * Ported from expo-enketo-form example (koboApi.ts).
 * Uses serverConfig instead of hardcoded credentials.
 */

import { getServerConfig } from '../config/serverConfig';
import type { ServerConfig } from '../config/serverConfig';

// ── Types ──────────────────────────────────────────────────────────────────────

export type KoboAsset = {
  uid: string;
  name: string;
  deployment_status: string;
  xform_link: string;
};

export type SubmitOutcome =
  | { ok: true; status: 201 | 202 }
  | { ok: false; status: number; message: string };

// ── Internal helpers ───────────────────────────────────────────────────────────

function trimSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function base64(s: string): string {
  if (typeof btoa !== 'undefined') return btoa(s);
  // React Native / Metro polyfills Buffer; cast to avoid needing @types/node
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).Buffer.from(s, 'utf-8').toString('base64');
}

export function buildAuthHeader(auth: ServerConfig['auth']): Record<string, string> {
  if (auth.mode === 'token') return { Authorization: `Token ${auth.token}` };
  return { Authorization: `Basic ${base64(`${auth.username}:${auth.password}`)}` };
}

let _resolvedToken: string | null = null;

async function resolveToken(config: ServerConfig): Promise<string> {
  if (_resolvedToken) return _resolvedToken;
  if (config.auth.mode === 'token') {
    _resolvedToken = config.auth.token;
    return _resolvedToken;
  }
  const { username, password } = config.auth;
  const res = await fetch(`${trimSlash(config.baseUrl)}/token/?format=json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${base64(`${username}:${password}`)}` },
  });
  if (__DEV__) console.log('[apiClient] /token/ status:', res.status);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (__DEV__) console.log('[apiClient] /token/ error body:', body.slice(0, 200));
    throw new Error(`Token exchange failed: ${res.status}`);
  }
  const data = await res.json();
  _resolvedToken = data.token as string;
  return _resolvedToken;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getConfig(): Promise<ServerConfig> {
  const config = await getServerConfig();
  if (!config) throw new Error('Server not configured. Please log in.');
  return config;
}

export async function listForms(opts?: {
  nextUrl?: string;
}): Promise<{ forms: KoboAsset[]; nextUrl: string | null }> {
  const config = await getConfig();
  const url =
    opts?.nextUrl ??
    `${trimSlash(config.baseUrl)}/api/v2/assets/?asset_type=survey&format=json`;
  const headers = buildAuthHeader(config.auth);

  let res: Response;
  try {
    res = await fetch(url, { headers });
  } catch {
    throw new Error('KoBo request failed: network error');
  }
  if (!res.ok) throw new Error(`KoBo request failed: ${res.status}`);

  const json = await res.json();
  const forms: KoboAsset[] = (json.results ?? [])
    .filter(
      (a: any) => a.has_deployment === true && a.deployment__active === true
    )
    .map((a: any) => ({
      uid: a.uid,
      name: a.name,
      deployment_status:
        a.deployment_status ?? (a.deployment__active ? 'deployed' : 'draft'),
      xform_link:
        a.xform_link ??
        `${trimSlash(config.baseUrl)}/api/v2/assets/${a.uid}/?format=xml`,
    }));

  return { forms, nextUrl: json.next ?? null };
}

export async function fetchXFormXml(xformLink: string): Promise<string> {
  const config = await getConfig();
  const headers = {
    ...buildAuthHeader(config.auth),
    Accept: 'application/xml',
  };
  let res: Response;
  try {
    res = await fetch(xformLink, { headers });
  } catch {
    throw new Error('KoBo request failed: network error');
  }
  if (!res.ok) throw new Error(`KoBo request failed: ${res.status}`);
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('html')) {
    throw new Error('Expected XForm XML, got HTML (auth/redirect issue)');
  }
  return res.text();
}

export async function submitToKobo(
  uid: string,
  formData: FormData
): Promise<SubmitOutcome> {
  const config = await getConfig();
  const url = `${trimSlash(config.baseUrl)}/api/v2/assets/${uid}/submissions/`;
  const headers: Record<string, string> = {
    'X-OpenRosa-Version': '1.0',
    ...buildAuthHeader(config.auth),
  };

  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', headers, body: formData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, message };
  }

  if (response.status === 201 || response.status === 202) {
    return { ok: true, status: response.status as 201 | 202 };
  }

  let message = '';
  try {
    message = await response.text();
  } catch {
    message = `HTTP ${response.status}`;
  }
  return { ok: false, status: response.status, message };
}
