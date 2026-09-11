/**
 * TriggerWidget — acknowledge/toggle control for controlType 'trigger'.
 *
 * Restyled per Phase 3 spec: `tertiaryContainer` container card, 24dp
 * checkbox + `bodyLarge` text, entire card tappable. Checked state adds a
 * 2px `tertiary` border and a filled check (`CheckIcon`).
 *
 * Commits the string sentinel 'OK' when tapped while unset, and clears the
 * answer to null when tapped while already 'OK' (toggleable, not one-way).
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface TriggerWidgetProps {
    nodeRef: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function TriggerWidget({ nodeRef, store }: TriggerWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=TriggerWidget.d.ts.map