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
import type { ReactNode } from 'react';
import { type ViewStyle } from 'react-native';
export interface SafeAreaBottomProps {
    style?: ViewStyle;
    children?: ReactNode;
}
export declare function SafeAreaBottom({ style, children }: SafeAreaBottomProps): import("react").JSX.Element;
//# sourceMappingURL=SafeAreaBottom.d.ts.map