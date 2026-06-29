"use strict";

/**
 * SignatureWidget — binary signature capture (REQ-M07..M10).
 *
 * Gated on react-native-svg (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 */
import { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, PanResponder, StyleSheet } from 'react-native';
import { UnsupportedWidget } from "./UnsupportedWidget.js";
import { tokens } from "../tokens/tokens.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
let _SvgModule = null;
let _svgLoaded;
function getSvg() {
  if (_svgLoaded === undefined) {
    try {
      _SvgModule = require('react-native-svg');
      _svgLoaded = true;
    } catch {
      _svgLoaded = false;
    }
  }
  return _SvgModule;
}
export function SignatureWidget({
  ref,
  store
}) {
  const svg = getSvg();
  const nodeState = store.adapter.getNodeState(ref);
  const readonly = nodeState.readonly;
  const [strokes, setStrokes] = useState([]);
  const currentPath = useRef([]);
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !readonly,
    onMoveShouldSetPanResponder: () => !readonly,
    onPanResponderGrant: _evt => {
      currentPath.current = [];
    },
    onPanResponderMove: (_evt, gs) => {
      const {
        moveX,
        moveY
      } = gs;
      const cmd = currentPath.current.length === 0 ? `M${moveX},${moveY}` : `L${moveX},${moveY}`;
      currentPath.current.push(cmd);
      // Trigger re-render by updating strokes
      setStrokes(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.path === '') {
          copy[copy.length - 1] = {
            ...last,
            path: currentPath.current.join(' ')
          };
        }
        return copy;
      });
    },
    onPanResponderRelease: () => {
      const pathStr = currentPath.current.join(' ');
      if (pathStr.length === 0) return;
      setStrokes(prev => [...prev, {
        path: pathStr,
        color: '#000000',
        width: 2
      }]);
      currentPath.current = [];
    }
  })).current;
  const handleClear = useCallback(() => {
    setStrokes([]);
  }, []);
  const handleExport = useCallback(() => {
    // In a real implementation, this would use react-native-view-shot
    // to capture the SVG canvas as a PNG file. For now, export the
    // stroke data as a JSON-serialized URI marker.
    const data = JSON.stringify(strokes);
    const uri = `signature:${data}`;
    store.answerQuestion(ref, uri);
  }, [ref, store, strokes]);
  if (!svg) {
    return /*#__PURE__*/_jsx(UnsupportedWidget, {
      dataType: "binary"
    });
  }
  const {
    Svg,
    Path
  } = svg;
  return /*#__PURE__*/_jsxs(View, {
    style: styles.container,
    testID: "signature-widget",
    children: [/*#__PURE__*/_jsx(View, {
      style: readonly ? styles.canvasReadonly : styles.canvas,
      ...panResponder.panHandlers,
      testID: "signature-canvas",
      children: /*#__PURE__*/_jsx(Svg, {
        width: "100%",
        height: 200,
        viewBox: "0 0 400 200",
        testID: "svg-drawing",
        children: strokes.map((stroke, i) => /*#__PURE__*/_jsx(Path, {
          d: stroke.path,
          stroke: stroke.color,
          strokeWidth: stroke.width,
          fill: "none",
          testID: `stroke-${i}`
        }, i))
      })
    }), !readonly && /*#__PURE__*/_jsxs(View, {
      style: styles.buttonRow,
      children: [/*#__PURE__*/_jsx(Pressable, {
        onPress: handleClear,
        style: styles.button,
        testID: "signature-clear-button",
        children: /*#__PURE__*/_jsx(Text, {
          style: styles.buttonText,
          children: "Clear"
        })
      }), /*#__PURE__*/_jsx(Pressable, {
        onPress: handleExport,
        style: [styles.button, styles.exportButton],
        testID: "signature-export-button",
        children: /*#__PURE__*/_jsx(Text, {
          style: styles.buttonText,
          children: "Save"
        })
      })]
    })]
  });
}
const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.sm
  },
  canvas: {
    height: 200,
    borderWidth: 1,
    borderColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
    backgroundColor: '#ffffff'
  },
  canvasReadonly: {
    height: 200,
    borderWidth: 1,
    borderColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
    backgroundColor: '#f0f0f0'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm
  },
  button: {
    padding: tokens.spacing.sm,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm
  },
  exportButton: {
    backgroundColor: tokens.color.primary
  },
  buttonText: {
    color: tokens.color.text,
    fontSize: tokens.font.sm
  }
});
//# sourceMappingURL=SignatureWidget.js.map