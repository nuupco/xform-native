/**
 * DateWidget / TimeWidget / DateTimeWidget — M3 field restyle (PR5, Phase 3
 * slice 5). Trigger-field theming only — see design decision 2 (fieldStyles)
 * and decision 9 (CalendarIcon/ClockIcon). The native OS picker dialog itself
 * is out of reach from JS (risk table) and is untouched by this PR; manual
 * masked-TextInput entry (existing UX) is preserved unmodified so the
 * pre-existing behavioral suites keep passing.
 */
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { __esModule: true, default: () => React.createElement(View) };
});

import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession } from '../test-support/makeFakeSession';
import { ThemeProvider } from '../theme/ThemeContext';
import { tokens } from '../tokens/tokens';
import { DateWidget } from '../widgets/DateWidget';
import { TimeWidget } from '../widgets/TimeWidget';
import { DateTimeWidget } from '../widgets/DateTimeWidget';

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function flatten(style: unknown) {
  return Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
}

function makeStore(dataType: 'date' | 'time' | 'dateTime', ref: string, value: unknown = null) {
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref,
          dataType,
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

describe('DateWidget — field styling', () => {
  it('input uses fieldStyles field (outline border, roles.surface bg, roles.outline border) + mono typography', async () => {
    const store = makeStore('date', '/data/d1');
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(<DateWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);

    const style = flatten(screen.getByTestId('date-input').props.style);
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBe(tokens.color.roles.outline);
    expect(style.backgroundColor).toBe(tokens.color.roles.surface);
    expect(style.fontFamily).toBe(tokens.typography.mono.fontFamily);
  });

  it('applies fieldFocused (2px primary border) on focus, reverts on blur', async () => {
    const store = makeStore('date', '/data/d2');
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(<DateWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    const input = screen.getByTestId('date-input');

    await fireEvent(input, 'focus');
    let style = flatten(screen.getByTestId('date-input').props.style);
    expect(style.borderWidth).toBe(2);
    expect(style.borderColor).toBe(tokens.color.roles.primary);

    await fireEvent(input, 'blur');
    style = flatten(screen.getByTestId('date-input').props.style);
    expect(style.borderWidth).toBe(1);
  });

  it('readonly applies fieldDisabled (surfaceVariant bg, contentOpacity)', async () => {
    const store = new FormSessionStore(
      makeFakeSession({
        events: [
          { kind: 'bof' },
          {
            kind: 'question',
            ref: '/data/d3',
            dataType: 'date',
            controlType: 'input',
            label: 'label',
            hint: null,
            appearance: null,
          },
          { kind: 'eof' },
        ],
        nodeStates: {
          '/data/d3': {
            relevant: true,
            enabled: true,
            required: false,
            readonly: true,
            constraintMsg: null,
            calculatedValue: null,
          },
        },
        relevance: { '/data/d3': true },
        choices: {},
        answerResults: { '/data/d3': AnswerResult.OK },
        values: { '/data/d3': null },
      }),
    );
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(<DateWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    const style = flatten(screen.getByTestId('date-input').props.style);
    expect(style.backgroundColor).toBe(tokens.color.roles.surfaceVariant);
    expect(style.opacity).toBe(tokens.disabled.contentOpacity);
  });

  it('picker-button affordance uses primaryContainer background and renders CalendarIcon', async () => {
    const store = makeStore('date', '/data/d4');
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(<DateWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    const button = screen.getByTestId('date-picker-button');
    const style = flatten(button.props.style);
    expect(style.backgroundColor).toBe(tokens.color.roles.primaryContainer);
    expect(screen.getByTestId('date-picker-icon')).toBeTruthy();
  });

  it('a host ThemeProvider override reaches the field border color', async () => {
    const store = makeStore('date', '/data/d5');
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(
      <ThemeProvider theme={{ color: { primary: '#7B2CBF' } }}>
        <DateWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />
      </ThemeProvider>,
    );
    const input = screen.getByTestId('date-input');
    await fireEvent(input, 'focus');
    const style = flatten(screen.getByTestId('date-input').props.style);
    expect(style.borderColor).toBe('#7B2CBF');
  });
});

describe('TimeWidget — field styling', () => {
  it('input uses fieldStyles field + mono typography, focus/blur toggles fieldFocused', async () => {
    const store = makeStore('time', '/data/t1');
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(<TimeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    const input = screen.getByTestId('time-input');
    let style = flatten(input.props.style);
    expect(style.borderColor).toBe(tokens.color.roles.outline);
    expect(style.fontFamily).toBe(tokens.typography.mono.fontFamily);

    await fireEvent(input, 'focus');
    style = flatten(screen.getByTestId('time-input').props.style);
    expect(style.borderWidth).toBe(2);
    expect(style.borderColor).toBe(tokens.color.roles.primary);
  });

  it('renders a ClockIcon affordance beside the input', async () => {
    const store = makeStore('time', '/data/t2');
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(<TimeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    expect(screen.getByTestId('time-picker-icon')).toBeTruthy();
  });
});

describe('DateTimeWidget — field styling', () => {
  it('input uses fieldStyles field + mono typography, focus/blur toggles fieldFocused', async () => {
    const store = makeStore('dateTime', '/data/dt1');
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(<DateTimeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    const input = screen.getByTestId('datetime-input');
    let style = flatten(input.props.style);
    expect(style.borderColor).toBe(tokens.color.roles.outline);
    expect(style.fontFamily).toBe(tokens.typography.mono.fontFamily);

    await fireEvent(input, 'focus');
    style = flatten(screen.getByTestId('datetime-input').props.style);
    expect(style.borderWidth).toBe(2);
  });

  it('renders a CalendarIcon affordance beside the input', async () => {
    const store = makeStore('dateTime', '/data/dt2');
    store.stepForward();
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'question') throw new Error('expected question');

    await render(<DateTimeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);
    expect(screen.getByTestId('datetime-picker-icon')).toBeTruthy();
  });
});
