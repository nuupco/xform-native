/**
 * formOverrides — shadcn-lite capability showcase.
 *
 * Minimal, functional demonstrations of the Form extension points (widget
 * registry via context, validation hooks via props). They are always-on but
 * harmless: with no matching nodes they never fire, so the no-overrides case
 * (any form without a `note` control) renders exactly as before.
 *
 * Tie-break safety: `Form.tsx` freezes `[...contextOverrides, ...propOverrides]`
 * at mount, and `pickBest` gives ties to the last entry (props win). Because
 * each list below has exactly one entry, merged resolution is provably
 * identical to a props-only setup — a second widget override added later
 * would make that tie-break live; see the note on `demoWidgetOverrides`.
 */

import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  WidgetRegistryProvider,
  useFormSession,
  tokens,
  type WidgetOverride,
  type XFormWidgetProps,
  type ValidatorOverride,
} from '@nuup/xform-native';

// 1. Widget override: a visibly distinct `note` renderer with a highlighted
// box and a leading icon, replacing the default NoteWidget for this app.
export function HighlightedNoteWidget({ nodeRef, store }: XFormWidgetProps) {
  useFormSession(store);
  const value = store.adapter.resolveValue(nodeRef);
  const text = value != null ? String(value) : '';
  return (
    <View style={demoStyles.noteBox} testID="demo-highlighted-note">
      <Text style={demoStyles.noteIcon}>i</Text>
      <Text style={demoStyles.noteText}>{text}</Text>
    </View>
  );
}

// Not exported: the context path (via DemoOverridesProvider) is the only
// sanctioned way to consume this, which is what makes the teaching point
// unambiguous. Keep this list to exactly one entry — a second entry would
// make the context/props tie-break in Form.tsx live instead of inert.
const demoWidgetOverrides: readonly WidgetOverride[] = [
  { match: { controlType: 'input', appearance: 'note' }, Widget: HighlightedNoteWidget },
];

export function DemoOverridesProvider({ children }: { children: ReactNode }) {
  return (
    <WidgetRegistryProvider widgets={demoWidgetOverrides}>
      {children}
    </WidgetRegistryProvider>
  );
}

// 4. Custom validator: for `note` controls (harmless additive check) — this
// demonstrates composing on top of defaultValidate() rather than a real
// business rule, since note controls have no user input to validate.
// Registered via the `validators` prop on <Form> (props path).
export const demoValidatorOverrides: readonly ValidatorOverride[] = [
  {
    // `dataType: 'string'` alone also matches select1/select bindings (they
    // carry dataType 'string' in JavaRosa) — restrict to free-text `input`
    // controls so this demo rule doesn't fire on radio/checkbox tokens like
    // the single-character "1"/"2" choice values seen in real forms.
    match: { dataType: 'string', controlType: 'input' },
    validate: (ctx) => {
      const defaultBlock = ctx.defaultValidate();
      if (defaultBlock) return defaultBlock;
      const value = ctx.store.adapter.resolveValue(ctx.nodeRef);
      if (typeof value === 'string' && value.trim().length > 0 && value.trim().length < 2) {
        return { type: 'tooShort', message: 'Escribe al menos 2 caracteres.' };
      }
      return null;
    },
  },
];

// Uses `tokens` (not a live `useTheme()` call) — retinting the purple demo
// (design decision 4) doesn't need runtime theme reactivity, since the
// example app's `ThemeProvider` mounts with no override (decision 2).
const demoStyles = StyleSheet.create({
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.xs,
    backgroundColor: tokens.color.roles.secondaryContainer,
    borderLeftWidth: 4,
    borderLeftColor: tokens.color.roles.secondary,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    marginVertical: tokens.spacing.xxs,
  },
  noteIcon: {
    color: tokens.color.roles.secondary,
    fontWeight: '700',
    fontSize: 14,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: tokens.color.roles.onSecondaryContainer,
    fontStyle: 'italic',
  },
});
