/**
 * FileWidget persistence tests — S2/S4(a): proves the picked document URI is
 * copied into persistent on-device storage and that the stored answer value
 * is a bare filename (not the raw picker URI, not path-qualified). Covers
 * the same pattern as ImageWidget.persistence.test.tsx — VideoWidget and
 * AudioWidget follow the identical `persistMediaFile` call shape.
 *
 * `expo-file-system/legacy` mocking pattern mirrors
 * `src/__tests__/integration/satelliteTileCache.test.ts`.
 */
import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { FormSessionStore } from '../../store/FormSessionStore';
import { makeFakeSession } from '../../test-support/makeFakeSession';
import { FileWidget } from '../../widgets/FileWidget';

const mockFs = {
  documentDirectory: 'file:///mock-documents/',
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
};

jest.mock('expo-file-system/legacy', () => mockFs, { virtual: true });

const docPicker = require('expo-document-picker');

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
  mockFs.makeDirectoryAsync.mockResolvedValue(undefined);
  mockFs.copyAsync.mockResolvedValue(undefined);
});

function makeStore() {
  return new FormSessionStore(
    makeFakeSession({
      events: [
        { kind: 'bof' },
        {
          kind: 'question',
          ref: '/data/file',
          dataType: 'binary',
          controlType: 'upload',
          label: 'File',
          hint: null,
          appearance: null,
        },
        { kind: 'eof' },
      ],
      nodeStates: {
        '/data/file': {
          relevant: true,
          enabled: true,
          required: false,
          readonly: false,
          constraintMsg: null,
          calculatedValue: null,
        },
      },
      relevance: { '/data/file': true },
      choices: {},
      answerResults: { '/data/file': AnswerResult.OK },
      values: { '/data/file': '' },
    }),
  );
}

function getRef(store: FormSessionStore) {
  const ev = store.adapter.getCurrentEvent();
  if (ev.kind !== 'question') throw new Error('expected question');
  return ev;
}

describe('FileWidget persistence (S2/S4a)', () => {
  it('copies the picked document URI into the persistent xform-media directory', async () => {
    docPicker.__mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///cache/DocumentPicker/report.pdf' }],
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    await render(<FileWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('file-pick-button'));
    });

    expect(mockFs.copyAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'file:///cache/DocumentPicker/report.pdf',
        to: expect.stringContaining('file:///mock-documents/xform-media/'),
      }),
    );
  });

  it('stores a bare filename (not the raw URI, not path-qualified) as the answer value', async () => {
    docPicker.__mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///cache/DocumentPicker/report.pdf' }],
    });
    const store = makeStore();
    store.stepForward();
    const ev = getRef(store);
    const answerSpy = jest.spyOn(store, 'answerQuestion');
    await render(<FileWidget nodeRef={ev.ref} store={store} appearance={ev.appearance} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('file-pick-button'));
    });

    expect(answerSpy).toHaveBeenCalledTimes(1);
    const storedValue = answerSpy.mock.calls[0][1] as string;
    expect(storedValue).not.toContain('/');
    expect(storedValue).not.toContain('file://');
    expect(storedValue.startsWith('jr://')).toBe(false);
    expect(storedValue.endsWith('.pdf')).toBe(true);
  });
});
