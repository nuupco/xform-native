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
import React from 'react';
import type { TextStyle, StyleProp } from 'react-native';
export interface MarkdownTextProps {
    value: string;
    baseStyle?: StyleProp<TextStyle>;
    testID?: string;
    numberOfLines?: number;
    ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}
export declare function MarkdownText({ value, baseStyle, testID, numberOfLines, ellipsizeMode, }: MarkdownTextProps): React.JSX.Element;
//# sourceMappingURL=MarkdownText.d.ts.map