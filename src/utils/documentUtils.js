import * as DocumentPicker from 'expo-document-picker';

export const pickDocument = async (allowedTypes = ['application/pdf', 'image/*']) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: allowedTypes,
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Document picker error:', error);
    throw error;
  }
};
