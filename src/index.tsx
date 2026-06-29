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
export { SignatureWidget } from './widgets/SignatureWidget';
export type { SignatureWidgetProps } from './widgets/SignatureWidget';
export { FileWidget } from './widgets/FileWidget';
export type { FileWidgetProps } from './widgets/FileWidget';

// PR-4: Form component
export { Form } from './form/Form';
export type { FormProps } from './form/Form';
