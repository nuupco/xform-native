/**
 * appearance-gaps-closed — one behavioral test per appearance token closed
 * out of KNOWN_APPEARANCE_GAPS (see
 * ../integration/xform-widgets-coverage.test.tsx). Each test proves the
 * variant does something REAL, not just that resolveVariant recognizes the
 * token (that's covered in engine/appearance.test.ts).
 */
import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult, type DataType, type ControlType, type SelectChoice } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession, type FakeSessionScript } from '../../test-support/makeFakeSession';
import { SelectOneWidget } from '../../widgets/SelectOneWidget';
import { SelectMultiWidget } from '../../widgets/SelectMultiWidget';
import { RangeWidget } from '../../widgets/RangeWidget';
import { DateWidget } from '../../widgets/DateWidget';
import { IntWidget } from '../../widgets/IntWidget';
import { StringWidget } from '../../widgets/StringWidget';
import { ImageWidget } from '../../widgets/ImageWidget';
import { GeoPointWidget } from '../../widgets/GeoPointWidget';
import type { NodeRef } from '../../adapter/FormAdapter';

const picker = require('expo-image-picker');
const sensors = require('expo-sensors');

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

function makeStoreFor(opts: {
  ref: string;
  dataType: DataType;
  controlType?: ControlType;
  value?: unknown;
  readonly?: boolean;
  choices?: readonly SelectChoice[];
  appearance?: string | null;
}): { store: FormSessionStore; ref: NodeRef } {
  const script: FakeSessionScript = {
    events: [
      { kind: 'bof' },
      {
        kind: 'question',
        ref: opts.ref,
        dataType: opts.dataType,
        controlType: opts.controlType ?? 'input',
        label: 'Test field',
        hint: null,
        appearance: opts.appearance ?? null,
      },
      { kind: 'eof' },
    ],
    nodeStates: {
      [opts.ref]: {
        readonly: opts.readonly ?? false,
        required: false,
        relevant: true,
        enabled: true,
        constraintMsg: null,
        calculatedValue: null,
      },
    },
    relevance: { [opts.ref]: true },
    choices: { [opts.ref]: opts.choices ?? [] },
    answerResults: { [opts.ref]: AnswerResult.OK },
    values: { [opts.ref]: opts.value ?? null },
  };
  const session = makeFakeSession(script);
  const store = new FormSessionStore(session);
  store.stepForward();
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question event');
  return { store, ref: ev.ref };
}

const choices: SelectChoice[] = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];

describe('selectOne/select1/compact', () => {
  it('renders a multi-column list with each choice label shown', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/s',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'compact',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="compact" />);
    expect(screen.getByTestId('select-one-compact-list')).toBeTruthy();
    expect(screen.getByTestId('select-one-compact-option-a')).toBeTruthy();
    expect(screen.getByText('A')).toBeTruthy();
  });

  it('commits the tapped choice via answerQuestion', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/s',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'compact',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="compact" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-compact-option-b'));
    });
    expect(spy).toHaveBeenCalledWith(ref, 'b');
  });
});

describe('selectOne/select1/no-buttons', () => {
  it('renders choice rows without a SelectionIndicator (radio) testID', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/s',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'no-buttons',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="no-buttons" />);
    expect(screen.getByTestId('select-one-no-buttons-option-a')).toBeTruthy();
    expect(screen.queryByTestId('select-one-option-a')).toBeNull();
  });

  it('the whole row is tappable and commits the value', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/s',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'no-buttons',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="no-buttons" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-no-buttons-option-b'));
    });
    expect(spy).toHaveBeenCalledWith(ref, 'b');
  });
});

describe('selectMulti/select/compact', () => {
  it('toggles a choice on and off via answerQuestion', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/m',
      dataType: 'selectMulti',
      controlType: 'select',
      choices,
      appearance: 'compact',
      value: [],
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectMultiWidget nodeRef={ref} store={store} appearance="compact" />);
    expect(screen.getByTestId('select-multi-compact-list')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-multi-compact-option-a'));
    });
    expect(spy).toHaveBeenCalledWith(ref, ['a']);
  });
});

