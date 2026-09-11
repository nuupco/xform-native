/**
 * BottomSheet — StyleSheet layout primitive (REQ-18).
 *
 * Layout pattern ported from expo-enketo-form's BottomSheetPicker:
 *   transparent Modal + bottom-anchored panel (justifyContent: 'flex-end').
 * Layout only — no bridge logic, no Expo deps, RN-core only.
 */
export interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    children?: React.ReactNode;
    testID?: string;
}
export declare function BottomSheet({ visible, onClose, children, testID }: BottomSheetProps): import("react").JSX.Element;
//# sourceMappingURL=BottomSheet.d.ts.map