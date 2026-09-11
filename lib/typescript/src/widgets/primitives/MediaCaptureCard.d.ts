/**
 * MediaCaptureCard — shared M3 media-capture chrome primitive (design
 * decision 7).
 *
 * Extracted from Image/Audio/Video/File/Barcode, which all render the
 * identical `container gap:sm` + button-row + `buttonText` triple across
 * 2-4 states each (~14 sites total). This PR (slice 10) ships the primitive
 * only — no existing widget consumes it yet; Image/File/Barcode wire in
 * PR11, Audio/Video in PR12.
 *
 * Action rendering reuses `PressableButton` (decision 11) so the
 * `tone:'error'` (Stop/Cancel), disabled-opacity, and ripple/press matrix
 * come for free instead of being re-implemented here.
 */
import type { ReactNode } from 'react';
import { type PressableButtonTone } from './PressableButton.js';
export type MediaCaptureCardState = 'empty' | 'captured' | 'active';
export interface MediaCaptureCardAction {
    label: string;
    icon?: ReactNode;
    tone?: PressableButtonTone;
    onPress: () => void;
    testID?: string;
    disabled?: boolean;
}
export interface MediaCaptureCardProps {
    state: MediaCaptureCardState;
    icon: ReactNode;
    title: string;
    hint?: string;
    actions: MediaCaptureCardAction[];
    preview?: ReactNode;
    disabled?: boolean;
    testID?: string;
}
/**
 * `state:'captured'` renders only `preview` (falling back to nothing if the
 * caller forgot to pass one); `empty`/`active` render `icon`/`title`/`hint`.
 * Actions render in every state — capture flows (e.g. Audio's Stop button)
 * need actions available while `active`.
 */
export declare function MediaCaptureCard({ state, icon, title, hint, actions, preview, disabled, testID, }: MediaCaptureCardProps): import("react").JSX.Element;
//# sourceMappingURL=MediaCaptureCard.d.ts.map