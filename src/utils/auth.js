import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAuthToken = async () => {
  try {
    // Import STORAGE_KEYS to use the correct key
    const { STORAGE_KEYS } = await import('../config/constants');
    
    // Try the official storage key first, then fallbacks
    const tokenKeys = [STORAGE_KEYS.AUTH_TOKEN, 'authToken', 'token', 'userToken', 'accessToken', 'jwt'];
    
    for (const key of tokenKeys) {
      const token = await AsyncStorage.getItem(key);
      if (token) {
        console.log(`Found token with key: ${key}`);
        return token;
      }
    }
    
    console.warn('No auth token found in AsyncStorage');
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const setAuthToken = async (token) => {
  try {
    const { STORAGE_KEYS } = await import('../config/constants');
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

export const removeAuthToken = async () => {
  try {
    const { STORAGE_KEYS } = await import('../config/constants');
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};