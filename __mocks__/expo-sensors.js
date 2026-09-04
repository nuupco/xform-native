// Manual mock for expo-sensors (optional peer dep)
let listener = null;

const addListener = jest.fn((cb) => {
  listener = cb;
  return { remove: jest.fn(() => { listener = null; }) };
});

module.exports = {
  Magnetometer: {
    addListener,
  },
  __emitMagnetometer: (data) => {
    if (listener) listener(data);
  },
};
