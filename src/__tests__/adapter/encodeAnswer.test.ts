/**
 * encodeAnswer.test.ts — unit tests for the shared widget-primitive -> AnswerValue
 * encode helper (REQ-1.3, ADR-D-A3). Covers toRawString normalization and the
 * ''-> null empty rule for every DataType touched by widgets in scope.
 */

import { toRawString, encodeAnswer } from '../../adapter/encodeAnswer';

describe('toRawString', () => {
  it('returns null as-is for null/undefined', () => {
    expect(toRawString('string', null)).toBeNull();
    expect(toRawString('string', undefined)).toBeNull();
  });

  it('passes strings through unchanged', () => {
    expect(toRawString('string', 'hello')).toBe('hello');
  });

  it('stringifies numbers', () => {
    expect(toRawString('int', 42)).toBe('42');
    expect(toRawString('decimal', 3.5)).toBe('3.5');
  });

  it('maps booleans to 1/0', () => {
    expect(toRawString('boolean', true)).toBe('1');
    expect(toRawString('boolean', false)).toBe('0');
  });

  it('formats Date for date dataType as YYYY-MM-DD', () => {
    const d = new Date('2024-03-15T10:30:00.000Z');
    expect(toRawString('date', d)).toBe('2024-03-15');
  });

  it('formats Date for time dataType using LOCAL getters + the device current UTC offset (not always Z)', () => {
    // Local components, not UTC — this is the wall-clock time the user entered.
    const d = new Date(2024, 2, 15, 10, 30, 0, 0);
    const offsetMinutes = -d.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMinutes);
    const oh = String(Math.floor(abs / 60)).padStart(2, '0');
    const om = String(abs % 60).padStart(2, '0');
    const expectedOffset = `${sign}${oh}:${om}`;
    expect(toRawString('time', d)).toBe(`10:30:00.000${expectedOffset}`);
  });

  it('formats Date for dateTime dataType as full ISO string', () => {
    const d = new Date('2024-03-15T10:30:00.000Z');
    expect(toRawString('dateTime', d)).toBe('2024-03-15T10:30:00.000Z');
  });

  it('joins string[] (selectMulti) with a space', () => {
    expect(toRawString('selectMulti', ['a', 'b', 'c'])).toBe('a b c');
  });
});

describe('encodeAnswer', () => {
  it('returns null for null/undefined primitive', () => {
    expect(encodeAnswer('string', null)).toBeNull();
    expect(encodeAnswer('string', undefined)).toBeNull();
  });

  it('encodes a non-empty string to an AnswerValue', () => {
    const result = encodeAnswer('string', 'hello');
    expect(result).not.toBeNull();
    expect(result?.kind).toBe('string');
    expect(result?.value).toBe('hello');
    expect(typeof result?.displayText).toBe('string');
  });

  it('encodes empty string to null (not an AnswerValue wrapping "")', () => {
    expect(encodeAnswer('string', '')).toBeNull();
  });

  it('encodes a number to an AnswerValue with numeric kind', () => {
    const result = encodeAnswer('int', 42);
    expect(result).not.toBeNull();
    expect(result?.kind).toBe('int');
    expect(result?.value).toBe(42);
  });

  it('encodes a boolean to an AnswerValue', () => {
    const result = encodeAnswer('boolean', true);
    expect(result).not.toBeNull();
    expect(result?.kind).toBe('boolean');
    expect(result?.value).toBe(true);
  });

  it('encodes a Date for dateTime dataType to an AnswerValue', () => {
    const d = new Date('2024-03-15T10:30:00.000Z');
    const result = encodeAnswer('dateTime', d);
    expect(result).not.toBeNull();
    expect(result?.kind).toBe('dateTime');
  });

  it('encodes a string[] (selectMulti) to an AnswerValue', () => {
    const result = encodeAnswer('selectMulti', ['a', 'b']);
    expect(result).not.toBeNull();
    expect(result?.kind).toBe('selectMulti');
  });
});
