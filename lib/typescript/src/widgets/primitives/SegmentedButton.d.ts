import type { Theme } from '../../theme/ThemeContext.js';
export interface SegmentedButtonOption<T extends string = string> {
    value: T;
    label: string;
}
export interface SegmentedButtonProps<T extends string = string> {
    options: readonly [SegmentedButtonOption<T>, SegmentedButtonOption<T>];
    /** `null` = unanswered — neither segment renders as selected. */
    value: T | null;
    onChange: (value: T) => void;
    disabled?: boolean;
    testID?: string;
    theme?: Theme;
}
export declare function SegmentedButton<T extends string = string>({ options, value, onChange, disabled, testID, theme, }: SegmentedButtonProps<T>): import("react").JSX.Element;
//# sourceMappingURL=SegmentedButton.d.ts.map