/**
 * xmlUtils — helpers ported from expo-enketo-form internals.
 *
 * These were previously imported from expo-enketo-form private paths.
 * Re-implemented here to keep the example app self-contained.
 */

// ── UUID ───────────────────────────────────────────────────────────────────────

export function generateUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── XForm meta ────────────────────────────────────────────────────────────────

export type XFormMeta = {
  formId: string;
  version: string;
};

export function parseXFormMeta(xformXml: string): XFormMeta {
  const idMatch = xformXml.match(/<\s*instance\s[^>]*>\s*<\s*([^\s>]+)[^>]*\bid="([^"]*)"/);
  const versionMatch = xformXml.match(/<\s*instance\s[^>]*>\s*<\s*([^\s>]+)[^>]*\bversion="([^"]*)"/);
  // Fallback: look anywhere in the XML for id= on the data root
  const fallbackId = xformXml.match(/<data\s[^>]*\bid="([^"]*)"/);
  const fallbackVersion = xformXml.match(/<data\s[^>]*\bversion="([^"]*)"/);

  return {
    formId: idMatch?.[2] ?? fallbackId?.[1] ?? '',
    version: versionMatch?.[2] ?? fallbackVersion?.[1] ?? '',
  };
}

// ── Instance ID injection ─────────────────────────────────────────────────────

export function injectInstanceId(xml: string, instanceId: string): string {
  return xml.replace(/<instanceID\s*\/>/, `<instanceID>${instanceId}</instanceID>`);
}

// ── Submission FormData builder ───────────────────────────────────────────────

export type FormAttachment = {
  filename: string;
  data: string; // base64
  mimeType: string;
};

export type SubmissionResult = {
  xml: string;
  attachments: FormAttachment[];
};

export function buildSubmission(result: SubmissionResult): FormData {
  const formData = new FormData();
  formData.append('xml_submission_file', {
    uri: `data:text/xml;base64,${btoa(result.xml)}`,
    name: 'xml_submission_file',
    type: 'text/xml',
  } as any);

  for (const att of result.attachments) {
    formData.append(att.filename, {
      uri: `data:${att.mimeType};base64,${att.data}`,
      name: att.filename,
      type: att.mimeType,
    } as any);
  }

  return formData;
}
