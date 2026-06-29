export const COMPREHENSIVE_XFORM = `<?xml version="1.0" encoding="UTF-8"?>
<h:html
  xmlns="http://www.w3.org/2002/xforms"
  xmlns:h="http://www.w3.org/1999/xhtml"
  xmlns:ev="http://www.w3.org/2001/xml-events"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:jr="http://openrosa.org/javarosa"
  xmlns:orx="http://openrosa.org/xforms"
  xmlns:odk="http://www.opendatakit.org/xforms">
  <h:head>
    <h:title>Enketo Full Compatibility Test</h:title>
    <model>
      <itext>
        <translation lang="English" default="true()">

          <text id="q_it_text:label"><value>iText Demo — Text Field</value></text>
          <text id="q_it_text:hint"><value>Enter any text to demonstrate iText internationalization</value></text>

          <text id="q_it_num:label"><value>iText Demo — Numeric Field</value></text>
          <text id="q_it_num:hint"><value>Enter a number to demonstrate iText with integer type</value></text>
          <text id="q_it_num:constraintMsg"><value>Please enter a valid number</value></text>

          <text id="q_it_select:label"><value>iText Demo — Select Field</value></text>
          <text id="q_it_select:hint"><value>Choose one option to demonstrate iText with select_one</value></text>

          <text id="q_it_req:label"><value>iText Demo — Required Field</value></text>
          <text id="q_it_req:hint"><value>This field is required — demonstrates iText required message</value></text>
          <text id="q_it_req:requiredMsg"><value>This field is required and cannot be left blank</value></text>

          <text id="q_app_vertical:label"><value>Appearance: vertical — Select with vertical layout</value></text>
          <text id="q_app_vertical:hint"><value>Options displayed vertically using appearance="vertical"</value></text>

          <text id="q_app_c1:label"><value>Appearance: compact — Compact single-column select</value></text>
          <text id="q_app_c1:hint"><value>Options displayed using appearance="compact"</value></text>

          <text id="q_app_c2:label"><value>Appearance: compact-2 — Two-column compact select</value></text>
          <text id="q_app_c2:hint"><value>Options displayed in two columns using appearance="compact-2"</value></text>

          <text id="q_app_c3:label"><value>Appearance: compact-3 — Three-column compact select</value></text>
          <text id="q_app_c3:hint"><value>Options displayed in three columns using appearance="compact-3"</value></text>

          <text id="q_app_c4:label"><value>Appearance: compact-4 — Four-column compact select</value></text>
          <text id="q_app_c4:hint"><value>Options displayed in four columns using appearance="compact-4"</value></text>

          <text id="q_app_qc:label"><value>Appearance: quickcompact — Quick compact select</value></text>
          <text id="q_app_qc:hint"><value>Options displayed using appearance="quickcompact"</value></text>

          <text id="q_app_qc1:label"><value>Appearance: quickcompact-1 — Single-column quick compact</value></text>
          <text id="q_app_qc1:hint"><value>Options displayed using appearance="quickcompact-1"</value></text>

          <text id="q_app_qc2:label"><value>Appearance: quickcompact-2 — Two-column quick compact</value></text>
          <text id="q_app_qc2:hint"><value>Options displayed using appearance="quickcompact-2"</value></text>

          <text id="q_app_qc3:label"><value>Appearance: quickcompact-3 — Three-column quick compact</value></text>
          <text id="q_app_qc3:hint"><value>Options displayed using appearance="quickcompact-3"</value></text>

          <text id="q_app_qc4:label"><value>Appearance: quickcompact-4 — Four-column quick compact</value></text>
          <text id="q_app_qc4:hint"><value>Options displayed using appearance="quickcompact-4"</value></text>

          <text id="q_app_label:label"><value>Appearance: label — Label-only appearance select</value></text>
          <text id="q_app_label:hint"><value>Options displayed using appearance="label" (no input shown)</value></text>

          <text id="q_app_imagemap:label"><value>Appearance: image-map — SVG image map select</value></text>
          <text id="q_app_imagemap:hint"><value>Select regions on an image map using appearance="image-map"</value></text>

          <text id="g_tablelist:label"><value>Appearance: table-list — Grid layout group</value></text>

          <text id="q_tl_a:label"><value>Table-list Column A — Yes/No</value></text>
          <text id="q_tl_a:hint"><value>First column in table-list appearance</value></text>

          <text id="q_tl_b:label"><value>Table-list Column B — Category</value></text>
          <text id="q_tl_b:hint"><value>Second column in table-list appearance</value></text>

          <text id="q_tl_c:label"><value>Table-list Column C — Likert</value></text>
          <text id="q_tl_c:hint"><value>Third column in table-list appearance</value></text>

          <text id="q_ml_img:label">
            <value>Label with embedded image</value>
            <value form="image">jr://images/q_ml_img.jpg</value>
          </text>
          <text id="q_ml_img:hint"><value>This question demonstrates an image embedded in the label</value></text>

          <text id="q_ml_audio:label">
            <value>Label with embedded audio</value>
            <value form="audio">jr://audio/q_ml_audio.mp3</value>
          </text>
          <text id="q_ml_audio:hint"><value>This question demonstrates audio embedded in the label</value></text>

          <text id="q_ml_video:label">
            <value>Label with embedded video</value>
            <value form="video">jr://video/q_ml_video.mp4</value>
          </text>
          <text id="q_ml_video:hint"><value>This question demonstrates video embedded in the label</value></text>

          <text id="q_mc_media:label"><value>Select with media options — Choose one</value></text>
          <text id="q_mc_media:hint"><value>Each option below has associated media (audio or image)</value></text>

          <text id="opt_media1:label">
            <value>Audio option</value>
            <value form="audio">jr://audio/opt1.mp3</value>
          </text>
          <text id="opt_media2:label">
            <value>Image option</value>
            <value form="image">jr://images/opt2.jpg</value>
          </text>
          <text id="opt_media3:label">
            <value>Video option</value>
            <value form="video">jr://video/opt3.mp4</value>
          </text>

          <text id="q_country:label"><value>Country</value></text>
          <text id="q_country:hint"><value>Select the country where the project is located</value></text>
          <text id="q_country:requiredMsg"><value>Country selection is required</value></text>

          <text id="q_state2:label"><value>State / Department</value></text>
          <text id="q_state2:hint"><value>Select the state or department (filtered by country)</value></text>
          <text id="q_state2:requiredMsg"><value>State or department selection is required</value></text>

          <text id="q_city2:label"><value>Municipality / City</value></text>
          <text id="q_city2:hint"><value>Select the municipality or city (filtered by state)</value></text>
          <text id="q_city2:requiredMsg"><value>Municipality or city selection is required</value></text>

          <text id="q_community2:label"><value>Community / Locality</value></text>
          <text id="q_community2:hint"><value>Select the community or locality (filtered by city)</value></text>
          <text id="q_community2:requiredMsg"><value>Community selection is required</value></text>

          <text id="q_cf_complex:label"><value>Complex Cascade Filter — Sector</value></text>
          <text id="q_cf_complex:hint"><value>Select a sector type filtered by multiple criteria</value></text>

          <text id="r3_projects:label"><value>Projects</value></text>
          <text id="r3_activities:label"><value>Activities</value></text>
          <text id="r3_tasks:label"><value>Tasks</value></text>

          <text id="rp3_name:label"><value>Project Name</value></text>
          <text id="rp3_name:hint"><value>Enter the full name of this project</value></text>
          <text id="rp3_name:requiredMsg"><value>Project name is required</value></text>

          <text id="rp3_budget:label"><value>Project Budget (MXN)</value></text>
          <text id="rp3_budget:hint"><value>Enter the total budget allocated to this project in Mexican pesos</value></text>
          <text id="rp3_budget:constraintMsg"><value>Budget must be a positive number</value></text>

          <text id="rp3_status:label"><value>Project Status</value></text>
          <text id="rp3_status:hint"><value>Select the current implementation status of this project</value></text>

          <text id="ra3_name:label"><value>Activity Name</value></text>
          <text id="ra3_name:hint"><value>Enter the name of this activity within the project</value></text>
          <text id="ra3_name:requiredMsg"><value>Activity name is required</value></text>

          <text id="ra3_status:label"><value>Activity Status</value></text>
          <text id="ra3_status:hint"><value>Select the current status of this activity</value></text>

          <text id="ra3_pos:label"><value>Activity Position / Order</value></text>
          <text id="ra3_pos:hint"><value>Indicate the sequential position of this activity in the project plan</value></text>

          <text id="ra3_cur:label"><value>Activity Currency</value></text>
          <text id="ra3_cur:hint"><value>Select the currency used for this activity's budget</value></text>

          <text id="rt3_name:label"><value>Task Name</value></text>
          <text id="rt3_name:hint"><value>Enter a brief, descriptive name for this task</value></text>
          <text id="rt3_name:requiredMsg"><value>Task name is required</value></text>

          <text id="rt3_pct:label"><value>Task Completion (%)</value></text>
          <text id="rt3_pct:hint"><value>Enter the percentage of this task that has been completed (0–100)</value></text>
          <text id="rt3_pct:constraintMsg"><value>Percentage must be between 0 and 100</value></text>

          <text id="rt3_hours:label"><value>Hours Worked</value></text>
          <text id="rt3_hours:hint"><value>Enter the number of hours invested in this task</value></text>
          <text id="rt3_hours:constraintMsg"><value>Hours must be a positive decimal number</value></text>

          <text id="rt3_done:label"><value>Task Completed?</value></text>
          <text id="rt3_done:hint"><value>Indicate whether this task has been fully completed</value></text>

          <text id="rt3_idx:label"><value>Task Index</value></text>
          <text id="rt3_idx:hint"><value>Auto-calculated sequential index of this task within the activity</value></text>

          <text id="q_geo_fenced:label"><value>Geopoint — Geofenced Location</value></text>
          <text id="q_geo_fenced:hint"><value>Record your GPS coordinates; submission is only valid within the allowed area</value></text>
          <text id="q_geo_fenced:constraintMsg"><value>Your location is outside the permitted geographic boundary</value></text>

          <text id="q_ff1:label"><value>Select from File — Primary List</value></text>
          <text id="q_ff1:hint"><value>Options are loaded from an external CSV or XML file</value></text>

          <text id="q_ff2:label"><value>Select from File — Filtered List</value></text>
          <text id="q_ff2:hint"><value>Options filtered from external file based on previous answer</value></text>

          <text id="g_rel_adv:label"><value>Advanced Relevance — Conditional Group</value></text>

          <text id="q_rel_a:label"><value>Relevance Trigger — Select condition</value></text>
          <text id="q_rel_a:hint"><value>Your answer here will control whether the following questions appear</value></text>

          <text id="q_rel_b:label"><value>Relevant when A = Yes — Secondary question</value></text>
          <text id="q_rel_b:hint"><value>This question appears only when the trigger above is answered affirmatively</value></text>

          <text id="q_rel_c:label"><value>Relevant when A and B match — Tertiary question</value></text>
          <text id="q_rel_c:hint"><value>This question appears only when both prior conditions are satisfied</value></text>

          <text id="q_con_email:label"><value>Email Address</value></text>
          <text id="q_con_email:hint"><value>Enter a valid email address (e.g. name@example.com)</value></text>
          <text id="q_con_email:constraintMsg"><value>Please enter a valid email address</value></text>
          <text id="q_con_email:requiredMsg"><value>An email address is required</value></text>

          <text id="q_con_cross:label"><value>Cross-field Constrained Amount</value></text>
          <text id="q_con_cross:hint"><value>Enter an amount; it must not exceed the budget entered for this project</value></text>
          <text id="q_con_cross:constraintMsg"><value>This amount cannot exceed the project budget</value></text>

          <text id="q_con_date_min:label"><value>Start Date</value></text>
          <text id="q_con_date_min:hint"><value>Select the project start date (cannot be in the past)</value></text>
          <text id="q_con_date_min:constraintMsg"><value>Start date cannot be earlier than today</value></text>

          <text id="q_con_date_max:label"><value>End Date</value></text>
          <text id="q_con_date_max:hint"><value>Select the project end date (must be after the start date)</value></text>
          <text id="q_con_date_max:constraintMsg"><value>End date must be after the start date</value></text>

          <text id="q_def_once:label"><value>Default (Once) — Pre-filled field</value></text>
          <text id="q_def_once:hint"><value>This field has a one-time default value that can be edited</value></text>

          <text id="q_def_chain:label"><value>Chained Default — Inherits from previous answer</value></text>
          <text id="q_def_chain:hint"><value>Default value is derived from an earlier field; can be overridden</value></text>

          <text id="q_def_today:label"><value>Default Date — Today</value></text>
          <text id="q_def_today:hint"><value>Defaults to today's date; change only if the event occurred on a different day</value></text>

          <text id="calc_not_fn:label"><value>Calc: not() function result</value></text>
          <text id="calc_not_fn:hint"><value>Read-only — demonstrates the not() XPath function</value></text>

          <text id="calc_mod_fn:label"><value>Calc: mod operator result</value></text>
          <text id="calc_mod_fn:hint"><value>Read-only — demonstrates the modulo operator in XPath</value></text>

          <text id="calc_boolstr:label"><value>Calc: boolean-from-string() result</value></text>
          <text id="calc_boolstr:hint"><value>Read-only — demonstrates the boolean-from-string() function</value></text>

          <text id="calc_uuid_fn:label"><value>Calc: uuid() — Unique identifier</value></text>
          <text id="calc_uuid_fn:hint"><value>Read-only — auto-generated UUID using the uuid() function</value></text>

          <text id="calc_join_fn:label"><value>Calc: join() — Concatenated values</value></text>
          <text id="calc_join_fn:hint"><value>Read-only — demonstrates joining multiple values with a separator</value></text>

          <text id="calc_max_fn:label"><value>Calc: max() — Maximum value</value></text>
          <text id="calc_max_fn:hint"><value>Read-only — demonstrates the max() aggregate function</value></text>

          <text id="calc_min_fn:label"><value>Calc: min() — Minimum value</value></text>
          <text id="calc_min_fn:hint"><value>Read-only — demonstrates the min() aggregate function</value></text>

          <text id="calc_sum_fn:label"><value>Calc: sum() — Total of repeated values</value></text>
          <text id="calc_sum_fn:hint"><value>Read-only — demonstrates the sum() function over a repeat nodeset</value></text>

          <text id="s_t1:label"><value>Stress Test — Text 1</value></text>
          <text id="s_t1:hint"><value>Enter any text (stress test field 1 of 5)</value></text>

          <text id="s_t2:label"><value>Stress Test — Text 2</value></text>
          <text id="s_t2:hint"><value>Enter any text (stress test field 2 of 5)</value></text>

          <text id="s_t3:label"><value>Stress Test — Text 3</value></text>
          <text id="s_t3:hint"><value>Enter any text (stress test field 3 of 5)</value></text>

          <text id="s_t4:label"><value>Stress Test — Text 4</value></text>
          <text id="s_t4:hint"><value>Enter any text (stress test field 4 of 5)</value></text>

          <text id="s_t5:label"><value>Stress Test — Text 5</value></text>
          <text id="s_t5:hint"><value>Enter any text (stress test field 5 of 5)</value></text>

          <text id="s_i1:label"><value>Stress Test — Integer 1</value></text>
          <text id="s_i1:hint"><value>Enter a whole number (stress test integer 1 of 3)</value></text>
          <text id="s_i1:constraintMsg"><value>Please enter a valid whole number</value></text>

          <text id="s_i2:label"><value>Stress Test — Integer 2</value></text>
          <text id="s_i2:hint"><value>Enter a whole number (stress test integer 2 of 3)</value></text>
          <text id="s_i2:constraintMsg"><value>Please enter a valid whole number</value></text>

          <text id="s_i3:label"><value>Stress Test — Integer 3</value></text>
          <text id="s_i3:hint"><value>Enter a whole number (stress test integer 3 of 3)</value></text>
          <text id="s_i3:constraintMsg"><value>Please enter a valid whole number</value></text>

          <text id="s_s1:label"><value>Stress Test — Select 1</value></text>
          <text id="s_s1:hint"><value>Choose one option (stress test select 1 of 3)</value></text>

          <text id="s_s2:label"><value>Stress Test — Select 2</value></text>
          <text id="s_s2:hint"><value>Choose one option (stress test select 2 of 3)</value></text>

          <text id="s_s3:label"><value>Stress Test — Select 3</value></text>
          <text id="s_s3:hint"><value>Choose one option (stress test select 3 of 3)</value></text>

          <text id="s_d1:label"><value>Stress Test — Date</value></text>
          <text id="s_d1:hint"><value>Select a date (stress test date field)</value></text>

          <text id="s_geo1:label"><value>Stress Test — Geopoint</value></text>
          <text id="s_geo1:hint"><value>Record GPS coordinates (stress test geopoint field)</value></text>

          <text id="s_img1:label"><value>Stress Test — Image Capture</value></text>
          <text id="s_img1:hint"><value>Take or upload a photo (stress test binary/image field)</value></text>

          <text id="s_dec1:label"><value>Stress Test — Decimal</value></text>
          <text id="s_dec1:hint"><value>Enter a decimal number (stress test decimal field)</value></text>
          <text id="s_dec1:constraintMsg"><value>Please enter a valid decimal number</value></text>

          <text id="s_n1:label"><value>Stress Test — Note 1</value></text>

          <text id="s_n2:label"><value>Stress Test — Note 2</value></text>

          <text id="s_calc1:label"><value>Stress Test — Calculated Value 1</value></text>
          <text id="s_calc1:hint"><value>Read-only calculated field (stress test calc 1 of 3)</value></text>

          <text id="s_calc2:label"><value>Stress Test — Calculated Value 2</value></text>
          <text id="s_calc2:hint"><value>Read-only calculated field (stress test calc 2 of 3)</value></text>

          <text id="s_calc3:label"><value>Stress Test — Calculated Value 3</value></text>
          <text id="s_calc3:hint"><value>Read-only calculated field (stress test calc 3 of 3)</value></text>

          <text id="s_ack1:label"><value>Stress Test — Acknowledgement</value></text>
          <text id="s_ack1:hint"><value>Tap to acknowledge and continue (trigger/acknowledge field)</value></text>

        </translation>

        <translation lang="Español">

          <text id="q_it_text:label"><value>Demo iText — Campo de Texto</value></text>
          <text id="q_it_text:hint"><value>Ingrese cualquier texto para demostrar la internacionalización con iText</value></text>

          <text id="q_it_num:label"><value>Demo iText — Campo Numérico</value></text>
          <text id="q_it_num:hint"><value>Ingrese un número para demostrar iText con tipo entero</value></text>
          <text id="q_it_num:constraintMsg"><value>Por favor ingrese un número válido</value></text>

          <text id="q_it_select:label"><value>Demo iText — Campo de Selección</value></text>
          <text id="q_it_select:hint"><value>Elija una opción para demostrar iText con selección única</value></text>

          <text id="q_it_req:label"><value>Demo iText — Campo Obligatorio</value></text>
          <text id="q_it_req:hint"><value>Este campo es obligatorio — demuestra el mensaje de campo requerido en iText</value></text>
          <text id="q_it_req:requiredMsg"><value>Este campo es obligatorio y no puede dejarse en blanco</value></text>

          <text id="q_app_vertical:label"><value>Apariencia: vertical — Selección con disposición vertical</value></text>
          <text id="q_app_vertical:hint"><value>Opciones mostradas verticalmente con appearance="vertical"</value></text>

          <text id="q_app_c1:label"><value>Apariencia: compact — Selección compacta de una columna</value></text>
          <text id="q_app_c1:hint"><value>Opciones mostradas con appearance="compact"</value></text>

          <text id="q_app_c2:label"><value>Apariencia: compact-2 — Selección compacta de dos columnas</value></text>
          <text id="q_app_c2:hint"><value>Opciones mostradas en dos columnas con appearance="compact-2"</value></text>

          <text id="q_app_c3:label"><value>Apariencia: compact-3 — Selección compacta de tres columnas</value></text>
          <text id="q_app_c3:hint"><value>Opciones mostradas en tres columnas con appearance="compact-3"</value></text>

          <text id="q_app_c4:label"><value>Apariencia: compact-4 — Selección compacta de cuatro columnas</value></text>
          <text id="q_app_c4:hint"><value>Opciones mostradas en cuatro columnas con appearance="compact-4"</value></text>

          <text id="q_app_qc:label"><value>Apariencia: quickcompact — Selección rápida compacta</value></text>
          <text id="q_app_qc:hint"><value>Opciones mostradas con appearance="quickcompact"</value></text>

          <text id="q_app_qc1:label"><value>Apariencia: quickcompact-1 — Rápida compacta de una columna</value></text>
          <text id="q_app_qc1:hint"><value>Opciones mostradas con appearance="quickcompact-1"</value></text>

          <text id="q_app_qc2:label"><value>Apariencia: quickcompact-2 — Rápida compacta de dos columnas</value></text>
          <text id="q_app_qc2:hint"><value>Opciones mostradas con appearance="quickcompact-2"</value></text>

          <text id="q_app_qc3:label"><value>Apariencia: quickcompact-3 — Rápida compacta de tres columnas</value></text>
          <text id="q_app_qc3:hint"><value>Opciones mostradas con appearance="quickcompact-3"</value></text>

          <text id="q_app_qc4:label"><value>Apariencia: quickcompact-4 — Rápida compacta de cuatro columnas</value></text>
          <text id="q_app_qc4:hint"><value>Opciones mostradas con appearance="quickcompact-4"</value></text>

          <text id="q_app_label:label"><value>Apariencia: label — Selección solo con etiquetas</value></text>
          <text id="q_app_label:hint"><value>Opciones mostradas solo como etiquetas con appearance="label"</value></text>

          <text id="q_app_imagemap:label"><value>Apariencia: image-map — Selección sobre mapa SVG</value></text>
          <text id="q_app_imagemap:hint"><value>Seleccione regiones en un mapa de imagen con appearance="image-map"</value></text>

          <text id="g_tablelist:label"><value>Apariencia: table-list — Grupo en disposición de cuadrícula</value></text>

          <text id="q_tl_a:label"><value>Columna A de tabla — Sí/No</value></text>
          <text id="q_tl_a:hint"><value>Primera columna con apariencia table-list</value></text>

          <text id="q_tl_b:label"><value>Columna B de tabla — Categoría</value></text>
          <text id="q_tl_b:hint"><value>Segunda columna con apariencia table-list</value></text>

          <text id="q_tl_c:label"><value>Columna C de tabla — Escala Likert</value></text>
          <text id="q_tl_c:hint"><value>Tercera columna con apariencia table-list</value></text>

          <text id="q_ml_img:label">
            <value>Etiqueta con imagen incrustada</value>
            <value form="image">jr://images/q_ml_img.jpg</value>
          </text>
          <text id="q_ml_img:hint"><value>Esta pregunta demuestra una imagen incrustada en la etiqueta</value></text>

          <text id="q_ml_audio:label">
            <value>Etiqueta con audio incrustado</value>
            <value form="audio">jr://audio/q_ml_audio.mp3</value>
          </text>
          <text id="q_ml_audio:hint"><value>Esta pregunta demuestra audio incrustado en la etiqueta</value></text>

          <text id="q_ml_video:label">
            <value>Etiqueta con video incrustado</value>
            <value form="video">jr://video/q_ml_video.mp4</value>
          </text>
          <text id="q_ml_video:hint"><value>Esta pregunta demuestra video incrustado en la etiqueta</value></text>

          <text id="q_mc_media:label"><value>Selección con opciones multimedia — Elija una</value></text>
          <text id="q_mc_media:hint"><value>Cada opción tiene contenido multimedia asociado (audio o imagen)</value></text>

          <text id="opt_media1:label">
            <value>Opción de audio</value>
            <value form="audio">jr://audio/opt1.mp3</value>
          </text>
          <text id="opt_media2:label">
            <value>Opción de imagen</value>
            <value form="image">jr://images/opt2.jpg</value>
          </text>
          <text id="opt_media3:label">
            <value>Opción de video</value>
            <value form="video">jr://video/opt3.mp4</value>
          </text>

          <text id="q_country:label"><value>País</value></text>
          <text id="q_country:hint"><value>Seleccione el país donde se encuentra el proyecto</value></text>
          <text id="q_country:requiredMsg"><value>La selección de país es obligatoria</value></text>

          <text id="q_state2:label"><value>Estado / Departamento</value></text>
          <text id="q_state2:hint"><value>Seleccione el estado o departamento (filtrado por país)</value></text>
          <text id="q_state2:requiredMsg"><value>La selección de estado o departamento es obligatoria</value></text>

          <text id="q_city2:label"><value>Municipio / Ciudad</value></text>
          <text id="q_city2:hint"><value>Seleccione el municipio o ciudad (filtrado por estado)</value></text>
          <text id="q_city2:requiredMsg"><value>La selección de municipio o ciudad es obligatoria</value></text>

          <text id="q_community2:label"><value>Comunidad / Localidad</value></text>
          <text id="q_community2:hint"><value>Seleccione la comunidad o localidad (filtrada por ciudad)</value></text>
          <text id="q_community2:requiredMsg"><value>La selección de comunidad es obligatoria</value></text>

          <text id="q_cf_complex:label"><value>Filtro de cascada complejo — Sector</value></text>
          <text id="q_cf_complex:hint"><value>Seleccione un tipo de sector filtrado por múltiples criterios</value></text>

          <text id="r3_projects:label"><value>Proyectos</value></text>
          <text id="r3_activities:label"><value>Actividades</value></text>
          <text id="r3_tasks:label"><value>Tareas</value></text>

          <text id="rp3_name:label"><value>Nombre del Proyecto</value></text>
          <text id="rp3_name:hint"><value>Ingrese el nombre completo de este proyecto</value></text>
          <text id="rp3_name:requiredMsg"><value>El nombre del proyecto es obligatorio</value></text>

          <text id="rp3_budget:label"><value>Presupuesto del Proyecto (MXN)</value></text>
          <text id="rp3_budget:hint"><value>Ingrese el presupuesto total asignado a este proyecto en pesos mexicanos</value></text>
          <text id="rp3_budget:constraintMsg"><value>El presupuesto debe ser un número positivo</value></text>

          <text id="rp3_status:label"><value>Estatus del Proyecto</value></text>
          <text id="rp3_status:hint"><value>Seleccione el estatus de implementación actual del proyecto</value></text>

          <text id="ra3_name:label"><value>Nombre de la Actividad</value></text>
          <text id="ra3_name:hint"><value>Ingrese el nombre de esta actividad dentro del proyecto</value></text>
          <text id="ra3_name:requiredMsg"><value>El nombre de la actividad es obligatorio</value></text>

          <text id="ra3_status:label"><value>Estatus de la Actividad</value></text>
          <text id="ra3_status:hint"><value>Seleccione el estatus actual de esta actividad</value></text>

          <text id="ra3_pos:label"><value>Posición / Orden de la Actividad</value></text>
          <text id="ra3_pos:hint"><value>Indique la posición secuencial de esta actividad en el plan del proyecto</value></text>

          <text id="ra3_cur:label"><value>Moneda de la Actividad</value></text>
          <text id="ra3_cur:hint"><value>Seleccione la moneda utilizada para el presupuesto de esta actividad</value></text>

          <text id="rt3_name:label"><value>Nombre de la Tarea</value></text>
          <text id="rt3_name:hint"><value>Ingrese un nombre breve y descriptivo para esta tarea</value></text>
          <text id="rt3_name:requiredMsg"><value>El nombre de la tarea es obligatorio</value></text>

          <text id="rt3_pct:label"><value>Avance de la Tarea (%)</value></text>
          <text id="rt3_pct:hint"><value>Ingrese el porcentaje completado de esta tarea (0–100)</value></text>
          <text id="rt3_pct:constraintMsg"><value>El porcentaje debe estar entre 0 y 100</value></text>

          <text id="rt3_hours:label"><value>Horas Trabajadas</value></text>
          <text id="rt3_hours:hint"><value>Ingrese el número de horas invertidas en esta tarea</value></text>
          <text id="rt3_hours:constraintMsg"><value>Las horas deben ser un número decimal positivo</value></text>

          <text id="rt3_done:label"><value>¿Tarea completada?</value></text>
          <text id="rt3_done:hint"><value>Indique si esta tarea ha sido completada en su totalidad</value></text>

          <text id="rt3_idx:label"><value>Índice de la Tarea</value></text>
          <text id="rt3_idx:hint"><value>Índice secuencial calculado automáticamente de esta tarea dentro de la actividad</value></text>

          <text id="q_geo_fenced:label"><value>Geopunto — Ubicación con Geocerca</value></text>
          <text id="q_geo_fenced:hint"><value>Registre sus coordenadas GPS; el envío solo es válido dentro del área permitida</value></text>
          <text id="q_geo_fenced:constraintMsg"><value>Su ubicación está fuera del límite geográfico permitido</value></text>

          <text id="q_ff1:label"><value>Selección desde Archivo — Lista Principal</value></text>
          <text id="q_ff1:hint"><value>Las opciones se cargan desde un archivo CSV o XML externo</value></text>

          <text id="q_ff2:label"><value>Selección desde Archivo — Lista Filtrada</value></text>
          <text id="q_ff2:hint"><value>Opciones filtradas desde archivo externo según la respuesta anterior</value></text>

          <text id="g_rel_adv:label"><value>Relevancia Avanzada — Grupo Condicional</value></text>

          <text id="q_rel_a:label"><value>Disparador de Relevancia — Seleccione condición</value></text>
          <text id="q_rel_a:hint"><value>Su respuesta aquí determinará si las siguientes preguntas aparecen</value></text>

          <text id="q_rel_b:label"><value>Visible cuando A = Sí — Pregunta secundaria</value></text>
          <text id="q_rel_b:hint"><value>Esta pregunta aparece solo cuando el disparador anterior tiene respuesta afirmativa</value></text>

          <text id="q_rel_c:label"><value>Visible cuando A y B coinciden — Pregunta terciaria</value></text>
          <text id="q_rel_c:hint"><value>Esta pregunta aparece solo cuando ambas condiciones previas se cumplen</value></text>

          <text id="q_con_email:label"><value>Correo Electrónico</value></text>
          <text id="q_con_email:hint"><value>Ingrese una dirección de correo válida (p. ej. nombre@ejemplo.com)</value></text>
          <text id="q_con_email:constraintMsg"><value>Por favor ingrese una dirección de correo electrónico válida</value></text>
          <text id="q_con_email:requiredMsg"><value>Se requiere una dirección de correo electrónico</value></text>

          <text id="q_con_cross:label"><value>Monto con Restricción Cruzada</value></text>
          <text id="q_con_cross:hint"><value>Ingrese un monto; no puede superar el presupuesto registrado para este proyecto</value></text>
          <text id="q_con_cross:constraintMsg"><value>Este monto no puede superar el presupuesto del proyecto</value></text>

          <text id="q_con_date_min:label"><value>Fecha de Inicio</value></text>
          <text id="q_con_date_min:hint"><value>Seleccione la fecha de inicio del proyecto (no puede ser en el pasado)</value></text>
          <text id="q_con_date_min:constraintMsg"><value>La fecha de inicio no puede ser anterior a hoy</value></text>

          <text id="q_con_date_max:label"><value>Fecha de Término</value></text>
          <text id="q_con_date_max:hint"><value>Seleccione la fecha de término del proyecto (debe ser posterior a la fecha de inicio)</value></text>
          <text id="q_con_date_max:constraintMsg"><value>La fecha de término debe ser posterior a la fecha de inicio</value></text>

          <text id="q_def_once:label"><value>Valor Predeterminado (una vez) — Campo prellenado</value></text>
          <text id="q_def_once:hint"><value>Este campo tiene un valor predeterminado inicial que puede modificarse</value></text>

          <text id="q_def_chain:label"><value>Valor Predeterminado Encadenado — Hereda de respuesta anterior</value></text>
          <text id="q_def_chain:hint"><value>El valor predeterminado se deriva de un campo anterior; puede sobreescribirse</value></text>

          <text id="q_def_today:label"><value>Fecha Predeterminada — Hoy</value></text>
          <text id="q_def_today:hint"><value>Toma la fecha de hoy por defecto; cámbiela solo si el evento ocurrió en otro día</value></text>

          <text id="calc_not_fn:label"><value>Cálculo: resultado de la función not()</value></text>
          <text id="calc_not_fn:hint"><value>Solo lectura — demuestra la función XPath not()</value></text>

          <text id="calc_mod_fn:label"><value>Cálculo: resultado del operador mod</value></text>
          <text id="calc_mod_fn:hint"><value>Solo lectura — demuestra el operador módulo en XPath</value></text>

          <text id="calc_boolstr:label"><value>Cálculo: resultado de boolean-from-string()</value></text>
          <text id="calc_boolstr:hint"><value>Solo lectura — demuestra la función boolean-from-string()</value></text>

          <text id="calc_uuid_fn:label"><value>Cálculo: uuid() — Identificador único</value></text>
          <text id="calc_uuid_fn:hint"><value>Solo lectura — UUID generado automáticamente con la función uuid()</value></text>

          <text id="calc_join_fn:label"><value>Cálculo: join() — Valores concatenados</value></text>
          <text id="calc_join_fn:hint"><value>Solo lectura — demuestra la unión de múltiples valores con un separador</value></text>

          <text id="calc_max_fn:label"><value>Cálculo: max() — Valor máximo</value></text>
          <text id="calc_max_fn:hint"><value>Solo lectura — demuestra la función de agregación max()</value></text>

          <text id="calc_min_fn:label"><value>Cálculo: min() — Valor mínimo</value></text>
          <text id="calc_min_fn:hint"><value>Solo lectura — demuestra la función de agregación min()</value></text>

          <text id="calc_sum_fn:label"><value>Cálculo: sum() — Total de valores repetidos</value></text>
          <text id="calc_sum_fn:hint"><value>Solo lectura — demuestra la función sum() sobre un conjunto de nodos repetidos</value></text>

          <text id="s_t1:label"><value>Prueba de Estrés — Texto 1</value></text>
          <text id="s_t1:hint"><value>Ingrese cualquier texto (campo de texto de prueba 1 de 5)</value></text>

          <text id="s_t2:label"><value>Prueba de Estrés — Texto 2</value></text>
          <text id="s_t2:hint"><value>Ingrese cualquier texto (campo de texto de prueba 2 de 5)</value></text>

          <text id="s_t3:label"><value>Prueba de Estrés — Texto 3</value></text>
          <text id="s_t3:hint"><value>Ingrese cualquier texto (campo de texto de prueba 3 de 5)</value></text>

          <text id="s_t4:label"><value>Prueba de Estrés — Texto 4</value></text>
          <text id="s_t4:hint"><value>Ingrese cualquier texto (campo de texto de prueba 4 de 5)</value></text>

          <text id="s_t5:label"><value>Prueba de Estrés — Texto 5</value></text>
          <text id="s_t5:hint"><value>Ingrese cualquier texto (campo de texto de prueba 5 de 5)</value></text>

          <text id="s_i1:label"><value>Prueba de Estrés — Entero 1</value></text>
          <text id="s_i1:hint"><value>Ingrese un número entero (entero de prueba 1 de 3)</value></text>
          <text id="s_i1:constraintMsg"><value>Por favor ingrese un número entero válido</value></text>

          <text id="s_i2:label"><value>Prueba de Estrés — Entero 2</value></text>
          <text id="s_i2:hint"><value>Ingrese un número entero (entero de prueba 2 de 3)</value></text>
          <text id="s_i2:constraintMsg"><value>Por favor ingrese un número entero válido</value></text>

          <text id="s_i3:label"><value>Prueba de Estrés — Entero 3</value></text>
          <text id="s_i3:hint"><value>Ingrese un número entero (entero de prueba 3 de 3)</value></text>
          <text id="s_i3:constraintMsg"><value>Por favor ingrese un número entero válido</value></text>

          <text id="s_s1:label"><value>Prueba de Estrés — Selección 1</value></text>
          <text id="s_s1:hint"><value>Elija una opción (selección de prueba 1 de 3)</value></text>

          <text id="s_s2:label"><value>Prueba de Estrés — Selección 2</value></text>
          <text id="s_s2:hint"><value>Elija una opción (selección de prueba 2 de 3)</value></text>

          <text id="s_s3:label"><value>Prueba de Estrés — Selección 3</value></text>
          <text id="s_s3:hint"><value>Elija una opción (selección de prueba 3 de 3)</value></text>

          <text id="s_d1:label"><value>Prueba de Estrés — Fecha</value></text>
          <text id="s_d1:hint"><value>Seleccione una fecha (campo de fecha de prueba)</value></text>

          <text id="s_geo1:label"><value>Prueba de Estrés — Geopunto</value></text>
          <text id="s_geo1:hint"><value>Registre coordenadas GPS (campo geopunto de prueba)</value></text>

          <text id="s_img1:label"><value>Prueba de Estrés — Captura de Imagen</value></text>
          <text id="s_img1:hint"><value>Tome o cargue una fotografía (campo binario/imagen de prueba)</value></text>

          <text id="s_dec1:label"><value>Prueba de Estrés — Decimal</value></text>
          <text id="s_dec1:hint"><value>Ingrese un número decimal (campo decimal de prueba)</value></text>
          <text id="s_dec1:constraintMsg"><value>Por favor ingrese un número decimal válido</value></text>

          <text id="s_n1:label"><value>Prueba de Estrés — Nota 1</value></text>

          <text id="s_n2:label"><value>Prueba de Estrés — Nota 2</value></text>

          <text id="s_calc1:label"><value>Prueba de Estrés — Valor Calculado 1</value></text>
          <text id="s_calc1:hint"><value>Campo de solo lectura calculado automáticamente (cálculo de prueba 1 de 3)</value></text>

          <text id="s_calc2:label"><value>Prueba de Estrés — Valor Calculado 2</value></text>
          <text id="s_calc2:hint"><value>Campo de solo lectura calculado automáticamente (cálculo de prueba 2 de 3)</value></text>

          <text id="s_calc3:label"><value>Prueba de Estrés — Valor Calculado 3</value></text>
          <text id="s_calc3:hint"><value>Campo de solo lectura calculado automáticamente (cálculo de prueba 3 de 3)</value></text>

          <text id="s_ack1:label"><value>Prueba de Estrés — Reconocimiento</value></text>
          <text id="s_ack1:hint"><value>Toque para confirmar y continuar (campo de reconocimiento/disparador)</value></text>

        </translation>
  </itext>
      <instance>
        <data id="enketo_full_test" version="1">
          <start/><end/><today/><username/><deviceid/><subscriberid/><simserial/><phonenumber/><meta><instanceID/><instanceName/></meta><q_text/><q_integer/><q_decimal/><q_range/><q_date/><q_time/><q_datetime/><q_note/><q_acknowledge/><q_image/><q_audio/><q_video/><q_file/><q_barcode/><q_signature/><q_geopoint/><q_geotrace/><q_geoshape/><q_province/><q_municipality/><q_select_auto/><q_select_likert/><q_select_horiz/><q_select_compact/><q_select_multiple/><q_select_list/><q_select_inline/><q_rank/><g_personal><q_name/><q_age/><q_gender/></g_personal><g_outer><q_outer_q1/><g_inner><q_inner_q1/><q_inner_q2/></g_inner></g_outer><r_contacts><rq_c_name/><rq_c_phone/><rq_c_type/><rq_c_count/></r_contacts><r_projects><rq_p_name/><r_tasks><rq_t_name/><rq_t_done/><rq_t_hours/></r_tasks></r_projects><calc_abs/><calc_round/><calc_sqrt/><calc_pow/><calc_exp/><calc_log/><calc_sin/><calc_cos/><calc_tan/><calc_pi/><calc_concat/><calc_contains/><calc_startswith/><calc_endswith/><calc_substr/><calc_strlen/><calc_normalize/><calc_translate/><calc_today2/><calc_now2/><calc_fmtdate/><calc_fmtdatetime/><calc_dectime/><calc_distance/><calc_area/><calc_coalesce/><calc_random/><calc_once_ts/><calc_choicename/><calc_countsel/><calc_selectedat/><calc_selected_check/><v_positive/><v_regex/><v_date_range/><v_complex/>
          <q_it_text/>
          <q_it_num/>
          <q_it_select/>
          <q_it_req/>
          <q_app_vertical/>
          <q_app_c1/>
          <q_app_c2/>
          <q_app_c3/>
          <q_app_c4/>
          <q_app_qc/>
          <q_app_qc1/>
          <q_app_qc2/>
          <q_app_qc3/>
          <q_app_qc4/>
          <q_app_label/>
          <q_app_imagemap/>
          <g_tablelist>
            <q_tl_a/>
            <q_tl_b/>
            <q_tl_c/>
          </g_tablelist>
          <q_ml_img/>
          <q_ml_audio/>
          <q_ml_video/>
          <q_mc_media/>
          <q_country/>
          <q_state2/>
          <q_city2/>
          <q_community2/>
          <q_cf_complex/>
          <r3_projects>
            <rp3_name/>
            <rp3_budget/>
            <rp3_status/>
            <r3_activities>
              <ra3_name/>
              <ra3_status/>
              <ra3_pos/>
              <ra3_cur/>
              <r3_tasks>
                <rt3_name/>
                <rt3_pct/>
                <rt3_hours/>
                <rt3_done/>
                <rt3_idx/>
              </r3_tasks>
            </r3_activities>
          </r3_projects>
          <calc_not_fn/>
          <calc_mod_fn/>
          <calc_boolstr/>
          <calc_uuid_fn/>
          <calc_join_fn/>
          <calc_max_fn/>
          <calc_min_fn/>
          <calc_sum_fn/>
          <q_geo_fenced/>
          <calc_geo_area2/>
          <calc_geo_dist2/>
          <q_ff1/>
          <q_ff2/>
          <audit/>
          <g_rel_adv>
            <q_rel_a/>
            <q_rel_b/>
            <q_rel_c/>
          </g_rel_adv>
          <q_con_email/>
          <q_con_cross/>
          <q_con_date_min/>
          <q_con_date_max/>
          <q_def_once/>
          <q_def_chain/>
          <q_def_today/>
          <s_t1/>
          <s_t2/>
          <s_t3/>
          <s_t4/>
          <s_t5/>
          <s_i1/>
          <s_i2/>
          <s_i3/>
          <s_s1/>
          <s_s2/>
          <s_s3/>
          <s_d1/>
          <s_geo1/>
          <s_img1/>
          <s_dec1/>
          <s_n1/>
          <s_n2/>
          <s_calc1/>
          <s_calc2/>
          <s_calc3/>
          <s_ack1/>
        <q_locality/>
        <q_entity_key/>
        <q_entity_val/>
        <calc_digest/>
        <q_perf_one/>
        <q_perf_filtered/>
        <q_perf_multi/>
        <q_audio_choice/>
        <q_video_choice/>
        <g_enketo_edge>
          <eq_sum_tasks/>
          <eq_idx_deep/>
          <eq_nr_constraint/>
          <eq_nr_relevant/>
          <eq_count_done/>
        </g_enketo_edge>
        <r4_programs>
          <rp4_name/>
          <rp4_budget_total/>
          <rp4_type/>
          <r4_projects>
            <rj4_name/>
            <rj4_budget/>
            <rj4_status/>
            <rj4_pos/>
            <rj4_count_acts/>
            <r4_activities>
              <ra4_name/>
              <ra4_type/>
              <ra4_pct/>
              <ra4_cur_proj/>
              <ra4_pos/>
              <r4_tasks>
                <rt4_name/>
                <rt4_hours/>
                <rt4_done/>
                <rt4_priority/>
                <rt4_pos/>
                <rt4_idx/>
                <rt4_cur_act/>
              </r4_tasks>
            </r4_activities>
          </r4_projects>
        </r4_programs>
        </data>
      </instance>
      <instance id="provinces">
        <root>
          <item><name>1</name><label>Jalisco</label></item>
          <item><name>2</name><label>Guanajuato</label></item>
          <item><name>3</name><label>Michoacán</label></item>
          <item><name>4</name><label>Oaxaca</label></item>
          <item><name>5</name><label>Chiapas</label></item>
        </root>
      </instance>
      <instance id="municipalities">
        <root>
          <item><name>101</name><label>Guadalajara</label><province_id>1</province_id></item>
          <item><name>102</name><label>Puerto Vallarta</label><province_id>1</province_id></item>
          <item><name>201</name><label>León</label><province_id>2</province_id></item>
          <item><name>202</name><label>San Miguel de Allende</label><province_id>2</province_id></item>
          <item><name>301</name><label>Morelia</label><province_id>3</province_id></item>
          <item><name>302</name><label>Uruapan</label><province_id>3</province_id></item>
          <item><name>401</name><label>Oaxaca de Juárez</label><province_id>4</province_id></item>
          <item><name>402</name><label>Juchitán de Zaragoza</label><province_id>4</province_id></item>
          <item><name>501</name><label>Tuxtla Gutiérrez</label><province_id>5</province_id></item>
          <item><name>502</name><label>San Cristóbal de las Casas</label><province_id>5</province_id></item>
        </root>
      </instance>
      <instance id="categories">
        <root>
          <item><name>agave</name><label>Agave</label><image>jr://images/cat_agave.jpg</image></item>
          <item><name>cacao</name><label>Cacao</label><image>jr://images/cat_cacao.jpg</image></item>
          <item><name>coffee</name><label>Coffee</label><image>jr://images/cat_coffee.jpg</image></item>
          <item><name>livestock</name><label>Livestock</label><image>jr://images/cat_livestock.jpg</image></item>
          <item><name>beekeeping</name><label>Beekeeping</label><image>jr://images/cat_beekeeping.jpg</image></item>
        </root>
      </instance>
      <instance id="yes_no">
        <root>
          <item><name>1</name><label>Yes</label></item>
          <item><name>0</name><label>No</label></item>
        </root>
      </instance>
      <instance id="likert_scale">
        <root>
          <item><name>1</name><label>Strongly Disagree</label></item>
          <item><name>2</name><label>Disagree</label></item>
          <item><name>3</name><label>Neutral</label></item>
          <item><name>4</name><label>Agree</label></item>
          <item><name>5</name><label>Strongly Agree</label></item>
        </root>
      </instance>
      <instance id="priorities">
        <root>
          <item><name>1</name><label>High</label></item>
          <item><name>2</name><label>Medium</label></item>
          <item><name>3</name><label>Low</label></item>
          <item><name>4</name><label>Not a Priority</label></item>
        </root>
      </instance>
      <instance id="countries">
        <root>
          <item><name>MX</name><label>México</label></item>
          <item><name>HN</name><label>Honduras</label></item>
          <item><name>NI</name><label>Nicaragua</label></item>
          <item><name>GT</name><label>Guatemala</label></item>
        </root>
      </instance>
      <instance id="mx_states">
        <root>
          <item><name>JAL</name><label>Jalisco</label><country_id>MX</country_id></item>
          <item><name>GTO</name><label>Guanajuato</label><country_id>MX</country_id></item>
          <item><name>OAX</name><label>Oaxaca</label><country_id>MX</country_id></item>
          <item><name>CHIS</name><label>Chiapas</label><country_id>MX</country_id></item>
          <item><name>YUC</name><label>Yucatán</label><country_id>MX</country_id></item>
        </root>
      </instance>
      <instance id="mx_cities">
        <root>
          <item><name>GDL</name><label>Guadalajara</label><state_id>JAL</state_id></item>
          <item><name>ZAP</name><label>Zapopan</label><state_id>JAL</state_id></item>
          <item><name>LEO</name><label>León</label><state_id>GTO</state_id></item>
          <item><name>OAX_C</name><label>Oaxaca City</label><state_id>OAX</state_id></item>
          <item><name>MER</name><label>Mérida</label><state_id>YUC</state_id></item>
        </root>
      </instance>
      <instance id="mx_communities">
        <root>
          <item><name>COM1</name><label>San Luis del Castillo</label><city_id>GDL</city_id></item>
          <item><name>COM2</name><label>Santa Ana</label><city_id>GDL</city_id></item>
          <item><name>COM3</name><label>Valle Guanajuatense</label><city_id>LEO</city_id></item>
          <item><name>COM4</name><label>Monte Albán</label><city_id>OAX_C</city_id></item>
          <item><name>COM5</name><label>Centro Histórico</label><city_id>MER</city_id></item>
        </root>
      </instance>
      <instance id="sectors">
        <root>
          <item><name>north</name><label>Norte</label><type>urban</type></item>
          <item><name>south</name><label>Sur</label><type>rural</type></item>
          <item><name>east</name><label>Este</label><type>urban</type></item>
          <item><name>west</name><label>Oeste</label><type>rural</type></item>
          <item><name>center</name><label>Centro</label><type>urban</type></item>
        </root>
      </instance>
      <instance id="media_opts">
        <root>
          <item><name>opt1</name><label>Audio option</label><audio>jr://audio/opt1.mp3</audio></item>
          <item><name>opt2</name><label>Image option</label><image>jr://images/opt2.jpg</image></item>
          <item><name>opt3</name><label>Video option</label><video>jr://video/opt3.mp4</video></item>
        </root>
      </instance>
      <instance id="from_file">
        <root>
          <item><name>ext1</name><label>External Option 1</label></item>
          <item><name>ext2</name><label>External Option 2</label></item>
          <item><name>ext3</name><label>External Option 3</label></item>
          <item><name>ext4</name><label>External Option 4</label></item>
          <item><name>ext5</name><label>External Option 5</label></item>
        </root>
      </instance>
      <instance id="mx_localities">
        <root>
          <item><name>loc001</name><label>Rancho El Progreso</label><community_id>COM1</community_id></item>
          <item><name>loc002</name><label>Ejido Santa Cruz</label><community_id>COM1</community_id></item>
          <item><name>loc003</name><label>Barrio Nuevo</label><community_id>COM3</community_id></item>
          <item><name>loc004</name><label>Colonia Juárez</label><community_id>COM4</community_id></item>
          <item><name>loc005</name><label>Centro Histórico</label><community_id>COM5</community_id></item>
        </root>
      </instance>
      <instance id="entities_data">
        <root>
          <entity><key>K001</key><name>ent001</name><label>Entity Alpha</label><value>Val-Alpha</value><region>north</region></entity>
          <entity><key>K002</key><name>ent002</name><label>Entity Beta</label><value>Val-Beta</value><region>south</region></entity>
          <entity><key>K003</key><name>ent003</name><label>Entity Gamma</label><value>Val-Gamma</value><region>east</region></entity>
          <entity><key>K004</key><name>ent004</name><label>Entity Delta</label><value>Val-Delta</value><region>west</region></entity>
        </root>
      </instance>
      <instance id="audio_opts">
        <root>
          <item><name>snd1</name><label>Audio Option 1</label><audio>jr://audio/snd1.mp3</audio></item>
          <item><name>snd2</name><label>Audio Option 2</label><audio>jr://audio/snd2.mp3</audio></item>
          <item><name>snd3</name><label>Audio Option 3</label><audio>jr://audio/snd3.mp3</audio></item>
        </root>
      </instance>
      <instance id="video_opts">
        <root>
          <item><name>vid1</name><label>Video Option 1</label><video>jr://video/vid1.mp4</video></item>
          <item><name>vid2</name><label>Video Option 2</label><video>jr://video/vid2.mp4</video></item>
          <item><name>vid3</name><label>Video Option 3</label><video>jr://video/vid3.mp4</video></item>
        </root>
      </instance>
      <instance id="perf_items">
              <root>
              <item><name>perf001</name><label>Item 001 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf002</name><label>Item 002 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf003</name><label>Item 003 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf004</name><label>Item 004 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf005</name><label>Item 005 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf006</name><label>Item 006 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf007</name><label>Item 007 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf008</name><label>Item 008 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf009</name><label>Item 009 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf010</name><label>Item 010 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf011</name><label>Item 011 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf012</name><label>Item 012 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf013</name><label>Item 013 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf014</name><label>Item 014 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf015</name><label>Item 015 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf016</name><label>Item 016 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf017</name><label>Item 017 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf018</name><label>Item 018 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf019</name><label>Item 019 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf020</name><label>Item 020 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf021</name><label>Item 021 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf022</name><label>Item 022 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf023</name><label>Item 023 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf024</name><label>Item 024 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf025</name><label>Item 025 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf026</name><label>Item 026 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf027</name><label>Item 027 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf028</name><label>Item 028 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf029</name><label>Item 029 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf030</name><label>Item 030 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf031</name><label>Item 031 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf032</name><label>Item 032 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf033</name><label>Item 033 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf034</name><label>Item 034 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf035</name><label>Item 035 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf036</name><label>Item 036 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf037</name><label>Item 037 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf038</name><label>Item 038 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf039</name><label>Item 039 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf040</name><label>Item 040 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf041</name><label>Item 041 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf042</name><label>Item 042 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf043</name><label>Item 043 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf044</name><label>Item 044 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf045</name><label>Item 045 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf046</name><label>Item 046 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf047</name><label>Item 047 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf048</name><label>Item 048 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf049</name><label>Item 049 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf050</name><label>Item 050 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf051</name><label>Item 051 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf052</name><label>Item 052 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf053</name><label>Item 053 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf054</name><label>Item 054 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf055</name><label>Item 055 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf056</name><label>Item 056 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf057</name><label>Item 057 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf058</name><label>Item 058 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf059</name><label>Item 059 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf060</name><label>Item 060 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf061</name><label>Item 061 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf062</name><label>Item 062 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf063</name><label>Item 063 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf064</name><label>Item 064 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf065</name><label>Item 065 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf066</name><label>Item 066 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf067</name><label>Item 067 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf068</name><label>Item 068 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf069</name><label>Item 069 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf070</name><label>Item 070 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf071</name><label>Item 071 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf072</name><label>Item 072 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf073</name><label>Item 073 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf074</name><label>Item 074 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf075</name><label>Item 075 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf076</name><label>Item 076 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf077</name><label>Item 077 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf078</name><label>Item 078 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf079</name><label>Item 079 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf080</name><label>Item 080 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf081</name><label>Item 081 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf082</name><label>Item 082 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf083</name><label>Item 083 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf084</name><label>Item 084 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf085</name><label>Item 085 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf086</name><label>Item 086 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf087</name><label>Item 087 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf088</name><label>Item 088 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf089</name><label>Item 089 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf090</name><label>Item 090 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf091</name><label>Item 091 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf092</name><label>Item 092 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf093</name><label>Item 093 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf094</name><label>Item 094 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf095</name><label>Item 095 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf096</name><label>Item 096 — agriculture</label><cat>agriculture</cat><region>north</region></item>
              <item><name>perf097</name><label>Item 097 — livestock</label><cat>livestock</cat><region>north</region></item>
              <item><name>perf098</name><label>Item 098 — forestry</label><cat>forestry</cat><region>north</region></item>
              <item><name>perf099</name><label>Item 099 — fishing</label><cat>fishing</cat><region>north</region></item>
              <item><name>perf100</name><label>Item 100 — horticulture</label><cat>horticulture</cat><region>north</region></item>
              <item><name>perf101</name><label>Item 101 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf102</name><label>Item 102 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf103</name><label>Item 103 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf104</name><label>Item 104 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf105</name><label>Item 105 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf106</name><label>Item 106 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf107</name><label>Item 107 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf108</name><label>Item 108 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf109</name><label>Item 109 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf110</name><label>Item 110 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf111</name><label>Item 111 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf112</name><label>Item 112 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf113</name><label>Item 113 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf114</name><label>Item 114 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf115</name><label>Item 115 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf116</name><label>Item 116 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf117</name><label>Item 117 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf118</name><label>Item 118 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf119</name><label>Item 119 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf120</name><label>Item 120 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf121</name><label>Item 121 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf122</name><label>Item 122 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf123</name><label>Item 123 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf124</name><label>Item 124 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf125</name><label>Item 125 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf126</name><label>Item 126 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf127</name><label>Item 127 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf128</name><label>Item 128 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf129</name><label>Item 129 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf130</name><label>Item 130 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf131</name><label>Item 131 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf132</name><label>Item 132 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf133</name><label>Item 133 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf134</name><label>Item 134 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf135</name><label>Item 135 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf136</name><label>Item 136 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf137</name><label>Item 137 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf138</name><label>Item 138 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf139</name><label>Item 139 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf140</name><label>Item 140 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf141</name><label>Item 141 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf142</name><label>Item 142 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf143</name><label>Item 143 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf144</name><label>Item 144 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf145</name><label>Item 145 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf146</name><label>Item 146 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf147</name><label>Item 147 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf148</name><label>Item 148 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf149</name><label>Item 149 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf150</name><label>Item 150 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf151</name><label>Item 151 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf152</name><label>Item 152 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf153</name><label>Item 153 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf154</name><label>Item 154 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf155</name><label>Item 155 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf156</name><label>Item 156 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf157</name><label>Item 157 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf158</name><label>Item 158 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf159</name><label>Item 159 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf160</name><label>Item 160 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf161</name><label>Item 161 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf162</name><label>Item 162 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf163</name><label>Item 163 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf164</name><label>Item 164 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf165</name><label>Item 165 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf166</name><label>Item 166 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf167</name><label>Item 167 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf168</name><label>Item 168 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf169</name><label>Item 169 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf170</name><label>Item 170 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf171</name><label>Item 171 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf172</name><label>Item 172 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf173</name><label>Item 173 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf174</name><label>Item 174 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf175</name><label>Item 175 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf176</name><label>Item 176 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf177</name><label>Item 177 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf178</name><label>Item 178 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf179</name><label>Item 179 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf180</name><label>Item 180 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf181</name><label>Item 181 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf182</name><label>Item 182 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf183</name><label>Item 183 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf184</name><label>Item 184 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf185</name><label>Item 185 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf186</name><label>Item 186 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf187</name><label>Item 187 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf188</name><label>Item 188 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf189</name><label>Item 189 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf190</name><label>Item 190 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf191</name><label>Item 191 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf192</name><label>Item 192 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf193</name><label>Item 193 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf194</name><label>Item 194 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf195</name><label>Item 195 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf196</name><label>Item 196 — agriculture</label><cat>agriculture</cat><region>south</region></item>
              <item><name>perf197</name><label>Item 197 — livestock</label><cat>livestock</cat><region>south</region></item>
              <item><name>perf198</name><label>Item 198 — forestry</label><cat>forestry</cat><region>south</region></item>
              <item><name>perf199</name><label>Item 199 — fishing</label><cat>fishing</cat><region>south</region></item>
              <item><name>perf200</name><label>Item 200 — horticulture</label><cat>horticulture</cat><region>south</region></item>
              <item><name>perf201</name><label>Item 201 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf202</name><label>Item 202 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf203</name><label>Item 203 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf204</name><label>Item 204 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf205</name><label>Item 205 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf206</name><label>Item 206 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf207</name><label>Item 207 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf208</name><label>Item 208 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf209</name><label>Item 209 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf210</name><label>Item 210 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf211</name><label>Item 211 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf212</name><label>Item 212 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf213</name><label>Item 213 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf214</name><label>Item 214 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf215</name><label>Item 215 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf216</name><label>Item 216 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf217</name><label>Item 217 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf218</name><label>Item 218 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf219</name><label>Item 219 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf220</name><label>Item 220 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf221</name><label>Item 221 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf222</name><label>Item 222 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf223</name><label>Item 223 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf224</name><label>Item 224 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf225</name><label>Item 225 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf226</name><label>Item 226 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf227</name><label>Item 227 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf228</name><label>Item 228 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf229</name><label>Item 229 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf230</name><label>Item 230 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf231</name><label>Item 231 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf232</name><label>Item 232 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf233</name><label>Item 233 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf234</name><label>Item 234 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf235</name><label>Item 235 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf236</name><label>Item 236 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf237</name><label>Item 237 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf238</name><label>Item 238 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf239</name><label>Item 239 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf240</name><label>Item 240 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf241</name><label>Item 241 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf242</name><label>Item 242 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf243</name><label>Item 243 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf244</name><label>Item 244 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf245</name><label>Item 245 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf246</name><label>Item 246 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf247</name><label>Item 247 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf248</name><label>Item 248 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf249</name><label>Item 249 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf250</name><label>Item 250 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf251</name><label>Item 251 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf252</name><label>Item 252 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf253</name><label>Item 253 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf254</name><label>Item 254 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf255</name><label>Item 255 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf256</name><label>Item 256 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf257</name><label>Item 257 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf258</name><label>Item 258 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf259</name><label>Item 259 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf260</name><label>Item 260 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf261</name><label>Item 261 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf262</name><label>Item 262 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf263</name><label>Item 263 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf264</name><label>Item 264 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf265</name><label>Item 265 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf266</name><label>Item 266 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf267</name><label>Item 267 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf268</name><label>Item 268 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf269</name><label>Item 269 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf270</name><label>Item 270 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf271</name><label>Item 271 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf272</name><label>Item 272 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf273</name><label>Item 273 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf274</name><label>Item 274 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf275</name><label>Item 275 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf276</name><label>Item 276 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf277</name><label>Item 277 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf278</name><label>Item 278 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf279</name><label>Item 279 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf280</name><label>Item 280 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf281</name><label>Item 281 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf282</name><label>Item 282 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf283</name><label>Item 283 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf284</name><label>Item 284 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf285</name><label>Item 285 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf286</name><label>Item 286 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf287</name><label>Item 287 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf288</name><label>Item 288 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf289</name><label>Item 289 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf290</name><label>Item 290 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf291</name><label>Item 291 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf292</name><label>Item 292 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf293</name><label>Item 293 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf294</name><label>Item 294 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf295</name><label>Item 295 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf296</name><label>Item 296 — agriculture</label><cat>agriculture</cat><region>east</region></item>
              <item><name>perf297</name><label>Item 297 — livestock</label><cat>livestock</cat><region>east</region></item>
              <item><name>perf298</name><label>Item 298 — forestry</label><cat>forestry</cat><region>east</region></item>
              <item><name>perf299</name><label>Item 299 — fishing</label><cat>fishing</cat><region>east</region></item>
              <item><name>perf300</name><label>Item 300 — horticulture</label><cat>horticulture</cat><region>east</region></item>
              <item><name>perf301</name><label>Item 301 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf302</name><label>Item 302 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf303</name><label>Item 303 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf304</name><label>Item 304 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf305</name><label>Item 305 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf306</name><label>Item 306 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf307</name><label>Item 307 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf308</name><label>Item 308 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf309</name><label>Item 309 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf310</name><label>Item 310 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf311</name><label>Item 311 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf312</name><label>Item 312 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf313</name><label>Item 313 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf314</name><label>Item 314 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf315</name><label>Item 315 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf316</name><label>Item 316 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf317</name><label>Item 317 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf318</name><label>Item 318 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf319</name><label>Item 319 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf320</name><label>Item 320 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf321</name><label>Item 321 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf322</name><label>Item 322 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf323</name><label>Item 323 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf324</name><label>Item 324 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf325</name><label>Item 325 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf326</name><label>Item 326 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf327</name><label>Item 327 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf328</name><label>Item 328 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf329</name><label>Item 329 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf330</name><label>Item 330 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf331</name><label>Item 331 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf332</name><label>Item 332 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf333</name><label>Item 333 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf334</name><label>Item 334 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf335</name><label>Item 335 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf336</name><label>Item 336 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf337</name><label>Item 337 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf338</name><label>Item 338 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf339</name><label>Item 339 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf340</name><label>Item 340 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf341</name><label>Item 341 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf342</name><label>Item 342 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf343</name><label>Item 343 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf344</name><label>Item 344 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf345</name><label>Item 345 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf346</name><label>Item 346 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf347</name><label>Item 347 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf348</name><label>Item 348 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf349</name><label>Item 349 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf350</name><label>Item 350 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf351</name><label>Item 351 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf352</name><label>Item 352 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf353</name><label>Item 353 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf354</name><label>Item 354 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf355</name><label>Item 355 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf356</name><label>Item 356 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf357</name><label>Item 357 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf358</name><label>Item 358 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf359</name><label>Item 359 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf360</name><label>Item 360 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf361</name><label>Item 361 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf362</name><label>Item 362 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf363</name><label>Item 363 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf364</name><label>Item 364 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf365</name><label>Item 365 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf366</name><label>Item 366 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf367</name><label>Item 367 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf368</name><label>Item 368 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf369</name><label>Item 369 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf370</name><label>Item 370 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf371</name><label>Item 371 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf372</name><label>Item 372 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf373</name><label>Item 373 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf374</name><label>Item 374 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf375</name><label>Item 375 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf376</name><label>Item 376 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf377</name><label>Item 377 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf378</name><label>Item 378 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf379</name><label>Item 379 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf380</name><label>Item 380 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf381</name><label>Item 381 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf382</name><label>Item 382 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf383</name><label>Item 383 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf384</name><label>Item 384 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf385</name><label>Item 385 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf386</name><label>Item 386 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf387</name><label>Item 387 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf388</name><label>Item 388 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf389</name><label>Item 389 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf390</name><label>Item 390 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf391</name><label>Item 391 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf392</name><label>Item 392 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf393</name><label>Item 393 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf394</name><label>Item 394 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf395</name><label>Item 395 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf396</name><label>Item 396 — agriculture</label><cat>agriculture</cat><region>west</region></item>
              <item><name>perf397</name><label>Item 397 — livestock</label><cat>livestock</cat><region>west</region></item>
              <item><name>perf398</name><label>Item 398 — forestry</label><cat>forestry</cat><region>west</region></item>
              <item><name>perf399</name><label>Item 399 — fishing</label><cat>fishing</cat><region>west</region></item>
              <item><name>perf400</name><label>Item 400 — horticulture</label><cat>horticulture</cat><region>west</region></item>
              <item><name>perf401</name><label>Item 401 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf402</name><label>Item 402 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf403</name><label>Item 403 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf404</name><label>Item 404 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf405</name><label>Item 405 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf406</name><label>Item 406 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf407</name><label>Item 407 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf408</name><label>Item 408 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf409</name><label>Item 409 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf410</name><label>Item 410 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf411</name><label>Item 411 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf412</name><label>Item 412 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf413</name><label>Item 413 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf414</name><label>Item 414 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf415</name><label>Item 415 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf416</name><label>Item 416 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf417</name><label>Item 417 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf418</name><label>Item 418 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf419</name><label>Item 419 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf420</name><label>Item 420 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf421</name><label>Item 421 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf422</name><label>Item 422 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf423</name><label>Item 423 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf424</name><label>Item 424 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf425</name><label>Item 425 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf426</name><label>Item 426 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf427</name><label>Item 427 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf428</name><label>Item 428 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf429</name><label>Item 429 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf430</name><label>Item 430 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf431</name><label>Item 431 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf432</name><label>Item 432 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf433</name><label>Item 433 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf434</name><label>Item 434 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf435</name><label>Item 435 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf436</name><label>Item 436 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf437</name><label>Item 437 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf438</name><label>Item 438 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf439</name><label>Item 439 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf440</name><label>Item 440 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf441</name><label>Item 441 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf442</name><label>Item 442 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf443</name><label>Item 443 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf444</name><label>Item 444 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf445</name><label>Item 445 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf446</name><label>Item 446 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf447</name><label>Item 447 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf448</name><label>Item 448 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf449</name><label>Item 449 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf450</name><label>Item 450 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf451</name><label>Item 451 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf452</name><label>Item 452 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf453</name><label>Item 453 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf454</name><label>Item 454 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf455</name><label>Item 455 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf456</name><label>Item 456 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf457</name><label>Item 457 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf458</name><label>Item 458 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf459</name><label>Item 459 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf460</name><label>Item 460 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf461</name><label>Item 461 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf462</name><label>Item 462 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf463</name><label>Item 463 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf464</name><label>Item 464 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf465</name><label>Item 465 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf466</name><label>Item 466 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf467</name><label>Item 467 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf468</name><label>Item 468 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf469</name><label>Item 469 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf470</name><label>Item 470 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf471</name><label>Item 471 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf472</name><label>Item 472 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf473</name><label>Item 473 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf474</name><label>Item 474 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf475</name><label>Item 475 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf476</name><label>Item 476 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf477</name><label>Item 477 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf478</name><label>Item 478 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf479</name><label>Item 479 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf480</name><label>Item 480 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf481</name><label>Item 481 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf482</name><label>Item 482 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf483</name><label>Item 483 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf484</name><label>Item 484 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf485</name><label>Item 485 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf486</name><label>Item 486 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf487</name><label>Item 487 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf488</name><label>Item 488 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf489</name><label>Item 489 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf490</name><label>Item 490 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf491</name><label>Item 491 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf492</name><label>Item 492 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf493</name><label>Item 493 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf494</name><label>Item 494 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf495</name><label>Item 495 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              <item><name>perf496</name><label>Item 496 — agriculture</label><cat>agriculture</cat><region>center</region></item>
              <item><name>perf497</name><label>Item 497 — livestock</label><cat>livestock</cat><region>center</region></item>
              <item><name>perf498</name><label>Item 498 — forestry</label><cat>forestry</cat><region>center</region></item>
              <item><name>perf499</name><label>Item 499 — fishing</label><cat>fishing</cat><region>center</region></item>
              <item><name>perf500</name><label>Item 500 — horticulture</label><cat>horticulture</cat><region>center</region></item>
              </root>
            </instance>
      <bind nodeset="/data/start" type="dateTime" jr:preload="timestamp" jr:preloadParams="start" readonly="true()"/>
      <bind nodeset="/data/end" type="dateTime" jr:preload="timestamp" jr:preloadParams="end" readonly="true()"/>
      <bind nodeset="/data/today" type="date" jr:preload="date" jr:preloadParams="today" readonly="true()"/>
      <bind nodeset="/data/username" type="string" jr:preload="property" jr:preloadParams="username" readonly="true()"/>
      <bind nodeset="/data/deviceid" type="string" jr:preload="property" jr:preloadParams="deviceid" readonly="true()"/>
      <bind nodeset="/data/subscriberid" type="string" jr:preload="property" jr:preloadParams="subscriberid" readonly="true()"/>
      <bind nodeset="/data/simserial" type="string" jr:preload="property" jr:preloadParams="simserial" readonly="true()"/>
      <bind nodeset="/data/phonenumber" type="string" jr:preload="property" jr:preloadParams="phonenumber" readonly="true()"/>
      <bind nodeset="/data/meta/instanceID" type="string" calculate="concat('uuid:',uuid())" readonly="true()"/>
      <bind nodeset="/data/meta/instanceName" type="string" calculate="concat(/data/g_personal/q_name,' ',format-date(today(),'%Y%m%d'))" readonly="true()"/>
      <bind nodeset="/data/q_text" type="string" required="true()" constraint="string-length(normalize-space(.)) &gt; 0 and string-length(.) &lt;= 500" jr:constraintMsg="Max 500 chars"/>
      <bind nodeset="/data/q_integer" type="int" required="true()" constraint=". &gt;= 0 and . &lt;= 120" jr:constraintMsg="Must be 0-120"/>
      <bind nodeset="/data/q_decimal" type="decimal" constraint=". &gt; 0 and . &lt;= 9999.99" jr:constraintMsg="Must be positive, max 9999.99"/>
      <bind nodeset="/data/q_range" type="int"/>
      <bind nodeset="/data/q_date" type="date" constraint=". &gt;= date('2010-01-01') and . &lt;= today()" jr:constraintMsg="Date between 2010 and today"/>
      <bind nodeset="/data/q_time" type="time"/>
      <bind nodeset="/data/q_datetime" type="dateTime"/>
      <bind nodeset="/data/q_note" type="string" calculate="concat('Name:',/data/g_personal/q_name,' Province:',jr:choice-name(/data/q_province,'/data/q_province'),' Pi:',/data/calc_pi,' Random:',/data/calc_random)" readonly="true()"/>
      <bind nodeset="/data/q_acknowledge" type="string"/>
      <bind nodeset="/data/q_image" type="binary"/>
      <bind nodeset="/data/q_audio" type="binary"/>
      <bind nodeset="/data/q_video" type="binary"/>
      <bind nodeset="/data/q_file" type="binary"/>
      <bind nodeset="/data/q_barcode" type="barcode"/>
      <bind nodeset="/data/q_signature" type="binary"/>
      <bind nodeset="/data/q_geopoint" type="geopoint"/>
      <bind nodeset="/data/q_geotrace" type="geotrace"/>
      <bind nodeset="/data/q_geoshape" type="geoshape"/>
      <bind nodeset="/data/q_province" type="string"/>
      <bind nodeset="/data/q_municipality" type="string" relevant="/data/q_province != ''"/>
      <bind nodeset="/data/q_select_auto" type="string"/>
      <bind nodeset="/data/q_select_likert" type="string"/>
      <bind nodeset="/data/q_select_horiz" type="string"/>
      <bind nodeset="/data/q_select_compact" type="string"/>
      <bind nodeset="/data/q_select_multiple" type="string"/>
      <bind nodeset="/data/q_select_list" type="string"/>
      <bind nodeset="/data/q_select_inline" type="string"/>
      <bind nodeset="/data/q_rank" type="string"/>
      <bind nodeset="/data/g_personal/q_name" type="string" required="true()"/>
      <bind nodeset="/data/g_personal/q_age" type="int" constraint=". &gt;= 0 and . &lt;= 150"/>
      <bind nodeset="/data/g_personal/q_gender" type="string"/>
      <bind nodeset="/data/g_outer/q_outer_q1" type="string"/>
      <bind nodeset="/data/g_outer/g_inner" relevant="/data/g_outer/q_outer_q1 != ''"/>
      <bind nodeset="/data/g_outer/g_inner/q_inner_q1" type="string"/>
      <bind nodeset="/data/g_outer/g_inner/q_inner_q2" type="int"/>
      <bind nodeset="/data/r_contacts/rq_c_name" type="string" required="true()"/>
      <bind nodeset="/data/r_contacts/rq_c_phone" type="string" constraint="regex(., '^[0-9+\\-\\s]{7,15}$')" jr:constraintMsg="Valid phone number"/>
      <bind nodeset="/data/r_contacts/rq_c_type" type="string"/>
      <bind nodeset="/data/r_contacts/rq_c_count" type="int" calculate="count(../../r_contacts)" readonly="true()"/>
      <bind nodeset="/data/r_projects/rq_p_name" type="string" required="true()"/>
      <bind nodeset="/data/r_projects/r_tasks/rq_t_name" type="string"/>
      <bind nodeset="/data/r_projects/r_tasks/rq_t_done" type="string"/>
      <bind nodeset="/data/r_projects/r_tasks/rq_t_hours" type="decimal" constraint=". &gt;= 0"/>
      <bind nodeset="/data/calc_abs" type="string" calculate="abs(-42)" readonly="true()"/>
      <bind nodeset="/data/calc_round" type="string" calculate="round(3.14159, 2)" readonly="true()"/>
      <bind nodeset="/data/calc_sqrt" type="string" calculate="sqrt(16)" readonly="true()"/>
      <bind nodeset="/data/calc_pow" type="string" calculate="pow(2, 10)" readonly="true()"/>
      <bind nodeset="/data/calc_exp" type="string" calculate="exp(1)" readonly="true()"/>
      <bind nodeset="/data/calc_log" type="string" calculate="log(2.71828182845905)" readonly="true()"/>
      <bind nodeset="/data/calc_sin" type="string" calculate="sin(pi() div 2)" readonly="true()"/>
      <bind nodeset="/data/calc_cos" type="string" calculate="cos(0)" readonly="true()"/>
      <bind nodeset="/data/calc_tan" type="string" calculate="tan(pi() div 4)" readonly="true()"/>
      <bind nodeset="/data/calc_pi" type="string" calculate="pi()" readonly="true()"/>
      <bind nodeset="/data/calc_concat" type="string" calculate="concat('Text=',/data/q_text,' | Age=',/data/q_integer)" readonly="true()"/>
      <bind nodeset="/data/calc_contains" type="string" calculate="if(contains(/data/q_text,'test'),'Match','No match')" readonly="true()"/>
      <bind nodeset="/data/calc_startswith" type="string" calculate="if(starts-with(/data/q_text,'A'),'yes','no')" readonly="true()"/>
      <bind nodeset="/data/calc_endswith" type="string" calculate="if(ends-with(/data/q_text,'z'),'yes','no')" readonly="true()"/>
      <bind nodeset="/data/calc_substr" type="string" calculate="substr(/data/q_text,1,3)" readonly="true()"/>
      <bind nodeset="/data/calc_strlen" type="int" calculate="string-length(/data/q_text)" readonly="true()"/>
      <bind nodeset="/data/calc_normalize" type="string" calculate="normalize-space(/data/q_text)" readonly="true()"/>
      <bind nodeset="/data/calc_translate" type="string" calculate="translate(/data/q_text,'aeiou','AEIOU')" readonly="true()"/>
      <bind nodeset="/data/calc_today2" type="date" calculate="today()" readonly="true()"/>
      <bind nodeset="/data/calc_now2" type="dateTime" calculate="now()" readonly="true()"/>
      <bind nodeset="/data/calc_fmtdate" type="string" calculate="format-date(today(),'%b %e, %Y')" readonly="true()"/>
      <bind nodeset="/data/calc_fmtdatetime" type="string" calculate="format-date-time(now(),'%Y-%m-%dT%H:%M:%S')" readonly="true()"/>
      <bind nodeset="/data/calc_dectime" type="decimal" calculate="decimal-time(now())" readonly="true()"/>
      <bind nodeset="/data/calc_distance" type="decimal" calculate="if(/data/q_geotrace != '',distance(/data/q_geotrace),0)" readonly="true()"/>
      <bind nodeset="/data/calc_area" type="decimal" calculate="if(/data/q_geoshape != '',area(/data/q_geoshape),0)" readonly="true()"/>
      <bind nodeset="/data/calc_coalesce" type="string" calculate="coalesce(/data/q_text,'(empty)')" readonly="true()"/>
      <bind nodeset="/data/calc_random" type="decimal" calculate="once(random())" readonly="true()"/>
      <bind nodeset="/data/calc_once_ts" type="dateTime" calculate="once(now())" readonly="true()"/>
      <bind nodeset="/data/calc_choicename" type="string" calculate="jr:choice-name(/data/q_province,'/data/q_province')" readonly="true()"/>
      <bind nodeset="/data/calc_countsel" type="int" calculate="count-selected(/data/q_select_multiple)" readonly="true()"/>
      <bind nodeset="/data/calc_selectedat" type="string" calculate="selected-at(/data/q_select_multiple,0)" readonly="true()"/>
      <bind nodeset="/data/calc_selected_check" type="string" calculate="if(selected(/data/q_select_multiple,'health'),'Health selected','Health not selected')" readonly="true()"/>
      <bind nodeset="/data/v_positive" type="int" required="true()" constraint=". &gt; 0" jr:constraintMsg="Must be positive"/>
      <bind nodeset="/data/v_regex" type="string" constraint="regex(.,'[A-Za-z0-9_]+')" jr:constraintMsg="Letters numbers underscore only"/>
      <bind nodeset="/data/v_date_range" type="date" constraint=". &gt;= date('2020-01-01') and . &lt;= today()" jr:constraintMsg="Between 2020 and today"/>
      <bind nodeset="/data/v_complex" type="string" relevant="/data/q_integer &gt; 0 and /data/q_province != ''" required="true()"/>
      <bind nodeset="/data/q_it_text" type="string"/>
      <bind nodeset="/data/q_it_num" type="int" required="true()" jr:requiredMsg="jr:itext('q_it_num:requiredMsg')" constraint=". &gt; 0 and . &lt;= 100" jr:constraintMsg="jr:itext('q_it_num:constraintMsg')"/>
      <bind nodeset="/data/q_it_select" type="string"/>
      <bind nodeset="/data/q_it_req" type="string" required="true()" jr:requiredMsg="jr:itext('q_it_req:requiredMsg')"/>
      <bind nodeset="/data/q_app_vertical" type="string"/>
      <bind nodeset="/data/q_app_c1" type="string"/>
      <bind nodeset="/data/q_app_c2" type="string"/>
      <bind nodeset="/data/q_app_c3" type="string"/>
      <bind nodeset="/data/q_app_c4" type="string"/>
      <bind nodeset="/data/q_app_qc" type="string"/>
      <bind nodeset="/data/q_app_qc1" type="string"/>
      <bind nodeset="/data/q_app_qc2" type="string"/>
      <bind nodeset="/data/q_app_qc3" type="string"/>
      <bind nodeset="/data/q_app_qc4" type="string"/>
      <bind nodeset="/data/q_app_label" type="string"/>
      <bind nodeset="/data/q_app_imagemap" type="string"/>
      <bind nodeset="/data/g_tablelist/q_tl_a" type="string"/>
      <bind nodeset="/data/g_tablelist/q_tl_b" type="string"/>
      <bind nodeset="/data/g_tablelist/q_tl_c" type="string"/>
      <bind nodeset="/data/q_ml_img" type="string"/>
      <bind nodeset="/data/q_ml_audio" type="string"/>
      <bind nodeset="/data/q_ml_video" type="string"/>
      <bind nodeset="/data/q_mc_media" type="string"/>
      <bind nodeset="/data/q_country" type="string"/>
      <bind nodeset="/data/q_state2" type="string" relevant="/data/q_country != ''"/>
      <bind nodeset="/data/q_city2" type="string" relevant="/data/q_country != '' and /data/q_state2 != ''"/>
      <bind nodeset="/data/q_community2" type="string" relevant="/data/q_country != '' and /data/q_state2 != '' and /data/q_city2 != ''"/>
      <bind nodeset="/data/q_cf_complex" type="string" relevant="/data/q_country != ''"/>
      <bind nodeset="/data/r3_projects/rp3_name" type="string"/>
      <bind nodeset="/data/r3_projects/rp3_budget" type="decimal"/>
      <bind nodeset="/data/r3_projects/rp3_status" type="string"/>
      <bind nodeset="/data/r3_projects/r3_activities/ra3_name" type="string"/>
      <bind nodeset="/data/r3_projects/r3_activities/ra3_status" type="string"/>
      <bind nodeset="/data/r3_projects/r3_activities/ra3_pos" type="string" calculate="position(..)" readonly="true()"/>
      <bind nodeset="/data/r3_projects/r3_activities/ra3_cur" type="string" calculate="string(current()/ra3_name)" readonly="true()"/>
      <bind nodeset="/data/r3_projects/r3_activities/r3_tasks/rt3_name" type="string"/>
      <bind nodeset="/data/r3_projects/r3_activities/r3_tasks/rt3_pct" type="int"/>
      <bind nodeset="/data/r3_projects/r3_activities/r3_tasks/rt3_hours" type="decimal"/>
      <bind nodeset="/data/r3_projects/r3_activities/r3_tasks/rt3_done" type="string"/>
      <bind nodeset="/data/r3_projects/r3_activities/r3_tasks/rt3_idx" type="string" calculate="indexed-repeat(/data/r3_projects/r3_activities/ra3_name, /data/r3_projects, 1, /data/r3_projects/r3_activities, 1)" readonly="true()"/>
      <bind nodeset="/data/calc_not_fn" type="string" calculate="if(not(false()), 'not(false)=true', 'unexpected')" readonly="true()"/>
      <bind nodeset="/data/calc_mod_fn" type="int" calculate="10 mod 3" readonly="true()"/>
      <bind nodeset="/data/calc_boolstr" type="string" calculate="if(boolean-from-string('true'), 'TRUE', 'FALSE')" readonly="true()"/>
      <bind nodeset="/data/calc_uuid_fn" type="string" calculate="uuid()" readonly="true()"/>
      <bind nodeset="/data/calc_join_fn" type="string" calculate="join(', ', /data/q_select_multiple)" readonly="true()"/>
      <bind nodeset="/data/calc_max_fn" type="int" calculate="max(/data/q_integer, /data/g_personal/q_age)" readonly="true()"/>
      <bind nodeset="/data/calc_min_fn" type="int" calculate="min(/data/q_integer, /data/g_personal/q_age)" readonly="true()"/>
      <bind nodeset="/data/calc_sum_fn" type="int" calculate="sum(/data/r_contacts/rq_c_count)" readonly="true()"/>
      <bind nodeset="/data/q_geo_fenced" type="geopoint" constraint="geofence(., '19.4326 -99.1332 0 5000') or geofence(., '20.9674 -89.6237 0 10000')" jr:constraintMsg="jr:itext('q_geo_fenced:constraintMsg')"/>
      <bind nodeset="/data/calc_geo_area2" type="decimal" calculate="if(/data/q_geoshape != '', area(/data/q_geoshape), 0)" readonly="true()"/>
      <bind nodeset="/data/calc_geo_dist2" type="decimal" calculate="if(/data/q_geotrace != '', distance(/data/q_geotrace), 0)" readonly="true()"/>
      <bind nodeset="/data/q_ff1" type="string"/>
      <bind nodeset="/data/q_ff2" type="string"/>
      <bind nodeset="/data/audit" type="binary" jr:preload="audit"/>
      <bind nodeset="/data/g_rel_adv" relevant="number(/data/q_integer) &gt; 18 or selected(/data/q_select_multiple, 'health') or selected(/data/q_select_multiple, 'education') or not(/data/q_select_horiz = '0') and /data/q_text != ''"/>
      <bind nodeset="/data/g_rel_adv/q_rel_a" type="string" relevant="number(/data/q_integer) &gt; 18 and /data/q_province != '' and /data/q_select_horiz = '1'"/>
      <bind nodeset="/data/g_rel_adv/q_rel_b" type="string" relevant="selected(/data/q_select_multiple, 'health') or selected(/data/q_select_multiple, 'education')"/>
      <bind nodeset="/data/g_rel_adv/q_rel_c" type="string" relevant="not(/data/q_select_horiz = '0') and /data/q_text != ''"/>
      <bind nodeset="/data/q_con_email" type="string" constraint="regex(., '^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$')" jr:constraintMsg="jr:itext('q_con_email:constraintMsg')"/>
      <bind nodeset="/data/q_con_cross" type="decimal" constraint=". &gt; /data/q_decimal" jr:constraintMsg="jr:itext('q_con_cross:constraintMsg')"/>
      <bind nodeset="/data/q_con_date_min" type="date" constraint=". &gt;= date('2020-01-01')" jr:constraintMsg="jr:itext('q_con_date_min:constraintMsg')"/>
      <bind nodeset="/data/q_con_date_max" type="date" constraint=". &lt;= today()" jr:constraintMsg="jr:itext('q_con_date_max:constraintMsg')"/>
      <bind nodeset="/data/q_def_once" type="string" calculate="once(uuid())" readonly="true()"/>
      <bind nodeset="/data/q_def_chain" type="string" calculate="concat(/data/g_personal/q_name, ' (', /data/q_country, ' / ', /data/q_state2, ')')" readonly="true()"/>
      <bind nodeset="/data/q_def_today" type="date" calculate="today()" readonly="true()"/>
      <bind nodeset="/data/s_t1" type="string"/>
      <bind nodeset="/data/s_t2" type="string"/>
      <bind nodeset="/data/s_t3" type="string"/>
      <bind nodeset="/data/s_t4" type="string"/>
      <bind nodeset="/data/s_t5" type="string"/>
      <bind nodeset="/data/s_i1" type="int"/>
      <bind nodeset="/data/s_i2" type="int"/>
      <bind nodeset="/data/s_i3" type="int"/>
      <bind nodeset="/data/s_s1" type="string"/>
      <bind nodeset="/data/s_s2" type="string"/>
      <bind nodeset="/data/s_s3" type="string"/>
      <bind nodeset="/data/s_d1" type="date"/>
      <bind nodeset="/data/s_geo1" type="geopoint"/>
      <bind nodeset="/data/s_img1" type="binary"/>
      <bind nodeset="/data/s_dec1" type="decimal"/>
      <bind nodeset="/data/s_n1" type="string" calculate="concat('Stress: ', /data/calc_pi, ' mod test: ', /data/calc_mod_fn, ' uuid: ', /data/calc_uuid_fn)" readonly="true()"/>
      <bind nodeset="/data/s_n2" type="string" calculate="concat('Max:', /data/calc_max_fn, ' Min:', /data/calc_min_fn, ' Sum:', /data/calc_sum_fn, ' Join:', /data/calc_join_fn)" readonly="true()"/>
      <bind nodeset="/data/s_calc1" type="string" calculate="format-date-time(now(), '%Y-%m-%dT%H:%M:%S')" readonly="true()"/>
      <bind nodeset="/data/s_calc2" type="decimal" calculate="round(sqrt(pow(3,2) + pow(4,2)), 4)" readonly="true()"/>
      <bind nodeset="/data/s_calc3" type="string" calculate="if(count-selected(/data/q_select_compact) &gt; 2, 'many', 'few')" readonly="true()"/>
      <bind nodeset="/data/s_ack1" type="string"/>
      <bind nodeset="/data/q_locality" type="string" relevant="/data/q_community2 != ''" jr:requiredMsg="jr:itext('q_locality:requiredMsg')"/>
      <bind nodeset="/data/q_entity_key" type="string"/>
      <bind nodeset="/data/q_entity_val" type="string" readonly="true()" calculate="instance('entities_data')/root/entity[key=/data/q_entity_key]/value"/>

      <bind nodeset="/data/q_perf_one" type="string"/>
      <bind nodeset="/data/q_perf_filtered" type="string"/>
      <bind nodeset="/data/q_perf_multi" type="string"/>
      <bind nodeset="/data/q_audio_choice" type="string"/>
      <bind nodeset="/data/q_video_choice" type="string"/>
      <bind nodeset="/data/g_enketo_edge" type="string"/>
      <bind nodeset="/data/g_enketo_edge/eq_sum_tasks" type="decimal" readonly="true()" calculate="sum(/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_hours[. != ''])"/>
      <bind nodeset="/data/g_enketo_edge/eq_idx_deep" type="string" readonly="true()" calculate="indexed-repeat(/data/r4_programs/rp4_name, /data/r4_programs, 1)"/>
      <bind nodeset="/data/g_enketo_edge/eq_nr_constraint" type="string" constraint="not(contains(., '&lt;')) and regex(., '^[^&quot;]*$') and string-length(.) &lt;= 200" jr:constraintMsg="jr:itext('eq_nr_constraint:constraintMsg')"/>
      <bind nodeset="/data/g_enketo_edge/eq_nr_relevant" type="string" relevant="count(/data/r4_programs) &gt; 0 and /data/q_select_horiz = '1' and selected(/data/q_select_multiple, 'agriculture')"/>
      <bind nodeset="/data/g_enketo_edge/eq_count_done" type="int" readonly="true()" calculate="count(/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_done[. = '1'])"/>
      <bind nodeset="/data/r4_programs/rp4_name" type="string" required="true()" jr:requiredMsg="jr:itext('rp4_name:requiredMsg')"/>
      <bind nodeset="/data/r4_programs/rp4_type" type="string"/>
      <bind nodeset="/data/r4_programs/rp4_budget_total" type="decimal" constraint=". &gt; 0" jr:constraintMsg="jr:itext('rp4_budget_total:constraintMsg')"/>
      <bind nodeset="/data/r4_programs/r4_projects/rj4_name" type="string" required="true()" jr:requiredMsg="jr:itext('rj4_name:requiredMsg')"/>
      <bind nodeset="/data/r4_programs/r4_projects/rj4_budget" type="decimal" constraint=". &gt;= 0 and . &lt;= /data/r4_programs/rp4_budget_total" jr:constraintMsg="jr:itext('rj4_budget:constraintMsg')"/>
      <bind nodeset="/data/r4_programs/r4_projects/rj4_status" type="string"/>
      <bind nodeset="/data/r4_programs/r4_projects/rj4_pos" type="string" readonly="true()" calculate="position(..)"/>
      <bind nodeset="/data/r4_programs/r4_projects/rj4_count_acts" type="int" readonly="true()" calculate="count(../r4_activities/ra4_name[. != ''])"/>
      <bind nodeset="/data/r4_programs/r4_projects/r4_activities/ra4_name" type="string" required="true()" jr:requiredMsg="jr:itext('ra4_name:requiredMsg')"/>
      <bind nodeset="/data/r4_programs/r4_projects/r4_activities/ra4_type" type="string"/>
      <bind nodeset="/data/r4_programs/r4_projects/r4_activities/ra4_pct" type="int" constraint=". &gt;= 0 and . &lt;= 100" jr:constraintMsg="jr:itext('ra4_pct:constraintMsg')"/>
      <bind nodeset="/data/r4_programs/r4_projects/r4_activities/ra4_cur_proj" type="string" readonly="true()" calculate="string(current()/../../rj4_name)"/>
      <bind nodeset="/data/r4_programs/r4_projects/r4_activities/ra4_pos" type="string" readonly="true()" calculate="position(..)"/>
      <bind nodeset="/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_name" type="string" required="true()" jr:requiredMsg="jr:itext('rt4_name:requiredMsg')"/>
      <bind nodeset="/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_hours" type="decimal" constraint=". &gt;= 0 and . &lt;= 2400" jr:constraintMsg="jr:itext('rt4_hours:constraintMsg')"/>
      <bind nodeset="/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_done" type="string"/>
      <bind nodeset="/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_priority" type="string"/>
      <bind nodeset="/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_pos" type="string" readonly="true()" calculate="position(..)"/>
      <bind nodeset="/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_idx" type="string" readonly="true()" calculate="indexed-repeat(/data/r4_programs/rp4_name, /data/r4_programs, 1)"/>
      <bind nodeset="/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_cur_act" type="string" readonly="true()" calculate="string(current()/../../ra4_name)"/>
    </model>
  </h:head>
  <h:body>
    <group>
      <label>S1: Basic Types</label>
      <input ref="/data/q_text">
        <label>Text</label>
        <hint>Max 500 chars</hint>
      </input>
      <input ref="/data/q_integer">
        <label>Integer (0-120)</label>
      </input>
      <input ref="/data/q_decimal">
        <label>Decimal (positive, max 9999.99)</label>
      </input>
      <range ref="/data/q_range" start="1" end="10" step="1">
        <label>Range (1–10)</label>
        <hint>Slide or select a value between 1 and 10</hint>
      </range>
      <input ref="/data/q_date">
        <label>Date (2010-today)</label>
      </input>
      <input ref="/data/q_time">
        <label>Time</label>
      </input>
      <input ref="/data/q_datetime">
        <label>Date and Time</label>
      </input>
      <input ref="/data/q_note">
        <label>Summary (auto-calculated)</label>
      </input>
      <trigger ref="/data/q_acknowledge">
        <label>Acknowledge</label>
      </trigger>
    </group>
    <group>
      <label>S2: Media</label>
      <upload ref="/data/q_image" mediatype="image/*">
        <label>Image (new)</label>
      </upload>
      <upload ref="/data/q_audio" mediatype="audio/*">
        <label>Audio</label>
      </upload>
      <upload ref="/data/q_video" mediatype="video/*">
        <label>Video</label>
      </upload>
      <upload ref="/data/q_file" mediatype="application/*">
        <label>File</label>
      </upload>
      <input ref="/data/q_barcode" appearance="barcode">
        <label>Barcode / QR Scanner</label>
        <hint>Scan a barcode or QR code. Bind type: barcode (stores as string).</hint>
      </input>
      <input appearance="signature" ref="/data/q_signature">
        <label>Signature</label>
      </input>
    </group>
    <input ref="/data/q_geopoint">
      <label>Geopoint</label>
    </input>
    <input ref="/data/q_geotrace">
      <label>Geotrace</label>
    </input>
    <input ref="/data/q_geoshape">
      <label>Geoshape</label>
    </input>
    <group>
      <label>S4: Selections</label>
      <select1 ref="/data/q_province" appearance="minimal">
        <label>Province</label>
        <itemset nodeset="instance('provinces')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>
      <select1 ref="/data/q_municipality" appearance="minimal">
        <label>Municipality</label>
        <itemset nodeset="instance('municipalities')/root/item[province_id=/data/q_province]">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>
      <select1 ref="/data/q_select_auto" appearance="autocomplete">
        <label>Category (autocomplete)</label>
        <itemset nodeset="instance('categories')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>
      <select1 ref="/data/q_select_likert" appearance="likert">
        <label>Likert Scale</label>
        <itemset nodeset="instance('likert_scale')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>
      <select1 ref="/data/q_select_horiz" appearance="horizontal">
        <label>Yes / No (horizontal)</label>
        <itemset nodeset="instance('yes_no')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>
      <select ref="/data/q_select_compact" appearance="compact">
        <label>Categories (compact)</label>
        <itemset nodeset="instance('categories')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select>
      <select ref="/data/q_select_multiple">
        <label>Multiple Categories</label>
        <itemset nodeset="instance('categories')/root/item">
          <value ref="name"/>
          <label ref="label"/>
          <hint ref="image"/>
        </itemset>
      </select>
      <select ref="/data/q_select_inline">
        <label>Selección múltiple (items inline)</label>
        <hint>Selecciona una o varias opciones.</hint>
        <item><label>Rojo</label><value>red</value></item>
        <item><label>Verde</label><value>green</value></item>
        <item><label>Azul</label><value>blue</value></item>
        <item><label>Amarillo</label><value>yellow</value></item>
        <item><label>Naranja</label><value>orange</value></item>
      </select>
      <select ref="/data/q_select_list" appearance="list">
        <label>Multiple Categories (list)</label>
        <itemset nodeset="instance('categories')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select>
      <odk:rank ref="/data/q_rank">
        <label>Rank Priorities</label>
        <itemset nodeset="instance('priorities')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </odk:rank>
    </group>
    <group ref="/data/g_personal" appearance="field-list">
      <label>S5: Personal Info</label>
      <input ref="/data/g_personal/q_name">
        <label>Name</label>
      </input>
      <input ref="/data/g_personal/q_age">
        <label>Age</label>
      </input>
      <select1 ref="/data/g_personal/q_gender" appearance="horizontal">
        <label>Gender</label>
        <itemset nodeset="instance('yes_no')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>
    </group>
    <group ref="/data/g_outer">
      <label>S6: Nested Groups</label>
      <input ref="/data/g_outer/q_outer_q1">
        <label>Outer Question 1</label>
      </input>
      <group ref="/data/g_outer/g_inner">
        <label>Inner Group</label>
        <input ref="/data/g_outer/g_inner/q_inner_q1">
          <label>Inner Question 1</label>
        </input>
        <input ref="/data/g_outer/g_inner/q_inner_q2">
          <label>Inner Question 2 (integer)</label>
        </input>
      </group>
    </group>
    <group>
      <label>S7: Contacts</label>
      <repeat nodeset="/data/r_contacts">
        <input ref="rq_c_name">
          <label>Contact Name</label>
        </input>
        <input ref="rq_c_phone">
          <label>Phone Number</label>
        </input>
        <select1 ref="rq_c_type" appearance="minimal">
          <label>Contact Type</label>
          <itemset nodeset="instance('categories')/root/item">
            <value ref="name"/>
            <label ref="label"/>
          </itemset>
        </select1>
      </repeat>
    </group>
    <group>
      <label>S8: Projects</label>
      <group ref="/data/r_projects">
        <label>Projects</label>
        <repeat nodeset="/data/r_projects">
          <input ref="rq_p_name">
            <label>Project Name</label>
          </input>
          <repeat nodeset="r_tasks">
            <input ref="rq_t_name">
              <label>Task Name</label>
            </input>
            <select1 ref="rq_t_done" appearance="horizontal">
              <label>Done?</label>
              <itemset nodeset="instance('yes_no')/root/item">
                <value ref="name"/>
                <label ref="label"/>
              </itemset>
            </select1>
            <input ref="rq_t_hours">
              <label>Hours</label>
            </input>
          </repeat>
        </repeat>
      </group>
    </group>
    <group>
      <label>S14: Validation Tests</label>
      <input ref="/data/v_positive">
        <label>Positive Integer</label>
      </input>
      <input ref="/data/v_regex">
        <label>Alphanumeric / Underscore Only</label>
      </input>
      <input ref="/data/v_date_range">
        <label>Date (2020-today)</label>
      </input>
      <input ref="/data/v_complex">
        <label>Complex Field (visible when integer &gt; 0 and province selected)</label>
      </input>
    </group>

    <group>
      <label>iText Internationalization Demo</label>
      <input ref="/data/q_it_text">
        <label ref="jr:itext('q_it_text:label')"/>
        <hint ref="jr:itext('q_it_text:hint')"/>
      </input>
      <input ref="/data/q_it_num">
        <label ref="jr:itext('q_it_num:label')"/>
        <hint ref="jr:itext('q_it_num:hint')"/>
      </input>
      <select1 ref="/data/q_it_select" appearance="minimal">
        <label ref="jr:itext('q_it_select:label')"/>
        <hint ref="jr:itext('q_it_select:hint')"/>
        <itemset nodeset="instance('likert_scale')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>
      <input ref="/data/q_it_req">
        <label ref="jr:itext('q_it_req:label')"/>
        <hint ref="jr:itext('q_it_req:hint')"/>
      </input>
    </group>

    <group>
      <label>Missing Appearances</label>

      <select ref="/data/q_app_vertical" appearance="vertical">
        <label ref="jr:itext('q_app_vertical:label')"/>
        <hint ref="jr:itext('q_app_vertical:hint')"/>
        <itemset nodeset="instance('likert_scale')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select>

      <select ref="/data/q_app_c1" appearance="compact-1">
        <label ref="jr:itext('q_app_c1:label')"/>
        <hint ref="jr:itext('q_app_c1:hint')"/>
        <itemset nodeset="instance('likert_scale')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select>

      <select ref="/data/q_app_c2" appearance="compact-2">
        <label ref="jr:itext('q_app_c2:label')"/>
        <hint ref="jr:itext('q_app_c2:hint')"/>
        <itemset nodeset="instance('likert_scale')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select>

      <select ref="/data/q_app_c3" appearance="compact-3">
        <label ref="jr:itext('q_app_c3:label')"/>
        <hint ref="jr:itext('q_app_c3:hint')"/>
        <itemset nodeset="instance('likert_scale')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select>

      <select ref="/data/q_app_c4" appearance="compact-4">
        <label ref="jr:itext('q_app_c4:label')"/>
        <hint ref="jr:itext('q_app_c4:hint')"/>
        <itemset nodeset="instance('likert_scale')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select>

      <select ref="/data/q_app_qc" appearance="quickcompact">
        <label ref="jr:itext('q_app_qc:label')"/>
        <hint ref="jr:itext('q_app_qc:hint')"/>
        <itemset nodeset="instance('categories')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select>

      <select ref="/data/q_app_qc1" appearance="quickcompact-1">
        <label ref="jr:itext('q_app_qc1:label')"/>
        <hint ref="jr:itext('q_app_qc1:hint')"/>
        <itemset nodeset="instance('categories')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select>

      <select ref="/data/q_app_qc2" appearance="quickcompact-2">
        <label ref="jr:itext('q_app_qc2:label')"/>
        <hint ref="jr:itext('q_app_qc2:hint')"/>
        <itemset nodeset="instance('categories')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select>

      <select ref="/data/q_app_qc3" appearance="quickcompact-3">
        <label ref="jr:itext('q_app_qc3:label')"/>
        <hint ref="jr:itext('q_app_qc3:hint')"/>
        <itemset nodeset="instance('categories')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select>

      <select ref="/data/q_app_qc4" appearance="quickcompact-4">
        <label ref="jr:itext('q_app_qc4:label')"/>
        <hint ref="jr:itext('q_app_qc4:hint')"/>
        <itemset nodeset="instance('categories')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select>

      <select1 ref="/data/q_app_label" appearance="label">
        <label ref="jr:itext('q_app_label:label')"/>
        <hint ref="jr:itext('q_app_label:hint')"/>
        <itemset nodeset="instance('yes_no')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>

      <select1 ref="/data/q_app_imagemap" appearance="image-map" jr:count="5">
        <label ref="jr:itext('q_app_imagemap:label')"/>
        <hint ref="jr:itext('q_app_imagemap:hint')"/>
        <itemset nodeset="instance('sectors')/root/item">
          <value ref="name"/>
          <label ref="label"/>
          <mediatype ref="type"/>
        </itemset>
      </select1>

      <group ref="/data/g_tablelist" appearance="table-list">
        <label ref="jr:itext('g_tablelist:label')"/>
        <select1 ref="/data/g_tablelist/q_tl_a">
          <label ref="jr:itext('q_tl_a:label')"/>
          <hint ref="jr:itext('q_tl_a:hint')"/>
          <itemset nodeset="instance('yes_no')/root/item">
            <value ref="name"/>
            <label ref="label"/>
          </itemset>
        </select1>
        <select1 ref="/data/g_tablelist/q_tl_b">
          <label ref="jr:itext('q_tl_b:label')"/>
          <hint ref="jr:itext('q_tl_b:hint')"/>
          <itemset nodeset="instance('yes_no')/root/item">
            <value ref="name"/>
            <label ref="label"/>
          </itemset>
        </select1>
        <select1 ref="/data/g_tablelist/q_tl_c">
          <label ref="jr:itext('q_tl_c:label')"/>
          <hint ref="jr:itext('q_tl_c:hint')"/>
          <itemset nodeset="instance('yes_no')/root/item">
            <value ref="name"/>
            <label ref="label"/>
          </itemset>
        </select1>
      </group>
    </group>

    <group>
      <label>Media in Labels</label>

      <input ref="/data/q_ml_img">
        <label ref="jr:itext('q_ml_img:label')"/>
        <hint ref="jr:itext('q_ml_img:hint')"/>
      </input>

      <input ref="/data/q_ml_audio">
        <label ref="jr:itext('q_ml_audio:label')"/>
        <hint ref="jr:itext('q_ml_audio:hint')"/>
      </input>

      <input ref="/data/q_ml_video">
        <label ref="jr:itext('q_ml_video:label')"/>
        <hint ref="jr:itext('q_ml_video:hint')"/>
      </input>

      <select1 ref="/data/q_mc_media" appearance="minimal">
        <label ref="jr:itext('q_mc_media:label')"/>
        <hint ref="jr:itext('q_mc_media:hint')"/>
        <itemset nodeset="instance('media_opts')/root/item">
          <value ref="name"/>
          <label ref="label"/>
          <hint ref="audio"/>
        </itemset>
      </select1>
    </group>

    <group>
      <label>4-Level Cascading Select</label>

      <select1 ref="/data/q_country" appearance="minimal">
        <label ref="jr:itext('q_country:label')"/>
        <hint ref="jr:itext('q_country:hint')"/>
        <itemset nodeset="instance('countries')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>

      <select1 ref="/data/q_state2" appearance="minimal">
        <label ref="jr:itext('q_state2:label')"/>
        <hint ref="jr:itext('q_state2:hint')"/>
        <itemset nodeset="instance('mx_states')/root/item[country_id=/data/q_country]">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>

      <select1 ref="/data/q_city2" appearance="minimal">
        <label ref="jr:itext('q_city2:label')"/>
        <hint ref="jr:itext('q_city2:hint')"/>
        <itemset nodeset="instance('mx_cities')/root/item[state_id=/data/q_state2]">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>

      <select1 ref="/data/q_community2" appearance="minimal">
        <label ref="jr:itext('q_community2:label')"/>
        <hint ref="jr:itext('q_community2:hint')"/>
        <itemset nodeset="instance('mx_communities')/root/item[city_id=/data/q_city2]">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>

      <input ref="/data/q_cf_complex">
        <label ref="jr:itext('q_cf_complex:label')"/>
        <hint ref="jr:itext('q_cf_complex:hint')"/>
      </input>
    </group>

    <group>
      <label>3-Level Nested Repeat</label>
      <repeat nodeset="/data/r3_projects">
        <label ref="jr:itext('r3_projects:label')"/>

        <input ref="rp3_name">
          <label ref="jr:itext('rp3_name:label')"/>
          <hint ref="jr:itext('rp3_name:hint')"/>
        </input>

        <input ref="rp3_budget">
          <label ref="jr:itext('rp3_budget:label')"/>
          <hint ref="jr:itext('rp3_budget:hint')"/>
        </input>

        <select1 ref="rp3_status" appearance="minimal">
          <label ref="jr:itext('rp3_status:label')"/>
          <hint ref="jr:itext('rp3_status:hint')"/>
          <itemset nodeset="instance('likert_scale')/root/item">
            <value ref="name"/>
            <label ref="label"/>
          </itemset>
        </select1>

        <repeat nodeset="r3_activities">
          <label ref="jr:itext('r3_activities:label')"/>

          <input ref="ra3_name">
            <label ref="jr:itext('ra3_name:label')"/>
            <hint ref="jr:itext('ra3_name:hint')"/>
          </input>

          <select1 ref="ra3_status" appearance="horizontal">
            <label ref="jr:itext('ra3_status:label')"/>
            <hint ref="jr:itext('ra3_status:hint')"/>
            <itemset nodeset="instance('yes_no')/root/item">
              <value ref="name"/>
              <label ref="label"/>
            </itemset>
          </select1>

          <input ref="ra3_pos">
            <label ref="jr:itext('ra3_pos:label')"/>
            <hint ref="jr:itext('ra3_pos:hint')"/>
          </input>

          <input ref="ra3_cur">
            <label ref="jr:itext('ra3_cur:label')"/>
            <hint ref="jr:itext('ra3_cur:hint')"/>
          </input>

          <repeat nodeset="r3_tasks">
            <label ref="jr:itext('r3_tasks:label')"/>

            <input ref="rt3_name">
              <label ref="jr:itext('rt3_name:label')"/>
              <hint ref="jr:itext('rt3_name:hint')"/>
            </input>

            <input ref="rt3_pct">
              <label ref="jr:itext('rt3_pct:label')"/>
              <hint ref="jr:itext('rt3_pct:hint')"/>
            </input>

            <input ref="rt3_hours">
              <label ref="jr:itext('rt3_hours:label')"/>
              <hint ref="jr:itext('rt3_hours:hint')"/>
            </input>

            <select1 ref="rt3_done" appearance="horizontal">
              <label ref="jr:itext('rt3_done:label')"/>
              <hint ref="jr:itext('rt3_done:hint')"/>
              <itemset nodeset="instance('yes_no')/root/item">
                <value ref="name"/>
                <label ref="label"/>
              </itemset>
            </select1>

            <input ref="rt3_idx">
              <label ref="jr:itext('rt3_idx:label')"/>
              <hint ref="jr:itext('rt3_idx:hint')"/>
            </input>
          </repeat>
        </repeat>
      </repeat>
    </group>

    <group>
      <label>Missing XPath Functions — Calculated Display</label>

      <input ref="/data/calc_not_fn">
        <label ref="jr:itext('calc_not_fn:label')"/>
        <hint ref="jr:itext('calc_not_fn:hint')"/>
      </input>

      <input ref="/data/calc_mod_fn">
        <label ref="jr:itext('calc_mod_fn:label')"/>
        <hint ref="jr:itext('calc_mod_fn:hint')"/>
      </input>

      <input ref="/data/calc_boolstr">
        <label ref="jr:itext('calc_boolstr:label')"/>
        <hint ref="jr:itext('calc_boolstr:hint')"/>
      </input>

      <input ref="/data/calc_uuid_fn">
        <label ref="jr:itext('calc_uuid_fn:label')"/>
        <hint ref="jr:itext('calc_uuid_fn:hint')"/>
      </input>

      <input ref="/data/calc_join_fn">
        <label ref="jr:itext('calc_join_fn:label')"/>
        <hint ref="jr:itext('calc_join_fn:hint')"/>
      </input>

      <input ref="/data/calc_max_fn">
        <label ref="jr:itext('calc_max_fn:label')"/>
        <hint ref="jr:itext('calc_max_fn:hint')"/>
      </input>

      <input ref="/data/calc_min_fn">
        <label ref="jr:itext('calc_min_fn:label')"/>
        <hint ref="jr:itext('calc_min_fn:hint')"/>
      </input>

      <input ref="/data/calc_sum_fn">
        <label ref="jr:itext('calc_sum_fn:label')"/>
        <hint ref="jr:itext('calc_sum_fn:hint')"/>
      </input>
    </group>

    <input ref="/data/q_geo_fenced">
      <label ref="jr:itext('q_geo_fenced:label')"/>
      <hint ref="jr:itext('q_geo_fenced:hint')"/>
    </input>

    <input ref="/data/calc_geo_area2">
      <label>Geo Area (calculated)</label>
      <hint>Read-only — area of geoshape in square meters</hint>
    </input>

    <input ref="/data/calc_geo_dist2">
      <label>Geo Distance (calculated)</label>
      <hint>Read-only — distance of geotrace in meters</hint>
    </input>

    <group>
      <label>Select From External File</label>

      <select1 ref="/data/q_ff1" appearance="minimal">
        <label ref="jr:itext('q_ff1:label')"/>
        <hint ref="jr:itext('q_ff1:hint')"/>
        <itemset nodeset="instance('from_file')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>

      <select ref="/data/q_ff2">
        <label ref="jr:itext('q_ff2:label')"/>
        <hint ref="jr:itext('q_ff2:hint')"/>
        <itemset nodeset="instance('from_file')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select>
    </group>

    <group ref="/data/g_rel_adv">
      <label ref="jr:itext('g_rel_adv:label')"/>

      <input ref="/data/g_rel_adv/q_rel_a">
        <label ref="jr:itext('q_rel_a:label')"/>
        <hint ref="jr:itext('q_rel_a:hint')"/>
      </input>

      <input ref="/data/g_rel_adv/q_rel_b">
        <label ref="jr:itext('q_rel_b:label')"/>
        <hint ref="jr:itext('q_rel_b:hint')"/>
      </input>

      <input ref="/data/g_rel_adv/q_rel_c">
        <label ref="jr:itext('q_rel_c:label')"/>
        <hint ref="jr:itext('q_rel_c:hint')"/>
      </input>
    </group>

    <group>
      <label>Advanced Constraint Tests</label>

      <input ref="/data/q_con_email">
        <label ref="jr:itext('q_con_email:label')"/>
        <hint ref="jr:itext('q_con_email:hint')"/>
      </input>

      <input ref="/data/q_con_cross">
        <label ref="jr:itext('q_con_cross:label')"/>
        <hint ref="jr:itext('q_con_cross:hint')"/>
      </input>

      <input ref="/data/q_con_date_min">
        <label ref="jr:itext('q_con_date_min:label')"/>
        <hint ref="jr:itext('q_con_date_min:hint')"/>
      </input>

      <input ref="/data/q_con_date_max">
        <label ref="jr:itext('q_con_date_max:label')"/>
        <hint ref="jr:itext('q_con_date_max:hint')"/>
      </input>
    </group>

    <group>
      <label>Dynamic Defaults</label>

      <input ref="/data/q_def_once">
        <label ref="jr:itext('q_def_once:label')"/>
        <hint ref="jr:itext('q_def_once:hint')"/>
      </input>

      <input ref="/data/q_def_chain">
        <label ref="jr:itext('q_def_chain:label')"/>
        <hint ref="jr:itext('q_def_chain:hint')"/>
      </input>

      <input ref="/data/q_def_today">
        <label ref="jr:itext('q_def_today:label')"/>
        <hint ref="jr:itext('q_def_today:hint')"/>
      </input>
    </group>

    <group>
      <label>Stress Test — Additional Questions</label>

      <input ref="/data/s_t1">
        <label ref="jr:itext('s_t1:label')"/>
        <hint ref="jr:itext('s_t1:hint')"/>
      </input>

      <input ref="/data/s_t2">
        <label ref="jr:itext('s_t2:label')"/>
        <hint ref="jr:itext('s_t2:hint')"/>
      </input>

      <input ref="/data/s_t3">
        <label ref="jr:itext('s_t3:label')"/>
        <hint ref="jr:itext('s_t3:hint')"/>
      </input>

      <input ref="/data/s_t4">
        <label ref="jr:itext('s_t4:label')"/>
        <hint ref="jr:itext('s_t4:hint')"/>
      </input>

      <input ref="/data/s_t5">
        <label ref="jr:itext('s_t5:label')"/>
        <hint ref="jr:itext('s_t5:hint')"/>
      </input>

      <input ref="/data/s_i1">
        <label ref="jr:itext('s_i1:label')"/>
        <hint ref="jr:itext('s_i1:hint')"/>
      </input>

      <input ref="/data/s_i2">
        <label ref="jr:itext('s_i2:label')"/>
        <hint ref="jr:itext('s_i2:hint')"/>
      </input>

      <input ref="/data/s_i3">
        <label ref="jr:itext('s_i3:label')"/>
        <hint ref="jr:itext('s_i3:hint')"/>
      </input>

      <select1 ref="/data/s_s1" appearance="minimal">
        <label ref="jr:itext('s_s1:label')"/>
        <hint ref="jr:itext('s_s1:hint')"/>
        <itemset nodeset="instance('categories')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>

      <select1 ref="/data/s_s2" appearance="autocomplete">
        <label ref="jr:itext('s_s2:label')"/>
        <hint ref="jr:itext('s_s2:hint')"/>
        <itemset nodeset="instance('countries')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>

      <select ref="/data/s_s3" appearance="compact">
        <label ref="jr:itext('s_s3:label')"/>
        <hint ref="jr:itext('s_s3:hint')"/>
        <itemset nodeset="instance('yes_no')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select>

      <input ref="/data/s_d1">
        <label ref="jr:itext('s_d1:label')"/>
        <hint ref="jr:itext('s_d1:hint')"/>
      </input>

      <upload ref="/data/s_img1" mediatype="image/*">
        <label ref="jr:itext('s_img1:label')"/>
        <hint ref="jr:itext('s_img1:hint')"/>
      </upload>

      <input ref="/data/s_dec1">
        <label ref="jr:itext('s_dec1:label')"/>
        <hint ref="jr:itext('s_dec1:hint')"/>
      </input>

      <trigger ref="/data/s_ack1">
        <label ref="jr:itext('s_ack1:label')"/>
        <hint ref="jr:itext('s_ack1:hint')"/>
      </trigger>

      <input ref="/data/s_n1">
        <label ref="jr:itext('s_n1:label')"/>
        <hint ref="jr:itext('s_n1:hint')"/>
      </input>

      <input ref="/data/s_n2">
        <label ref="jr:itext('s_n2:label')"/>
        <hint ref="jr:itext('s_n2:hint')"/>
      </input>

      <input ref="/data/s_calc1">
        <label ref="jr:itext('s_calc1:label')"/>
        <hint ref="jr:itext('s_calc1:hint')"/>
      </input>

      <input ref="/data/s_calc2">
        <label ref="jr:itext('s_calc2:label')"/>
        <hint ref="jr:itext('s_calc2:hint')"/>
      </input>

      <input ref="/data/s_calc3">
        <label ref="jr:itext('s_calc3:label')"/>
        <hint ref="jr:itext('s_calc3:hint')"/>
      </input>
    </group>
    <input ref="/data/s_geo1">
      <label ref="jr:itext('s_geo1:label')"/>
      <hint ref="jr:itext('s_geo1:hint')"/>
    </input>
<!--
  XForms Body Extension — New Sections
  Generated for: tlacuache_app_web / Nuup XForms Torture Test
  Date: 2026-06-02

  IMPLEMENTATION NOTES:
  - pulldata() is NOT part of the OpenRosa XForms 1.0 spec.
    ODK Collect / KoBoToolbox support it via CSV files. Enketo does NOT.
    Alternative: secondary instance lookup with instance() — used below.
  - ODK Entities (entities()) require ODK Central 2023+ and are NOT part of
    XForms 1.0 or OpenRosa. Simulated below with instance() lookup.
  - digest() is an ODK-XForms extension. Enketo Smart Paper supports it.
    Standard OpenRosa does not mandate it.
  - indexed-repeat() is an ODK extension; not available in all engines.
  - 4-level nested repeats are historically problematic in Enketo.
-->

<!-- ============================================================
     SECONDARY INSTANCES — paste these inside <model> ... </model>
     ============================================================

  <instance id="mx_localities">
    <root>
      <item><name>loc001</name><label>Rancho El Progreso</label><community_id>COM1</community_id></item>
      <item><name>loc002</name><label>Ejido Santa Cruz</label><community_id>COM1</community_id></item>
      <item><name>loc003</name><label>Barrio Nuevo</label><community_id>COM3</community_id></item>
      <item><name>loc004</name><label>Colonia Juárez</label><community_id>COM4</community_id></item>
      <item><name>loc005</name><label>Centro Histórico</label><community_id>COM5</community_id></item>
    </root>
  </instance>

  <instance id="entities_data">
    <root>
      <entity><name>ent001</name><label>Entity Alpha</label><key>K001</key><value>Val-Alpha</value><region>north</region></entity>
      <entity><name>ent002</name><label>Entity Beta</label><key>K002</key><value>Val-Beta</value><region>south</region></entity>
      <entity><name>ent003</name><label>Entity Gamma</label><key>K003</key><value>Val-Gamma</value><region>east</region></entity>
      <entity><name>ent004</name><label>Entity Delta</label><key>K004</key><value>Val-Delta</value><region>west</region></entity>
    </root>
  </instance>

  <instance id="audio_opts">
    <root>
      <item><name>snd1</name><label>Audio Option 1</label><audio>jr://audio/snd1.mp3</audio></item>
      <item><name>snd2</name><label>Audio Option 2</label><audio>jr://audio/snd2.mp3</audio></item>
      <item><name>snd3</name><label>Audio Option 3</label><audio>jr://audio/snd3.mp3</audio></item>
    </root>
  </instance>

  <instance id="video_opts">
    <root>
      <item><name>vid1</name><label>Video Option 1</label><video>jr://video/vid1.mp4</video></item>
      <item><name>vid2</name><label>Video Option 2</label><video>jr://video/vid2.mp4</video></item>
      <item><name>vid3</name><label>Video Option 3</label><video>jr://video/vid3.mp4</video></item>
    </root>
  </instance>

  BIND ENTRIES — paste these inside <model> ... </model> alongside existing binds:

  Pulldata / Entities demo:
  <bind nodeset="/data/q_entity_key" type="string"/>
  <bind nodeset="/data/q_entity_val" type="string" readonly="true()"
        calculate="instance('entities_data')/root/entity[key=/data/q_entity_key]/value"/>

  Digest demo:
  <bind nodeset="/data/calc_digest" type="string" readonly="true()"
        calculate="digest(concat(/data/q_it_text, /data/q_it_num), 'sha-256')"/>

  5th cascade level:
  <bind nodeset="/data/q_locality" type="string"
        relevant="/data/q_community2 != ''"/>

  Performance test:
  <bind nodeset="/data/q_perf_one" type="string"/>
  <bind nodeset="/data/q_perf_filtered" type="string"/>
  <bind nodeset="/data/q_perf_multi" type="string"/>

  Multimedia choices:
  <bind nodeset="/data/q_audio_choice" type="string"/>
  <bind nodeset="/data/q_video_choice" type="string"/>

  4-Level Repeat binds:
  <bind nodeset="/data/r4_programs/rp4_name" type="string"/>
  <bind nodeset="/data/r4_programs/rp4_type" type="string"/>
  <bind nodeset="/data/r4_programs/rp4_budget_total" type="decimal"/>
  <bind nodeset="/data/r4_programs/r4_projects/rj4_name" type="string"/>
  <bind nodeset="/data/r4_programs/r4_projects/rj4_budget" type="decimal"/>
  <bind nodeset="/data/r4_programs/r4_projects/rj4_status" type="string"/>
  <bind nodeset="/data/r4_programs/r4_projects/rj4_pos" type="string" readonly="true()"
        calculate="position(..)"/>
  <bind nodeset="/data/r4_programs/r4_projects/rj4_count_acts" type="int" readonly="true()"
        calculate="count(../r4_activities/ra4_name)"/>
  <bind nodeset="/data/r4_programs/r4_projects/r4_activities/ra4_name" type="string"/>
  <bind nodeset="/data/r4_programs/r4_projects/r4_activities/ra4_type" type="string"/>
  <bind nodeset="/data/r4_programs/r4_projects/r4_activities/ra4_pct" type="int"
        constraint=". >= 0 and . &lt;= 100"/>
  <bind nodeset="/data/r4_programs/r4_projects/r4_activities/ra4_cur_proj" type="string" readonly="true()"
        calculate="current()/../../rj4_name"/>
  <bind nodeset="/data/r4_programs/r4_projects/r4_activities/ra4_pos" type="string" readonly="true()"
        calculate="position(..)"/>
  <bind nodeset="/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_name" type="string"/>
  <bind nodeset="/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_hours" type="decimal"
        constraint=". >= 0"/>
  <bind nodeset="/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_done" type="string"/>
  <bind nodeset="/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_priority" type="string"/>
  <bind nodeset="/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_pos" type="string" readonly="true()"
        calculate="position(..)"/>
  <bind nodeset="/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_idx" type="string" readonly="true()"
        calculate="indexed-repeat(/data/r4_programs/rp4_name, /data/r4_programs, 1)"/>
  <bind nodeset="/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_cur_act" type="string" readonly="true()"
        calculate="current()/../../ra4_name"/>

  Enketo edge cases:
  <bind nodeset="/data/g_enketo_edge/eq_sum_tasks" type="decimal" readonly="true()"
        calculate="sum(/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_hours)"/>
  <bind nodeset="/data/g_enketo_edge/eq_idx_deep" type="string" readonly="true()"
        calculate="indexed-repeat(/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_name,
                     /data/r4_programs, 1,
                     /data/r4_programs/r4_projects, 1,
                     /data/r4_programs/r4_projects/r4_activities, 1,
                     /data/r4_programs/r4_projects/r4_activities/r4_tasks, 1)"/>
  <bind nodeset="/data/g_enketo_edge/eq_nr_constraint" type="string"
        constraint="not(regex(., '^[0-9]+$')) or string-length(.) &lt;= 10"
        jr:constraintMsg="Must not be purely numeric or must be 10 chars or fewer"/>
  <bind nodeset="/data/g_enketo_edge/eq_nr_relevant" type="string"
        relevant="/data/q_community2 != '' and /data/q_locality != '' and selected(/data/q_perf_multi, 'perf_001')"/>
  <bind nodeset="/data/g_enketo_edge/eq_count_done" type="int" readonly="true()"
        calculate="count(/data/r4_programs/r4_projects/r4_activities/r4_tasks[rt4_done='yes'])"/>
-->

<!-- ============================================================
     BODY SECTIONS
     Paste these inside <h:body> ... </h:body>
     ============================================================ -->

<!-- ===========================================================
     SECTION 1: pulldata() / Entities — OpenRosa Alternative Demo
     ===========================================================
     NOT IMPLEMENTABLE UNDER CURRENT OPENROSA SPECIFICATION:
     pulldata() requires ODK Collect / KoBoToolbox file-based CSV support.
     Enketo does not support pulldata().

     NOT IMPLEMENTABLE UNDER CURRENT OPENROSA SPECIFICATION:
     entities() / ODK Entities require ODK Central 2023+ and are not part
     of XForms 1.0 or OpenRosa. Simulated below with instance() lookup
     as the closest achievable alternative.
-->
<group>
  <label>pulldata() / Entities — OpenRosa Alternative Demo</label>
  <hint>pulldata() and ODK Entities are NOT available in Enketo/OpenRosa. This section demonstrates the closest achievable alternative using secondary instances.</hint>

  <input ref="/data/q_entity_key">
    <label ref="jr:itext('q_entity_key:label')"/>
    <hint ref="jr:itext('q_entity_key:hint')"/>
  </input>

  <!--
    Equivalent of pulldata('entities_data','value','key', q_entity_key)
    achieved via: instance('entities_data')/root/entity[key=/data/q_entity_key]/value
    bound in the model with calculate= (readonly field shown here for verification)
  -->
  <input ref="/data/q_entity_val">
    <label ref="jr:itext('q_entity_val:label')"/>
    <hint>Read-only. Populated via instance('entities_data') lookup on the entered key — equivalent of pulldata() but using secondary instance XPath.</hint>
  </input>
</group>


<!-- ===========================================================
     SECTION 2: digest() Function Demo
     ===========================================================
     digest() is an ODK-XForms extension. Enketo Smart Paper supports it.
     Standard OpenRosa XForms 1.0 does NOT mandate it.
     Calculate expression in bind: digest(concat(...), 'SHA-1')
-->
<group>
  <label>digest() Function Demo</label>
  <hint>ODK extension — not guaranteed in all OpenRosa implementations. Enketo Smart Paper supports it. The field below shows a SHA-1 hash of the concatenation of /data/q_it_text and /data/q_it_num.</hint>

  <input ref="/data/calc_digest">
    <label ref="jr:itext('calc_digest:label')"/>
    <hint>Read-only. SHA-1 digest of concat(q_it_text, q_it_num). Requires ODK Collect or Enketo Smart Paper.</hint>
  </input>
</group>


<!-- ===========================================================
     SECTION 3: 5th Cascade Level — Locality (filtered by community)
     ===========================================================
     Depends on /data/q_community2 being set by a prior cascade step.
     Filtered via: instance('mx_localities')/root/item[community_id=/data/q_community2]
     relevant= bound in model (see bind comment above).
-->
<select1 ref="/data/q_locality" appearance="minimal">
  <label ref="jr:itext('q_locality:label')"/>
  <hint ref="jr:itext('q_locality:hint')"/>
  <itemset nodeset="instance('mx_localities')/root/item[community_id=/data/q_community2]">
    <value ref="name"/>
    <label ref="label"/>
  </itemset>
</select1>


<!-- ===========================================================
     SECTION 4: Performance Test — Large Itemsets (500 items)
     ===========================================================
     Tests rendering performance under:
     - Full unfiltered 500-item list (minimal appearance)
     - Filtered subset (minimal appearance)
     - Multi-select full list (compact appearance)
-->
<group>
  <label>Performance Test — 500-Item Itemsets</label>
  <hint>Tests rendering performance. Select questions backed by a 500-item secondary instance (perf_items). Compact/minimal appearances reduce DOM load.</hint>

  <select1 ref="/data/q_perf_one" appearance="minimal">
    <label ref="jr:itext('q_perf_one:label')"/>
    <hint ref="jr:itext('q_perf_one:hint')"/>
    <itemset nodeset="instance('perf_items')/root/item">
      <value ref="name"/>
      <label ref="label"/>
    </itemset>
  </select1>

  <select1 ref="/data/q_perf_filtered" appearance="minimal">
    <label ref="jr:itext('q_perf_filtered:label')"/>
    <hint ref="jr:itext('q_perf_filtered:hint')"/>
    <!-- Filter: show only items whose cat is 'agriculture' or 'livestock' -->
    <itemset nodeset="instance('perf_items')/root/item[cat='agriculture' or cat='livestock']">
      <value ref="name"/>
      <label ref="label"/>
    </itemset>
  </select1>

  <select ref="/data/q_perf_multi" appearance="compact">
    <label ref="jr:itext('q_perf_multi:label')"/>
    <hint ref="jr:itext('q_perf_multi:hint')"/>
    <itemset nodeset="instance('perf_items')/root/item">
      <value ref="name"/>
      <label ref="label"/>
    </itemset>
  </select>
</group>


<!-- ===========================================================
     SECTION 5: Multimedia Choices — Audio and Video in Options
     ===========================================================
     Options carry <audio> and <video> child elements referencing
     jr:// URIs. Enketo renders these inline when appearance allows.
     NOTE: itemset does not natively propagate media children in all
     engines — static <item> elements are more reliable for media.
     Using itemset here to test engine support.
-->
<group>
  <label>Multimedia Choices — Audio and Video Options</label>
  <hint>Options include audio and video media references via jr:// URIs. Engine support varies: ODK Collect renders inline audio/video; Enketo support is partial.</hint>

  <!--
    Audio options: each item in audio_opts has an <audio> child with jr://audio/sndN.mp3
    The <hint ref="audio"/> inside itemset attempts to surface the audio child.
    For guaranteed media rendering, consider static <item> blocks instead.
  -->
  <select1 ref="/data/q_audio_choice" appearance="minimal">
    <label ref="jr:itext('q_audio_choice:label')"/>
    <hint ref="jr:itext('q_audio_choice:hint')"/>
    <itemset nodeset="instance('audio_opts')/root/item">
      <value ref="name"/>
      <label ref="label"/>
      <!-- audio child: jr://audio/sndN.mp3 — rendered by ODK Collect; partial in Enketo -->
      <hint ref="audio"/>
    </itemset>
  </select1>

  <!--
    Video options: each item in video_opts has a <video> child with jr://video/vidN.mp4
  -->
  <select1 ref="/data/q_video_choice" appearance="minimal">
    <label ref="jr:itext('q_video_choice:label')"/>
    <hint ref="jr:itext('q_video_choice:hint')"/>
    <itemset nodeset="instance('video_opts')/root/item">
      <value ref="name"/>
      <label ref="label"/>
      <!-- video child: jr://video/vidN.mp4 -->
      <hint ref="video"/>
    </itemset>
  </select1>
</group>


<!-- ===========================================================
     SECTION 6: 4-Level Nested Repeat
     Program > Project > Activity > Task
     ===========================================================
     KNOWN ENKETO EDGE CASES triggered here:
     - position(..) inside nested repeats (historically buggy in Enketo)
     - current() traversal across 2+ repeat levels
     - indexed-repeat() referencing top-level repeat from 4th level
     - count() of sibling repeat from parent level (rj4_count_acts)
     - itemset inside repeat (re-evaluated per repeat instance)
-->
<group>
  <label>4-Level Nested Repeat — Maximum Depth Torture Test</label>
  <hint>Historically problematic in Enketo: 4 levels of nested repeats with itemsets, filters, position(), current(), and indexed-repeat() across levels.</hint>

  <!-- LEVEL 1: Programs -->
  <repeat nodeset="/data/r4_programs">
    <label ref="jr:itext('r4_programs:label')"/>

    <input ref="rp4_name">
      <label ref="jr:itext('rp4_name:label')"/>
    </input>

    <select1 ref="rp4_type" appearance="minimal">
      <label ref="jr:itext('rp4_type:label')"/>
      <itemset nodeset="instance('categories')/root/item">
        <value ref="name"/>
        <label ref="label"/>
      </itemset>
    </select1>

    <input ref="rp4_budget_total">
      <label ref="jr:itext('rp4_budget_total:label')"/>
    </input>

    <!-- LEVEL 2: Projects (inside Programs) -->
    <repeat nodeset="r4_projects">
      <label ref="jr:itext('r4_projects:label')"/>

      <input ref="rj4_name">
        <label ref="jr:itext('rj4_name:label')"/>
      </input>

      <input ref="rj4_budget">
        <label ref="jr:itext('rj4_budget:label')"/>
      </input>

      <select1 ref="rj4_status" appearance="horizontal">
        <label ref="jr:itext('rj4_status:label')"/>
        <itemset nodeset="instance('yes_no')/root/item">
          <value ref="name"/>
          <label ref="label"/>
        </itemset>
      </select1>

      <!-- Readonly: position(..) at project level — Enketo edge case -->
      <input ref="rj4_pos">
        <label ref="jr:itext('rj4_pos:label')"/>
        <hint>Readonly. calculate=position(..) at level 2. Tests position() in nested repeat context.</hint>
      </input>

      <!-- Readonly: count of activities in this project -->
      <input ref="rj4_count_acts">
        <label ref="jr:itext('rj4_count_acts:label')"/>
        <hint>Readonly. calculate=count(../r4_activities/ra4_name). Tests sibling repeat count from parent.</hint>
      </input>

      <!-- LEVEL 3: Activities (inside Projects) -->
      <repeat nodeset="r4_activities">
        <label ref="jr:itext('r4_activities:label')"/>

        <input ref="ra4_name">
          <label ref="jr:itext('ra4_name:label')"/>
        </input>

        <select1 ref="ra4_type" appearance="minimal">
          <label ref="jr:itext('ra4_type:label')"/>
          <!--
            Note: a choice-filter using current() here would be:
              nodeset="instance('categories')/root/item[parent=current()/../../rp4_type]"
            That is a known Enketo edge case with current() crossing repeat boundaries.
            Using unfiltered list to avoid false failure — swap nodeset below to test.
          -->
          <itemset nodeset="instance('categories')/root/item">
            <value ref="name"/>
            <label ref="label"/>
          </itemset>
        </select1>

        <!-- Percentage 0–100; constraint in bind -->
        <input ref="ra4_pct">
          <label ref="jr:itext('ra4_pct:label')"/>
          <hint>Integer 0–100. constraint=". &gt;= 0 and . &lt;= 100" in bind.</hint>
        </input>

        <!-- Readonly: current()/../../rj4_name — crosses 2 repeat levels -->
        <input ref="ra4_cur_proj">
          <label ref="jr:itext('ra4_cur_proj:label')"/>
          <hint>Readonly. calculate=current()/../../rj4_name. Tests current() crossing 2 repeat levels in Enketo.</hint>
        </input>

        <!-- Readonly: position(..) at activity level -->
        <input ref="ra4_pos">
          <label ref="jr:itext('ra4_pos:label')"/>
          <hint>Readonly. calculate=position(..) at level 3.</hint>
        </input>

        <!-- LEVEL 4: Tasks (inside Activities) -->
        <repeat nodeset="r4_tasks">
          <label ref="jr:itext('r4_tasks:label')"/>

          <input ref="rt4_name">
            <label ref="jr:itext('rt4_name:label')"/>
          </input>

          <!-- Hours: decimal, constraint >= 0 in bind -->
          <input ref="rt4_hours">
            <label ref="jr:itext('rt4_hours:label')"/>
            <hint>Decimal. constraint=". &gt;= 0" in bind.</hint>
          </input>

          <select1 ref="rt4_done" appearance="horizontal">
            <label ref="jr:itext('rt4_done:label')"/>
            <itemset nodeset="instance('yes_no')/root/item">
              <value ref="name"/>
              <label ref="label"/>
            </itemset>
          </select1>

          <select1 ref="rt4_priority" appearance="likert">
            <label ref="jr:itext('rt4_priority:label')"/>
            <itemset nodeset="instance('likert_scale')/root/item">
              <value ref="name"/>
              <label ref="label"/>
            </itemset>
          </select1>

          <!-- Readonly: position(..) at task level (level 4) -->
          <input ref="rt4_pos">
            <label ref="jr:itext('rt4_pos:label')"/>
            <hint>Readonly. calculate=position(..) at level 4. Maximum nesting depth for position().</hint>
          </input>

          <!--
            Readonly: indexed-repeat for program name from level 4
            calculate=indexed-repeat(/data/r4_programs/rp4_name, /data/r4_programs, 1)
            Note: this fetches the FIRST program name (index 1) — a static probe.
            Dynamic cross-repeat indexed-repeat requires knowing the ancestor index,
            which in Enketo must come from position() of the ancestor repeat instance.
            Full 4-level indexed-repeat is demonstrated in g_enketo_edge/eq_idx_deep.
          -->
          <input ref="rt4_idx">
            <label ref="jr:itext('rt4_idx:label')"/>
            <hint>Readonly. calculate=indexed-repeat(/data/r4_programs/rp4_name, /data/r4_programs, 1). Tests indexed-repeat() from deepest level referencing root repeat. ODK extension.</hint>
          </input>

          <!-- Readonly: current()/../../ra4_name — crosses 2 repeat levels from task -->
          <input ref="rt4_cur_act">
            <label ref="jr:itext('rt4_cur_act:label')"/>
            <hint>Readonly. calculate=current()/../../ra4_name. Tests current() at 4th level crossing to level 3.</hint>
          </input>

        </repeat>
        <!-- /r4_tasks -->

      </repeat>
      <!-- /r4_activities -->

    </repeat>
    <!-- /r4_projects -->

  </repeat>
  <!-- /r4_programs -->

</group>


<!-- ===========================================================
     SECTION 7: Enketo Edge Cases Group
     ===========================================================
     All fields are readonly (calculated), designed to expose
     regressions in Enketo's handling of:
     - sum() across all 4 levels of nested repeats
     - indexed-repeat() with 4-level path
     - not() + regex() constraint
     - selected() in relevant with AND of 3 conditions
     - count() with predicate across all 4-level tasks
-->
<group ref="/data/g_enketo_edge">
  <label>Enketo Historically Problematic Cases</label>
  <hint>Specifically designed to detect regressions in Enketo's nested repeat handling, XPath edge cases, and constraint/relevant evaluation.</hint>

  <!--
    sum() across all 4 levels:
    calculate=sum(/data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_hours)
    This crosses all 4 repeat levels in a single XPath expression.
    Enketo has historically had issues with sum() across deeply nested repeat nodes.
  -->
  <input ref="/data/g_enketo_edge/eq_sum_tasks">
    <label ref="jr:itext('eq_sum_tasks:label')"/>
    <hint>Readonly. sum() of rt4_hours across all 4 levels of nested repeats. Tests Enketo's ability to aggregate across deep repeat trees.</hint>
  </input>

  <!--
    indexed-repeat() with 4 index arguments (one per repeat level):
    calculate=indexed-repeat(
      /data/r4_programs/r4_projects/r4_activities/r4_tasks/rt4_name,
      /data/r4_programs, 1,
      /data/r4_programs/r4_projects, 1,
      /data/r4_programs/r4_projects/r4_activities, 1,
      /data/r4_programs/r4_projects/r4_activities/r4_tasks, 1
    )
    Retrieves the first task name in program[1]/project[1]/activity[1]/task[1].
    This is the maximum depth supported by indexed-repeat() in ODK.
    NOT available in standard OpenRosa — ODK extension only.
  -->
  <input ref="/data/g_enketo_edge/eq_idx_deep">
    <label ref="jr:itext('eq_idx_deep:label')"/>
    <hint>Readonly. indexed-repeat() with 4 levels of repeat index arguments. ODK extension. Tests maximum depth support in Enketo.</hint>
  </input>

  <!--
    Constraint using not() and regex():
    constraint: not(regex(., '^[0-9]+$')) or string-length(.) &lt;= 10
    Meaning: value must NOT be purely numeric, OR if it is numeric it must be <= 10 chars.
    Tests combined not()/regex() in constraint — known Enketo evaluation edge case.
  -->
  <input ref="/data/g_enketo_edge/eq_nr_constraint">
    <label ref="jr:itext('eq_nr_constraint:label')"/>
    <hint ref="jr:itext('eq_nr_constraint:hint')"/>
    <!-- constraint and jr:constraintMsg set in bind -->
  </input>

  <!--
    relevant= with AND of 3 conditions including selected() on multi-select:
    relevant: /data/q_community2 != ''
              and /data/q_locality != ''
              and selected(/data/q_perf_multi, 'perf_001')
    Tests that Enketo correctly re-evaluates relevant when any of the 3 conditions changes,
    particularly selected() on a multi-select value (space-separated string).
  -->
  <input ref="/data/g_enketo_edge/eq_nr_relevant">
    <label ref="jr:itext('eq_nr_relevant:label')"/>
    <hint ref="jr:itext('eq_nr_relevant:hint')"/>
    <!-- relevant set in bind: 3-condition AND including selected() on q_perf_multi -->
  </input>

  <!--
    count() with predicate across all 4-level tasks:
    calculate=count(/data/r4_programs/r4_projects/r4_activities/r4_tasks[rt4_done='yes'])
    Note: value 'yes' assumes the yes_no instance uses 'yes'/'no' as name values.
    Adjust predicate value to match actual yes_no instance item names if different.
    Tests count() with predicate on deeply nested repeat nodes.
  -->
  <input ref="/data/g_enketo_edge/eq_count_done">
    <label ref="jr:itext('eq_count_done:label')"/>
    <hint>Readonly. count() of r4_tasks where rt4_done='yes' across all 4-level repeats. Tests predicate filtering on deep nested repeat nodes in Enketo.</hint>
  </input>

</group>
<!-- /g_enketo_edge -->
  </h:body>
</h:html>
`;
