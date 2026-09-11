/**
 * Form.tsx — navigator-driven screen-per-question component (REQ-10..REQ-12).
 *
 * ADR-1: uses useFormSession for reactivity.
 * ADR-2: switches on AdaptedEvent.kind.
 * ADR-5: dispatches to widget via pickWidget.
 */
import { type WidgetOverride } from '../widgets/engine/registry.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
import { type FormSlots } from './slots.js';
import { type ValidatorOverride } from './validation.js';
export interface FormProps {
    store: FormSessionStore;
    /** Additive (widget-registry, D5): frozen at mount, wins tie-break over context entries. */
    widgets?: readonly WidgetOverride[];
    /** Additive (form-composition-slots, D6): optional render-prop overrides for nav/error/group. */
    slots?: FormSlots;
    /** Additive (form-validation-hooks, D7/D8): frozen at mount, wins tie-break over context entries. */
    validators?: readonly ValidatorOverride[];
    /** Additive (design decision 7): forwarded to BofSurface/EofSurface subtitle; omitted → subtitle hidden. */
    formTitle?: string;
    formVersion?: string;
    /** Additive: when true, skips the BofSurface "start" screen and advances past `bof` as soon as the form mounts. Defaults to false (BofSurface shown). */
    autoStart?: boolean;
}
export declare function Form({ store, widgets: widgetsProp, slots, validators: validatorsProp, formTitle, formVersion, autoStart, }: FormProps): import("react").JSX.Element;
//# sourceMappingURL=Form.d.ts.map