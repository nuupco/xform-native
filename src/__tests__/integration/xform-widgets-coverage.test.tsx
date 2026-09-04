/**
 * xform-widgets-coverage — end-to-end validation of raw XForm XML → ts-rosa
 * → pickWidget, using hand-written fixtures that enumerate the XForms/ODK
 * appearance spec per widget family (not copied from ODK Collect — GPL/
 * harness-format reasons, see fixtures/xforms/*.xml).
 *
 * Walks every fixture with the real engine (createFormStore, no mocks),
 * resolves each question node through pickWidget, and asserts the result is
 * always one of the 24 known widgets. Also asserts a fixed gap list of
 * appearance tokens the spec defines but this repo's APPEARANCE_TABLE does
 * not recognize (falls back to that dataType's 'default' variant) — update
 * consciously if pickWidget/appearance.ts gains support for one of these.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createFormStore } from '../../createFormStore';
import { pickWidget } from '../../widgets/engine/pickWidget';
import { resolveVariant } from '../../widgets/engine/appearance';
import { StringWidget } from '../../widgets/StringWidget';
import { IntWidget } from '../../widgets/IntWidget';
import { DecimalWidget } from '../../widgets/DecimalWidget';
import { LongWidget } from '../../widgets/LongWidget';
import { BooleanWidget } from '../../widgets/BooleanWidget';
import { NoteWidget } from '../../widgets/NoteWidget';
import { UncastWidget } from '../../widgets/UncastWidget';
import { UnsupportedWidget } from '../../widgets/UnsupportedWidget';
import { SelectOneWidget } from '../../widgets/SelectOneWidget';
import { SelectMultiWidget } from '../../widgets/SelectMultiWidget';
import { DateWidget } from '../../widgets/DateWidget';
import { TimeWidget } from '../../widgets/TimeWidget';
import { DateTimeWidget } from '../../widgets/DateTimeWidget';
import { RangeWidget } from '../../widgets/RangeWidget';
import { RankWidget } from '../../widgets/RankWidget';
import { ImageWidget } from '../../widgets/ImageWidget';
import { AudioWidget } from '../../widgets/AudioWidget';
import { VideoWidget } from '../../widgets/VideoWidget';
import { SignatureWidget } from '../../widgets/SignatureWidget';
import { FileWidget } from '../../widgets/FileWidget';
import { GeoPointWidget } from '../../widgets/GeoPointWidget';
import { GeoShapeWidget } from '../../widgets/GeoShapeWidget';
import { GeoTraceWidget } from '../../widgets/GeoTraceWidget';
import { BarcodeWidget } from '../../widgets/BarcodeWidget';
import { TriggerWidget } from '../../widgets/TriggerWidget';

const KNOWN_WIDGETS = new Set([
  StringWidget,
  IntWidget,
  DecimalWidget,
  LongWidget,
  BooleanWidget,
  NoteWidget,
  UncastWidget,
  UnsupportedWidget,
  SelectOneWidget,
  SelectMultiWidget,
  DateWidget,
  TimeWidget,
  DateTimeWidget,
  RangeWidget,
  RankWidget,
  ImageWidget,
  AudioWidget,
  VideoWidget,
  SignatureWidget,
  FileWidget,
  GeoPointWidget,
  GeoShapeWidget,
  GeoTraceWidget,
  BarcodeWidget,
  TriggerWidget,
]);

const FIXTURES_DIR = path.join(__dirname, '../fixtures/xforms');
const FIXTURE_FILES = [
  'select-variants.xml',
  'select-multi-variants.xml',
  'geo-variants.xml',
  'range-variants.xml',
  'datetime-variants.xml',
  'string-variants.xml',
  'numeric-variants.xml',
  'media-variants.xml',
  'rank-trigger-note.xml',
  'kitchen-sink.xml',
];

interface WalkedQuestion {
  label: string | null;
  dataType: string;
  controlType: string;
  appearance: string | null;
  mediatype: string | null;
  readonly: boolean;
}

async function walkQuestions(xml: string): Promise<WalkedQuestion[]> {
  const store = await createFormStore(xml);
  const questions: WalkedQuestion[] = [];

  // BOF is the starting position; step until EOF. Bounded to guard against
  // an accidental infinite loop in a malformed fixture.
  for (let i = 0; i < 500; i++) {
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind === 'eof') break;
    if (ev.kind === 'question') {
      questions.push({
        label: ev.label,
        dataType: ev.dataType,
        controlType: ev.controlType,
        appearance: ev.appearance,
        mediatype: ev.mediatype,
        readonly: store.adapter.getNodeState(ev.ref).readonly,
      });
    }
    store.stepForward();
  }

  return questions;
}

describe('xform-widgets-coverage — fixture XForms resolve through pickWidget', () => {
  for (const file of FIXTURE_FILES) {
    it(`${file}: every question resolves to a known widget`, async () => {
      const xml = fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf8');
      const questions = await walkQuestions(xml);

      expect(questions.length).toBeGreaterThan(0);

      for (const q of questions) {
        let result;
        expect(() => {
          result = pickWidget(
            q.dataType as never,
            q.controlType as never,
            q.appearance,
            q.readonly,
            q.mediatype
          );
        }).not.toThrow();
        expect(KNOWN_WIDGETS.has(result!.Widget)).toBe(true);
      }
    });
  }
});

/**
 * Gap list — appearance tokens the XForms/ODK spec defines that this repo's
 * APPEARANCE_TABLE (src/widgets/engine/appearance.ts) does not recognize.
 * An unrecognized token silently resolves to that dataType's 'default'
 * variant (resolveVariant never throws), so this list is the only signal
 * that a spec appearance is not actually wired to a distinct widget variant.
 *
 * Update consciously — adding support for one of these should remove it
 * from the list, not the other way around.
 */
