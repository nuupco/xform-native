/**
 * createAdapter — factory wiring navigator/evaluator/tree into a FormAdapter.
 *
 * ADR-2: this is the SOLE translation layer. FormEntryEvent / FormIndex /
 * FormElement never cross into the public AdaptedEvent surface.
 *
 * ADR-2 GAP #2 (jumpToIndex): adapter maintains an internal array-cache of
 * visited FormIndex objects. jumpToIndex(n) resolves to navigator.jumpToIndex(cache[n]),
 * restricted to visited positions; throws RangeError on out-of-range.
 */
import type { FormSession } from '@nuup/ts-rosa';
import type { FormAdapter } from './FormAdapter.js';
export declare function createAdapter(session: FormSession): FormAdapter;
//# sourceMappingURL=createAdapter.d.ts.map