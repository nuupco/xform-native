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
import { createAdapter } from '../adapter/createAdapter';
import type { FormAdapter, NodeRef } from '../adapter/FormAdapter';
import type { MediaResolver } from '../createFormStore';

export interface FormSessionSnapshot {
  readonly version: number;
}

export class FormSessionStore {
  /** Expose adapter for test access (getRef from getCurrentEvent) */
  readonly adapter: FormAdapter;

  /** Host fetch seam for `jr://` question-label media (e.g. image-map's SVG). */
  readonly mediaResolver: MediaResolver | undefined;

  /** Last answerQuestion result (for Form-level validation feedback). */
  lastAnswerResult: { ref: NodeRef; result: AnswerResult } | null = null;

  private _snapshot: FormSessionSnapshot;
  private readonly _subscribers = new Set<() => void>();
  private readonly _session: FormSession;

  constructor(session: FormSession, mediaResolver?: MediaResolver) {
    this._session = session;
    this.adapter = createAdapter(session);
    this.mediaResolver = mediaResolver;
    this._snapshot = Object.freeze({ version: 0 });
  }

  // ---------------------------------------------------------------------------
  // useSyncExternalStore contract
  // ---------------------------------------------------------------------------

  subscribe(cb: () => void): () => void {
    this._subscribers.add(cb);
    return () => {
      this._subscribers.delete(cb);
    };
  }

  getSnapshot(): FormSessionSnapshot {
    return this._snapshot;
  }

  // ---------------------------------------------------------------------------
  // Mutations — each bumps version + notifies
  // ---------------------------------------------------------------------------

  answerQuestion(ref: NodeRef, value: unknown): AnswerResult {
    const result = this.adapter.answerQuestion(ref, value);
    this.lastAnswerResult = { ref, result };
    this._bump();
    return result;
  }

  stepForward(): void {
    this.adapter.stepForward();
    this._bump();
  }

  stepBackward(): void {
    this.adapter.stepBackward();
    this._bump();
  }

  jumpToIndex(index: number): void {
    this.adapter.jumpToIndex(index);
    this._bump();
  }

  /**
   * Manually create a new repeat instance at `ref` (Slice D). Delegates to
   * the adapter then bumps — consistent with the every-mutation-bumps
   * contract shared by answerQuestion/stepForward/etc.
   */
  createRepeatInstance(ref: NodeRef): void {
    this.adapter.createRepeatInstance(ref);
    this._bump();
  }

  /**
   * Delete an existing repeat instance at `ref` (Slice E — field-list
   * embedded repeats). Same delegate-then-bump pattern as
   * `createRepeatInstance`.
   */
  removeRepeatInstance(ref: NodeRef): void {
    this.adapter.removeRepeatInstance(ref);
    this._bump();
  }

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
  injectValues(entries: readonly { ref: NodeRef; value: unknown }[]): void {
    for (const { ref, value } of entries) {
      const result = this.adapter.answerQuestion(ref, value);
      this.lastAnswerResult = { ref, result };
    }
    this._bump();
  }

  /**
   * Trigger a re-render after an out-of-band mutation (background sync, host app
   * mutating the session/adapter directly). Bumps version + notifies subscribers,
   * preserving the REQ-03 referential-identity contract (new frozen snapshot).
   */
  notifyExternalMutation(): void {
    this._bump();
  }

  /** Additive passthrough — delegates to the underlying session (Slice C). */
  serializeToXml(): string {
    return this._session.serializeToXml();
  }

  /**
   * Re-resolves finalize-time preloads (e.g. `end` timestamp) and re-runs the
   * calculate cascade, mirroring JavaRosa's FormDef#postProcessInstance. Must
   * be called before serializeToXml() at submission time — ts-rosa does not
   * trigger this on its own.
   */
  finalize(): void {
    this._session.finalize();
    this._bump();
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private _bump(): void {
    this._snapshot = Object.freeze({ version: this._snapshot.version + 1 });
    for (const cb of this._subscribers) {
      cb();
    }
  }
}
