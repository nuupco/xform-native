/**
 * T-10b: pickWidget PR-3b dispatch (ADR-5).
 *
 * Verifies that after PR-3b wiring, select/date/time/dateTime/range all
 * dispatch to their dedicated widgets instead of UnsupportedWidget.
 */

import { pickWidget } from '../widgets/pickWidget';
import { SelectOneWidget } from '../widgets/SelectOneWidget';
import { SelectMultiWidget } from '../widgets/SelectMultiWidget';
import { DateWidget } from '../widgets/DateWidget';
import { TimeWidget } from '../widgets/TimeWidget';
import { DateTimeWidget } from '../widgets/DateTimeWidget';
import { RangeWidget } from '../widgets/RangeWidget';

describe('pickWidget — PR-3b wired types', () => {
  it('dispatches selectOne → SelectOneWidget', () => {
    const { Widget, variant } = pickWidget('selectOne', 'select1', null);
    expect(Widget).toBe(SelectOneWidget);
    expect(variant).toBe('default');
  });

  it('dispatches selectOne minimal → SelectOneWidget minimal', () => {
    const { Widget, variant } = pickWidget('selectOne', 'select1', 'minimal');
    expect(Widget).toBe(SelectOneWidget);
    expect(variant).toBe('minimal');
  });

  it('dispatches selectMulti → SelectMultiWidget', () => {
    const { Widget, variant } = pickWidget('selectMulti', 'select', null);
    expect(Widget).toBe(SelectMultiWidget);
    expect(variant).toBe('default');
  });

  it('dispatches date → DateWidget', () => {
    const { Widget, variant } = pickWidget('date', 'input', null);
    expect(Widget).toBe(DateWidget);
    expect(variant).toBe('default');
  });

  it('dispatches date month-year → DateWidget month-year', () => {
    const { Widget, variant } = pickWidget('date', 'input', 'month-year');
    expect(Widget).toBe(DateWidget);
    expect(variant).toBe('month-year');
  });

  it('dispatches time → TimeWidget', () => {
    const { Widget, variant } = pickWidget('time', 'input', null);
    expect(Widget).toBe(TimeWidget);
    expect(variant).toBe('default');
  });

  it('dispatches dateTime → DateTimeWidget', () => {
    const { Widget, variant } = pickWidget('dateTime', 'input', null);
    expect(Widget).toBe(DateTimeWidget);
    expect(variant).toBe('default');
  });

  it('dispatches controlType=range → RangeWidget', () => {
    const { Widget, variant } = pickWidget('int', 'range', null);
    expect(Widget).toBe(RangeWidget);
    expect(variant).toBe('default');
  });

  it('dispatches controlType=range picker → RangeWidget picker', () => {
    const { Widget, variant } = pickWidget('int', 'range', 'picker');
    expect(Widget).toBe(RangeWidget);
    expect(variant).toBe('picker');
  });
});
