import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Form, FormSessionStore, createFormStore } from '@nuup/xform-native';

import { fetchXFormXml } from '../services/apiClient';
import { saveDraft, deleteDraft } from '../services/draftStore';
import { enqueue } from '../services/submissionQueue';
import { saveXForm, loadXForm } from '../services/xformCache';
import { parseXFormMeta } from '../services/xmlUtils';
import type { SubmissionResult, FormAttachment } from '../services/xmlUtils';
import type { Manifest } from '../services/submissionQueue';
import type { RootStackParamList } from '../navigation/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type LoadedDraft = {
  instanceXml: string;
  instanceAttachments: FormAttachment[];
  isStale: boolean;
  savedVersion?: string;
  currentVersion?: string;
  manifest: Manifest;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function FormViewerScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Viewer'>>();
  const { asset, draft } = route.params;

  const storeRef = useRef<FormSessionStore | null>(null);
  const [store, setStore] = useState<FormSessionStore | null>(null);
  const [xformXml, setXformXml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atEof, setAtEof] = useState(false);
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

  const applyForm = useCallback(
    async (xml: string) => {
      try {
        const newStore = await createFormStore(
          xml,
          draft ? { instanceXml: draft.instanceXml } : undefined
        );
        storeRef.current = newStore;
        setStore(newStore);
        setAtEof(newStore.adapter.getCurrentEvent().kind === 'eof');
        setXformXml(xml);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to parse form');
      }
    },
    [draft]
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const xml = await fetchXFormXml(asset.xform_link);
      await saveXForm(asset.uid, xml);

      if (draft) {
        const freshVersion = parseXFormMeta(xml).version ?? '';
        const savedVersion = draft.manifest.formVersion;
        if (savedVersion && freshVersion && savedVersion !== freshVersion) {
          setStaleBannerVisible(true);
          setStaleVersions({ saved: savedVersion, current: freshVersion });
        }
      }
      await applyForm(xml);
    } catch {
      const cached = await loadXForm(asset.uid);
      if (cached) {
        await applyForm(cached.xml);
      } else {
        setError('Formulario no disponible offline');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
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
      [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{'<'} Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {asset.name}
        </Text>
        <TouchableOpacity
          testID="save-draft-button"
          style={styles.saveDraftButton}
          onPress={() => void handleSaveDraft()}
        >
          <Text style={styles.saveDraftButtonText}>Guardar</Text>
        </TouchableOpacity>
        {atEof && (
          <TouchableOpacity
            testID="finalize-button"
            style={styles.finalizeButton}
            onPress={() => void handleFinalize()}
          >
            <Text style={styles.finalizeButtonText}>Finalizar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stale draft warning banner */}
      {staleBannerVisible && draft?.isStale && (
        <View testID="stale-warning-banner" style={styles.staleBanner}>
          <Text style={styles.staleBannerText}>
            Versión guardada: {staleVersions?.saved} — Versión actual:{" "}
            {staleVersions?.current}. Este borrador puede estar desactualizado.
          </Text>
          <TouchableOpacity
            testID="stale-banner-dismiss"
            onPress={() => setStaleBannerVisible(false)}
          >
            <Text style={styles.staleBannerDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Body */}
      <View style={styles.body}>
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1976d2" />
            <Text style={styles.loadingText}>Cargando formulario...</Text>
          </View>
        )}
        {!loading && error && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => void load()}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}
        {!loading && !error && store && (
          <View style={styles.form}>
            <Form store={store} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  saveDraftButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  saveDraftButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  finalizeButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  finalizeButtonText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '700',
  },
  staleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderBottomWidth: 1,
    borderBottomColor: '#ffc107',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  staleBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
  },
  staleBannerDismiss: {
    fontSize: 16,
    color: '#856404',
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  body: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: '#c0392b',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
});
