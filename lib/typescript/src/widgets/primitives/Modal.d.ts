/**
 * AppModal — StyleSheet layout primitive (REQ-18).
 *
 * Wraps React Native core Modal with design-token styling.
 * No WebView, no third-party layout library. RN-core only.
 */
import { type ViewStyle, type ModalProps } from 'react-native';
export interface AppModalProps {
    visible: boolean;
    onRequestClose?: () => void;
    /** testID forwarded to the inner container View */
    testID?: string;
    style?: ViewStyle;
    children?: React.ReactNode;
    animationType?: ModalProps['animationType'];
    /**
     * Opt out of the centered-dialog overlay (justifyContent: 'center' +
     * shrink-to-fit inset with padding) in favor of an unbounded flex:1
     * container that fills the whole screen edge-to-edge. Use for content
     * that itself needs the full screen (e.g. a full-screen map) — a child
     * `flex:1` has nothing to flex into inside the default centered dialog
     * (which has no explicit height), so it collapses to near-zero height.
     */
    fullScreen?: boolean;
}
export declare function AppModal({ visible, onRequestClose, testID, style, children, animationType, fullScreen, }: AppModalProps): import("react").JSX.Element;
//# sourceMappingURL=Modal.d.ts.map