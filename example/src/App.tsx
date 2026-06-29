import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { Form, FormSessionStore } from '@nuup/xform-native';
import { parseDocument, createFormSession } from '@nuup/ts-rosa';
import { DOMParser } from '@xmldom/xmldom';

const DEMO_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Demo Form</h:title>
    <model>
      <instance>
        <data id="demo">
          <name/>
          <age/>
          <color/>
          <birthdate/>
          <photo/>
        </data>
      </instance>
      <bind nodeset="/data/name" type="string" required="true()"/>
      <bind nodeset="/data/age" type="int"/>
      <bind nodeset="/data/color" type="string"/>
      <bind nodeset="/data/birthdate" type="date"/>
      <bind nodeset="/data/photo" type="binary"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/name"><label>Name</label></input>
    <input ref="/data/age"><label>Age</label></input>
    <select1 ref="/data/color"><label>Favorite color</label><item><label>Red</label><value>red</value></item><item><label>Green</label><value>green</value></item><item><label>Blue</label><value>blue</value></item></select1>
    <input ref="/data/birthdate"><label>Birth date</label></input>
    <upload ref="/data/photo" mediatype="image/*"><label>Photo</label></upload>
  </h:body>
</h:html>`;

function parseXml(xml: string) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  return parseDocument(doc as unknown as Document);
}

const def = parseXml(DEMO_XML);
const session = createFormSession(def);
const store = new FormSessionStore(session);

export default function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Form store={store} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
});
