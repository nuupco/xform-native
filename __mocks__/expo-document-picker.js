// Manual mock for expo-document-picker (optional peer dep)
const getDocumentAsync = jest.fn();

module.exports = {
  getDocumentAsync,
  __mockGetDocument: getDocumentAsync,
};
