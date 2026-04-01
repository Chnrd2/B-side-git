import { Platform } from 'react-native';

let cachedHapticsModule = null;

const getHapticsModule = () => {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!cachedHapticsModule) {
    try {
      cachedHapticsModule = require('expo-haptics');
    } catch (error) {
      cachedHapticsModule = null;
    }
  }

  return cachedHapticsModule;
};

export const triggerSelectionFeedback = async () => {
  const haptics = getHapticsModule();

  if (!haptics?.selectionAsync) {
    return;
  }

  try {
    await haptics.selectionAsync();
  } catch (error) {
    // noop
  }
};

export const triggerSuccessFeedback = async () => {
  const haptics = getHapticsModule();

  if (!haptics?.notificationAsync || !haptics?.NotificationFeedbackType) {
    return;
  }

  try {
    await haptics.notificationAsync(
      haptics.NotificationFeedbackType.Success
    );
  } catch (error) {
    // noop
  }
};

export const triggerWarningFeedback = async () => {
  const haptics = getHapticsModule();

  if (!haptics?.notificationAsync || !haptics?.NotificationFeedbackType) {
    return;
  }

  try {
    await haptics.notificationAsync(
      haptics.NotificationFeedbackType.Warning
    );
  } catch (error) {
    // noop
  }
};

export const triggerErrorFeedback = async () => {
  const haptics = getHapticsModule();

  if (!haptics?.notificationAsync || !haptics?.NotificationFeedbackType) {
    return;
  }

  try {
    await haptics.notificationAsync(
      haptics.NotificationFeedbackType.Error
    );
  } catch (error) {
    // noop
  }
};
