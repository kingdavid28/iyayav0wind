import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import { Platform, Image } from 'react-native';
import * as FileSystem from 'expo-file-system';

const MEDIA_TYPES_IMAGES = ['images'];

const defaultOptions = {
  mediaTypes: MEDIA_TYPES_IMAGES,
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
  base64: false,
  exif: false,
};

const withDefaultOptions = (options = {}) => ({
  ...defaultOptions,
  ...options,
  mediaTypes: options.mediaTypes || MEDIA_TYPES_IMAGES,
});

export const getCameraRollPermissions = async () => {
  if (Platform.OS !== 'web') {
    const { status } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);
    if (status !== 'granted') {
      throw new Error('Permission to access media library is required!');
    }
  }
  return true;
};

export const getCameraPermissions = async () => {
  if (Platform.OS !== 'web') {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    if (status !== 'granted') {
      throw new Error('Camera permission is required to take photos!');
    }
  }
  return true;
};

export const pickImage = async (options = {}) => {
  try {
    await getCameraRollPermissions();

    const result = await ImagePicker.launchImageLibraryAsync(withDefaultOptions(options));

    if (result.canceled) {
      throw new Error('User canceled image picker');
    }

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        cancelled: false,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type || 'image',
        base64: asset.base64,
      };
    }

    throw new Error('No image selected');
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

export const takePhoto = async (options = {}) => {
  try {
    await getCameraPermissions();

    const result = await ImagePicker.launchCameraAsync(withDefaultOptions(options));

    if (result.canceled) {
      throw new Error('User canceled taking photo');
    }

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        cancelled: false,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type || 'image',
        base64: asset.base64,
      };
    }

    throw new Error('Failed to take photo');
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

export const resizeImage = async (uri, maxWidth, maxHeight) => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      throw new Error('Image file not found');
    }

    const result = await ImagePicker.launchImageLibraryAsync(
      withDefaultOptions({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      })
    );

    if (result.canceled) {
      throw new Error('User canceled image resize');
    }

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      };
    }

    throw new Error('Failed to resize image');
  } catch (error) {
    console.error('Error resizing image:', error);
    throw error;
  }
};

export const imageToBase64 = async (uri) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

export const getImageInfo = async (uri) => {
  try {
    const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      await getCameraRollPermissions();
    }

    const info = await FileSystem.getInfoAsync(uri, { size: true });
    if (!info.exists) {
      throw new Error('Image file not found');
    }

    const dimensions = await new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        (error) => reject(error)
      );
    });

    return {
      uri,
      width: dimensions.width,
      height: dimensions.height,
      fileSize: info.size,
      fileUri: info.uri,
    };
  } catch (error) {
    console.error('Error getting image info:', error);
    throw error;
  }
};

export const compressImage = async (uri, options = {}) => {
  try {
    const { quality = 0.8, base64 = false } = options;

    const result = await ImagePicker.launchImageLibraryAsync(
      withDefaultOptions({
        allowsEditing: true,
        quality,
        base64,
      })
    );

    if (result.canceled) {
      throw new Error('User canceled image compression');
    }

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        base64: asset.base64,
      };
    }

    throw new Error('Failed to compress image');
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

export const deleteImage = async (uri) => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

export default {
  pickImage,
  takePhoto,
  resizeImage,
  imageToBase64,
  getImageInfo,
  compressImage,
  deleteImage,
  getCameraRollPermissions,
  getCameraPermissions,
};