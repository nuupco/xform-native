/**
 * Task 3: createFormStore — factory tests against the REAL ts-rosa engine.
 *
 * createFormStore's entire job is correctly wiring real engine calls
 * (parseForm, resolveExternalInstances, registerXmlParser, createFormSession),
 * so it must be tested against the real engine, not makeFakeSession.
 */

import { createFormStore } from '../createFormStore';
import { FormSessionStore } from '../store/FormSessionStore';

const PLAIN_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Plain Form</h:title>
    <model>
      <instance>
        <data id="plain">
          <name/>
        </data>
      </instance>
      <bind nodeset="/data/name" type="string"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/name"><label>Name</label></input>
  </h:body>
</h:html>`;

function lastSavedXml() {
  return `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Last Saved Form</h:title>
    <model>
      <instance>
        <data id="test">
          <name/>
        </data>
      </instance>
      <instance id="last-saved" src="jr://instance/last-saved"/>
      <bind nodeset="/data/name" type="string"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/name"><label>Name</label></input>
  </h:body>
</h:html>`;
}

function csvExternalXml() {
  return `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>CSV External Form</h:title>
    <model>
      <instance>
        <data id="test">
          <name/>
        </data>
      </instance>
      <instance id="cities" src="jr://file-csv/cities.csv"/>
      <bind nodeset="/data/name" type="string"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/name"><label>Name</label></input>
  </h:body>
</h:html>`;
}

function xmlExternalXml() {
  return `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>XML External Form</h:title>
    <model>
      <instance>
        <data id="test">
          <name/>
        </data>
      </instance>
      <instance id="choices" src="jr://file/choices.xml"/>
      <bind nodeset="/data/name" type="string"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/name"><label>Name</label></input>
  </h:body>
</h:html>`;
}

describe('createFormStore — happy path', () => {
  it('parses plain XML with no external instances and returns a working store', async () => {
    const store = await createFormStore(PLAIN_XML);
    expect(store).toBeInstanceOf(FormSessionStore);
    const ev = store.adapter.getCurrentEvent();
    expect(ev.kind).toBe('bof');
  });
});

describe('createFormStore — last-saved external instance', () => {
  it('with no resolver supplied, resolves to empty tree without throwing', async () => {
    const store = await createFormStore(lastSavedXml());
    expect(store).toBeInstanceOf(FormSessionStore);
  });

  it('with a resolver supplied, uses the resolver data', async () => {
    const lastSavedData = `<data><name>Prev</name></data>`;
    const store = await createFormStore(lastSavedXml(), {
      externalInstanceResolver: {
        resolve: async () => lastSavedData,
      },
    });
    expect(store).toBeInstanceOf(FormSessionStore);
  });
});

describe('createFormStore — jr://file-csv external instance', () => {
  it('with a resolver supplied, uses the resolver data', async () => {
    const store = await createFormStore(csvExternalXml(), {
      externalInstanceResolver: {
        resolve: async () => 'name\nMerida\n',
      },
    });
    expect(store).toBeInstanceOf(FormSessionStore);
  });

  it('with NO resolver supplied, throws an explicit error naming the URI', async () => {
    await expect(createFormStore(csvExternalXml())).rejects.toThrow(
      /jr:\/\/file-csv\/cities\.csv/
    );
  });
});

describe('createFormStore — jr://file/*.xml external instance', () => {
  it('with a resolver supplied, uses the resolver data', async () => {
    const store = await createFormStore(xmlExternalXml(), {
      externalInstanceResolver: {
        resolve: async () => `<root><item><label>A</label></item></root>`,
      },
    });
    expect(store).toBeInstanceOf(FormSessionStore);
  });

  it('with NO resolver supplied, throws an explicit error naming the URI', async () => {
    await expect(createFormStore(xmlExternalXml())).rejects.toThrow(
      /jr:\/\/file\/choices\.xml/
    );
  });
});

describe('createFormStore — instanceXml passthrough', () => {
  it('hydrates the session from the supplied instanceXml', async () => {
    const instanceXml = `<data id="plain"><name>Hydrated</name></data>`;
    const store = await createFormStore(PLAIN_XML, { instanceXml });
    store.adapter.stepForward();
    const ref = (store.adapter.getCurrentEvent() as { ref?: unknown }).ref;
    expect(ref).toBeDefined();
    const value = store.adapter.resolveValue(ref as never);
    expect(value).toBe('Hydrated');
  });
});

describe('createFormStore — idempotency', () => {
  it('can be called twice in the same process without breaking', async () => {
    const store1 = await createFormStore(PLAIN_XML);
    const store2 = await createFormStore(PLAIN_XML);
    expect(store1).toBeInstanceOf(FormSessionStore);
    expect(store2).toBeInstanceOf(FormSessionStore);
  });
});
