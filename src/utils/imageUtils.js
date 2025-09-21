// Image utilities for proper URL construction
import { getCurrentAPIURL } from '../services';

/**
 * Constructs a proper image URL from a relative path
 * @param {string} imagePath - The image path (could be relative or absolute)
 * @returns {string} - Properly formatted image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Get base URL without /api suffix
  const apiUrl = getCurrentAPIURL();
  const baseUrl = apiUrl.replace('/api', '');
  
  // Simple concatenation and fix double slashes
  const finalUrl = `${baseUrl}${imagePath}`.replace(/([^:])\/{2,}/g, '$1/');
  
  console.log('🖼️ Image URL construction:', {
    originalPath: imagePath,
    apiUrl,
    baseUrl,
    finalUrl
  });
  
  return finalUrl;
};

/**
 * Gets the best available profile image URL from various possible fields
 * @param {object} user - User object that might contain profile image in different fields
 * @returns {string|null} - Best available image URL or null
 */
export const getProfileImageUrl = (user) => {
  if (!user) return null;
  
  // Try different possible image field names in priority order
  const imagePaths = [
    user.photoURL,
    user.avatar,
    user.profileImage,
    user.imageUrl,
    user.image,
    user.photoUrl,
    user.user?.profileImage,
    user.user?.photoURL,
    user.user?.avatar,
    // Handle nested caregiver data structure from applications
    user.caregiverId?.profileImage,
    user.caregiverId?.avatar,
    user.caregiverId?.photoURL,
    user.caregiverId?.imageUrl,
    user.caregiverId?.image
  ];
  
  // Debug logging
  console.log('🖼️ Profile image search:', {
    user: user,
    availablePaths: imagePaths.filter(Boolean)
  });
  
  for (const imagePath of imagePaths) {
    if (imagePath) {
      const finalUrl = getImageUrl(imagePath);
      console.log('🖼️ Found profile image:', { imagePath, finalUrl });
      return finalUrl;
    }
  }
  
  console.log('🖼️ No profile image found for user');
  return null;
};