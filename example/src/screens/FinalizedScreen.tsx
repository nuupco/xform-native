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

import { listPending, flush } from '../services/submissionQueue';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import type { Manifest } from '../services/submissionQueue';
import type { RootStackParamList } from '../navigation/types';

// ── Component ─────────────────────────────────────────────────────────────────

export function FinalizedScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isOnline } = useNetworkStatus();

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
  sendButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  offlineBanner: {
    backgroundColor: '#fff3cd',
    borderBottomWidth: 1,
    borderBottomColor: '#ffc107',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  offlineBannerText: {
    fontSize: 13,
    color: '#856404',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  rowMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
