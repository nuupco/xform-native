"use strict";

/**
 * Form.tsx — navigator-driven screen-per-question component (REQ-10..REQ-12).
 *
 * ADR-1: uses useFormSession for reactivity.
 * ADR-2: switches on AdaptedEvent.kind.
 * ADR-5: dispatches to widget via pickWidget.
 */

import { useCallback, useEffect, useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { useFormSession } from "../store/useFormSession.js";
import { pickWidget } from "../widgets/pickWidget.js";
import { tokens } from "../tokens/tokens.js";
import { BofSurface, EofSurface, ConstraintSurface, RequiredSurface, LabelHint } from "./surfaces.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Form({
  store
}) {
  const snapshot = useFormSession(store);
  const [advanceBlocked, setAdvanceBlocked] = useState(null);

  // Auto-skip non-relevant nodes (REQ-10)
  useEffect(() => {
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind === 'question' || ev.kind === 'group' || ev.kind === 'repeat' || ev.kind === 'prompt-new-repeat') {
      if (!store.adapter.isEffectivelyRelevant(ev.ref)) {
        store.stepForward();
      }
    }
  }, [snapshot.version, store]);

  // Clear validation block when the event changes
  const event = store.adapter.getCurrentEvent();
  const eventIndex = event.kind === 'bof' || event.kind === 'eof' ? -1 : event.index;
  useEffect(() => {
    setAdvanceBlocked(null);
  }, [event.kind, eventIndex]);
  function isValueEmpty(value) {
    return value === null || value === undefined || value === '';
  }
  const handleNext = useCallback(() => {
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind === 'question') {
      const value = store.adapter.resolveValue(ev.ref);
      const nodeState = store.adapter.getNodeState(ev.ref);
      const previousResult = store.lastAnswerResult;
      const result = store.answerQuestion(ev.ref, value);
      if (result === AnswerResult.REQUIRED_BUT_EMPTY || nodeState.required && isValueEmpty(value)) {
        setAdvanceBlocked({
          type: 'required',
          message: 'This field is required'
        });
        return;
      }
      if (result === AnswerResult.CONSTRAINT_VIOLATED || previousResult?.ref === ev.ref && previousResult.result === AnswerResult.CONSTRAINT_VIOLATED) {
        const nodeState = store.adapter.getNodeState(ev.ref);
        setAdvanceBlocked({
          type: 'constraint',
          message: nodeState.constraintMsg ?? 'Invalid value'
        });
        return;
      }
    }
    setAdvanceBlocked(null);
    store.stepForward();
  }, [store]);
  const handleBack = useCallback(() => {
    store.stepBackward();
  }, [store]);
  function renderContent() {
    const ev = event;
    switch (ev.kind) {
      case 'bof':
        return /*#__PURE__*/_jsx(BofSurface, {
          onStart: handleNext
        });
      case 'eof':
        return /*#__PURE__*/_jsx(EofSurface, {});
      case 'question':
        {
          const nodeState = store.adapter.getNodeState(ev.ref);
          const {
            Widget
          } = pickWidget(ev.dataType, ev.controlType, ev.appearance, nodeState.readonly, ev.mediatype);
          const rangeProps = ev.rangeBounds != null ? {
            start: ev.rangeBounds.start,
            end: ev.rangeBounds.end,
            step: ev.rangeBounds.step
          } : {};
          return /*#__PURE__*/_jsxs(View, {
            children: [/*#__PURE__*/_jsx(LabelHint, {
              label: ev.label,
              hint: ev.hint
            }), nodeState.required && /*#__PURE__*/_jsx(Text, {
              testID: "required-indicator",
              style: styles.required,
              children: "*"
            }), /*#__PURE__*/_jsx(Widget, {
              ref: ev.ref,
              store: store,
              appearance: ev.appearance,
              ...rangeProps
            }), advanceBlocked?.type === 'constraint' && /*#__PURE__*/_jsx(ConstraintSurface, {
              message: advanceBlocked.message
            }), advanceBlocked?.type === 'required' && /*#__PURE__*/_jsx(RequiredSurface, {})]
          });
        }
      case 'group':
        return /*#__PURE__*/_jsx(View, {
          children: /*#__PURE__*/_jsx(LabelHint, {
            label: ev.label,
            hint: ev.hint
          })
        });
      case 'repeat':
        return /*#__PURE__*/_jsxs(View, {
          children: [/*#__PURE__*/_jsx(LabelHint, {
            label: ev.label,
            hint: null
          }), /*#__PURE__*/_jsxs(Text, {
            testID: "repeat-multiplicity",
            children: ["Entries: ", ev.multiplicity]
          })]
        });
      case 'prompt-new-repeat':
        return /*#__PURE__*/_jsxs(View, {
          children: [/*#__PURE__*/_jsx(LabelHint, {
            label: ev.label,
            hint: null
          }), /*#__PURE__*/_jsx(Pressable, {
            onPress: handleNext,
            testID: "prompt-continue",
            children: /*#__PURE__*/_jsx(Text, {
              children: "Continue"
            })
          })]
        });
      default:
        return null;
    }
  }
  const showNav = event.kind !== 'bof' && event.kind !== 'eof';
  return /*#__PURE__*/_jsxs(View, {
    style: styles.container,
    children: [renderContent(), showNav && /*#__PURE__*/_jsxs(View, {
      style: styles.navRow,
      children: [/*#__PURE__*/_jsx(Pressable, {
        onPress: handleBack,
        testID: "nav-back",
        style: styles.navButton,
        children: /*#__PURE__*/_jsx(Text, {
          children: "Back"
        })
      }), /*#__PURE__*/_jsx(Pressable, {
        onPress: handleNext,
        testID: "nav-next",
        style: styles.navButton,
        children: /*#__PURE__*/_jsx(Text, {
          children: "Next"
        })
      })]
    })]
  });
}
const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.md
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.md
  },
  navButton: {
    padding: tokens.spacing.sm,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm
  },
  required: {
    color: tokens.color.error,
    fontSize: tokens.font.sm
  }
});
//# sourceMappingURL=Form.js.map