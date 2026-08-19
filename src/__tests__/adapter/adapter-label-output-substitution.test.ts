/**
 * FormAdapter must resolve <output> substitutions in question labels/hints,
 * not leak the raw ${n} placeholder template.
 *
 * REQ hotfix: confirmed on-device — a question's label read literally
 * "Nombre de la parcela ${0}" instead of the resolved value (e.g. the
 * current repeat instance's position). Root cause: ts-rosa's
 * getQuestionAtIndex() exposes BOTH a raw template method (getLabelInnerText,
 * with <output> replaced by unresolved ${n} placeholders) and a fully
 * resolved one (getQuestionText, itext-resolved + <output> substituted
 * against the current instance) — createAdapter.ts was calling the raw one.
 * Same defect for hints (getHintText raw vs getSubstitutedHintText resolved).
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
    <h:title>Output substitution</h:title>
    <model>
      <instance>
        <data id="output-sub">
          <name/>
          <greeting/>
        </data>
      </instance>
      <bind nodeset="/data/name" type="string"/>
      <bind nodeset="/data/greeting" type="string"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/name"><label>Name</label></input>
    <input ref="/data/greeting">
      <label>Hola <output value=" /data/name "/></label>
      <hint>Saludo para <output value=" /data/name "/></hint>
    </input>
  </h:body>
</h:html>`;

describe('FormAdapter — resolves <output> substitutions in labels/hints', () => {
  it('resolves the output placeholder against the current instance instead of leaking ${n}', () => {
    const store = makeRealStore(XML);
    store.stepForward(); // -> name question
    let ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');
    store.answerQuestion(ev.ref, 'Erick');

    store.stepForward(); // -> greeting question
    ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    expect(ev.label).toBe('Hola Erick');
    expect(ev.label).not.toContain('${0}');
    expect(ev.hint).toBe('Saludo para Erick');
    expect(ev.hint).not.toContain('${0}');
  });
});
