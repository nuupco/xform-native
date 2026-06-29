/**
 * surfaces.tsx — bof / eof / required / constraint / label-hint display components.
 *
 * ADR-2: these are pure presentational components with no store dependency.
 */
export declare function BofSurface({ onStart }: {
    onStart: () => void;
}): import("react").JSX.Element;
export declare function EofSurface(): import("react").JSX.Element;
export declare function ConstraintSurface({ message }: {
    message: string;
}): import("react").JSX.Element;
export declare function RequiredSurface(): import("react").JSX.Element;
export declare function LabelHint({ label, hint, }: {
    label: string | null;
    hint: string | null;
}): import("react").JSX.Element;
//# sourceMappingURL=surfaces.d.ts.map