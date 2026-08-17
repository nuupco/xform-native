import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
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
import {
  Form,
  FormSessionStore,
  createFormStore,
  createCancellableFormLoad,
  ThemeProvider,
  useFormSession,
  type WidgetOverride,
  type XFormWidgetProps,
  type FormSlots,
  type ValidatorOverride,
  type FormLoadPhase,
  type PhaseTiming,
} from '@nuup/xform-native';
import { FormLoadingOverlay } from '../components/FormLoadingOverlay';

// ── Demo: shadcn-lite capability showcase ──────────────────────────────────────
// These are minimal, functional demonstrations of the 4 additive Form
// extension points (widget registry, theming, composition slots, validation
// hooks). They are always-on but harmless: with no matching nodes they never
// fire, so the no-overrides case (any form without a `note` control) renders
// exactly as before.

// 1. Widget override: a visibly distinct `note` renderer with a highlighted
// box and a leading icon, replacing the default NoteWidget for this app.
function HighlightedNoteWidget({ nodeRef, store }: XFormWidgetProps) {
  useFormSession(store);
  const value = store.adapter.resolveValue(nodeRef);
  const text = value != null ? String(value) : '';
  return (
    <View style={demoStyles.noteBox} testID="demo-highlighted-note">
      <Text style={demoStyles.noteIcon}>i</Text>
      <Text style={demoStyles.noteText}>{text}</Text>
    </View>
  );
}

const demoWidgetOverrides: readonly WidgetOverride[] = [
  { match: { controlType: 'input', appearance: 'note' }, Widget: HighlightedNoteWidget },
];

// 2. Custom theme: shift the primary color away from the default blue used
// everywhere else in the app, so the difference is visible on every widget
// that reads useTheme()/useThemedStyles() instead of the standalone tokens.
const demoTheme = {
  color: {
    primary: '#7b2cbf',
  },
};

// 4. Custom validator: for `note` controls (harmless additive check) — this
// demonstrates composing on top of defaultValidate() rather than a real
// business rule, since note controls have no user input to validate.
// 3. Composition slot: replace the default navigation row with visually
// distinct pill-shaped buttons, reusing `defaultElement` so we never
// duplicate Form's enabled/disabled logic.
const demoFormSlots: FormSlots = {
  renderNavigation: (ctx) => (
    <View style={demoStyles.navWrapper} testID="demo-custom-navigation">
      {ctx.defaultElement}
    </View>
  ),
};

const demoValidatorOverrides: readonly ValidatorOverride[] = [
  {
    // `dataType: 'string'` alone also matches select1/select bindings (they
    // carry dataType 'string' in JavaRosa) — restrict to free-text `input`
    // controls so this demo rule doesn't fire on radio/checkbox tokens like
    // the single-character "1"/"2" choice values seen in real forms.
    match: { dataType: 'string', controlType: 'input' },
    validate: (ctx) => {
      const defaultBlock = ctx.defaultValidate();
      if (defaultBlock) return defaultBlock;
      const value = ctx.store.adapter.resolveValue(ctx.nodeRef);
      if (typeof value === 'string' && value.trim().length > 0 && value.trim().length < 2) {
        return { type: 'tooShort', message: 'Escribe al menos 2 caracteres.' };
      }
      return null;
    },
  },
];

import { fetchXFormXml } from '../services/apiClient';
import { fetchAssetFileContent } from '../services/formMedia';
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

  const handleCancelLoad = useCallback(() => {
    cancellableRef.current?.cancel();
    epochRef.current += 1;
    navigation.goBack();
  }, [navigation]);

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
          <FormLoadingOverlay phase={loadPhase} onCancel={handleCancelLoad} />
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
            <ThemeProvider theme={demoTheme}>
              <Form
                store={store}
                widgets={demoWidgetOverrides}
                slots={demoFormSlots}
                validators={demoValidatorOverrides}
              />
            </ThemeProvider>
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

// ── Demo styles (shadcn-lite capability showcase) ──────────────────────────────

const demoStyles = StyleSheet.create({
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f3e8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#7b2cbf',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 4,
  },
  noteIcon: {
    color: '#7b2cbf',
    fontWeight: '700',
    fontSize: 14,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#3c096c',
    fontStyle: 'italic',
  },
  navWrapper: {
    borderWidth: 2,
    borderColor: '#7b2cbf',
    borderRadius: 12,
    padding: 6,
    backgroundColor: '#f3e8ff',
  },
});
