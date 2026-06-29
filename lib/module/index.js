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

// PR-3a: StyleSheet primitives
export { AppModal } from "./widgets/primitives/Modal.js";
export { BottomSheet } from "./widgets/primitives/BottomSheet.js";
// PR-3a: appearance taxonomy + dispatch
export { resolveVariant, APPEARANCE_TABLE } from "./widgets/appearance.js";
export { pickWidget } from "./widgets/pickWidget.js";
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
export { SignatureWidget } from "./widgets/SignatureWidget.js";
export { FileWidget } from "./widgets/FileWidget.js";
// PR-4: Form component
export { Form } from "./form/Form.js";
//# sourceMappingURL=index.js.map