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

describe('GeoTraceWidget GPS vertex capture', () => {
  it('add-point button is disabled with no GPS fix yet', async () => {
    const mockGeo = require('@nuup/xform-native-geo');
    mockGeo.Location.getLastKnownPositionAsync.mockResolvedValueOnce(null);
    mockGeo.Location.watchPositionAsync.mockImplementationOnce(
      () => new Promise(() => {}),
    );
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoTraceWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-open-map-button'));
    });
    expect(
      screen.getByTestId('geo-trace-add-point-button').props.accessibilityState?.disabled,
    ).toBe(true);
  });

  it('adds a vertex at the current GPS fix on press', async () => {
    const mockGeo = require('@nuup/xform-native-geo');
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
      fireEvent.press(screen.getByTestId('geo-trace-add-point-button'));
    });
    expect(screen.getByTestId('geo-trace-pin-0')).toBeTruthy();
    mockGeo.Location.__triggerWatch({
      coords: { latitude: 20.1, longitude: -100.1, altitude: 50, accuracy: 8 },
    });
  });

  it('undo removes a vertex added via the GPS button', async () => {
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
      fireEvent.press(screen.getByTestId('geo-trace-add-point-button'));
    });
    expect(screen.getByTestId('geo-trace-pin-0')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-undo-button'));
    });
    expect(screen.queryByTestId('geo-trace-pin-0')).toBeNull();
  });

  it('two GPS-button presses plus Accept serializes 2 points', async () => {
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
      fireEvent.press(screen.getByTestId('geo-trace-add-point-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-add-point-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-accept-button'));
    });
    expect(answerSpy).toHaveBeenCalledTimes(1);
    const committed = answerSpy.mock.calls[0]![1] as string;
    expect(committed.split(';')).toHaveLength(2);
  });

  it('recenter button flies the camera to the current position', async () => {
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
      fireEvent.press(screen.getByTestId('geo-trace-recenter-button'));
    });
    expect(screen.getByTestId('geo-trace-recenter-button')).toBeTruthy();
  });

  it('shows permission-denied status text when GPS permission is denied', async () => {
    const mockGeo = require('@nuup/xform-native-geo');
    mockGeo.Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoTraceWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-open-map-button'));
    });
    expect(screen.getByText('Sin permiso de ubicación')).toBeTruthy();
  });
});

describe('GeoTraceWidget offline tile layer', () => {
  it('renders the offline raster layer and shifts the trace line layerIndex above it', async () => {
    const { Layer } = require('@maplibre/maplibre-react-native');
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
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-map'));
    });
    expect(screen.getByTestId('maplibre-raster-source-esri-offline')).toBeTruthy();
    const calls = (Layer as jest.Mock).mock.calls.map(([p]: any[]) => p);
    const satellite = calls.find((p) => p.id === 'esri-satellite-layer');
    const offline = calls.find((p) => p.id === 'esri-offline-layer');
    const traceLine = calls.find((p) => p.id === 'trace-line-layer');
    expect(satellite?.layerIndex).toBe(1);
    expect(offline?.layerIndex).toBe(2);
    expect(traceLine?.layerIndex).toBe(3);
  });
});

describe('GeoTraceWidget offline tile prewarm', () => {
  it('renders a prewarm button and shows success status on completion', async () => {
    const mockGeo = require('@nuup/xform-native-geo');
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoTraceWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-open-map-button'));
    });
    expect(screen.getByTestId('geo-trace-prewarm-button')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-trace-prewarm-button'));
    });
    expect(mockGeo.preWarmSatelliteTiles).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Number),
      expect.any(Number),
    );
    expect(screen.getByText('Mapas descargados para uso sin conexión')).toBeTruthy();
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
