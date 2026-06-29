import type { KoboAsset } from './apiClient';
import type { Manifest } from './submissionQueue';
import { getServerConfig } from '../config/serverConfig';

/**
 * Reconstructs a minimal KoboAsset from the manifest stored in a draft.
 */
export async function draftToAsset(manifest: Manifest): Promise<KoboAsset> {
  const config = await getServerConfig();
  const baseUrl = config?.baseUrl ?? '';
  return {
    uid: manifest.formUid,
    name: manifest.formTitle,
    deployment_status: 'deployed',
    xform_link: `${baseUrl.replace(/\/$/, '')}/api/v2/assets/${manifest.formUid}/?format=xml`,
  };
}
