// Manual mock for @react-native-community/datetimepicker (optional peer dep)
// Not installed as a real dependency; this file only satisfies module
// resolution so DateWidget.absent/picker tests can `jest.mock(...)` it
// without the real package present in node_modules.
const React = require('react');
const { View } = require('react-native');

const DateTimePicker = React.forwardRef((props, ref) => {
  return React.createElement(View, { testID: props.testID ?? 'date-native-picker' });
});

module.exports = {
  __esModule: true,
  default: DateTimePicker,
};
