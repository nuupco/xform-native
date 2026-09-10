/**
 * allWidgetsForm — XForm de demo que cubre TODAS las variantes de widget/
 * appearance soportadas hoy por este repo (ver src/widgets/engine/appearance.ts
 * y src/__tests__/integration/xform-widgets-coverage.test.tsx), organizadas en
 * grupos por familia para navegar visualmente en la app sin depender de un
 * servidor Kobo. La sintaxis de itemsets/itext/range/mediatype está tomada de
 * los fixtures reales en src/__tests__/fixtures/xforms/*.xml — no es un
 * fixture de test, es contenido legible pensado para QA manual.
 *
 * El grupo de select1 "image-map" referencia un SVG (jr://images/test.svg)
 * resuelto por demoMediaResolver (ver abajo), que lo escribe una sola vez a
 * un archivo real bajo cacheDirectory y devuelve su file:// — Android's
 * native fetch (OkHttp-backed) no soporta el protocolo data:
 * ("MalformedURLException: unknown protocol: data"), así que un data: URI
 * falla ahí aunque funcione en Jest/Node.
 */
import type { KoboAsset } from '../services/apiClient';

// Sentinel xform_link — useFormLoad checks for this exact value to skip the
// Kobo fetch and use ALL_WIDGETS_DEMO_XML directly (no server, no caching).
export const DEMO_ALL_WIDGETS_XFORM_LINK = 'local://demo-all-widgets';

export const DEMO_ALL_WIDGETS_ASSET: KoboAsset = {
  uid: 'demo-all-widgets',
  name: '🧪 Demo: todas las variantes',
  deployment_status: 'demo',
  xform_link: DEMO_ALL_WIDGETS_XFORM_LINK,
};

/** The jr:// reference the o_image_map field's itext label carries. */
export const DEMO_IMAGE_MAP_JR_URI = 'jr://images/test.svg';

/** Two tappable regions, `id` matching o_image_map's choice `value`s exactly. */
const DEMO_IMAGE_MAP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
  <rect id="cafe" x="0" y="0" width="100" height="100" fill="#6f4e37" />
  <rect id="cacao" x="100" y="0" width="100" height="100" fill="#3c2415" />
