/**
 * GeoTraceWidget tests — polyline drawing modal.
 *
 * Uses mocked @nuup/xform-native-geo (MapLibre + expo-location).
 */
import { act } from 'react';
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { FormSessionStore } from '../store/FormSessionStore';
import { makeFakeSession } from '../test-support/makeFakeSession';
import { GeoTraceWidget } from '../widgets/GeoTraceWidget';

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStore(
  value: string | null = null,
  readonly = false,
) {
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/trace',
          dataType: 'geotrace',
          controlType: 'input',
          label: 'Trace',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/trace': {
          relevant: true,
          enabled: true,
          required: false,
          readonly,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/trace': true },
      choices: {},
      answerResults: { '/data/trace': AnswerResult.OK },
      values: { '/data/trace': value },
    }),
  );
}

function getRef(store: FormSessionStore) {
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev;
}

describe('GeoTraceWidget', () => {
  it('renders "Draw Trace" button when no value exists', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoTraceWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('geo-trace-open-map-button')).toBeTruthy();
  });

  it('opens modal with map on button press', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoTraceWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-open-map-button'));
    });
    expect(screen.getByTestId('geo-trace-modal')).toBeTruthy();
    expect(screen.getByTestId('geo-trace-map')).toBeTruthy();
  });

  it('adds vertices on map press', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoTraceWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-open-map-button'));
    });
    // Minimum 2 points required before the line renders
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-map'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-map'));
    });
    expect(screen.getByTestId('maplibre-geojson-source-trace')).toBeTruthy();
    expect(screen.getByTestId('maplibre-layer-trace-line-layer')).toBeTruthy();
  });

  it('accept is disabled below the 2-point minimum', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoTraceWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-open-map-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-map'));
    });
    expect(screen.getByTestId('geo-trace-accept-button').props.accessibilityState?.disabled)
      .toBe(true);
  });

  it('stores ODK-format string on Accept', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <GeoTraceWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-open-map-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-map'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-map'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-accept-button'));
    });
    expect(answerSpy).toHaveBeenCalledWith(
      ev.ref,
      expect.stringMatching(/^-?\d+\.\d+\s+-?\d+\.\d+\s+\d+\s+\d+(\s*;\s*-?\d+\.\d+\s+-?\d+\.\d+\s+\d+\s+\d+)+$/),
    );
  });

  it('does not call answerQuestion on Cancel', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <GeoTraceWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-open-map-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-map'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-cancel-button'));
    });
    expect(answerSpy).not.toHaveBeenCalled();
  });

  it('closes modal on Cancel', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoTraceWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-open-map-button'));
    });
    expect(screen.getByTestId('geo-trace-modal')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-cancel-button'));
    });
    expect(screen.queryByTestId('geo-trace-modal')).toBeNull();
  });
});

describe('GeoTraceWidget readonly mode', () => {
  it('shows label but no button when readonly', async () => {
    const store = makeStore('19.4326 -99.1332 0 5; 19.5000 -99.2000 0 5', true);
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoTraceWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('geo-trace-readonly')).toBeTruthy();
    expect(screen.queryByTestId('geo-trace-open-map-button')).toBeNull();
  });
});
