/**
 * serverConfig — persisted KoBoToolbox / ODK server configuration.
 *
 * Uses expo-secure-store so credentials survive app restarts.
 */

import * as SecureStore from 'expo-secure-store';

const KEYS = {
  baseUrl: 'xform_server_baseUrl',
  username: 'xform_server_username',
  password: 'xform_server_password',
  token: 'xform_server_token',
} as const;

// ── Types ──────────────────────────────────────────────────────────────────────

export type ServerAuth =
  | { mode: 'basic'; username: string; password: string }
  | { mode: 'token'; token: string };

export type ServerConfig = {
  baseUrl: string;
  auth: ServerAuth;
};

// ── Public API ────────────────────────────────────────────────────────────────

export async function getServerConfig(): Promise<ServerConfig | null> {
  const baseUrl = await SecureStore.getItemAsync(KEYS.baseUrl);
  if (!baseUrl) return null;

  const token = await SecureStore.getItemAsync(KEYS.token);
  if (token) {
    return { baseUrl, auth: { mode: 'token', token } };
  }

  const username = await SecureStore.getItemAsync(KEYS.username);
  const password = await SecureStore.getItemAsync(KEYS.password);
  if (username && password) {
    return { baseUrl, auth: { mode: 'basic', username, password } };
  }

  return null;
}

export async function saveServerConfig(config: ServerConfig): Promise<void> {
  await SecureStore.setItemAsync(KEYS.baseUrl, config.baseUrl);
  if (config.auth.mode === 'token') {
    await SecureStore.setItemAsync(KEYS.token, config.auth.token);
    await SecureStore.deleteItemAsync(KEYS.username);
    await SecureStore.deleteItemAsync(KEYS.password);
  } else {
    await SecureStore.setItemAsync(KEYS.username, config.auth.username);
    await SecureStore.setItemAsync(KEYS.password, config.auth.password);
    await SecureStore.deleteItemAsync(KEYS.token);
  }
}

export async function clearServerConfig(): Promise<void> {
  for (const key of Object.values(KEYS)) {
    await SecureStore.deleteItemAsync(key);
  }
}
