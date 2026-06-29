// Manual mock for expo-image-picker (optional peer dep)
const launchCameraAsync = jest.fn();
const launchImageLibraryAsync = jest.fn();

module.exports = {
  launchCameraAsync,
  launchImageLibraryAsync,
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
  UIImagePickerControllerQualityType: { High: 1, Medium: 0.5, Low: 0.3 },
  __mockLaunchCamera: launchCameraAsync,
  __mockLaunchLibrary: launchImageLibraryAsync,
};
