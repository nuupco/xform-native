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
  useFormSession,
  useThemedStyles,
  PressableButton,
  tokens,
  type WidgetOverride,
  type XFormWidgetProps,
  type ValidatorOverride,
  type FormLoadPhase,
  type PhaseTiming,
  type Theme,
} from '@nuup/xform-native';
import { FormLoadingOverlay } from '../components/FormLoadingOverlay';
import { createScreenStyles } from '../theme/screenStyles';

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

// 4. Custom validator: for `note` controls (harmless additive check) — this
// demonstrates composing on top of defaultValidate() rather than a real
// business rule, since note controls have no user input to validate.
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

  const styles = useThemedStyles(createStyles);

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
            <PressableButton label="Reintentar" onPress={() => void load()} />
          </View>
        )}
        {!loading && !error && store && (
          <View style={styles.form}>
            <Form
              store={store}
              widgets={demoWidgetOverrides}
              validators={demoValidatorOverrides}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(t: Theme) {
  const screen = createScreenStyles(t);
  return StyleSheet.create({
    container: screen.screen,
    header: screen.header,
    backButton: screen.backButton,
    backButtonText: screen.backButtonText,
    title: screen.headerTitle,
    saveDraftButton: {
      backgroundColor: t.color.roles.primaryContainer,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xxs,
      borderRadius: t.radius.md,
    },
    saveDraftButtonText: {
      ...t.typography.labelLarge,
      color: t.color.roles.onPrimaryContainer,
    },
    finalizeButton: {
      backgroundColor: t.color.roles.surface,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xxs,
      borderRadius: t.radius.md,
    },
    finalizeButtonText: {
      ...t.typography.labelLarge,
      color: t.color.roles.primary,
    },
    staleBanner: {
      ...screen.banner,
      flexDirection: 'row',
      alignItems: 'center',
    },
    staleBannerText: {
      flex: 1,
      ...screen.bannerText,
    },
    staleBannerDismiss: {
      ...t.typography.titleMedium,
      color: t.color.roles.onTertiaryContainer,
      paddingHorizontal: t.spacing.xxs,
    },
    body: {
      flex: 1,
    },
    centered: screen.centered,
    errorText: screen.errorText,
    form: {
      flex: 1,
      padding: t.spacing.md,
      justifyContent: 'center',
    },
  });
}

// ── Demo styles (shadcn-lite capability showcase) ──────────────────────────────
// Uses `tokens` (not a live `useTheme()` call) — retinting the purple demo
// (design decision 4) doesn't need runtime theme reactivity, since the
// example app's `ThemeProvider` mounts with no override (decision 2).

const demoStyles = StyleSheet.create({
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.xs,
    backgroundColor: tokens.color.roles.secondaryContainer,
    borderLeftWidth: 4,
    borderLeftColor: tokens.color.roles.secondary,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    marginVertical: tokens.spacing.xxs,
  },
  noteIcon: {
    color: tokens.color.roles.secondary,
    fontWeight: '700',
    fontSize: 14,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: tokens.color.roles.onSecondaryContainer,
    fontStyle: 'italic',
  },
});
