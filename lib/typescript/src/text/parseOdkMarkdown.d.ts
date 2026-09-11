/**
 * ODK Markdown parser — Phase 8, PR1.
 *
 * Pure string → data transform. Zero React/React Native imports.
 *
 * Targets ODK Collect's documented "Form styling" markdown subset, NOT
 * CommonMark. Supported grammar:
 *
 * - Bold:        `**text**`
 * - Italic:      `_text_` (unconditional) and `*text*` (gated — see below)
 * - Bold+italic: nesting of the above, either order (`**_text_**`, `_**text**_`)
 * - Headers:     `# ` through `###### ` (levels 1-6) at block start,
 *                marker + following space stripped from the emitted text
 * - Line breaks: a single literal `\n` starts a new block (GFM-style — a
 *                blank line is NOT required to break a line)
 * - Inline span: `<span style="color:...">text</span>` — `color` passed
 *                through raw when it looks like a valid CSS color
 *                (`#RGB`/`#RGBA`/`#RRGGBB`/`#RRGGBBAA`, `rgb()`/`rgba()`,
 *                or a bare lowercase CSS named color); anything else drops
 *                the color silently. `font-size:Npx` is accepted and
 *                clamped to `[8, 48]`; `font-family` is recognized but
 *                ignored.
 * - Escapes:     `\*`, `\_`, `\#`, `\\` render literally, consuming the
 *                backslash.
 *
 * Explicitly EXCLUDED (emitted verbatim, never interpreted) because ODK
 * Collect itself does not render them (or, for links, this phase defers
 * them deliberately — see design decision 9): links `[text](url)`,
 * tables, code fences, blockquotes, lists, images, horizontal rules, raw
 * `<b>`/`<i>` tags.
 *
 * False-positive containment (design decision 5): `*`/`**` only trigger
 * formatting when the opening delimiter is followed by a non-space
 * character AND the matching closing delimiter is preceded by a
 * non-space character, both within the same block. Unmatched or
 * space-adjacent delimiters are emitted verbatim rather than silently
 * consumed — this is what keeps real-world strings like
 * "Costo * cantidad" or "Folio #" from being corrupted.
 */
export interface MarkdownSpan {
    text: string;
    bold?: boolean;
    italic?: boolean;
    color?: string;
    fontSize?: number;
}
export interface MarkdownBlock {
    headerLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    spans: MarkdownSpan[];
}
export declare function parseOdkMarkdown(raw: string): MarkdownBlock[];
export declare function stripOdkMarkdown(raw: string): string;
//# sourceMappingURL=parseOdkMarkdown.d.ts.map