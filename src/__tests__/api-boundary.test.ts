/**
 * T-14: Public API boundary + no-experimental-leak audit.
 *
 * REQ-19: no ts-rosa experimental symbols at package boundary.
 */

import * as api from '../index';

describe('Public API boundary', () => {
  it('exports Form', () => {
    expect(api.Form).toBeDefined();
  });

  it('does not export FormIndex', () => {
    expect('FormIndex' in api).toBe(false);
  });

  it('does not export FormEntryEvent', () => {
    expect('FormEntryEvent' in api).toBe(false);
  });

  it('does not export navigator', () => {
    expect('navigator' in api).toBe(false);
  });

  it('does not expose @nuup/ts-rosa/experimental subpath', async () => {
    // @ts-expect-error — deliberate import of non-existent experimental subpath
    await expect(import('@nuup/ts-rosa/experimental')).rejects.toThrow();
  });
});
