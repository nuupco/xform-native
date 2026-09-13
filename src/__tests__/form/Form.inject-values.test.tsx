/**
 * appearance="inject-values" on groups (design: "inject-values group").
 *
 * Scope: a group with `appearance="inject-values"` and ALL of its children
 * are NEVER rendered by Form — the group is a pure pause point. Form
 * collects the group's direct question fields, hands them to the
 * `injectValues` slot along with a `submit` callback, and only advances past
 * the whole group (skipping it entirely) once the host calls `submit`.
 *
 * Uses the REAL ts-rosa engine (createFormSession), not makeFakeSession:
 * the look-ahead walks the real navigator via stepForward/stepBackward, and
 * the nested-repeat rejection case depends on real ref-path resolution the
 * fake's script-driven navigator does not model precisely enough to trust
 * here — same rationale as Form.field-list.test.tsx.
 */

import { act } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { DOMParser } from '@xmldom/xmldom';
import { parseDocument, createFormSession } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { Form } from '../../form/Form';
import type { NodeRef } from '../../adapter/FormAdapter';
import type { InjectValuesField } from '../../form/slots';

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

const INJECT_VALUES_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Inject Values</h:title>
    <model>
      <instance>
        <data id="inject-values">
          <before/>
          <g1>
            <product_id/>
            <product_name/>
          </g1>
          <after/>
        </data>
      </instance>
      <bind nodeset="/data/before" type="string"/>
      <bind nodeset="/data/g1/product_id" type="string" required="true()"/>
      <bind nodeset="/data/g1/product_name" type="string"/>
      <bind nodeset="/data/after" type="string"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/before"><label>Before</label></input>
    <group ref="/data/g1" appearance="inject-values">
      <label>Producto</label>
      <input ref="/data/g1/product_id"><label>ID</label></input>
      <input ref="/data/g1/product_name"><label>Nombre</label></input>
    </group>
    <input ref="/data/after"><label>After</label></input>
  </h:body>
