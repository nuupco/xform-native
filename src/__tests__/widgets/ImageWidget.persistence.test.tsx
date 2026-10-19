/**
 * ImageWidget persistence tests — S2/S4(a): proves the captured picker URI
 * is copied into persistent on-device storage and that the stored answer
 * value is a bare filename (not the raw picker URI, not path-qualified).
 *
 * `expo-file-system/legacy` mocking pattern mirrors
 * `src/__tests__/integration/satelliteTileCache.test.ts`.
 */
import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession } from '../../test-support/makeFakeSession';
import { ImageWidget } from '../../widgets/ImageWidget';

const mockFs = {
  documentDirectory: 'file:///mock-documents/',
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
};

jest.mock('expo-file-system/legacy', () => mockFs, { virtual: true });

// Manual mock at src/__mocks__/expo-image-picker.js
const picker = require('expo-image-picker');

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
  mockFs.makeDirectoryAsync.mockResolvedValue(undefined);
  mockFs.copyAsync.mockResolvedValue(undefined);
});

function makeStore(value = '') {
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/img',
          dataType: 'binary',
          controlType: 'upload',
          label: 'Photo',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/img': {
          relevant: true,
          enabled: true,
          required: false,
          readonly: false,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/img': true },
      choices: {},
      answerResults: { '/data/img': AnswerResult.OK },
      values: { '/data/img': value },
    }),
  );
}

function getRef(store: FormSessionStore) {
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev;
}

describe('ImageWidget persistence (S2/S4a)', () => {
  it('copies the captured picker URI into the persistent xform-media directory', async () => {
    picker.__mockLaunchCamera.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///cache/ImagePicker/abc123.jpeg' }],
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(<ImageWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('image-camera-button'));
    });

    expect(mockFs.copyAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'file:///cache/ImagePicker/abc123.jpeg',
        to: expect.stringContaining('file:///mock-documents/xform-media/'),
      }),
    );
  });

  it('stores a bare filename (not the raw URI, not path-qualified) as the answer value', async () => {
    picker.__mockLaunchCamera.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///cache/ImagePicker/abc123.jpeg' }],
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(<ImageWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('image-camera-button'));
    });

    expect(answerSpy).toHaveBeenCalledTimes(1);
    const storedValue = answerSpy.mock.calls[0][1] as string;
    expect(storedValue).not.toContain('/');
    expect(storedValue).not.toContain('file://');
    expect(storedValue.startsWith('jr://')).toBe(false);
    expect(storedValue.endsWith('.jpeg')).toBe(true);
  });
});
