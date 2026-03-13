import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_PREFERENCES,
  createInitialState,
  normalizeChat,
  normalizeHandleList,
  normalizeListeningHistory,
  normalizeList,
  normalizeNotification,
  normalizeReport,
  normalizeReview,
  normalizeUser,
} from '../data/appState';

const APP_STATE_KEY = '@bside/app-state';
const APP_STATE_VERSION = 4;

const normalizeState = (rawState = {}) => {
  const initialState = createInitialState();

  return {
    currentUser: normalizeUser(
      rawState.currentUser || initialState.currentUser
    ),
    lists: Array.isArray(rawState.lists)
      ? rawState.lists.map((list) => normalizeList(list))
      : initialState.lists,
    reviews: Array.isArray(rawState.reviews)
      ? rawState.reviews.map((review) => normalizeReview(review))
      : initialState.reviews,
    listeningHistory: normalizeListeningHistory(
      rawState.listeningHistory || initialState.listeningHistory
    ),
    top5: Array.isArray(rawState.top5) ? rawState.top5 : initialState.top5,
    chats: Array.isArray(rawState.chats)
      ? rawState.chats.map((chat) => normalizeChat(chat))
      : initialState.chats,
    notifications: Array.isArray(rawState.notifications)
      ? rawState.notifications.map((notification) =>
          normalizeNotification(notification)
        )
      : initialState.notifications,
    followingHandles: normalizeHandleList(
      rawState.followingHandles || initialState.followingHandles
    ),
    blockedHandles: normalizeHandleList(
      rawState.blockedHandles || initialState.blockedHandles
    ),
    reports: Array.isArray(rawState.reports)
      ? rawState.reports.map((report) => normalizeReport(report))
      : initialState.reports,
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...(rawState.preferences || initialState.preferences),
    },
  };
};

export async function loadAppState() {
  try {
    const rawState = await AsyncStorage.getItem(APP_STATE_KEY);

    if (!rawState) {
      return createInitialState();
    }

    const parsedState = JSON.parse(rawState);
    return normalizeState(parsedState?.data || parsedState);
  } catch (error) {
    console.error('No pudimos recuperar el estado local:', error);
    return createInitialState();
  }
}

export async function saveAppState(state) {
  const payload = {
    version: APP_STATE_VERSION,
    data: normalizeState(state),
  };

  await AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(payload));
}
