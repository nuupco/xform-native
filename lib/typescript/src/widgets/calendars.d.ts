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
export declare function gregorianToBuddhist(d: Date): CalendarDate;
export declare function buddhistToGregorian(year: number, month: number, day: number): Date | null;
export declare function gregorianToCoptic(d: Date): CalendarDate;
export declare function copticToGregorian(year: number, month: number, day: number): Date | null;
export declare function gregorianToEthiopian(d: Date): CalendarDate;
export declare function ethiopianToGregorian(year: number, month: number, day: number): Date | null;
export declare function gregorianToIslamic(d: Date): CalendarDate;
export declare function islamicToGregorian(year: number, month: number, day: number): Date | null;
export declare function gregorianToPersian(d: Date): CalendarDate;
export declare function persianToGregorian(year: number, month: number, day: number): Date | null;
//# sourceMappingURL=calendars.d.ts.map