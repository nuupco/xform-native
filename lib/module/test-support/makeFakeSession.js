"use strict";

/**
 * makeFakeSession — scripted FAKE FormSession for adapter + store tests.
 *
 * ADR-4: Provides a minimal stub implementing the shape the adapter consumes
 * (navigator + evaluator + tree) without any real XForm parsing.
 *
 * The script drives a linear sequence of events. stepping forward/backward
 * advances/retreats the internal cursor index.
 */

import { atIndex, beginningOfForm, endOfForm } from '@nuup/ts-rosa';
import { encodeAnswer } from "../adapter/encodeAnswer.js";

// ---------------------------------------------------------------------------
// Script event types — plain data, not ts-rosa FormEntryEvent
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Minimal TreeReference builder from XPath string
// ---------------------------------------------------------------------------

function parseXPath(xpath) {
  // Parse a simple absolute XPath like /data/name or /data/items[1]
  const levels = xpath.split('/').filter(Boolean).map(segment => {
    const match = segment.match(/^([^\[]+)(?:\[(\d+)\])?$/);
    const name = match?.[1] ?? segment;
    const multStr = match?.[2];
    const mult = multStr !== undefined ? parseInt(multStr, 10) - 1 : 0;
    return {
      name,
      mult
    };
  });

  // Build a TreeReference that matches ts-rosa's structure.
  // We use a minimal frozen object that satisfies TreeReference shape.
  return Object.freeze({
    refLevel: 0,
    contextType: 0,
    instanceName: null,
    levels: Object.freeze(levels.map(l => Object.freeze({
      name: l.name,
      multiplicity: l.mult,
      isAttribute: false
    })))
  });
}

// ---------------------------------------------------------------------------
// Fake InstanceNode + InstanceTree built from script values
// ---------------------------------------------------------------------------

/**
 * True when a value already has the AnswerValue shape ({kind, value,
 * displayText}) — tests may pass these directly instead of raw primitives.
 */
function isAnswerValueShaped(v) {
  return v !== null && typeof v === 'object' && 'kind' in v && 'value' in v;
}
function makeLeafNode(name, value, dataType) {
  const node = {
    name,
    multiplicity: 0,
    value: value,
    children: [],
    attributes: new Map(),
    dataType,
    parent: null
  };
  return node;
}
function buildFakeTree(values, dataTypeByXPath) {
  const root = {
    name: 'data',
    multiplicity: 0,
    value: null,
    children: [],
    attributes: new Map(),
    dataType: 'string',
    parent: null
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
  return {
    root,
    name: null
  };
}

// ---------------------------------------------------------------------------
// Build fake FormIndex objects for each script event
// ---------------------------------------------------------------------------

function makeFormIndex(event, _position) {
  if (event.kind === 'bof') return beginningOfForm;
  if (event.kind === 'eof') return endOfForm;
  const ref = parseXPath(event.ref);
  const levels = ref.levels;
  // For repeat events, use the script event's multiplicity on the last path level
  const scriptMultiplicity = event.kind === 'repeat' ? event.multiplicity : undefined;
  const path = levels.map((lvl, i) => {
    const mult = scriptMultiplicity !== undefined && i === levels.length - 1 ? scriptMultiplicity : lvl.multiplicity;
    return {
      elementIndex: mult,
      multiplicity: mult
    };
  });
  return atIndex(path, ref);
}

// ---------------------------------------------------------------------------
// makeFakeSession factory
// ---------------------------------------------------------------------------

export function makeFakeSession(script) {
  const {
    events,
    nodeStates,
    relevance,
    choices,
    answerResults,
    values
  } = script;

  // Pre-build FormIndex for each position
  const formIndices = events.map(makeFormIndex);
  let cursor = 0;

  // Fake navigator
  const navigator = {
    getEvent(idx) {
      const pos = idx !== undefined ? formIndices.indexOf(idx) : cursor;
      const ev = events[pos >= 0 ? pos : cursor];
      if (ev === undefined) return {
        kind: 'end-of-form',
        code: 1,
        index: endOfForm
      };
      if (ev.kind === 'bof') return {
        kind: 'beginning-of-form',
        code: 0,
        index: beginningOfForm
      };
      if (ev.kind === 'eof') return {
        kind: 'end-of-form',
        code: 1,
        index: endOfForm
      };
      const fi = formIndices[pos >= 0 ? pos : cursor];
      if (ev.kind === 'question') return {
        kind: 'question',
        code: 4,
        index: fi
      };
      if (ev.kind === 'group') return {
        kind: 'group',
        code: 8,
        index: fi
      };
      if (ev.kind === 'repeat') return {
        kind: 'repeat',
        code: 16,
        index: fi
      };
      if (ev.kind === 'prompt-new-repeat') return {
        kind: 'prompt-new-repeat',
        code: 2,
        index: fi
      };
      return {
        kind: 'end-of-form',
        code: 1,
        index: endOfForm
      };
    },
    stepToNextEvent() {
      if (cursor < events.length - 1) cursor++;
      return navigator.getEvent();
    },
    stepToPreviousEvent() {
      if (cursor > 0) cursor--;
      return navigator.getEvent();
    },
    jumpToIndex(idx) {
      const pos = formIndices.indexOf(idx);
      if (pos >= 0) cursor = pos;
      return navigator.getEvent();
    },
    getQuestionAtIndex(idx) {
      const pos = idx !== undefined ? formIndices.indexOf(idx) : cursor;
      const ev = events[pos >= 0 ? pos : cursor];
      if (ev === undefined) return null;
      if (ev.kind === 'bof' || ev.kind === 'eof') return null;
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
          getLabelMediaUri: form => q.labelMediaUri?.[form] ?? null
        };
      }
      // Phase 7 decision 4/15: mirror the real ts-rosa engine's
      // getQuestionAtIndex, which returns null for a group/repeat/
      // prompt-new-repeat leaf (`resolved.element.kind !== "question"` ⇒
      // null). Non-question labels must be read via resolvePath instead —
      // see below. Previously this branch faked a label for non-question
      // events, which is exactly how the container-label bug survived
      // undetected in the test suite (design "LATENT BUG" finding).
      return null;
    },
    // Phase 7 decision 15: minimal resolvePath support so
    // createAdapter's corrected group/repeat label read
    // (`resolvePath(fi.path)?.element.labelText`) and `getCurrentPath()`
    // have something real to call against the fake.
    //
    // Simplification: rather than walking a real FormDefinition.body by
    // elementIndex (the fake has none), this resolves relative to the
    // CURRENT cursor position's script event and its declared `ancestors`
    // metadata (root→leaf), keyed by `path.length` rather than by content
    // identity. This holds because createAdapter only ever calls
    // `resolvePath` with the current event's own `fi.path`, or a prefix
    // slice of that same array, within a single call — never with an
    // unrelated FormIndex's path.
    resolvePath(path) {
      const ev = events[cursor];
      if (ev === undefined || ev.kind === 'bof' || ev.kind === 'eof') return null;
      const ancestors = 'ancestors' in ev && ev.ancestors ? ev.ancestors : [];

      // `fi.path`'s actual length is derived from parseXPath(ev.ref), which
      // (unlike a real FormDefinition.body walk) includes every XPath
      // segment, including the leading instance-root segment (e.g. 'data').
      // `ancestors.length + 1` (ancestors + leaf) is therefore usually
      // SHORTER than the real `fi.path` for this event by that fixed
      // `offset`. Compute the offset once from the current event's own
      // full path so ancestor-prefix lookups (`path.length < full`) still
      // align correctly regardless of how many leading segments the ref
      // string happens to carry.
      const fullPath = formIndices[cursor];
      const fullLength = fullPath !== undefined && fullPath.kind === 'at' ? fullPath.path.length : ancestors.length + 1;
      const offset = fullLength - (ancestors.length + 1);
      if (path.length > fullLength || path.length < 1) return null;
      const toElement = a => ({
        kind: a.kind,
        labelText: a.label,
        countExpr: a.kind === 'repeat' ? a.countExpr ?? null : null
      });
      if (path.length === fullLength) {
        const leafElement = ev.kind === 'question' ? {
          kind: 'question',
          labelText: ev.label,
          countExpr: null
        } : ev.kind === 'group' ? {
          kind: 'group',
          labelText: ev.label,
          countExpr: null,
          appearance: ev.appearance ?? null
        } : {
          kind: 'repeat',
          labelText: ev.label,
          countExpr: null
        };
        return {
          element: leafElement,
          parentChain: ancestors.map(toElement),
          ref: parseXPath(ev.ref)
        };
      }
      const idx = path.length - 1 - offset;
      const ancestor = ancestors[idx];
      if (ancestor === undefined) return null;
      return {
        element: toElement(ancestor),
        parentChain: ancestors.slice(0, idx).map(toElement),
        ref: parseXPath(ancestor.ref)
      };
    }
  };

  // Fake evaluator
  const evaluator = {
    getNodeState(ref) {
      const key = refKey(ref);
      return nodeStates[key];
    },
    isEffectivelyRelevant(ref) {
      const key = refKey(ref);
      return relevance[key] ?? true;
    },
    getChoices(ref) {
      const key = refKey(ref);
      return choices[key] ?? [];
    },
    answerQuestion(ref, value) {
      const key = refKey(ref);
      // Write the (already-encoded, per REQ-4/ADR-D-A6) value back into the
      // fake tree so resolveValue/decode-path assertions exercise the same
      // contract as the real ts-rosa FormEvaluator's storage. The adapter
      // always calls this with an AnswerValue | null (encoded upstream by
      // createAdapter.answerQuestion), never a raw primitive.
      const node = findNodeByKey(tree, key);
      if (node !== null) {
        node.value = value;
      }
      // Return scripted result, default to AnswerResult.OK (value 0)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return answerResults[key] ?? 'OK';
    }
  };

  // Build the xpath -> DataType map from question script events, so the
  // fake tree's nodes carry a real dataType (ADR-D-A6) — required for
  // createAdapter.answerQuestion's internal DataType derivation to work
  // under the fake exactly as it does against the real engine.
  const dataTypeByXPath = {};
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
    definition: null,
    tree: tree,
    evaluator: evaluator,
    navigator: navigator,
    serializeToXml: () => '',
    finalize: () => {}
  };
}

// ---------------------------------------------------------------------------
// Helper: derive a string key from a TreeReference
// ---------------------------------------------------------------------------

function refKey(ref) {
  if (!ref.levels || ref.levels.length === 0) return '/';
  return '/' + ref.levels.map(l => l.name).join('/');
}

/**
 * Find the fake tree's leaf node matching a ref key ('/data/name' style).
 * The fake tree is single-level (buildFakeTree only builds direct children
 * of root, keyed by the leaf segment) — mirrors that structure here.
 */
function findNodeByKey(tree, key) {
  const segments = key.split('/').filter(Boolean);
  const leafName = segments[segments.length - 1];
  if (leafName === undefined) return null;
  return tree.root.children.find(c => c.name === leafName) ?? null;
}
//# sourceMappingURL=makeFakeSession.js.map