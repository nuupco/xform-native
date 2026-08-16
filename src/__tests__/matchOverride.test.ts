/**
 * T1: matchScore(matcher, args) specificity table (D4).
 *
 * Specificity: controlType=4, dataType=2, appearance=1. Higher score wins.
 * Ties -> last registered wins (verified via pickBest in this same file).
 */

import { matchScore, pickBest } from '../widgets/matchOverride';

describe('matchScore', () => {
  const args = { controlType: 'select1' as const, dataType: 'string' as const, appearance: 'rank' };

  it('scores an empty matcher as 0 (matches anything)', () => {
    expect(matchScore({}, args)).toBe(0);
  });

  it('scores controlType-only match as 4', () => {
    expect(matchScore({ controlType: 'select1' }, args)).toBe(4);
  });

  it('scores dataType-only match as 2', () => {
    expect(matchScore({ dataType: 'string' }, args)).toBe(2);
  });

  it('scores appearance-only match as 1', () => {
    expect(matchScore({ appearance: 'rank' }, args)).toBe(1);
  });

  it('scores controlType+dataType match as 6', () => {
    expect(matchScore({ controlType: 'select1', dataType: 'string' }, args)).toBe(6);
  });

  it('scores full exact tuple match as 7', () => {
    expect(
      matchScore({ controlType: 'select1', dataType: 'string', appearance: 'rank' }, args)
    ).toBe(7);
  });

  it('returns null when controlType mismatches', () => {
    expect(matchScore({ controlType: 'select' }, args)).toBeNull();
  });

  it('returns null when dataType mismatches', () => {
    expect(matchScore({ dataType: 'int' }, args)).toBeNull();
  });

  it('returns null when appearance token is absent', () => {
    expect(matchScore({ appearance: 'minimal' }, args)).toBeNull();
  });

  it('matches appearance case-insensitively among whitespace-separated tokens', () => {
    expect(matchScore({ appearance: 'RANK' }, { ...args, appearance: 'foo rank bar' })).toBe(1);
  });

  it('returns null appearance match when candidate appearance is null', () => {
    expect(matchScore({ appearance: 'rank' }, { ...args, appearance: null })).toBeNull();
  });
});

describe('pickBest', () => {
  const args = { controlType: 'select1' as const, dataType: 'string' as const, appearance: 'rank' };

  it('returns null when list is empty', () => {
    expect(pickBest([], args)).toBeNull();
  });

  it('returns null when no entry matches', () => {
    const list = [{ match: { controlType: 'select' as const } }];
    expect(pickBest(list, args)).toBeNull();
  });

  it('picks the highest-scoring entry', () => {
    const low = { match: { appearance: 'rank' }, id: 'low' };
    const high = { match: { controlType: 'select1' as const, dataType: 'string' as const, appearance: 'rank' }, id: 'high' };
    expect(pickBest([low, high], args)).toBe(high);
    expect(pickBest([high, low], args)).toBe(high);
  });

  it('ties go to the last registered entry', () => {
    const first = { match: { controlType: 'select1' as const }, id: 'first' };
    const second = { match: { controlType: 'select1' as const }, id: 'second' };
    expect(pickBest([first, second], args)).toBe(second);
  });
});
