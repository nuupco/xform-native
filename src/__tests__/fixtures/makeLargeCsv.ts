/**
 * Task 5: cheap runtime CSV generator for the 100k-row profiling case.
 *
 * Not a committed multi-MB file — generated in-memory at test time via a
 * plain string builder (no per-row templating overhead, no slow test
 * itself). Header row is `col0,col1,...,colN`; each data row repeats the
 * (rowIndex) value across every column so byte size stays predictable and
 * the content itself is irrelevant to the profiling assertions.
 */

export function makeLargeCsv(rows: number, cols: number): string {
  const header = Array.from({ length: cols }, (_, c) => `col${c}`).join(',');
  const lines = new Array<string>(rows);
  for (let r = 0; r < rows; r++) {
    const rowValues = new Array<string>(cols);
    for (let c = 0; c < cols; c++) {
      rowValues[c] = `r${r}c${c}`;
    }
    lines[r] = rowValues.join(',');
  }
  return `${header}\n${lines.join('\n')}\n`;
}
