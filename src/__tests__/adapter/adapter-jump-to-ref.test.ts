/**
 * FormAdapter.jumpToRef() — jump to any currently relevant position and keep
 * the step counter / visited cache coherent with stepForward / stepBackward /
 * jumpToIndex. Real ts-rosa engine.
 */
import { createFormStore } from '../../createFormStore';
import type { NodeRef, OutlineNode } from '../../adapter/FormAdapter';

const FORM_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Jump</h:title>
    <model>
      <instance>
        <data id="jump">
          <sec_a><name/><color/><hidden/></sec_a>
          <fl><x/><y/></fl>
          <tail><z/></tail>
        </data>
      </instance>
      <bind nodeset="/data/sec_a/name" type="string"/>
      <bind nodeset="/data/sec_a/color" type="string"/>
      <bind nodeset="/data/sec_a/hidden" type="string" relevant="/data/sec_a/name = 'zzz'"/>
      <bind nodeset="/data/fl/x" type="string"/>
      <bind nodeset="/data/fl/y" type="string"/>
      <bind nodeset="/data/tail/z" type="string"/>
    </model>
  </h:head>
  <h:body>
    <group ref="/data/sec_a">
      <label>Sección A</label>
      <input ref="/data/sec_a/name"><label>Nombre</label></input>
      <input ref="/data/sec_a/color"><label>Color</label></input>
      <input ref="/data/sec_a/hidden"><label>Oculta</label></input>
    </group>
    <group ref="/data/fl" appearance="field-list">
      <label>Lista</label>
      <input ref="/data/fl/x"><label>X</label></input>
      <input ref="/data/fl/y"><label>Y</label></input>
    </group>
    <group ref="/data/tail">
      <label>Final</label>
      <input ref="/data/tail/z"><label>Z</label></input>
    </group>
  </h:body>
</h:html>`;

async function setup() {
  const store = await createFormStore(FORM_XML);
  const outline = store.adapter.getOutline();
  const refOf = (label: string): NodeRef =>
    (outline.find((n: OutlineNode) => n.label === label) as OutlineNode).ref;
  return { store, refOf };
}

function currentLabel(store: Awaited<ReturnType<typeof setup>>['store']) {
  const ev = store.adapter.getCurrentEvent();
  return ev.kind === 'bof' || ev.kind === 'eof' ? ev.kind : ev.label;
}

describe('FormAdapter.jumpToRef', () => {
  it('jumps forward to a question that was never visited', async () => {
    const { store, refOf } = await setup();
    expect(store.adapter.jumpToRef(refOf('Z'))).toBe(true);
    expect(currentLabel(store)).toBe('Z');
  });

  it('keeps stepBackward / stepForward / jumpToIndex coherent after a jump', async () => {
    const { store, refOf } = await setup();
    store.adapter.jumpToRef(refOf('Color'));
    const ev = store.adapter.getCurrentEvent();
    // BOF(0) → Sección A(1) → Nombre(2) → Color(3)
    expect(ev.kind === 'question' && ev.index).toBe(3);

    store.adapter.stepBackward();
    expect(currentLabel(store)).toBe('Nombre');
    store.adapter.stepForward();
    expect(currentLabel(store)).toBe('Color');

    store.adapter.jumpToIndex(1);
    expect(currentLabel(store)).toBe('Sección A');
  });

  it('jumps backward to an earlier position', async () => {
    const { store, refOf } = await setup();
    store.adapter.jumpToRef(refOf('Z'));
    store.adapter.jumpToRef(refOf('Nombre'));
    expect(currentLabel(store)).toBe('Nombre');
    store.adapter.stepForward();
    expect(currentLabel(store)).toBe('Color');
  });

  it('lands on the field-list group when the target is a question inside it', async () => {
    const { store, refOf } = await setup();
    expect(store.adapter.jumpToRef(refOf('Y'))).toBe(true);
    const ev = store.adapter.getCurrentEvent();
    expect(ev.kind).toBe('group');
    expect(currentLabel(store)).toBe('Lista');
  });

  it('returns false and leaves the position untouched for a non-relevant target', async () => {
    const { store } = await setup();
    store.adapter.stepForward();
    store.adapter.stepForward();
    const before = store.adapter.getCurrentEvent();
    // Build the ref of the hidden question from a store where it IS relevant.
    const other = await createFormStore(FORM_XML);
    other.adapter.stepForward();
    other.adapter.stepForward();
    const nameRef = (other.adapter.getCurrentEvent() as { ref: NodeRef }).ref;
    other.answerQuestion(nameRef, 'zzz');
    const hiddenRef = other.adapter
      .getOutline()
      .find((n) => n.label === 'Oculta')!.ref;

    expect(store.adapter.jumpToRef(hiddenRef)).toBe(false);
    expect(store.adapter.getCurrentEvent()).toEqual(before);
    store.adapter.stepForward();
    expect(currentLabel(store)).toBe('Color');
  });

  it('is exposed on FormSessionStore and only notifies subscribers on success', async () => {
    const { store, refOf } = await setup();
    const cb = jest.fn();
    store.subscribe(cb);
    expect(store.jumpToRef(refOf('Z'))).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('FormAdapter.jumpToRef with repeats', () => {
  const REPEAT_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head><h:title>R</h:title><model>
    <instance><data id="r"><plots><plot jr:template=""><area/></plot></plots></data></instance>
    <bind nodeset="/data/plots/plot/area" type="int"/>
  </model></h:head>
  <h:body><group ref="/data/plots"><label>Parcelas</label>
    <repeat nodeset="/data/plots/plot"><label>Parcela</label><input ref="/data/plots/plot/area"><label>Área</label></input></repeat>
  </group></h:body>
</h:html>`;

  it('jumps into the second repeat instance and steps back to the first', async () => {
    const store = await createFormStore(REPEAT_XML, {
      instanceXml: `<?xml version="1.0"?><data id="r" xmlns:jr="http://openrosa.org/javarosa"><plots><plot><area>1</area></plot><plot><area>2</area></plot></plots></data>`,
    });
    const areas = store.adapter.getOutline().filter((n) => n.label === 'Área');
    expect(store.jumpToRef(areas[1]!.ref)).toBe(true);
    expect(store.adapter.resolveValue(areas[1]!.ref)).toBe(2);
    const ev = store.adapter.getCurrentEvent();
    expect(ev.kind === 'question' && ev.ref).toEqual(areas[1]!.ref);
    store.stepBackward();
    store.stepBackward();
    const back = store.adapter.getCurrentEvent();
    expect(back.kind === 'question' && back.ref).toEqual(areas[0]!.ref);
  });
});
