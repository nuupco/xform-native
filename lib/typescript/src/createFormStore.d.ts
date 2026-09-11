/**
 * createFormStore — factory wiring the real ts-rosa engine into a
 * FormSessionStore, handling `jr://` external secondary instance
 * resolution and XmlParser registration.
 *
 * ADR-2 firewall addendum: createFormStore is the SECOND (and only other)
 * module besides createAdapter.ts that imports ts-rosa's raw API surface
 * (parseForm, resolveExternalInstances, createFormSession, registerXmlParser,
 * ExternalInstanceResolver type). It does NOT leak FormSession/FormDefinition
 * into its public signature — it returns the opaque FormSessionStore and
 * accepts only strings + the ExternalDataFetcher shape. Raw ts-rosa
 * event/index/def types never cross this boundary.
 */
import type { XmlParser } from '@nuup/ts-rosa';
import { FormSessionStore } from './store/FormSessionStore.js';
import type { PhaseTimingListener } from './loadTiming.js';
export interface ExternalDataFetcher {
    resolve(uri: string): Promise<string | null>;
}
/**
 * Host fetch seam for `jr://` question-label media references (e.g.
 * `image-map`'s SVG label image) — same opt-in shape as
 * ExternalDataFetcher, resolved on demand at render time rather than at
 * session creation (a question's own label media isn't declared up front
 * the way external secondary instances are), so it is stored on the
 * FormSessionStore instance instead of consumed inside runCreateFormStore.
 */
export interface MediaResolver {
    resolve(uri: string): Promise<string | null>;
}
export interface CreateFormStoreOpts {
    /** Edit-mode hydration passthrough. */
    instanceXml?: string;
    /** Host fetch seam for `jr://` external instance URIs. */
    externalInstanceResolver?: ExternalDataFetcher;
    /** Optional host override of the XmlParser seam. */
    xmlParser?: XmlParser;
    /** Host fetch seam for `jr://` question-label media references. */
    mediaResolver?: MediaResolver;
    /**
     * ADR-3: opt-in split-cost timing instrumentation. When supplied, wraps
     * `parseForm` / `resolveExternalInstances` / `createFormSession` in
     * `start`/`end` events plus a `total` end event. Omitting this option is
     * byte-identical behavior (no-regression for existing callers/small
     * CSVs) — only plain-data `PhaseTiming` events cross this boundary, never
     * raw ts-rosa types (ADR-2 firewall).
     */
    onPhaseTiming?: PhaseTimingListener;
}
export declare function createFormStore(xmlSource: string, opts?: CreateFormStoreOpts): Promise<FormSessionStore>;
//# sourceMappingURL=createFormStore.d.ts.map