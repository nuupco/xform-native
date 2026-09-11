import { type Theme } from '../../theme/ThemeContext.js';
export interface IconProps {
    testID?: string;
    color?: string;
    size?: number;
    /** Optional theme override (design decision 10); defaults to `useTheme()`'s current theme. */
    theme?: Theme;
}
/** Solid alert/exclamation glyph — 16px default, single colored View "!" bar + dot. */
export declare function AlertIcon({ testID, color, size, theme, }: IconProps): import("react").JSX.Element;
/** "+" glyph made from two overlapping bars. */
export declare function PlusIcon({ testID, color, size, theme, }: IconProps): import("react").JSX.Element;
/**
 * 64px leaf/sprout mark. Renders an `Svg`/`Path` leaf shape when
 * `react-native-svg` is installed; otherwise falls back to a
 * `primaryContainer`-colored circle so the layout footprint is preserved.
 */
export declare function LeafIcon({ testID, color, size, theme, }: IconProps): import("react").JSX.Element;
/**
 * Phase 3 icon expansion (design decision 9) — 17 new glyphs, all hand-rolled
 * from `View`/`Text` composition (zero `react-native-svg` dependency, same
 * technique as `AlertIcon`/`PlusIcon`). `react-native-svg` is confirmed
 * absent from `example/package.json`, so any svg-gated icon would silently
 * fall back to a shapeless circle in the only app exercising this library.
 *
 * Complex glyphs (chevron, question mark, arrows, grip) degrade to a `Text`
 * glyph child inside a sized `View`, matching `LeafIcon`'s fallback footprint
 * contract: the outer `View` is always `{ width: size, height: size }`.
 */
/** ✓ check glyph — two bars forming a checkmark, rotated via transform. */
export declare function CheckIcon({ testID, color, size, theme, }: IconProps): import("react").JSX.Element;
/** "−" glyph — a single horizontal bar. */
export declare function MinusIcon({ testID, color, size, theme, }: IconProps): import("react").JSX.Element;
/** ⌄ chevron-down glyph (SelectOne/SelectMulti trigger affordance). */
export declare const ChevronDownIcon: ({ testID, color, size, theme, }: IconProps) => import("react").JSX.Element;
/** 🔍 magnifying-glass glyph (search bar affordance). */
export declare const SearchIcon: ({ testID, color, size, theme, }: IconProps) => import("react").JSX.Element;
/** ▤ calendar glyph (Date/DateTime trigger affordance). */
export declare const CalendarIcon: ({ testID, color, size, theme, }: IconProps) => import("react").JSX.Element;
/** ◔ clock glyph (Time/DateTime trigger affordance). */
export declare const ClockIcon: ({ testID, color, size, theme, }: IconProps) => import("react").JSX.Element;
/** ⚹ camera glyph (Image capture affordance). */
export declare const CameraIcon: ({ testID, color, size, theme, }: IconProps) => import("react").JSX.Element;
/** mic glyph (Audio capture affordance). */
export declare const MicIcon: ({ testID, color, size, theme, }: IconProps) => import("react").JSX.Element;
/** video-camera glyph (Video capture affordance). */
export declare const VideoIcon: ({ testID, color, size, theme, }: IconProps) => import("react").JSX.Element;
/** paperclip glyph (File capture affordance). */
export declare const PaperclipIcon: ({ testID, color, size, theme, }: IconProps) => import("react").JSX.Element;
/** ? glyph (Unsupported/fallback widget). */
export declare const QuestionIcon: ({ testID, color, size, theme, }: IconProps) => import("react").JSX.Element;
/** arrow-up glyph (Rank widget reorder control). */
export declare const ArrowUpIcon: ({ testID, color, size, theme, }: IconProps) => import("react").JSX.Element;
/** arrow-down glyph (Rank widget reorder control). */
export declare const ArrowDownIcon: ({ testID, color, size, theme, }: IconProps) => import("react").JSX.Element;
/** grip/drag-handle glyph (Rank widget drag affordance). */
export declare const GripIcon: ({ testID, color, size, theme, }: IconProps) => import("react").JSX.Element;
/** map-pin glyph (Geo widget empty state / marker). */
export declare const MapPinIcon: ({ testID, color, size, theme, }: IconProps) => import("react").JSX.Element;
/** recenter/target glyph (Geo map recenter action). */
export declare const TargetIcon: ({ testID, color, size, theme, }: IconProps) => import("react").JSX.Element;
/** download/offline-tiles glyph (Geo map download-tiles action). */
export declare const DownloadIcon: ({ testID, color, size, theme, }: IconProps) => import("react").JSX.Element;
//# sourceMappingURL=Icon.d.ts.map