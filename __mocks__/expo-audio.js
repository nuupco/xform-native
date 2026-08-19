// Manual mock for expo-audio (optional peer dep)

const mockRecorder = {
  uri: null,
  isRecording: false,
  prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
  record: jest.fn().mockImplementation(() => {
    mockRecorder.isRecording = true;
  }),
  stop: jest.fn().mockImplementation(() => {
    mockRecorder.isRecording = false;
    mockRecorder.uri = 'file://recording.m4a';
    return Promise.resolve();
  }),
  getStatus: jest.fn().mockReturnValue({}),
};

const mockPlayer = {
  playing: false,
  play: jest.fn(),
  pause: jest.fn(),
  replace: jest.fn(),
  remove: jest.fn(),
};

const useAudioRecorder = jest.fn().mockImplementation(() => mockRecorder);
const useAudioPlayer = jest.fn().mockImplementation(() => mockPlayer);

const RecordingPresets = {
  HIGH_QUALITY: {},
  LOW_QUALITY: {},
};

const grantedPermission = {
  status: 'granted',
  granted: true,
  canAskAgain: true,
  expires: 'never',
};

const getRecordingPermissionsAsync = jest.fn().mockResolvedValue(grantedPermission);
const requestRecordingPermissionsAsync = jest.fn().mockResolvedValue(grantedPermission);

module.exports = {
  useAudioRecorder,
  useAudioPlayer,
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  __mockRecorder: mockRecorder,
  __mockPlayer: mockPlayer,
};
