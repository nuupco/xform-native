"use strict";

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

import { createAdapter } from "../adapter/createAdapter.js";
export class FormSessionStore {
  /** Expose adapter for test access (getRef from getCurrentEvent) */

  /** Last answerQuestion result (for Form-level validation feedback). */
  lastAnswerResult = null;
  _subscribers = new Set();
  constructor(session) {
    this.adapter = createAdapter(session);
    this._snapshot = Object.freeze({
      version: 0
    });
  }

  // ---------------------------------------------------------------------------
  // useSyncExternalStore contract
  // ---------------------------------------------------------------------------

  subscribe(cb) {
    this._subscribers.add(cb);
    return () => {
      this._subscribers.delete(cb);
    };
  }
  getSnapshot() {
    return this._snapshot;
  }

  // ---------------------------------------------------------------------------
  // Mutations — each bumps version + notifies
  // ---------------------------------------------------------------------------

  answerQuestion(ref, value) {
    const result = this.adapter.answerQuestion(ref, value);
    this.lastAnswerResult = {
      ref,
      result
    };
    this._bump();
    return result;
  }
  stepForward() {
    this.adapter.stepForward();
    this._bump();
  }
  stepBackward() {
    this.adapter.stepBackward();
    this._bump();
  }
  jumpToIndex(index) {
    this.adapter.jumpToIndex(index);
    this._bump();
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  _bump() {
    this._snapshot = Object.freeze({
      version: this._snapshot.version + 1
    });
    for (const cb of this._subscribers) {
      cb();
    }
  }
}
//# sourceMappingURL=FormSessionStore.js.map