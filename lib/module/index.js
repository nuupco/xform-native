"use strict";

// Public API barrel — @nuup/xform-native
// PR-1: tokens + isWidgetAvailable
// PR-2: adapter + reactivity store (REQ-07/19: NO ts-rosa experimental symbols exported)

// PR-1
export { tokens } from "./tokens/tokens.js";
export { isWidgetAvailable } from "./availability/registry.js";

// PR-2: adapter types (opaque, firewall-safe)

// PR-2: adapter factory
export { createAdapter } from "./adapter/createAdapter.js";

// PR-2: reactivity store + hook
export { FormSessionStore } from "./store/FormSessionStore.js";
export { useFormSession } from "./store/useFormSession.js";

// Slice C: createFormStore factory (external instance resolution)
export { createFormStore } from "./createFormStore.js";
// form-load-profiling: opt-in split-cost timing instrumentation (ADR-3)
export { createPhaseTimer } from "./loadTiming.js";
// example-app-loading-ux: framework-agnostic discard-on-resolve cancellation
export { createCancellableFormLoad } from "./loadCancellation.js";
// PR-3a: StyleSheet primitives
export { AppModal } from "./widgets/primitives/Modal.js";
export { BottomSheet } from "./widgets/primitives/BottomSheet.js";
// PR-3a: appearance taxonomy + dispatch
export { resolveVariant, APPEARANCE_TABLE } from "./widgets/engine/appearance.js";
export { pickWidget } from "./widgets/engine/pickWidget.js";
// PR-3a + PR-3b: widgets
export { StringWidget } from "./widgets/StringWidget.js";
export { IntWidget } from "./widgets/IntWidget.js";
export { DecimalWidget } from "./widgets/DecimalWidget.js";
export { LongWidget } from "./widgets/LongWidget.js";
export { BooleanWidget } from "./widgets/BooleanWidget.js";
export { NoteWidget } from "./widgets/NoteWidget.js";
export { UncastWidget } from "./widgets/UncastWidget.js";
export { UnsupportedWidget } from "./widgets/UnsupportedWidget.js";
// PR-3b: widgets
export { SelectOneWidget } from "./widgets/SelectOneWidget.js";
export { SelectMultiWidget } from "./widgets/SelectMultiWidget.js";
export { DateWidget } from "./widgets/DateWidget.js";
export { TimeWidget } from "./widgets/TimeWidget.js";
export { DateTimeWidget } from "./widgets/DateTimeWidget.js";
export { RangeWidget } from "./widgets/RangeWidget.js";
// P2: media widgets (stubs in PR-1, full impl in PR-2..PR-4)
export { ImageWidget } from "./widgets/ImageWidget.js";
export { AudioWidget } from "./widgets/AudioWidget.js";
export { VideoWidget } from "./widgets/VideoWidget.js";
export { SignatureWidget } from "./widgets/SignatureWidget.js";
export { FileWidget } from "./widgets/FileWidget.js";
// PR-4: GeoPointWidget + offline tile cache
export { GeoPointWidget } from "./widgets/GeoPointWidget.js";
export { GeoShapeWidget } from "./widgets/GeoShapeWidget.js";
export { GeoTraceWidget } from "./widgets/GeoTraceWidget.js";
export { preWarmSatelliteTiles, clearSatelliteTileCache, getCacheStatus } from "./widgets/offline/SatelliteTileCache.js";
// P5: BarcodeWidget
export { BarcodeWidget } from "./widgets/BarcodeWidget.js";
// PR-4: Form component
export { Form } from "./form/Form.js";
// widget-registry: injectable widget override registry (D3/D4/D5)
export { resolveWidget, WidgetRegistryProvider, useWidgetOverrides } from "./widgets/engine/registry.js";
// form-theming: mount-time-only ThemeProvider over tokens.ts (D1/D2)
export { ThemeProvider, useTheme, useThemedStyles } from "./theme/ThemeContext.js";
export { mergeTheme } from "./theme/theme.js";
export { mix, luminance, onColor, deriveRoleSet } from "./theme/derive.js";
// campo-phase2-pr1: style/component primitives (elevationStyle, PressableButton)
export { elevationStyle } from "./theme/elevationStyle.js";
export { PressableButton } from "./widgets/primitives/PressableButton.js";
// campo-phase3-pr3: SelectionRow/SelectionIndicator + SegmentedButton primitives
export { SelectionRow, SelectionIndicator } from "./widgets/primitives/SelectionRow.js";
export { SegmentedButton } from "./widgets/primitives/SegmentedButton.js";
// campo-phase3-pr10: MediaCaptureCard primitive (no widget consumes it yet)
export { MediaCaptureCard } from "./widgets/primitives/MediaCaptureCard.js";

// form-composition-slots: optional render-prop overrides for nav/error/group (D6)

// Phase 7 PR3: section/repeat position indicator (design decisions 7-14, 17)
export { SectionIndicator } from "./form/SectionIndicator.js";
// form-validation-hooks: injectable per-controlType validation callback (D7/D8)
export { defaultAdvanceValidator, resolveValidator, ValidationRegistryProvider, useValidatorOverrides } from "./form/validation.js";
//# sourceMappingURL=index.js.map