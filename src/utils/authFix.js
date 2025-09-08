import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAuthData } from './auth';

export const fixAuthIssues = async () => {
  try {
    console.log('🔧 Fixing auth issues...');
    
    // Clear all corrupted auth data
    await clearAuthData();
    
    // Clear any additional storage keys that might be corrupted
    const additionalKeys = [
      'firebase:authUser:AIzaSyBH50MntSb5dIQllGoNyCXjx4yHqNFtEPw:[DEFAULT]',
      'firebase:authUser:AIzaSyC7Flwhydbq1qV3tw_QchXr8_5Wg0wOshk:[DEFAULT]',
      '@RNAsyncStorage_auth_token',
      '@RNAsyncStorage_user_profile',
      'userToken',
      'user_profile',
      'DEV_MODE',
      'ALLOW_MOCK_AUTH'
    ];
    
    await AsyncStorage.multiRemove(additionalKeys);
    
    console.log('✅ Auth data cleared successfully - please login again');
    return true;
  } catch (error) {
    console.error('❌ Failed to fix auth issues:', error);
    return false;
  }
};

export const enableDevMode = async () => {
  try {
    // Set development flags
    await AsyncStorage.setItem('DEV_MODE', 'true');
    await AsyncStorage.setItem('ALLOW_MOCK_AUTH', 'true');
    console.log('✅ Development mode enabled');
    return true;
  } catch (error) {
    console.error('❌ Failed to enable dev mode:', error);
    return false;
  }
};
