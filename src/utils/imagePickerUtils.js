import * as ImagePicker from 'expo-image-picker';

// Safe ImagePicker utility to handle deprecated MediaTypeOptions
export const safeImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  quality: 0.8,
};

export const pickImageSafely = async (options = {}) => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission not granted');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      ...safeImagePickerOptions,
      ...options,
    });

    return result;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

export const takePictureSafely = async (options = {}) => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      ...safeImagePickerOptions,
      ...options,
    });

    return result;
  } catch (error) {
    console.error('Error taking picture:', error);
    throw error;
  }
};