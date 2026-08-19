import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { elevationStyle, useThemedStyles, type Theme } from '@nuup/xform-native';

import { listDrafts } from '../services/draftStore';
import { listPending } from '../services/submissionQueue';
import { listSent } from '../services/sentStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import type { RootStackParamList } from '../navigation/types';
import { createScreenStyles } from '../theme/screenStyles';

function createStyles(t: Theme) {
  const screen = createScreenStyles(t);
  return StyleSheet.create({
    container: screen.screen,
    header: {
      ...screen.header,
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: t.spacing.xs,
    },
    title: {
      ...t.typography.headlineSmall,
      color: t.color.roles.onPrimary,
    },
    networkBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.xs,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    dotOnline: {
      backgroundColor: t.color.roles.primaryContainer,
    },
    dotOffline: {
      backgroundColor: t.color.roles.errorContainer,
    },
    networkText: {
      ...t.typography.labelMedium,
      color: t.color.roles.onPrimary,
    },
    menu: {
      flex: 1,
      padding: t.spacing.md,
      gap: t.spacing.sm,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.color.roles.surface,
      borderRadius: t.radius.md,
      minHeight: 56,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.md,
      gap: t.spacing.md,
      // Cast: cross-package react-native type-identity mismatch between the
      // library's and example app's react-native versions (see
      // screenStyles.ts) — not a real type error.
      ...(elevationStyle(t, 1) as object),
    },
    menuIcon: {
      fontSize: 22,
      color: t.color.roles.primary,
      width: 28,
      textAlign: 'center',
    },
    menuLabel: {
      flex: 1,
      ...t.typography.titleMedium,
      color: t.color.roles.onSurface,
    },
    badge: {
      backgroundColor: t.color.roles.secondary,
      borderRadius: t.radius.pill,
      minWidth: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: t.spacing.xs,
    },
    badgeText: {
      ...t.typography.labelMedium,
      color: t.color.roles.onSecondary,
    },
  });
}

export function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isOnline } = useNetworkStatus();
  const styles = useThemedStyles(createStyles);

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
