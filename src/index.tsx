// Public API barrel — @nuup/xform-native
// PR-1: tokens + isWidgetAvailable
// PR-2: adapter + reactivity store (REQ-07/19: NO ts-rosa experimental symbols exported)

// PR-1
export { tokens } from './tokens/tokens';
export { isWidgetAvailable } from './availability/registry';
export type { IsWidgetAvailableOpts } from './availability/registry';

// PR-2: adapter types (opaque, firewall-safe)
export type { NodeRef, AdaptedEvent, FormAdapter } from './adapter/FormAdapter';

// PR-2: adapter factory
export { createAdapter } from './adapter/createAdapter';

// PR-2: reactivity store + hook
export { FormSessionStore } from './store/FormSessionStore';
export type { FormSessionSnapshot } from './store/FormSessionStore';
export { useFormSession } from './store/useFormSession';

// Slice C: createFormStore factory (external instance resolution)
export { createFormStore } from './createFormStore';
export type { ExternalDataFetcher, CreateFormStoreOpts } from './createFormStore';

// form-load-profiling: opt-in split-cost timing instrumentation (ADR-3)
export { createPhaseTimer } from './loadTiming';
export type { FormLoadPhase, PhaseTiming, PhaseTimingListener } from './loadTiming';

// example-app-loading-ux: framework-agnostic discard-on-resolve cancellation
export { createCancellableFormLoad } from './loadCancellation';
export type { CancellableLoad } from './loadCancellation';

// PR-3a: StyleSheet primitives
export { AppModal } from './widgets/primitives/Modal';
export type { AppModalProps } from './widgets/primitives/Modal';
export { BottomSheet } from './widgets/primitives/BottomSheet';
export type { BottomSheetProps } from './widgets/primitives/BottomSheet';

// PR-3a: appearance taxonomy + dispatch
export { resolveVariant, APPEARANCE_TABLE } from './widgets/appearance';
export type { VariantId } from './widgets/appearance';
export { pickWidget } from './widgets/pickWidget';
export type { PickWidgetResult } from './widgets/pickWidget';

// PR-3a + PR-3b: widgets
export { StringWidget } from './widgets/StringWidget';
export type { StringWidgetProps } from './widgets/StringWidget';
export { IntWidget } from './widgets/IntWidget';
export type { IntWidgetProps } from './widgets/IntWidget';
export { DecimalWidget } from './widgets/DecimalWidget';
export type { DecimalWidgetProps } from './widgets/DecimalWidget';
export { LongWidget } from './widgets/LongWidget';
export type { LongWidgetProps } from './widgets/LongWidget';
export { BooleanWidget } from './widgets/BooleanWidget';
export type { BooleanWidgetProps } from './widgets/BooleanWidget';
export { NoteWidget } from './widgets/NoteWidget';
export type { NoteWidgetProps } from './widgets/NoteWidget';
export { UncastWidget } from './widgets/UncastWidget';
export type { UncastWidgetProps } from './widgets/UncastWidget';
export { UnsupportedWidget } from './widgets/UnsupportedWidget';
export type { UnsupportedWidgetProps } from './widgets/UnsupportedWidget';

// PR-3b: widgets
export { SelectOneWidget } from './widgets/SelectOneWidget';
export type { SelectOneWidgetProps } from './widgets/SelectOneWidget';
export { SelectMultiWidget } from './widgets/SelectMultiWidget';
export type { SelectMultiWidgetProps } from './widgets/SelectMultiWidget';
export { DateWidget } from './widgets/DateWidget';
export type { DateWidgetProps } from './widgets/DateWidget';
export { TimeWidget } from './widgets/TimeWidget';
export type { TimeWidgetProps } from './widgets/TimeWidget';
export { DateTimeWidget } from './widgets/DateTimeWidget';
export type { DateTimeWidgetProps } from './widgets/DateTimeWidget';
export { RangeWidget } from './widgets/RangeWidget';
export type { RangeWidgetProps } from './widgets/RangeWidget';

// P2: media widgets (stubs in PR-1, full impl in PR-2..PR-4)
export { ImageWidget } from './widgets/ImageWidget';
export type { ImageWidgetProps } from './widgets/ImageWidget';
export { AudioWidget } from './widgets/AudioWidget';
export type { AudioWidgetProps } from './widgets/AudioWidget';
export { VideoWidget } from './widgets/VideoWidget';
export type { VideoWidgetProps } from './widgets/VideoWidget';
export { SignatureWidget } from './widgets/SignatureWidget';
export type { SignatureWidgetProps } from './widgets/SignatureWidget';
export { FileWidget } from './widgets/FileWidget';
export type { FileWidgetProps } from './widgets/FileWidget';

// PR-4: GeoPointWidget + offline tile cache
export { GeoPointWidget } from './widgets/GeoPointWidget';
export type { GeoPointWidgetProps } from './widgets/GeoPointWidget';
export { GeoShapeWidget } from './widgets/GeoShapeWidget';
export type { GeoShapeWidgetProps } from './widgets/GeoShapeWidget';
export { GeoTraceWidget } from './widgets/GeoTraceWidget';
export type { GeoTraceWidgetProps } from './widgets/GeoTraceWidget';
export {
  preWarmSatelliteTiles,
  clearSatelliteTileCache,
  getCacheStatus,
} from './widgets/offline/SatelliteTileCache';
export type { BBox, CacheStatus } from './widgets/offline/SatelliteTileCache';

// P5: BarcodeWidget
export { BarcodeWidget } from './widgets/BarcodeWidget';
export type { BarcodeWidgetProps } from './widgets/BarcodeWidget';

// PR-4: Form component
export { Form } from './form/Form';
export type { FormProps } from './form/Form';

// widget-registry: injectable widget override registry (D3/D4/D5)
export {
  resolveWidget,
  WidgetRegistryProvider,
  useWidgetOverrides,
} from './widgets/registry';
export type { XFormWidgetProps, WidgetOverride, PickWidgetArgs } from './widgets/registry';

// form-theming: mount-time-only ThemeProvider over tokens.ts (D1/D2)
export { ThemeProvider, useTheme, useThemedStyles } from './theme/ThemeContext';
export { mergeTheme } from './theme/theme';
export type { Theme, ThemeOverride } from './theme/theme';
export { mix, luminance, onColor, deriveRoleSet } from './theme/derive';
export type { Hex, RoleSet } from './theme/derive';
export type { TypographyRole, Typography } from './tokens/typography';
export type { ElevationLevel, Elevation } from './tokens/elevation';

// campo-phase2-pr1: style/component primitives (elevationStyle, PressableButton)
export { elevationStyle } from './theme/elevationStyle';
export type { ElevationLevel as ElevationStyleLevel } from './theme/elevationStyle';
export { PressableButton } from './widgets/primitives/PressableButton';
export type { PressableButtonProps } from './widgets/primitives/PressableButton';

// form-composition-slots: optional render-prop overrides for nav/error/group (D6)
export type {
  FormSlots,
  FormErrorBlock,
  FormNavigationSlotContext,
  FormErrorSlotContext,
  FormGroupSlotContext,
} from './form/slots';

// form-validation-hooks: injectable per-controlType validation callback (D7/D8)
export {
  defaultAdvanceValidator,
  resolveValidator,
  ValidationRegistryProvider,
  useValidatorOverrides,
} from './form/validation';
export type {
  AdvanceBlock,
  AdvanceValidator,
  AdvanceValidatorCtx,
  ValidatorOverride,
  QuestionEvent,
} from './form/validation';
