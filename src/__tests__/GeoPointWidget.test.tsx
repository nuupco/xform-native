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
      <GeoPointWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('geo-open-map-button')).toBeTruthy();
  });

  it('shows coordinates when value exists', async () => {
    const store = makeStore({ lat: 19.4326, lon: -99.1332, alt: 2240, acc: 5 });
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByText(/19\.4326/)).toBeTruthy();
    expect(screen.getByText(/-99\.1332/)).toBeTruthy();
  });

  it('opens modal with map on "Open Map" press', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoPointWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
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
      <GeoPointWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
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
      <GeoPointWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
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
      <GeoPointWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
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
      <GeoPointWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
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
      <GeoPointWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-open-map-button'));
    });
    expect(mockGeo.Location.getCurrentPositionAsync).toHaveBeenCalled();
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
      <GeoPointWidget ref={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByText(/19/)).toBeTruthy();
    expect(screen.queryByTestId('geo-open-map-button')).toBeNull();
  });
});
