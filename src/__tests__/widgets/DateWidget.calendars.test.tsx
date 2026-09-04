/**
 * DateWidget alternate-calendar appearances (buddhist, coptic, ethiopian,
 * islamic, persian) — one round-trip test per calendar against a known
 * anchor date (verified independently in src/widgets/calendars.ts docblock),
 * proving the TextInput reads/writes that calendar while the committed
 * store value stays a Gregorian UTC Date.
 */
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession } from '../../test-support/makeFakeSession';
import { DateWidget } from '../../widgets/DateWidget';
import type { NodeRef } from '../../adapter/FormAdapter';

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStore(value: unknown, appearance: string): { store: FormSessionStore; ref: NodeRef } {
  const store = new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/d',
          dataType: 'date',
          controlType: 'input',
          label: 'Date',
          hint: null,
          appearance,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/d': {
          relevant: true,
          enabled: true,
          required: false,
          readonly: false,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/d': true },
      choices: {},
      answerResults: { '/data/d': AnswerResult.OK },
      values: { '/data/d': value },
    }),
  );
  store.stepForward();
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question event');
  return { store, ref: ev.ref };
}

const cases: ReadonlyArray<{
  appearance: string;
  isoDate: Date;
  calendarText: string;
  label: string;
}> = [
  {
    appearance: 'buddhist',
    isoDate: new Date(Date.UTC(2024, 0, 1)),
    calendarText: '2567-01-01',
    label: 'Thai Buddhist year (Gregorian + 543)',
  },
  {
    appearance: 'ethiopian',
    isoDate: new Date(Date.UTC(2023, 8, 12)),
    calendarText: '2016-01-01',
    label: "Ethiopian New Year (Sept 12 in the year before a Gregorian leap year)",
  },
  {
    appearance: 'coptic',
    isoDate: new Date(Date.UTC(2023, 8, 12)),
    calendarText: '1740-01-01',
    label: 'Coptic New Year (Nayrouz)',
  },
  {
    appearance: 'persian',
    isoDate: new Date(Date.UTC(2024, 2, 20)),
    calendarText: '1403-01-01',
    label: 'Persian New Year (Nowruz 2024)',
  },
  {
    appearance: 'islamic',
    isoDate: new Date(Date.UTC(1970, 0, 1)),
    calendarText: '1389-10-22',
    label: 'Islamic tabular civil calendar',
  },
];

describe.each(cases)('date/input/$appearance', ({ appearance, isoDate, calendarText, label }) => {
  it(`displays the stored Gregorian date as ${label}`, async () => {
    const { store, ref } = makeStore(isoDate, appearance);
    await render(<DateWidget nodeRef={ref} store={store} appearance={appearance} />);
    expect(screen.getByDisplayValue(calendarText)).toBeTruthy();
  });

  it('parses that calendar text back into the original Gregorian Date', async () => {
    const { store, ref } = makeStore(null, appearance);
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DateWidget nodeRef={ref} store={store} appearance={appearance} />);
    const digitsOnly = calendarText.replace(/-/g, '');
    fireEvent.changeText(screen.getByTestId('date-input'), digitsOnly);
    expect(spy).toHaveBeenCalledWith(ref, isoDate);
  });

  it('never renders the native picker button', async () => {
    const { store, ref } = makeStore(isoDate, appearance);
    await render(<DateWidget nodeRef={ref} store={store} appearance={appearance} />);
    expect(screen.queryByTestId('date-picker-button')).toBeNull();
  });
});
