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
import type { TreeReference } from '@nuup/ts-rosa';
import type { FormIndex, AtFormIndex, FormIndexLevel } from '@nuup/ts-rosa';
import { atIndex, beginningOfForm, endOfForm } from '@nuup/ts-rosa';
import type { FormEntryEvent } from '@nuup/ts-rosa';
import type { InstanceTree, InstanceNode } from '@nuup/ts-rosa';
import { encodeAnswer } from '../adapter/encodeAnswer';

// ---------------------------------------------------------------------------
// Script event types — plain data, not ts-rosa FormEntryEvent
// ---------------------------------------------------------------------------

export type ScriptEventBof = { kind: 'bof' };
export type ScriptEventEof = { kind: 'eof' };
export type ScriptEventQuestion = {
  kind: 'question';
  ref: string; // XPath string for the ref
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

export type ScriptEvent =
  | ScriptEventBof
  | ScriptEventEof
  | ScriptEventQuestion
  | ScriptEventGroup
  | ScriptEventRepeat
  | ScriptEventPromptNewRepeat;

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

// ---------------------------------------------------------------------------
// Minimal TreeReference builder from XPath string
// ---------------------------------------------------------------------------

function parseXPath(xpath: string): TreeReference {
  // Parse a simple absolute XPath like /data/name or /data/items[1]
  const levels = xpath
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      const match = segment.match(/^([^\[]+)(?:\[(\d+)\])?$/);
      const name = match?.[1] ?? segment;
      const multStr = match?.[2];
      const mult = multStr !== undefined ? parseInt(multStr, 10) - 1 : 0;
      return { name, mult };
    });

  // Build a TreeReference that matches ts-rosa's structure.
  // We use a minimal frozen object that satisfies TreeReference shape.
  return Object.freeze({
    refLevel: 0,
    contextType: 0,
    instanceName: null,
    levels: Object.freeze(
      levels.map((l) =>
        Object.freeze({
          name: l.name,
          multiplicity: l.mult,
          isAttribute: false,
        }),
      ),
    ),
  }) as unknown as TreeReference;
}

// ---------------------------------------------------------------------------
// Fake InstanceNode + InstanceTree built from script values
// ---------------------------------------------------------------------------

/**
 * True when a value already has the AnswerValue shape ({kind, value,
 * displayText}) — tests may pass these directly instead of raw primitives.
 */
function isAnswerValueShaped(v: unknown): boolean {
  return (
    v !== null &&
    typeof v === 'object' &&
    'kind' in (v as object) &&
    'value' in (v as object)
  );
}

function makeLeafNode(name: string, value: unknown, dataType: DataType): InstanceNode {
  const node: InstanceNode = {
    name,
    multiplicity: 0,
    value: value as null,
    children: [],
    attributes: new Map(),
    dataType,
    parent: null,
  };
  return node;
}

function buildFakeTree(
  values: Record<string, unknown>,
  dataTypeByXPath: Record<string, DataType>,
): InstanceTree {
  const root: InstanceNode = {
    name: 'data',
    multiplicity: 0,
    value: null,
    children: [],
    attributes: new Map(),
    dataType: 'string',
    parent: null,
  };

  for (const [xpath, val] of Object.entries(values)) {
    const segments = xpath.split('/').filter(Boolean);
    // For simplicity, build single-level children under root
    const leafName = segments[segments.length - 1] ?? xpath;
    const dataType = dataTypeByXPath[xpath] ?? 'string';
    // Auto-encode raw primitives to AnswerValue shape (ADR-D-A6), so the
    // fake models the real ts-rosa engine's tree storage. Tests may also
    // pass an already-AnswerValue-shaped object directly.
    const encoded = isAnswerValueShaped(val) ? val : encodeAnswer(dataType, val);
    const child = makeLeafNode(leafName, encoded, dataType);
    child.parent = root;
    root.children.push(child);
  }

  return { root, name: null };
}

// ---------------------------------------------------------------------------
// Build fake FormIndex objects for each script event
// ---------------------------------------------------------------------------

function makeFormIndex(event: ScriptEvent, _position: number): FormIndex {
  if (event.kind === 'bof') return beginningOfForm;
  if (event.kind === 'eof') return endOfForm;

  const ref = parseXPath(event.ref);
  const levels = ref.levels as ReadonlyArray<{ name: string; multiplicity: number }>;
  // For repeat events, use the script event's multiplicity on the last path level
  const scriptMultiplicity = event.kind === 'repeat' ? event.multiplicity : undefined;
  const path: FormIndexLevel[] = levels.map((lvl, i) => {
    const mult =
      scriptMultiplicity !== undefined && i === levels.length - 1
        ? scriptMultiplicity
        : lvl.multiplicity;
    return { elementIndex: mult, multiplicity: mult };
  });

  return atIndex(path, ref) as AtFormIndex;
}

// ---------------------------------------------------------------------------
// makeFakeSession factory
// ---------------------------------------------------------------------------

