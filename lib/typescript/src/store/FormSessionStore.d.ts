/**
 * FormSessionStore — reactive wrapper around FormAdapter.
 *
 * ADR-1: getSnapshot() returns thin { version: number } only.
 * REQ-01..REQ-05.
 *
 * Referential identity contract (REQ-03):
 *   - Same frozen object reference returned between mutations.
 *   - NEW frozen object created on each version bump.
 */
import type { FormSession, AnswerResult } from '@nuup/ts-rosa';
import type { FormAdapter, NodeRef } from '../adapter/FormAdapter.js';
export interface FormSessionSnapshot {
    readonly version: number;
}
export declare class FormSessionStore {
    /** Expose adapter for test access (getRef from getCurrentEvent) */
    readonly adapter: FormAdapter;
    /** Last answerQuestion result (for Form-level validation feedback). */
    lastAnswerResult: {
        ref: NodeRef;
        result: AnswerResult;
    } | null;
    private _snapshot;
    private readonly _subscribers;
    constructor(session: FormSession);
    subscribe(cb: () => void): () => void;
    getSnapshot(): FormSessionSnapshot;
    answerQuestion(ref: NodeRef, value: unknown): AnswerResult;
    stepForward(): void;
    stepBackward(): void;
    jumpToIndex(index: number): void;
    private _bump;
}
//# sourceMappingURL=FormSessionStore.d.ts.map