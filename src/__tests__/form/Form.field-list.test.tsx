/**
 * appearance="field-list" on groups (design doc: "Implementar
 * appearance=\"field-list\" en groups").
 *
 * Scope: DIRECT `question` children of a field-list group are shown together
 * on one screen, and so are — since the field-list-in-field-list / repeat-in-
 * field-list extension — a DIRECT nested field-list group's own direct
 * questions (folded in under a sub-heading) and a DIRECT repeat's existing
 * instances (each instance's direct questions in their own block, with
 * add/remove controls). A PLAIN (non-field-list) nested group, or any
 * container found two levels deep (e.g. a repeat inside a repeat instance,
 * or a repeat inside a plain group), still aborts field-list for the whole
 * screen — the existing header + one-at-a-time navigation takes over exactly
 * as before this extension.
 *
 * Uses the REAL ts-rosa engine (createFormSession), not makeFakeSession: the
 * look-ahead walks the real navigator via stepForward/stepBackward, and the
 * abort case depends on real ref-path resolution for group/repeat/question
 * ancestry that the fake's script-driven navigator does not model precisely
 * enough to trust here.
 */

import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { DOMParser } from '@xmldom/xmldom';
import { parseDocument, createFormSession } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { Form } from '../../form/Form';

function parseXml(xml: string) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml') as unknown as Document;
  return parseDocument(doc);
}

function makeRealStore(xml: string) {
  const def = parseXml(xml);
  const session = createFormSession(def);
  return new FormSessionStore(session);
}

afterEach(async () => {
  await cleanup();
});

async function start() {
  await act(async () => {
    fireEvent.press(screen.getByTestId('bof-start-button'));
  });
}

// ---------------------------------------------------------------------------
// (a)-(c): a plain field-list group with two direct question children
// ---------------------------------------------------------------------------

const FIELD_LIST_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Field List</h:title>
    <model>
      <instance>
        <data id="field-list">
          <g1>
            <qa/>
            <qb/>
          </g1>
        </data>
      </instance>
      <bind nodeset="/data/g1/qa" type="string"/>
      <bind nodeset="/data/g1/qb" type="string" required="true()"/>
    </model>
  </h:head>
  <h:body>
    <group ref="/data/g1" appearance="field-list">
      <label>Sección</label>
      <input ref="/data/g1/qa"><label>Campo A</label></input>
      <input ref="/data/g1/qb"><label>Campo B</label></input>
    </group>
  </h:body>
</h:html>`;

describe('Form — group appearance="field-list"', () => {
  it('(a) shows both direct question children together on one screen', async () => {
    const store = makeRealStore(FIELD_LIST_XML);
    await render(<Form store={store} />);
    await start();

    expect(screen.getByText('Campo A')).toBeTruthy();
    expect(screen.getByText('Campo B')).toBeTruthy();
    expect(screen.getAllByTestId('string-input')).toHaveLength(2);
  });

  it('(b) Next with one invalid field blocks and shows that field\'s error without losing the other field', async () => {
    const store = makeRealStore(FIELD_LIST_XML);
    await render(<Form store={store} />);
    await start();

    // qb is required and left empty; qa is optional and left empty too, but
    // only qb should produce a block.
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    expect(screen.getByTestId('required-message')).toBeTruthy();
    // Did not advance — both fields (and their inputs) are still present.
    expect(screen.getByText('Campo A')).toBeTruthy();
    expect(screen.getByText('Campo B')).toBeTruthy();
    expect(screen.getAllByTestId('string-input')).toHaveLength(2);
  });

  it('(c) Next with both fields valid advances past the whole group at once', async () => {
    const store = makeRealStore(FIELD_LIST_XML);
    await render(<Form store={store} />);
    await start();

    const inputs = screen.getAllByTestId('string-input');
    await act(async () => {
      fireEvent.changeText(inputs[0]!, 'a value');
      fireEvent.changeText(inputs[1]!, 'b value');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    // Only two questions existed in the whole form, both inside the group —
    // advancing past it lands directly on eof.
    expect(screen.getByTestId('eof-surface')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// (d): a field-list group whose look-ahead hits a repeat before finishing —
// no longer aborts: the repeat is embedded as a `repeat-section` block.
// ---------------------------------------------------------------------------

const FIELD_LIST_WITH_REPEAT_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Field List With Repeat</h:title>
    <model>
      <instance>
        <data id="field-list-repeat">
          <g2>
            <qc/>
            <items jr:template="">
              <q/>
            </items>
          </g2>
        </data>
      </instance>
      <bind nodeset="/data/g2/qc" type="string"/>
      <bind nodeset="/data/g2/items/q" type="string"/>
    </model>
  </h:head>
  <h:body>
    <group ref="/data/g2" appearance="field-list">
      <label>Con repeat</label>
      <input ref="/data/g2/qc"><label>Campo C</label></input>
      <repeat nodeset="/data/g2/items">
        <label>Item</label>
        <input ref="/data/g2/items/q"><label>Q</label></input>
      </repeat>
    </group>
  </h:body>
</h:html>`;

