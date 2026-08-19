/**
 * Form section-indicator wiring (Phase 7 / PR3).
 *
 * Integration coverage for wiring `SectionIndicator` into `Form.tsx`'s
 * render tree (design decisions 7, 8, 10, 14 — see
 * sdd/material3-campo-restyle/phase7-design / phase7-spec).
 *
 * Uses the REAL ts-rosa engine (via createFormSession), not
 * `makeFakeSession`, for the "indicator appears above the widget" case: the
 * Phase 7 design's own finding was that the fake navigator disagrees with
 * the real engine on label resolution (`getCurrentPath` depends on
 * `navigator.resolvePath`), so a fake-only test here would risk repeating
 * that exact false-pass trap.
 */

import { act } from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { DOMParser } from '@xmldom/xmldom';
import { parseDocument, createFormSession } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { Form } from '../form/Form';
import { makeFakeSession } from '../test-support/makeFakeSession';

function parseXml(xml: string) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml') as unknown as Document;
  return parseDocument(doc);
}

function makeRealStore(xml: string) {
  const def = parseXml(xml);
  const session = createFormSession(def);
  return new FormSessionStore(session);
}

function makeFakeStore(script: Parameters<typeof makeFakeSession>[0]) {
  return new FormSessionStore(makeFakeSession(script));
}

afterEach(async () => {
  await cleanup();
});

const NESTED_GROUP_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Nested Group</h:title>
    <model>
      <instance>
        <data id="nested-group">
          <g1>
            <q1/>
          </g1>
        </data>
      </instance>
      <bind nodeset="/data/g1/q1" type="string"/>
    </model>
  </h:head>
  <h:body>
    <group ref="/data/g1">
      <label>Datos del productor</label>
      <input ref="/data/g1/q1"><label>Nombre</label></input>
    </group>
  </h:body>
</h:html>`;

const FLAT_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Flat</h:title>
    <model>
      <instance>
        <data id="flat">
          <q1/>
        </data>
      </instance>
      <bind nodeset="/data/q1" type="string"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/q1"><label>Nombre</label></input>
  </h:body>
</h:html>`;

describe('Form — SectionIndicator wiring (PR3)', () => {
  it('shows section-indicator above the question widget for a question nested in a group (real engine)', async () => {
    const store = makeRealStore(NESTED_GROUP_XML);
    await render(<Form store={store} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });

    // A labeled group is now a reachable stop (Phase 7 PR1 label fix), so
    // this lands on the group's own screen first (its label doubles as the
    // section-indicator's only segment) — step past it to reach the nested
    // question.
    expect(screen.getByTestId('section-indicator')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    expect(screen.getByTestId('section-indicator')).toBeTruthy();
    expect(screen.getByText('Nombre')).toBeTruthy();
    expect(screen.getByTestId('string-input')).toBeTruthy();

    // Placement: the indicator markup precedes the widget markup in the
    // rendered tree (top-of-scroll-content requirement).
    const json = JSON.stringify(screen.toJSON());
    const indicatorIdx = json.indexOf('section-indicator');
    const widgetIdx = json.indexOf('string-input');
    expect(indicatorIdx).toBeGreaterThan(-1);
    expect(widgetIdx).toBeGreaterThan(-1);
    expect(indicatorIdx).toBeLessThan(widgetIdx);

    expect(screen.getByText('Datos del productor')).toBeTruthy();
  });

  it('renders no section-indicator for a top-level question with no ancestor group/repeat', async () => {
    const store = makeRealStore(FLAT_XML);
    await render(<Form store={store} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });

    expect(screen.getByText('Nombre')).toBeTruthy();
    expect(screen.queryByTestId('section-indicator')).toBeNull();
  });

  it('renderSectionIndicator slot replaces the default indicator', async () => {
    const store = makeRealStore(NESTED_GROUP_XML);
    await render(
      <Form
        store={store}
        slots={{
          renderSectionIndicator: ({ path }) => (
            <Text testID="custom-section-indicator">{`custom:${path.length}`}</Text>
          ),
        }}
      />
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    expect(screen.getByTestId('custom-section-indicator')).toBeTruthy();
    expect(screen.queryByTestId('section-indicator')).toBeNull();
  });

  it('renderSectionIndicator slot returning null hides the indicator entirely', async () => {
    const store = makeRealStore(NESTED_GROUP_XML);
    await render(
      <Form
        store={store}
        slots={{
          renderSectionIndicator: () => null,
        }}
      />
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId('bof-start-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('nav-next'));
    });

    expect(screen.queryByTestId('section-indicator')).toBeNull();
    expect(screen.queryByTestId('custom-section-indicator')).toBeNull();
    expect(screen.getByText('Nombre')).toBeTruthy();
  });

  it('deletes the old repeat-multiplicity testID (superseded by SectionIndicator copy)', async () => {
    const store = makeFakeStore({
      events: [
        { kind: 'bof' },
        {
          kind: 'repeat',
          ref: '/data/r1',
          label: 'Repeat One',
          multiplicity: 2,
        },
        { kind: 'eof' },
      ],
      nodeStates: {},
      relevance: {},
      choices: {},
      answerResults: {},
      values: {},
    });
    store.stepForward();
    await render(<Form store={store} />);

    expect(screen.getByText('Repeat One')).toBeTruthy();
    expect(screen.queryByTestId('repeat-multiplicity')).toBeNull();
    expect(screen.queryByText(/Entries:/)).toBeNull();
  });
});
