import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { listDrafts, loadDraft, deleteDraft } from '../services/draftStore';
import { listPending } from '../services/submissionQueue';
import { draftToAsset } from '../services/draftToAsset';
import type { Manifest } from '../services/submissionQueue';
import type { LoadedDraft } from './FormViewerScreen';
import type { RootStackParamList } from '../navigation/types';

// ── Types ─────────────────────────────────────────────────────────────────────

type Section = {
  title: string;
  data: Manifest[];
  kind: 'draft' | 'queue';
};

// ── Component ─────────────────────────────────────────────────────────────────

export function DraftsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [drafts, setDrafts] = useState<Manifest[]>([]);
  const [pending, setPending] = useState<Manifest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [draftList, pendingList] = await Promise.all([
        listDrafts(),
        listPending(),
      ]);
      setDrafts(draftList);
      setPending(pendingList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleResume = useCallback(
    async (formId: string) => {
      const loaded = await loadDraft(formId);
      if (!loaded) return;
      const asset = await draftToAsset(loaded.manifest);
      const draft: LoadedDraft = {
        instanceXml: loaded.instanceXml,
        instanceAttachments: loaded.instanceAttachments,
        isStale: false,
        manifest: loaded.manifest,
      };
      navigation.navigate('Viewer', {
        asset,
        draft,
      });
    },
    [navigation]
  );

  const handleDelete = useCallback(
    (formId: string, formTitle: string) => {
      Alert.alert(
        'Eliminar borrador',
        `¿Eliminar "${formTitle}"? Esta acción no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              await deleteDraft(formId);
              void load();
            },
          },
        ]
      );
    },
    [load]
  );

  const sections: Section[] = [
    { title: 'Borradores guardados', data: drafts, kind: 'draft' },
    { title: 'Pendientes de envío', data: pending, kind: 'queue' },
  ];

  const isEmpty = drafts.length === 0 && pending.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{'<'} Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Borradores</Text>
      </View>

      {/* Body */}
      {!loading && isEmpty ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No hay borradores ni envíos pendientes.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.instanceID}
          renderSectionHeader={({ section }) =>
            section.data.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{section.title}</Text>
              </View>
            ) : null
          }
          renderItem={({ item, section }) => (
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>{item.formTitle}</Text>
                <Text style={styles.rowMeta}>
                  {new Date(item.savedAt).toLocaleDateString('es-MX')}
                </Text>
              </View>
              {section.kind === 'draft' && (
                <View style={styles.rowActions}>
                  <TouchableOpacity
                    testID={`resume-${item.formId}`}
                    style={styles.actionButton}
                    onPress={() => void handleResume(item.formId)}
                  >
                    <Text style={styles.actionButtonText}>Reanudar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID={`delete-${item.formId}`}
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item.formId, item.formTitle)}
                  >
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  sectionHeader: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1976d2',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#c0392b',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