describe('Form — field-list embeds a direct repeat (repeat-in-field-list)', () => {
  it('(d) 0 existing instances: qc + the repeat\'s "+ Agregar" prompt render on the SAME field-list screen', async () => {
    const store = makeRealStore(FIELD_LIST_WITH_REPEAT_XML);
    await render(<Form store={store} />);
    await start();

    // No fallback: qc is grouped in with the rest of the field-list screen,
    // not shown alone after a Next press.
    expect(screen.getByText('Campo C')).toBeTruthy();
    expect(screen.getAllByTestId('string-input')).toHaveLength(1);
    expect(screen.getByTestId('prompt-continue')).toBeTruthy();
    expect(screen.queryByTestId('field-list-repeat-remove-0')).toBeNull();
  });

  it('adding an instance from the field-list screen shows its fields + a remove button, without leaving the screen', async () => {
    const store = makeRealStore(FIELD_LIST_WITH_REPEAT_XML);
    await render(<Form store={store} />);
    await start();

    await act(async () => {
      fireEvent.press(screen.getByTestId('prompt-continue'));
    });

    expect(screen.getByText('Campo C')).toBeTruthy();
    expect(screen.getByText('Q')).toBeTruthy();
    expect(screen.getAllByTestId('string-input')).toHaveLength(2);
    expect(screen.getByTestId('field-list-repeat-remove-0')).toBeTruthy();

    // A second instance stacks alongside the first.
    await act(async () => {
      fireEvent.press(screen.getByTestId('prompt-continue'));
    });
    expect(screen.getAllByTestId('string-input')).toHaveLength(3);
    expect(screen.getByTestId('field-list-repeat-remove-1')).toBeTruthy();
  });

  it('removing an instance from the field-list screen drops its fields, without leaving the screen', async () => {
    const store = makeRealStore(FIELD_LIST_WITH_REPEAT_XML);
    await render(<Form store={store} />);
    await start();

    await act(async () => {
      fireEvent.press(screen.getByTestId('prompt-continue'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('prompt-continue'));
    });
    expect(screen.getAllByTestId('string-input')).toHaveLength(3);

    await act(async () => {
      fireEvent.press(screen.getByTestId('field-list-repeat-remove-0'));
    });

    // Back down to qc + one repeat instance.
    expect(screen.getAllByTestId('string-input')).toHaveLength(2);
    expect(screen.getByTestId('field-list-repeat-remove-0')).toBeTruthy();
    expect(screen.queryByTestId('field-list-repeat-remove-1')).toBeNull();
  });

  it('batch Next validates every existing repeat instance\'s fields too', async () => {
    const store = makeRealStore(FIELD_LIST_WITH_REPEAT_XML);
    await render(<Form store={store} />);
    await start();
    await act(async () => {
      fireEvent.press(screen.getByTestId('prompt-continue'));
    });

    // qc is optional; q (inside the one repeat instance) has no `required`
    // bind either in this fixture, so Next should simply advance past
    // everything (qc + the one instance) straight to eof.
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByTestId('eof-surface')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// A field-list group nested directly inside another field-list group: its
// direct questions fold into the same screen, under its own sub-heading.
// ---------------------------------------------------------------------------

const NESTED_FIELD_LIST_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Nested Field List</h:title>
    <model>
      <instance>
        <data id="nested-field-list">
          <outer>
            <qa/>
            <inner>
              <qb/>
            </inner>
          </outer>
        </data>
      </instance>
      <bind nodeset="/data/outer/qa" type="string"/>
      <bind nodeset="/data/outer/inner/qb" type="string"/>
    </model>
  </h:head>
  <h:body>
    <group ref="/data/outer" appearance="field-list">
      <label>Afuera</label>
      <input ref="/data/outer/qa"><label>Campo A</label></input>
      <group ref="/data/outer/inner" appearance="field-list">
        <label>Adentro</label>
        <input ref="/data/outer/inner/qb"><label>Campo B</label></input>
      </group>
    </group>
  </h:body>
</h:html>`;

describe('Form — field-list-in-field-list', () => {
  it('shows both groups\' fields on one screen, with the nested group\'s label as a sub-heading', async () => {
    const store = makeRealStore(NESTED_FIELD_LIST_XML);
    await render(<Form store={store} />);
    await start();

    expect(screen.getByText('Campo A')).toBeTruthy();
    expect(screen.getByText('Adentro')).toBeTruthy();
    expect(screen.getByText('Campo B')).toBeTruthy();
    expect(screen.getAllByTestId('string-input')).toHaveLength(2);

    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByTestId('eof-surface')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Known limit (unchanged): a repeat nested inside another repeat's own
// instance, both inside a field-list group, still aborts the whole plan.
// ---------------------------------------------------------------------------

const REPEAT_IN_REPEAT_FIELD_LIST_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Repeat In Repeat Field List</h:title>
    <model>
      <instance>
        <data id="repeat-in-repeat-field-list">
          <g3>
            <qd/>
            <outerItems jr:template="">
              <innerItems jr:template="">
                <q/>
              </innerItems>
            </outerItems>
            <outerItems>
              <innerItems jr:template="">
                <q/>
              </innerItems>
              <innerItems>
                <q/>
              </innerItems>
            </outerItems>
          </g3>
        </data>
      </instance>
      <bind nodeset="/data/g3/qd" type="string"/>
      <bind nodeset="/data/g3/outerItems/innerItems/q" type="string"/>
    </model>
  </h:head>
  <h:body>
    <group ref="/data/g3" appearance="field-list">
      <label>Con repeat anidado</label>
      <input ref="/data/g3/qd"><label>Campo D</label></input>
      <repeat nodeset="/data/g3/outerItems">
        <label>Outer item</label>
        <repeat nodeset="/data/g3/outerItems/innerItems">
          <label>Inner item</label>
          <input ref="/data/g3/outerItems/innerItems/q"><label>Q</label></input>
        </repeat>
      </repeat>
    </group>
  </h:body>
</h:html>`;

describe('Form — repeat-in-repeat inside field-list (documented out-of-scope limit)', () => {
  it('falls back to header + one-at-a-time navigation instead of grouping, even with an existing outer instance', async () => {
    const store = makeRealStore(REPEAT_IN_REPEAT_FIELD_LIST_XML);
    await render(<Form store={store} />);
    await start();

    // Group screen: only the header renders — the field-list look-ahead
    // aborted (a repeat-in-repeat follows qd before the group naturally
    // ends), so no question widget is grouped in with it.
    expect(screen.getAllByText('Con repeat anidado').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('string-input')).toBeNull();

    // Falls back to normal one-at-a-time navigation: Next steps to qd alone.
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });
    expect(screen.getByText('Campo D')).toBeTruthy();
    expect(screen.getAllByTestId('string-input')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Regression: a repeat (NOT itself field-list) containing a field-list group
// inside its instances already worked before this change (planFieldList only
// ever compares the concrete group ref against the current position — it
// never looks at the group's own ancestors) — confirmed explicitly here so
// it stays covered.
// ---------------------------------------------------------------------------

const REPEAT_CONTAINING_FIELD_LIST_GROUP_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Repeat Containing Field List Group</h:title>
    <model>
      <instance>
        <data id="repeat-containing-field-list-group">
          <items jr:template="">
            <inner>
              <qa/>
              <qb/>
            </inner>
          </items>
        </data>
      </instance>
      <bind nodeset="/data/items/inner/qa" type="string"/>
      <bind nodeset="/data/items/inner/qb" type="string"/>
    </model>
  </h:head>
  <h:body>
    <repeat nodeset="/data/items">
      <label>Parcela</label>
      <group ref="/data/items/inner" appearance="field-list">
        <label>Datos</label>
        <input ref="/data/items/inner/qa"><label>Campo A</label></input>
        <input ref="/data/items/inner/qb"><label>Campo B</label></input>
      </group>
    </repeat>
  </h:body>
</h:html>`;

describe('Form — repeat containing a field-list group (already worked, regression coverage)', () => {
  it('groups both fields together once navigated inside a repeat instance', async () => {
    const store = makeRealStore(REPEAT_CONTAINING_FIELD_LIST_GROUP_XML);
    await render(<Form store={store} />);
    await start();

    // First stop: prompt-new-repeat (no instances exist yet) — create one.
    await act(async () => {
      fireEvent.press(screen.getByTestId('prompt-continue'));
    });

    expect(screen.getByText('Campo A')).toBeTruthy();
    expect(screen.getByText('Campo B')).toBeTruthy();
    expect(screen.getAllByTestId('string-input')).toHaveLength(2);
  });
});
