/**
 * draftStore — persist partially-completed form data locally.
 *
 * File layout: {documentDirectory}xform/drafts/{formId}/
 *   instance.xml   — current serialized XML with instanceID already injected
 *   {filename}     — attachment binary (base64-encoded string)
 *   manifest.json  — Manifest metadata (kind: 'draft')
 */

import * as FileSystem from 'expo-file-system';
import {
  generateUuidV4,
  injectInstanceId,
  parseXFormMeta,
} from './xmlUtils';
import type { SubmissionResult, FormAttachment } from './xmlUtils';
import type { Manifest } from './submissionQueue';

// ── Types ──────────────────────────────────────────────────────────────────────

export type LoadedDraft = {
  instanceXml: string;
  instanceAttachments: FormAttachment[];
  manifest: Manifest;
};

export type StalenessResult =
  | { stale: true; savedVersion: string; currentVersion: string }
  | { stale: false };

// ── Internal helpers ───────────────────────────────────────────────────────────

function draftsBaseDir(): string {
  return `${FileSystem.documentDirectory}xform/drafts/`;
}

function draftDir(formId: string): string {
  return `${draftsBaseDir()}${formId}/`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function saveDraft(
  formId: string,
  formUid: string,
  formTitle: string,
  formVersion: string,
  result: SubmissionResult
): Promise<Manifest> {
  const uuid = generateUuidV4();
  const instanceID = `uuid:${uuid}`;
  const dir = draftDir(formId);

  const xml = injectInstanceId(result.xml, instanceID);

  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  await FileSystem.writeAsStringAsync(`${dir}instance.xml`, xml, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const attachmentFilenames: string[] = [];
  for (const att of result.attachments) {
    await FileSystem.writeAsStringAsync(`${dir}${att.filename}`, att.data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    attachmentFilenames.push(att.filename);
  }

  const manifest: Manifest = {
    instanceID,
    formUid,
    formId,
    formTitle,
    formVersion,
    savedAt: new Date().toISOString(),
    attachments: attachmentFilenames,
    kind: 'draft',
  };

  await FileSystem.writeAsStringAsync(
    `${dir}manifest.json`,
    JSON.stringify(manifest),
    { encoding: FileSystem.EncodingType.UTF8 }
  );

  return manifest;
}

export async function loadDraft(formId: string): Promise<LoadedDraft | null> {
  const dir = draftDir(formId);
  const manifestPath = `${dir}manifest.json`;

  const info = await FileSystem.getInfoAsync(manifestPath);
  if (!info.exists) return null;

  let manifest: Manifest;
  try {
    const raw = await FileSystem.readAsStringAsync(manifestPath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    manifest = JSON.parse(raw) as Manifest;
  } catch {
    return null;
  }

  const instanceXml = await FileSystem.readAsStringAsync(`${dir}instance.xml`, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const instanceAttachments: FormAttachment[] = [];
  for (const filename of manifest.attachments) {
    const data = await FileSystem.readAsStringAsync(`${dir}${filename}`, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const mimeType = getMimeType(ext);
    instanceAttachments.push({ filename, data, mimeType });
  }

  return { instanceXml, instanceAttachments, manifest };
}

export async function checkStaleness(
  formId: string,
  freshXml: string
): Promise<StalenessResult> {
  const dir = draftDir(formId);
  const manifestPath = `${dir}manifest.json`;

  const info = await FileSystem.getInfoAsync(manifestPath);
  if (!info.exists) return { stale: false };

  let manifest: Manifest;
  try {
    const raw = await FileSystem.readAsStringAsync(manifestPath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    manifest = JSON.parse(raw) as Manifest;
  } catch {
    return { stale: false };
  }

  const currentVersion = parseXFormMeta(freshXml).version;
  const savedVersion = manifest.formVersion;

  if (savedVersion !== currentVersion) {
    return { stale: true, savedVersion, currentVersion };
  }
  return { stale: false };
}

export async function listDrafts(): Promise<Manifest[]> {
  const base = draftsBaseDir();
  let entries: string[];
  try {
    entries = await FileSystem.readDirectoryAsync(base);
  } catch {
    return [];
  }

  const manifests: Manifest[] = [];
  for (const entry of entries) {
    const info = await FileSystem.getInfoAsync(`${base}${entry}/`);
    if (!info.exists) continue;
    try {
      const raw = await FileSystem.readAsStringAsync(
        `${base}${entry}/manifest.json`,
        { encoding: FileSystem.EncodingType.UTF8 }
      );
      manifests.push(JSON.parse(raw) as Manifest);
    } catch {
      // Skip corrupt entries
    }
  }
  return manifests;
}

export async function deleteDraft(formId: string): Promise<void> {
  await FileSystem.deleteAsync(draftDir(formId), { idempotent: true });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    pdf: 'application/pdf',
  };
  return map[ext] ?? 'application/octet-stream';
}
