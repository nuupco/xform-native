import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { listDrafts } from '../services/draftStore';
import { listPending } from '../services/submissionQueue';
import { listSent } from '../services/sentStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import type { RootStackParamList } from '../navigation/types';

export function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isOnline } = useNetworkStatus();

  const [draftCount, setDraftCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const [drafts, pending, sent] = await Promise.all([
          listDrafts(),
          listPending(),
          listSent(),
        ]);
        setDraftCount(drafts.length);
        setPendingCount(pending.length);
        setSentCount(sent.length);
      })();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Recolección de datos</Text>
        <View style={styles.networkBadge}>
          <View
            style={[styles.dot, isOnline ? styles.dotOnline : styles.dotOffline]}
          />
          <Text style={styles.networkText}>
            {isOnline ? 'En línea' : 'Sin conexión'}
          </Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('List')}
        >
          <Text style={styles.menuIcon}>+</Text>
          <Text style={styles.menuLabel}>Llenar formulario</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Drafts')}
        >
          <Text style={styles.menuIcon}>✏</Text>
          <Text style={styles.menuLabel}>Editar borradores</Text>
          {draftCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{draftCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Finalized')}
        >
          <Text style={styles.menuIcon}>↑</Text>
          <Text style={styles.menuLabel}>Enviar finalizados</Text>
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Sent')}
        >
          <Text style={styles.menuIcon}>✓</Text>
          <Text style={styles.menuLabel}>Formularios enviados</Text>
          {sentCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{sentCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: '#a5d6a7',
  },
  dotOffline: {
    backgroundColor: '#ef9a9a',
  },
  networkText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  menu: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    gap: 12,
  },
  menuIcon: {
    fontSize: 22,
    color: '#1976d2',
    width: 28,
    textAlign: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  badge: {
    backgroundColor: '#1976d2',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
