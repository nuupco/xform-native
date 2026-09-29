/**
 * TimeWidget — time-offset-awareness read path (T3/T4/T5).
 *
 * A `time` answer displays using the offset it was CAPTURED with, even when
 * that differs from the device's current offset (resolved product decision
 * in odd/tasks/time-offset-awareness.md). Legacy/offset-less stored values
 * must keep displaying exactly as before (regression, T5).
 */
import { render, screen, cleanup } from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession } from '../../test-support/makeFakeSession';
import { TimeWidget } from '../../widgets/TimeWidget';

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStore(ref: string, value: unknown) {
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref,
          dataType: 'time',
          controlType: 'input',
          label: 'label',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        [ref]: {
          relevant: true,
          enabled: true,
          required: false,
          readonly: false,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { [ref]: true },
      choices: {},
      answerResults: { [ref]: AnswerResult.OK },
      values: { [ref]: value },
    }),
  );
}

async function renderTimeWidget(ref: string, value: unknown) {
  const store = makeStore(ref, value);
  store.stepForward();
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  await render(<TimeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
  return screen.getByTestId('time-input');
}

describe('TimeWidget — offset-aware display', () => {
  it('displays a time answer using the offset it was CAPTURED with, not the device current offset', async () => {
    // 21:59 UTC captured at "-06:00" => wall clock 15:59 in that zone.
    const input = await renderTimeWidget('/data/t1', {
      kind: 'time',
      value: new Date('1970-01-01T21:59:00.000Z'),
      offset: '-06:00',
      displayText: '15:59',
    });
    expect(input.props.value).toBe('15:59');
  });

  it('displays a time answer captured at "+02:00" correctly', async () => {
    // 08:15 UTC captured at "+02:00" => wall clock 10:15 in that zone.
    const input = await renderTimeWidget('/data/t2', {
      kind: 'time',
      value: new Date('1970-01-01T08:15:00.000Z'),
      offset: '+02:00',
      displayText: '10:15',
    });
    expect(input.props.value).toBe('10:15');
  });

  it('REGRESSION: legacy offset-less time value displays via UTC getters exactly as before', async () => {
    const input = await renderTimeWidget('/data/t3', {
      kind: 'time',
      value: new Date('1970-01-01T15:59:00.000Z'),
      displayText: '15:59',
    });
    expect(input.props.value).toBe('15:59');
  });

  it('REGRESSION: a time value with offset "Z" behaves identically to offset-less', async () => {
    const input = await renderTimeWidget('/data/t4', {
      kind: 'time',
      value: new Date('1970-01-01T15:59:00.000Z'),
      offset: 'Z',
      displayText: '15:59',
    });
    expect(input.props.value).toBe('15:59');
  });
});
