/**
 * Completion gate — "zero widgets on raw tokens" (design: shrinking
 * KNOWN_UNMIGRATED allowlist, tasks 1.6/12.1).
 *
 * Runs from PR1 onward. It currently PASSES because every listed file is
 * still on the raw `tokens` singleton (nothing is migrated yet). Each later
 * PR removes its migrated file(s) from `KNOWN_UNMIGRATED`; PR16 empties the
 * array and un-skips the second `it`, which is this phase's objective exit
 * criterion.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WIDGETS_DIR = join(__dirname, '..', 'widgets');
const RAW_IMPORT = /from\s+['"](\.\.\/)+tokens\/tokens['"]/;

// Seeded with the not-yet-migrated widgets + 4 primitives (design doc,
// "Verified current state"). StringWidget and ImageWidget (Phase 2/PR1) and
// LongWidget/IntWidget/DecimalWidget (PR2) are already migrated and
// therefore intentionally absent from this list.
const KNOWN_UNMIGRATED: string[] = [
  'AudioWidget.tsx',
  'BarcodeWidget.tsx',
  'BooleanWidget.tsx',
  'DateTimeWidget.tsx',
  'DateWidget.tsx',
  'FileWidget.tsx',
  'GeoPointWidget.tsx',
  'GeoShapeWidget.tsx',
  'GeoTraceWidget.tsx',
  'NoteWidget.tsx',
  'RangeWidget.tsx',
  'RankWidget.tsx',
  'SelectMultiWidget.tsx',
  'SelectOneWidget.tsx',
  'SignatureWidget.tsx',
  'TimeWidget.tsx',
  'TriggerWidget.tsx',
  'UncastWidget.tsx',
  'UnsupportedWidget.tsx',
  'VideoWidget.tsx',
  'primitives/BottomSheet.tsx',
  'primitives/Modal.tsx',
  'primitives/PressableButton.tsx',
  'primitives/Icon.tsx',
];

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (entry.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

describe('no-raw-tokens-in-widgets (Phase 3 completion gate)', () => {
  it('lists exactly the currently-unmigrated widget/primitive files as raw-tokens importers', () => {
    const offenders = walk(WIDGETS_DIR)
      .filter((f) => RAW_IMPORT.test(readFileSync(f, 'utf8')))
      .map((f) => f.replace(WIDGETS_DIR + '/', ''));
    expect(offenders.sort()).toEqual([...KNOWN_UNMIGRATED].sort());
  });

  it('no OTHER src/widgets/*.tsx file imports raw tokens beyond the allowlist', () => {
    const offenders = walk(WIDGETS_DIR)
      .filter((f) => RAW_IMPORT.test(readFileSync(f, 'utf8')))
      .map((f) => f.replace(WIDGETS_DIR + '/', ''));
    const unexpected = offenders.filter((f) => !KNOWN_UNMIGRATED.includes(f));
    expect(unexpected).toEqual([]);
  });

  // Un-skipped and emptied only by the final Phase 3 task (12.1 / PR16) —
  // the objective exit criterion for the whole migration.
  it.skip('the migration is complete', () => {
    expect(KNOWN_UNMIGRATED).toEqual([]);
  });
});
