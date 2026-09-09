/**
 * all-widgets-demo — verifies the example app's local demo XForm
 * (example/src/demo/allWidgetsForm.ts) parses cleanly with the real engine
 * end to end: createFormStore + full node walk, same pattern as
 * xform-widgets-coverage.test.tsx. Exists so the demo form used by
 * FormListScreen/useFormLoad (loaded without a Kobo server) never silently
 * bit-rots against engine changes.
 *
 * The walk creates exactly ONE instance per distinct repeat construct (see
 * adapter-current-path.test.ts for the real pattern), then declines every
 * later prompt-new-repeat for that same construct by calling stepForward()
 * without createRepeatInstance — same as Form.tsx's handleNext, which calls
 * store.stepForward() unconditionally except for 'question' (see
 * src/form/Form.tsx handleNext/handleCreateRepeat). Manual (non jr:count)
 * repeats re-prompt for another instance forever otherwise, since nothing
 * else advances the navigator past a prompt-new-repeat node.
 */

import { createFormStore } from '../../createFormStore';
import { pickWidget } from '../../widgets/engine/pickWidget';
import { ALL_WIDGETS_DEMO_XML } from '../../../example/src/demo/allWidgetsForm';
import type { NodeRef } from '../../adapter/FormAdapter';

/** Identifies a repeat *construct* (not a specific instance) by its level names, ignoring multiplicity. */
function repeatConstructKey(ref: NodeRef): string {
  const levels = (ref as unknown as { levels: readonly { name: string }[] }).levels;
  return levels.map((l) => l.name).join('/');
}

describe('all-widgets-demo — ALL_WIDGETS_DEMO_XML walks and resolves cleanly', () => {
  it('parses with createFormStore and every question resolves through pickWidget', async () => {
    const store = await createFormStore(ALL_WIDGETS_DEMO_XML);

    let questionCount = 0;
    let repeatInstancesCreated = 0;
    const seenRepeatConstructs = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const ev = store.adapter.getCurrentEvent();
      if (ev.kind === 'eof') break;
      if (ev.kind === 'question') {
        questionCount++;
        const state = store.adapter.getNodeState(ev.ref);
        expect(() =>
          pickWidget(
            ev.dataType as never,
            ev.controlType as never,
            ev.appearance,
            state.readonly,
            ev.mediatype
          )
        ).not.toThrow();
      }
      if (ev.kind === 'prompt-new-repeat') {
        const key = repeatConstructKey(ev.ref);
        if (!seenRepeatConstructs.has(key)) {
          seenRepeatConstructs.add(key);
          store.adapter.createRepeatInstance(ev.ref);
          repeatInstancesCreated++;
        }
      }
      store.stepForward();
    }

    expect(store.adapter.getCurrentEvent().kind).toBe('eof');
    // 72 original widget-coverage questions + 9 new structure-section
    // questions (2 plain group + 2 field-list group + 1 note-with-video +
    // 1 loose repeat + 1 group-in-repeat + 1 repeat-in-group + 1
    // nested-repeat leaf) = 81.
    expect(questionCount).toBe(81);
    // rep_loose, g_rep_inside/rep_in_group, rep_with_group, rep_outer,
    // rep_outer/rep_inner (created once each since every repeat here is
    // walked exactly one instance deep).
    expect(repeatInstancesCreated).toBe(5);
  });

  it('note field with video-form itext label resolves its raw jr:// media reference', async () => {
    const store = await createFormStore(ALL_WIDGETS_DEMO_XML);

    let found = false;
    const seenRepeatConstructs = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const ev = store.adapter.getCurrentEvent();
      if (ev.kind === 'eof') break;
      if (ev.kind === 'question' && ev.dataType === 'string' && ev.appearance === 'note') {
        const state = store.adapter.getNodeState(ev.ref);
        if (!state.readonly) {
          store.stepForward();
          continue;
        }
        const mediaUri = store.adapter.getLabelMediaUri('video');
        if (mediaUri != null) {
          found = true;
          expect(ev.label).toBe('Observa este video antes de responder.');
          // NoteWidget.tsx now consumes getLabelMediaUri too (see
          // NoteWidget.media.test.tsx for its render behavior with/without
          // store.mediaResolver) — this test only checks the adapter-level
          // itext resolution to the raw jr:// reference.
          expect(mediaUri).toBe('jr://videos/introduccion.mp4');
          break;
        }
      }
      if (ev.kind === 'prompt-new-repeat') {
        const key = repeatConstructKey(ev.ref);
        if (!seenRepeatConstructs.has(key)) {
          seenRepeatConstructs.add(key);
          store.adapter.createRepeatInstance(ev.ref);
        }
      }
      store.stepForward();
    }
    expect(found).toBe(true);
  });
});
