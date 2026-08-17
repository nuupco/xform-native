/**
 * SafeAreaBottom — bottom-safe-area padding for full-screen map modals.
 *
 * Gated on react-native-safe-area-context (optional peer dep, same pattern
 * as expo-location/maplibre-react-native in the geo widgets). Confirmed
 * on-device: the geo map modals' action buttons (Accept/Cancel/Undo) were
 * clipped by Android's gesture-navigation bar, since a full-screen RN
 * <Modal> does not account for system bar insets on its own. Falls back to
 * a fixed padding when the package is absent, so the button row is never
 * flush against the screen edge even without it.
 */
import type { ComponentType, ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

const FALLBACK_BOTTOM_INSET = 24;

let _safeAreaView: ComponentType<{
  edges?: readonly string[];
  style?: ViewStyle;
  children?: ReactNode;
}> | null = null;
let _loaded: boolean | undefined;

function getSafeAreaView() {
  if (_loaded === undefined) {
    try {
      _safeAreaView = require('react-native-safe-area-context').SafeAreaView;
      _loaded = true;
    } catch {
      _safeAreaView = null;
      _loaded = false;
    }
  }
  return _safeAreaView;
}

export interface SafeAreaBottomProps {
  style?: ViewStyle;
  children?: ReactNode;
}

export function SafeAreaBottom({ style, children }: SafeAreaBottomProps) {
  const SafeAreaView = getSafeAreaView();
  if (SafeAreaView) {
    return (
      <SafeAreaView edges={['bottom']} style={style}>
        {children}
      </SafeAreaView>
    );
  }
  return (
    <View style={[style, { paddingBottom: FALLBACK_BOTTOM_INSET }]}>
      {children}
    </View>
  );
}
