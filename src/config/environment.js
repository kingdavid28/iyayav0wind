// Environment configuration for production security
import Constants from 'expo-constants';

const ENV = {
  development: {
    API_URL: 'http://192.168.1.9:5000/api',
    SOCKET_URL: 'http://192.168.1.9:5000',
    ANALYTICS_ENABLED: false,
    DEBUG_MODE: true,
  },
  production: {
    API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.iyaya.app/api',
    SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || 'https://api.iyaya.app',
    ANALYTICS_ENABLED: true,
    DEBUG_MODE: false,
  }
};

const getEnvVars = () => {
  const releaseChannel = Constants.expoConfig?.releaseChannel;
  
  if (__DEV__) {
    return ENV.development;
  } else if (releaseChannel === 'production') {
    return ENV.production;
  } else {
    return ENV.development;
  }
};

export default getEnvVars();