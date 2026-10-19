/**
 * FormSessionStore — reactive wrapper around FormAdapter.
 *
 * ADR-1: getSnapshot() returns thin { version: number } only.
 * REQ-01..REQ-05.
 *
 * Referential identity contract (REQ-03):
 *   - Same frozen object reference returned between mutations.
 *   - NEW frozen object created on each version bump.
 *
 * Slice C addendum: serializeToXml() is an additive passthrough to the
 * underlying session, ratified to support host apps (e.g. draft save /
 * finalize) without exposing the raw FormSession across the firewall.
 */
import type { FormSession, AnswerResult } from '@nuup/ts-rosa';
import type { FormAdapter, NodeRef } from '../adapter/FormAdapter.js';
import type { MediaResolver } from '../createFormStore.js';
export interface FormSessionSnapshot {
    readonly version: number;
}
export declare class FormSessionStore {
    /** Expose adapter for test access (getRef from getCurrentEvent) */
    readonly adapter: FormAdapter;
    /** Host fetch seam for `jr://` question-label media (e.g. image-map's SVG). */
    readonly mediaResolver: MediaResolver | undefined;
    /** Last answerQuestion result (for Form-level validation feedback). */
    lastAnswerResult: {
        ref: NodeRef;
        result: AnswerResult;
    } | null;
    /**
     * Bug 2 fix (field-list-nav-and-constraints): per-field-ref-keyed answer
     * results, alongside (not replacing) `lastAnswerResult` above.
     * `lastAnswerResult` is a single global scalar overwritten on every
     * `answerQuestion` call — fine for the single-question-at-a-time advance
     * validator AND for Form.tsx's progress-tracking effect (a DIFFERENT use,
     * left untouched), but a field-list group's batch-validate loop
     * (`handleNext`) checks EVERY field in the group in one pass, so only the
     * single most-recently-committed field anywhere in the whole session
     * could ever match `lastAnswerResult.ref === event.ref` — every other
     * field's own CONSTRAINT_VIOLATED result was silently unreachable.
     * `getLastAnswerResult` below looks up each field by its OWN ref instead.
     */
    private readonly _lastAnswerResultByRef;
    private _snapshot;
    private readonly _subscribers;
    private readonly _session;
    constructor(session: FormSession, mediaResolver?: MediaResolver);
    subscribe(cb: () => void): () => void;
    getSnapshot(): FormSessionSnapshot;
    answerQuestion(ref: NodeRef, value: unknown): AnswerResult;
    /**
     * This field's own last `answerQuestion` result, keyed by ref (not "the
     * single last field edited anywhere") — see `_lastAnswerResultByRef`'s
     * doc comment. Used by `defaultAdvanceValidator`'s field-list batch pass.
     */
    getLastAnswerResult(ref: NodeRef): {
        ref: NodeRef;
        result: AnswerResult;
    } | null;
    stepForward(): void;
    stepBackward(): void;
    jumpToIndex(index: number): void;
    /**
     * Manually create a new repeat instance at `ref` (Slice D). Delegates to
     * the adapter then bumps — consistent with the every-mutation-bumps
     * contract shared by answerQuestion/stepForward/etc.
     */
    createRepeatInstance(ref: NodeRef): void;
    /**
     * Delete an existing repeat instance at `ref` (Slice E — field-list
     * embedded repeats). Same delegate-then-bump pattern as
     * `createRepeatInstance`.
     */
    removeRepeatInstance(ref: NodeRef): void;
    /**
     * Inject a batch of values (inject-values group appearance — Form.tsx's
     * `planInjectValues`/`handleInjectValuesSubmit`) in one commit. Calls
     * `adapter.answerQuestion` directly per entry — NOT `this.answerQuestion`,
     * which would `_bump()` (and therefore re-render) once per field — then
     * bumps exactly once for the whole batch, same "one bump per batch, not
     * per field" reasoning as `createRepeatInstance`'s doc comment references
     * for the field-list case. `lastAnswerResult` ends up reflecting only the
     * LAST entry — the same single-scalar limitation Form.tsx's field-list
     * `handleNext` branch already documents and works around by reading
     * `resolveValue` directly instead of relying on `lastAnswerResult`.
     */
    injectValues(entries: readonly {
        ref: NodeRef;
        value: unknown;
    }[]): void;
    /**
     * Trigger a re-render after an out-of-band mutation (background sync, host app
     * mutating the session/adapter directly). Bumps version + notifies subscribers,
     * preserving the REQ-03 referential-identity contract (new frozen snapshot).
     */
    notifyExternalMutation(): void;
    /** Additive passthrough — delegates to the underlying session (Slice C). */
    serializeToXml(): string;
    /**
     * Re-resolves finalize-time preloads (e.g. `end` timestamp) and re-runs the
     * calculate cascade, mirroring JavaRosa's FormDef#postProcessInstance. Must
     * be called before serializeToXml() at submission time — ts-rosa does not
     * trigger this on its own.
     */
    finalize(): void;
    private _bump;
}
//# sourceMappingURL=FormSessionStore.d.ts.map