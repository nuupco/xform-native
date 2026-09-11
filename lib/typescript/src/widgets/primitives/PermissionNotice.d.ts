export interface PermissionNoticeProps {
    title: string;
    body: string;
    primaryLabel: string;
    onPrimary: () => void;
    dismissLabel?: string;
    onDismiss?: () => void;
    testID?: string;
}
/**
 * Dismiss renders only when both `dismissLabel` and `onDismiss` are given
 * (design decision 6) — omitted for e.g. `blocked` copy, which has no
 * "not now" affordance.
 */
export declare function PermissionNotice({ title, body, primaryLabel, onPrimary, dismissLabel, onDismiss, testID, }: PermissionNoticeProps): import("react").JSX.Element;
//# sourceMappingURL=PermissionNotice.d.ts.map