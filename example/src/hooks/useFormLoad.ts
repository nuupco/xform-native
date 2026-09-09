/**
 * useFormLoad — owns the form-load lifecycle for FormViewerScreen: epoch/
 * cancellable load, store construction, offline cache fallback, stale-draft
 * detection, EOF subscription, save-draft, and finalize.
 *
 * Navigation-free by design: callers supply `onFinalizeComplete` and are
 * responsible for any navigation (including cancel/goBack) themselves.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  FormSessionStore,
  createFormStore,
  createCancellableFormLoad,
  type FormLoadPhase,
  type PhaseTiming,
} from '@nuup/xform-native';
import { fetchXFormXml } from '../services/apiClient';
import { fetchAssetFileContent } from '../services/formMedia';
import { saveDraft, deleteDraft } from '../services/draftStore';
import type { LoadedDraft } from '../services/draftStore';
import { enqueue } from '../services/submissionQueue';
import { saveXForm, loadXForm } from '../services/xformCache';
import { parseXFormMeta } from '../services/xmlUtils';
import type { SubmissionResult } from '../services/xmlUtils';
import type { KoboAsset } from '../services/apiClient';
import {
  ALL_WIDGETS_DEMO_XML,
  DEMO_ALL_WIDGETS_XFORM_LINK,
  demoMediaResolver,
} from '../demo/allWidgetsForm';

export type UseFormLoadArgs = {
  asset: KoboAsset;
  draft?: LoadedDraft;
  onFinalizeComplete: () => void;
};

export type UseFormLoad = {
  store: FormSessionStore | null;
  xformXml: string | null;
  loading: boolean;
  error: string | null;
  atEof: boolean;
  loadPhase: FormLoadPhase | null;
  staleBannerVisible: boolean;
  dismissStaleBanner: () => void;
  staleVersions: { saved: string; current: string } | null;
  load: () => Promise<void>;
  cancelLoad: () => void;
  handleSaveDraft: () => Promise<void>;
  handleFinalize: () => Promise<void>;
};

export function useFormLoad({
  asset,
  draft,
  onFinalizeComplete,
}: UseFormLoadArgs): UseFormLoad {
  const storeRef = useRef<FormSessionStore | null>(null);
  const [store, setStore] = useState<FormSessionStore | null>(null);
  const [xformXml, setXformXml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atEof, setAtEof] = useState(false);
  const [loadPhase, setLoadPhase] = useState<FormLoadPhase | null>(null);

  // Discard-on-resolve cancellation: epochRef identifies the "current"
  // load attempt. Cancelling bumps the epoch and asks the in-flight
  // cancellable wrapper to discard its eventual result — no setStore/
  // setXformXml/setAtEof happens for a stale epoch, so a cancelled load can
  // never leave a half-applied store behind (see design ADR-3).
  const epochRef = useRef(0);
  const cancellableRef = useRef<{ cancel: () => void } | null>(null);
  const [staleBannerVisible, setStaleBannerVisible] = useState(
    draft?.isStale === true
  );
  const [staleVersions, setStaleVersions] = useState<{
    saved: string;
    current: string;
  } | null>(
    draft?.isStale
      ? { saved: draft.savedVersion ?? '', current: draft.currentVersion ?? '' }
      : null
  );

  const buildStore = useCallback(
    (xml: string) =>
      createFormStore(xml, {
        ...(draft ? { instanceXml: draft.instanceXml } : {}),
        ...(asset.xform_link === DEMO_ALL_WIDGETS_XFORM_LINK
          ? { mediaResolver: { resolve: demoMediaResolver } }
          : {}),
        externalInstanceResolver: {
          resolve: async (uri: string) => {
            // jr://file-csv/<name>.csv, jr://file/<name> — both map to a
            // media file attached to this asset, named by the last path
            // segment.
            const match = uri.match(/^jr:\/\/file(?:-csv)?\/(.+)$/);
            const filename = match?.[1];
            if (!filename) return null;
            return fetchAssetFileContent(asset.uid, filename);
          },
        },
        onPhaseTiming: (t: PhaseTiming) => {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log('[form-load]', t);
          }
          if (t.event === 'start' && t.phase !== 'total') {
            setLoadPhase(t.phase);
          }
        },
      }),
    [draft, asset.uid]
  );

  async function load() {
    const myEpoch = ++epochRef.current;
    setLoading(true);
    setError(null);
    setLoadPhase(null);

    const cancellable = createCancellableFormLoad(async () => {
      let xml: string;
      if (asset.xform_link === DEMO_ALL_WIDGETS_XFORM_LINK) {
        // Embedded demo form — no server, no fetch, nothing to cache.
        xml = ALL_WIDGETS_DEMO_XML;
      } else {
        try {
          xml = await fetchXFormXml(asset.xform_link);
          await saveXForm(asset.uid, xml);

          if (draft) {
            const freshVersion = parseXFormMeta(xml).version ?? '';
            const savedVersion = draft.manifest.formVersion;
            if (savedVersion && freshVersion && savedVersion !== freshVersion) {
              setStaleBannerVisible(true);
              setStaleVersions({ saved: savedVersion, current: freshVersion });
            }
          }
        } catch {
          const cached = await loadXForm(asset.uid);
          if (!cached) throw new Error('Formulario no disponible offline');
          xml = cached.xml;
        }
      }

      const newStore = await buildStore(xml);
      return { xml, newStore };
    });
    cancellableRef.current = cancellable;

    try {
      const result = await cancellable.promise;

      // Cancel race with completion: `result` is null exactly when
      // cancelled before settling — never both a valid session AND a
      // discard. A stale epoch (a newer load started after this one) is
      // treated the same way: skip all state writes for this attempt.
      if (result === null || epochRef.current !== myEpoch) {
        return;
      }

      storeRef.current = result.newStore;
      setStore(result.newStore);
      setAtEof(result.newStore.adapter.getCurrentEvent().kind === 'eof');
      setXformXml(result.xml);
    } catch (e) {
      if (epochRef.current === myEpoch) {
        setError(e instanceof Error ? e.message : 'Failed to parse form');
      }
    } finally {
      if (epochRef.current === myEpoch) {
        setLoading(false);
      }
    }
  }

  const cancelLoad = useCallback(() => {
    cancellableRef.current?.cancel();
    epochRef.current += 1;
  }, []);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.xform_link]);

  // Subscribe to store changes to detect EOF
  useEffect(() => {
    if (!store) return;
    const check = () => {
      setAtEof(store.adapter.getCurrentEvent().kind === 'eof');
    };
    check();
    return store.subscribe(check);
  }, [store]);

  const handleSaveDraft = async () => {
    if (!storeRef.current || !xformXml) {
      Alert.alert('Error', 'El formulario no está listo aún.');
      return;
    }

    const xml = storeRef.current.serializeToXml();
    // TODO: extract binary attachments from tree for full fidelity
    const result: SubmissionResult = { xml, attachments: [] };
    const meta = parseXFormMeta(xformXml);

    await saveDraft(
      meta.formId || asset.uid,
      asset.uid,
      asset.name,
      meta.version ?? '',
      result
    );

    Alert.alert(
      'Borrador guardado',
      'El borrador fue guardado correctamente.',
      [{ text: 'OK' }]
    );
  };

  const handleFinalize = async () => {
    if (!storeRef.current) return;

    storeRef.current.finalize();
    const xml = storeRef.current.serializeToXml();
    // TODO: extract binary attachments from tree for full fidelity
    const result: SubmissionResult = { xml, attachments: [] };

    await enqueue(asset.uid, asset.name, result);
    if (draft) {
      await deleteDraft(draft.manifest.formId);
    }

    Alert.alert(
      'Formulario finalizado',
      'Quedó listo para enviar. Puedes enviarlo desde "Enviar finalizados".',
      [{ text: 'OK', onPress: onFinalizeComplete }]
    );
  };

  const dismissStaleBanner = useCallback(() => {
    setStaleBannerVisible(false);
  }, []);

  return {
    store,
    xformXml,
    loading,
    error,
    atEof,
    loadPhase,
    staleBannerVisible,
    dismissStaleBanner,
    staleVersions,
    load,
    cancelLoad,
    handleSaveDraft,
    handleFinalize,
  };
}
