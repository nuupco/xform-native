// Manual mock for expo-av (optional peer dep)

const mockRecording = {
  prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
  startAsync: jest.fn().mockResolvedValue(undefined),
  stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined),
  getURI: jest.fn().mockReturnValue('file://recording.m4a'),
};

const mockSound = {
  playAsync: jest.fn().mockResolvedValue(undefined),
  unloadAsync: jest.fn().mockResolvedValue(undefined),
};

const Recording = jest.fn().mockImplementation(() => mockRecording);

const Sound = {
  createAsync: jest.fn().mockResolvedValue({ sound: mockSound }),
};

const RecordingOptionsPresets = {
  HIGH_QUALITY: {},
};

const Audio = {
  Recording,
  Sound,
  RecordingOptionsPresets,
};

module.exports = {
  Audio,
  __mockRecording: mockRecording,
  __mockSound: mockSound,
};
