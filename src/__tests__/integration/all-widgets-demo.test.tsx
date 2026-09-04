/**
 * all-widgets-demo — verifies the example app's local demo XForm
 * (example/src/demo/allWidgetsForm.ts) parses cleanly with the real engine
 * end to end: createFormStore + full node walk, same pattern as
 * xform-widgets-coverage.test.tsx. Exists so the demo form used by
 * FormListScreen/useFormLoad (loaded without a Kobo server) never silently
 * bit-rots against engine changes.
 */

import { createFormStore } from '../../createFormStore';
import { pickWidget } from '../../widgets/engine/pickWidget';
import { ALL_WIDGETS_DEMO_XML } from '../../../example/src/demo/allWidgetsForm';

describe('all-widgets-demo — ALL_WIDGETS_DEMO_XML walks and resolves cleanly', () => {
  it('parses with createFormStore and every question resolves through pickWidget', async () => {
    const store = await createFormStore(ALL_WIDGETS_DEMO_XML);

    let questionCount = 0;
    for (let i = 0; i < 500; i++) {
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
      store.stepForward();
    }

    expect(store.adapter.getCurrentEvent().kind).toBe('eof');
    expect(questionCount).toBe(72);
  });
});
