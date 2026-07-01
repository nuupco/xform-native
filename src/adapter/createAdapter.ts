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

import type { FormSession, ControlType } from '@nuup/ts-rosa';
import type { FormIndex } from '@nuup/ts-rosa';
import { isAt, isBof, isEof } from '@nuup/ts-rosa';
import { resolveReference } from '@nuup/ts-rosa';
import type { NodeState, SelectChoice, AnswerResult } from '@nuup/ts-rosa';
import type { FormAdapter, AdaptedEvent, NodeRef } from './FormAdapter';

export function createAdapter(session: FormSession): FormAdapter {
  const { navigator, evaluator, tree } = session;

  // Visited-index cache: parallel to the adapter's numeric step counter.
  // Position 0 is always the starting index (captured immediately).
  const visitedCache: FormIndex[] = [navigator.getEvent().index];
  let stepCount = 0; // numeric position in visitedCache

  // ---------------------------------------------------------------------------
  // Internal: translate the raw FormEntryEvent + navigator into AdaptedEvent
  // ---------------------------------------------------------------------------
  function adaptCurrentEvent(): AdaptedEvent {
    const ev = navigator.getEvent();
    let adapted: AdaptedEvent;

    if (ev.kind === 'beginning-of-form' || isBof(ev.index)) {
      adapted = { kind: 'bof' };
      return adapted;
    }

    if (ev.kind === 'end-of-form' || isEof(ev.index)) {
      adapted = { kind: 'eof' };
      return adapted;
    }

    if (!isAt(ev.index)) {
      adapted = { kind: 'eof' };
      return adapted;
    }

    const fi = ev.index;
    const ref = fi.ref as NodeRef;

    if (ev.kind === 'question') {
      const q = navigator.getQuestionAtIndex(fi);
      adapted = {
        kind: 'question',
        ref,
        dataType: q?.getDataType() ?? 'string',
        controlType: (q?.getControlType() ?? 'input') as ControlType,
        appearance: q?.getAppearance?.() ?? null,
        label: q?.getLabelInnerText() ?? null,
        hint: q?.getHintText?.() ?? null,
        index: stepCount,
        rangeBounds: q?.getRangeBounds?.() ?? null,
        mediatype: q?.getMediatype?.() ?? null,
      };
      return adapted;
    }

    if (ev.kind === 'group') {
      const q = navigator.getQuestionAtIndex(fi);
      adapted = {
        kind: 'group',
        ref,
        label: q?.getLabelInnerText() ?? null,
        hint: null,
        index: stepCount,
      };
      return adapted;
    }

    if (ev.kind === 'repeat') {
      const q = navigator.getQuestionAtIndex(fi);
      // multiplicity comes from the last path level
      const lastLevel = fi.path[fi.path.length - 1];
      const multiplicity = lastLevel?.multiplicity ?? 0;
      adapted = {
        kind: 'repeat',
        ref,
        label: q?.getLabelInnerText() ?? null,
        multiplicity,
        index: stepCount,
      };
      return adapted;
    }

    if (ev.kind === 'prompt-new-repeat') {
      const q = navigator.getQuestionAtIndex(fi);
      adapted = {
        kind: 'prompt-new-repeat',
        ref,
        label: q?.getLabelInnerText() ?? null,
        index: stepCount,
      };
      return adapted;
    }

    adapted = { kind: 'eof' };
    return adapted;
  }

  // ---------------------------------------------------------------------------
  // Visited cache management
  // ---------------------------------------------------------------------------
  function recordCurrentIndex(): void {
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
    getCurrentEvent(): AdaptedEvent {
      return adaptCurrentEvent();
    },

    stepForward(): void {
      navigator.stepToNextEvent();
      stepCount++;
      recordCurrentIndex();
    },

    stepBackward(): void {
      navigator.stepToPreviousEvent();
      stepCount = Math.max(0, stepCount - 1);
    },

    jumpToIndex(index: number): void {
      const fi = visitedCache[index];
      if (fi === undefined) {
        throw new RangeError(
          `jumpToIndex(${index}): position not yet visited (cache size: ${visitedCache.length})`
        );
      }
      navigator.jumpToIndex(fi);
      stepCount = index;
    },

    getNodeState(ref: NodeRef): NodeState {
      const state = evaluator.getNodeState(
        ref as Parameters<typeof evaluator.getNodeState>[0]
      );
      if (state === undefined) {
        return {
          relevant: true,
          enabled: true,
          required: false,
          readonly: false,
          constraintMsg: null,
          calculatedValue: null,
        };
      }
      return state;
    },

    isEffectivelyRelevant(ref: NodeRef): boolean {
      return evaluator.isEffectivelyRelevant(
        ref as Parameters<typeof evaluator.isEffectivelyRelevant>[0]
      );
    },

    getChoices(ref: NodeRef): readonly SelectChoice[] {
      return evaluator.getChoices(
        ref as Parameters<typeof evaluator.getChoices>[0]
      );
    },

    answerQuestion(ref: NodeRef, value: unknown): AnswerResult {
      return evaluator.answerQuestion(
        ref as Parameters<typeof evaluator.answerQuestion>[0],
        value as never
      );
    },

    resolveValue(ref: NodeRef): unknown {
      const node = resolveReference(tree, ref);
      const value = node?.value ?? null;
      // Unwrap AnswerValue objects returned by the real engine so widgets
      // receive raw primitives (string | number | boolean | Date | string[]).
      if (
        value !== null &&
        typeof value === 'object' &&
        'kind' in value &&
        'value' in value
      ) {
        return (value as { value: unknown }).value;
      }
      return value;
    },
  };
}
