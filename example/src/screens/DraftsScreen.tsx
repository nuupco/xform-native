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
import {
  PressableButton,
  useThemedStyles,
  type Theme,
} from '@nuup/xform-native';

import { listDrafts, loadDraft, deleteDraft } from '../services/draftStore';
import { listPending } from '../services/submissionQueue';
import { draftToAsset } from '../services/draftToAsset';
import type { Manifest } from '../services/submissionQueue';
import type { LoadedDraft } from './FormViewerScreen';
import type { RootStackParamList } from '../navigation/types';
import { createScreenStyles } from '../theme/screenStyles';

// ── Types ─────────────────────────────────────────────────────────────────────

type Section = {
  title: string;
  data: Manifest[];
  kind: 'draft' | 'queue';
};

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
    sectionHeader: screen.sectionHeader,
    sectionHeaderText: screen.sectionHeaderText,
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.color.roles.surface,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: t.color.roles.outlineVariant,
    },
    rowInfo: screen.rowInfo,
    rowTitle: screen.rowTitle,
    rowMeta: screen.rowMeta,
    rowActions: {
      flexDirection: 'row',
      gap: t.spacing.xs,
    },
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DraftsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const styles = useThemedStyles(createStyles);

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
                  <PressableButton
                    testID={`resume-${item.formId}`}
                    label="Reanudar"
                    variant="text"
                    height={36}
                    onPress={() => void handleResume(item.formId)}
                  />
                  <PressableButton
                    testID={`delete-${item.formId}`}
                    label="Eliminar"
                    variant="text"
                    tone="error"
                    height={36}
                    onPress={() => handleDelete(item.formId, item.formTitle)}
                  />
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