</svg>`;

let _demoImageMapFileUri: string | null = null;

/** The jr:// reference video_intro's itext label carries (g_structure). */
export const DEMO_NOTE_VIDEO_JR_URI = 'jr://videos/introduccion.mp4';

// Small, public sample video — no bundled binary asset needed. Remote https:
// URIs work fine with fetch()/VideoView unlike the image-map SVG's data: URI
// (Android's OkHttp-backed fetch rejects data:, see the docblock above).
const DEMO_NOTE_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';

/** Resolves the demo's jr:// media references to real, loadable URIs. */
export async function demoMediaResolver(uri: string): Promise<string | null> {
  if (uri === DEMO_NOTE_VIDEO_JR_URI) return DEMO_NOTE_VIDEO_URL;
  if (uri !== DEMO_IMAGE_MAP_JR_URI) return null;
  if (_demoImageMapFileUri) return _demoImageMapFileUri;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const FileSystem = require('expo-file-system/legacy');
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? 'file:///tmp/';
  const fileUri = `${dir}demo-image-map.svg`;
  await FileSystem.writeAsStringAsync(fileUri, DEMO_IMAGE_MAP_SVG);
  _demoImageMapFileUri = fileUri;
  return fileUri;
}

export const ALL_WIDGETS_DEMO_XML = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>Demo: todas las variantes</h:title>
    <model>
      <instance>
        <data id="all-widgets-demo" version="1">
          <g_string>
            <s_default/>
            <s_multiline/>
            <s_numbers/>
            <s_url/>
            <s_masked/>
          </g_string>
          <g_numeric>
            <i_default/>
            <i_thousands/>
            <i_bearing/>
            <i_counter/>
            <dec_default/>
            <dec_thousands/>
            <long_default/>
            <long_thousands/>
          </g_numeric>
          <g_boolean>
            <b_default/>
          </g_boolean>
          <g_select1>
            <o_default/>
            <o_minimal/>
            <o_autocomplete/>
            <o_likert/>
            <o_columns/>
            <o_columns_pack/>
            <o_compact/>
            <o_no_buttons/>
            <o_quick/>
            <o_list/>
            <o_list_nolabel/>
            <o_label/>
            <o_columns_3/>
            <o_map/>
            <o_image_map/>
          </g_select1>
          <g_selectmulti>
            <m_default/>
            <m_minimal/>
            <m_columns/>
            <m_columns_pack/>
            <m_compact/>
            <m_autocomplete/>
            <m_likert/>
            <m_list_nolabel/>
            <m_columns_3/>
            <m_timed_grid/>
          </g_selectmulti>
          <g_datetime>
            <d_default/>
            <d_month_year/>
            <d_year/>
            <d_no_calendar/>
            <d_ethiopian/>
            <d_coptic/>
            <d_islamic/>
            <d_persian/>
            <d_buddhist/>
            <t_default/>
            <dt_default/>
          </g_datetime>
          <g_binary>
            <img_default/>
            <img_signature/>
            <img_annotate/>
            <img_selfie/>
            <img_front_camera/>
            <img_new/>
            <img_new_front/>
            <audio_default/>
            <video_default/>
            <file_default/>
          </g_binary>
          <g_geo>
            <point_default/>
            <point_placement_map/>
            <shape_default/>
            <trace_default/>
          </g_geo>
          <g_range>
            <r_default/>
            <r_no_ticks/>
            <r_picker/>
            <r_vertical/>
            <r_rating/>
          </g_range>
          <g_misc>
            <rank_default/>
            <trigger_default/>
            <note_default/>
          </g_misc>
          <g_structure>
            <g_plain>
              <st_plain_a/>
              <st_plain_b/>
            </g_plain>
            <g_fieldlist>
              <st_fl_a/>
              <st_fl_b/>
            </g_fieldlist>
            <video_intro/>
          </g_structure>
          <g_fieldlist_repeat>
            <st_flr_control/>
            <flr_items jr:template="">
              <st_flr_item/>
            </flr_items>
          </g_fieldlist_repeat>
          <rep_loose jr:template="">
            <st_loose/>
          </rep_loose>
          <g_rep_inside>
            <rep_in_group jr:template="">
              <st_rep_in_group/>
            </rep_in_group>
          </g_rep_inside>
          <rep_with_group jr:template="">
            <g_in_repeat>
              <st_group_in_repeat/>
            </g_in_repeat>
          </rep_with_group>
          <rep_outer jr:template="">
            <rep_inner jr:template="">
              <st_nested_repeat/>
            </rep_inner>
          </rep_outer>
        </data>
      </instance>

      <!-- Secondary instance for appearance="map" (o_map below): only
           dynamic itemsets carry a <geometry> per choice (ts-rosa's
           SelectChoice.geometry is itemset-only, see SelectOneWidget's
           docblock) — static <item> choices never resolve geometry, so this
           variant needs an itemset sourced from an inline instance like this
           one instead of plain <item> elements. -->
      <instance id="parcelas">
        <root>
          <item>
            <value>norte</value>
            <label>Parcela norte</label>
            <geometry>20.6597 -103.3496</geometry>
          </item>
          <item>
            <value>sur</value>
            <label>Parcela sur</label>
            <geometry>20.5679 -103.3891</geometry>
          </item>
        </root>
      </instance>

      <bind nodeset="/data/g_string/s_default" type="string"/>
      <bind nodeset="/data/g_string/s_multiline" type="string"/>
      <bind nodeset="/data/g_string/s_numbers" type="string"/>
      <bind nodeset="/data/g_string/s_url" type="string"/>
      <bind nodeset="/data/g_string/s_masked" type="string"/>

      <bind nodeset="/data/g_numeric/i_default" type="int"/>
      <bind nodeset="/data/g_numeric/i_thousands" type="int"/>
      <bind nodeset="/data/g_numeric/i_bearing" type="int"/>
      <bind nodeset="/data/g_numeric/i_counter" type="int"/>
      <bind nodeset="/data/g_numeric/dec_default" type="decimal"/>
      <bind nodeset="/data/g_numeric/dec_thousands" type="decimal"/>
      <bind nodeset="/data/g_numeric/long_default" type="long"/>
      <bind nodeset="/data/g_numeric/long_thousands" type="long"/>

      <bind nodeset="/data/g_boolean/b_default" type="boolean"/>

      <bind nodeset="/data/g_select1/o_default" type="string"/>
      <bind nodeset="/data/g_select1/o_minimal" type="string"/>
      <bind nodeset="/data/g_select1/o_autocomplete" type="string"/>
      <bind nodeset="/data/g_select1/o_likert" type="string"/>
      <bind nodeset="/data/g_select1/o_columns" type="string"/>
      <bind nodeset="/data/g_select1/o_columns_pack" type="string"/>
      <bind nodeset="/data/g_select1/o_compact" type="string"/>
      <bind nodeset="/data/g_select1/o_no_buttons" type="string"/>
      <bind nodeset="/data/g_select1/o_quick" type="string"/>
      <bind nodeset="/data/g_select1/o_list" type="string"/>
      <bind nodeset="/data/g_select1/o_list_nolabel" type="string"/>
      <bind nodeset="/data/g_select1/o_label" type="string"/>
      <bind nodeset="/data/g_select1/o_columns_3" type="string"/>
      <bind nodeset="/data/g_select1/o_map" type="string"/>
      <bind nodeset="/data/g_select1/o_image_map" type="string"/>

      <bind nodeset="/data/g_selectmulti/m_default" type="string"/>
      <bind nodeset="/data/g_selectmulti/m_minimal" type="string"/>
      <bind nodeset="/data/g_selectmulti/m_columns" type="string"/>
      <bind nodeset="/data/g_selectmulti/m_columns_pack" type="string"/>
      <bind nodeset="/data/g_selectmulti/m_compact" type="string"/>
      <bind nodeset="/data/g_selectmulti/m_autocomplete" type="string"/>
      <bind nodeset="/data/g_selectmulti/m_likert" type="string"/>
      <bind nodeset="/data/g_selectmulti/m_list_nolabel" type="string"/>
      <bind nodeset="/data/g_selectmulti/m_columns_3" type="string"/>
      <bind nodeset="/data/g_selectmulti/m_timed_grid" type="string"/>

      <bind nodeset="/data/g_datetime/d_default" type="date"/>
      <bind nodeset="/data/g_datetime/d_month_year" type="date"/>
      <bind nodeset="/data/g_datetime/d_year" type="date"/>
      <bind nodeset="/data/g_datetime/d_no_calendar" type="date"/>
      <bind nodeset="/data/g_datetime/d_ethiopian" type="date"/>
      <bind nodeset="/data/g_datetime/d_coptic" type="date"/>
      <bind nodeset="/data/g_datetime/d_islamic" type="date"/>
      <bind nodeset="/data/g_datetime/d_persian" type="date"/>
      <bind nodeset="/data/g_datetime/d_buddhist" type="date"/>
      <bind nodeset="/data/g_datetime/t_default" type="time"/>
      <bind nodeset="/data/g_datetime/dt_default" type="dateTime"/>

      <bind nodeset="/data/g_binary/img_default" type="binary"/>
      <bind nodeset="/data/g_binary/img_signature" type="binary"/>
      <bind nodeset="/data/g_binary/img_annotate" type="binary"/>
      <bind nodeset="/data/g_binary/img_selfie" type="binary"/>
      <bind nodeset="/data/g_binary/img_front_camera" type="binary"/>
      <bind nodeset="/data/g_binary/img_new" type="binary"/>
      <bind nodeset="/data/g_binary/img_new_front" type="binary"/>
      <bind nodeset="/data/g_binary/audio_default" type="binary"/>
      <bind nodeset="/data/g_binary/video_default" type="binary"/>
      <bind nodeset="/data/g_binary/file_default" type="binary"/>

      <bind nodeset="/data/g_geo/point_default" type="geopoint"/>
      <bind nodeset="/data/g_geo/point_placement_map" type="geopoint"/>
      <bind nodeset="/data/g_geo/shape_default" type="geoshape"/>
      <bind nodeset="/data/g_geo/trace_default" type="geotrace"/>

      <bind nodeset="/data/g_range/r_default" type="int"/>
      <bind nodeset="/data/g_range/r_no_ticks" type="int"/>
      <bind nodeset="/data/g_range/r_picker" type="int"/>
      <bind nodeset="/data/g_range/r_vertical" type="int"/>
      <bind nodeset="/data/g_range/r_rating" type="int"/>

      <bind nodeset="/data/g_misc/rank_default" type="string"/>
      <bind nodeset="/data/g_misc/trigger_default" type="string"/>
      <bind nodeset="/data/g_misc/note_default" type="string" readonly="true()"/>

      <bind nodeset="/data/g_structure/g_plain/st_plain_a" type="string"/>
      <bind nodeset="/data/g_structure/g_plain/st_plain_b" type="string"/>
      <bind nodeset="/data/g_structure/g_fieldlist/st_fl_a" type="string"/>
      <bind nodeset="/data/g_structure/g_fieldlist/st_fl_b" type="string"/>
      <bind nodeset="/data/g_structure/video_intro" type="string" readonly="true()"/>
      <bind nodeset="/data/g_fieldlist_repeat/st_flr_control" type="string"/>
      <bind nodeset="/data/g_fieldlist_repeat/flr_items/st_flr_item" type="string"/>
      <bind nodeset="/data/rep_loose/st_loose" type="string"/>
      <bind nodeset="/data/g_rep_inside/rep_in_group/st_rep_in_group" type="string"/>
      <bind nodeset="/data/rep_with_group/g_in_repeat/st_group_in_repeat" type="string"/>
      <bind nodeset="/data/rep_outer/rep_inner/st_nested_repeat" type="string"/>

      <itext>
        <translation lang="es">
          <text id="o_image_map:label">
            <value>Select1 image-map (tap the left/right half)</value>
            <value form="image">jr://images/test.svg</value>
          </text>
          <text id="video_intro:label">
            <value>Observa este video antes de responder.</value>
            <value form="video">jr://videos/introduccion.mp4</value>
          </text>
        </translation>
      </itext>
    </model>
  </h:head>
  <h:body>

    <group ref="/data/g_string">
      <label>String — variantes de texto</label>
      <input ref="/data/g_string/s_default">
        <label>Texto simple</label>
        <hint>string / input, sin appearance</hint>
      </input>
      <input ref="/data/g_string/s_multiline" appearance="multiline">
        <label>Texto en varias líneas</label>
        <hint>string / input, appearance="multiline"</hint>
      </input>
      <input ref="/data/g_string/s_numbers" appearance="numbers">
        <label>Solo números (como texto)</label>
        <hint>string / input, appearance="numbers"</hint>
      </input>
      <input ref="/data/g_string/s_url" appearance="url">
        <label>URL</label>
        <hint>string / input, appearance="url"</hint>
      </input>
      <input ref="/data/g_string/s_masked" appearance="masked">
        <label>Texto enmascarado</label>
        <hint>string / input, appearance="masked"</hint>
      </input>
    </group>

    <group ref="/data/g_numeric">
      <label>Numéricos — int / decimal / long</label>
      <input ref="/data/g_numeric/i_default">
        <label>Entero simple</label>
        <hint>int / input, sin appearance</hint>
      </input>
      <input ref="/data/g_numeric/i_thousands" appearance="thousands-sep">
        <label>Entero con separador de miles</label>
        <hint>int / input, appearance="thousands-sep"</hint>
      </input>
      <input ref="/data/g_numeric/i_bearing" appearance="bearing">
        <label>Rumbo/orientación (brújula)</label>
        <hint>int / input, appearance="bearing"</hint>
      </input>
      <input ref="/data/g_numeric/i_counter" appearance="counter">
        <label>Contador</label>
        <hint>int / input, appearance="counter"</hint>
      </input>
      <input ref="/data/g_numeric/dec_default">
        <label>Decimal simple</label>
        <hint>decimal / input, sin appearance</hint>
      </input>
      <input ref="/data/g_numeric/dec_thousands" appearance="thousands-sep">
        <label>Decimal con separador de miles</label>
        <hint>decimal / input, appearance="thousands-sep"</hint>
      </input>
      <input ref="/data/g_numeric/long_default">
        <label>Entero largo simple</label>
        <hint>long / input, sin appearance</hint>
      </input>
      <input ref="/data/g_numeric/long_thousands" appearance="thousands-sep">
        <label>Entero largo con separador de miles</label>
        <hint>long / input, appearance="thousands-sep"</hint>
      </input>
    </group>

    <group ref="/data/g_boolean">
      <label>Booleano</label>
      <input ref="/data/g_boolean/b_default">
        <label>Sí / No</label>
        <hint>boolean / input — ya no tiene variantes de appearance</hint>
      </input>
    </group>

    <group ref="/data/g_select1">
      <label>Select1 (selección única) — variantes</label>
      <select1 ref="/data/g_select1/o_default">
        <label>Default</label>
        <hint>selectOne / select1, sin appearance</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select1>
      <select1 ref="/data/g_select1/o_minimal" appearance="minimal">
        <label>Minimal (dropdown)</label>
        <hint>appearance="minimal"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select1>
      <select1 ref="/data/g_select1/o_autocomplete" appearance="autocomplete">
        <label>Autocomplete</label>
        <hint>appearance="autocomplete"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select1>
      <select1 ref="/data/g_select1/o_likert" appearance="likert">
        <label>Likert</label>
        <hint>appearance="likert"</hint>
        <item><label>Muy en desacuerdo</label><value>1</value></item>
        <item><label>En desacuerdo</label><value>2</value></item>
        <item><label>Neutral</label><value>3</value></item>
        <item><label>De acuerdo</label><value>4</value></item>
        <item><label>Muy de acuerdo</label><value>5</value></item>
      </select1>
      <select1 ref="/data/g_select1/o_columns" appearance="columns">
        <label>Columnas</label>
        <hint>appearance="columns"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select1>
      <select1 ref="/data/g_select1/o_columns_pack" appearance="columns-pack">
        <label>Columnas compactadas</label>
        <hint>appearance="columns-pack"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select1>
      <select1 ref="/data/g_select1/o_compact" appearance="compact">
        <label>Compacto</label>
        <hint>appearance="compact"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select1>
      <select1 ref="/data/g_select1/o_no_buttons" appearance="no-buttons">
        <label>Sin botones de radio</label>
        <hint>appearance="no-buttons"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select1>
      <select1 ref="/data/g_select1/o_quick" appearance="quick">
        <label>Quick (avanza al elegir)</label>
        <hint>appearance="quick"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select1>
      <select1 ref="/data/g_select1/o_list" appearance="list">
        <label>Lista</label>
        <hint>appearance="list"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select1>
      <select1 ref="/data/g_select1/o_list_nolabel" appearance="list-nolabel">
        <label>Lista sin etiqueta de pregunta</label>
        <hint>appearance="list-nolabel"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select1>
      <select1 ref="/data/g_select1/o_label" appearance="label">
        <label>Solo etiquetas (sin controles)</label>
        <hint>appearance="label"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select1>
      <select1 ref="/data/g_select1/o_columns_3" appearance="columns-3">
        <label>Columnas fijas (columns-3)</label>
        <hint>appearance="columns-3"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
        <item><label>Agave</label><value>agave</value></item>
      </select1>
      <select1 ref="/data/g_select1/o_map" appearance="map">
        <label>Mapa</label>
        <hint>appearance="map" — choices from the inline "parcelas" secondary instance, each with a geometry</hint>
        <itemset nodeset="instance('parcelas')/root/item">
          <value ref="value"/>
          <label ref="label"/>
          <geometry ref="geometry"/>
        </itemset>
      </select1>
      <select1 ref="/data/g_select1/o_image_map" appearance="image-map">
        <label ref="jr:itext('o_image_map:label')"/>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select1>
    </group>

    <group ref="/data/g_selectmulti">
      <label>Select (selección múltiple) — variantes</label>
      <select ref="/data/g_selectmulti/m_default">
        <label>Default</label>
        <hint>selectMulti / select, sin appearance</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select>
      <select ref="/data/g_selectmulti/m_minimal" appearance="minimal">
        <label>Minimal (dropdown)</label>
        <hint>appearance="minimal"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select>
      <select ref="/data/g_selectmulti/m_columns" appearance="columns">
        <label>Columnas</label>
        <hint>appearance="columns"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select>
      <select ref="/data/g_selectmulti/m_columns_pack" appearance="columns-pack">
        <label>Columnas compactadas</label>
        <hint>appearance="columns-pack"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select>
      <select ref="/data/g_selectmulti/m_compact" appearance="compact">
        <label>Compacto</label>
        <hint>appearance="compact"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select>
      <select ref="/data/g_selectmulti/m_autocomplete" appearance="autocomplete">
        <label>Autocomplete</label>
        <hint>appearance="autocomplete"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select>
      <select ref="/data/g_selectmulti/m_likert" appearance="likert">
        <label>Likert</label>
        <hint>appearance="likert"</hint>
        <item><label>Muy en desacuerdo</label><value>1</value></item>
        <item><label>De acuerdo</label><value>2</value></item>
      </select>
      <select ref="/data/g_selectmulti/m_list_nolabel" appearance="list-nolabel">
        <label>Lista sin etiqueta de pregunta</label>
        <hint>appearance="list-nolabel"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select>
      <select ref="/data/g_selectmulti/m_columns_3" appearance="columns-3">
        <label>Columnas fijas (columns-3)</label>
        <hint>appearance="columns-3"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
        <item><label>Agave</label><value>agave</value></item>
      </select>
      <select ref="/data/g_selectmulti/m_timed_grid" appearance="x-timed-grid">
        <label>Timed grid</label>
        <hint>appearance="x-timed-grid"</hint>
        <item><label>Café</label><value>cafe</value></item>
        <item><label>Cacao</label><value>cacao</value></item>
      </select>
    </group>

    <group ref="/data/g_datetime">
      <label>Fecha / hora — variantes de calendario</label>
      <input ref="/data/g_datetime/d_default">
        <label>Fecha default (gregoriano)</label>
        <hint>date / input, sin appearance</hint>
      </input>
      <input ref="/data/g_datetime/d_month_year" appearance="month-year">
        <label>Fecha mes/año</label>
        <hint>date / input, appearance="month-year"</hint>
      </input>
      <input ref="/data/g_datetime/d_year" appearance="year">
        <label>Fecha solo año</label>
        <hint>date / input, appearance="year"</hint>
      </input>
      <input ref="/data/g_datetime/d_no_calendar" appearance="no-calendar">
        <label>Fecha sin selector de calendario</label>
        <hint>date / input, appearance="no-calendar"</hint>
      </input>
      <input ref="/data/g_datetime/d_ethiopian" appearance="ethiopian">
        <label>Fecha calendario etíope</label>
        <hint>date / input, appearance="ethiopian"</hint>
      </input>
      <input ref="/data/g_datetime/d_coptic" appearance="coptic">
        <label>Fecha calendario copto</label>
        <hint>date / input, appearance="coptic"</hint>
      </input>
      <input ref="/data/g_datetime/d_islamic" appearance="islamic">
        <label>Fecha calendario islámico</label>
        <hint>date / input, appearance="islamic"</hint>
      </input>
      <input ref="/data/g_datetime/d_persian" appearance="persian">
        <label>Fecha calendario persa</label>
        <hint>date / input, appearance="persian"</hint>
      </input>
      <input ref="/data/g_datetime/d_buddhist" appearance="buddhist">
        <label>Fecha calendario budista</label>
        <hint>date / input, appearance="buddhist"</hint>
      </input>
      <input ref="/data/g_datetime/t_default">
        <label>Hora</label>
        <hint>time / input, sin appearance</hint>
      </input>
      <input ref="/data/g_datetime/dt_default">
        <label>Fecha y hora</label>
        <hint>dateTime / input, sin appearance</hint>
      </input>
    </group>

    <group ref="/data/g_binary">
      <label>Adjuntos — imagen / audio / video / archivo</label>
      <upload ref="/data/g_binary/img_default" mediatype="image/*">
        <label>Foto default</label>
        <hint>binary / upload, mediatype="image/*", sin appearance</hint>
      </upload>
      <upload ref="/data/g_binary/img_signature" mediatype="image/*" appearance="signature">
        <label>Firma</label>
        <hint>binary / upload image, appearance="signature"</hint>
      </upload>
      <upload ref="/data/g_binary/img_annotate" mediatype="image/*" appearance="annotate">
        <label>Foto anotada</label>
        <hint>binary / upload image, appearance="annotate"</hint>
      </upload>
      <upload ref="/data/g_binary/img_selfie" mediatype="image/*" appearance="selfie">
        <label>Selfie</label>
        <hint>binary / upload image, appearance="selfie"</hint>
      </upload>
      <upload ref="/data/g_binary/img_front_camera" mediatype="image/*" appearance="front-camera">
        <label>Foto cámara frontal</label>
        <hint>binary / upload image, appearance="front-camera"</hint>
      </upload>
      <upload ref="/data/g_binary/img_new" mediatype="image/*" appearance="new">
        <label>Foto nueva (solo cámara)</label>
        <hint>binary / upload image, appearance="new"</hint>
      </upload>
      <upload ref="/data/g_binary/img_new_front" mediatype="image/*" appearance="new-front">
        <label>Foto nueva cámara frontal</label>
        <hint>binary / upload image, appearance="new-front"</hint>
      </upload>
      <upload ref="/data/g_binary/audio_default" mediatype="audio/*">
        <label>Audio default</label>
        <hint>binary / upload, mediatype="audio/*", sin appearance</hint>
      </upload>
      <upload ref="/data/g_binary/video_default" mediatype="video/*">
        <label>Video default</label>
        <hint>binary / upload, mediatype="video/*", sin appearance</hint>
      </upload>
      <upload ref="/data/g_binary/file_default" mediatype="*/*">
        <label>Archivo genérico</label>
        <hint>binary / upload, sin mediatype específico</hint>
      </upload>
    </group>

    <group ref="/data/g_geo">
      <label>Geolocalización</label>
      <input ref="/data/g_geo/point_default">
        <label>Geopunto default</label>
        <hint>geopoint / input, sin appearance</hint>
      </input>
      <input ref="/data/g_geo/point_placement_map" appearance="placement-map">
        <label>Geopunto colocando pin en mapa</label>
        <hint>geopoint / input, appearance="placement-map"</hint>
      </input>
      <input ref="/data/g_geo/shape_default">
        <label>Geoforma (polígono)</label>
        <hint>geoshape / input, sin appearance</hint>
      </input>
      <input ref="/data/g_geo/trace_default">
        <label>Geotrazo (línea)</label>
        <hint>geotrace / input, sin appearance</hint>
      </input>
    </group>

    <group ref="/data/g_range">
      <label>Rango (slider)</label>
      <range ref="/data/g_range/r_default" start="1" end="5" step="1">
        <label>Rango default</label>
        <hint>range, start=1 end=5 step=1, sin appearance</hint>
      </range>
      <range ref="/data/g_range/r_no_ticks" start="1" end="5" step="1" appearance="no-ticks">
        <label>Rango sin marcas</label>
        <hint>range, appearance="no-ticks"</hint>
      </range>
      <range ref="/data/g_range/r_picker" start="1" end="5" step="1" appearance="picker">
        <label>Rango tipo picker</label>
        <hint>range, appearance="picker"</hint>
      </range>
      <range ref="/data/g_range/r_vertical" start="1" end="5" step="1" appearance="vertical">
        <label>Rango vertical</label>
        <hint>range, appearance="vertical"</hint>
      </range>
      <range ref="/data/g_range/r_rating" start="1" end="5" step="1" appearance="rating">
        <label>Rango tipo calificación (estrellas)</label>
        <hint>range, appearance="rating"</hint>
      </range>
    </group>

    <group ref="/data/g_misc">
      <label>Otros — rank / trigger / note</label>
      <rank ref="/data/g_misc/rank_default">
        <label>Ordená tus prioridades</label>
        <hint>rank, sin appearance</hint>
        <item><label>Precio justo</label><value>precio</value></item>
        <item><label>Certificación</label><value>certificacion</value></item>
        <item><label>Cercanía al comprador</label><value>cercania</value></item>
      </rank>
      <trigger ref="/data/g_misc/trigger_default">
        <label>Confirmá para continuar</label>
        <hint>trigger, sin appearance</hint>
      </trigger>
      <input ref="/data/g_misc/note_default" appearance="note">
        <label>Este es un texto informativo de solo lectura</label>
        <hint>string / input readonly, appearance="note"</hint>
      </input>
    </group>

    <group ref="/data/g_structure/g_plain">
      <label>Group simple (sin appearance)</label>
      <input ref="/data/g_structure/g_plain/st_plain_a">
        <label>Campo A</label>
        <hint>group sin appearance — navega de a un campo</hint>
      </input>
      <input ref="/data/g_structure/g_plain/st_plain_b">
        <label>Campo B</label>
        <hint>group sin appearance — navega de a un campo</hint>
      </input>
    </group>

    <group ref="/data/g_structure/g_fieldlist" appearance="field-list">
      <label>Group con appearance="field-list"</label>
      <input ref="/data/g_structure/g_fieldlist/st_fl_a">
        <label>Campo A (field-list)</label>
        <hint>debería verse todo junto en una pantalla (appearance=field-list) — si navega de a uno, es el gap conocido, no lo arregles, reportalo</hint>
      </input>
      <input ref="/data/g_structure/g_fieldlist/st_fl_b">
        <label>Campo B (field-list)</label>
        <hint>debería verse todo junto en una pantalla (appearance=field-list) — si navega de a uno, es el gap conocido, no lo arregles, reportalo</hint>
      </input>
    </group>

    <group ref="/data/g_fieldlist_repeat" appearance="field-list">
      <label>Group con appearance="field-list" que contiene un repeat</label>
      <input ref="/data/g_fieldlist_repeat/st_flr_control">
        <label>Campo de control (field-list)</label>
        <hint>debería mostrarse en la misma pantalla que el repeat de abajo</hint>
      </input>
      <repeat nodeset="/data/g_fieldlist_repeat/flr_items">
        <label>Item</label>
        <input ref="/data/g_fieldlist_repeat/flr_items/st_flr_item">
          <label>Campo dentro del repeat (field-list)</label>
          <hint>agregar/quitar instancias no debería sacarte de la pantalla</hint>
        </input>
      </repeat>
    </group>

    <group ref="/data/g_structure">
      <label>Nota con media</label>
      <input ref="/data/g_structure/video_intro" appearance="note">
        <label ref="jr:itext('video_intro:label')"/>
        <hint>note con media de video en el label — confirmar si NoteWidget la muestra o la ignora</hint>
      </input>
    </group>

    <repeat nodeset="/data/rep_loose">
      <label>Repeat suelto (sin group extra)</label>
      <input ref="/data/rep_loose/st_loose">
        <label>Campo dentro del repeat suelto</label>
        <hint>repeat simple, jr:template en el modelo</hint>
      </input>
    </repeat>

    <group ref="/data/g_rep_inside">
      <label>Group que contiene un repeat</label>
      <repeat nodeset="/data/g_rep_inside/rep_in_group">
        <label>Item del repeat dentro del group</label>
        <input ref="/data/g_rep_inside/rep_in_group/st_rep_in_group">
          <label>Campo dentro de group → repeat</label>
          <hint>group → repeat → campo</hint>
        </input>
      </repeat>
    </group>

    <repeat nodeset="/data/rep_with_group">
      <label>Repeat que contiene un group</label>
      <group ref="/data/rep_with_group/g_in_repeat">
        <label>Group dentro del repeat</label>
        <input ref="/data/rep_with_group/g_in_repeat/st_group_in_repeat">
          <label>Campo dentro de repeat → group</label>
          <hint>repeat → group → campo</hint>
        </input>
      </group>
    </repeat>

    <repeat nodeset="/data/rep_outer">
      <label>Repeat externo</label>
      <repeat nodeset="/data/rep_outer/rep_inner">
        <label>Repeat interno (anidado)</label>
        <input ref="/data/rep_outer/rep_inner/st_nested_repeat">
          <label>Campo dentro de repeat anidado</label>
          <hint>repeat dentro de repeat</hint>
        </input>
      </repeat>
    </repeat>

  </h:body>
</h:html>
`;
