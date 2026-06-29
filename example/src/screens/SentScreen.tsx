import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

import { listSent, deleteSent } from '../services/sentStore';
import type { SentManifest } from '../services/sentStore';
import type { RootStackParamList } from '../navigation/types';

// ── Component ─────────────────────────────────────────────────────────────────

export function SentScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<SentManifest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const sent = await listSent();
    setItems(sent);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = (instanceID: string) => {
    Alert.alert(
      'Eliminar del historial',
      '¿Quitar este formulario del historial de enviados? (No afecta el envío ya realizado.)',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await deleteSent(instanceID);
              await load();
            })();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'} Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Formularios enviados</Text>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1976d2" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No hay formularios enviados.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.instanceID}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.formTitle}
                </Text>
                <Text style={styles.rowMeta}>
                  Enviado: {new Date(item.sentAt).toLocaleDateString('es-MX')}
                </Text>
              </View>
              <TouchableOpacity
                testID={`delete-${item.instanceID}`}
                onPress={() => handleDelete(item.instanceID)}
                hitSlop={8}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteText}>🗑</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  backButton: { paddingHorizontal: 8, paddingVertical: 4 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#222' },
  rowMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  deleteButton: { padding: 6, marginLeft: 8 },
  deleteText: { fontSize: 18 },
});
