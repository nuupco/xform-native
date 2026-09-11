"use strict";

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

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 48;

// Fast-path detector — any of these characters means the string might
// carry markdown (or needs block-splitting on `\n`) and must go through
// the full tokenizer.
const HAS_METACHARACTER = /[*_#\\\n]|<span/;
function isValidColor(value) {
  const v = value.trim();
  if (v.length === 0) return false;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return true;
  if (/^#[0-9a-fA-F]{4}$/.test(v)) return true;
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return true;
  if (/^#[0-9a-fA-F]{8}$/.test(v)) return true;
  if (/^rgba?\([^()]*\)$/.test(v)) return true;
  if (/^[a-z]+$/.test(v)) return true;
  return false;
}
function parseSpanStyle(styleAttr) {
  const result = {};
  const declarations = styleAttr.split(';');
  for (const raw of declarations) {
    const decl = raw.trim();
    if (decl.length === 0) continue;
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = decl.slice(0, colonIdx).trim().toLowerCase();
    const value = decl.slice(colonIdx + 1).trim();
    if (prop === 'color') {
      if (isValidColor(value)) {
        result.color = value;
      }
    } else if (prop === 'font-size') {
      const match = /^(\d+(?:\.\d+)?)px$/.exec(value);
      if (match) {
        const n = Math.round(parseFloat(match[1]));
        result.fontSize = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, n));
      }
      // non-px units (em, %, keywords) are ignored per design decision 7
    }
    // font-family intentionally ignored per design decision 7
  }
  return result;
}

// A single token produced by the low-level lexer, before span-merging.

const SPAN_OPEN_RE = /^<span\s+style="([^"]*)"\s*>/i;
const SPAN_CLOSE_RE = /^<\/span>/i;
function isSpace(ch) {
  return ch === undefined || /\s/.test(ch);
}

/**
 * Lex a single block (no `\n`) into a flat run of segments, resolving
 * bold/italic delimiters and `<span>` tags with the non-space-adjacency
 * rule and leaving unmatched delimiters as literal text.
 */
function lexBlockToSpans(input) {
  // Step 1: scan into raw tokens (delimiters recognized structurally,
  // matching resolved via a stack so unmatched ones fall back to text).
  const n = input.length;
  const tokens = [];
  let i = 0;
  let textBuf = '';
  const flushText = () => {
    if (textBuf.length > 0) {
      tokens.push({
        kind: 'text',
        text: textBuf
      });
      textBuf = '';
    }
  };
  while (i < n) {
    const ch = input[i];

    // Escapes
    if (ch === '\\') {
      const next = input[i + 1];
      if (next === '*' || next === '_' || next === '#' || next === '\\') {
        textBuf += next;
        i += 2;
        continue;
      }
      textBuf += ch;
      i += 1;
      continue;
    }

    // <span ...> / </span>
    if (ch === '<') {
      const rest = input.slice(i);
      const openMatch = SPAN_OPEN_RE.exec(rest);
      if (openMatch) {
        flushText();
        const style = parseSpanStyle(openMatch[1]);
        tokens.push({
          kind: 'span-open',
          color: style.color,
          fontSize: style.fontSize
        });
        i += openMatch[0].length;
        continue;
      }
      const closeMatch = SPAN_CLOSE_RE.exec(rest);
      if (closeMatch) {
        flushText();
        tokens.push({
          kind: 'span-close'
        });
        i += closeMatch[0].length;
        continue;
      }
      textBuf += ch;
      i += 1;
      continue;
    }

    // Bold: **
    if (ch === '*' && input[i + 1] === '*') {
      const prev = i > 0 ? input[i - 1] : undefined;
      const after = input[i + 2];
      // Try as opener: not space-adjacent on inner side (after)
      if (!isSpace(after)) {
        // look ahead for a matching closer with non-space-adjacent inner side
        const closeIdx = findClosingBold(input, i + 2);
        if (closeIdx !== -1) {
          flushText();
          tokens.push({
            kind: 'bold-open'
          });
          i += 2;
          continue;
        }
      }
      // Try as closer: not space-adjacent on inner side (prev)
      if (!isSpace(prev)) {
        // only valid as closer if there is an unmatched bold-open before it
        if (hasUnmatchedOpen(tokens, 'bold-open', 'bold-close')) {
          flushText();
          tokens.push({
            kind: 'bold-close'
          });
          i += 2;
          continue;
        }
      }
      textBuf += '**';
      i += 2;
      continue;
    }

    // Italic: _
    if (ch === '_') {
      const prev = i > 0 ? input[i - 1] : undefined;
      const after = input[i + 1];
      if (!isSpace(after)) {
        const closeIdx = findClosingUnderscore(input, i + 1);
        if (closeIdx !== -1) {
          flushText();
          tokens.push({
            kind: 'italic-open'
          });
          i += 1;
          continue;
        }
      }
      if (!isSpace(prev)) {
        if (hasUnmatchedOpen(tokens, 'italic-open', 'italic-close')) {
          flushText();
          tokens.push({
            kind: 'italic-close'
          });
          i += 1;
          continue;
        }
      }
      textBuf += '_';
      i += 1;
      continue;
    }

    // Italic: single * (gated same as bold but single-char, lower priority
    // than ** which is already checked above)
    if (ch === '*') {
      const prev = i > 0 ? input[i - 1] : undefined;
      const after = input[i + 1];
      if (!isSpace(after)) {
        const closeIdx = findClosingSingleStar(input, i + 1);
        if (closeIdx !== -1) {
          flushText();
          tokens.push({
            kind: 'italic-open'
          });
          i += 1;
          continue;
        }
      }
      if (!isSpace(prev)) {
        if (hasUnmatchedOpen(tokens, 'italic-open', 'italic-close')) {
          flushText();
          tokens.push({
            kind: 'italic-close'
          });
          i += 1;
          continue;
        }
      }
      textBuf += '*';
      i += 1;
      continue;
    }

    // Header markers are handled at the block level (see parseOdkMarkdown),
    // so a bare `#` here is just literal text mid-block.
    textBuf += ch;
    i += 1;
  }
  flushText();
  return tokensToSpans(tokens);
}
function hasUnmatchedOpen(tokens, openKind, closeKind) {
  let depth = 0;
  for (const t of tokens) {
    if (t.kind === openKind) depth += 1;else if (t.kind === closeKind) depth -= 1;
  }
  return depth > 0;
}

