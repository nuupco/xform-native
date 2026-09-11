export declare function BofSurface({ onStart, formTitle, formVersion, }: {
    onStart: () => void;
    formTitle?: string;
    formVersion?: string;
}): import("react").JSX.Element;
export declare function EofSurface({ onFinish, answeredCount, skippedCount, }: {
    onFinish?: () => void;
    answeredCount?: number;
    skippedCount?: number;
}): import("react").JSX.Element;
export declare function ConstraintSurface({ message }: {
    message: string;
}): import("react").JSX.Element;
export declare function RequiredSurface(): import("react").JSX.Element;
export declare function LabelHint({ label, hint, required, }: {
    label: string | null;
    hint: string | null;
    required?: boolean;
}): import("react").JSX.Element;
export declare function RepeatPromptCard({ label, onPress }: {
    label: string;
    onPress: () => void;
}): import("react").JSX.Element;
export declare function WidgetErrorFallback({ fieldName }: {
    fieldName: string;
}): import("react").JSX.Element;
//# sourceMappingURL=surfaces.d.ts.map