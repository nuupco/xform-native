/**
 * FormAdapter.validateAll / isComplete — real-engine tests.
 *
 * A fake session cannot model this: the whole point is expanding EVERY
 * concrete repeat instance (not just the default/first one) and running
 * required/constraint checks per instance via the real evaluator. Refs are
 * obtained the same way a real host does — via getCurrentEvent().ref while
 * navigating — never hand-built, since a malformed TreeReference (missing
 * refLevel/contextType) silently corrupts the DAG's own generic-key state
 * bookkeeping.
 */

import { DOMParser } from '@xmldom/xmldom';
import { parseDocument, createFormSession } from '@nuup/ts-rosa';
import { createAdapter } from '../../adapter/createAdapter';

function parseXml(xml: string) {
  const doc = new DOMParser().parseFromString(
    xml,
    'text/xml'
  ) as unknown as Document;
  return parseDocument(doc);
}

// Manual repeat with a required int question, plus a plain required question.
const REPEAT_WITH_REQUIRED_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Repeat Required</h:title>
    <model>
      <instance>
        <data id="repeat-required">
          <name/>
          <repeat jr:template="">
            <q/>
          </repeat>
        </data>
      </instance>
      <bind nodeset="/data/name" type="string" required="true()"/>
      <bind nodeset="/data/repeat/q" type="int" required="true()"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/name"><label>Name</label></input>
    <repeat nodeset="/data/repeat">
      <input ref="/data/repeat/q"><label>Q</label></input>
    </repeat>
  </h:body>
</h:html>`;

// A constraint that depends on ANOTHER field's value. answerQuestion()
// already blocks an immediately-invalid value at entry time (no commit on
// CONSTRAINT_VIOLATED), so the only way a constraint violation can actually
// end up sitting in the tree is indirectly: constraints are validation-only
// (not part of the recalculate DAG), so raising /data/min AFTER /data/age
// was answered validly leaves a stale, now-invalid /data/age that the engine
// never automatically re-checks — exactly the gap validateAll() closes.
const CONSTRAINED_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Constrained</h:title>
    <model>
      <instance>
        <data id="constrained">
          <min/>
          <age/>
        </data>
      </instance>
      <bind nodeset="/data/min" type="int"/>
      <bind nodeset="/data/age" type="int" constraint=". &gt;= /data/min" jr:constraintMsg="Must be at least the minimum"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/min"><label>Minimum</label></input>
    <input ref="/data/age"><label>Age</label></input>
  </h:body>
</h:html>`;

describe('FormAdapter.validateAll / isComplete', () => {
  it('reports the required-empty top-level field when nothing was answered', () => {
    const session = createFormSession(parseXml(REPEAT_WITH_REQUIRED_XML));
    const adapter = createAdapter(session);

    expect(adapter.isComplete()).toBe(false);
    const failures = adapter.validateAll();
    expect(failures.length).toBeGreaterThanOrEqual(1);
    expect(failures[0]?.type).toBe('required');
  });

  it('checks EVERY repeat instance, not just the first, and clears once all are answered', () => {
    const session = createFormSession(parseXml(REPEAT_WITH_REQUIRED_XML));
    const adapter = createAdapter(session);

    adapter.stepForward(); // bof -> /data/name
    const nameEv = adapter.getCurrentEvent();
    if (nameEv.kind !== 'question') throw new Error('expected question');
    adapter.answerQuestion(nameEv.ref, 'Ana');

    adapter.stepForward(); // -> prompt-new-repeat
    let promptEv = adapter.getCurrentEvent();
    if (promptEv.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat');
    adapter.createRepeatInstance(promptEv.ref);
    adapter.stepForward(); // -> instance 0's q
    let qEv = adapter.getCurrentEvent();
    if (qEv.kind !== 'question') throw new Error('expected question');
    adapter.answerQuestion(qEv.ref, 1);

    adapter.stepForward(); // -> prompt-new-repeat again
    promptEv = adapter.getCurrentEvent();
    if (promptEv.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat');
    adapter.createRepeatInstance(promptEv.ref);
    adapter.stepForward(); // -> instance 1's q — leave this one EMPTY on purpose
    const midEvSeen = adapter.getCurrentEvent();
    if (midEvSeen.kind !== 'question') throw new Error('expected question');
    const midRef = midEvSeen.ref;

    adapter.stepForward(); // -> prompt-new-repeat again
    promptEv = adapter.getCurrentEvent();
    if (promptEv.kind !== 'prompt-new-repeat') throw new Error('expected prompt-new-repeat');
    adapter.createRepeatInstance(promptEv.ref);
    adapter.stepForward(); // -> instance 2's q
    qEv = adapter.getCurrentEvent();
    if (qEv.kind !== 'question') throw new Error('expected question');
    adapter.answerQuestion(qEv.ref, 3);

    // Instance 1 (the middle one) is still empty — must be caught even
    // though it is not the default/first instance, and without disturbing
    // the walker's current cursor position.
    const cursorBefore = adapter.getCurrentEvent();
    expect(adapter.isComplete()).toBe(false);
    const failures = adapter.validateAll();
    expect(failures.some((f) => f.type === 'required')).toBe(true);
    expect(adapter.getCurrentEvent()).toEqual(cursorBefore);

    adapter.answerQuestion(midRef, 2); // fix instance 1 via its stored ref, no navigation needed

    expect(adapter.isComplete()).toBe(true);
    expect(adapter.validateAll()).toEqual([]);
  });

  it('surfaces a constraint violation left stale by a later change to another field', () => {
    const session = createFormSession(parseXml(CONSTRAINED_XML));
    const adapter = createAdapter(session);

    adapter.stepForward(); // bof -> /data/min
    const minEv = adapter.getCurrentEvent();
    if (minEv.kind !== 'question') throw new Error('expected question');
    adapter.answerQuestion(minEv.ref, 0);

    adapter.stepForward(); // -> /data/age
    const ageEv = adapter.getCurrentEvent();
    if (ageEv.kind !== 'question') throw new Error('expected question');
    expect(adapter.answerQuestion(ageEv.ref, 12)).not.toBe('CONSTRAINT_VIOLATED');

    expect(adapter.isComplete()).toBe(true);

    // Raising the minimum afterward doesn't re-check /data/age (constraints
    // aren't in the recalculate DAG) — its now-stale value is only caught by
    // a full validateAll() sweep.
    adapter.answerQuestion(minEv.ref, 18);

    const failures = adapter.validateAll();
    expect(failures).toHaveLength(1);
    expect(failures[0]?.type).toBe('constraint');
    expect(failures[0]?.message).toBe('Must be at least the minimum');
    expect(adapter.isComplete()).toBe(false);
  });
});
