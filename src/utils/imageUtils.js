// src/utils/imageUtils.js
import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Config } from '../core/config/environment';

const apiBaseUrl = Config.API_BASE_URL || '';
const uploadBaseUrl = apiBaseUrl.replace(/\/api$/, '') || apiBaseUrl;

const buildUploadUrl = (path) => {
  if (!path) {
    return null;
  }

  if (!uploadBaseUrl) {
    return null;
  }

  const normalizedPath = path.startsWith('/uploads/')
    ? path
    : path.startsWith('/')
      ? `/uploads${path}`
      : path.startsWith('uploads/')
        ? `/${path}`
        : `/uploads/${path}`;

  return `${uploadBaseUrl}${normalizedPath}`;
};

export const getProfileImageUrl = (user) => {
  try {
    if (!user) {
      return null;
    }

    const { profileImage, avatar, photoURL, photoUrl } = user;
    let imageUrl = profileImage || avatar || photoURL || photoUrl || null;

    if (!imageUrl) {
      return null;
    }

    if (typeof imageUrl !== 'string') {
      console.warn('Invalid image URL provided:', imageUrl);
      return null;
    }

    const trimmedUrl = imageUrl.trim();

    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('data:')) {
      return trimmedUrl;
    }

    const resolvedUrl = buildUploadUrl(trimmedUrl);
    if (resolvedUrl) {
      return resolvedUrl;
    }

    console.warn(`Unable to resolve image path: ${trimmedUrl}`);
    return null;
  } catch (error) {
    console.error('Error getting profile image URL:', error);
    return null;
  }
};

/**
 * Download and cache an image
 * @param {string} uri - Remote image URI
 * @returns {Promise<string>} Local file URI
 */
export const cacheImage = async (uri) => {
  try {
    if (!uri) return null;

    // If it's a local file, return as is
    if (uri.startsWith('file://') || uri.startsWith('http://localhost')) {
      return uri;
    }

    // For remote images, download and cache
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const cacheDir = FileSystem.cacheDirectory + 'cached_images/';
    const localUri = cacheDir + filename;

    // Ensure directory exists
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });

    // Check if file is already cached
    const fileInfo = await FileSystem.getInfoAsync(localUri);

    if (!fileInfo.exists) {
      // Download and save the file
      await FileSystem.downloadAsync(uri, localUri);
    }

    return localUri;
  } catch (error) {
    console.error('Error caching image:', error);
    return uri; // Return original URI if caching fails
  }
};

/**
 * Preload images for better performance
 * @param {Array<string>} imageUris - Array of image URIs to preload
 */
export const preloadImages = async (imageUris) => {
  try {
    const cachePromises = imageUris.map(uri => cacheImage(uri));
    return await Promise.all(cachePromises);
  } catch (error) {
    console.error('Error preloading images:', error);
    return [];
  }
};

/**
 * Get image dimensions
 * @param {string} uri - Image URI
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export const getImageDimensions = (uri) => {
  return new Promise((resolve, reject) => {
    if (!uri) {
      reject(new Error('No URI provided'));
      return;
    }

    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => {
        console.error('Error getting image dimensions:', error);
        reject(error);
      }
    );
  });
};

/**
 * Get a placeholder image source when no profile image is available
 * @returns {Object} Image source object with a placeholder
 */
export const getPlaceholderImage = () => {
  // Return a simple placeholder object that can be used with Image component
  return {
    uri: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#F3F4F6"/>
        <circle cx="50" cy="40" r="15" fill="#9CA3AF"/>
        <path d="M30 80 C30 70, 70 70, 70 80" fill="#9CA3AF"/>
      </svg>
    `)
  };
};

/**
 * Get image source object for React Native Image component
 * @param {Object|string} userOrUrl - User object containing profile image info or direct URL string
 * @param {Object} options - Additional options for image source
 * @returns {Object} Image source object compatible with React Native Image
 */
export const getImageSource = (userOrUrl, options = {}) => {
  try {
    const { width = 100, height = 100, cache = false } = options;

    let imageUrl = null;

    // Check if first parameter is a user object or a direct URL
    if (typeof userOrUrl === 'string') {
      // It's a direct URL string (might be relative)
      imageUrl = userOrUrl.trim();

      if (
        imageUrl &&
        !imageUrl.startsWith('http://') &&
        !imageUrl.startsWith('https://') &&
        !imageUrl.startsWith('data:')
      ) {
        const resolvedUrl = buildUploadUrl(imageUrl);
        if (resolvedUrl) {
          imageUrl = resolvedUrl;
        }
      }
    } else if (userOrUrl && typeof userOrUrl === 'object') {
      // It's a user object - get the profile image URL
      imageUrl = getProfileImageUrl(userOrUrl);
    }

    if (!imageUrl || imageUrl.trim() === '' || imageUrl === 'null') {
      // Return placeholder if no image available
      return getPlaceholderImage();
    }

    // If caching is requested, cache the image first
    if (cache) {
      return cacheImage(imageUrl).then(cachedUri => ({
        uri: cachedUri,
        width,
        height,
        ...options
      })).catch(() => getPlaceholderImage());
    }

    // Return direct image source
    return {
      uri: imageUrl,
      width,
      height,
      ...options
    };
  } catch (error) {
    console.error('Error getting image source:', error);
    return getPlaceholderImage();
  }
};

// Export default object for easier imports
export default {
  getProfileImageUrl,
  cacheImage,
  preloadImages,
  getImageDimensions,
  getPlaceholderImage,
  getImageSource,
};