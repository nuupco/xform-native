/**
 * T-11b: PR-3b widget components (REQ-13, REQ-14).
 *
 * Covers: SelectOneWidget, SelectMultiWidget, DateWidget, TimeWidget,
 *         DateTimeWidget, RangeWidget.
 *
 * TDD: these tests are written FIRST (RED) and drive the implementation (GREEN).
 *
 * Value shapes verified against ts-rosa source:
 *   selectOne   → string token           (AnswerValue.ts:30, codecs.ts:180-183)
 *   selectMulti → readonly string[]      (AnswerValue.ts:31, codecs.ts:185-189)
 *   date        → Date object            (AnswerValue.ts:27, codecs.ts:153-158)
 *   time        → Date object            (AnswerValue.ts:28, codecs.ts:162-169)
 *   dateTime    → Date object            (AnswerValue.ts:29, codecs.ts:172-176)
 *   range       → number (int/decimal)   (controlType=range, no dedicated AnswerValue kind)
 *
 * range bounds: FormElement.ts has no dedicated range bound fields on FormElement.
 * RangeWidget uses sane defaults (start=0, end=10, step=1) with optional props.
 */
export {};
//# sourceMappingURL=widgets-pr3b.test.d.ts.map