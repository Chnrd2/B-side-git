import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const STREAK_NOTIFICATION_KEY = '@bside/streak-notification-id';

const isWeb = Platform.OS === 'web';
const isExpoGoAndroid =
  Platform.OS === 'android' &&
  (Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === 'storeClient');
let cachedDeviceModule = null;
let cachedNotificationsModule = null;
let hasInitializedNotificationHandler = false;

const getBrowserNotificationApi = () =>
  typeof globalThis !== 'undefined' ? globalThis.Notification : null;

const getDeviceModule = () => {
  if (isWeb) {
    return null;
  }

  if (!cachedDeviceModule) {
    cachedDeviceModule = require('expo-device');
  }

  return cachedDeviceModule;
};

const getNotificationsModule = () => {
  if (isWeb) {
    return null;
  }

  if (!cachedNotificationsModule) {
    cachedNotificationsModule = require('expo-notifications');
  }

  if (
    !hasInitializedNotificationHandler &&
    cachedNotificationsModule?.setNotificationHandler
  ) {
    cachedNotificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    hasInitializedNotificationHandler = true;
  }

  return cachedNotificationsModule;
};

export const getPushSupportStatus = () => ({
  isWeb,
  isDevice: Boolean(getDeviceModule()?.isDevice),
  hasBrowserNotifications: Boolean(isWeb && getBrowserNotificationApi()),
});

export async function registerForPushNotifications() {
  if (isWeb) {
    const browserNotificationApi = getBrowserNotificationApi();

    if (!browserNotificationApi) {
      return {
        ok: false,
        skipped: true,
        message: 'Este navegador no soporta notificaciones del sistema.',
      };
    }

    const permission = await browserNotificationApi.requestPermission();

    return {
      ok: permission === 'granted',
      permission,
      token: null,
      isWeb: true,
      message:
        permission === 'granted'
          ? 'Permisos web concedidos.'
          : 'No se concedieron permisos web.',
      };
  }

  if (isExpoGoAndroid) {
    return {
      ok: false,
      skipped: true,
      permission: 'skipped',
      message:
        'Expo Go en Android no soporta este flujo completo de push. Lo activamos mejor en la dev build.',
    };
  }

  const deviceModule = getDeviceModule();
  const notificationsModule = getNotificationsModule();

  if (!deviceModule?.isDevice || !notificationsModule) {
    return {
      ok: false,
      skipped: true,
      message: 'Las push nativas necesitan un dispositivo real.',
    };
  }

  let { status } = await notificationsModule.getPermissionsAsync();

  if (status !== 'granted') {
    const permissionResult = await notificationsModule.requestPermissionsAsync();
    status = permissionResult.status;
  }

  if (status !== 'granted') {
    return {
      ok: false,
      message: 'No se concedieron permisos para notificaciones.',
    };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  let token = null;

  if (projectId) {
    const tokenResult = await notificationsModule.getExpoPushTokenAsync({
      projectId,
    });
    token = tokenResult.data;
  }

  return {
    ok: true,
    permission: status,
    token,
    isWeb: false,
  };
}

export async function sendLocalNotification({
  title,
  body,
  data = {},
  delaySeconds = 0,
}) {
  if (!title || !body) {
    return { ok: false, skipped: true };
  }

  if (isExpoGoAndroid) {
    return {
      ok: false,
      skipped: true,
      message: 'Las notificaciones locales se habilitan mejor en la dev build de Android.',
    };
  }

  if (isWeb) {
    const browserNotificationApi = getBrowserNotificationApi();

    if (!browserNotificationApi) {
      return { ok: false, skipped: true };
    }

    if (browserNotificationApi.permission !== 'granted') {
      return { ok: false, skipped: true };
    }

    new browserNotificationApi(title, { body, data });
    return { ok: true, delivered: true };
  }

  const notificationsModule = getNotificationsModule();

  if (!notificationsModule) {
    return { ok: false, skipped: true };
  }

  const trigger =
    delaySeconds > 0
      ? {
          type: notificationsModule.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: delaySeconds,
        }
      : null;

  const identifier = await notificationsModule.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger,
  });

  return { ok: true, identifier };
}

export async function scheduleStreakWarning({ streakCount = 0 } = {}) {
  if (isWeb || isExpoGoAndroid) {
    return { ok: false, skipped: true };
  }

  const notificationsModule = getNotificationsModule();

  if (!notificationsModule) {
    return { ok: false, skipped: true };
  }

  const existingId = await AsyncStorage.getItem(STREAK_NOTIFICATION_KEY);

  if (existingId) {
    try {
      await notificationsModule.cancelScheduledNotificationAsync(existingId);
    } catch (error) {
      // Ignore stale ids.
    }
  }

  const triggerDate = new Date();
  triggerDate.setHours(21, 0, 0, 0);

  if (triggerDate.getTime() <= Date.now()) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  const identifier = await notificationsModule.scheduleNotificationAsync({
    content: {
      title: 'No dejes caer tu racha',
      body: `Tu racha de ${streakCount} d\u00edas sigue viva, pero hoy todav\u00eda no escuchaste nada en B-Side.`,
      data: { type: 'streak-warning' },
    },
    trigger: triggerDate,
  });

  await AsyncStorage.setItem(STREAK_NOTIFICATION_KEY, identifier);

  return { ok: true, identifier };
}

export async function cancelStreakWarning() {
  if (isWeb || isExpoGoAndroid) {
    return { ok: false, skipped: true };
  }

  const notificationsModule = getNotificationsModule();

  if (!notificationsModule) {
    return { ok: false, skipped: true };
  }

  const existingId = await AsyncStorage.getItem(STREAK_NOTIFICATION_KEY);

  if (!existingId) {
    return { ok: true, skipped: true };
  }

  try {
    await notificationsModule.cancelScheduledNotificationAsync(existingId);
  } catch (error) {
    // Ignore stale ids.
  }

  await AsyncStorage.removeItem(STREAK_NOTIFICATION_KEY);

  return { ok: true };
}

