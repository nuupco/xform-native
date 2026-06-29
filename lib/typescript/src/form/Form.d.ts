/**
 * Form.tsx — navigator-driven screen-per-question component (REQ-10..REQ-12).
 *
 * ADR-1: uses useFormSession for reactivity.
 * ADR-2: switches on AdaptedEvent.kind.
 * ADR-5: dispatches to widget via pickWidget.
 */
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface FormProps {
    store: FormSessionStore;
}
export declare function Form({ store }: FormProps): import("react").JSX.Element;
//# sourceMappingURL=Form.d.ts.map