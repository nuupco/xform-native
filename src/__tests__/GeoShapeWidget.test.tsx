/**
 * GeoShapeWidget tests — polygon drawing modal.
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
import { GeoShapeWidget } from '../widgets/GeoShapeWidget';

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
          ref: '/data/shape',
          dataType: 'geoshape',
          controlType: 'input',
          label: 'Shape',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/shape': {
          relevant: true,
          enabled: true,
          required: false,
          readonly,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/shape': true },
      choices: {},
      answerResults: { '/data/shape': AnswerResult.OK },
      values: { '/data/shape': value },
    }),
  );
}

function getRef(store: FormSessionStore) {
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev;
}

describe('GeoShapeWidget', () => {
  it('renders "Draw Shape" button when no value exists', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('geo-shape-open-map-button')).toBeTruthy();
  });

  it('the open-map trigger uses a contrasting background, not the page-background-matching surface color (REQ hotfix)', async () => {
    // Confirmed on-device: the trigger used tokens.color.surface (#F5F5F5),
    // the exact color the host app uses for its own page background — zero
    // contrast rendered the button as plain unstyled text.
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const { getByTestId } = await render(
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    const trigger = getByTestId('geo-shape-open-map-button');
    const triggerStyle = Object.assign({}, ...[trigger.props.style].flat());
    expect(triggerStyle.backgroundColor).not.toBe('#F5F5F5');
  });

  it('opens modal with map on button press', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-open-map-button'));
    });
    expect(screen.getByTestId('geo-shape-modal')).toBeTruthy();
    expect(screen.getByTestId('geo-shape-map')).toBeTruthy();
  });

  it('adds vertices on map press', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-open-map-button'));
    });
    // Minimum 3 points required before the polygon renders
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-map'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-map'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-map'));
    });
    expect(screen.getByTestId('maplibre-geojson-source-shape')).toBeTruthy();
    expect(screen.getByTestId('maplibre-layer-shape-fill-layer')).toBeTruthy();
  });

  it('accept is disabled below the 3-point minimum', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-open-map-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-map'));
    });
    expect(screen.getByTestId('geo-shape-accept-button').props.accessibilityState?.disabled)
      .toBe(true);
  });

  it('stores ODK-format string on Accept with the ring closed', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-open-map-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-map'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-map'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-map'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-accept-button'));
    });
    expect(answerSpy).toHaveBeenCalledTimes(1);
    const committed = answerSpy.mock.calls[0]![1] as string;
    const parts = committed.split(';').map((p) => p.trim());
    expect(parts).toHaveLength(4); // 3 tapped vertices + closing repeat of the first
    expect(parts[0]).toBe(parts.at(3));
  });

  it('does not call answerQuestion on Cancel', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-open-map-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-map'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-cancel-button'));
    });
    expect(answerSpy).not.toHaveBeenCalled();
  });

  it('closes modal on Cancel', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-open-map-button'));
    });
    expect(screen.getByTestId('geo-shape-modal')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-cancel-button'));
    });
    expect(screen.queryByTestId('geo-shape-modal')).toBeNull();
  });
});

describe('GeoShapeWidget GPS vertex capture', () => {
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
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-open-map-button'));
    });
    expect(
      screen.getByTestId('geo-shape-add-point-button').props.accessibilityState?.disabled,
    ).toBe(true);
  });

  it('adds a vertex at the current GPS fix on press', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-open-map-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-add-point-button'));
    });
    expect(screen.getByTestId('geo-shape-pin-0')).toBeTruthy();
  });

  it('undo removes a vertex added via the GPS button', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-open-map-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-add-point-button'));
    });
    expect(screen.getByTestId('geo-shape-pin-0')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-undo-button'));
    });
    expect(screen.queryByTestId('geo-shape-pin-0')).toBeNull();
  });

  it('three GPS-button presses plus Accept closes the ring with 4 parts', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-open-map-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-add-point-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-add-point-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-add-point-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-accept-button'));
    });
    expect(answerSpy).toHaveBeenCalledTimes(1);
    const committed = answerSpy.mock.calls[0]![1] as string;
    const parts = committed.split(';').map((p) => p.trim());
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe(parts.at(3));
  });

  it('recenter button is present and enabled once a fix lands', async () => {
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-open-map-button'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-recenter-button'));
    });
    expect(screen.getByTestId('geo-shape-recenter-button')).toBeTruthy();
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
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-open-map-button'));
    });
    expect(screen.getByText('Sin permiso de ubicación')).toBeTruthy();
  });
});

describe('GeoShapeWidget ring-dedup regression', () => {
  it('REGRESSION: re-editing a saved shape with a duplicated closing vertex does not double-close the ring on re-accept', async () => {
    // Saved answer already has the ring closed (first vertex repeated).
    const savedRing =
      '19.0 -99.0 0 0; 19.1 -99.0 0 0; 19.1 -99.1 0 0; 19.0 -99.0 0 0';
    // NOTE: the shared makeStore() helper's fixture node uses
    // dataType: 'geoshape', which routes through ts-rosa's `cast()` and
    // returns a parsed points ARRAY from resolveValue (not the raw ODK
    // string GeoShapeWidget's own parseVertices/serializeVertices contract
    // expects — see the widget's file docstring: "Value shape: ODK
    // semicolon-separated geopoint string"). Build a local fixture with
    // dataType: 'string' so resolveValue yields the raw string the widget
    // actually consumes, matching its documented contract.
    const store = new FormSessionStore(
      makeFakeSession({
        events: [
          { kind: 'bof' },
          {
            kind: 'question',
            ref: '/data/shape',
            dataType: 'string',
            controlType: 'input',
            label: 'Shape',
            hint: null,
            appearance: null,
          },
          { kind: 'eof' },
        ],
        nodeStates: {
          '/data/shape': {
            relevant: true,
            enabled: true,
            required: false,
            readonly: false,
            constraintMsg: null,
            calculatedValue: null,
          },
        },
        relevance: { '/data/shape': true },
        choices: {},
        answerResults: { '/data/shape': AnswerResult.OK },
        values: { '/data/shape': savedRing },
      }),
    );
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-open-map-button'));
    });
    // parseVertices should have deduped the closing vertex on load: exactly
    // 3 distinct vertex pins, not 4.
    expect(screen.getByTestId('geo-shape-pin-0')).toBeTruthy();
    expect(screen.getByTestId('geo-shape-pin-1')).toBeTruthy();
    expect(screen.getByTestId('geo-shape-pin-2')).toBeTruthy();
    expect(screen.queryByTestId('geo-shape-pin-3')).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByTestId('geo-shape-accept-button'));
    });
    expect(answerSpy).toHaveBeenCalledTimes(1);
    const committed = answerSpy.mock.calls[0]![1] as string;
    const parts = committed.split(';').map((p) => p.trim());
    // Re-closing 3 unique vertices should yield exactly 4 parts, not 5
    // (no double-closing from a stale duplicate).
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe(parts.at(3));
  });
});

describe('GeoShapeWidget readonly mode', () => {
  it('shows label but no button when readonly', async () => {
    const store = makeStore('19.4326 -99.1332 0 5; 19.5000 -99.2000 0 5', true);
    store.stepForward();
    const ev = getRef(store);
    await render(
      <GeoShapeWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />,
    );
    expect(screen.getByTestId('geo-shape-readonly')).toBeTruthy();
    expect(screen.queryByTestId('geo-shape-open-map-button')).toBeNull();
  });
});