// Find index (relative full-string index) of a `**` after `from` whose
// preceding char (inner side) is non-space. Returns -1 if none found in
// this block. Skips over escaped `\*\*` sequences.
function findClosingBold(input, from) {
  for (let j = from; j < input.length - 1; j++) {
    if (input[j] === '\\') {
      j += 1;
      continue;
    }
    if (input[j] === '*' && input[j + 1] === '*') {
      const prev = input[j - 1];
      if (!isSpace(prev)) return j;
    }
  }
  return -1;
}
function findClosingUnderscore(input, from) {
  for (let j = from; j < input.length; j++) {
    if (input[j] === '\\') {
      j += 1;
      continue;
    }
    if (input[j] === '_') {
      const prev = input[j - 1];
      if (!isSpace(prev)) return j;
    }
  }
  return -1;
}
function findClosingSingleStar(input, from) {
  for (let j = from; j < input.length; j++) {
    if (input[j] === '\\') {
      j += 1;
      continue;
    }
    if (input[j] === '*' && input[j + 1] !== '*' && input[j - 1] !== '*') {
      const prev = input[j - 1];
      if (!isSpace(prev)) return j;
    }
  }
  return -1;
}
function tokensToSpans(tokens) {
  const spans = [];
  let bold = 0;
  let italic = 0;
  let color;
  let fontSize;
  const spanStack = [];
  const push = text => {
    if (text.length === 0) return;
    const span = {
      text
    };
    if (bold > 0) span.bold = true;
    if (italic > 0) span.italic = true;
    if (color !== undefined) span.color = color;
    if (fontSize !== undefined) span.fontSize = fontSize;
    spans.push(span);
  };
  for (const t of tokens) {
    switch (t.kind) {
      case 'text':
        push(t.text);
        break;
      case 'bold-open':
        bold += 1;
        break;
      case 'bold-close':
        bold = Math.max(0, bold - 1);
        break;
      case 'italic-open':
        italic += 1;
        break;
      case 'italic-close':
        italic = Math.max(0, italic - 1);
        break;
      case 'span-open':
        spanStack.push({
          color,
          fontSize
        });
        if (t.color !== undefined) color = t.color;
        if (t.fontSize !== undefined) fontSize = t.fontSize;
        break;
      case 'span-close':
        {
          const prevState = spanStack.pop();
          color = prevState?.color;
          fontSize = prevState?.fontSize;
          break;
        }
      default:
        break;
    }
  }
  return spans;
}
function parseHeaderLevel(line) {
  const match = /^(#{1,6}) (.*)$/.exec(line);
  if (match) {
    const level = match[1].length;
    return {
      level,
      rest: match[2]
    };
  }
  return {
    level: 0,
    rest: line
  };
}
export function parseOdkMarkdown(raw) {
  if (!HAS_METACHARACTER.test(raw)) {
    return [{
      headerLevel: 0,
      spans: [{
        text: raw
      }]
    }];
  }
  const lines = raw.split('\n');
  return lines.map(line => {
    const {
      level,
      rest
    } = parseHeaderLevel(line);
    const spans = lexBlockToSpans(rest);
    return {
      headerLevel: level,
      spans: spans.length > 0 ? spans : [{
        text: ''
      }]
    };
  });
}
export function stripOdkMarkdown(raw) {
  if (!HAS_METACHARACTER.test(raw)) {
    return raw;
  }
  const blocks = parseOdkMarkdown(raw);
  return blocks.map(block => block.spans.map(span => span.text).join('')).join('\n');
}
//# sourceMappingURL=parseOdkMarkdown.js.map