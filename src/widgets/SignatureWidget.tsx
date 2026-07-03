/**
 * SignatureWidget — binary signature capture (REQ-M07..M10).
 *
 * Gated on react-native-svg (optional peer dep). Falls back to
 * UnsupportedWidget when the dep is absent at runtime.
 */
import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  PanResponder,
  StyleSheet,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import type { NodeRef, FormSessionStore } from '../index';
import { UnsupportedWidget } from './UnsupportedWidget';
import { tokens } from '../tokens/tokens';

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

export function SignatureWidget({ nodeRef, store }: SignatureWidgetProps) {
  const svg = getSvg();
  const nodeState = store.adapter.getNodeState(nodeRef);
  const readonly = nodeState.readonly;

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentPath = useRef<string[]>([]);

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
          { path: pathStr, color: '#000000', width: 2 },
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
          <Pressable
            onPress={handleClear}
            style={styles.button}
            testID="signature-clear-button"
          >
            <Text style={styles.buttonText}>Clear</Text>
          </Pressable>
          <Pressable
            onPress={handleExport}
            style={[styles.button, styles.exportButton]}
            testID="signature-export-button"
          >
            <Text style={styles.buttonText}>Save</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.sm },
  canvas: {
    height: 200,
    borderWidth: 1,
    borderColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
    backgroundColor: '#ffffff',
  },
  canvasReadonly: {
    height: 200,
    borderWidth: 1,
    borderColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
    backgroundColor: '#f0f0f0',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  button: {
    padding: tokens.spacing.sm,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
  },
  exportButton: {
    backgroundColor: tokens.color.primary,
  },
  buttonText: { color: tokens.color.text, fontSize: tokens.font.sm },
});
