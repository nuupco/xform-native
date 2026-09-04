/**
 * calendars.ts — Gregorian ↔ alternate-calendar conversions for DateWidget's
 * `buddhist`, `coptic`, `ethiopian`, `islamic`, `persian` appearances.
 *
 * ODK Collect's own pickers for these appearances (EthiopianDatePickerDialog,
 * CopticDatePickerDialog, IslamicDatePickerDialog, PersianDatePickerDialog,
 * BuddhistDatePickerDialog under collect_app/.../widgets/datetime/pickers/)
 * are DISPLAY/EDIT-ONLY: the underlying `<bind type="date">` value stays a
 * Gregorian date, converted to the alternate calendar via joda-time
 * chronologies (CopticChronology, EthiopicChronology, IslamicChronology,
 * BuddhistChronology) and, for Persian, the Khayyam-Borkowski algorithm from
 * `com.github.mohamadian:persianjodatime`. Every function below is a direct
 * transcription of that exact arithmetic (not an independent re-derivation),
 * verified by round-tripping and against public anchor dates (Nowruz 2023/2024,
 * Ethiopian New Year 2023-09-12 → 2016-01-01, matching the documented "Sept 12
 * in the year before a Gregorian leap year" rule).
 *
 * bikram-sambat and myanmar are NOT here — ODK Collect delegates those to
 * external compiled libraries (a proprietary `bikram-sambat-*.jar` with no
 * published source, and `mmcalendar`'s watat/leap-month astronomical rules)
 * that can't be transcribed with the same confidence, so they stay a
 * documented gap (see KNOWN_APPEARANCE_GAPS).
 */

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const MS_PER_DAY = 86400000;

function dateToEpochDay(d: Date): number {
  return Math.floor(d.getTime() / MS_PER_DAY);
}

function epochDayToDate(epochDay: number): Date {
  return new Date(epochDay * MS_PER_DAY);
}

// ---------------------------------------------------------------------------
// Buddhist — joda-time BuddhistChronology: Gregorian year + 543, same
// month/day/leap structure (Thai civil calendar).
// ---------------------------------------------------------------------------

const BUDDHIST_OFFSET = 543;

