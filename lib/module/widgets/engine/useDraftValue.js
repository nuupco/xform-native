"use strict";

/**
 * useDraftValue — shared draft-editing hook for numeric widgets
 * (IntWidget, DecimalWidget, LongWidget). See design: widget-draft-value.
 *
 * Owns draft text + focus state and the store<->draft resync logic via
 * render-time derivation (no useEffect). The widget supplies the
 * DataType-specific `parse` predicate and an optional blurred-display
 * `format` transform.
 */

import { useState } from 'react';
export function useDraftValue(cfg) {
  const [draft, setDraft] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const storeString = cfg.storeValue != null ? String(cfg.storeValue) : '';
  const value = isFocused ? draft ?? storeString : cfg.format ? cfg.format(storeString) : storeString;
  function onChangeText(text) {
    if (cfg.readonly) return;
    setDraft(text);
    const {
      committable,
      value: parsed
    } = cfg.parse(text);
    if (committable) {
      cfg.commit(parsed);
    }
  }
  function onFocus() {
    setIsFocused(true);
    setDraft(storeString);
  }
  function onBlur() {
    setIsFocused(false);
    setDraft(null);
  }
  return {
    value,
    isFocused,
    onChangeText,
    onFocus,
    onBlur
  };
}
//# sourceMappingURL=useDraftValue.js.map