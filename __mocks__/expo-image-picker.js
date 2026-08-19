// Manual mock for expo-image-picker (optional peer dep)
const launchCameraAsync = jest.fn();
const launchImageLibraryAsync = jest.fn();

const grantedPermission = {
  status: 'granted',
  granted: true,
  canAskAgain: true,
  expires: 'never',
};

const getCameraPermissionsAsync = jest.fn().mockResolvedValue(grantedPermission);
const requestCameraPermissionsAsync = jest.fn().mockResolvedValue(grantedPermission);
const getMediaLibraryPermissionsAsync = jest.fn().mockResolvedValue(grantedPermission);
const requestMediaLibraryPermissionsAsync = jest.fn().mockResolvedValue(grantedPermission);

module.exports = {
  launchCameraAsync,
  launchImageLibraryAsync,
  getCameraPermissionsAsync,
  requestCameraPermissionsAsync,
  getMediaLibraryPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
  UIImagePickerControllerQualityType: { High: 1, Medium: 0.5, Low: 0.3 },
  __mockLaunchCamera: launchCameraAsync,
  __mockLaunchLibrary: launchImageLibraryAsync,
};
