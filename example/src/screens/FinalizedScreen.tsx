import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemedStyles, type Theme } from '@nuup/xform-native';

import { listPending, flush } from '../services/submissionQueue';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import type { Manifest } from '../services/submissionQueue';
import type { RootStackParamList } from '../navigation/types';
import { createScreenStyles } from '../theme/screenStyles';

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(t: Theme) {
  const screen = createScreenStyles(t);
  return StyleSheet.create({
    container: screen.screen,
    header: screen.header,
    backButton: screen.backButton,
    backButtonText: screen.backButtonText,
    title: screen.headerTitle,
    sendButton: {
      backgroundColor: t.color.roles.primaryContainer,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xxs,
      borderRadius: t.radius.md,
    },
    sendButtonDisabled: {
      opacity: t.disabled.contentOpacity,
    },
    sendButtonText: {
      ...t.typography.labelLarge,
      color: t.color.roles.onPrimaryContainer,
    },
    offlineBanner: screen.banner,
    offlineBannerText: screen.bannerText,
    centered: screen.centered,
    emptyText: screen.emptyText,
    row: screen.listRow,
    rowInfo: screen.rowInfo,
    rowTitle: screen.rowTitle,
    rowMeta: screen.rowMeta,
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FinalizedScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isOnline } = useNetworkStatus();
  const styles = useThemedStyles(createStyles);

  const [items, setItems] = useState<Manifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const pending = await listPending();
      setItems(pending);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSendAll = useCallback(async () => {
    if (!isOnline) return;
    setSending(true);
    try {
      await flush();
      await load();
      Alert.alert(
        'Envío completado',
        'Los formularios finalizados fueron enviados.',
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert(
        'Error al enviar',
        'No se pudieron enviar todos los formularios. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setSending(false);
    }
  }, [isOnline, load]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{'<'} Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Finalizados</Text>
        <TouchableOpacity
          testID="send-all-button"
          style={[
            styles.sendButton,
            (!isOnline || sending) && styles.sendButtonDisabled,
          ]}
          onPress={() => void handleSendAll()}
          disabled={!isOnline || sending}
          accessibilityState={{ disabled: !isOnline || sending }}
        >
          <Text style={styles.sendButtonText}>
            {sending ? 'Enviando...' : 'Enviar todos'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Offline notice */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            Sin conexión — los formularios se enviarán cuando haya internet.
          </Text>
        </View>
      )}

      {/* Body */}
      {!loading && items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            No hay formularios finalizados pendientes de envío.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.instanceID}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>{item.formTitle}</Text>
                <Text style={styles.rowMeta}>
                  {new Date(item.savedAt).toLocaleDateString('es-MX')}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
