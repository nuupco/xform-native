import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  Form,
  useThemedStyles,
  PressableButton,
  type FormSlots,
  type Theme,
} from '@nuup/xform-native';
import { FormLoadingOverlay } from '../components/FormLoadingOverlay';
import { createScreenStyles } from '../theme/screenStyles';
import { useFormLoad } from '../hooks/useFormLoad';
import {
  DemoOverridesProvider,
  demoValidatorOverrides,
} from '../demo/formOverrides';
import { PickProductScreen } from '../demo/PickProductScreen';
import type { RootStackParamList } from '../navigation/types';

// Demo wiring for appearance="inject-values" (see allWidgetsForm's
// "/data/g_product" group and README's "inject-values group appearance"):
// module-level so it's not recreated every render (Form has no need to see
// it change identity).
const demoFormSlots: FormSlots = {
  injectValues: (ctx) => <PickProductScreen {...ctx} />,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function FormViewerScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Viewer'>>();
  const { asset, draft } = route.params;

  const styles = useThemedStyles(createStyles);

  const goHome = useCallback(() => navigation.navigate('Home'), [navigation]);

  const {
    store,
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
  } = useFormLoad({ asset, draft, onFinalizeComplete: goHome });

  const handleCancelLoad = useCallback(() => {
    cancelLoad();
    navigation.goBack();
  }, [cancelLoad, navigation]);

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
            onPress={dismissStaleBanner}
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
            <DemoOverridesProvider>
              <Form
                store={store}
                validators={demoValidatorOverrides}
                slots={demoFormSlots}
              />
            </DemoOverridesProvider>
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
