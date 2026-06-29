/**
 * sentStore — persist lightweight metadata of successfully submitted forms.
 *
 * File layout: {documentDirectory}xform/sent/{instanceID-uuid}/manifest.json
 *   Only metadata is stored — NO XML body or attachment data.
 */

import * as FileSystem from 'expo-file-system';
import type { Manifest } from './submissionQueue';

// ── Types ──────────────────────────────────────────────────────────────────────

export type SentManifest = Omit<Manifest, 'kind'> & {
  kind: 'sent';
  sentAt: string;
};

// ── Internal helpers ───────────────────────────────────────────────────────────

function sentBaseDir(): string {
  return `${FileSystem.documentDirectory}xform/sent/`;
}

function sentItemDir(instanceID: string): string {
  const uuid = instanceID.replace(/^uuid:/, '');
  return `${sentBaseDir()}${uuid}/`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function recordSent(
  manifest: Manifest,
  sentAt: string
): Promise<void> {
  const dir = sentItemDir(manifest.instanceID);
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  const sentManifest: SentManifest = {
    instanceID: manifest.instanceID,
    formUid: manifest.formUid,
    formId: manifest.formId,
    formTitle: manifest.formTitle,
    formVersion: manifest.formVersion,
    savedAt: manifest.savedAt,
    attachments: manifest.attachments,
    kind: 'sent',
    sentAt,
  };

  await FileSystem.writeAsStringAsync(
    `${dir}manifest.json`,
    JSON.stringify(sentManifest),
    { encoding: FileSystem.EncodingType.UTF8 }
  );
}

export async function listSent(): Promise<SentManifest[]> {
  const base = sentBaseDir();
  let entries: string[];
  try {
    entries = await FileSystem.readDirectoryAsync(base);
  } catch {
    return [];
  }

  const manifests: SentManifest[] = [];
  for (const entry of entries) {
    const info = await FileSystem.getInfoAsync(`${base}${entry}/`);
    if (!info.exists) continue;
    try {
      const raw = await FileSystem.readAsStringAsync(
        `${base}${entry}/manifest.json`,
        { encoding: FileSystem.EncodingType.UTF8 }
      );
      manifests.push(JSON.parse(raw) as SentManifest);
    } catch {
      // Skip corrupt entries
    }
  }

  manifests.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  return manifests;
}

export async function deleteSent(instanceID: string): Promise<void> {
  await FileSystem.deleteAsync(sentItemDir(instanceID), { idempotent: true });
}

export async function clearSent(): Promise<void> {
  await FileSystem.deleteAsync(sentBaseDir(), { idempotent: true });
}
