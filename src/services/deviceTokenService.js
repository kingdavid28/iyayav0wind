import { Platform } from 'react-native';
import { tokenManager } from '../utils/tokenManager';
import { logger } from '../utils/logger';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ? `${process.env.EXPO_PUBLIC_API_URL}/api`
  : __DEV__
  ? 'http://localhost:5000/api'
  : 'http://192.168.1.9:5000/api';

const request = async (endpoint, { method = 'POST', body } = {}) => {
  const token = await tokenManager.getValidToken(false);

  if (!token) {
    throw new Error('Authentication required to register device token');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const message = errorText || `Device token request failed with status ${response.status}`;
    throw new Error(message);
  }

  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const normalisePlatform = (platformOverride) => {
  const platform = platformOverride || Platform.OS || 'unknown';
  if (platform === 'ios' || platform === 'android' || platform === 'web') {
    return platform;
  }
  return 'unknown';
};

export const deviceTokenService = {
  async registerDeviceToken(token, platformOverride) {
    if (!token) {
      throw new Error('Cannot register empty device token');
    }

    try {
      await request('/users/device-token', {
        method: 'POST',
        body: {
          token,
          platform: normalisePlatform(platformOverride),
        },
      });
      logger.info?.('Device token registered');
    } catch (error) {
      logger.error?.('Failed to register device token', error);
      throw error;
    }
  },

  async removeDeviceToken(token) {
    try {
      await request('/users/device-token', {
        method: 'DELETE',
        body: token ? { token } : undefined,
      });
      logger.info?.('Device token removed');
    } catch (error) {
      logger.error?.('Failed to remove device token', error);
      throw error;
    }
  },
};
