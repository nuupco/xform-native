/**
 * DateWidget — renders a date entry field (REQ-13).
 *
 * RN-core only by default — no hard dependency on
 * @react-native-community/datetimepicker (ZERO native deps constraint). Entry
 * via formatted TextInput with mask/validation.
 *
 * @react-native-community/datetimepicker is an OPTIONAL peer dep (same gating
 * pattern as expo-image-picker in ImageWidget.tsx). Unlike ImageWidget, the
 * manual TextInput is never replaced when the dep is absent — it's the
 * baseline that already works. When the dep IS present, the `default` variant
 * (full YYYY-MM-DD) additionally renders a button that opens the native date
 * picker alongside the TextInput. `month-year` and `year` variants have no
 * standard native picker equivalent and are unaffected.
 *
 * Value shape (ts-rosa codecs.ts:153-158, AnswerValue.ts:27):
 *   date value = Date object (UTC midnight for the given date).
 *   store.answerQuestion receives a Date directly.
 *
 * Variants (ADR-3 date):
 *   default     → full YYYY-MM-DD TextInput (+ native picker button when available)
 *   month-year  → MM-YYYY entry, stored as Date with day=1
 *   year        → YYYY entry, stored as Date with month=1, day=1
 *   no-calendar → full YYYY-MM-DD TextInput, same as default, but NEVER
 *                 renders the native picker button (spec: text entry only,
 *                 no calendar UI at all, even when the optional peer dep is
 *                 present)
 *   buddhist, coptic, ethiopian, islamic, persian → YYYY-MM-DD TextInput,
 *                 same mask/shape as default, but the digits are read/shown
 *                 in that calendar system instead of Gregorian. The stored
 *                 value is still a Gregorian UTC Date (ODK Collect's own
 *                 pickers for these appearances are display/edit-only too —
 *                 see calendars.ts docblock for the conversion sources).
 *                 No native picker equivalent exists for these, same as
 *                 month-year/year.
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface DateWidgetProps {
    nodeRef: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function DateWidget({ nodeRef, store, appearance }: DateWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=DateWidget.d.ts.map