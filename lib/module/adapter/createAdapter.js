"use strict";

/**
 * createAdapter — factory wiring navigator/evaluator/tree into a FormAdapter.
 *
 * ADR-2: this is the SOLE translation layer. FormEntryEvent / FormIndex /
 * FormElement never cross into the public AdaptedEvent surface.
 *
 * ADR-2 GAP #2 (jumpToIndex): adapter maintains an internal array-cache of
 * visited FormIndex objects. jumpToIndex(n) resolves to navigator.jumpToIndex(cache[n]),
 * restricted to visited positions; throws RangeError on out-of-range.
 */

import { isAt, isBof, isEof } from '@nuup/ts-rosa';
import { resolveReference, addRepeatInstance, removeRepeatInstance as tsRosaRemoveRepeatInstance, countRepeatInstances, genericize, parseAbsoluteRef, refToString, AnswerResult } from '@nuup/ts-rosa';
import { encodeAnswer } from "./encodeAnswer.js";
export function createAdapter(session) {
  const {
    navigator,
    evaluator,
    tree
  } = session;

  // Visited-index cache: parallel to the adapter's numeric step counter.
  // Position 0 is always the starting index (captured immediately).
  const visitedCache = [navigator.getEvent().index];
  let stepCount = 0; // numeric position in visitedCache

  // ---------------------------------------------------------------------------
  // Internal: translate the raw FormEntryEvent + navigator into AdaptedEvent
  // ---------------------------------------------------------------------------
  function adaptCurrentEvent() {
    const ev = navigator.getEvent();
    let adapted;
    if (ev.kind === 'beginning-of-form' || isBof(ev.index)) {
      adapted = {
        kind: 'bof'
      };
      return adapted;
    }
    if (ev.kind === 'end-of-form' || isEof(ev.index)) {
      adapted = {
        kind: 'eof'
      };
      return adapted;
    }
    if (!isAt(ev.index)) {
      adapted = {
        kind: 'eof'
      };
      return adapted;
    }
    const fi = ev.index;
    const ref = fi.ref;
    if (ev.kind === 'question') {
      const q = navigator.getQuestionAtIndex(fi);
      adapted = {
        kind: 'question',
        ref,
        dataType: q?.getDataType() ?? 'string',
        controlType: q?.getControlType() ?? 'input',
        appearance: q?.getAppearance?.() ?? null,
        // getQuestionText()/getSubstitutedHintText() resolve itext +
        // evaluate any <output> against the current instance.
        // getLabelInnerText()/getHintText() are the RAW ${n}-placeholder
        // templates, unresolved — using them leaks literal "${0}" into the UI.
        label: q?.getQuestionText() ?? null,
        hint: q?.getSubstitutedHintText?.() ?? null,
        index: stepCount,
        rangeBounds: q?.getRangeBounds?.() ?? null,
        mediatype: q?.getMediatype?.() ?? null
      };
      return adapted;
    }

    // group / repeat / prompt-new-repeat label resolution (Phase 7 decision
    // 4): navigator.getQuestionAtIndex(fi)?.getLabelInnerText() is WRONG
    // here — real ts-rosa's getQuestionAtIndex (index.cjs:9661-9666) does
    // `if (resolved.element.kind !== "question") return null`, so it
    // unconditionally returns null for a group/repeat/prompt-new-repeat
    // leaf. AdaptedEvent.label was therefore ALWAYS null for these kinds
    // against the real engine (only the test fixture faked otherwise — the
    // same class of "raw vs resolved" defect as
    // adapter-label-output-substitution.test.ts, in reverse). Read the
    // label via resolvePath's leaf FormElement instead, which carries
    // `labelText` for every element kind, not just questions.
    if (ev.kind === 'group') {
      const resolved = navigator.resolvePath?.(fi.path);
      // `appearance` only exists on the 'group'/'question' FormElement
      // variants (not 'repeat'), so narrow explicitly rather than reading
      // `.appearance` off the wider union directly (Form.tsx's field-list
      // detection needs this to distinguish a field-list group from a
      // plain one).
      const groupElement = resolved?.element.kind === 'group' ? resolved.element : null;
      adapted = {
        kind: 'group',
        ref,
        label: groupElement?.labelText ?? null,
        hint: null,
        index: stepCount,
        appearance: groupElement?.appearance ?? null
      };
      return adapted;
    }
    if (ev.kind === 'repeat') {
      const resolved = navigator.resolvePath?.(fi.path);
      // multiplicity comes from the last path level
      const lastLevel = fi.path[fi.path.length - 1];
      const multiplicity = lastLevel?.multiplicity ?? 0;
      adapted = {
        kind: 'repeat',
        ref,
        label: resolved?.element.labelText ?? null,
        multiplicity,
        index: stepCount
      };
      return adapted;
    }
    if (ev.kind === 'prompt-new-repeat') {
      const resolved = navigator.resolvePath?.(fi.path);
      adapted = {
        kind: 'prompt-new-repeat',
        ref,
        label: resolved?.element.labelText ?? null,
        index: stepCount
      };
      return adapted;
    }
    adapted = {
      kind: 'eof'
    };
    return adapted;
  }

  // ---------------------------------------------------------------------------
  // getCurrentPath (Phase 7 decisions 1-3, 6, 15): derive the root→leaf
  // ancestor group/repeat chain for the walker's current position.
  //
  // navigator.resolvePath(path) is O(depth) pure array indexing over
  // FormDefinition.body — no XPath eval (index.d.ts:1891-1893) — so calling
  // it once per ancestor (to get that ancestor's own concrete ref, for
  // countRepeatInstances) is cheap for the typical depth-2..4 case this
  // targets (design decision 18).
  // ---------------------------------------------------------------------------
  function buildPath(fi) {
    const resolved = navigator.resolvePath?.(fi.path);
    if (!resolved) return [];
    const segments = [];
    const {
      element,
      parentChain
    } = resolved;
    for (let i = 0; i < parentChain.length; i++) {
      const ancestor = parentChain[i];
      const level = fi.path[i];
      if (ancestor === undefined || level === undefined) continue;
      segments.push(buildSegment(ancestor, level, fi.path.slice(0, i + 1)));
    }

    // The leaf itself becomes the final segment when the walker is sitting
    // ON a group/repeat/prompt-new-repeat event (decision 3) — a
    // prompt-new-repeat leaf resolves to a 'repeat' FormElement, so it is
    // covered by the same `kind === 'repeat'` check. A 'question' leaf is
    // deliberately excluded (already covered as the render target itself).
    if (element.kind === 'group' || element.kind === 'repeat') {
      const leafLevel = fi.path[fi.path.length - 1];
      if (leafLevel !== undefined) {
        segments.push(buildSegment(element, leafLevel, fi.path));
      }
    }
    return segments;
  }
  function buildSegment(element, level, pathToThisLevel) {
    if (element.kind !== 'repeat') {
      return {
        kind: 'group',
        label: element.labelText,
        multiplicity: null,
        total: null,
        countBound: false
      };
    }

    // Resolve this specific ancestor's own concrete ref (truncating the
    // path to this level) so countRepeatInstances can find the live
    // created-instance count. `total` is ALWAYS the live count — never a
    // parse of countExpr (decision 6).
    const resolvedAtThisLevel = navigator.resolvePath?.(pathToThisLevel);
    const total = resolvedAtThisLevel ? countRepeatInstances(tree, resolvedAtThisLevel.ref) : 0;
    return {
      kind: 'repeat',
      label: element.labelText,
      multiplicity: level.multiplicity,
      total,
      countBound: (element.countExpr ?? null) !== null
    };
  }

  // ---------------------------------------------------------------------------
  // validateAll / isComplete — full-form sweep across every concrete repeat
  // instance (not just the default/first one).
  //
  // ts-rosa's evaluator.validate(allNodesets) mirrors JavaRosa's
  // TriggerableDag.validate() faithfully (required/rank/constraint, in that
  // order) but resolves each nodeset with resolveReference, which for an
  // unbound repeat level always picks DEFAULT_MULTIPLICITY (instance 0) —
  // so passing bindings' generic nodesets as-is would silently skip every
  // repeat instance past the first. Instead we expand each binding's generic
  // ref into one concrete ref PER EXISTING INSTANCE first (mirroring
  // resolveAll's own root/rest-levels walk, but building refs instead of
  // resolving nodes), then pass fully concrete nodeset strings through
  // evaluator.validate() so its required/rank/constraint checks (which are
  // not otherwise exposed across the ADR-2 firewall) run per instance.
  // ---------------------------------------------------------------------------
  // Every ACTUAL <repeat> path in the form (generic, unbracketed, e.g.
  // "/data/repeat") — computed once from the immutable body tree. Needed
  // because evaluator.validate()'s constraint lookup keys on the nodeset
  // STRING VERBATIM (constraintBindings.get(nodeset)), matching only the
  // exact literal bind path with no positional predicate anywhere in it.
  // Bracketing a plain scalar/group level (which always has exactly one
  // instance) would silently break that lookup for no benefit, so only
  // real repeat levels get bracketed below.
  // Lazy + memoized: only real sessions (not the FakeSession test double,
  // which never calls validateAll/isComplete) pay for this walk, and only
  // once per adapter lifetime.
  let repeatPathsCache = null;
  function getRepeatPaths() {
    if (repeatPathsCache !== null) return repeatPathsCache;
    const repeatPaths = new Set();
    (function collectRepeatPaths(elements) {
      for (const el of elements) {
        if (el.kind === 'repeat') {
          repeatPaths.add(refToString(el.ref));
          collectRepeatPaths(el.children);
        } else if (el.kind === 'group') {
          collectRepeatPaths(el.children);
        }
      }
    })(session.definition.body);
    repeatPathsCache = repeatPaths;
    return repeatPaths;
  }
  function expandGenericRef(ref) {
    const [firstLevel, ...restLevels] = ref.levels;
    if (firstLevel === undefined) return [ref];
    let prefixes = [[firstLevel]];
    for (const lvl of restLevels) {
      const next = [];
      for (const prefix of prefixes) {
        const probeRef = {
          ...ref,
          levels: [...prefix, lvl]
        };
        const count = countRepeatInstances(tree, probeRef);
        for (let m = 0; m < count; m++) {
          next.push([...prefix, {
            ...lvl,
            multiplicity: m
          }]);
        }
      }
      prefixes = next;
    }
    return prefixes.map(levels => ({
      ...ref,
      levels: Object.freeze(levels)
    }));
  }

  // XPath positions are 1-indexed; TreeReference multiplicities are
  // 0-indexed — mirrors parseAbsoluteRef's own `pos - 1` convention exactly,
  // so this is safe to feed back into evaluator.validate(). Only a level
  // that is an actual <repeat> gets a bracket: bracketing anything else
  // would still resolve correctly (a scalar has exactly one instance) but
  // breaks the constraint dict lookup, which needs the untouched literal
  // bind path (see repeatPaths comment above).
  function levelsToNodesetString(levels) {
    const repeatPaths = getRepeatPaths();
    let genericPath = '';
    const segments = levels.map((lvl, i) => {
      genericPath += '/' + lvl.name;
      return i > 0 && repeatPaths.has(genericPath) ? `${lvl.name}[${lvl.multiplicity + 1}]` : lvl.name;
    });
    return '/' + segments.join('/');
  }
  function collectAllNodesets() {
    const out = [];
    for (const binding of session.definition.bindings.values()) {
      for (const concreteRef of expandGenericRef(binding.ref)) {
        out.push(levelsToNodesetString(concreteRef.levels));
      }
    }
    return out;
  }
  function toValidationFailure(outcome) {
    const concreteRef = parseAbsoluteRef(outcome.failedNodeset);
    const ref = concreteRef;
    const type = outcome.status === AnswerResult.REQUIRED_BUT_EMPTY ? 'required' : outcome.status === AnswerResult.RANK_INVALID ? 'rank' : 'constraint';
    // constraintMsg is a static per-bind string (DataBinding), not runtime
    // NodeState — look it up by the binding's own generic key, not the
    // concrete (possibly bracketed) failedNodeset string.
    const message = type === 'required' ? 'This field is required' : type === 'rank' ? 'Invalid ranking order' : session.definition.bindings.get(refToString(genericize(concreteRef)))?.constraintMsg ?? 'Invalid value';
    return {
      ref,
      type,
      message
    };
  }

  // ---------------------------------------------------------------------------
  // Visited cache management
  // ---------------------------------------------------------------------------
  function recordCurrentIndex() {
    const fi = navigator.getEvent().index;
    // If we're at a position beyond cache length, append
    if (stepCount >= visitedCache.length) {
      visitedCache.push(fi);
    } else {
      // Overwrite (handles backward + then forward branching)
      visitedCache[stepCount] = fi;
    }
  }
  return {
    getCurrentEvent() {
      return adaptCurrentEvent();
    },
    getCurrentPath() {
      const ev = navigator.getEvent();
      if (!isAt(ev.index)) return [];
      return buildPath(ev.index);
    },
    stepForward() {
      navigator.stepToNextEvent();
      stepCount++;
      recordCurrentIndex();
    },
    stepBackward() {
      navigator.stepToPreviousEvent();
      stepCount = Math.max(0, stepCount - 1);
    },
    jumpToIndex(index) {
      const fi = visitedCache[index];
      if (fi === undefined) {
        throw new RangeError(`jumpToIndex(${index}): position not yet visited (cache size: ${visitedCache.length})`);
      }
      navigator.jumpToIndex(fi);
      stepCount = index;
    },
    getNodeState(ref) {
      const state = evaluator.getNodeState(ref);
      if (state === undefined) {
        return {
          relevant: true,
          enabled: true,
          required: false,
          readonly: false,
          constraintMsg: null,
          calculatedValue: null
        };
      }
      return state;
    },
    isEffectivelyRelevant(ref) {
      return evaluator.isEffectivelyRelevant(ref);
    },
    getChoices(ref) {
      return evaluator.getChoices(ref);
    },
    answerQuestion(ref, value) {
      const node = resolveReference(tree, ref);
      // Select bindings carry dataType 'string' at the instance-tree/bind
      // level (JavaRosa convention — same reason pickWidget.ts routes
      // selects by controlType, not dataType). Encoding with the raw
      // instance-node dataType joins a select-multi array into a plain
      // string via toRawString, which cast('string', ...) then stores as a
      // STRING AnswerValue — resolveValue's unwrap returns that string, and
      // Array.isArray() on it is false, so the widget reads "no selections"
      // even though answerQuestion reported OK. Encode select controls with
      // the correct array-aware dataType instead, mirroring pickWidget's
      // "controlType is the source of truth" rule.
      const controlType = navigator.getQuestionAtIndex()?.getControlType();
      const dataType = controlType === 'select1' ? 'selectOne' : controlType === 'select' ? 'selectMulti' : node?.dataType ?? 'string';
      const encoded = encodeAnswer(dataType, value);
      return evaluator.answerQuestion(ref, encoded);
    },
    resolveValue(ref) {
      const node = resolveReference(tree, ref);
      const value = node?.value ?? null;
      // Unwrap AnswerValue objects returned by the real engine so widgets
      // receive raw primitives (string | number | boolean | Date | string[]).
      if (value !== null && typeof value === 'object' && 'kind' in value && 'value' in value) {
        return value.value;
      }
      return value;
    },
    createRepeatInstance(ref) {
      if (ref.levels.length === 0) {
        throw new Error('createRepeatInstance: ref has no levels (not a repeat reference)');
      }
      const lastLevel = ref.levels[ref.levels.length - 1];
      if (lastLevel === undefined || lastLevel.multiplicity < 0) {
        throw new Error('createRepeatInstance: ref is not a concrete repeat-instance-slot reference');
      }
      const node = addRepeatInstance(tree, ref);
      if (node === null) {
        throw new Error('createRepeatInstance: could not add instance (invalid or non-repeat ref)');
      }
      evaluator.initializeRepeatInstance(ref);
    },
    removeRepeatInstance(ref) {
      const node = tsRosaRemoveRepeatInstance(tree, ref);
      if (node === null) {
        throw new Error('removeRepeatInstance: could not remove instance (invalid ref or no backing instance)');
      }
      evaluator.triggerRepeatRemoval(genericize(ref));
    },
    getRepeatInstanceRefs(ref) {
      const count = countRepeatInstances(tree, ref);
      const levels = ref.levels;
      const lastLevelIndex = levels.length - 1;
      if (lastLevelIndex < 0) return [];
      const refs = [];
      for (let i = 0; i < count; i++) {
        const nextLevels = levels.slice();
        nextLevels[lastLevelIndex] = {
          ...levels[lastLevelIndex],
          multiplicity: i
        };
        refs.push({
          ...ref,
          levels: nextLevels
        });
      }
      return refs;
    },
    getLabelMediaUri(form) {
      return navigator.getQuestionAtIndex()?.getLabelMediaUri?.(form) ?? null;
    },
    validateAll() {
      let nodesets = collectAllNodesets();
      const failures = [];
      while (nodesets.length > 0) {
        const outcome = evaluator.validate(nodesets);
        if (outcome === null) break;
        failures.push(toValidationFailure(outcome));
        const idx = nodesets.indexOf(outcome.failedNodeset);
        nodesets = nodesets.slice(idx + 1);
      }
      return failures;
    },
    isComplete() {
      return evaluator.validate(collectAllNodesets()) === null;
    }
  };
}
//# sourceMappingURL=createAdapter.js.map