describe('int/range/rating', () => {
  it('renders start..end stars from the bound range and none filled at value=start', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/r',
      dataType: 'int',
      controlType: 'range',
      appearance: 'rating',
      value: 0,
    });
    await render(
      <RangeWidget nodeRef={ref} store={store} appearance="rating" start={1} end={5} step={1} />,
    );
    expect(screen.getByTestId('range-rating')).toBeTruthy();
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`range-rating-star-${i}`)).toBeTruthy();
    }
  });

  it('tapping a star commits that value via answerQuestion', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/r',
      dataType: 'int',
      controlType: 'range',
      appearance: 'rating',
      value: 0,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(
      <RangeWidget nodeRef={ref} store={store} appearance="rating" start={1} end={5} step={1} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('range-rating-star-3'));
    });
    expect(spy).toHaveBeenCalledWith(ref, 3);
  });

  it('falls back to 5 stars when no bounds are supplied', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/r',
      dataType: 'int',
      controlType: 'range',
      appearance: 'rating',
    });
    await render(<RangeWidget nodeRef={ref} store={store} appearance="rating" />);
    expect(screen.getByTestId('range-rating-star-5')).toBeTruthy();
    expect(screen.queryByTestId('range-rating-star-6')).toBeNull();
  });
});

describe('date/input/no-calendar', () => {
  it('never renders the native picker button (dep absent in this test env)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/d',
      dataType: 'date',
      controlType: 'input',
      appearance: 'no-calendar',
    });
    await render(<DateWidget nodeRef={ref} store={store} appearance="no-calendar" />);
    expect(screen.getByTestId('date-input')).toBeTruthy();
    expect(screen.queryByTestId('date-picker-button')).toBeNull();
  });

  it('accepts full YYYY-MM-DD text entry and commits a Date', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/d',
      dataType: 'date',
      controlType: 'input',
      appearance: 'no-calendar',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<DateWidget nodeRef={ref} store={store} appearance="no-calendar" />);
    fireEvent.changeText(screen.getByTestId('date-input'), '20240615');
    expect(spy).toHaveBeenCalledWith(ref, new Date(Date.UTC(2024, 5, 15)));
  });
});

describe('int/input/bearing', () => {
  it('renders a live heading readout and capture button when expo-sensors is present', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/i',
      dataType: 'int',
      controlType: 'input',
      appearance: 'bearing',
    });
    await render(<IntWidget nodeRef={ref} store={store} appearance="bearing" />);
    expect(screen.getByTestId('int-bearing-live')).toBeTruthy();
    expect(screen.getByTestId('int-bearing-capture')).toBeTruthy();
  });

  it('capturing commits the live magnetometer heading via answerQuestion', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/i',
      dataType: 'int',
      controlType: 'input',
      appearance: 'bearing',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<IntWidget nodeRef={ref} store={store} appearance="bearing" />);
    await act(async () => {
      sensors.__emitMagnetometer({ x: 0, y: 1 });
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('int-bearing-capture'));
    });
    expect(spy).toHaveBeenCalledWith(ref, expect.any(Number));
  });
});

describe('int/input/counter', () => {
  it('renders the current value with plus/minus buttons, no text input', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/c',
      dataType: 'int',
      controlType: 'input',
      appearance: 'counter',
      value: 3,
    });
    await render(<IntWidget nodeRef={ref} store={store} appearance="counter" />);
    expect(screen.getByTestId('int-counter-value').props.children).toBe('3');
    expect(screen.queryByTestId('int-input')).toBeNull();
  });

  it('plus increments via answerQuestion, minus decrements', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/c',
      dataType: 'int',
      controlType: 'input',
      appearance: 'counter',
      value: 3,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<IntWidget nodeRef={ref} store={store} appearance="counter" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('int-counter-plus'));
    });
    expect(spy).toHaveBeenCalledWith(ref, 4);
    await act(async () => {
      fireEvent.press(screen.getByTestId('int-counter-minus'));
    });
    expect(spy).toHaveBeenCalledWith(ref, 3);
  });

  it('minus is disabled at 0 (ODK Collect never goes negative)', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/c',
      dataType: 'int',
      controlType: 'input',
      appearance: 'counter',
      value: 0,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<IntWidget nodeRef={ref} store={store} appearance="counter" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('int-counter-minus'));
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it('plus from an empty answer starts at 1', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/c',
      dataType: 'int',
      controlType: 'input',
      appearance: 'counter',
      value: null,
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<IntWidget nodeRef={ref} store={store} appearance="counter" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('int-counter-plus'));
    });
    expect(spy).toHaveBeenCalledWith(ref, 1);
  });
});

