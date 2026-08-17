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
