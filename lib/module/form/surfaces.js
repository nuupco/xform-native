"use strict";

/**
 * surfaces.tsx — presentational form-chrome pieces (Phase 2 / PR3, spec
 * R1/R2/R5/R6/R7, design decisions 6/7/8/9/10).
 *
 * LabelHint, BofSurface, EofSurface, RepeatPromptCard, WidgetErrorFallback,
 * ConstraintSurface, RequiredSurface. All migrated to `useThemedStyles`;
 * Constraint/Required delegate to the shared `ErrorBanner` (PR2).
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemedStyles } from "../theme/ThemeContext.js";
import { elevationStyle } from "../theme/elevationStyle.js";
import { PressableButton } from "../widgets/primitives/PressableButton.js";
import { AlertIcon, PlusIcon, LeafIcon } from "../widgets/primitives/Icon.js";
import { ErrorBanner } from "./ErrorBanner.js";
import { MarkdownText } from "../text/MarkdownText.js";
import { stripOdkMarkdown } from "../text/parseOdkMarkdown.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function createStyles(t) {
  return StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    title: {
      ...t.typography.headlineSmall,
      color: t.color.roles.onSurface,
      marginTop: t.spacing.md,
      textAlign: 'center'
    },
    subtitle: {
      ...t.typography.bodyMedium,
      color: t.color.roles.onSurfaceVariant,
      marginTop: t.spacing.xs,
      textAlign: 'center'
    },
    button: {
      marginTop: t.spacing.lg,
      alignSelf: 'stretch',
      marginHorizontal: t.spacing.lg
    },
    summaryCard: {
      backgroundColor: t.color.roles.surfaceVariant,
      borderRadius: t.radius.md,
      padding: t.spacing.md,
      marginTop: t.spacing.lg,
      marginHorizontal: t.spacing.lg,
      alignSelf: 'stretch'
    },
    summaryText: {
      ...t.typography.bodyMedium,
      color: t.color.roles.onSurfaceVariant
    },
    labelWrap: {
      gap: t.spacing.xxs
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: t.spacing.xxs
    },
    label: {
      ...t.typography.titleLarge,
      color: t.color.roles.onSurface
    },
    hint: {
      ...t.typography.bodyMedium,
      color: t.color.roles.onSurfaceVariant,
      marginBottom: t.spacing.sm
    },
    required: {
      ...t.typography.titleLarge,
      color: t.color.roles.tertiary
    },
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
      padding: t.spacing.md
    },
    plusCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.color.roles.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center'
    },
    promptText: {
      ...t.typography.titleSmall,
      color: t.color.roles.primary,
      flexShrink: 1
    },
    errorFallback: {
      ...elevationStyle(t, 1),
      backgroundColor: t.color.roles.errorContainer,
      borderRadius: t.radius.md,
      padding: t.spacing.md,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: t.spacing.sm
    },
    errorFallbackTextWrap: {
      flexShrink: 1,
      gap: t.spacing.xxs
    },
    errorFallbackText: {
      ...t.typography.bodySmall,
      color: t.color.roles.onSurface
    },
    errorFallbackField: {
      ...t.typography.bodySmall,
      ...t.typography.mono,
      color: t.color.roles.onSurfaceVariant
    }
  });
}
export function BofSurface({
  onStart,
  formTitle,
  formVersion
}) {
  const styles = useThemedStyles(createStyles);
  const subtitle = formTitle ? `${formTitle}${formVersion ? ` · ${formVersion}` : ''}` : null;
  return /*#__PURE__*/_jsxs(View, {
    style: styles.center,
    testID: "bof-surface",
    collapsable: false,
    children: [/*#__PURE__*/_jsx(LeafIcon, {
      size: 64
    }), /*#__PURE__*/_jsx(Text, {
      style: styles.title,
      children: "Inicio del formulario"
    }), subtitle !== null && /*#__PURE__*/_jsx(Text, {
      style: styles.subtitle,
      children: subtitle
    }), /*#__PURE__*/_jsx(View, {
      style: styles.button,
      children: /*#__PURE__*/_jsx(PressableButton, {
        testID: "bof-start-button",
        label: "Comenzar",
        variant: "filled",
        tone: "primary",
        height: 52,
        fullWidth: true,
        onPress: onStart
      })
    })]
  });
}
export function EofSurface({
  onFinish,
  answeredCount = 0,
  skippedCount = 0
}) {
  const styles = useThemedStyles(createStyles);
  return /*#__PURE__*/_jsxs(View, {
    style: styles.center,
    testID: "eof-surface",
    collapsable: false,
    children: [/*#__PURE__*/_jsx(LeafIcon, {
      size: 64
    }), /*#__PURE__*/_jsx(Text, {
      style: styles.title,
      children: "Formulario completo"
    }), /*#__PURE__*/_jsxs(View, {
      style: styles.summaryCard,
      testID: "eof-summary-card",
      collapsable: false,
      children: [/*#__PURE__*/_jsxs(Text, {
        style: styles.summaryText,
        children: ["Respondidas: ", answeredCount]
      }), /*#__PURE__*/_jsxs(Text, {
        style: styles.summaryText,
        children: ["Omitidas: ", skippedCount]
      })]
    }), onFinish && /*#__PURE__*/_jsx(View, {
      style: styles.button,
      children: /*#__PURE__*/_jsx(PressableButton, {
        testID: "eof-finish-button",
        label: "Finalizar",
        variant: "filled",
        tone: "secondary",
        height: 52,
        fullWidth: true,
        onPress: onFinish
      })
    })]
  });
}
export function ConstraintSurface({
  message
}) {
  return /*#__PURE__*/_jsx(ErrorBanner, {
    testID: "constraint-message",
    message: message
  });
}
export function RequiredSurface() {
  return /*#__PURE__*/_jsx(ErrorBanner, {
    testID: "required-message",
    message: "Este campo es obligatorio"
  });
}
export function LabelHint({
  label,
  hint,
  required = false
}) {
  const styles = useThemedStyles(createStyles);
  return /*#__PURE__*/_jsxs(View, {
    style: styles.labelWrap,
    collapsable: false,
    children: [label !== null && /*#__PURE__*/_jsxs(View, {
      style: styles.labelRow,
      collapsable: false,
      children: [/*#__PURE__*/_jsx(MarkdownText, {
        testID: "question-label",
        baseStyle: styles.label,
        value: label
      }), required && /*#__PURE__*/_jsx(Text, {
        testID: "required-indicator",
        style: styles.required,
        children: "*"
      })]
    }), hint !== null && /*#__PURE__*/_jsx(MarkdownText, {
      testID: "question-hint",
      baseStyle: styles.hint,
      value: hint
    })]
  });
}
export function RepeatPromptCard({
  label,
  onPress
}) {
  const styles = useThemedStyles(createStyles);
  return /*#__PURE__*/_jsxs(Pressable, {
    testID: "prompt-continue",
    onPress: onPress,
    style: styles.promptCard,
    children: [/*#__PURE__*/_jsx(View, {
      style: styles.plusCircle,
      children: /*#__PURE__*/_jsx(PlusIcon, {})
    }), /*#__PURE__*/_jsxs(Text, {
      style: styles.promptText,
      children: ["Agregar otro/a ", stripOdkMarkdown(label)]
    })]
  });
}
export function WidgetErrorFallback({
  fieldName
}) {
  const styles = useThemedStyles(createStyles);
  return /*#__PURE__*/_jsxs(View, {
    style: styles.errorFallback,
    testID: "widget-error-fallback",
    collapsable: false,
    children: [/*#__PURE__*/_jsx(AlertIcon, {}), /*#__PURE__*/_jsxs(View, {
      style: styles.errorFallbackTextWrap,
      children: [/*#__PURE__*/_jsx(Text, {
        style: styles.errorFallbackText,
        children: "Esta pregunta no se pudo mostrar"
      }), /*#__PURE__*/_jsx(Text, {
        testID: "widget-error-fallback-field",
        style: styles.errorFallbackField,
        children: fieldName
      })]
    })]
  });
}
//# sourceMappingURL=surfaces.js.map