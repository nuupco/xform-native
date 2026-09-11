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
import type { ComponentType, ReactNode } from 'react';
import type { DataType, ControlType } from '@nuup/ts-rosa';
import type { NodeRef } from '../../adapter/FormAdapter.js';
import type { FormSessionStore } from '../../store/FormSessionStore.js';
import { type PickWidgetResult } from './pickWidget.js';
import type { VariantId } from './appearance.js';
import { type WidgetMatcher } from './matchOverride.js';
/**
 * Public, stable contract for override widget components (spec:
 * "Public widget contract"). Structurally identical to what built-in
 * widgets receive from Form.tsx.
 */
export interface XFormWidgetProps {
    nodeRef: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export interface WidgetOverride {
    match: WidgetMatcher;
    Widget: ComponentType<XFormWidgetProps>;
    /** Optional: when omitted, the base pickWidget() variant is inherited. */
    variant?: VariantId;
}
export interface PickWidgetArgs {
    dataType: DataType;
    controlType: ControlType;
    appearance: string | null | undefined;
    readonly?: boolean;
    mediatype?: string | null;
}
/**
 * Resolve a (dataType, controlType, appearance) node to a widget + variant,
 * applying the best-matching registered override (if any) over the stock
 * pickWidget() dispatch.
 */
export declare function resolveWidget(args: PickWidgetArgs, overrides: readonly WidgetOverride[]): PickWidgetResult;
export interface WidgetRegistryProviderProps {
    widgets: readonly WidgetOverride[];
    children: ReactNode;
}
export declare function WidgetRegistryProvider(p: WidgetRegistryProviderProps): import("react").FunctionComponentElement<import("react").ProviderProps<readonly WidgetOverride[]>>;
export declare function useWidgetOverrides(): readonly WidgetOverride[];
//# sourceMappingURL=registry.d.ts.map