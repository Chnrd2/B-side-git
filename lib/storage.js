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
  normalizeWishlist,
} from '../data/appState';

const APP_STATE_KEY = '@bside/app-state';
const APP_STATE_VERSION = 9;
const DEFAULT_SCOPE_KEY = 'guest';
const ENTRY_SCOPE_KEY = 'entry';

const migrateLegacyDemoIdentity = (rawUser = {}) => {
  if (
    rawUser?.id === 'user-me' &&
    rawUser?.name === 'Marianitooo' &&
    rawUser?.handle === 'marianitooo' &&
    !rawUser?.email
  ) {
    return {
      ...rawUser,
      name: 'Tu lado B',
      handle: 'tu_lado_b',
    };
  }

  return rawUser;
};

const normalizeState = (rawState = {}) => {
  const initialState = createInitialState();

  return {
    currentUser: normalizeUser(
      migrateLegacyDemoIdentity(rawState.currentUser || initialState.currentUser)
    ),
    lists: Array.isArray(rawState.lists)
      ? rawState.lists.map((list) => normalizeList(list))
      : initialState.lists,
    wishlist: normalizeWishlist(rawState.wishlist || initialState.wishlist),
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

const createEmptyMeta = () => ({
  hasStoredSnapshot: false,
  savedAt: '',
});

const createEmptySnapshot = () => ({
  ...createInitialState(),
  __meta: createEmptyMeta(),
});

const normalizeScopeKey = (scope = DEFAULT_SCOPE_KEY) =>
  `${scope}`.trim() || DEFAULT_SCOPE_KEY;

const isLegacySnapshot = (value = {}) =>
  Boolean(value?.data || value?.currentUser || value?.preferences);

const createPersistedContainer = () => ({
  version: APP_STATE_VERSION,
  scopes: {},
});

const toNormalizedSnapshot = (rawSnapshot = {}) => ({
  ...normalizeState(rawSnapshot?.data || rawSnapshot),
  __meta: {
    hasStoredSnapshot: true,
    savedAt: rawSnapshot?.savedAt || '',
  },
});

const migrateLegacyContainer = (parsedState = {}) => {
  const container = createPersistedContainer();
  const rawSnapshot = parsedState?.data || parsedState;
  const legacyUserId = rawSnapshot?.currentUser?.id || '';
  const scopeKey =
    legacyUserId && legacyUserId !== 'user-me'
      ? `user:${legacyUserId}`
      : DEFAULT_SCOPE_KEY;

  container.scopes[scopeKey] = {
    savedAt: parsedState?.savedAt || '',
    data: normalizeState(rawSnapshot),
  };

  return container;
};

const parsePersistedState = (rawState) => {
  if (!rawState) {
    return null;
  }

  const parsedState = JSON.parse(rawState);

  if (isLegacySnapshot(parsedState)) {
    return migrateLegacyContainer(parsedState);
  }

  return {
    ...createPersistedContainer(),
    ...parsedState,
    scopes: {
      ...(parsedState?.scopes || {}),
    },
  };
};

export async function loadAppState(options = {}) {
  const scopeKey = normalizeScopeKey(options.scope);

  try {
    const rawState = await AsyncStorage.getItem(APP_STATE_KEY);
    const parsedState = parsePersistedState(rawState);

    if (!parsedState) {
      return createEmptySnapshot();
    }

    const scopedSnapshot = parsedState.scopes?.[scopeKey];

    if (!scopedSnapshot) {
      return createEmptySnapshot();
    }

    return toNormalizedSnapshot(scopedSnapshot);
  } catch (error) {
    console.error('No pudimos recuperar el estado local:', error);
    return createEmptySnapshot();
  }
}

export async function saveAppState(state, options = {}) {
  const scopeKey = normalizeScopeKey(options.scope);
  const rawState = await AsyncStorage.getItem(APP_STATE_KEY);
  const parsedState = parsePersistedState(rawState) || createPersistedContainer();

  parsedState.version = APP_STATE_VERSION;
  parsedState.scopes[scopeKey] = {
    savedAt: new Date().toISOString(),
    data: normalizeState(state),
  };

  await AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(parsedState));
}

export { DEFAULT_SCOPE_KEY, ENTRY_SCOPE_KEY };
