/**
 * PR1 slice 1a — container-label fix (design decision 4 / spec "MODIFIED:
 * Group/repeat event label resolution").
 *
 * Root cause: ts-rosa's `FormNavigator.getQuestionAtIndex(idx)` (real impl,
 * `node_modules/@nuup/ts-rosa/dist/index.cjs:9661-9666`) does:
 *   const resolved = this.resolvePath(target.path);
 *   if (resolved === null || resolved.element.kind !== "question") return null;
 * i.e. it unconditionally returns `null` when the leaf element is a `group`
 * or `repeat` (or `prompt-new-repeat`, which resolves to a repeat leaf).
 * `createAdapter.ts` was calling `navigator.getQuestionAtIndex(fi)?.getLabelInnerText()`
 * for the `group`/`repeat`/`prompt-new-repeat` branches, so `AdaptedEvent.label`
 * was ALWAYS `null` for these kinds against the real engine — invisible in the
 * old test suite only because the fake navigator faked a label for non-question
 * events too (the "mock is more capable than reality" trap, per
 * `adapter-label-output-substitution.test.ts`'s sibling defect).
 *
 * Fix: read the label via `navigator.resolvePath(fi.path)?.element.labelText`
 * instead — `FormElement`'s `group`/`repeat` members carry `labelText`
 * (`index.d.ts:452-465`), and `resolvePath` returns the leaf element for any
 * FormIndex, not just question leaves.
 */
import { DOMParser } from '@xmldom/xmldom';
import { parseDocument, createFormSession } from '@nuup/ts-rosa';
import { createAdapter } from '../../adapter/createAdapter';
import { makeFakeSession } from '../../test-support/makeFakeSession';

function parseXml(xml: string) {
  const doc = new DOMParser().parseFromString(
    xml,
    'text/xml'
  ) as unknown as Document;
  return parseDocument(doc);
}

const GROUP_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Group Label</h:title>
    <model>
      <instance>
        <data id="group-label">
          <grp>
            <name/>
          </grp>
        </data>
      </instance>
      <bind nodeset="/data/grp/name" type="string"/>
    </model>
  </h:head>
  <h:body>
    <group ref="/data/grp">
      <label>Datos del productor</label>
      <input ref="/data/grp/name"><label>Name</label></input>
    </group>
  </h:body>
</h:html>`;

const REPEAT_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Repeat Label</h:title>
    <model>
      <instance>
        <data id="repeat-label">
          <parcela jr:template="">
            <q/>
          </parcela>
        </data>
      </instance>
      <bind nodeset="/data/parcela/q" type="string"/>
    </model>
  </h:head>
  <h:body>
    <repeat nodeset="/data/parcela">
      <label>Parcela</label>
      <input ref="/data/parcela/q"><label>Q</label></input>
    </repeat>
  </h:body>
</h:html>`;

function makeRealAdapter(xml: string) {
  const def = parseXml(xml);
  const session = createFormSession(def);
  const adapter = createAdapter(session);
  adapter.stepForward(); // bof -> first body element
  return adapter;
}

describe('createAdapter — group/repeat label resolution (real engine)', () => {
  it('resolves a labeled group\'s label via resolvePath, not getQuestionAtIndex', () => {
    const adapter = makeRealAdapter(GROUP_XML);
    const ev = adapter.getCurrentEvent();
    expect(ev.kind).toBe('group');
    if (ev.kind !== 'group') throw new Error('expected group');
    // Regression: against today's getQuestionAtIndex(fi)?.getLabelInnerText()
    // implementation, this is unconditionally null for a group leaf.
    expect(ev.label).toBe('Datos del productor');
  });

  it('resolves a labeled repeat\'s label via resolvePath, not getQuestionAtIndex', () => {
    const adapter = makeRealAdapter(REPEAT_XML);
    const ev = adapter.getCurrentEvent();
    // A manual (non jr:count) repeat with no instances yet stops at
    // 'prompt-new-repeat' first — same label-resolution code path as
    // 'repeat' and 'group' (all three read via resolvePath, not
    // getQuestionAtIndex).
    expect(ev.kind).toBe('prompt-new-repeat');
    if (ev.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat');
    expect(ev.label).toBe('Parcela');
  });

  it('AdaptedEvent.label is the group\'s real label text, not null, on the real engine', () => {
    const adapter = makeRealAdapter(GROUP_XML);
    const ev = adapter.getCurrentEvent();
    if (ev.kind !== 'group') throw new Error('expected group');
    expect(ev.label).not.toBeNull();
  });
});

describe('createAdapter — group/repeat label resolution (fake session)', () => {
  it('resolves group label through the fake\'s resolvePath (not the label-faking getQuestionAtIndex path)', () => {
    const session = makeFakeSession({
      events: [
        { kind: 'bof' },
        { kind: 'group', ref: '/data/grp', label: 'Group A', hint: null },
        { kind: 'eof' },
      ],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    const resolvePathSpy = jest.spyOn(
      session.navigator as unknown as { resolvePath: (p: unknown) => unknown },
      'resolvePath'
    );
    const adapter = createAdapter(session);
    adapter.stepForward();
    const ev = adapter.getCurrentEvent();
    expect(ev.kind).toBe('group');
    if (ev.kind !== 'group') throw new Error('expected group');
    expect(ev.label).toBe('Group A');
    // Decision-16-style positive gate: prove the label actually flowed
    // through resolvePath, not through a fallback.
    expect(resolvePathSpy).toHaveBeenCalled();
  });

  it('returns null label when the fake\'s resolvePath has no support (no throw)', () => {
    const session = makeFakeSession({
      events: [
        { kind: 'bof' },
        { kind: 'group', ref: '/data/grp', label: 'Group A', hint: null },
        { kind: 'eof' },
      ],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    // Simulate an older fake with no resolvePath support.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (session.navigator as any).resolvePath;
    const adapter = createAdapter(session);
    expect(() => {
      adapter.stepForward();
      adapter.getCurrentEvent();
    }).not.toThrow();
  });
});

describe('Form — group screens now appear when the label resolves (maintainer decision)', () => {
  it('a labeled group renders as its own screen (label + Continue), instead of being auto-skipped', () => {
    // This is the behavior-change consequence of the label fix: Form.tsx's
    // auto-skip effect only skips a 'group' event when ev.label is null/''.
    // Before the fix, real-engine group labels were always null, so every
    // group stop was silently skipped in production. After the fix, a
    // genuinely labeled group is no longer skip-eligible.
    const adapter = makeRealAdapter(GROUP_XML);
    const ev = adapter.getCurrentEvent();
    if (ev.kind !== 'group') throw new Error('expected group');
    const isSkipEligible = ev.label === null || ev.label === '';
    expect(isSkipEligible).toBe(false);
  });
});
