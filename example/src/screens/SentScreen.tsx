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
import { useTheme, useThemedStyles, type Theme } from '@nuup/xform-native';

import { listSent, deleteSent } from '../services/sentStore';
import type { SentManifest } from '../services/sentStore';
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
    centered: screen.centered,
    emptyText: screen.emptyText,
    row: screen.listRow,
    rowInfo: screen.rowInfo,
    rowTitle: screen.rowTitle,
    rowMeta: screen.rowMeta,
    deleteButton: {
      padding: t.spacing.xs,
      marginLeft: t.spacing.xs,
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteText: { fontSize: 18 },
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SentScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
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
          <ActivityIndicator size="large" color={theme.color.roles.primary} />
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
