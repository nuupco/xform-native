export interface NavRowProps {
    onBack: () => void;
    onNext: () => void;
    isLastStep?: boolean;
    backDisabled?: boolean;
    nextDisabled?: boolean;
}
export declare function NavRow({ onBack, onNext, isLastStep, backDisabled, nextDisabled }: NavRowProps): import("react").JSX.Element;
//# sourceMappingURL=NavRow.d.ts.map