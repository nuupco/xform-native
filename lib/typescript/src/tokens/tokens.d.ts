/**
 * Design tokens for @nuup/xform-native.
 * Plain JS object — no imports, no deps (REQ-17).
 *
 * Shape (per design ADR-1):
 *   color:   { primary, background, surface, error, text }
 *   spacing: { xs, sm, md, lg, xl }
 *   radius:  { sm, md, lg }
 *   font:    { xs, sm, md, lg, xl }
 */
export declare const tokens: {
    readonly color: {
        readonly primary: "#1976D2";
        readonly background: "#FFFFFF";
        readonly surface: "#F5F5F5";
        readonly error: "#D32F2F";
        readonly text: "#212121";
    };
    readonly spacing: {
        readonly xs: 4;
        readonly sm: 8;
        readonly md: 16;
        readonly lg: 24;
        readonly xl: 32;
    };
    readonly radius: {
        readonly sm: 4;
        readonly md: 8;
        readonly lg: 16;
    };
    readonly font: {
        readonly xs: 10;
        readonly sm: 12;
        readonly md: 14;
        readonly lg: 16;
        readonly xl: 20;
    };
};
export type Tokens = typeof tokens;
//# sourceMappingURL=tokens.d.ts.map