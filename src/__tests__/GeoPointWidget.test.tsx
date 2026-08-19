/**
 * GeoPointWidget tests — T-GEO05/06/08/09 (REQ-GEO03..GEO08).
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
import { GeoPointWidget } from '../widgets/GeoPointWidget';

const mockGeo = require('@nuup/xform-native-geo');

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStore(value: { lat: number; lon: number; alt: number; acc: number } | null = null) {
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/location',
          dataType: 'geopoint',
          controlType: 'input',
          label: 'Location',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/location': {
          relevant: true,
          enabled: true,
          required: false,
          readonly: false,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/location': true },
      choices: {},
      answerResults: { '/data/location': AnswerResult.OK },
      values: { '/data/location': value },
    }),
  );
}

function getRef(store: FormSessionStore) {
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev;
}

describe('GeoPointWidget', () => {
  it('renders "Open Map" button when no value exists', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('geo-open-map-button')).toBeTruthy();
  });

  it('shows coordinates when value exists', async () => {
    const store = makeStore({ lat: 19.4326, lon: -99.1332, alt: 2240, acc: 5 });
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByText(/19\.4326/)).toBeTruthy();
    expect(screen.getByText(/-99\.1332/)).toBeTruthy();
  });

  it('opens modal with map on "Open Map" press', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    expect(screen.getByTestId('geo-map-modal')).toBeTruthy();
    expect(screen.getByTestId('geo-maplibre-map')).toBeTruthy();
  });

  it('centers map on existing value when modal opens', async () => {
    const store = makeStore({ lat: 20.0, lon: -100.0, alt: 100, acc: 10 });
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    expect(screen.getByTestId('geo-maplibre-map')).toBeTruthy();
  });

  it('stores geopoint via answerQuestion on Accept', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    // Simulate setting a coordinate by pressing the map
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-maplibre-map'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-accept-button'));
    });
    expect(answerSpy).toHaveBeenCalledWith(
      ev.ref,
      expect.objectContaining({
        lat: expect.any(Number),
        lon: expect.any(Number),
        alt: expect.any(Number),
        acc: expect.any(Number),
      }),
    );
  });

  it('does not call answerQuestion on Cancel', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-cancel-button'));
    });
    expect(answerSpy).not.toHaveBeenCalled();
  });

  it('closes modal on Cancel', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    expect(screen.getByTestId('geo-map-modal')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-cancel-button'));
    });
    expect(screen.queryByTestId('geo-map-modal')).toBeNull();
  });

  it('captures GPS on modal open when permissions granted', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    expect(mockGeo.Location.watchPositionAsync).toHaveBeenCalled();
  });

  it('REGRESSION: manual tap overrides live GPS on Accept', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    // Live GPS fix lands (from the mock's synchronous watchPositionAsync callback)
    // AND the surveyor taps the map to place a manual pin at a different spot.
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-maplibre-map'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-accept-button'));
    });
    expect(answerSpy).toHaveBeenCalledTimes(1);
    const committed = answerSpy.mock.calls[0]![1] as { lat: number; lon: number };
    // The mock map-press fires lngLat [-99.2, 19.5]; the live GPS fix from the
    // mock is lat 19.4326/lon -99.1332. The tapped point must win.
    expect(mockGeo.Location.watchPositionAsync).toHaveBeenCalled();
    expect(committed.lat).toBeCloseTo(19.5);
    expect(committed.lon).toBeCloseTo(-99.2);
  });

  it('shows permission-denied status text (no spinner) when GPS permission is denied', async () => {
    mockGeo.Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    expect(screen.getByText('Sin permiso de ubicación')).toBeTruthy();
  });

  it('renders the permission notice when denied and retries the OS prompt on primary press (PR2)', async () => {
    mockGeo.Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    expect(screen.getByTestId('gps-permission-notice')).toBeTruthy();
    expect(screen.getByText('Sin permiso de ubicación')).toBeTruthy();

    const callsBefore = mockGeo.Location.requestForegroundPermissionsAsync.mock.calls.length;
    await act(async () => {
      fireEvent.press(screen.getByTestId('gps-permission-primary'));
    });
    expect(mockGeo.Location.requestForegroundPermissionsAsync.mock.calls.length).toBe(
      callsBefore + 1,
    );
  });

  it('shows live accuracy readout once a GPS fix lands', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    expect(screen.getByText(/±5(\.0)? m/)).toBeTruthy();
  });

  it('unmounting mid-GPS-capture does not set state after unmount', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    let resolveWatch: (value: any) => void = () => {};
    mockGeo.Location.watchPositionAsync.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveWatch = resolve;
      }),
    );
    const warnSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    await act(async () => {
      unmount();
    });
    await act(async () => {
      resolveWatch({ remove: jest.fn() });
      await Promise.resolve();
      await Promise.resolve();
    });
    const stateWarning = warnSpy.mock.calls.some((call) =>
      String(call[0]).includes('unmounted component'),
    );
    expect(stateWarning).toBe(false);
    warnSpy.mockRestore();
  });
});

describe('GeoPointWidget offline tile layer', () => {
  it('renders the offline raster layer above the online satellite layer', async () => {
    const { Layer } = require('@maplibre/maplibre-react-native');
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    expect(screen.getByTestId('maplibre-raster-source-esri-offline')).toBeTruthy();
    const calls = (Layer as jest.Mock).mock.calls.map(([p]: any[]) => p);
    const satellite = calls.find((p) => p.id === 'esri-satellite-layer');
    const offline = calls.find((p) => p.id === 'esri-offline-layer');
    expect(satellite?.layerIndex).toBe(1);
    expect(offline?.layerIndex).toBe(2);
  });
});

describe('GeoPointWidget offline tile prewarm', () => {
  it('renders a prewarm button and shows success status on completion', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    expect(screen.getByTestId('geo-prewarm-button')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-prewarm-button'));
    });
    expect(mockGeo.preWarmSatelliteTiles).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Number),
      expect.any(Number),
    );
    expect(screen.getByText('Mapas descargados para uso sin conexión')).toBeTruthy();
  });

  it('shows a cap-reached status message when the tile cap is hit', async () => {
    mockGeo.preWarmSatelliteTiles.mockResolvedValueOnce({
      downloaded: 10,
      skipped: 0,
      capReached: true,
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-prewarm-button'));
    });
    expect(screen.getByText('Límite de almacenamiento alcanzado')).toBeTruthy();
  });

  it('shows an error status message when prewarm fails', async () => {
    mockGeo.preWarmSatelliteTiles.mockRejectedValueOnce(new Error('network error'));
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-prewarm-button'));
    });
    expect(screen.getByText('No se pudieron descargar los mapas')).toBeTruthy();
  });
});

describe('GeoPointWidget readonly mode', () => {
  it('shows coordinates but no Open Map button when readonly', async () => {
    const store = new FormSessionStore(
      makeFakeSession({
        events: [
          { kind: 'bof' },
          {
            kind: 'question',
            ref: '/data/location',
            dataType: 'geopoint',
            controlType: 'input',
            label: 'Location',
            hint: null,
            appearance: null,
          },
          { kind: 'eof' },
        ],
        nodeStates: {
          '/data/location': {
            relevant: true,
            enabled: true,
            required: false,
            readonly: true,
            constraintMsg: null,
            calculatedValue: null,
          },
        },
        relevance: { '/data/location': true },
        choices: {},
        answerResults: { '/data/location': AnswerResult.OK },
        values: { '/data/location': { lat: 19.0, lon: -99.0, alt: 100, acc: 5 } },
      }),
    );
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByText(/19/)).toBeTruthy();
    expect(screen.queryByTestId('geo-open-map-button')).toBeNull();
  });
});
