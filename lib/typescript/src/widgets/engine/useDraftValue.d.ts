/**
 * useDraftValue — shared draft-editing hook for numeric widgets
 * (IntWidget, DecimalWidget, LongWidget). See design: widget-draft-value.
 *
 * Owns draft text + focus state and the store<->draft resync logic via
 * render-time derivation (no useEffect). The widget supplies the
 * DataType-specific `parse` predicate and an optional blurred-display
 * `format` transform.
 */
export interface DraftParseResult<T> {
    committable: boolean;
    value: T | null;
}
export interface DraftConfig<T> {
    /** Current committed value read from the store (e.g. resolveValue(nodeRef)). */
    storeValue: unknown;
    /** Commits a value to the store (or null to unset). */
    commit: (value: T | null) => void;
    /** Parses raw input text; committable === true triggers an immediate commit. */
    parse: (text: string) => DraftParseResult<T>;
    /** Optional blurred-display transform (e.g. thousands-separator formatting). */
    format?: (raw: string) => string;
    readonly?: boolean;
}
export interface DraftHandles {
    value: string;
    isFocused: boolean;
    onChangeText: (text: string) => void;
    onFocus: () => void;
    onBlur: () => void;
}
export declare function useDraftValue<T>(cfg: DraftConfig<T>): DraftHandles;
//# sourceMappingURL=useDraftValue.d.ts.map