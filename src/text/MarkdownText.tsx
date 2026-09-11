/**
 * MarkdownText — ODK markdown renderer, Phase 8 PR2.
 *
 * Renders a raw author-supplied XForm label/hint string as a single
 * outer `<Text>` carrying `testID`/`baseStyle`/`numberOfLines`/
 * `ellipsizeMode`, with nested `<Text>` children per parsed span when the
 * string contains markdown metacharacters.
 *
 * Fast path (design decision 4 — load-bearing): when the input has no
 * markdown metacharacter, `parseOdkMarkdown` itself returns a single
 * span/single block shape, and this component renders `{value}` as the
 * DIRECT STRING CHILD of the outer `<Text>` — byte-identical to the JSX
 * every existing raw-label site already ships today. This is deliberately
 * NOT implemented by only checking span/block counts on the parsed
 * output — see the anti-false-pass gate tests in MarkdownText.test.tsx.
 */
import React, { useMemo } from 'react';
import { Text } from 'react-native';
import type { TextStyle, StyleProp } from 'react-native';
import { parseOdkMarkdown } from './parseOdkMarkdown';
import type { MarkdownBlock, MarkdownSpan } from './parseOdkMarkdown';
import { typography } from '../tokens/typography';

export interface MarkdownTextProps {
  value: string;
  baseStyle?: StyleProp<TextStyle>;
  testID?: string;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

// Header level (1-6) -> typography role, per design decision 6.
const HEADER_TYPOGRAPHY_ROLE = {
  1: typography.headlineLarge,
  2: typography.headlineSmall,
  3: typography.titleLarge,
  4: typography.titleMedium,
  5: typography.titleSmall,
  6: typography.labelMedium,
} as const;

function headerStyle(level: 1 | 2 | 3 | 4 | 5 | 6): TextStyle {
  const role = HEADER_TYPOGRAPHY_ROLE[level];
  return {
    fontSize: role.fontSize,
    lineHeight: role.lineHeight,
    fontWeight: String(role.fontWeight) as TextStyle['fontWeight'],
    fontFamily: role.fontFamily,
  };
}

function spanStyle(span: MarkdownSpan): TextStyle | undefined {
  const style: Record<string, unknown> = {};
  if (span.bold) style.fontWeight = '700';
  if (span.italic) style.fontStyle = 'italic';
  if (span.color !== undefined) style.color = span.color;
  if (span.fontSize !== undefined) style.fontSize = span.fontSize;
  return Object.keys(style).length > 0 ? (style as TextStyle) : undefined;
}

function isFastPath(blocks: MarkdownBlock[]): blocks is [{ headerLevel: 0; spans: [{ text: string }] }] {
  if (blocks.length !== 1) return false;
  const block = blocks[0]!;
  if (block.headerLevel !== 0) return false;
  if (block.spans.length !== 1) return false;
  const span = block.spans[0]!;
  return (
    span.bold === undefined &&
    span.italic === undefined &&
    span.color === undefined &&
    span.fontSize === undefined
  );
}

function renderBlock(block: MarkdownBlock, blockIndex: number): React.ReactNode {
  const spanNodes = block.spans.map((span, spanIndex) => (
    <Text key={spanIndex} style={spanStyle(span)}>
      {span.text}
    </Text>
  ));

  if (block.headerLevel > 0) {
    return (
      <Text key={blockIndex} style={headerStyle(block.headerLevel as 1 | 2 | 3 | 4 | 5 | 6)}>
        {spanNodes}
      </Text>
    );
  }

  return <React.Fragment key={blockIndex}>{spanNodes}</React.Fragment>;
}

export function MarkdownText({
  value,
  baseStyle,
  testID,
  numberOfLines,
  ellipsizeMode,
}: MarkdownTextProps): React.JSX.Element {
  const blocks = useMemo(() => parseOdkMarkdown(value), [value]);

  if (isFastPath(blocks)) {
    return (
      <Text testID={testID} style={baseStyle} numberOfLines={numberOfLines} ellipsizeMode={ellipsizeMode}>
        {value}
      </Text>
    );
  }

  const children: React.ReactNode[] = [];
  blocks.forEach((block, index) => {
    if (index > 0) children.push('\n');
    children.push(renderBlock(block, index));
  });

  return (
    <Text testID={testID} style={baseStyle} numberOfLines={numberOfLines} ellipsizeMode={ellipsizeMode}>
      {children}
    </Text>
  );
}
