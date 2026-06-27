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
export type ScriptEventQuestion = {
    kind: 'question';
    ref: string;
    dataType: DataType;
    controlType: ControlType;
    label: string | null;
    hint: string | null;
    appearance: string | null;
};
export type ScriptEventGroup = {
    kind: 'group';
    ref: string;
    label: string | null;
    hint: string | null;
};
export type ScriptEventRepeat = {
    kind: 'repeat';
    ref: string;
    label: string | null;
    multiplicity: number;
};
export type ScriptEventPromptNewRepeat = {
    kind: 'prompt-new-repeat';
    ref: string;
    label: string | null;
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