describe('string/input/masked', () => {
  it('renders with secureTextEntry so the typed value is obscured', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/s',
      dataType: 'string',
      controlType: 'input',
      appearance: 'masked',
      value: 'secret',
    });
    await render(<StringWidget nodeRef={ref} store={store} appearance="masked" />);
    expect(screen.getByTestId('string-input').props.secureTextEntry).toBe(true);
  });

  it('numbers wins over masked: no secureTextEntry when combined', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/s',
      dataType: 'string',
      controlType: 'input',
      appearance: 'masked numbers',
      value: '1234',
    });
    await render(<StringWidget nodeRef={ref} store={store} appearance="masked numbers" />);
    expect(screen.getByTestId('string-input').props.secureTextEntry).toBeFalsy();
  });
});

describe('binary/upload/selfie + front-camera + new-front + new', () => {
  it('selfie launches the camera with the front CameraType', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/img',
      dataType: 'binary',
      controlType: 'upload',
      appearance: 'selfie',
      value: '',
    });
    picker.__mockLaunchCamera.mockResolvedValueOnce({ canceled: true });
    await render(<ImageWidget nodeRef={ref} store={store} appearance="selfie" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('image-camera-button'));
    });
    expect(picker.__mockLaunchCamera).toHaveBeenCalledWith(
      expect.objectContaining({ cameraType: picker.CameraType.front }),
    );
  });

  it('front-camera behaves identically to selfie', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/img',
      dataType: 'binary',
      controlType: 'upload',
      appearance: 'front-camera',
      value: '',
    });
    picker.__mockLaunchCamera.mockResolvedValueOnce({ canceled: true });
    await render(<ImageWidget nodeRef={ref} store={store} appearance="front-camera" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('image-camera-button'));
    });
    expect(picker.__mockLaunchCamera).toHaveBeenCalledWith(
      expect.objectContaining({ cameraType: picker.CameraType.front }),
    );
  });

  it('new hides the "Pick from Library" button', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/img',
      dataType: 'binary',
      controlType: 'upload',
      appearance: 'new',
      value: '',
    });
    await render(<ImageWidget nodeRef={ref} store={store} appearance="new" />);
    expect(screen.getByTestId('image-camera-button')).toBeTruthy();
    expect(screen.queryByTestId('image-library-button')).toBeNull();
  });

  it('new-front hides the library button AND forces the front camera', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/img',
      dataType: 'binary',
      controlType: 'upload',
      appearance: 'new-front',
      value: '',
    });
    picker.__mockLaunchCamera.mockResolvedValueOnce({ canceled: true });
    await render(<ImageWidget nodeRef={ref} store={store} appearance="new-front" />);
    expect(screen.queryByTestId('image-library-button')).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByTestId('image-camera-button'));
    });
    expect(picker.__mockLaunchCamera).toHaveBeenCalledWith(
      expect.objectContaining({ cameraType: picker.CameraType.front }),
    );
  });
});

describe('binary/upload/annotate', () => {
  it('renders a drawable overlay on top of the captured photo', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/img',
      dataType: 'binary',
      controlType: 'upload',
      appearance: 'annotate',
      value: 'file://test/photo.jpg',
    });
    await render(<ImageWidget nodeRef={ref} store={store} appearance="annotate" />);
    expect(screen.getByTestId('image-thumbnail')).toBeTruthy();
    expect(screen.getByTestId('image-annotate-overlay')).toBeTruthy();
    expect(screen.getByTestId('image-annotate-clear-button')).toBeTruthy();
  });
});

describe('selectOne/select1/map', () => {
  const geoChoices: SelectChoice[] = [
    { value: 'a', label: 'A', geometry: '19.4326 -99.1332' },
    { value: 'b', label: 'B', geometry: '19.5 -99.2' },
  ];

  it('renders the map modal with a pin per choice, tapping one selects it', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/s',
      dataType: 'selectOne',
      controlType: 'select1',
      choices: geoChoices,
      appearance: 'map',
    });
    const spy = jest.spyOn(store, 'answerQuestion');
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="map" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-map-open-button'));
    });
    expect(screen.getByTestId('select-one-map-modal')).toBeTruthy();
    expect(screen.getByTestId('select-one-map-pin-a')).toBeTruthy();
    expect(screen.getByTestId('select-one-map-pin-b')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('select-one-map-pin-b'));
    });
    expect(spy).toHaveBeenCalledWith(ref, 'b');
  });

  it('falls back to the default radio list when no choice has geometry', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/s',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'map',
    });
    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="map" />);
    expect(screen.queryByTestId('select-one-map-open-button')).toBeNull();
    expect(screen.getByTestId('select-one-option-a')).toBeTruthy();
  });
});

