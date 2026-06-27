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

// ---------------------------------------------------------------------------
// Script event types — plain data, not ts-rosa FormEntryEvent
// ---------------------------------------------------------------------------

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

function makeLeafNode(name, value) {
  return {
    name,
    multiplicity: 0,
    value: value,
    children: []
  };
}
function buildFakeTree(values) {
  const root = {
    name: 'data',
    multiplicity: 0,
    value: null,
    children: []
  };
  for (const [xpath, val] of Object.entries(values)) {
    const segments = xpath.split('/').filter(Boolean);
    // For simplicity, build single-level children under root
    const leafName = segments[segments.length - 1] ?? xpath;
    root.children.push(makeLeafNode(leafName, val));
  }
  return {
    root
  };
}

// ---------------------------------------------------------------------------
// Build fake FormIndex objects for each script event
// ---------------------------------------------------------------------------

function makeFormIndex(event, position) {
  if (event.kind === 'bof') return beginningOfForm;
  if (event.kind === 'eof') return endOfForm;
  const ref = parseXPath(event.ref);
  // Build a simple path with one level
  const path = ref.levels.map(lvl => ({
    elementIndex: lvl.multiplicity,
    instanceIndex: lvl.multiplicity
  }));
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
      if (ev === undefined || ev.kind !== 'question') return null;
      const q = ev;
      return {
        getLabelInnerText: () => q.label,
        getControlType: () => q.controlType,
        getDataType: () => q.dataType
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
    answerQuestion(ref, _value) {
      const key = refKey(ref);
      // Return scripted result, default to AnswerResult.OK (value 0)
      return answerResults[key] ?? 0;
    }
  };

  // Build a fake tree that resolveReference can walk
  const tree = buildFakeTree(values);

  // Override resolveReference to return values directly
  // We patch the tree so the real resolveReference can find nodes.
  // The root has children named by the leaf segment of each xpath value.

  return {
    definition: null,
    tree: tree,
    evaluator: evaluator,
    navigator: navigator,
    serializeToXml: () => ''
  };
}

// ---------------------------------------------------------------------------
// Helper: derive a string key from a TreeReference
// ---------------------------------------------------------------------------

function refKey(ref) {
  if (!ref.levels || ref.levels.length === 0) return '/';
  return '/' + ref.levels.map(l => l.name).join('/');
}
//# sourceMappingURL=makeFakeSession.js.map