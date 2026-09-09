/**
 * T-04: Adapter type-level tests.
 *
 * Verifies:
 *  1. NodeRef carries __brand (opaque token)
 *  2. AdaptedEvent kinds match spec (question/group/repeat/prompt-new-repeat/bof/eof)
 *  3. No FormEntryEvent or FormIndex in the public AdaptedEvent surface
 *  4. question variant surfaces dataType + controlType
 */

import type { AdaptedEvent, NodeRef } from '../../adapter/FormAdapter';

// ---------------------------------------------------------------------------
// 1. NodeRef brand check — must compile AND carry __brand
// ---------------------------------------------------------------------------
type HasBrand = NodeRef extends { readonly __brand: 'NodeRef' } ? true : false;
const _brandCheck: HasBrand = true;

// ---------------------------------------------------------------------------
// 2. All six kinds exist on AdaptedEvent
// ---------------------------------------------------------------------------
type ExtractKind<T, K extends string> = T extends { kind: K } ? T : never;

type QuestionEvent = ExtractKind<AdaptedEvent, 'question'>;
type GroupEvent = ExtractKind<AdaptedEvent, 'group'>;
type RepeatEvent = ExtractKind<AdaptedEvent, 'repeat'>;
type PromptNewRepeatEvent = ExtractKind<AdaptedEvent, 'prompt-new-repeat'>;
type BofEvent = ExtractKind<AdaptedEvent, 'bof'>;
type EofEvent = ExtractKind<AdaptedEvent, 'eof'>;

// Each should not be `never`
const _q: QuestionEvent = { kind: 'question', ref: {} as NodeRef, dataType: 'string', controlType: 'input', appearance: null, label: null, hint: null, index: 0, rangeBounds: null, mediatype: null };
const _g: GroupEvent = {
  kind: 'group',
  ref: {} as NodeRef,
  label: null,
  hint: null,
  index: 0,
  appearance: null,
};
const _r: RepeatEvent = { kind: 'repeat', ref: {} as NodeRef, label: null, multiplicity: 0, index: 0 };
const _pnr: PromptNewRepeatEvent = { kind: 'prompt-new-repeat', ref: {} as NodeRef, label: null, index: 0 };
const _bof: BofEvent = { kind: 'bof' };
const _eof: EofEvent = { kind: 'eof' };

// ---------------------------------------------------------------------------
// 3. AdaptedEvent does NOT expose FormEntryEvent or FormIndex
//    (structural check: no property named 'code' — that's FormEntryEvent's field)
// ---------------------------------------------------------------------------
type HasCode = QuestionEvent extends { code: unknown } ? true : false;
const _noCode: HasCode = false;

// ---------------------------------------------------------------------------
// 4. question.dataType and question.controlType exist (compile-time shape check)
// ---------------------------------------------------------------------------
// If these are `never`, the assertion below would be unreachable but it'd still compile.
const _typeCheck: { dt: QuestionEvent['dataType']; ct: QuestionEvent['controlType'] } = {
  dt: 'string',
  ct: 'input',
};

// Use value so TS doesn't complain about unused
void _brandCheck;
void _q; void _g; void _r; void _pnr; void _bof; void _eof;
void _noCode;
void _typeCheck;

// Actual runtime test (jest requires at least one)
describe('AdaptedEvent firewall', () => {
  it('NodeRef has __brand marker', () => {
    // Compile-time check passes — runtime confirms the file loads
    expect(true).toBe(true);
  });

  it('AdaptedEvent question has no code property', () => {
    const ev: AdaptedEvent = {
      kind: 'question',
      ref: {} as NodeRef,
      dataType: 'string',
      controlType: 'input',
      appearance: null,
      label: 'Q1',
      hint: null,
      index: 0,
      rangeBounds: null,
      mediatype: null,
    };
    expect('code' in ev).toBe(false);
  });

  it('AdaptedEvent bof has no ref property', () => {
    const ev: AdaptedEvent = { kind: 'bof' };
    expect('ref' in ev).toBe(false);
  });
});
