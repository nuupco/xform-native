/**
 * ImageWidget — theming hook order constraint (design D2, tasks T15).
 *
 * ImageWidget gates on an optional peer dependency (expo-image-picker) with
 * an early return to UnsupportedWidget. `useThemedStyles` MUST be the first
 * statement in the component body, before that early return, or the
 * select-widgets-hook-order invariant is at risk. This is a static source
 * check because the peer-dep branch is fixed at module load in tests, so a
 * runtime rerender assertion cannot exercise both branches of the gate.
 */
import fs from 'fs';
import path from 'path';

describe('ImageWidget — useThemedStyles precedes peer-dep gating early return', () => {
  it('calls useThemedStyles before the `if (!picker)` early return', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../widgets/ImageWidget.tsx'),
      'utf8',
    );
    const bodyStart = source.indexOf('export function ImageWidget');
    expect(bodyStart).toBeGreaterThan(-1);

    const themedStylesIdx = source.indexOf('useThemedStyles', bodyStart);
    const gateIdx = source.indexOf('if (!picker)', bodyStart);

    expect(themedStylesIdx).toBeGreaterThan(-1);
    expect(gateIdx).toBeGreaterThan(-1);
    expect(themedStylesIdx).toBeLessThan(gateIdx);
  });
});