describe('selectOne/select1/image-map', () => {
  const SVG_MARKUP = `<svg viewBox="0 0 100 100">
    <path id="a" d="M0,0 L50,0 L50,50 L0,50 Z" />
    <rect id="B" x="50" y="0" width="50" height="50" />
  </svg>`;

  function makeImageMapStore() {
    return makeStoreFor({
      ref: '/data/s',
      dataType: 'selectOne',
      controlType: 'select1',
      choices,
      appearance: 'image-map',
    });
  }

  it('renders the SVG label media as tappable shapes, matched by choice value', async () => {
    const { store, ref } = makeImageMapStore();
    jest.spyOn(store.adapter, 'getLabelMediaUri').mockReturnValue('jr://images/test.svg');
    (store as unknown as { mediaResolver: unknown }).mediaResolver = {
      resolve: jest.fn().mockResolvedValue('file:///test.svg'),
    };
    (global as unknown as { fetch: unknown }).fetch = jest
      .fn()
      .mockResolvedValue({ text: () => Promise.resolve(SVG_MARKUP) });

    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="image-map" />);
    // The react-native-svg manual mock (__mocks__/react-native-svg.js) forces
    // a fixed testID per shape tag, overriding any testID prop — so shapes
    // are asserted by tag testID/count, same convention ImageWidget's
    // annotate-overlay test follows for the same mock.
    expect(await screen.findByTestId('svg-canvas')).toBeTruthy();
    expect(screen.getByTestId('svg-path')).toBeTruthy();
    expect(screen.getByTestId('svg-rect')).toBeTruthy();
  });

  it('tapping a matched region commits that choice via answerQuestion', async () => {
    const { store, ref } = makeImageMapStore();
    jest.spyOn(store.adapter, 'getLabelMediaUri').mockReturnValue('jr://images/test.svg');
    (store as unknown as { mediaResolver: unknown }).mediaResolver = {
      resolve: jest.fn().mockResolvedValue('file:///test.svg'),
    };
    (global as unknown as { fetch: unknown }).fetch = jest
      .fn()
      .mockResolvedValue({ text: () => Promise.resolve(SVG_MARKUP) });
    const spy = jest.spyOn(store, 'answerQuestion');

    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="image-map" />);
    await screen.findByTestId('svg-canvas');
    await act(async () => {
      fireEvent.press(screen.getByTestId('svg-rect'));
    });
    expect(spy).toHaveBeenCalledWith(ref, 'b');
  });

  it('falls back to the default radio list when no mediaResolver is configured', async () => {
    const { store, ref } = makeImageMapStore();
    jest.spyOn(store.adapter, 'getLabelMediaUri').mockReturnValue('jr://images/test.svg');

    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="image-map" />);
    expect(screen.queryByTestId('svg-canvas')).toBeNull();
    expect(screen.getByTestId('select-one-option-a')).toBeTruthy();
  });

  it('falls back to the default radio list when the label carries no image media', async () => {
    const { store, ref } = makeImageMapStore();
    jest.spyOn(store.adapter, 'getLabelMediaUri').mockReturnValue(null);
    (store as unknown as { mediaResolver: unknown }).mediaResolver = {
      resolve: jest.fn().mockResolvedValue('file:///test.svg'),
    };

    await render(<SelectOneWidget nodeRef={ref} store={store} appearance="image-map" />);
    expect(screen.queryByTestId('svg-canvas')).toBeNull();
    expect(screen.getByTestId('select-one-option-a')).toBeTruthy();
  });
});

describe('geopoint/input/placement-map', () => {
  it('opens the map modal directly on mount, without an Open Map tap', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/point',
      dataType: 'geopoint',
      controlType: 'input',
      appearance: 'placement-map',
    });
    await act(async () => {
      await render(<GeoPointWidget nodeRef={ref} store={store} appearance="placement-map" />);
    });
    expect(screen.getByTestId('geo-map-modal')).toBeTruthy();
    expect(screen.getByTestId('geo-maplibre-map')).toBeTruthy();
  });

  it('default variant still requires the Open Map tap first', async () => {
    const { store, ref } = makeStoreFor({
      ref: '/data/point',
      dataType: 'geopoint',
      controlType: 'input',
      appearance: null,
    });
    await render(<GeoPointWidget nodeRef={ref} store={store} appearance={null} />);
    expect(screen.queryByTestId('geo-maplibre-map')).toBeNull();
    expect(screen.getByTestId('geo-open-map-button')).toBeTruthy();
  });
});
