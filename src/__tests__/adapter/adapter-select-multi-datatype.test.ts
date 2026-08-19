/**
 * FormAdapter.answerQuestion must encode select-multi answers as an array
 * (dataType 'selectMulti' for encodeAnswer purposes), not as the joined
 * space-separated STRING that both ts-rosa's literal bind type ('string',
 * by JavaRosa convention — confirmed: ev.dataType stays 'string' for
 * selects; controlType is the routing/encoding source of truth everywhere
 * else in this codebase, e.g. pickWidget.ts) and the raw instance tree
 * node's dataType (also 'string') would otherwise produce.
 *
 * REQ hotfix: confirmed on-device — answerQuestion(ref, ['24']) returned OK,
 * but the value never re-appeared as a selection. Root cause: the adapter
 * read dataType straight from the raw instance node ('string' for selects),
 * so encodeAnswer joined the array into the plain string "24" and cast it
 * as a string AnswerValue. On read-back, resolveValue unwraps to the string
 * "24" (not an array), and SelectMultiWidget's `Array.isArray(rawValue)`
 * check silently treats that as "no selections". Fix: answerQuestion must
 * special-case controlType 'select'/'select1' for encoding, exactly
 * mirroring pickWidget's "controlType is the source of truth" rule.
 */
import { DOMParser } from '@xmldom/xmldom';
import { parseDocument, createFormSession } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';

function parseXml(xml: string) {
  const doc = new DOMParser().parseFromString(
    xml,
    'text/xml'
  ) as unknown as Document;
  return parseDocument(doc);
}

function makeRealStore(xml: string) {
  const def = parseXml(xml);
  const session = createFormSession(def);
  return new FormSessionStore(session);
}

const XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Select multi datatype</h:title>
    <model>
      <instance>
        <data id="select-multi-datatype">
          <fruits/>
        </data>
      </instance>
      <bind nodeset="/data/fruits" type="string"/>
    </model>
  </h:head>
  <h:body>
    <select ref="/data/fruits">
      <label>Pick fruits</label>
      <item><label>Apple</label><value>a</value></item>
      <item><label>Banana</label><value>b</value></item>
    </select>
  </h:body>
</h:html>`;

describe('FormAdapter — answerQuestion encodes select-multi with the correct dataType', () => {
  it('round-trips a select-multi answer as an array, not a joined string', () => {
    const store = makeRealStore(XML);
    store.stepForward(); // -> the select question
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');
    // Confirmed convention: dataType stays 'string' for selects (JavaRosa),
    // controlType is what actually identifies this as a select-multi.
    expect(ev.dataType).toBe('string');
    expect(ev.controlType).toBe('select');

    const result = store.answerQuestion(ev.ref, ['a', 'b']);
    expect(result).toBe('OK');

    const value = store.adapter.resolveValue(ev.ref);
    expect(Array.isArray(value)).toBe(true);
    expect(value).toEqual(['a', 'b']);
  });
});

const SELECT_ONE_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Select one datatype</h:title>
    <model>
      <instance>
        <data id="select-one-datatype">
          <fruit/>
        </data>
      </instance>
      <bind nodeset="/data/fruit" type="string"/>
    </model>
  </h:head>
  <h:body>
    <select1 ref="/data/fruit">
      <label>Pick a fruit</label>
      <item><label>Apple</label><value>a</value></item>
      <item><label>Banana</label><value>b</value></item>
    </select1>
  </h:body>
</h:html>`;

describe('FormAdapter — answerQuestion select1 path stays correct (regression)', () => {
  it('round-trips a select-one answer as a plain string token', () => {
    const store = makeRealStore(SELECT_ONE_XML);
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');
    expect(ev.controlType).toBe('select1');

    const result = store.answerQuestion(ev.ref, 'b');
    expect(result).toBe('OK');
    expect(store.adapter.resolveValue(ev.ref)).toBe('b');
  });
});
