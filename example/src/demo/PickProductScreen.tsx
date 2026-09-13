/**
 * PickProductScreen — demo UI for the `injectValues` slot (appearance
 * "inject-values", see allWidgetsForm's "/data/g_product" group and the
 * README section "`inject-values` group appearance").
 *
 * Deliberately a hardcoded catalog, not a real backend/barcode lookup — the
 * point of this demo is to show the host-app contract (receive `fields`,
 * call `submit()` with a value per field ref), not to build a real product
 * picker. Styled with the same primitives/tokens used elsewhere in the demo
 * app (see formOverrides.tsx) rather than a bespoke look.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  PressableButton,
  useThemedStyles,
  type InjectValuesSlotContext,
  type Theme,
} from '@nuup/xform-native';

interface DemoProduct {
  id: string;
  name: string;
}

const DEMO_PRODUCTS: readonly DemoProduct[] = [
  { id: 'cafe-001', name: 'Café de altura' },
  { id: 'cacao-002', name: 'Cacao criollo' },
  { id: 'agave-003', name: 'Agave espadín' },
];

export function PickProductScreen({ fields, submit }: InjectValuesSlotContext) {
  const styles = useThemedStyles(createStyles);

  const idField = fields.find((f) => f.name === '/data/g_product/product_id');
  const nameField = fields.find((f) => f.name === '/data/g_product/product_name');

  const handlePick = (product: DemoProduct) => {
    const values = new Map<InjectValuesSlotContext['fields'][number]['ref'], unknown>();
    if (idField) values.set(idField.ref, product.id);
    if (nameField) values.set(nameField.ref, product.name);
    submit(values);
  };

  return (
    <View style={styles.container} testID="pick-product-screen">
      <Text style={styles.title}>Elegí un producto</Text>
      <Text style={styles.hint}>
        Esta pantalla reemplaza al formulario mientras dura la selección — al
        elegir, los valores se inyectan y el formulario continúa.
      </Text>
      <View style={styles.list}>
        {DEMO_PRODUCTS.map((product) => (
          <PressableButton
            key={product.id}
            testID={`pick-product-${product.id}`}
            label={product.name}
            onPress={() => handlePick(product)}
          />
        ))}
      </View>
    </View>
  );
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: t.spacing.md,
      gap: t.spacing.sm,
      justifyContent: 'center',
    },
    title: {
      ...t.typography.titleLarge,
      color: t.color.roles.onSurface,
    },
    hint: {
      ...t.typography.bodyMedium,
      color: t.color.roles.onSurfaceVariant,
    },
    list: {
      gap: t.spacing.sm,
      marginTop: t.spacing.md,
    },
  });
}
