"use strict";

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

import { DOMParser } from '@xmldom/xmldom';
import { parseForm, resolveExternalInstances, createFormSession, registerXmlParser, registerExternalInstanceResolver } from '@nuup/ts-rosa';
import { FormSessionStore } from "./store/FormSessionStore.js";
import { createPhaseTimer } from "./loadTiming.js";
/** ODK's reserved URI for the last-saved-submission secondary instance. */
const LAST_SAVED_SRC = 'jr://instance/last-saved';

/**
 * Host fetch seam for `jr://` question-label media references (e.g.
 * `image-map`'s SVG label image) — same opt-in shape as
 * ExternalDataFetcher, resolved on demand at render time rather than at
 * session creation (a question's own label media isn't declared up front
 * the way external secondary instances are), so it is stored on the
 * FormSessionStore instance instead of consumed inside runCreateFormStore.
 */

let _defaultXmlParserRegistered = false;

/**
 * Idempotent XmlParser registration. registerXmlParser overwrites cleanly
 * (no guard needed for correctness), but a module-level flag avoids
 * reconstructing the default wrapper on every call and always lets a host
 * override win via explicit re-register.
 */
function ensureXmlParser(override) {
  if (override) {
    registerXmlParser(override);
    return;
  }
  if (_defaultXmlParserRegistered) return;
  registerXmlParser({
    parse: xml => new DOMParser().parseFromString(xml, 'text/xml')
  });
  _defaultXmlParserRegistered = true;
}
export async function createFormStore(xmlSource, opts) {
  ensureXmlParser(opts?.xmlParser);
  const onPhaseTiming = opts?.onPhaseTiming;
  const timer = onPhaseTiming ? createPhaseTimer(onPhaseTiming) : undefined;
  const totalStartedAt = timer ? performanceNow() : 0;
  if (onPhaseTiming) onPhaseTiming({
    phase: 'total',
    event: 'start'
  });
  try {
    return await runCreateFormStore(xmlSource, opts, timer);
  } finally {
    if (onPhaseTiming) {
      onPhaseTiming({
        phase: 'total',
        event: 'end',
        durationMs: performanceNow() - totalStartedAt
      });
    }
  }
}
function performanceNow() {
  return globalThis.performance?.now?.() ?? Date.now();
}
async function runCreateFormStore(xmlSource, opts, timer) {
  let def = timer ? timer.run('parseForm', () => parseForm(xmlSource)) : parseForm(xmlSource);
  if (def.externalInstances.size > 0) {
    const resolveExternalInstancesPhase = async () => {
      // Pre-flight fail-loud: scan declared external instances against the
      // supplied resolver BEFORE calling ts-rosa, so we can name the exact
      // unresolved URI(s) with an actionable message.
      const hardRequired = [...def.externalInstances.values()].map(entry => entry.src).filter(src => src !== LAST_SAVED_SRC);
      if (hardRequired.length > 0 && !opts?.externalInstanceResolver) {
        throw new Error(`createFormStore: form declares external instance(s) requiring data [${hardRequired.join(', ')}] but no externalInstanceResolver was supplied. Pass opts.externalInstanceResolver.`);
      }
      const host = opts?.externalInstanceResolver;
      if (host) {
        registerExternalInstanceResolver({
          async resolve(uri) {
            const raw = await host.resolve(uri);
            if (raw === null && uri !== LAST_SAVED_SRC) {
              throw new Error(`createFormStore: externalInstanceResolver returned null for required external instance '${uri}'.`);
            }
            return raw;
          }
        });
      } else {
        // Only last-saved present, no host resolver supplied: register a
        // default null-returning resolver. ts-rosa's resolveExternalInstances
        // calls the resolver unconditionally whenever externalInstances.size
        // > 0, so without SOME resolver registered it throws a generic
        // "not registered" error instead of the intended empty-tree semantics.
        registerExternalInstanceResolver({
          resolve: async () => null
        });
      }
      return resolveExternalInstances(def);
    };
    def = timer ? await timer.runAsync('resolveExternalInstances', resolveExternalInstancesPhase) : await resolveExternalInstancesPhase();
  }
  const session = timer ? timer.run('createFormSession', () => createFormSession(def, opts?.instanceXml !== undefined ? {
    instanceXml: opts.instanceXml
  } : undefined)) : createFormSession(def, opts?.instanceXml !== undefined ? {
    instanceXml: opts.instanceXml
  } : undefined);
  return new FormSessionStore(session, opts?.mediaResolver);
}
//# sourceMappingURL=createFormStore.js.map