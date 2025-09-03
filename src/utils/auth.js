import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get the authentication token from AsyncStorage
 * @returns {Promise<string|null>} The auth token or null if not found
 */
export const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Set the authentication token in AsyncStorage
 * @param {string} token - The auth token to store
 * @returns {Promise<boolean>} Success status
 */
export const setAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem('authToken', token);
    return true;
  } catch (error) {
    console.error('Error setting auth token:', error);
    return false;
  }
};

/**
 * Remove the authentication token from AsyncStorage
 * @returns {Promise<boolean>} Success status
 */
export const removeAuthToken = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    return true;
  } catch (error) {
    console.error('Error removing auth token:', error);
    return false;
  }
};

/**
 * Check if user is authenticated by verifying token exists
 * @returns {Promise<boolean>} Authentication status
 */
export const isAuthenticated = async () => {
  try {
    const token = await getAuthToken();
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Get user data from AsyncStorage
 * @returns {Promise<object|null>} User data or null if not found
 */
export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Set user data in AsyncStorage
 * @param {object} userData - The user data to store
 * @returns {Promise<boolean>} Success status
 */
export const setUserData = async (userData) => {
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Error setting user data:', error);
    return false;
  }
};

/**
 * Clear all auth-related data from AsyncStorage
 * @returns {Promise<boolean>} Success status
 */
export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove(['authToken', 'userData']);
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};
