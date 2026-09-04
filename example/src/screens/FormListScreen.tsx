import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  PressableButton,
  useTheme,
  useThemedStyles,
  type Theme,
} from '@nuup/xform-native';
import { listForms } from '../services/apiClient';
import type { KoboAsset } from '../services/apiClient';
import type { RootStackParamList } from '../navigation/types';
import { createScreenStyles } from '../theme/screenStyles';
import { DEMO_ALL_WIDGETS_ASSET } from '../demo/allWidgetsForm';

function createStyles(t: Theme) {
  const screen = createScreenStyles(t);
  return StyleSheet.create({
    container: screen.screen,
    header: screen.header,
    backButton: screen.backButton,
    backButtonText: screen.backButtonText,
    title: screen.headerTitle,
    centered: screen.centered,
    emptyContainer: {
      flexGrow: 1,
    },
    listContainer: {
      paddingBottom: t.spacing.md,
    },
    loadingText: {
      marginTop: t.spacing.sm,
      ...t.typography.bodyLarge,
      color: t.color.roles.onSurfaceVariant,
    },
    errorText: screen.errorText,
    emptyText: screen.emptyText,
    row: screen.listRow,
    rowText: {
      ...t.typography.titleMedium,
      color: t.color.roles.onSurface,
    },
    loadMoreButton: {
      margin: t.spacing.md,
    },
  });
}

export function FormListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  const [forms, setForms] = useState<KoboAsset[]>([DEMO_ALL_WIDGETS_ASSET]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await listForms();
      setForms([DEMO_ALL_WIDGETS_ASSET, ...result.forms]);
      setNextUrl(result.nextUrl);
    } catch (e) {
      // The demo form stays visible even without a configured/reachable
      // Kobo server — it's the whole point (no network/credentials needed).
      setForms([DEMO_ALL_WIDGETS_ASSET]);
      setError(e instanceof Error ? e.message : 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextUrl || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await listForms({ nextUrl });
      setForms((prev) => [...prev, ...result.forms]);
      setNextUrl(result.nextUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load more forms');
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{'<'} Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Llenar formulario</Text>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.color.roles.primary} />
          <Text style={styles.loadingText}>Cargando formularios...</Text>
        </View>
      )}
      {!loading && (
        <FlatList
          data={forms}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={
            forms.length === 0 ? styles.emptyContainer : styles.listContainer
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('Viewer', { asset: item })}
            >
              <Text style={styles.rowText}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            error ? (
              <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <PressableButton label="Reintentar" onPress={() => void load()} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.centered}>
                <Text style={styles.emptyText}>No hay formularios publicados.</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            nextUrl !== null ? (
              <View style={styles.loadMoreButton}>
                <PressableButton
                  label={loadingMore ? 'Cargando...' : 'Cargar más'}
                  onPress={() => void loadMore()}
                  disabled={loadingMore}
                  fullWidth
                />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
