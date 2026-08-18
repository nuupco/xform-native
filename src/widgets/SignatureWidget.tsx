/**
 * SignatureWidget — binary signature capture (REQ-M07..M10).
 *
 * Gated on react-native-svg (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 *
 * Theming (Phase 3, design doc per-widget mapping table): the canvas is an
 * svg drawing surface, not a `MediaCaptureCard` preview, so it keeps its own
 * themed styles (`roles.surface` when editable for ink contrast,
 * `roles.surfaceVariant` when readonly, stroke color from `roles.onSurface`).
 * Only the action row (Clear/Save) reuses `PressableButton` directly — the
 * same primitive `MediaCaptureCard` itself wraps for its own action row
 * (decision 7, "(action row only)" annotation) — rather than force-fitting
 * the whole canvas-based widget into `MediaCaptureCard`'s empty/captured/
 * active preview shape, which doesn't model a live drawing surface.
 */
import { useCallback, useRef, useState } from 'react';
import {
  View,
  PanResponder,
  StyleSheet,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { useThemedStyles, useTheme, type Theme } from '../theme/ThemeContext';
import { PressableButton } from './primitives/PressableButton';

let _SvgModule: any | null = null;
let _svgLoaded: boolean | undefined;

function getSvg(): any | null {
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

interface Stroke {
  path: string;
  color: string;
  width: number;
}

export interface SignatureWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { gap: t.spacing.sm },
    canvas: {
      height: 200,
      borderWidth: 1,
      borderColor: t.color.roles.outline,
      borderRadius: t.radius.sm,
      backgroundColor: t.color.roles.surface,
    },
    canvasReadonly: {
      height: 200,
      borderWidth: 1,
      borderColor: t.color.roles.outline,
      borderRadius: t.radius.sm,
      backgroundColor: t.color.roles.surfaceVariant,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: t.spacing.sm,
    },
  });
}

export function SignatureWidget({ nodeRef, store }: SignatureWidgetProps) {
  // Theming (D2): useThemedStyles MUST stay the first statement, before the
  // peer-dependency gating early return below, to preserve hook-order
  // stability (select-widgets-hook-order invariant).
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const svg = getSvg();
  const nodeState = store.adapter.getNodeState(nodeRef);
  const readonly = nodeState.readonly;

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentPath = useRef<string[]>([]);
  const strokeColor = theme.color.roles.onSurface;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !readonly,
      onMoveShouldSetPanResponder: () => !readonly,
      onPanResponderGrant: (_evt: GestureResponderEvent) => {
        currentPath.current = [];
      },
      onPanResponderMove: (
        _evt: GestureResponderEvent,
        gs: PanResponderGestureState,
      ) => {
        const { moveX, moveY } = gs;
        const cmd =
          currentPath.current.length === 0
            ? `M${moveX},${moveY}`
            : `L${moveX},${moveY}`;
        currentPath.current.push(cmd);
        // Trigger re-render by updating strokes
        setStrokes((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.path === '') {
            copy[copy.length - 1] = {
              ...last,
              path: currentPath.current.join(' '),
            };
          }
          return copy;
        });
      },
      onPanResponderRelease: () => {
        const pathStr = currentPath.current.join(' ');
        if (pathStr.length === 0) return;
        setStrokes((prev) => [
          ...prev,
          { path: pathStr, color: strokeColor, width: 2 },
        ]);
        currentPath.current = [];
      },
    }),
  ).current;

  const handleClear = useCallback(() => {
    setStrokes([]);
  }, []);

  const handleExport = useCallback(() => {
    // In a real implementation, this would use react-native-view-shot
    // to capture the SVG canvas as a PNG file. For now, export the
    // stroke data as a JSON-serialized URI marker.
    const data = JSON.stringify(strokes);
    const uri = `signature:${data}`;
    store.answerQuestion(nodeRef, uri);
  }, [nodeRef, store, strokes]);

  if (!svg) {
    return <UnsupportedWidget dataType="binary" />;
  }

  const { Svg, Path } = svg;

  return (
    <View style={styles.container} testID="signature-widget">
      <View
        style={readonly ? styles.canvasReadonly : styles.canvas}
        {...panResponder.panHandlers}
        testID="signature-canvas"
      >
        <Svg
          width="100%"
          height={200}
          viewBox="0 0 400 200"
          testID="svg-drawing"
        >
          {strokes.map((stroke, i) => (
            <Path
              key={i}
              d={stroke.path}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              fill="none"
              testID={`stroke-${i}`}
            />
          ))}
        </Svg>
      </View>
      {!readonly && (
        <View style={styles.buttonRow}>
          <PressableButton
            label="Clear"
            onPress={handleClear}
            variant="text"
            testID="signature-clear-button"
          />
          <PressableButton
            label="Save"
            onPress={handleExport}
            variant="filled"
            testID="signature-export-button"
          />
        </View>
      )}
    </View>
  );
}
