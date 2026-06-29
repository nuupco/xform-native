import type { DataType } from '@nuup/ts-rosa';
export interface IsWidgetAvailableOpts {
    mediatype?: string;
}
/**
 * Returns true if a widget is available for the given DataType.
 * Never throws — missing registry entry returns false (REQ-20).
 */
export declare function isWidgetAvailable(dataType: DataType, opts?: IsWidgetAvailableOpts): boolean;
//# sourceMappingURL=registry.d.ts.map