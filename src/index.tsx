// Public API barrel — @nuup/xform-native
// PR-1: tokens + isWidgetAvailable
// PR-2: adapter + reactivity store (REQ-07/19: NO ts-rosa experimental symbols exported)

// PR-1
export { tokens } from './tokens/tokens';
export { isWidgetAvailable } from './availability/registry';

// PR-2: adapter types (opaque, firewall-safe)
export type { NodeRef, AdaptedEvent, FormAdapter } from './adapter/FormAdapter';

// PR-2: adapter factory
export { createAdapter } from './adapter/createAdapter';

// PR-2: reactivity store + hook
export { FormSessionStore } from './store/FormSessionStore';
export type { FormSessionSnapshot } from './store/FormSessionStore';
export { useFormSession } from './store/useFormSession';