export function gregorianToBuddhist(d: Date): CalendarDate {
  return { year: d.getUTCFullYear() + BUDDHIST_OFFSET, month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function buddhistToGregorian(year: number, month: number, day: number): Date | null {
  const gYear = year - BUDDHIST_OFFSET;
  const d = new Date(Date.UTC(gYear, month - 1, day));
  if (d.getUTCFullYear() !== gYear || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return d;
}

// ---------------------------------------------------------------------------
// Coptic / Ethiopian — joda-time BasicFixedMonthChronology: 12 months of 30
// days + a 13th month of 5 (or 6, leap) epagomenal days. Leap rule: year % 4
// === 3. The two calendars share this shape and only differ in epoch pivot
// (Coptic era begins 284 CE, Ethiopian 8 CE — 276 years apart), per
// CopticChronology/EthiopicChronology.calculateFirstDayOfYearMillis.
// ---------------------------------------------------------------------------

const COPTIC_PIVOT_YEAR = 1687; // Coptic year whose day 1 lands nearest the Unix epoch
const ETHIOPIAN_PIVOT_YEAR = 1963; // same, for Ethiopian (276 years after Coptic's)
const FIXED13_EPOCH_DAY_OFFSET = 365 - 112;

function isLeapFixed13(year: number): boolean {
  return ((year % 4) + 4) % 4 === 3;
}

function firstDayOfYearFixed13(year: number, pivotYear: number): number {
  const relativeYear = year - pivotYear;
  const leapYears =
    relativeYear <= 0
      ? Math.floor((relativeYear + 3) / 4)
      : Math.floor(relativeYear / 4) + (isLeapFixed13(year) ? 0 : 1);
  return relativeYear * 365 + leapYears + FIXED13_EPOCH_DAY_OFFSET;
}

function daysInMonthFixed13(year: number, month: number): number {
  return month !== 13 ? 30 : isLeapFixed13(year) ? 6 : 5;
}

function gregorianToFixed13(d: Date, pivotYear: number): CalendarDate {
  const epochDay = dateToEpochDay(d);
  let year = pivotYear + Math.round((epochDay - FIXED13_EPOCH_DAY_OFFSET) / 365.25);
  while (firstDayOfYearFixed13(year + 1, pivotYear) <= epochDay) year++;
  while (firstDayOfYearFixed13(year, pivotYear) > epochDay) year--;
  const dayOfYear = epochDay - firstDayOfYearFixed13(year, pivotYear) + 1;
  const month = Math.min(13, Math.floor((dayOfYear - 1) / 30) + 1);
  const day = dayOfYear - (month - 1) * 30;
  return { year, month, day };
}

function fixed13ToGregorian(year: number, month: number, day: number, pivotYear: number): Date | null {
  if (month < 1 || month > 13) return null;
  if (day < 1 || day > daysInMonthFixed13(year, month)) return null;
  const epochDay = firstDayOfYearFixed13(year, pivotYear) + (month - 1) * 30 + (day - 1);
  return epochDayToDate(epochDay);
}

export function gregorianToCoptic(d: Date): CalendarDate {
  return gregorianToFixed13(d, COPTIC_PIVOT_YEAR);
}

export function copticToGregorian(year: number, month: number, day: number): Date | null {
  return fixed13ToGregorian(year, month, day, COPTIC_PIVOT_YEAR);
}

export function gregorianToEthiopian(d: Date): CalendarDate {
  return gregorianToFixed13(d, ETHIOPIAN_PIVOT_YEAR);
}

export function ethiopianToGregorian(year: number, month: number, day: number): Date | null {
  return fixed13ToGregorian(year, month, day, ETHIOPIAN_PIVOT_YEAR);
}

// ---------------------------------------------------------------------------
// Islamic — joda-time IslamicChronology, LEAP_YEAR_16_BASED pattern (the
// default `IslamicChronology.getInstance()` ODK Collect uses): tabular civil
// calendar, 30-year cycle of 19 short (354-day) + 11 long (355-day) years,
// leap years at cycle positions {2,5,7,10,13,16,18,21,24,26,29} (decoded from
// the pattern bitmask 623191204). Months alternate 30/29 days; month 12 is 30
// days in a leap year, else 29.
// ---------------------------------------------------------------------------

const ISLAMIC_EPOCH_DAY = -492148; // epoch day of 1 Muharram, AH 1
const ISLAMIC_CYCLE_YEARS = 30;
const ISLAMIC_CYCLE_DAYS = 10631; // 19*354 + 11*355
const ISLAMIC_LEAP_RESIDUES = new Set([2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29]);

function islamicIsLeapYear(year: number): boolean {
  return ISLAMIC_LEAP_RESIDUES.has(((year % ISLAMIC_CYCLE_YEARS) + ISLAMIC_CYCLE_YEARS) % ISLAMIC_CYCLE_YEARS);
}

function islamicFirstDayOfYear(year: number): number {
  const y = year - 1;
  const cycle = Math.floor(y / ISLAMIC_CYCLE_YEARS);
  let days = ISLAMIC_EPOCH_DAY + cycle * ISLAMIC_CYCLE_DAYS;
  const cycleRemainder = (y % ISLAMIC_CYCLE_YEARS) + 1;
  for (let i = 1; i < cycleRemainder; i++) days += islamicIsLeapYear(i) ? 355 : 354;
  return days;
}

function islamicMonthLength(year: number, month: number): number {
  if (month === 12) return islamicIsLeapYear(year) ? 30 : 29;
  return month % 2 === 1 ? 30 : 29;
}

export function gregorianToIslamic(d: Date): CalendarDate {
  const epochDay = dateToEpochDay(d);
  let year = Math.round((epochDay - ISLAMIC_EPOCH_DAY) / 354.36667) + 1;
  while (islamicFirstDayOfYear(year + 1) <= epochDay) year++;
  while (islamicFirstDayOfYear(year) > epochDay) year--;
  let dayOfYear = epochDay - islamicFirstDayOfYear(year) + 1;
  let month = 1;
  while (dayOfYear > islamicMonthLength(year, month)) {
    dayOfYear -= islamicMonthLength(year, month);
    month++;
  }
  return { year, month, day: dayOfYear };
}

export function islamicToGregorian(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > islamicMonthLength(year, month)) return null;
  let epochDay = islamicFirstDayOfYear(year);
  for (let m = 1; m < month; m++) epochDay += islamicMonthLength(year, m);
  epochDay += day - 1;
  return epochDayToDate(epochDay);
}

// ---------------------------------------------------------------------------
// Persian — Khayyam-Borkowski algorithm (Kazimierz M. Borkowski, "The Persian
// calendar for 3000 years"), as implemented by
// PersianChronologyKhayyamBorkowski in com.github.mohamadian:persianjodatime
// (the library ODK Collect depends on for its `persian` appearance). Months
// 1-6 are 31 days, 7-11 are 30 days, month 12 is 29 (30 in a leap year).
// ---------------------------------------------------------------------------

const PERSIAN_BREAK_YEARS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
  2456, 3178,
];

function persianBreakYearCalc(
  persianYear: number,
  calcJalaaliLeaps: boolean,
): { jump: number; diff: number; jalaaliLeaps: number } {
  let jalaaliLeaps = -14;
  let jump = 0;
  let breakYear = PERSIAN_BREAK_YEARS[0]!;
  for (let i = 1; i < PERSIAN_BREAK_YEARS.length; i++) {
    const nextBreakYear = PERSIAN_BREAK_YEARS[i]!;
    jump = nextBreakYear - breakYear;
    if (!(persianYear < nextBreakYear)) {
      if (calcJalaaliLeaps) {
        jalaaliLeaps = jalaaliLeaps + Math.trunc(jump / 33) * 8 + Math.trunc((jump % 33) / 4);
      }
      breakYear = nextBreakYear;
    } else {
      break;
    }
  }
  return { jump, diff: persianYear - breakYear, jalaaliLeaps };
}

function persianIsLeapYear(year: number): boolean {
  const { jump } = persianBreakYearCalc(year, false);
  let { diff } = persianBreakYearCalc(year, false);
  if (jump - diff < 6) {
    diff = diff - jump + Math.trunc((jump + 4) / 33) * 33;
  }
  return (((diff + 1) % 33) - 1) % 4 === 0;
}

function persianFirstDayOfYear(persianYear: number): number {
  const { jump, diff, jalaaliLeaps } = persianBreakYearCalc(persianYear, true);
  let leapJ = jalaaliLeaps + Math.trunc(diff / 33) * 8 + Math.trunc(((diff % 33) + 3) / 4);
  if (jump % 33 === 4 && jump - diff === 4) leapJ += 1;
  const isoYear = persianYear + 621;
  const gregorianLeaps = Math.trunc(isoYear / 4) - Math.trunc(((Math.trunc(isoYear / 100) + 1) * 3) / 4) - 150;
  const dayInISOMarch = 20 + leapJ - gregorianLeaps;
  return dateToEpochDay(new Date(Date.UTC(isoYear, 2, dayInISOMarch)));
}

function persianMonthLength(year: number, month: number): number {
  if (month < 7) return 31;
  if (month < 12) return 30;
  return persianIsLeapYear(year) ? 30 : 29;
}

export function gregorianToPersian(d: Date): CalendarDate {
  const epochDay = dateToEpochDay(d);
  let year = d.getUTCFullYear() - 621;
  while (persianFirstDayOfYear(year + 1) <= epochDay) year++;
  while (persianFirstDayOfYear(year) > epochDay) year--;
  let dayOfYear = epochDay - persianFirstDayOfYear(year) + 1;
  let month = 1;
  while (dayOfYear > persianMonthLength(year, month)) {
    dayOfYear -= persianMonthLength(year, month);
    month++;
  }
  return { year, month, day: dayOfYear };
}

export function persianToGregorian(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > persianMonthLength(year, month)) return null;
  let epochDay = persianFirstDayOfYear(year);
  for (let m = 1; m < month; m++) epochDay += persianMonthLength(year, m);
  epochDay += day - 1;
  return epochDayToDate(epochDay);
}