export function makeFakeSession(script: FakeSessionScript): FormSession {
  const { events, nodeStates, relevance, choices, answerResults, values } = script;

  // Pre-build FormIndex for each position
  const formIndices: FormIndex[] = events.map(makeFormIndex);

  let cursor = 0;

  // Fake navigator
  const navigator = {
    getEvent(idx?: FormIndex): FormEntryEvent {
      const pos = idx !== undefined ? formIndices.indexOf(idx) : cursor;
      const ev = events[pos >= 0 ? pos : cursor];
      if (ev === undefined) return { kind: 'end-of-form', code: 1, index: endOfForm };

      if (ev.kind === 'bof') return { kind: 'beginning-of-form', code: 0, index: beginningOfForm };
      if (ev.kind === 'eof') return { kind: 'end-of-form', code: 1, index: endOfForm };

      const fi = formIndices[pos >= 0 ? pos : cursor] as AtFormIndex;

      if (ev.kind === 'question') return { kind: 'question', code: 4, index: fi };
      if (ev.kind === 'group') return { kind: 'group', code: 8, index: fi };
      if (ev.kind === 'repeat') return { kind: 'repeat', code: 16, index: fi };
      if (ev.kind === 'prompt-new-repeat') return { kind: 'prompt-new-repeat', code: 2, index: fi };

      return { kind: 'end-of-form', code: 1, index: endOfForm };
    },

    stepToNextEvent(): FormEntryEvent {
      if (cursor < events.length - 1) cursor++;
      return navigator.getEvent();
    },

    stepToPreviousEvent(): FormEntryEvent {
      if (cursor > 0) cursor--;
      return navigator.getEvent();
    },

    jumpToIndex(idx: FormIndex): FormEntryEvent {
      const pos = formIndices.indexOf(idx);
      if (pos >= 0) cursor = pos;
      return navigator.getEvent();
    },

      getQuestionAtIndex(
      idx?: FormIndex,
    ): {
      getLabelInnerText(): string | null;
      getControlType(): string;
      getDataType(): DataType | null;
      getHintText(): string | null;
      getRangeBounds(): { start?: number; end?: number; step?: number } | null;
      getAppearance(): string | null;
      getMediatype(): string | null;
      getQuestionText(): string | null;
      getSubstitutedHintText(): string | null;
    } | null {
      const pos = idx !== undefined ? formIndices.indexOf(idx) : cursor;
      const ev = events[pos >= 0 ? pos : cursor];
      if (ev === undefined) return null;
      if (ev.kind === 'bof' || ev.kind === 'eof') return null;
      // For non-question events, return label from the script event (test-only)
      const label = 'label' in ev ? ev.label : null;
      if (ev.kind === 'question') {
        const q = ev;
        return {
          getLabelInnerText: () => q.label,
          getControlType: () => q.controlType,
          getDataType: () => q.dataType,
          getHintText: () => q.hint,
          getRangeBounds: () => null,
          getAppearance: () => q.appearance,
          getMediatype: () => null,
          // Fake scripts supply the final label/hint directly (no <output>
          // template modeling), so the "resolved" reader returns the same
          // value as the raw one — real ts-rosa is what actually resolves
          // <output> substitutions.
          getQuestionText: () => q.label,
          getSubstitutedHintText: () => q.hint,
        };
      }
      return {
        getLabelInnerText: () => label as string | null,
        getControlType: () => 'input',
        getDataType: () => null,
        getHintText: () => null,
        getRangeBounds: () => null,
        getAppearance: () => null,
        getMediatype: () => null,
        getQuestionText: () => label as string | null,
        getSubstitutedHintText: () => null,
      };
    },
  };

  // Fake evaluator
  const evaluator = {
    getNodeState(ref: TreeReference): NodeState | undefined {
      const key = refKey(ref);
      return nodeStates[key];
    },

    isEffectivelyRelevant(ref: TreeReference): boolean {
      const key = refKey(ref);
      return relevance[key] ?? true;
    },

    getChoices(ref: TreeReference): readonly SelectChoice[] {
      const key = refKey(ref);
      return choices[key] ?? [];
    },

    answerQuestion(ref: TreeReference, value: unknown): AnswerResult {
      const key = refKey(ref);
      // Write the (already-encoded, per REQ-4/ADR-D-A6) value back into the
      // fake tree so resolveValue/decode-path assertions exercise the same
      // contract as the real ts-rosa FormEvaluator's storage. The adapter
      // always calls this with an AnswerValue | null (encoded upstream by
      // createAdapter.answerQuestion), never a raw primitive.
      const node = findNodeByKey(tree, key);
      if (node !== null) {
        node.value = value as null;
      }
      // Return scripted result, default to AnswerResult.OK (value 0)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return answerResults[key] ?? ('OK' as AnswerResult);
    },
  };

  // Build the xpath -> DataType map from question script events, so the
  // fake tree's nodes carry a real dataType (ADR-D-A6) — required for
  // createAdapter.answerQuestion's internal DataType derivation to work
  // under the fake exactly as it does against the real engine.
  const dataTypeByXPath: Record<string, DataType> = {};
  for (const ev of events) {
    if (ev.kind === 'question') {
      dataTypeByXPath[ev.ref] = ev.dataType;
    }
  }

  // Build a fake tree that resolveReference can walk
  const tree = buildFakeTree(values, dataTypeByXPath);

  // Override resolveReference to return values directly
  // We patch the tree so the real resolveReference can find nodes.
  // The root has children named by the leaf segment of each xpath value.

  return {
    definition: null as never,
    tree: tree as InstanceTree,
    evaluator: evaluator as never,
    navigator: navigator as never,
    serializeToXml: () => '',
  };
}

// ---------------------------------------------------------------------------
// Helper: derive a string key from a TreeReference
// ---------------------------------------------------------------------------

function refKey(ref: TreeReference): string {
  if (!ref.levels || ref.levels.length === 0) return '/';
  return '/' + ref.levels.map((l: { name: string }) => l.name).join('/');
}

/**
 * Find the fake tree's leaf node matching a ref key ('/data/name' style).
 * The fake tree is single-level (buildFakeTree only builds direct children
 * of root, keyed by the leaf segment) — mirrors that structure here.
 */
function findNodeByKey(tree: InstanceTree, key: string): InstanceNode | null {
  const segments = key.split('/').filter(Boolean);
  const leafName = segments[segments.length - 1];
  if (leafName === undefined) return null;
  return tree.root.children.find((c) => c.name === leafName) ?? null;
}