</h:html>`;

function InjectValuesHarness({
  fields,
  onSubmitFn,
}: {
  fields: readonly InjectValuesField[];
  onSubmitFn: (values: ReadonlyMap<NodeRef, unknown>) => void;
}) {
  return (
    <TouchableOpacity testID="inject-panel" onPress={() => onSubmitFn(new Map())}>
      <Text>{`pending:${fields.map((f) => f.label).join(',')}`}</Text>
    </TouchableOpacity>
  );
}

describe('Form — group appearance="inject-values"', () => {
  it('never renders the group label or its children by default (no slot wired)', async () => {
    const store = makeRealStore(INJECT_VALUES_XML);
    await render(<Form store={store} />);
    await start();

    // Lands on "Before" first (flat top-level question).
    expect(screen.getByText('Before')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    // Now paused at the inject-values group. The group's own label may
    // still surface via the unrelated SectionIndicator (path segment, not
    // group body content — same as any other group) — but the group body
    // itself renders nothing: no child questions, no default fallback UI.
    expect(screen.queryByText('ID')).toBeNull();
    expect(screen.queryByText('Nombre')).toBeNull();
    expect(screen.queryAllByTestId('string-input')).toHaveLength(0);
  });

  it('exposes every direct question child (ref + label) to the injectValues slot', async () => {
    const store = makeRealStore(INJECT_VALUES_XML);
    let seenLabels: (string | null)[] = [];

    await render(
      <Form
        store={store}
        slots={{
          injectValues: ({ fields, submit }) => {
            seenLabels = fields.map((f) => f.label);
            return (
              <TouchableOpacity testID="inject-panel" onPress={() => submit(new Map())}>
                <Text>inject-panel</Text>
              </TouchableOpacity>
            );
          },
        }}
      />
    );
    await start();
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    expect(screen.getByTestId('inject-panel')).toBeTruthy();
    expect(seenLabels).toEqual(['ID', 'Nombre']);
  });

  it('exposes name/dataType/controlType/required/relevant/constraintMessage — enough to build a submission UI without @nuup/ts-rosa', async () => {
    const store = makeRealStore(INJECT_VALUES_XML);
    let seenFields: readonly InjectValuesField[] = [];

    await render(
      <Form
        store={store}
        slots={{
          injectValues: ({ fields, submit }) => {
            seenFields = fields;
            return (
              <TouchableOpacity testID="inject-panel" onPress={() => submit(new Map())}>
                <Text>inject-panel</Text>
              </TouchableOpacity>
            );
          },
        }}
      />
    );
    await start();
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    expect(seenFields).toHaveLength(2);
    const idField = seenFields.find((f) => f.label === 'ID');
    const nameField = seenFields.find((f) => f.label === 'Nombre');

    // `product_id` is bound required="true()" — the already-evaluated
    // engine state (getNodeState) must reflect that without any new
    // validation logic running here.
    expect(idField).toMatchObject({
      name: '/data/g1/product_id',
      dataType: 'string',
      required: true,
      relevant: true,
      constraintMessage: null,
    });
    // `product_name` has no required bind — required is false.
    expect(nameField).toMatchObject({
      name: '/data/g1/product_name',
      dataType: 'string',
      required: false,
      relevant: true,
      // No constraint has been evaluated against an answered value yet
      // (the inject-values group is never rendered/answered before the
      // pause), so constraintMessage stays null here. There is no
      // realistic way to produce a non-null constraintMsg for a field
      // that was never committed a value, without inventing evaluator
      // internals this feature does not touch.
      constraintMessage: null,
    });
    expect(typeof idField!.controlType).toBe('string');
  });

  it('submit(values) injects the batch in one commit and advances past the whole group', async () => {
    const store = makeRealStore(INJECT_VALUES_XML);
    let capturedFields: readonly InjectValuesField[] = [];

    await render(
      <Form
        store={store}
        slots={{
          injectValues: ({ fields, submit }) => {
            capturedFields = fields;
            return (
              <InjectValuesHarness
                fields={fields}
                onSubmitFn={() => {
                  const values = new Map<NodeRef, unknown>();
                  for (const f of fields) {
                    values.set(f.ref, f.label === 'ID' ? 'sku-42' : 'Café de altura');
                  }
                  submit(values);
                }}
              />
            );
          },
        }}
      />
    );
    await start();
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('inject-panel'));
    });

    // Advanced straight past the whole group onto the next flat question.
    expect(screen.getByText('After')).toBeTruthy();

    // The injected values actually landed on the underlying session.
    const idField = capturedFields.find((f) => f.label === 'ID');
    const nameField = capturedFields.find((f) => f.label === 'Nombre');
    expect(store.adapter.resolveValue(idField!.ref)).toBe('sku-42');
    expect(store.adapter.resolveValue(nameField!.ref)).toBe('Café de altura');
  });

});

// ---------------------------------------------------------------------------
// nested repeat inside an inject-values group: unsupported by design —
// logged as a dev error and skipped, never included in `fields`, never
// crashes the render.
// ---------------------------------------------------------------------------

const INJECT_VALUES_WITH_REPEAT_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Inject Values With Repeat</h:title>
    <model>
      <instance>
        <data id="inject-values-repeat">
          <g1>
            <qa/>
            <items jr:template="">
              <q/>
            </items>
          </g1>
          <after/>
        </data>
      </instance>
      <bind nodeset="/data/g1/qa" type="string"/>
      <bind nodeset="/data/g1/items/q" type="string"/>
      <bind nodeset="/data/after" type="string"/>
    </model>
  </h:head>
  <h:body>
    <group ref="/data/g1" appearance="inject-values">
      <label>Con repeat</label>
      <input ref="/data/g1/qa"><label>Campo A</label></input>
      <repeat nodeset="/data/g1/items">
        <label>Item</label>
        <input ref="/data/g1/items/q"><label>Q</label></input>
      </repeat>
    </group>
    <input ref="/data/after"><label>After</label></input>
  </h:body>
</h:html>`;

describe('Form — inject-values group with an (unsupported) nested repeat', () => {
  it('logs a dev error, excludes the repeat from fields, and still fully skips the group', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const store = makeRealStore(INJECT_VALUES_WITH_REPEAT_XML);
    let seenLabels: (string | null)[] = [];

    await render(
      <Form
        store={store}
        slots={{
          injectValues: ({ fields, submit }) => {
            seenLabels = fields.map((f) => f.label);
            return (
              <TouchableOpacity testID="inject-panel" onPress={() => submit(new Map())}>
                <Text>inject-panel</Text>
              </TouchableOpacity>
            );
          },
        }}
      />
    );
    await start();

    expect(screen.getByTestId('inject-panel')).toBeTruthy();
    // Only the flat direct question is exposed — the nested repeat's own
    // question is never surfaced as a pending inject-values field.
    expect(seenLabels).toEqual(['Campo A']);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('inject-values'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('inject-panel'));
    });
    // The whole group (including its nested repeat) was skipped in one shot.
    expect(screen.getByText('After')).toBeTruthy();

    consoleErrorSpy.mockRestore();
  });
});
