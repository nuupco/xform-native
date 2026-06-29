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
}
export declare function AppModal({ visible, onRequestClose, testID, style, children, animationType, }: AppModalProps): import("react").JSX.Element;
//# sourceMappingURL=Modal.d.ts.map