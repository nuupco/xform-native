import { parseOdkMarkdown, stripOdkMarkdown, type MarkdownBlock } from '../text/parseOdkMarkdown';

describe('parseOdkMarkdown', () => {
  describe('passthrough / fast path', () => {
    it('returns a single block, single span, identical text for plain strings', () => {
      const input = 'Revisa el nivel de agua';
      expect(parseOdkMarkdown(input)).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: input }] },
      ]);
    });

    it('handles an empty string', () => {
      expect(parseOdkMarkdown('')).toEqual<MarkdownBlock[]>([{ headerLevel: 0, spans: [{ text: '' }] }]);
    });
  });

  describe('bold', () => {
    it('parses **bold**', () => {
      expect(parseOdkMarkdown('**bold**')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: 'bold', bold: true }] },
      ]);
    });

    it('parses bold in the middle of a sentence', () => {
      expect(parseOdkMarkdown('Revisa **el nivel** de agua')).toEqual<MarkdownBlock[]>([
        {
          headerLevel: 0,
          spans: [
            { text: 'Revisa ' },
            { text: 'el nivel', bold: true },
            { text: ' de agua' },
          ],
        },
      ]);
    });
  });

  describe('italic', () => {
    it('parses _italic_', () => {
      expect(parseOdkMarkdown('Revisa _el nivel_ de agua')).toEqual<MarkdownBlock[]>([
        {
          headerLevel: 0,
          spans: [
            { text: 'Revisa ' },
            { text: 'el nivel', italic: true },
            { text: ' de agua' },
          ],
        },
      ]);
    });

    it('parses *italic* (single asterisk, gated by adjacency)', () => {
      expect(parseOdkMarkdown('Revisa *el nivel* de agua')).toEqual<MarkdownBlock[]>([
        {
          headerLevel: 0,
          spans: [
            { text: 'Revisa ' },
            { text: 'el nivel', italic: true },
            { text: ' de agua' },
          ],
        },
      ]);
    });
  });

  describe('mixed and nested spans', () => {
    it('parses bold and italic together in one string', () => {
      expect(parseOdkMarkdown('Revisa **el nivel** de _agua_ hoy')).toEqual<MarkdownBlock[]>([
        {
          headerLevel: 0,
          spans: [
            { text: 'Revisa ' },
            { text: 'el nivel', bold: true },
            { text: ' de ' },
            { text: 'agua', italic: true },
            { text: ' hoy' },
          ],
        },
      ]);
    });

    it('parses **_texto_** as bold+italic on one span', () => {
      expect(parseOdkMarkdown('**_texto_**')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: 'texto', bold: true, italic: true }] },
      ]);
    });

    it('parses _**texto**_ as bold+italic on one span', () => {
      expect(parseOdkMarkdown('_**texto**_')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: 'texto', bold: true, italic: true }] },
      ]);
    });
  });

  describe('headers', () => {
    it.each([
      ['# H1', 1],
      ['## H2', 2],
      ['### H3', 3],
      ['#### H4', 4],
      ['##### H5', 5],
      ['###### H6', 6],
    ] as const)('parses %s as headerLevel %i, marker+space stripped', (line, level) => {
      const text = line.replace(/^#+ /, '');
      expect(parseOdkMarkdown(line)).toEqual<MarkdownBlock[]>([
        { headerLevel: level, spans: [{ text }] },
      ]);
    });

    it('treats a hash with no following space as literal', () => {
      expect(parseOdkMarkdown('#NoSpace')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: '#NoSpace' }] },
      ]);
    });

    it('treats a hash mid-line as literal', () => {
      expect(parseOdkMarkdown('Folio # 3')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: 'Folio # 3' }] },
      ]);
    });
  });

  describe('adjacency rule prevents false positives (regression suite)', () => {
    it.each([
      'Costo * cantidad',
      'Peso (kg) * 2',
      'Folio #',
      'Cuota #3',
      '3 * 4 * 5',
      '**bold',
    ])('parses %j verbatim with zero style flags', (input) => {
      expect(parseOdkMarkdown(input)).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: input }] },
      ]);
    });
  });

  describe('inline <span> color', () => {
    it.each([
      ['#FF0000', '#FF0000'],
      ['#F00', '#F00'],
      ['#FF0000AA', '#FF0000AA'],
      ['rgb(1,2,3)', 'rgb(1,2,3)'],
      ['red', 'red'],
    ])('accepts color:%s and passes it through raw', (raw, expected) => {
      expect(parseOdkMarkdown(`<span style="color:${raw}">rojo</span>`)).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: 'rojo', color: expected }] },
      ]);
    });

    it.each(['javascript:x', 'expression(...)', '', 'var(--x)'])(
      'drops invalid color %j, preserving text without throwing',
      (raw) => {
        expect(() => parseOdkMarkdown(`<span style="color:${raw}">texto</span>`)).not.toThrow();
        expect(parseOdkMarkdown(`<span style="color:${raw}">texto</span>`)).toEqual<MarkdownBlock[]>([
          { headerLevel: 0, spans: [{ text: 'texto' }] },
        ]);
      }
    );
  });

  describe('inline <span> font-size', () => {
    it('accepts a plain px value', () => {
      expect(parseOdkMarkdown('<span style="font-size:20px">grande</span>')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: 'grande', fontSize: 20 }] },
      ]);
    });

    it('clamps a too-small value to 8', () => {
      expect(parseOdkMarkdown('<span style="font-size:2px">chico</span>')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: 'chico', fontSize: 8 }] },
      ]);
    });

    it('clamps a too-large value to 48', () => {
      expect(parseOdkMarkdown('<span style="font-size:200px">enorme</span>')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: 'enorme', fontSize: 48 }] },
      ]);
    });

    it.each(['1.5em', 'large'])('ignores non-px unit %j', (value) => {
      expect(parseOdkMarkdown(`<span style="font-size:${value}">x</span>`)).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: 'x' }] },
      ]);
    });
  });

  describe('inline <span> font-family', () => {
    it('ignores font-family but still applies sibling declarations', () => {
      expect(
        parseOdkMarkdown('<span style="font-family:Arial;color:red">x</span>')
      ).toEqual<MarkdownBlock[]>([{ headerLevel: 0, spans: [{ text: 'x', color: 'red' }] }]);
    });
  });

  describe('span/emphasis nesting', () => {
    it('parses emphasis nested inside a span', () => {
      expect(parseOdkMarkdown('<span style="color:red">**x**</span>')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: 'x', bold: true, color: 'red' }] },
      ]);
    });

    it('parses a span nested inside emphasis', () => {
      expect(parseOdkMarkdown('**<span style="color:red">x</span>**')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: 'x', bold: true, color: 'red' }] },
      ]);
    });
  });

  describe('line breaks', () => {
    it('splits a single \\n into two blocks', () => {
      expect(parseOdkMarkdown('uno\ndos')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: 'uno' }] },
        { headerLevel: 0, spans: [{ text: 'dos' }] },
      ]);
    });

    it('produces an empty block between two \\n\\n', () => {
      expect(parseOdkMarkdown('uno\n\ndos')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: 'uno' }] },
        { headerLevel: 0, spans: [{ text: '' }] },
        { headerLevel: 0, spans: [{ text: 'dos' }] },
      ]);
    });

    it('supports a header on line 1 followed by body on line 2', () => {
      expect(parseOdkMarkdown('# Sección A\nsub-pregunta')).toEqual<MarkdownBlock[]>([
        { headerLevel: 1, spans: [{ text: 'Sección A' }] },
        { headerLevel: 0, spans: [{ text: 'sub-pregunta' }] },
      ]);
    });
  });

  describe('escapes', () => {
    it('renders \\* literally, consuming the backslash', () => {
      expect(parseOdkMarkdown('\\*not italic\\*')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: '*not italic*' }] },
      ]);
    });

    it('renders \\# literally, consuming the backslash', () => {
      expect(parseOdkMarkdown('\\#not header')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: '#not header' }] },
      ]);
    });

    it('renders \\\\ as a single literal backslash', () => {
      expect(parseOdkMarkdown('a\\\\b')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: 'a\\b' }] },
      ]);
    });
  });

  describe('links and excluded syntax (rendered verbatim)', () => {
    it('does not parse [text](url) as a link', () => {
      const input = '[texto](https://example.com)';
      expect(parseOdkMarkdown(input)).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: input }] },
      ]);
    });

    it.each([
      '|a|b|',
      '```code```',
      '> quote',
      '- item',
      '<b>x</b>',
    ])('renders excluded syntax %j verbatim', (input) => {
      expect(parseOdkMarkdown(input)).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: input }] },
      ]);
    });
  });

  describe('degenerate inputs', () => {
    it('handles an empty string without throwing', () => {
      expect(() => parseOdkMarkdown('')).not.toThrow();
    });

    it('handles a lone newline', () => {
      expect(parseOdkMarkdown('\n')).toEqual<MarkdownBlock[]>([
        { headerLevel: 0, spans: [{ text: '' }] },
        { headerLevel: 0, spans: [{ text: '' }] },
      ]);
    });

    it('handles a string of only delimiters without throwing', () => {
      expect(() => parseOdkMarkdown('****')).not.toThrow();
      const result = parseOdkMarkdown('****');
      expect(result).toHaveLength(1);
      expect(result[0]!.headerLevel).toBe(0);
    });

    it('handles a 10k-char label without throwing or hanging', () => {
      const big = 'a'.repeat(10000) + ' * ' + 'b'.repeat(10000);
      const start = Date.now();
      expect(() => parseOdkMarkdown(big)).not.toThrow();
      expect(Date.now() - start).toBeLessThan(2000);
    });
  });
});

describe('stripOdkMarkdown', () => {
  it('strips bold markers', () => {
    expect(stripOdkMarkdown('Revisa **el nivel** de agua')).toBe('Revisa el nivel de agua');
  });

  it('strips italic markers (underscore and asterisk)', () => {
    expect(stripOdkMarkdown('Revisa _el nivel_ de agua')).toBe('Revisa el nivel de agua');
    expect(stripOdkMarkdown('Revisa *el nivel* de agua')).toBe('Revisa el nivel de agua');
  });

  it('drops header markers', () => {
    expect(stripOdkMarkdown('# Sección A')).toBe('Sección A');
  });

  it('keeps span text, drops the tag', () => {
    expect(stripOdkMarkdown('<span style="color:red">rojo</span>')).toBe('rojo');
  });

  it('returns a passthrough string identical to the input', () => {
    const input = 'Revisa el nivel de agua';
    expect(stripOdkMarkdown(input)).toBe(input);
  });

  it('joins multi-line input with newlines preserved', () => {
    expect(stripOdkMarkdown('**uno**\ndos')).toBe('uno\ndos');
  });
});
