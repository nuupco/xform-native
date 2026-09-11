/**
 * UnsupportedWidget — fallback surface (REQ-09).
 *
 * Rendered when isWidgetAvailable(dataType) returns false.
 * Displays the DataType label. Does not crash.
 * Usable standalone outside <Form>.
 */
import type { DataType } from '@nuup/ts-rosa';
export interface UnsupportedWidgetProps {
    dataType: DataType | string;
}
export declare function UnsupportedWidget({ dataType }: UnsupportedWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=UnsupportedWidget.d.ts.map