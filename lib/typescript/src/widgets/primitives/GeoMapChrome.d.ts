import type { ReactNode } from 'react';
import type { GpsStatus } from './useGeoGps.js';
export type { GpsStatus };
export type PrewarmStatus = 'idle' | 'running' | 'done' | 'cap' | 'error';
export interface GeoMapChromeProps {
    children: ReactNode;
}
/** Positioned overlay container wrapping the map canvas (mapContainer). */
export declare function GeoMapChrome({ children }: GeoMapChromeProps): import("react").JSX.Element;
export interface MapActionButtonProps {
    icon: string;
    onPress: () => void;
    disabled?: boolean;
    testID?: string;
    /**
     * Positioning escape hatch: the recenter/prewarm buttons stack at
     * different `top` offsets. Call sites pass the exact absolute-position
     * values used before extraction/restyle.
     */
    style?: any;
}
export declare function MapActionButton({ icon, onPress, disabled, testID, style }: MapActionButtonProps): import("react").JSX.Element;
export interface GpsStatusPillProps {
    status: GpsStatus;
    accuracyM?: number;
    testID?: string;
}
export declare function GpsStatusPill({ status, accuracyM, testID }: GpsStatusPillProps): import("react").JSX.Element | null;
export interface PrewarmStatusPillProps {
    status: PrewarmStatus;
    testID?: string;
}
export declare function PrewarmStatusPill({ status, testID }: PrewarmStatusPillProps): import("react").JSX.Element | null;
export interface GpsPermissionNoticeProps {
    status: GpsStatus;
    onRequestPermission: () => void;
    onDismiss: () => void;
    onOpenSettings: () => void;
    /**
     * Widget-specific tap-to-place fallback sentence, appended to the body for
     * `denied`/`blocked` (never `rationale` — the user hasn't tried and failed
     * yet). Each widget supplies its own wording (point/vertex).
     */
    fallbackHint?: string;
    testID?: string;
}
/**
 * GpsPermissionNotice — pressable card overlay shown instead of
 * GpsStatusPill when status is `rationale`/`denied`/`blocked` (design
 * decisions 5-7, 12). Not a Modal/BottomSheet: the map lives inside an
 * already-open full-screen AppModal, so nesting another Modal here would be
 * illegal.
 */
export declare function GpsPermissionNotice({ status, onRequestPermission, onDismiss, onOpenSettings, fallbackHint, testID, }: GpsPermissionNoticeProps): import("react").JSX.Element;
export interface GeoActionSlot {
    onPress: () => void;
    disabled?: boolean;
    testID?: string;
}
export interface GeoActionBarProps {
    undo?: GeoActionSlot;
    addPoint?: GeoActionSlot & {
        label?: string;
    };
    accept: GeoActionSlot;
    cancel: GeoActionSlot;
}
export declare function GeoActionBar({ undo, addPoint, accept, cancel }: GeoActionBarProps): import("react").JSX.Element;
//# sourceMappingURL=GeoMapChrome.d.ts.map