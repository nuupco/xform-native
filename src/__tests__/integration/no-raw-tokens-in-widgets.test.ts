/**
 * Completion gate — "zero widgets on raw tokens" (design: shrinking
 * KNOWN_UNMIGRATED allowlist, tasks 1.6/12.1).
 *
 * PR16 (the final Phase 3 slice) emptied `KNOWN_UNMIGRATED` — the last three
 * entries (`primitives/PressableButton.tsx`, `primitives/Icon.tsx`,
 * `primitives/SelectionRow.tsx`) moved their `tokens`-as-default-value reads
 * to `defaultTheme` (re-exported from `theme/ThemeContext`, itself `= tokens`)
 * and their components now call `useTheme()` so a host `ThemeProvider`
 * override reaches them without callers passing `theme` explicitly (design
 * decision 10). Zero `src/widgets/**\/*.tsx` file imports the raw
 * `tokens/tokens` module anymore — this is the phase's objective exit
 * criterion, asserted by the un-skipped `it` below.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WIDGETS_DIR = join(__dirname, '..', '..', 'widgets');
const RAW_IMPORT = /from\s+['"](\.\.\/)+tokens\/tokens['"]/;

// Emptied by the final Phase 3 task (PR16). Any name re-added here would be
// an open migration / regression.
const KNOWN_UNMIGRATED: string[] = [];

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
  it('the migration is complete', () => {
    expect(KNOWN_UNMIGRATED).toEqual([]);
  });
});
