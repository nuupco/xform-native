/**
 * makeFakeSession — scripted FAKE FormSession for adapter + store tests.
 *
 * ADR-4: Provides a minimal stub implementing the shape the adapter consumes
 * (navigator + evaluator + tree) without any real XForm parsing.
 *
 * The script drives a linear sequence of events. stepping forward/backward
 * advances/retreats the internal cursor index.
 */
import type { FormSession } from '@nuup/ts-rosa';
import type { NodeState, SelectChoice, AnswerResult, DataType } from '@nuup/ts-rosa';
import type { ControlType } from '@nuup/ts-rosa';
export type ScriptEventBof = {
    kind: 'bof';
};
export type ScriptEventEof = {
    kind: 'eof';
};
/**
 * Fake ancestor-chain metadata (Phase 7 decision 15) — root→leaf order,
 * one entry per ancestor `group`/`repeat`. Optional on every non-bof/eof
 * script event. Powers the fake navigator's `resolvePath` so
 * `createAdapter.getCurrentPath()` (and the corrected group/repeat label
 * read) can be exercised without a real XForm.
 *
 * Caveat: `countRepeatInstances` (used by `getCurrentPath()` to compute a
 * repeat ancestor's `total`) is the REAL ts-rosa function operating on the
 * fake's (flat, single-level) tree — it will not find nested instances for
 * a fake `repeat` ancestor, so `total` for a fake repeat ancestor is
 * whatever that real function finds against the fake tree (typically 0)
 * unless the test also builds a matching tree. Tests needing a real,
 * dynamic repeat `total` should use the real engine instead.
 */
export type FakeAncestor = {
    kind: 'group';
    ref: string;
    label: string | null;
} | {
    kind: 'repeat';
    ref: string;
    label: string | null;
    countExpr?: string | null;
};
export type ScriptEventQuestion = {
    kind: 'question';
    ref: string;
    dataType: DataType;
    controlType: ControlType;
    label: string | null;
    hint: string | null;
    appearance: string | null;
    ancestors?: readonly FakeAncestor[];
    /** Keyed by media form ('image' | 'audio' | 'video' | 'big-image'). */
    labelMediaUri?: Record<string, string | null>;
};
export type ScriptEventGroup = {
    kind: 'group';
    ref: string;
    label: string | null;
    hint: string | null;
    appearance?: string | null;
    ancestors?: readonly FakeAncestor[];
};
export type ScriptEventRepeat = {
    kind: 'repeat';
    ref: string;
    label: string | null;
    multiplicity: number;
    ancestors?: readonly FakeAncestor[];
};
export type ScriptEventPromptNewRepeat = {
    kind: 'prompt-new-repeat';
    ref: string;
    label: string | null;
    ancestors?: readonly FakeAncestor[];
};
export type ScriptEvent = ScriptEventBof | ScriptEventEof | ScriptEventQuestion | ScriptEventGroup | ScriptEventRepeat | ScriptEventPromptNewRepeat;
export interface FakeSessionScript {
    events: readonly ScriptEvent[];
    nodeStates: Record<string, NodeState>;
    relevance: Record<string, boolean>;
    choices: Record<string, readonly SelectChoice[]>;
    /** AnswerResult to return per ref string */
    answerResults: Record<string, AnswerResult>;
    /** Values to return via resolveReference per ref string */
    values: Record<string, unknown>;
}
export declare function makeFakeSession(script: FakeSessionScript): FormSession;
//# sourceMappingURL=makeFakeSession.d.ts.map