const KNOWN_APPEARANCE_GAPS: ReadonlyArray<{
  dataType: string;
  controlType: string;
  appearance: string;
}> = [
  // ---------------------------------------------------------------------
  // TECHNICAL LIMITATIONS — confirmed against ODK Collect's real source,
  // blocked by the host OS/platform or by ODK's own spec, not by anything
  // fixable in this repo or in @nuup/ts-rosa. Re-attempting these without
  // new information (a new RN/Expo module, a platform change) will not
  // change the verdict.
  // ---------------------------------------------------------------------
  // printer → verified against ODK Collect source
  // (collect_app/.../widgets/PrinterWidget.kt +
  // printer/src/main/java/org/odk/collect/printer/HtmlPrinter.kt): the
  // button loads the question's answer as HTML into a hidden WebView and
  // hands it to Android's PrintManager (`context.getSystemService
  // (PRINT_SERVICE)`) — the OS print-job dialog (share to a paired
  // printer, save as PDF, etc.), not a direct Bluetooth-printer driver.
  // Either way it's Android's native print-service framework with no RN/
  // Expo equivalent, and the printed content is unrelated to the question's
  // own value (it renders a note/other field's HTML) — out of scope to
  // fake, stays a documented gap.
  { dataType: 'string', controlType: 'input', appearance: 'printer' },

  // ---------------------------------------------------------------------
  // BACKLOG — implementable in principle, deliberately deferred pending a
  // reliable conversion source, not a platform/architecture blocker.
  // ---------------------------------------------------------------------
  // bikram-sambat, myanmar → verified against ODK Collect source
  // (collect_app/.../widgets/datetime/pickers/BikramSambatDatePickerDialog.java
  // + MyanmarDatePickerDialog.java): both delegate the Gregorian conversion
  // to an external calendar library — a proprietary
  // `bikram-sambat-1.8.1.jar` with no published source, and `mmcalendar`'s
  // Myanmar traditional-calendar rules (watat/leap-month determination via
  // the Yan Naing Aye algorithm — solar-year astronomical constants, not a
  // closed-form arithmetic conversion). ethiopian/coptic/islamic/persian/
  // buddhist were all verifiable as direct transcriptions of joda-time's
  // arithmetic chronologies (see src/widgets/calendars.ts) and are
  // implemented; these two aren't independently verifiable with the same
  // confidence, so they stay documented gaps rather than risk a silently
  // wrong farming date.
  { dataType: 'date', controlType: 'input', appearance: 'bikram-sambat' },
  { dataType: 'date', controlType: 'input', appearance: 'myanmar' },

  // ---------------------------------------------------------------------
  // TECHNICAL LIMITATIONS (continued) — see banner above.
  // ---------------------------------------------------------------------
  // ex: (external app) prefix — verified against ODK Collect source
  // (collect_app/.../widgets/ExStringWidget.java + ExNumberWidget.java/
  // ExDecimalWidget.java which subclass it, + StringRequester.kt): the
  // launch button starts a raw Android Intent by action string parsed out
  // of "ex:<action>" (via `intentLauncher.launchForResult` /
  // `startActivityForResult`), an arbitrary third-party app handles it, and
  // its result is read back through Android's onActivityResult and written
  // as the answer. This is Android's inter-app IPC primitive with no iOS
  // analog and no arbitrary-package/action launcher in Expo/RN that returns
  // a result the way startActivityForResult does — there's no single
  // library to add, since which "app" runs is per-form data, not a fixed
  // dependency. resolveVariant also only does exact-string bucket lookup
  // today, so any "ex:..." value simply misses every key and falls to
  // default; supporting it for real would need prefix-parsing plus a
  // native module this repo has no cross-platform equivalent for, so it
  // stays a documented gap rather than a partial/fake implementation.
  { dataType: 'string', controlType: 'input', appearance: 'ex:app.package.name' },
  { dataType: 'int', controlType: 'input', appearance: 'ex:app.package.name' },
  { dataType: 'decimal', controlType: 'input', appearance: 'ex:app.package.name' },

  // hidden-answer — verified against ODK Collect source
  // (utilities/Appearances.kt's HIDDEN_ANSWER constant, grepped across all
  // widgets): ODK Collect only reads this appearance in ExStringWidget.java
  // (hides the answer TextView) and BarcodeWidget.kt/BarcodeWidgetContent.kt
  // (hides the scanned-code text). It is NOT read by any binary/upload
  // widget (ImageWidget/BaseImageWidget/ExImageWidget/arbitraryfile's
  // FileWidget) in the current codebase — ODK Collect itself doesn't hide
  // media previews for this appearance, so there's no real behavior to
  // port to this repo's binary/upload widgets. Stays a documented gap.
  { dataType: 'binary', controlType: 'upload', appearance: 'hidden-answer' },
];

describe('xform-widgets-coverage — gap list against pickWidget/appearance.ts', () => {
  it('every listed gap really does fall back to the default variant', () => {
    for (const gap of KNOWN_APPEARANCE_GAPS) {
      const variant = resolveVariant(
        gap.dataType as never,
        gap.controlType as never,
        gap.appearance
      );
      expect(variant).toBe('default');
    }
  });

  it('gap list matches the current appearance.ts snapshot (update consciously)', () => {
    expect(
      KNOWN_APPEARANCE_GAPS.map((g) => `${g.dataType}/${g.controlType}/${g.appearance}`)
    ).toMatchInlineSnapshot(`
[
  "string/input/printer",
  "date/input/bikram-sambat",
  "date/input/myanmar",
  "string/input/ex:app.package.name",
  "int/input/ex:app.package.name",
  "decimal/input/ex:app.package.name",
  "binary/upload/hidden-answer",
]
`);
  });
});
