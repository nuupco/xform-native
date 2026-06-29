/**
 * submissionQueue — persist pending OpenRosa submissions to local storage
 * and retry them when connectivity is restored.
 *
 * File layout: {documentDirectory}xform/queue/{uuid}/
 *   instance.xml   — XML with <instanceID>uuid:…</instanceID> already injected
 *   {filename}     — binary attachment (base64-encoded string)
 *   manifest.json  — Manifest metadata
 */

import * as FileSystem from 'expo-file-system/legacy';
import { generateUuidV4, injectInstanceId, buildSubmission } from './xmlUtils';
import type { SubmissionResult } from './xmlUtils';
import { submitToKobo } from './apiClient';
import { recordSent } from './sentStore';

// ── Types ──────────────────────────────────────────────────────────────────────

export type Manifest = {
  instanceID: string;
  formUid: string;
  formId: string;
  formTitle: string;
  formVersion: string;
  savedAt: string;
  attachments: string[];
  kind: 'draft' | 'queue';
};

// ── Internal helpers ──────────────────────────────────────────────────────────

function queueDir(): string {
  return `${FileSystem.documentDirectory}xform/queue/`;
}

function itemDir(uuid: string): string {
  return `${queueDir()}${uuid}/`;
}

// ── In-flight guard ───────────────────────────────────────────────────────────

const inFlight = new Set<string>();

export function resetInFlightForTesting(): void {
  inFlight.clear();
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function enqueue(
  formUid: string,
  formTitle: string,
  result: SubmissionResult
): Promise<Manifest> {
  const uuid = generateUuidV4();
  const instanceID = `uuid:${uuid}`;
  const dir = itemDir(uuid);

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

  const formIdMatch = xml.match(/id="([^"]+)"/);
  const formVersionMatch = xml.match(/version="([^"]*)"/);
  const formId = formIdMatch?.[1] ?? formUid;
  const formVersion = formVersionMatch?.[1] ?? '';

  const manifest: Manifest = {
    instanceID,
    formUid,
    formId,
    formTitle,
    formVersion,
    savedAt: new Date().toISOString(),
    attachments: attachmentFilenames,
    kind: 'queue',
  };

  await FileSystem.writeAsStringAsync(
    `${dir}manifest.json`,
    JSON.stringify(manifest),
    { encoding: FileSystem.EncodingType.UTF8 }
  );

  return manifest;
}

export async function listPending(): Promise<Manifest[]> {
  const base = queueDir();
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

export async function deletePending(instanceID: string): Promise<void> {
  const uuid = instanceID.replace(/^uuid:/, '');
  await FileSystem.deleteAsync(itemDir(uuid), { idempotent: true });
}

export async function flush(): Promise<void> {
  const base = queueDir();
  let entries: string[];
  try {
    entries = await FileSystem.readDirectoryAsync(base);
  } catch {
    return;
  }

  await Promise.all(
    entries.map(async (uuid) => {
      const instanceID = `uuid:${uuid}`;

      if (inFlight.has(instanceID)) return;
      inFlight.add(instanceID);

      try {
        const dir = itemDir(uuid);

        let manifest: Manifest;
        try {
          const raw = await FileSystem.readAsStringAsync(
            `${dir}manifest.json`,
            { encoding: FileSystem.EncodingType.UTF8 }
          );
          manifest = JSON.parse(raw) as Manifest;
        } catch {
          return;
        }

        const xml = await FileSystem.readAsStringAsync(`${dir}instance.xml`, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const attachments = [];
        for (const filename of manifest.attachments) {
          const data = await FileSystem.readAsStringAsync(`${dir}${filename}`, {
            encoding: FileSystem.EncodingType.Base64,
          });
          attachments.push({
            filename,
            data,
            mimeType: 'application/octet-stream',
          });
        }

        const submissionResult: SubmissionResult = { xml, attachments };
        const formData = buildSubmission(submissionResult);

        const outcome = await submitToKobo(manifest.formUid, formData);

        if (outcome.ok) {
          await recordSent(manifest, new Date().toISOString());
          await FileSystem.deleteAsync(dir, { idempotent: true });
        }
      } finally {
        inFlight.delete(instanceID);
      }
    })
  );
}
