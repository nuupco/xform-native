/**
 * surfaces.tsx — presentational form-chrome pieces (Phase 2 / PR3, spec
 * R1/R2/R5/R6/R7, design decisions 6/7/8/9/10).
 *
 * LabelHint, BofSurface, EofSurface, RepeatPromptCard, WidgetErrorFallback,
 * ConstraintSurface, RequiredSurface. All migrated to `useThemedStyles`;
 * Constraint/Required delegate to the shared `ErrorBanner` (PR2).
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import { elevationStyle } from '../theme/elevationStyle';
import { PressableButton } from '../widgets/primitives/PressableButton';
import { AlertIcon, PlusIcon, LeafIcon } from '../widgets/primitives/Icon';
import { ErrorBanner } from './ErrorBanner';

function createStyles(t: Theme) {
  return StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { ...t.typography.headlineSmall, color: t.color.roles.onSurface, marginTop: t.spacing.md, textAlign: 'center' },
    subtitle: { ...t.typography.bodyMedium, color: t.color.roles.onSurfaceVariant, marginTop: t.spacing.xs, textAlign: 'center' },
    button: { marginTop: t.spacing.lg, alignSelf: 'stretch', marginHorizontal: t.spacing.lg },
    summaryCard: {
      backgroundColor: t.color.roles.surfaceVariant,
      borderRadius: t.radius.md,
      padding: t.spacing.md,
      marginTop: t.spacing.lg,
      marginHorizontal: t.spacing.lg,
      alignSelf: 'stretch',
    },
    summaryText: { ...t.typography.bodyMedium, color: t.color.roles.onSurfaceVariant },
    labelWrap: { gap: t.spacing.xxs },
    labelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.xxs },
    label: { ...t.typography.titleLarge, color: t.color.roles.onSurface },
    hint: { ...t.typography.bodyMedium, color: t.color.roles.onSurfaceVariant, marginBottom: t.spacing.sm },
    required: { ...t.typography.titleLarge, color: t.color.roles.tertiary },
    promptCard: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      backgroundColor: t.color.roles.surfaceVariant,
      borderRadius: t.radius.lg,
      borderWidth: 2,
      borderColor: t.color.roles.outline,
      borderStyle: 'dashed',
      padding: t.spacing.md,
    },
    plusCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.color.roles.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    promptText: { ...t.typography.titleSmall, color: t.color.roles.primary, flexShrink: 1 },
    errorFallback: {
      ...elevationStyle(t, 1),
      backgroundColor: t.color.roles.errorContainer,
      borderRadius: t.radius.md,
      padding: t.spacing.md,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: t.spacing.sm,
    },
    errorFallbackTextWrap: { flexShrink: 1, gap: t.spacing.xxs },
    errorFallbackText: { ...t.typography.bodySmall, color: t.color.roles.onSurface },
    errorFallbackField: { ...t.typography.bodySmall, ...t.typography.mono, color: t.color.roles.onSurfaceVariant },
  });
}

export function BofSurface({
  onStart,
  formTitle,
  formVersion,
}: {
  onStart: () => void;
  formTitle?: string;
  formVersion?: string;
}) {
  const styles = useThemedStyles(createStyles);
  const subtitle = formTitle ? `${formTitle}${formVersion ? ` · ${formVersion}` : ''}` : null;
  return (
    <View style={styles.center} testID="bof-surface" collapsable={false}>
      <LeafIcon size={64} />
      <Text style={styles.title}>Inicio del formulario</Text>
      {subtitle !== null && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={styles.button}>
        <PressableButton
          testID="bof-start-button"
          label="Comenzar"
          variant="filled"
          tone="primary"
          height={52}
          fullWidth
          onPress={onStart}
        />
      </View>
    </View>
  );
}

export function EofSurface({
  onFinish,
  answeredCount = 0,
  skippedCount = 0,
}: {
  onFinish?: () => void;
  answeredCount?: number;
  skippedCount?: number;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.center} testID="eof-surface" collapsable={false}>
      <LeafIcon size={64} />
      <Text style={styles.title}>Formulario completo</Text>
      <View style={styles.summaryCard} testID="eof-summary-card" collapsable={false}>
        <Text style={styles.summaryText}>Respondidas: {answeredCount}</Text>
        <Text style={styles.summaryText}>Omitidas: {skippedCount}</Text>
      </View>
      {onFinish && (
        <View style={styles.button}>
          <PressableButton
            testID="eof-finish-button"
            label="Finalizar"
            variant="filled"
            tone="secondary"
            height={52}
            fullWidth
            onPress={onFinish}
          />
        </View>
      )}
    </View>
  );
}

export function ConstraintSurface({ message }: { message: string }) {
  return <ErrorBanner testID="constraint-message" message={message} />;
}

export function RequiredSurface() {
  return <ErrorBanner testID="required-message" message="Este campo es obligatorio" />;
}

export function LabelHint({
  label,
  hint,
  required = false,
}: {
  label: string | null;
  hint: string | null;
  required?: boolean;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.labelWrap} collapsable={false}>
      {label !== null && (
        <View style={styles.labelRow} collapsable={false}>
          <Text testID="question-label" style={styles.label}>
            {label}
          </Text>
          {required && (
            <Text testID="required-indicator" style={styles.required}>
              *
            </Text>
          )}
        </View>
      )}
      {hint !== null && (
        <Text testID="question-hint" style={styles.hint}>
          {hint}
        </Text>
      )}
    </View>
  );
}

export function RepeatPromptCard({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable testID="prompt-continue" onPress={onPress} style={styles.promptCard}>
      <View style={styles.plusCircle}>
        <PlusIcon />
      </View>
      <Text style={styles.promptText}>Agregar otro/a {label}</Text>
    </Pressable>
  );
}

export function WidgetErrorFallback({ fieldName }: { fieldName: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.errorFallback} testID="widget-error-fallback" collapsable={false}>
      <AlertIcon />
      <View style={styles.errorFallbackTextWrap}>
        <Text style={styles.errorFallbackText}>Esta pregunta no se pudo mostrar</Text>
        <Text testID="widget-error-fallback-field" style={styles.errorFallbackField}>
          {fieldName}
        </Text>
      </View>
    </View>
  );
}
