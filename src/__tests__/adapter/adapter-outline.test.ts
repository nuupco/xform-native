/**
 * FormAdapter.getOutline() — non-mutating, relevance-aware enumeration of
 * the whole form (question tree + read-only document view).
 * Real ts-rosa engine: needs a real body, instance tree and relevance.
 */
import { createFormStore } from '../../createFormStore';

const FORM_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Outline</h:title>
    <model>
      <instance>
        <data id="outline">
          <sec_a><name/><color/><hidden/></sec_a>
          <plots><plot jr:template=""><area/></plot></plots>
        </data>
      </instance>
      <bind nodeset="/data/sec_a/name" type="string" required="true()"/>
      <bind nodeset="/data/sec_a/color" type="string"/>
      <bind nodeset="/data/sec_a/hidden" type="string" relevant="/data/sec_a/name = 'zzz'"/>
      <bind nodeset="/data/plots/plot/area" type="int"/>
    </model>
  </h:head>
  <h:body>
    <group ref="/data/sec_a">
      <label>Sección A</label>
      <input ref="/data/sec_a/name"><label>Nombre</label></input>
      <select1 ref="/data/sec_a/color">
        <label>Color</label>
        <item><label>Rojo</label><value>r</value></item>
        <item><label>Azul</label><value>b</value></item>
      </select1>
      <input ref="/data/sec_a/hidden"><label>Oculta</label></input>
    </group>
    <group ref="/data/plots">
      <label>Parcelas</label>
      <repeat nodeset="/data/plots/plot">
        <input ref="/data/plots/plot/area"><label>Área</label></input>
      </repeat>
    </group>
  </h:body>
</h:html>`;

const INSTANCE_XML = `<?xml version="1.0"?>
<data id="outline" xmlns:jr="http://openrosa.org/javarosa">
  <sec_a><name>Ana</name><color>b</color><hidden/></sec_a>
  <plots><plot><area>10</area></plot><plot><area/></plot></plots>
</data>`;

async function makeStore() {
  return createFormStore(FORM_XML, { instanceXml: INSTANCE_XML });
}

describe('FormAdapter.getOutline', () => {
  it('lists relevant nodes in document order with depth, labels and values', async () => {
    const store = await makeStore();
    const outline = store.adapter.getOutline();

    const brief = outline.map((n) => [n.kind, n.label, n.depth]);
    expect(brief).toEqual([
      ['group', 'Sección A', 0],
      ['question', 'Nombre', 1],
      ['question', 'Color', 1],
      ['group', 'Parcelas', 0],
      ['repeat', null, 1],
      ['question', 'Área', 2],
      ['repeat', null, 1],
      ['question', 'Área', 2],
    ]);

    const name = outline[1]!;
    expect(name).toMatchObject({
      kind: 'question',
      required: true,
      answered: true,
      value: 'Ana',
      displayValue: 'Ana',
    });
    const color = outline[2]!;
    expect(color).toMatchObject({ value: 'b', displayValue: 'Azul', answered: true });
    expect(outline[5]).toMatchObject({ answered: true, value: 10 });
    expect(outline[7]).toMatchObject({ answered: false });
    expect(outline[4]).toMatchObject({ kind: 'repeat', multiplicity: 0 });
    expect(outline[6]).toMatchObject({ kind: 'repeat', multiplicity: 1 });
  });

  it('omits non-relevant questions', async () => {
    const store = await makeStore();
    const labels = store.adapter.getOutline().map((n) => n.label);
    expect(labels).not.toContain('Oculta');
  });

  it('does not move the cursor, the step counter or the instance data', async () => {
    const store = await makeStore();
    const before = store.serializeToXml();
    const eventBefore = store.adapter.getCurrentEvent();

    store.adapter.getOutline();
    store.adapter.getOutline();

    expect(store.adapter.getCurrentEvent()).toEqual(eventBefore);
    expect(store.serializeToXml()).toBe(before);
  });

  it('is exposed on FormSessionStore', async () => {
    const store = await makeStore();
    expect(store.getOutline()).toEqual(store.adapter.getOutline());
  });
});

const ITEXT_FORM_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Itext</h:title>
    <model>
      <itext>
        <translation lang="es" default="true()">
          <text id="sec:label"><value>Datos generales</value></text>
          <text id="plot:label"><value>Parcela</value></text>
        </translation>
      </itext>
      <instance>
        <data id="itext"><sec><name/></sec><plots><plot jr:template=""><area/></plot></plots></data>
      </instance>
      <bind nodeset="/data/sec/name" type="string"/>
      <bind nodeset="/data/plots/plot/area" type="int"/>
    </model>
  </h:head>
  <h:body>
    <group ref="/data/sec">
      <label ref="jr:itext('sec:label')"/>
      <input ref="/data/sec/name"><label>Nombre</label></input>
    </group>
    <group ref="/data/plots">
      <repeat nodeset="/data/plots/plot">
        <label ref="jr:itext('plot:label')"/>
        <input ref="/data/plots/plot/area"><label>Área</label></input>
      </repeat>
    </group>
  </h:body>
</h:html>`;

describe('FormAdapter.getOutline group/repeat labels', () => {
  it('resolves itext labels of groups and repeats', async () => {
    const store = await createFormStore(ITEXT_FORM_XML, {
      instanceXml: `<?xml version="1.0"?><data id="itext" xmlns:jr="http://openrosa.org/javarosa"><sec><name>x</name></sec><plots><plot><area>1</area></plot></plots></data>`,
    });
    const labels = store.adapter
      .getOutline()
      .filter((n) => n.kind !== 'question')
      .map((n) => n.label);
    expect(labels).toEqual(['Datos generales', null, 'Parcela']);
  });
});
