import { useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { deviceTokenService } from '../services/deviceTokenService';
import { logger } from '../utils/logger';

const PROJECT_ID =
  Constants?.expoConfig?.extra?.eas?.projectId ||
  Constants?.easConfig?.projectId ||
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  undefined;

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  }).catch((error) => {
    logger.warn?.('Failed to configure Android notification channel', error);
  });
}

const ensureNotificationHandlerConfigured = (() => {
  let configured = false;
  return () => {
    if (configured) return;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    configured = true;
  };
})();

export const usePushNotifications = () => {
  const registeredTokenRef = useRef(null);

  const getPermissionsAsync = useCallback(async () => {
    const settings = await Notifications.getPermissionsAsync();
    if (settings?.status === 'granted') {
      return settings.status;
    }

    const request = await Notifications.requestPermissionsAsync();
    return request.status;
  }, []);

  const ensureDeviceTokenRegistered = useCallback(async () => {
    ensureNotificationHandlerConfigured();

    const status = await getPermissionsAsync();
    if (status !== 'granted') {
      logger.warn?.('Push notification permission not granted');
      return null;
    }

    if (!PROJECT_ID) {
      logger.warn?.('Expo project ID missing; cannot fetch push token');
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
    const token = tokenResponse?.data;

    if (!token) {
      logger.warn?.('Expo push token unavailable');
      return null;
    }

    if (registeredTokenRef.current === token) {
      return token;
    }

    await deviceTokenService.registerDeviceToken(token, Platform.OS);
    registeredTokenRef.current = token;
    return token;
  }, [getPermissionsAsync]);

  const removeRegisteredDeviceToken = useCallback(async () => {
    try {
      await deviceTokenService.removeDeviceToken(registeredTokenRef.current || undefined);
    } finally {
      registeredTokenRef.current = null;
    }
  }, []);

  return useMemo(
    () => ({
      registerPushTokenForCurrentDevice: ensureDeviceTokenRegistered,
      removePushTokenForCurrentDevice: removeRegisteredDeviceToken,
    }),
    [ensureDeviceTokenRegistered, removeRegisteredDeviceToken]
  );
};

export default usePushNotifications;
