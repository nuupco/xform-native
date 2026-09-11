"use strict";

/**
 * registry.ts — injectable widget override registry (design D3/D4/D5).
 *
 * resolveWidget() WRAPS pickWidget(); it never replaces it. pickWidget always
 * runs first (preserving the full range -> binary -> note -> select1/select/
 * rank/trigger -> dataType precedence chain, ADR-5), then the best-matching
 * registered override (if any) is applied on top by matchScore. When the
 * override does not specify a variant, the base pickWidget variant is
 * inherited so rank/select1 semantics are never silently swapped.
 *
 * With zero overrides registered, resolveWidget() is byte-identical to
 * pickWidget() (T3 regression sweep).
 *
 * Kept as a .ts file (no JSX) per the design's file table; the
 * WidgetRegistryProvider component is built with createElement.
 */

import { createElement, createContext, useContext } from 'react';
import { pickWidget } from "./pickWidget.js";
import { pickBest } from "./matchOverride.js";

/**
 * Public, stable contract for override widget components (spec:
 * "Public widget contract"). Structurally identical to what built-in
 * widgets receive from Form.tsx.
 */

/**
 * Resolve a (dataType, controlType, appearance) node to a widget + variant,
 * applying the best-matching registered override (if any) over the stock
 * pickWidget() dispatch.
 */
export function resolveWidget(args, overrides) {
  const base = pickWidget(args.dataType, args.controlType, args.appearance, args.readonly, args.mediatype);
  if (overrides.length === 0) return base;
  const best = pickBest(overrides, {
    controlType: args.controlType,
    dataType: args.dataType,
    appearance: args.appearance
  });
  if (best === null) return base;
  return {
    Widget: best.Widget,
    variant: best.variant ?? base.variant
  };
}
const WidgetRegistryContext = /*#__PURE__*/createContext([]);
export function WidgetRegistryProvider(p) {
  return /*#__PURE__*/createElement(WidgetRegistryContext.Provider, {
    value: p.widgets
  }, p.children);
}
export function useWidgetOverrides() {
  return useContext(WidgetRegistryContext);
}
//# sourceMappingURL=registry.js.map