import { Alert, Animated, Linking, Platform } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  CURRENT_USER_HANDLE,
  MOCK_USERS,
  buildDemoSocialGraph,
  buildViewedUser,
  createId,
  createInitialState,
  createListEntry,
  createRandomColor,
  normalizeComment,
  normalizeHandle,
  normalizeListeningEntry,
  normalizeList,
  normalizeNotification,
  normalizeReview,
} from '../data/appState';
import {
  PROFILE_ASSET_MODERATION,
  PROFILE_BUCKETS,
  reviewProfileAssetSource,
  shouldUploadProfileAsset,
  uploadProfileAsset,
} from '../lib/profileAssets';
import { fetchAlbumTracks, resolveAlbumPlayback } from '../lib/musicCatalog';
import {
  triggerErrorFeedback,
  triggerSelectionFeedback,
  triggerSuccessFeedback,
  triggerWarningFeedback,
} from '../lib/feedback';
import {
  cancelStreakWarning,
  getPushSupportStatus,
  registerForPushNotifications,
  scheduleStreakWarning,
  sendLocalNotification,
} from '../lib/pushNotifications';
import {
  getMusicOracleRecommendations,
  getMusicOracleStatus,
} from '../lib/musicOracle';
import { buildAchievementSummary } from '../lib/profileProgress';
import {
  completeSpotifyConnectFromUrl,
  consumePendingSpotifyExportList,
  disconnectSpotifyUser,
  exportListToSpotifyPlaylist,
  fetchSpotifyCurrentUser,
  getSpotifyFullPlaybackStatus,
  getSpotifyUserSession,
  setPendingSpotifyExportList,
  getSpotifyUserStatus,
  startSpotifyConnect,
} from '../lib/spotifyUser';
import {
  DEFAULT_SCOPE_KEY,
  ENTRY_SCOPE_KEY,
  loadAppState,
  saveAppState,
} from '../lib/storage';
import {
  createBackendNotification,
  checkHandleAvailability,
  consumeAuthRedirectUrl,
  createMessageRecord,
  getAuthenticatedProfileSnapshot,
  getSupabaseClient,
  createListRecord,
  createListeningEventRecord,
  createReviewCommentRecord,
  createReviewRecord,
  dismissBackendNotification,
  fetchBackendNotifications,
  fetchCommunityFeedReviews,
  fetchCommunityProfiles,
  fetchCurrentUserChats,
  fetchCurrentUserListeningHistory,
  fetchSocialSnapshot,
  fetchCurrentUserLists,
  fetchCurrentUserReviews,
  followProfileByHandle,
  getSupabaseStatus,
  markConversationMessagesAsRead,
  markBackendNotificationsAsRead,
  blockProfileByHandle,
  registerWithEmail,
  resendSignupVerificationEmail,
  replaceListItemsRecord,
  requestAccountDeletion,
  signInWithEmail,
  signOutOtherSessions,
  signOutSession,
  sendMagicLink,
  sendPasswordReset,
  submitProfileReport,
  sanitizeProfileHandle,
  unfollowProfileByHandle,
  unblockProfileByHandle,
  updateListRecord,
  updateReviewRecord,
  upsertProfile,
  deleteReviewRecord,
  toggleReviewLikeRecord,
  subscribeToUserMessages,
  subscribeToUserNotifications,
  upsertPushDeviceToken,
} from '../lib/supabase';

const initialState = createInitialState();
const DEBUG_LOGS_ENABLED = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

const getPersistenceScope = ({ sessionMode = 'guest', userId = '' } = {}) => {
  if (sessionMode === 'authenticated' && userId) {
    return `user:${userId}`;
  }

  if (sessionMode === 'guest') {
    return DEFAULT_SCOPE_KEY;
  }

  return ENTRY_SCOPE_KEY;
};

const mergeHandleCollections = (...collections) =>
  [...new Set(collections.flat().filter(Boolean).map((handle) => normalizeHandle(handle)))];

const mergeReportsById = (...collections) => {
  const reportMap = new Map();

  collections.flat().forEach((report) => {
    if (!report?.id) return;
    reportMap.set(report.id, report);
  });

  return Array.from(reportMap.values()).slice(0, 50);
};

const getEntityMergeKey = (entity = {}, prefix) =>
  entity?.backendId ? `${prefix}:${entity.backendId}` : `${prefix}:local:${entity.id}`;

const mergeEntitiesBySource = (prefix, primary = [], secondary = []) => {
  const entityMap = new Map();

  [...primary, ...secondary].forEach((entity) => {
    entityMap.set(getEntityMergeKey(entity, prefix), entity);
  });

  return Array.from(entityMap.values());
};

const mergeListeningCollections = (...collections) => {
  const entryMap = new Map();

  collections.flat().forEach((entry) => {
    const normalizedEntry = normalizeListeningEntry(entry);
    const entryKey = `${normalizedEntry.albumId}:${normalizedEntry.createdAt}`;
    entryMap.set(entryKey, normalizedEntry);
  });

  return Array.from(entryMap.values())
    .sort(
      (left, right) =>
        getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt)
    )
    .slice(0, 80);
};

const getChatHandleKey = (chat = {}) =>
  normalizeHandle(chat?.user?.handle || '');

const mergeChatCollections = (...collections) => {
  const chatMap = new Map();

  collections.flat().forEach((chat) => {
    const chatKey = getChatHandleKey(chat);

    if (!chatKey) {
      return;
    }

    const existingChat = chatMap.get(chatKey);

    if (!existingChat) {
      chatMap.set(chatKey, {
        ...chat,
        messages: [...(chat.messages || [])],
      });
      return;
    }

    const messageMap = new Map();

    [...existingChat.messages, ...(chat.messages || [])].forEach((message) => {
      const messageKey =
        message.backendId ||
        message.id ||
        `${message.sender}:${message.createdAt || message.time}:${message.text}`;
      messageMap.set(messageKey, message);
    });

    chatMap.set(chatKey, {
      ...existingChat,
      ...chat,
      unread: Math.max(existingChat.unread || 0, chat.unread || 0),
      messages: Array.from(messageMap.values()).sort(
        (left, right) =>
          getTimestampValue(left.createdAt) - getTimestampValue(right.createdAt)
      ),
    });
  });

  return Array.from(chatMap.values()).sort((left, right) => {
    const leftTime = getTimestampValue(
      left.messages[left.messages.length - 1]?.createdAt
    );
    const rightTime = getTimestampValue(
      right.messages[right.messages.length - 1]?.createdAt
    );

    return rightTime - leftTime;
  });
};

const getTimeLabel = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const getTimestampValue = (value) => {
  const nextTimestamp = value ? new Date(value).getTime() : 0;
  return Number.isNaN(nextTimestamp) ? 0 : nextTimestamp;
};

const getLocalDayKey = (value) => {
  const nextDate = value ? new Date(value) : null;

  if (!nextDate || Number.isNaN(nextDate.getTime())) {
    return '';
  }

  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(nextDate.getDate()).padStart(2, '0')}`;
};

const getDateFromDayKey = (dayKey = '') => {
  const [year, month, day] = dayKey.split('-').map((value) => Number(value));
  return new Date(year, month - 1, day);
};

const createAlbumKey = (title = '', artist = '') =>
  `${title}`.trim().toLowerCase() + `::${artist}`.trim().toLowerCase();

const createArtistKey = (artist = '') => `${artist}`.trim().toLowerCase();
const DEFAULT_HANDLE_CANDIDATES = new Set(['', 'tu_lado_b', 'user-me']);

const hasCompletedPublicProfile = (user = {}) => {
  const normalizedHandle = `${user?.handle || ''}`.trim().toLowerCase();

  if (DEFAULT_HANDLE_CANDIDATES.has(normalizedHandle) || normalizedHandle.length < 3) {
    return false;
  }

  return true;
};

const shuffleCollection = (items = []) =>
  [...items].sort(() => Math.random() - 0.5);

const buildAlbumReference = (album = {}) => ({
  albumId: `${album?.albumId || album?.id || ''}`.trim(),
  albumKey: createAlbumKey(
    album?.title || album?.albumTitle,
    album?.artist || album?.artistName
  ),
});

const matchesAlbumReference = (candidate = {}, reference = {}) => {
  const candidateAlbumId = `${candidate?.albumId || candidate?.id || ''}`.trim();

  if (reference.albumId && candidateAlbumId && candidateAlbumId === reference.albumId) {
    return true;
  }

  return (
    createAlbumKey(
      candidate?.title || candidate?.albumTitle,
      candidate?.artist || candidate?.artistName
    ) === reference.albumKey
  );
};

const mergePlayableTrackData = (item = {}, playableTrack = {}) => ({
  ...item,
  previewUrl: item?.previewUrl || playableTrack?.previewUrl || '',
  externalUrl: item?.externalUrl || playableTrack?.externalUrl || '',
  source: item?.source || playableTrack?.source || '',
});

const buildListeningStreakSummary = (history = []) => {
  const sortedHistory = [...history].sort(
    (left, right) =>
      getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt)
  );
  const uniqueDayKeys = [
    ...new Set(
      sortedHistory.map((entry) => getLocalDayKey(entry.createdAt)).filter(Boolean)
    ),
  ];
  const daySet = new Set(uniqueDayKeys);

  let current = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const todayKey = getLocalDayKey(today);
  const yesterdayKey = getLocalDayKey(yesterday);

  while (true) {
    const cursor = new Date(today);
    cursor.setDate(today.getDate() - current);

    if (!daySet.has(getLocalDayKey(cursor))) {
      break;
    }

    current += 1;
  }

  let longest = 0;
  let active = 0;
  let previousDay = null;

  [...uniqueDayKeys]
    .sort((left, right) => getTimestampValue(left) - getTimestampValue(right))
    .forEach((dayKey) => {
      const currentDay = getDateFromDayKey(dayKey);

      if (!previousDay) {
        active = 1;
      } else {
        const diffInDays = Math.round(
          (currentDay.getTime() - previousDay.getTime()) / (1000 * 60 * 60 * 24)
        );
        active = diffInDays === 1 ? active + 1 : 1;
      }

      longest = Math.max(longest, active);
      previousDay = currentDay;
    });

  return {
    current,
    longest,
    totalDays: uniqueDayKeys.length,
    totalPlays: history.length,
    hasPlayedToday: daySet.has(todayKey),
    hasPlayedYesterday: daySet.has(yesterdayKey),
    isAtRisk: !daySet.has(todayKey) && daySet.has(yesterdayKey),
    last7DaysCount: sortedHistory.filter(
      (entry) => Date.now() - getTimestampValue(entry.createdAt) <= 7 * 86400000
    ).length,
    lastEntry: sortedHistory[0] || null,
  };
};

const buildReviewFeedScore = (
  review,
  followingSet,
  currentUserHandle,
  ownTasteAlbumKeys,
  ownTasteArtistKeys
) => {
  const freshnessHours = Math.max(
    0,
    (Date.now() - getTimestampValue(review.createdAt)) / (1000 * 60 * 60)
  );
  const freshnessBoost = Math.max(0, 48 - freshnessHours);
  const isFromFollowed = followingSet.has(normalizeHandle(review.user));
  const isCurrentUserReview =
    normalizeHandle(review.user) === normalizeHandle(currentUserHandle);
  const albumKey = createAlbumKey(review.albumTitle, review.artist);
  const artistKey = `${review.artist || ''}`.trim().toLowerCase();
  const tasteBoost = ownTasteAlbumKeys.has(albumKey)
    ? 18
    : ownTasteArtistKeys.has(artistKey)
      ? 10
      : 0;

  return (
    review.likedBy.length * 3 +
    review.comments.length * 5 +
    (review.scratchedBy ? 2 : 0) +
    (review.contextType === 'while-listening' ? 8 : 0) +
    (isFromFollowed ? 24 : 0) +
    (isCurrentUserReview ? 12 : 0) +
    tasteBoost +
    freshnessBoost
  );
};

const buildCompatibilitySummary = ({
  user,
  userReviews = [],
  ownTasteAlbumKeys,
  ownTasteArtistKeys,
}) => {
  const overlapArtists = [
    ...new Set(
      userReviews
        .map((review) => `${review.artist || ''}`.trim().toLowerCase())
        .filter((artist) => ownTasteArtistKeys.has(artist))
    ),
  ];
  const overlapAlbums = [
    ...new Set(
      [...(user?.top5 || []), ...userReviews]
        .map((album) =>
          createAlbumKey(
            album.title || album.albumTitle,
            album.artist || album.artistName
          )
        )
        .filter((albumKey) => ownTasteAlbumKeys.has(albumKey))
    ),
  ];
  const reviewVelocity = Math.min(14, userReviews.length * 2);
  const followerBoost = Math.min(10, user?.followersCount || 0);
  const score =
    overlapAlbums.length * 18 +
    overlapArtists.length * 10 +
    reviewVelocity +
    followerBoost;
  const percent = Math.max(
    18,
    Math.min(
      98,
      30 + overlapAlbums.length * 18 + overlapArtists.length * 10 + reviewVelocity
    )
  );

  return {
    score,
    percent,
    overlapAlbums,
    overlapArtists,
    reason: overlapAlbums.length
      ? `Coinciden fuerte en ${overlapAlbums[0].split('::')[0]}`
      : overlapArtists.length
        ? `Comparten gusto por ${overlapArtists[0]}`
        : user?.followersCount
          ? `${user.followersCount} seguidores en B-Side`
          : 'Perfil activo para descubrir música',
  };
};

export default function useBSideApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [hasStoredSnapshot, setHasStoredSnapshot] = useState(false);

  const [currentUser, setCurrentUser] = useState(initialState.currentUser);
  const [reviews, setReviews] = useState(initialState.reviews);
  const [wishlist, setWishlist] = useState(initialState.wishlist);
  const [listeningHistory, setListeningHistory] = useState(
    initialState.listeningHistory
  );
  const [lists, setLists] = useState(initialState.lists);
  const [top5, setTop5] = useState(initialState.top5);
  const [globalChats, setGlobalChats] = useState(initialState.chats);
  const [notifications, setNotifications] = useState(
    initialState.notifications
  );
  const [followingHandles, setFollowingHandles] = useState(
    initialState.followingHandles
  );
  const [blockedHandles, setBlockedHandles] = useState(
    initialState.blockedHandles
  );
  const [reports, setReports] = useState(initialState.reports);
  const [preferences, setPreferences] = useState(initialState.preferences);
  const [authSession, setAuthSession] = useState(null);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [communityProfiles, setCommunityProfiles] = useState([]);
  const [spotifySession, setSpotifySession] = useState(null);
  const [spotifyProfile, setSpotifyProfile] = useState(null);
  const [isSpotifyExportBusy, setIsSpotifyExportBusy] = useState(false);
  const [spotifyExportStatus, setSpotifyExportStatus] = useState(null);
  const [pendingSpotifyExportListId, setPendingSpotifyExportListId] = useState('');
  const [pushPermissionStatus, setPushPermissionStatus] = useState('unknown');
  const [oracleRecommendations, setOracleRecommendations] = useState([]);
  const [isOracleBusy, setIsOracleBusy] = useState(false);
  const [oracleSource, setOracleSource] = useState('local');
  const [oracleMessage, setOracleMessage] = useState('');
  const [latestAchievementUnlock, setLatestAchievementUnlock] = useState(null);

  const [currentTrack, setCurrentTrack] = useState(null);
  const playbackResolutionCacheRef = useRef(new Map());
  const oracleHistoryRef = useRef([]);
  const currentUserRef = useRef(initialState.currentUser);
  const authSessionRef = useRef(null);
  const top5Ref = useRef(initialState.top5);
  const reviewsRef = useRef(initialState.reviews);
  const listsRef = useRef(initialState.lists);
  const followingHandlesRef = useRef(initialState.followingHandles);
  const blockedHandlesRef = useRef(initialState.blockedHandles);
  const reportsRef = useRef(initialState.reports);
  const authSubscriptionRef = useRef(null);
  const authRefreshSequenceRef = useRef(0);
  const unlockedAchievementsRef = useRef([]);
  const [listModalAlbum, setListModalAlbum] = useState(null);
  const [isCreateListVisible, setIsCreateListVisible] = useState(false);
  const [isShareVisible, setIsShareVisible] = useState(false);
  const [isStoryVisible, setIsStoryVisible] = useState(false);
  const [recommendedAlbum, setRecommendedAlbum] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewAlbum, setReviewAlbum] = useState(null);
  const [reviewContext, setReviewContext] = useState(null);
  const [isCreatingReview, setIsCreatingReview] = useState(false);

  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const supabaseStatus = useMemo(() => getSupabaseStatus(), []);
  const spotifyStatus = useMemo(() => getSpotifyUserStatus(), []);
  const musicOracleStatus = useMemo(() => getMusicOracleStatus(), []);
  const pushSupportStatus = useMemo(() => getPushSupportStatus(), []);
  const spotifyPlaybackStatus = useMemo(
    () => getSpotifyFullPlaybackStatus(spotifySession, spotifyProfile),
    [spotifyProfile, spotifySession]
  );
  const currentUserHandle = normalizeHandle(
    currentUser?.handle || CURRENT_USER_HANDLE
  );
  const isAuthenticated = Boolean(
    authSession?.user && preferences.sessionMode === 'authenticated'
  );
  const isEmailVerified = Boolean(
    authSession?.user?.email_confirmed_at || authSession?.user?.confirmed_at
  );
  const needsProfileCompletion = Boolean(
    authSession?.user &&
      (preferences.profileSetupRequired || !hasCompletedPublicProfile(currentUser))
  );

  const shareReview = useMemo(() => {
    const latestOwnReview = reviews.find(
      (review) => review.user === currentUserHandle
    );

    return latestOwnReview
      ? {
          album: latestOwnReview.albumTitle,
          cover: latestOwnReview.cover,
          text: latestOwnReview.text,
          user: currentUser.handle,
        }
      : {
          album: 'B-Side',
          text: 'Chequea mi perfil en B-Side.',
          user: currentUser.handle,
        };
  }, [currentUser.handle, currentUserHandle, reviews]);

  const logProductDebug = (channel, scope, payload = {}) => {
    if (!DEBUG_LOGS_ENABLED) {
      return;
    }

    console.log(`[${channel}]`, scope, payload);
  };

  const logAuthDebug = (scope, payload = {}) => {
    logProductDebug('auth-sync', scope, payload);
  };

  const logProfileDebug = (scope, payload = {}) => {
    logProductDebug('profile-sync', scope, payload);
  };

  const logAchievementsDebug = (scope, payload = {}) => {
    logProductDebug('achievement-sync', scope, payload);
  };

  const clearUserScopedState = () => {
    currentUserRef.current = initialState.currentUser;
    top5Ref.current = initialState.top5;
    reviewsRef.current = initialState.reviews;
    listsRef.current = initialState.lists;
    followingHandlesRef.current = initialState.followingHandles;
    blockedHandlesRef.current = initialState.blockedHandles;
    reportsRef.current = initialState.reports;
    playbackResolutionCacheRef.current.clear();
    oracleHistoryRef.current = [];
    unlockedAchievementsRef.current = [];
    setCurrentUser(initialState.currentUser);
    setReviews(initialState.reviews);
    setWishlist(initialState.wishlist);
    setListeningHistory(initialState.listeningHistory);
    setLists(initialState.lists);
    setTop5(initialState.top5);
    setGlobalChats(initialState.chats);
    setNotifications(initialState.notifications);
    setFollowingHandles(initialState.followingHandles);
    setBlockedHandles(initialState.blockedHandles);
    setReports(initialState.reports);
    setCommunityProfiles([]);
    setSpotifySession(null);
    setSpotifyProfile(null);
    setSpotifyExportStatus(null);
    setPendingSpotifyExportListId('');
    setCurrentTrack(null);
    setOracleRecommendations([]);
    setOracleMessage('');
    setLatestAchievementUnlock(null);
  };

  const resetToAuthEntry = ({
    entry = 'access',
    message = '',
    keepOnboardingCompleted = true,
  } = {}) => {
    logAuthDebug('reset_to_auth_entry', {
      entry,
      keepOnboardingCompleted,
      message,
    });

    authRefreshSequenceRef.current += 1;
    authSessionRef.current = null;
    setAuthSession(null);
    clearUserScopedState();
    setPreferences((prevPreferences) => ({
      ...prevPreferences,
      hasCompletedOnboarding: keepOnboardingCompleted,
      sessionMode: entry === 'access' ? 'signed_out' : 'guest',
      profileSetupRequired: false,
    }));
    setAuthMessage(message);
  };

  const buildAuthFallbackUser = (
    sessionUser = {},
    baseUser = currentUserRef.current,
    forceFresh = false
  ) => {
    const sourceUser = forceFresh ? initialState.currentUser : baseUser;

    return {
      ...initialState.currentUser,
      ...(forceFresh ? {} : sourceUser),
      id: sessionUser?.id || sourceUser.id,
      email: sessionUser?.email || sourceUser.email,
      name:
        sessionUser?.user_metadata?.display_name ||
        sessionUser?.user_metadata?.full_name ||
        sourceUser.name,
      handle: sessionUser?.user_metadata?.handle || sourceUser.handle,
      birthDate:
        sessionUser?.user_metadata?.birth_date || sourceUser.birthDate || '',
    };
  };

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    authSessionRef.current = authSession;
  }, [authSession]);

  useEffect(() => {
    top5Ref.current = top5;
  }, [top5]);

  useEffect(() => {
    reviewsRef.current = reviews;
  }, [reviews]);

  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  useEffect(() => {
    followingHandlesRef.current = followingHandles;
  }, [followingHandles]);

  useEffect(() => {
    blockedHandlesRef.current = blockedHandles;
  }, [blockedHandles]);

  useEffect(() => {
    reportsRef.current = reports;
  }, [reports]);

  const hasUnreadMessages = useMemo(
    () =>
      globalChats.some((chat) => {
        const chatHandle = normalizeHandle(chat?.user?.handle || '');
        return !blockedHandles.includes(chatHandle) && chat.unread > 0;
      }),
    [blockedHandles, globalChats]
  );

  const hasUnreadNotifications = useMemo(
    () => notifications.some((notification) => !notification.read),
    [notifications]
  );
  const visibleReviews = useMemo(
    () =>
      reviews.filter(
        (review) =>
          !preferences.blockedUsersEnabled ||
          !blockedHandles.includes(normalizeHandle(review.user))
      ),
    [blockedHandles, preferences.blockedUsersEnabled, reviews]
  );
  const visibleChats = useMemo(
    () =>
      globalChats.filter(
        (chat) =>
          !preferences.blockedUsersEnabled ||
          !blockedHandles.includes(normalizeHandle(chat?.user?.handle || ''))
      ).sort((left, right) => {
        const leftTime = getTimestampValue(
          left.messages[left.messages.length - 1]?.createdAt
        );
        const rightTime = getTimestampValue(
          right.messages[right.messages.length - 1]?.createdAt
        );

        return rightTime - leftTime;
      }),
    [blockedHandles, globalChats, preferences.blockedUsersEnabled]
  );
  const socialGraph = useMemo(
    () =>
      buildDemoSocialGraph(
        followingHandles,
        normalizeHandle(currentUser?.handle || CURRENT_USER_HANDLE)
      ),
    [currentUser?.handle, followingHandles]
  );
  const communityProfileMap = useMemo(
    () =>
      new Map(
        communityProfiles.map((profile) => [
          normalizeHandle(profile.handle),
          profile,
        ])
      ),
    [communityProfiles]
  );
  const resolveUserSnapshot = (handle) => {
    const normalizedHandle = normalizeHandle(
      handle || currentUser?.handle || CURRENT_USER_HANDLE
    );
    const backendUser = communityProfileMap.get(normalizedHandle);
    const fallbackCounts = socialGraph.getCountsForHandle(normalizedHandle);

    if (normalizedHandle === currentUserHandle) {
      return {
        ...currentUser,
        followersCount: backendUser?.followersCount ?? fallbackCounts.followersCount,
        followingCount: backendUser?.followingCount ?? fallbackCounts.followingCount,
      };
    }

    if (backendUser) {
      return backendUser;
    }

    return {
      ...buildViewedUser(normalizedHandle, currentUser),
      ...fallbackCounts,
    };
  };
  const currentUserWithSocialStats = useMemo(
    () => resolveUserSnapshot(currentUserHandle),
    [communityProfileMap, currentUser, currentUserHandle, socialGraph]
  );
  const followingSet = useMemo(
    () => new Set(followingHandles.map((handle) => normalizeHandle(handle))),
    [followingHandles]
  );
  const listeningStreak = useMemo(
    () => buildListeningStreakSummary(listeningHistory),
    [listeningHistory]
  );
  const recentListening = useMemo(
    () =>
      [...listeningHistory]
        .sort(
          (left, right) =>
            getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt)
        )
        .slice(0, 6),
    [listeningHistory]
  );
  const ownReviews = useMemo(
    () =>
      reviews.filter(
        (review) => normalizeHandle(review.user) === currentUserHandle
      ),
    [currentUserHandle, reviews]
  );
  const recommendationsSentCount = useMemo(
    () =>
      globalChats.reduce(
        (accumulator, chat) =>
          accumulator +
          chat.messages.filter(
            (message) =>
              message.sender === 'me' &&
              message.messageType === 'recommendation'
          ).length,
        0
      ),
    [globalChats]
  );
  const achievementSummary = useMemo(
    () =>
      buildAchievementSummary({
        userHandle: currentUser.handle,
        profileCompleted: hasCompletedPublicProfile(currentUser),
        reviewCount: ownReviews.length,
        listCount: lists.filter((list) => !list.isSystem).length,
        streakCurrent: listeningStreak.current,
        listeningDays: listeningHistory.length,
        recommendationsSent: recommendationsSentCount,
        topAlbumsPinned: top5.length,
      }),
    [
      currentUser.handle,
      listeningHistory.length,
      listeningStreak.current,
      lists,
      ownReviews.length,
      recommendationsSentCount,
      top5.length,
    ]
  );
  const wishlistList = useMemo(
    () => ({
      id: 'wishlist',
      name: 'Por escuchar',
      color: '#8A2BE2',
      isPublic: false,
      isSystem: true,
      systemDescription:
        'Tu lista privada para esos discos que querés escuchar con más tiempo.',
      items: wishlist,
      count: wishlist.length,
    }),
    [wishlist]
  );

  useEffect(() => {
    if (!hasHydrated || !achievementSummary) {
      return undefined;
    }

    const previousUnlockedIds = new Set(unlockedAchievementsRef.current);
    const nextUnlockedIds = achievementSummary.unlockedAchievements.map(
      (achievement) => achievement.id
    );

    if (!unlockedAchievementsRef.current.length) {
      unlockedAchievementsRef.current = nextUnlockedIds;
      return undefined;
    }

    const newlyUnlocked = achievementSummary.unlockedAchievements.filter(
      (achievement) => !previousUnlockedIds.has(achievement.id)
    );

    unlockedAchievementsRef.current = nextUnlockedIds;

    if (!newlyUnlocked.length) {
      return undefined;
    }

    const newestUnlock = newlyUnlocked[newlyUnlocked.length - 1];
    logAchievementsDebug('achievement_unlocked', {
      achievementId: newestUnlock.id,
      title: newestUnlock.title,
    });
    setLatestAchievementUnlock(newestUnlock);
    void triggerSuccessFeedback();
    pushNotification({
      type: 'product',
      title: 'Nuevo logro desbloqueado',
      body: `${newestUnlock.title} ya quedó activo en tu perfil.`,
      read: true,
    });

    const timer = setTimeout(() => {
      setLatestAchievementUnlock((currentUnlock) =>
        currentUnlock?.id === newestUnlock.id ? null : currentUnlock
      );
    }, 4800);

    return () => clearTimeout(timer);
  }, [achievementSummary, hasHydrated]);
  const ownTasteAlbumKeys = useMemo(() => {
    const albums = [
      ...top5.map((album) => createAlbumKey(album.title, album.artist)),
      ...lists.flatMap((list) =>
        list.items.map((album) => createAlbumKey(album.title, album.artist))
      ),
      ...listeningHistory.map((entry) => createAlbumKey(entry.title, entry.artist)),
      ...reviews
        .filter((review) => normalizeHandle(review.user) === currentUserHandle)
        .map((review) => createAlbumKey(review.albumTitle, review.artist)),
    ];

    return new Set(albums.filter(Boolean));
  }, [currentUserHandle, listeningHistory, lists, reviews, top5]);
  const ownTasteArtistKeys = useMemo(() => {
    const artists = [
      ...top5.map((album) => `${album.artist || ''}`.trim().toLowerCase()),
      ...lists.flatMap((list) =>
        list.items.map((album) => `${album.artist || ''}`.trim().toLowerCase())
      ),
      ...listeningHistory.map((entry) =>
        `${entry.artist || ''}`.trim().toLowerCase()
      ),
      ...reviews
        .filter((review) => normalizeHandle(review.user) === currentUserHandle)
        .map((review) => `${review.artist || ''}`.trim().toLowerCase()),
    ];

    return new Set(artists.filter(Boolean));
  }, [currentUserHandle, listeningHistory, lists, reviews, top5]);
  const feedReviews = useMemo(
    () =>
      [...visibleReviews].sort((left, right) => {
        const scoreDifference =
          buildReviewFeedScore(
            right,
            followingSet,
            currentUserHandle,
            ownTasteAlbumKeys,
            ownTasteArtistKeys
          ) -
          buildReviewFeedScore(
            left,
            followingSet,
            currentUserHandle,
            ownTasteAlbumKeys,
            ownTasteArtistKeys
          );

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        return (
          getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt)
        );
      }),
    [
      currentUserHandle,
      followingSet,
      ownTasteAlbumKeys,
      ownTasteArtistKeys,
      visibleReviews,
    ]
  );
  const friendActivity = useMemo(() => {
    const seenHandles = new Set();

    return feedReviews
      .filter((review) => {
        const reviewHandle = normalizeHandle(review.user);
        return (
          followingSet.has(reviewHandle) && reviewHandle !== currentUserHandle
        );
      })
      .filter((review) => {
        const reviewHandle = normalizeHandle(review.user);

        if (seenHandles.has(reviewHandle)) {
          return false;
        }

        seenHandles.add(reviewHandle);
        return true;
      })
      .slice(0, 5)
      .map((review) => ({
        ...review,
        profile: resolveUserSnapshot(review.user),
      }));
  }, [
    communityProfileMap,
    currentUser,
    currentUserHandle,
    feedReviews,
    followingSet,
    socialGraph,
  ]);
  const interestingUsers = useMemo(
    () =>
      [...new Set([
        ...Object.keys(MOCK_USERS).map((handle) => normalizeHandle(handle)),
        ...communityProfiles.map((profile) => normalizeHandle(profile.handle)),
      ])]
        .filter((handle) => {
          const normalizedHandle = normalizeHandle(handle);
          return (
            normalizedHandle !== currentUserHandle &&
            !followingSet.has(normalizedHandle)
          );
        })
        .map((handle) => {
          const normalizedHandle = normalizeHandle(handle);
          const user = resolveUserSnapshot(normalizedHandle);
          const userReviews = visibleReviews.filter(
            (review) => normalizeHandle(review.user) === normalizedHandle
          );
          const compatibility = buildCompatibilitySummary({
            user,
            userReviews,
            ownTasteAlbumKeys,
            ownTasteArtistKeys,
          });
          const engagementScore = userReviews.reduce(
            (accumulator, review) =>
              accumulator + review.likedBy.length * 2 + review.comments.length * 3,
            0
          );
          const score = compatibility.score + engagementScore + user.followersCount * 2;

          return {
            ...user,
            score,
            reason: compatibility.reason,
            compatibilityScore: compatibility.percent,
            compatibilityReason: compatibility.reason,
          };
        })
        .sort((left, right) => right.score - left.score)
        .slice(0, 4),
    [
      communityProfiles,
      currentUser,
      currentUserHandle,
      followingSet,
      ownTasteAlbumKeys,
      ownTasteArtistKeys,
      communityProfileMap,
      socialGraph,
      visibleReviews,
    ]
  );
  const interestingAlbums = useMemo(() => {
    const albumMap = new Map();
    const addCandidate = (album, metadata = {}) => {
      const albumKey = createAlbumKey(
        album.title || album.albumTitle,
        album.artist || album.artistName
      );

      if (!albumKey || ownTasteAlbumKeys.has(albumKey)) {
        return;
      }

      const existingAlbum = albumMap.get(albumKey) || {
        id: album.id || album.albumId || albumKey,
        albumId: album.albumId || album.id || albumKey,
        title: album.title || album.albumTitle,
        artist: album.artist || album.artistName || '',
        cover: album.cover || album.cover_url || '',
        previewUrl: album.previewUrl || '',
        score: 0,
        reasons: [],
      };

      existingAlbum.score += metadata.score || 0;

      if (metadata.reason) {
        existingAlbum.reasons.push(metadata.reason);
      }

      albumMap.set(albumKey, existingAlbum);
    };

    feedReviews.forEach((review) => {
      const fromFollowed = followingSet.has(normalizeHandle(review.user));

      if (normalizeHandle(review.user) === currentUserHandle) {
        return;
      }

      addCandidate(
        {
          id: review.albumId || review.id,
          albumId: review.albumId,
          title: review.albumTitle,
          artist: review.artist,
          cover: review.cover,
          previewUrl: review.previewUrl,
        },
        {
          score:
            review.rating * 8 +
            review.likedBy.length * 3 +
            review.comments.length * 4 +
            (ownTasteArtistKeys.has(
              `${review.artist || ''}`.trim().toLowerCase()
            )
              ? 10
              : 0) +
            (fromFollowed ? 16 : 8),
          reason: fromFollowed
            ? `Lo recomienda ${review.user}`
            : 'Tiene buena respuesta en la comunidad',
        }
      );
    });

    friendActivity.forEach((activity) => {
      addCandidate(
        {
          id: activity.albumId || activity.id,
          albumId: activity.albumId,
          title: activity.albumTitle,
          artist: activity.artist,
          cover: activity.cover,
          previewUrl: activity.previewUrl,
          artistId: activity.artistId,
          artistUrl: activity.artistUrl,
          source: activity.source,
        },
        {
          score:
            activity.rating * 7 +
            activity.likedBy.length * 2 +
            activity.comments.length * 3 +
            18,
          reason: `${normalizeHandle(activity.user)} lo está moviendo ahora`,
        }
      );
    });

    recentListening.slice(0, 6).forEach((entry) => {
      const entryArtistKey = createArtistKey(entry.artist);

      feedReviews
        .filter(
          (review) =>
            createArtistKey(review.artist) === entryArtistKey &&
            createAlbumKey(review.albumTitle, review.artist) !==
              createAlbumKey(entry.title, entry.artist) &&
            normalizeHandle(review.user) !== currentUserHandle
        )
        .slice(0, 2)
        .forEach((review) => {
          addCandidate(
            {
              id: review.albumId || review.id,
              albumId: review.albumId,
              title: review.albumTitle,
              artist: review.artist,
              cover: review.cover,
              previewUrl: review.previewUrl,
              artistId: review.artistId,
              artistUrl: review.artistUrl,
              source: review.source,
            },
            {
              score: 14 + review.rating * 4,
              reason: `Se cruza con tus escuchas recientes de ${entry.artist}`,
            }
          );
        });
    });

    wishlist.slice(0, 6).forEach((entry) => {
      const entryArtistKey = createArtistKey(entry.artist);

      feedReviews
        .filter(
          (review) =>
            createArtistKey(review.artist) === entryArtistKey &&
            createAlbumKey(review.albumTitle, review.artist) !==
              createAlbumKey(entry.title, entry.artist) &&
            normalizeHandle(review.user) !== currentUserHandle
        )
        .slice(0, 2)
        .forEach((review) => {
          addCandidate(
            {
              id: review.albumId || review.id,
              albumId: review.albumId,
              title: review.albumTitle,
              artist: review.artist,
              cover: review.cover,
              previewUrl: review.previewUrl,
              artistId: review.artistId,
              artistUrl: review.artistUrl,
              source: review.source,
            },
            {
              score: 12 + review.rating * 3,
              reason: 'Dialoga con tu lista Por escuchar',
            }
          );
        });
    });

    lists
      .filter((list) => !list.isSystem)
      .slice(0, 4)
      .forEach((list) => {
        list.items.slice(0, 4).forEach((item) => {
          const itemArtistKey = createArtistKey(item.artist);

          feedReviews
            .filter(
              (review) =>
                createArtistKey(review.artist) === itemArtistKey &&
                createAlbumKey(review.albumTitle, review.artist) !==
                  createAlbumKey(item.title, item.artist) &&
                normalizeHandle(review.user) !== currentUserHandle
            )
            .slice(0, 1)
            .forEach((review) => {
              addCandidate(
                {
                  id: review.albumId || review.id,
                  albumId: review.albumId,
                  title: review.albumTitle,
                  artist: review.artist,
                  cover: review.cover,
                  previewUrl: review.previewUrl,
                  artistId: review.artistId,
                  artistUrl: review.artistUrl,
                  source: review.source,
                },
                {
                  score: 12 + review.rating * 3,
                  reason: `Podría encajar en tu lista "${list.name}"`,
                }
              );
            });
        });
      });

    Object.entries(MOCK_USERS).forEach(([handle, user]) => {
      const normalizedHandle = normalizeHandle(handle);

      if (normalizedHandle === currentUserHandle) {
        return;
      }

      (user.top5 || []).forEach((album, index) => {
        addCandidate(album, {
          score: (followingSet.has(normalizedHandle) ? 16 : 8) + (5 - index) * 2,
          reason: followingSet.has(normalizedHandle)
            ? `Top de ${normalizedHandle}`
            : `Perfil destacado: ${normalizedHandle}`,
        });
      });
    });

    return Array.from(albumMap.values())
      .map((album) => ({
        ...album,
        reason: album.reasons[0] || 'Descubrimiento recomendado',
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 6);
  }, [
    currentUserHandle,
    feedReviews,
    friendActivity,
    followingSet,
    lists,
    ownTasteAlbumKeys,
    ownTasteArtistKeys,
    recentListening,
    wishlist,
  ]);
  const interestingArtists = useMemo(() => {
    const artistMap = new Map();
    const addArtist = (artist = {}, metadata = {}) => {
      const artistKey = createArtistKey(artist.name || artist.artist);

      if (!artistKey || ownTasteArtistKeys.has(artistKey)) {
        return;
      }

      const existingArtist = artistMap.get(artistKey) || {
        name: artist.name || artist.artist || '',
        artistId: artist.artistId || '',
        artistUrl: artist.artistUrl || '',
        cover: artist.cover || '',
        source: artist.source || '',
        anchorAlbumTitle: artist.anchorAlbumTitle || '',
        score: 0,
        reasons: [],
      };

      existingArtist.score += metadata.score || 0;
      existingArtist.cover = existingArtist.cover || artist.cover || '';
      existingArtist.artistId = existingArtist.artistId || artist.artistId || '';
      existingArtist.artistUrl = existingArtist.artistUrl || artist.artistUrl || '';
      existingArtist.source = existingArtist.source || artist.source || '';
      existingArtist.anchorAlbumTitle =
        existingArtist.anchorAlbumTitle || artist.anchorAlbumTitle || '';

      if (metadata.reason) {
        existingArtist.reasons.push(metadata.reason);
      }

      artistMap.set(artistKey, existingArtist);
    };

    feedReviews.forEach((review) => {
      if (normalizeHandle(review.user) === currentUserHandle) {
        return;
      }

      addArtist(
        {
          name: review.artist,
          cover: review.cover,
          source: review.source,
          anchorAlbumTitle: review.albumTitle,
        },
        {
          score:
            review.rating * 7 +
            review.likedBy.length * 2 +
            review.comments.length * 3 +
            (followingSet.has(normalizeHandle(review.user)) ? 16 : 8),
          reason: followingSet.has(normalizeHandle(review.user))
            ? `Lo viene empujando ${review.user}`
            : 'Se esta nombrando bastante en la comunidad',
        }
      );
    });

    interestingAlbums.forEach((album) => {
      addArtist(
        {
          name: album.artist,
          cover: album.cover,
          artistId: album.artistId,
          artistUrl: album.artistUrl,
          source: album.source,
          anchorAlbumTitle: album.title,
        },
        {
          score: 10,
          reason: album.reason,
        }
      );
    });

    return Array.from(artistMap.values())
      .map((artist) => ({
        ...artist,
        reason: artist.reasons[0] || 'Artista recomendado para descubrir',
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 6);
  }, [
    currentUserHandle,
    feedReviews,
    followingSet,
    interestingAlbums,
    ownTasteArtistKeys,
  ]);
  const oracleCandidates = useMemo(() => {
    const candidateMap = new Map();

    interestingAlbums.forEach((album, index) => {
      candidateMap.set(album.id, {
        ...album,
        reason: album.reason,
        score: album.score || Math.max(0, 24 - index * 2),
      });
    });

    feedReviews.forEach((review) => {
      const albumKey = review.albumId || createAlbumKey(review.albumTitle, review.artist);

      if (!albumKey || ownTasteAlbumKeys.has(createAlbumKey(review.albumTitle, review.artist))) {
        return;
      }

      if (candidateMap.has(albumKey)) {
        return;
      }

      candidateMap.set(albumKey, {
        id: albumKey,
        albumId: review.albumId || albumKey,
        title: review.albumTitle,
        artist: review.artist,
        cover: review.cover,
        previewUrl: review.previewUrl || '',
        externalUrl: review.externalUrl || '',
        source: review.source || '',
        reason: followingSet.has(normalizeHandle(review.user))
          ? `Lo viene empujando ${review.user}.`
          : 'Está apareciendo mucho entre reseñas y actividad reciente.',
        score: review.rating * 6 + review.comments.length * 2 + review.likedBy.length,
      });
    });

    return Array.from(candidateMap.values())
      .sort((left, right) => (right.score || 0) - (left.score || 0))
      .slice(0, 12);
  }, [feedReviews, followingSet, interestingAlbums, ownTasteAlbumKeys]);
  const oracleTasteProfile = useMemo(
    () => ({
      topFive: top5.slice(0, 5).map((album) => ({
        title: album.title,
        artist: album.artist,
      })),
      favoriteArtists: [
        ...new Set(
          [...top5, ...ownReviews]
            .map((item) => `${item.artist || ''}`.trim())
            .filter(Boolean)
        ),
      ].slice(0, 6),
      recentReviewMood:
        ownReviews
          .slice(0, 3)
          .map((review) => review.text)
          .filter(Boolean)
          .join(' | ') || '',
    }),
    [ownReviews, top5]
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    let isMounted = true;

    const hydrateSpotify = async () => {
      const callbackResult = await completeSpotifyConnectFromUrl();

      if (!isMounted) {
        return;
      }

      if (callbackResult.ok) {
        pushNotification({
          type: 'product',
          title: 'Spotify conectado',
          body: 'Tu cuenta ya quedó lista para exportar listas desde B-Side.',
          read: true,
        });
      } else if (callbackResult.message) {
        setAuthMessage(callbackResult.message);
      }

      const sessionResult = await refreshSpotifyConnection();

      if (isMounted && !sessionResult.ok && sessionResult.message) {
        setAuthMessage(sessionResult.message);
      }

      if (isMounted && callbackResult.ok) {
        const pendingListId = await consumePendingSpotifyExportList();

        if (pendingListId) {
          setPendingSpotifyExportListId(pendingListId);
        }
      }
    };

    void hydrateSpotify();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!supabaseStatus.isConfigured) {
      return undefined;
    }

    let isMounted = true;
    const client = getSupabaseClient();

    if (!client) {
      return undefined;
    }

    const applyIncomingUrl = async (url) => {
      const result = await consumeAuthRedirectUrl(url);

      if (!isMounted || result.skipped) {
        return;
      }

      if (!result.ok) {
        if (result.message) {
          setAuthMessage(result.message);
        }
        return;
      }

      const refreshResult = await refreshAuthenticatedUser(
        buildAuthFallbackUser(
          result.session?.user || {},
          currentUserRef.current,
          !authSessionRef.current?.user?.id
        ),
        { source: 'linking_redirect' }
      );

      if (!isMounted) {
        return;
      }

      if (!refreshResult.ok && refreshResult.message) {
        setAuthMessage(refreshResult.message);
        return;
      }

      if (result.message) {
        setAuthMessage(result.message);
      }
    };

    void Linking.getInitialURL().then((url) => {
      if (url) {
        void applyIncomingUrl(url);
      }
    });

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      void applyIncomingUrl(url);
    });

    authSubscriptionRef.current?.unsubscribe?.();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      const previousUserId = authSessionRef.current?.user?.id || '';
      const nextUserId = session?.user?.id || '';
      const userChanged = Boolean(previousUserId && nextUserId && previousUserId !== nextUserId);

      logAuthDebug('on_auth_state_change', {
        event,
        previousUserId,
        nextUserId,
        userChanged,
      });

      if (event === 'SIGNED_OUT') {
        resetToAuthEntry({
          entry: 'access',
          message: 'Sesión cerrada.',
        });
        return;
      }

      if (!session?.user) {
        return;
      }

      if (userChanged) {
        clearUserScopedState();
      }

      authSessionRef.current = session;
      setAuthSession(session);

      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED' ||
        event === 'PASSWORD_RECOVERY'
      ) {
        setTimeout(() => {
          void refreshAuthenticatedUser(
            buildAuthFallbackUser(
              session.user,
              userChanged ? initialState.currentUser : currentUserRef.current,
              userChanged
            ),
            {
              source: `auth:${event}`,
              userChanged,
            }
          );
        }, 0);
      }
    });

    authSubscriptionRef.current = subscription;

    return () => {
      isMounted = false;
      linkingSubscription?.remove?.();
      authSubscriptionRef.current?.unsubscribe?.();
      authSubscriptionRef.current = null;
    };
  }, [supabaseStatus.isConfigured]);

  useEffect(() => {
    if (!hasHydrated || !spotifySession?.accessToken || !pendingSpotifyExportListId) {
      return;
    }

    const nextListId = pendingSpotifyExportListId;
    setPendingSpotifyExportListId('');
    void exportListToSpotify(nextListId);
  }, [hasHydrated, pendingSpotifyExportListId, spotifySession?.accessToken]);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const guestPersistedState = await loadAppState({
        scope: DEFAULT_SCOPE_KEY,
      });
      const entryPersistedState = await loadAppState({
        scope: ENTRY_SCOPE_KEY,
      });

      let persistedState =
        entryPersistedState?.__meta?.hasStoredSnapshot &&
        ['member_preview', 'signed_out'].includes(
          entryPersistedState.preferences?.sessionMode
        )
          ? entryPersistedState
          : guestPersistedState?.__meta?.hasStoredSnapshot
            ? guestPersistedState
            : entryPersistedState;

      if (!isMounted) return;
      setHasStoredSnapshot(
        Boolean(
          guestPersistedState?.__meta?.hasStoredSnapshot ||
            entryPersistedState?.__meta?.hasStoredSnapshot
        )
      );

      let nextPreferences = {
        ...initialState.preferences,
        ...persistedState.preferences,
      };
      let nextCurrentUser = {
        ...persistedState.currentUser,
        top5: persistedState.top5,
      };
      let nextFollowingHandles = persistedState.followingHandles;
      let nextBlockedHandles = persistedState.blockedHandles;
      let nextReports = persistedState.reports;
      let nextReviews = persistedState.reviews;
      let nextLists = persistedState.lists;
      let nextWishlist = persistedState.wishlist;
      let nextListeningHistory = persistedState.listeningHistory;
      let nextGlobalChats = persistedState.chats;
      let nextNotifications = persistedState.notifications;
      let nextTop5 = persistedState.top5;

      if (supabaseStatus.isConfigured) {
        const snapshot = await getAuthenticatedProfileSnapshot(
          persistedState.currentUser
        );

        if (!isMounted) return;

        if (snapshot.ok) {
          setAuthSession(snapshot.session || null);

          if (snapshot.session?.user) {
            const persistedUserState = await loadAppState({
              scope: getPersistenceScope({
                sessionMode: 'authenticated',
                userId: snapshot.session.user.id,
              }),
            });

            setHasStoredSnapshot((prevValue) =>
              prevValue || Boolean(persistedUserState?.__meta?.hasStoredSnapshot)
            );

            persistedState = persistedUserState?.__meta?.hasStoredSnapshot
              ? persistedUserState
              : createInitialState();

            nextPreferences = {
              ...initialState.preferences,
              ...(persistedUserState?.preferences || {}),
            };
            nextCurrentUser = {
              ...(persistedUserState?.currentUser || initialState.currentUser),
              top5: persistedUserState?.top5 || initialState.top5,
            };
            nextFollowingHandles =
              persistedUserState?.followingHandles || initialState.followingHandles;
            nextBlockedHandles =
              persistedUserState?.blockedHandles || initialState.blockedHandles;
            nextReports = persistedUserState?.reports || initialState.reports;
            nextReviews = persistedUserState?.reviews || initialState.reviews;
            nextLists = persistedUserState?.lists || initialState.lists;
            nextWishlist = persistedUserState?.wishlist || initialState.wishlist;
            nextListeningHistory =
              persistedUserState?.listeningHistory || initialState.listeningHistory;
            nextGlobalChats = persistedUserState?.chats || initialState.chats;
            nextNotifications =
              persistedUserState?.notifications || initialState.notifications;
            nextTop5 = persistedUserState?.top5 || initialState.top5;

            const userChanged =
              persistedState.currentUser?.id &&
              persistedState.currentUser.id !== snapshot.session.user.id;

            nextCurrentUser = {
              ...(userChanged ? initialState.currentUser : nextCurrentUser),
              ...snapshot.user,
              top5: userChanged ? initialState.top5 : persistedState.top5,
            };
            nextWishlist = userChanged ? initialState.wishlist : persistedState.wishlist;
            nextListeningHistory = userChanged
              ? initialState.listeningHistory
              : persistedState.listeningHistory;
            nextGlobalChats = userChanged ? initialState.chats : persistedState.chats;
            nextNotifications = userChanged
              ? initialState.notifications
              : persistedState.notifications;
            nextTop5 = userChanged ? initialState.top5 : persistedState.top5;
            nextPreferences = {
              ...nextPreferences,
              hasCompletedOnboarding: true,
              sessionMode: 'authenticated',
              profileSetupRequired:
                nextPreferences.profileSetupRequired ||
                !hasCompletedPublicProfile(snapshot.user),
            };

            const remoteState = await loadAuthenticatedCollections({
              userId: snapshot.session.user.id,
              fallbackHandle: snapshot.user.handle || nextCurrentUser.handle,
              localReviews: userChanged ? initialState.reviews : persistedState.reviews,
              localLists: userChanged ? initialState.lists : persistedState.lists,
              localFollowingHandles: userChanged
                ? initialState.followingHandles
                : persistedState.followingHandles,
              localBlockedHandles: userChanged
                ? initialState.blockedHandles
                : persistedState.blockedHandles,
              localReports: userChanged ? initialState.reports : persistedState.reports,
            });

            if (!isMounted) return;

            nextFollowingHandles = remoteState.followingHandles;
            nextBlockedHandles = remoteState.blockedHandles;
            nextReports = remoteState.reports;
            nextReviews = remoteState.reviews;
            nextLists = remoteState.lists;

            if (remoteState.message) {
              setAuthMessage(remoteState.message);
            }
          }

            if (snapshot.warning) {
              setAuthMessage(snapshot.warning);
            }
          }
        }

      setCurrentUser(nextCurrentUser);
      setReviews(nextReviews);
      setWishlist(nextWishlist);
      setListeningHistory(nextListeningHistory);
      setLists(nextLists);
      setTop5(nextTop5);
      setGlobalChats(nextGlobalChats);
      setNotifications(nextNotifications);
      setFollowingHandles(nextFollowingHandles);
      setBlockedHandles(nextBlockedHandles);
      setReports(nextReports);
      setPreferences(nextPreferences);
      setHasHydrated(true);
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, [supabaseStatus.isConfigured]);

  useEffect(() => {
    if (!hasHydrated) return;

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, hasStoredSnapshot ? 220 : 650);

    return () => clearTimeout(timer);
  }, [hasHydrated, hasStoredSnapshot]);

  useEffect(() => {
    setCurrentUser((prevUser) => ({
      ...prevUser,
      top5,
    }));
  }, [top5]);

  useEffect(() => {
    if (!hasHydrated) return;

    const timer = setTimeout(() => {
      const persistenceScope = getPersistenceScope({
        sessionMode: preferences.sessionMode,
        userId: authSession?.user?.id || '',
      });

      saveAppState({
        currentUser,
        reviews,
        wishlist,
        listeningHistory,
        lists,
        top5,
        chats: globalChats,
        notifications,
        followingHandles,
        blockedHandles,
        reports,
        preferences,
      }, {
        scope: persistenceScope,
      }).catch((error) => {
        console.error('No pudimos guardar el estado local:', error);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [
    hasHydrated,
    currentUser,
    reviews,
    wishlist,
    listeningHistory,
    lists,
    top5,
    globalChats,
    notifications,
    followingHandles,
    blockedHandles,
    reports,
    preferences,
  ]);

  useEffect(() => {
    if (!hasHydrated || !preferences.notificationsEnabled) {
      setPushPermissionStatus('disabled');
      return;
    }

    let isMounted = true;

    syncPushRegistration()
      .then((result) => {
        if (!isMounted) {
          return;
        }
      })
      .catch(() => {
        if (isMounted) {
          setPushPermissionStatus('error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    authSession?.user?.id,
    hasHydrated,
    preferences.notificationsEnabled,
    supabaseStatus.isConfigured,
  ]);

  useEffect(() => {
    if (!hasHydrated || !preferences.streakAlertsEnabled) {
      void cancelStreakWarning();
      return;
    }

    if (listeningStreak.isAtRisk) {
      void scheduleStreakWarning({
        streakCount: listeningStreak.current,
      });
      return;
    }

    void cancelStreakWarning();
  }, [
    hasHydrated,
    listeningStreak.current,
    listeningStreak.isAtRisk,
    preferences.streakAlertsEnabled,
  ]);

  useEffect(() => {
    if (!hasHydrated || !supabaseStatus.isConfigured) {
      return undefined;
    }

    let isMounted = true;

    const loadCommunityCollections = async () => {
      const [communityReviewsSnapshot, communityProfilesSnapshot] =
        await Promise.all([
          fetchCommunityFeedReviews(60),
          fetchCommunityProfiles({
            excludeUserId: authSession?.user?.id || null,
            limit: 28,
          }),
        ]);

      if (!isMounted) {
        return;
      }

      if (communityReviewsSnapshot.ok) {
        setReviews((prevReviews) =>
          mergeEntitiesBySource(
            'review',
            communityReviewsSnapshot.reviews,
            prevReviews
          )
        );
      } else if (communityReviewsSnapshot.message) {
        setAuthMessage((prevMessage) => prevMessage || communityReviewsSnapshot.message);
      }

      if (communityProfilesSnapshot.ok) {
        setCommunityProfiles(communityProfilesSnapshot.users);
      } else if (communityProfilesSnapshot.message) {
        setAuthMessage((prevMessage) => prevMessage || communityProfilesSnapshot.message);
      }
    };

    void loadCommunityCollections();

    return () => {
      isMounted = false;
    };
  }, [authSession?.user?.id, hasHydrated, supabaseStatus.isConfigured]);

  useEffect(() => {
    if (
      !hasHydrated ||
      !supabaseStatus.isConfigured ||
      !authSession?.user?.id
    ) {
      return undefined;
    }

    let isMounted = true;

    const loadAuthenticatedExtras = async () => {
      const [
        remoteState,
        listeningSnapshot,
        notificationsSnapshot,
        chatsSnapshot,
      ] =
        await Promise.all([
          loadAuthenticatedCollections({
            userId: authSession.user.id,
            fallbackHandle: currentUser.handle,
            localReviews: reviews,
            localLists: lists,
            localFollowingHandles: followingHandles,
            localBlockedHandles: blockedHandles,
            localReports: reports,
          }),
          fetchCurrentUserListeningHistory(authSession.user.id),
          fetchBackendNotifications(authSession.user.id),
          fetchCurrentUserChats(authSession.user.id),
        ]);

      if (!isMounted) {
        return;
      }

      setFollowingHandles(remoteState.followingHandles);
      setBlockedHandles(remoteState.blockedHandles);
      setReports(remoteState.reports);
      setReviews((prevReviews) =>
        mergeEntitiesBySource('review', remoteState.reviews, prevReviews)
      );
      setLists((prevLists) =>
        mergeEntitiesBySource('list', remoteState.lists, prevLists)
      );

      if (listeningSnapshot.ok) {
        setListeningHistory((prevHistory) =>
          mergeListeningCollections(
            listeningSnapshot.listeningHistory,
            prevHistory
          )
        );
      } else if (listeningSnapshot.message) {
        setAuthMessage((prevMessage) => prevMessage || listeningSnapshot.message);
      }

      if (notificationsSnapshot.ok) {
        setNotifications((prevNotifications) =>
          mergeEntitiesBySource(
            'notification',
            notificationsSnapshot.notifications,
            prevNotifications
          ).slice(0, 50)
        );
      } else if (notificationsSnapshot.message) {
        setAuthMessage((prevMessage) => prevMessage || notificationsSnapshot.message);
      }

      if (chatsSnapshot.ok) {
        setGlobalChats((prevChats) =>
          mergeChatCollections(chatsSnapshot.chats, prevChats)
        );
      } else if (chatsSnapshot.message) {
        setAuthMessage((prevMessage) => prevMessage || chatsSnapshot.message);
      }

      if (remoteState.message) {
        setAuthMessage(remoteState.message);
      }
    };

    void loadAuthenticatedExtras();

    return () => {
      isMounted = false;
    };
  }, [authSession?.user?.id, hasHydrated, supabaseStatus.isConfigured]);

  useEffect(() => {
    if (
      !hasHydrated ||
      !supabaseStatus.isConfigured ||
      !authSession?.user?.id
    ) {
      return undefined;
    }

    return subscribeToUserNotifications({
      userId: authSession.user.id,
      onInsert: (notification) => {
        setNotifications((prevNotifications) =>
          mergeEntitiesBySource(
            'notification',
            [notification],
            prevNotifications
          ).slice(0, 50)
        );

        if (!notification.read && preferences.notificationsEnabled) {
          void sendLocalNotification({
            title: notification.title,
            body: notification.body,
            data: {
              type: notification.type,
              entityType: notification.entityType,
              entityId: notification.entityId,
            },
          });
        }
      },
    });
  }, [
    authSession?.user?.id,
    hasHydrated,
    preferences.notificationsEnabled,
    supabaseStatus.isConfigured,
  ]);

  useEffect(() => {
    if (
      !hasHydrated ||
      !supabaseStatus.isConfigured ||
      !authSession?.user?.id
    ) {
      return undefined;
    }

    return subscribeToUserMessages({
      userId: authSession.user.id,
      onInsert: ({ chatUser, message }) => {
        setGlobalChats((prevChats) => {
          const normalizedHandle = normalizeHandle(chatUser.handle);
          const existingChat = prevChats.find(
            (chat) => getChatHandleKey(chat) === normalizedHandle
          );

          const nextChat = existingChat
            ? {
                ...existingChat,
                user: chatUser,
                unread: (existingChat.unread || 0) + 1,
                messages: [...existingChat.messages, message],
              }
            : {
                id: `chat-${chatUser.id || chatUser.handle}`,
                user: chatUser,
                unread: 1,
                messages: [message],
              };

          return mergeChatCollections(
            [nextChat],
            prevChats.filter(
              (chat) => getChatHandleKey(chat) !== normalizedHandle
            )
          );
        });

        if (preferences.notificationsEnabled) {
          void sendLocalNotification({
            title:
              message.messageType === 'recommendation'
                ? `${chatUser.name} te recomendó un disco`
                : `${chatUser.name} te escribió`,
            body:
              message.messageType === 'recommendation'
                ? `${message.albumTitle} ya está esperándote en tu inbox.`
                : message.text || 'Tienes un mensaje nuevo en B-Side.',
            data: {
              type: message.messageType || 'message',
              chatId: `chat-${chatUser.id || chatUser.handle}`,
            },
          });
        }
      },
    });
  }, [
    authSession?.user?.id,
    hasHydrated,
    preferences.notificationsEnabled,
    supabaseStatus.isConfigured,
  ]);

  useEffect(() => {
    if (
      !hasHydrated ||
      !preferences.streakAlertsEnabled ||
      !listeningStreak?.isAtRisk
    ) {
      return;
    }

    if (new Date().getHours() < 18) {
      return;
    }

    pushNotification({
      type: 'product',
      title: 'Tu racha esta en riesgo',
      body:
        'Todavía podés salvarla hoy escuchando algo antes de que termine el día.',
      read: false,
      entityType: 'streak-warning',
      dedupeKey: getLocalDayKey(new Date()),
    });
  }, [hasHydrated, listeningStreak?.isAtRisk, preferences.streakAlertsEnabled]);

  const pushNotification = ({
    type = 'product',
    title,
    body,
    read = false,
    entityType = 'product',
    entityId = null,
    dedupeKey = '',
  }) => {
    const nextNotification = normalizeNotification({
      id: createId('notification'),
      type,
      title,
      body,
      timeLabel: getTimeLabel(),
      createdAt: new Date().toISOString(),
      read,
      entityType,
      entityId: entityId || dedupeKey || null,
    });

    setNotifications((prevNotifications) => {
      const hasDuplicate = dedupeKey
        ? prevNotifications.some(
            (notification) =>
              notification.entityType === entityType &&
              notification.entityId === dedupeKey
          )
        : false;

      if (hasDuplicate) {
        return prevNotifications;
      }

      return [nextNotification, ...prevNotifications].slice(0, 50);
    });

    if (!read && preferences.notificationsEnabled) {
      void sendLocalNotification({
        title,
        body,
        data: {
          type,
          entityType,
          entityId: entityId || dedupeKey || null,
        },
      });
    }
  };

  const runMusicOracle = async (focus = '') => {
    setIsOracleBusy(true);
    setOracleMessage('');
    void triggerSelectionFeedback();

    try {
      const normalizedFocus = `${focus || ''}`.trim().toLowerCase();
      const focusPool = normalizedFocus
        ? oracleCandidates.filter((candidate) =>
            [candidate.title, candidate.artist, candidate.reason]
              .filter(Boolean)
              .some((value) =>
                `${value}`.trim().toLowerCase().includes(normalizedFocus)
              )
          )
        : oracleCandidates;
      const result = await getMusicOracleRecommendations({
        focus,
        tasteProfile: oracleTasteProfile,
        candidates: oracleCandidates,
      });

      const currentOracleIds = new Set([
        ...oracleRecommendations.map((recommendation) => recommendation.id),
        ...oracleHistoryRef.current,
      ]);
      let nextRecommendations =
        (result.recommendations || []).length > 0
          ? result.recommendations
          : shuffleCollection(focusPool.length >= 3 ? focusPool : oracleCandidates)
              .slice(0, 3)
              .map((candidate) => ({
              ...candidate,
              reason:
                candidate.reason ||
                'Tanda rápida armada con lo que mejor encaja hoy con tu perfil.',
            }));
      let nextSource =
        (result.recommendations || []).length > 0
          ? result.source || 'local'
          : 'fallback';

      const nextIds = nextRecommendations.map((recommendation) => recommendation.id);
      const repeatedSelection =
        nextIds.length > 0 &&
        nextIds.every((recommendationId) => currentOracleIds.has(recommendationId));

      if (repeatedSelection && oracleCandidates.length > nextRecommendations.length) {
        const basePool = focusPool.length >= 3 ? focusPool : oracleCandidates;
        const freshPool = shuffleCollection(basePool).filter(
          (candidate) => !currentOracleIds.has(candidate.id)
        );

        if (freshPool.length) {
          nextRecommendations = [
            ...freshPool.slice(0, 3).map((candidate) => ({
              ...candidate,
              reason:
                candidate.reason ||
                'Otra vuelta armada con señales distintas de tu perfil.',
            })),
          ];
          nextSource = 'shuffle';
        }
      }

      if (!nextRecommendations.length && oracleCandidates.length) {
        nextRecommendations = shuffleCollection(oracleCandidates).slice(0, 3);
        nextSource = 'fallback';
      }

      setOracleRecommendations(nextRecommendations);
      setOracleSource(nextSource);
      oracleHistoryRef.current = nextRecommendations.map(
        (recommendation) => recommendation.id
      );

      if (!nextRecommendations.length) {
        void triggerWarningFeedback();
        Alert.alert(
          'El Oráculo todavía no tiene material',
          'Necesitamos un poco más de actividad o más discos sugeridos para devolverte algo fuerte.'
        );
        setOracleMessage(
          'Todavía no hay suficiente material para armar una tanda con personalidad.'
        );
        return false;
      }

      pushNotification({
        type: 'product',
        title: 'Oráculo actualizado',
        body:
          nextSource === 'remote'
            ? 'B-Side Lab te dejó tres discos nuevos para probar.'
            : nextSource === 'shuffle'
              ? 'Movimos el radar para mostrarte otra tanda distinta.'
            : nextSource === 'fallback'
              ? 'Te dejamos una tanda rápida armada con lo que más encaja hoy.'
              : 'Te dejamos una selección afinada con tu historial reciente.',
        read: true,
      });

      void triggerSuccessFeedback();

      setOracleMessage(
        nextSource === 'remote'
          ? 'Tanda afinada con B-Side Lab.'
          : nextSource === 'shuffle'
            ? 'Movimos la selección para no repetirte exactamente lo mismo.'
          : nextSource === 'fallback'
            ? 'Tanda rápida armada con tus señales más fuertes.'
            : 'Tanda afinada con tu perfil actual.'
      );

      return true;
    } catch (error) {
      console.error('No pudimos actualizar el Oráculo:', error);
      void triggerErrorFeedback();
      setOracleMessage(
        'No pudimos refrescar la tanda ahora mismo. Probá otra vez en un rato.'
      );
      Alert.alert(
        'No pudimos actualizar el Oráculo',
        'Intentá otra vez en un rato.'
      );
      return false;
    } finally {
      setIsOracleBusy(false);
    }
  };

  const refreshSpotifyConnection = async () => {
    const result = await getSpotifyUserSession();

    if (!result.ok) {
      setSpotifySession(null);
      setSpotifyProfile(null);
      return result;
    }

    const nextSession = result.session || null;
    setSpotifySession(nextSession);

    if (!nextSession?.accessToken) {
      setSpotifyProfile(null);
      return result;
    }

    const profileResult = await fetchSpotifyCurrentUser();

    if (profileResult.ok) {
      setSpotifyProfile(profileResult.profile || null);
    } else {
      setSpotifyProfile(null);
    }

    return {
      ...result,
      profile: profileResult.ok ? profileResult.profile : null,
    };
  };

  const syncPushRegistration = async () => {
    const result = await registerForPushNotifications();

    setPushPermissionStatus(
      result.ok
        ? result.permission || 'granted'
        : result.permission || (result.skipped ? 'skipped' : 'denied')
    );

    if (
      result.ok &&
      result.token &&
      authSession?.user?.id &&
      supabaseStatus.isConfigured
    ) {
      const response = await upsertPushDeviceToken({
        userId: authSession.user.id,
        token: result.token,
        platform: result.platform || Platform.OS,
        projectId: result.projectId || '',
      });

      if (!response.ok && response.message) {
        setAuthMessage((prevMessage) => prevMessage || response.message);
      }
    }

    return result;
  };

  const requestPushPermissions = async () => {
    const result = await syncPushRegistration();

    if (result.ok) {
      void triggerSuccessFeedback();
      setAuthMessage(
        result.isWeb
          ? 'Avisos del navegador activos.'
          : 'Avisos del sistema listos en este dispositivo.'
      );

      if (preferences.notificationsEnabled) {
        await sendLocalNotification({
          title: 'Avisos listos',
          body: result.isWeb
            ? 'B-Side ya puede avisarte desde este navegador.'
            : 'Este dispositivo ya quedó listo para recibir avisos de B-Side.',
          data: {
            type: 'push-ready',
          },
        });
      }
    } else if (!result.skipped) {
      void triggerWarningFeedback();
      setAuthMessage(
        result.message || 'No pudimos activar los avisos del sistema.'
      );
    }

    return result;
  };

  const connectSpotifyAccount = async (options = {}) => {
    if (!spotifyStatus.isConfigured) {
      Alert.alert(
        'Spotify pendiente',
        'Falta EXPO_PUBLIC_SPOTIFY_CLIENT_ID para conectar una cuenta real.'
      );
      return false;
    }

    if (spotifySession?.accessToken) {
      return true;
    }

    if (options.pendingListId) {
      await setPendingSpotifyExportList(options.pendingListId);
    }

    const result = await startSpotifyConnect();

    if (!result.ok) {
      Alert.alert('No pudimos conectar Spotify', result.message);
      return false;
    }

    pushNotification({
      type: 'product',
      title: 'Conectando Spotify',
      body: 'Terminá el permiso en Spotify. B-Side retoma la exportación apenas vuelvas.',
      read: true,
    });

    return true;
  };

  const exportListToSpotify = async (listId) => {
    const list = listId === 'wishlist'
      ? wishlistList
      : lists.find((candidateList) => candidateList.id === listId);

    if (!list) {
      void triggerWarningFeedback();
      setSpotifyExportStatus({
        listId,
        status: 'error',
        title: 'Lista no disponible',
        message: 'Esperá a que termine de cargar y volvé a intentar.',
        matchedCount: 0,
        missingCount: 0,
        albumSeedCount: 0,
        unmatchedTracks: [],
        playlistUrl: '',
        updatedAt: new Date().toISOString(),
      });
      Alert.alert(
        'Todavía no cargamos esa lista',
        'Esperá un segundo y volvé a intentar la exportación.'
      );
      return false;
    }

    if (!spotifySession?.accessToken) {
      void triggerSelectionFeedback();
      setSpotifyExportStatus({
        listId,
        status: 'pending-connection',
        title: 'Conectá Spotify',
        message: 'Primero vinculá tu cuenta para crear esta playlist en Spotify.',
        matchedCount: 0,
        missingCount: list.items.length,
        albumSeedCount: 0,
        unmatchedTracks: list.items
          .slice(0, 3)
          .map((item) => `${item.title} · ${item.artist}`),
        playlistUrl: '',
        updatedAt: new Date().toISOString(),
      });
      const connected = await connectSpotifyAccount({ pendingListId: listId });
      return connected;
    }

    setIsSpotifyExportBusy(true);
    void triggerSelectionFeedback();

    try {
      const result = await exportListToSpotifyPlaylist(list);

      if (!result.ok) {
        void triggerErrorFeedback();
        setSpotifyExportStatus({
          listId,
          status: 'error',
          title: 'No pudimos crear la playlist',
          message: result.message,
          matchedCount: 0,
          missingCount: list.items.length,
          albumSeedCount: 0,
          unmatchedTracks: list.items
            .slice(0, 3)
            .map((item) => `${item.title} · ${item.artist}`),
          playlistUrl: '',
          updatedAt: new Date().toISOString(),
        });
        Alert.alert('No pudimos exportar la lista', result.message);
        return false;
      }

      void triggerSuccessFeedback();
      setSpotifyExportStatus({
        listId,
        status: 'success',
        title: 'Playlist lista',
        message:
          result.missingCount > 0
            ? 'Spotify armó la playlist, pero dejó algunos discos afuera.'
            : 'La playlist ya quedó lista en tu cuenta.',
        matchedCount: result.matchedCount,
        missingCount: result.missingCount,
        albumSeedCount: result.albumSeedCount,
        directMatchCount: result.directMatchCount,
        unmatchedTracks: (result.unmatchedTracks || []).slice(0, 3),
        playlistUrl: result.playlist?.external_urls?.spotify || '',
        updatedAt: new Date().toISOString(),
      });

      pushNotification({
        type: 'product',
        title: 'Lista exportada a Spotify',
        body:
          `"${list.name}" ya se creó en Spotify con ${result.matchedCount} tema${
            result.matchedCount === 1 ? '' : 's'
          }.` +
          (result.albumSeedCount
            ? ` ${result.albumSeedCount} salieron de discos que se resolvieron como sampler.`
            : ''),
        read: true,
      });

      if (result.playlist?.external_urls?.spotify) {
        const exportedDisks = result.matchedCount + result.missingCount;
        const exportSummary =
          result.missingCount > 0
            ? `Spotify pudo convertir ${result.matchedCount} de ${exportedDisks} discos en una playlist. ${
                result.albumSeedCount
                  ? `${result.albumSeedCount} entraron usando un tema representativo del álbum. `
                  : ''
              }${result.missingCount} quedaron afuera porque Spotify no encontró una versión útil.`
            : result.albumSeedCount
              ? `Tu lista ya está en Spotify. ${result.albumSeedCount} discos entraron como temas representativos del álbum.`
              : 'La playlist ya está lista en tu cuenta de Spotify.';

        Alert.alert(
          'Playlist lista',
          exportSummary,
          [
            { text: 'Cerrar', style: 'cancel' },
            {
              text: 'Abrir Spotify',
              onPress: () => {
                void Linking.openURL(result.playlist.external_urls.spotify);
              },
            },
          ]
        );
      }

      return true;
    } finally {
      setIsSpotifyExportBusy(false);
    }
  };

  const disconnectSpotifyAccount = async () => {
    const result = await disconnectSpotifyUser();
    setSpotifySession(null);
    setSpotifyProfile(null);
    return result;
  };

  const loadAuthenticatedCollections = async ({
    userId,
    fallbackHandle,
    localReviews = [],
    localLists = [],
    localFollowingHandles = [],
    localBlockedHandles = [],
    localReports = [],
  }) => {
    const [socialSnapshot, remoteReviewsSnapshot, remoteListsSnapshot] =
      await Promise.all([
        fetchSocialSnapshot(userId),
        fetchCurrentUserReviews(userId, fallbackHandle),
        fetchCurrentUserLists(userId),
      ]);

    const messages = [];

    const nextFollowingHandles = socialSnapshot.ok
      ? mergeHandleCollections(
          localFollowingHandles,
          socialSnapshot.followingHandles
        )
      : localFollowingHandles;
    const nextBlockedHandles = socialSnapshot.ok
      ? mergeHandleCollections(localBlockedHandles, socialSnapshot.blockedHandles)
      : localBlockedHandles;
    const nextReports = socialSnapshot.ok
      ? mergeReportsById(socialSnapshot.reports, localReports)
      : localReports;
    const nextReviews = remoteReviewsSnapshot.ok
      ? mergeEntitiesBySource('review', localReviews, remoteReviewsSnapshot.reviews)
      : localReviews;
    const nextLists = remoteListsSnapshot.ok
      ? mergeEntitiesBySource('list', localLists, remoteListsSnapshot.lists)
      : localLists;

    if (!socialSnapshot.ok && socialSnapshot.message) {
      messages.push(socialSnapshot.message);
    }

    if (!remoteReviewsSnapshot.ok && remoteReviewsSnapshot.message) {
      messages.push(remoteReviewsSnapshot.message);
    }

    if (!remoteListsSnapshot.ok && remoteListsSnapshot.message) {
      messages.push(remoteListsSnapshot.message);
    }

    return {
      followingHandles: nextFollowingHandles,
      blockedHandles: nextBlockedHandles,
      reports: nextReports,
      reviews: nextReviews,
      lists: nextLists,
      message: messages[0] || '',
    };
  };

  const applyAuthenticatedUser = (session, nextUser, options = {}) => {
    const { userChanged = false } = options;
    const resolvedTop5 = userChanged ? initialState.top5 : top5Ref.current;
    const resolvedUser = {
      ...(userChanged ? initialState.currentUser : currentUserRef.current),
      ...nextUser,
      id: session?.user?.id || nextUser.id,
      email:
        session?.user?.email || nextUser.email || currentUserRef.current.email,
      top5: resolvedTop5,
    };

    logAuthDebug('apply_authenticated_user', {
      userId: resolvedUser.id,
      sessionUserId: session?.user?.id || '',
      userChanged,
    });

    authSessionRef.current = session || null;
    currentUserRef.current = resolvedUser;
    setAuthSession(session || null);
    setCurrentUser(resolvedUser);

    if (userChanged) {
      top5Ref.current = initialState.top5;
      setTop5(initialState.top5);
    }

    setPreferences((prevPreferences) => ({
      ...prevPreferences,
      hasCompletedOnboarding: true,
      sessionMode: session?.user ? 'authenticated' : prevPreferences.sessionMode,
    }));
  };

  const persistProfileToBackend = async (profileDraft) => {
    const activeSession = authSessionRef.current;

    if (!supabaseStatus.isConfigured || !activeSession?.user?.id) {
      return {
        ok: false,
        skipped: true,
        message: 'Supabase todavía no está conectado a una sesión activa.',
      };
    }

    let nextUser = {
      ...currentUserRef.current,
      ...profileDraft,
      id: activeSession.user.id,
      email: activeSession.user.email || currentUserRef.current.email,
    };

    logAuthDebug('persist_profile_start', {
      userId: activeSession.user.id,
      handle: nextUser.handle,
    });

    const avatarReview = reviewProfileAssetSource(nextUser.avatarUrl);
    const wallpaperReview = reviewProfileAssetSource(nextUser.wallpaperUrl);

    if (!avatarReview.accepted) {
      return { ok: false, message: avatarReview.message };
    }

    if (!wallpaperReview.accepted) {
      return { ok: false, message: wallpaperReview.message };
    }

    nextUser = {
      ...nextUser,
      avatarModerationStatus: avatarReview.moderationStatus,
      wallpaperModerationStatus: wallpaperReview.moderationStatus,
    };

    if (shouldUploadProfileAsset(nextUser.avatarUrl)) {
      const uploadAvatar = await uploadProfileAsset({
        bucket: PROFILE_BUCKETS.avatar,
        fileUri: nextUser.avatarUrl,
        userId: activeSession.user.id,
        prefix: 'avatar',
      });

      if (!uploadAvatar.ok) {
        return { ok: false, message: uploadAvatar.message };
      }

      nextUser = {
        ...nextUser,
        avatarUrl: uploadAvatar.publicUrl,
        avatarModerationStatus: PROFILE_ASSET_MODERATION.pendingReview,
      };
    }

    if (shouldUploadProfileAsset(nextUser.wallpaperUrl)) {
      const uploadWallpaper = await uploadProfileAsset({
        bucket: PROFILE_BUCKETS.wallpaper,
        fileUri: nextUser.wallpaperUrl,
        userId: activeSession.user.id,
        prefix: 'wallpaper',
      });

      if (!uploadWallpaper.ok) {
        return { ok: false, message: uploadWallpaper.message };
      }

      nextUser = {
        ...nextUser,
        wallpaperUrl: uploadWallpaper.publicUrl,
        wallpaperModerationStatus: PROFILE_ASSET_MODERATION.pendingReview,
      };
    }

    const saveProfileResult = await upsertProfile(nextUser);

    if (!saveProfileResult.ok) {
      return saveProfileResult;
    }

    return {
      ok: true,
      user: {
        ...saveProfileResult.user,
        email: activeSession.user.email || nextUser.email,
        top5: top5Ref.current,
      },
    };
  };

  const refreshAuthenticatedUser = async (
    fallbackUser = currentUserRef.current,
    options = {}
  ) => {
    if (!supabaseStatus.isConfigured) {
      return {
        ok: false,
        message: 'Supabase todavía no está configurado.',
      };
    }

    const refreshSequence = ++authRefreshSequenceRef.current;
    const previousUserId = authSessionRef.current?.user?.id || '';

    logAuthDebug('refresh_authenticated_user:start', {
      refreshSequence,
      source: options.source || 'manual',
      previousUserId,
      fallbackUserId: fallbackUser?.id || '',
    });

    const snapshot = await getAuthenticatedProfileSnapshot(fallbackUser);

    if (refreshSequence !== authRefreshSequenceRef.current) {
      logAuthDebug('refresh_authenticated_user:stale_after_snapshot', {
        refreshSequence,
      });
      return { ok: false, skipped: true };
    }

    if (!snapshot.ok) {
      logAuthDebug('refresh_authenticated_user:error', {
        refreshSequence,
        message: snapshot.message,
      });
      return snapshot;
    }

    if (!snapshot.session?.user) {
      resetToAuthEntry({
        entry: 'access',
        message: 'No encontramos una sesión activa.',
      });
      return {
        ok: true,
        session: null,
      };
    }

    const nextUserId = snapshot.session.user.id;
    const userChanged = Boolean(
      options.userChanged || (previousUserId && previousUserId !== nextUserId)
    );

    if (userChanged) {
      clearUserScopedState();
    }

    applyAuthenticatedUser(snapshot.session, snapshot.user, { userChanged });
    setPreferences((prevPreferences) => ({
      ...prevPreferences,
      profileSetupRequired: !hasCompletedPublicProfile(snapshot.user),
    }));

    const remoteState = await loadAuthenticatedCollections({
      userId: snapshot.session.user.id,
      fallbackHandle: snapshot.user.handle || fallbackUser.handle,
      localReviews: userChanged ? initialState.reviews : reviewsRef.current,
      localLists: userChanged ? initialState.lists : listsRef.current,
      localFollowingHandles: userChanged
        ? initialState.followingHandles
        : followingHandlesRef.current,
      localBlockedHandles: userChanged
        ? initialState.blockedHandles
        : blockedHandlesRef.current,
      localReports: userChanged ? initialState.reports : reportsRef.current,
    });

    if (refreshSequence !== authRefreshSequenceRef.current) {
      logAuthDebug('refresh_authenticated_user:stale_after_remote', {
        refreshSequence,
      });
      return { ok: false, skipped: true };
    }

    setReviews(remoteState.reviews);
    setLists(remoteState.lists);
    setFollowingHandles(remoteState.followingHandles);
    setBlockedHandles(remoteState.blockedHandles);
    setReports(remoteState.reports);

    reviewsRef.current = remoteState.reviews;
    listsRef.current = remoteState.lists;
    followingHandlesRef.current = remoteState.followingHandles;
    blockedHandlesRef.current = remoteState.blockedHandles;
    reportsRef.current = remoteState.reports;

    if (remoteState.message) {
      setAuthMessage(remoteState.message);
    }

    return {
      ok: true,
      session: snapshot.session,
      user: snapshot.user,
    };
  };

  const syncListDraftToBackend = async (listDraft) => {
    if (!supabaseStatus.isConfigured || !authSession?.user?.id) {
      return { ok: false, skipped: true };
    }

    const normalizedList = normalizeList(listDraft);
    let backendId = normalizedList.backendId;

    if (!backendId) {
      const createResult = await createListRecord(authSession.user.id, normalizedList);

      if (!createResult.ok) {
        if (!createResult.skipped) {
          setAuthMessage(createResult.message);
        }

        return createResult;
      }

      backendId = createResult.backendId;

      setLists((prevLists) =>
        prevLists.map((list) =>
          list.id === normalizedList.id ? { ...list, backendId } : list
        )
      );
    }

    const syncedList = {
      ...normalizedList,
      backendId,
    };

    const updateResult = await updateListRecord(backendId, syncedList);

    if (!updateResult.ok) {
      setAuthMessage(updateResult.message);
      return updateResult;
    }

    const itemsResult = await replaceListItemsRecord(backendId, syncedList.items);

    if (!itemsResult.ok) {
      setAuthMessage(itemsResult.message);
      return itemsResult;
    }

    return {
      ok: true,
      backendId,
    };
  };

  const syncReviewDraftToBackend = async (reviewDraft) => {
    if (!supabaseStatus.isConfigured || !authSession?.user?.id) {
      return { ok: false, skipped: true };
    }

    const normalizedReviewDraft = normalizeReview(reviewDraft);

    if (!normalizedReviewDraft.backendId) {
      const createResult = await createReviewRecord(
        authSession.user.id,
        normalizedReviewDraft
      );

      if (!createResult.ok) {
        if (!createResult.skipped) {
          setAuthMessage(createResult.message);
        }

        return createResult;
      }

      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === normalizedReviewDraft.id
            ? { ...review, backendId: createResult.backendId }
            : review
        )
      );

      return {
        ok: true,
        backendId: createResult.backendId,
      };
    }

    const updateResult = await updateReviewRecord(
      normalizedReviewDraft.backendId,
      normalizedReviewDraft
    );

    if (!updateResult.ok) {
      setAuthMessage(updateResult.message);
      return updateResult;
    }

    return {
      ok: true,
      backendId: normalizedReviewDraft.backendId,
    };
  };

  const syncDeletedReviewToBackend = async (reviewDraft) => {
    if (
      !supabaseStatus.isConfigured ||
      !authSession?.user?.id ||
      !reviewDraft?.backendId
    ) {
      return { ok: false, skipped: true };
    }

    const deleteResult = await deleteReviewRecord(reviewDraft.backendId);

    if (!deleteResult.ok) {
      setAuthMessage(deleteResult.message);
    }

    return deleteResult;
  };

  const isCurrentUserHandle = (handle) => {
    if (!handle) return false;

    const normalizedHandle = normalizeHandle(handle);

    return normalizedHandle === CURRENT_USER_HANDLE || normalizedHandle === currentUserHandle;
  };
  const isFollowingHandle = (handle) =>
    followingHandles.includes(normalizeHandle(handle));
  const isBlockedHandle = (handle) =>
    blockedHandles.includes(normalizeHandle(handle));

  const getSocialStatsForHandle = (handle) => {
    const resolvedUser = resolveUserSnapshot(handle);

    return {
      followersCount: resolvedUser?.followersCount || 0,
      followingCount: resolvedUser?.followingCount || 0,
    };
  };
  const getCompatibilityForHandle = (handle) => {
    if (!handle || isCurrentUserHandle(handle)) {
      return null;
    }

    const normalizedHandle = normalizeHandle(handle);
    const user = resolveUserSnapshot(normalizedHandle);
    const userReviews = visibleReviews.filter(
      (review) => normalizeHandle(review.user) === normalizedHandle
    );

    return buildCompatibilitySummary({
      user,
      userReviews,
      ownTasteAlbumKeys,
      ownTasteArtistKeys,
    });
  };
  const getUserByHandle = (handle) => resolveUserSnapshot(handle);
  const getArtistSnapshot = (artistName) => {
    const normalizedArtist = createArtistKey(artistName);

    if (!normalizedArtist) {
      return {
        fans: [],
        reviews: [],
        relatedArtists: [],
      };
    }

    const reviewsForArtist = visibleReviews
      .filter((review) => createArtistKey(review.artist) === normalizedArtist)
      .sort(
        (left, right) =>
          getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt)
      )
      .slice(0, 4);
    const fanMap = new Map();
    const relatedArtistMap = new Map();

    const markFan = (handle, reason) => {
      const normalizedHandle = normalizeHandle(handle);

      if (normalizedHandle === currentUserHandle) {
        return;
      }

      const user = resolveUserSnapshot(normalizedHandle);

      if (!user) {
        return;
      }

      fanMap.set(normalizedHandle, {
        ...user,
        handle: normalizedHandle,
        reason,
      });

      const otherAlbums = [
        ...(user.top5 || []),
        ...visibleReviews
          .filter((review) => normalizeHandle(review.user) === normalizedHandle)
          .map((review) => ({
            title: review.albumTitle,
            artist: review.artist,
            cover: review.cover,
            artistId: review.artistId,
            artistUrl: review.artistUrl,
            source: review.source,
          })),
      ];

      otherAlbums.forEach((album) => {
        const otherArtistKey = createArtistKey(album.artist);

        if (!otherArtistKey || otherArtistKey === normalizedArtist) {
          return;
        }

        const existingRelatedArtist = relatedArtistMap.get(otherArtistKey) || {
          name: album.artist,
          cover: album.cover || '',
          artistId: album.artistId || '',
          artistUrl: album.artistUrl || '',
          source: album.source || '',
          anchorAlbumTitle: album.title || '',
          score: 0,
        };

        existingRelatedArtist.score += 6;
        existingRelatedArtist.cover = existingRelatedArtist.cover || album.cover || '';
        existingRelatedArtist.artistId =
          existingRelatedArtist.artistId || album.artistId || '';
        existingRelatedArtist.artistUrl =
          existingRelatedArtist.artistUrl || album.artistUrl || '';
        existingRelatedArtist.source =
          existingRelatedArtist.source || album.source || '';
        existingRelatedArtist.anchorAlbumTitle =
          existingRelatedArtist.anchorAlbumTitle || album.title || '';
        relatedArtistMap.set(otherArtistKey, existingRelatedArtist);
      });
    };

    reviewsForArtist.forEach((review) => {
      markFan(review.user, `Lo reseñó en "${review.albumTitle}".`);
    });

    listeningHistory
      .filter((entry) => createArtistKey(entry.artist) === normalizedArtist)
      .forEach((entry) => {
        if (entry.source === 'player') {
          markFan(currentUserHandle, `Lo escuchaste recientemente con "${entry.title}".`);
        }
      });

    Object.entries(MOCK_USERS).forEach(([handle, user]) => {
      if (
        (user.top5 || []).some(
          (album) => createArtistKey(album.artist) === normalizedArtist
        )
      ) {
        markFan(handle, 'Lo tiene dentro de su Top 5.');
      }
    });

    lists
      .filter((list) => !list.isSystem)
      .forEach((list) => {
        const touchesArtist = list.items.some(
          (album) => createArtistKey(album.artist) === normalizedArtist
        );

        if (!touchesArtist) {
          return;
        }

        list.items.forEach((album) => {
          const otherArtistKey = createArtistKey(album.artist);

          if (!otherArtistKey || otherArtistKey === normalizedArtist) {
            return;
          }

          const existingRelatedArtist = relatedArtistMap.get(otherArtistKey) || {
            name: album.artist,
            cover: album.cover || '',
            artistId: album.artistId || '',
            artistUrl: album.artistUrl || '',
            source: album.source || '',
            anchorAlbumTitle: album.title || '',
            score: 0,
          };

          existingRelatedArtist.score += 4;
          existingRelatedArtist.cover = existingRelatedArtist.cover || album.cover || '';
          existingRelatedArtist.anchorAlbumTitle =
            existingRelatedArtist.anchorAlbumTitle || album.title || '';
          relatedArtistMap.set(otherArtistKey, existingRelatedArtist);
        });
      });

    if (wishlist.some((album) => createArtistKey(album.artist) === normalizedArtist)) {
      recentListening.slice(0, 8).forEach((entry) => {
        const otherArtistKey = createArtistKey(entry.artist);

        if (!otherArtistKey || otherArtistKey === normalizedArtist) {
          return;
        }

        const existingRelatedArtist = relatedArtistMap.get(otherArtistKey) || {
          name: entry.artist,
          cover: entry.cover || '',
          artistId: entry.artistId || '',
          artistUrl: entry.artistUrl || '',
          source: entry.source || '',
          anchorAlbumTitle: entry.title || '',
          score: 0,
        };

        existingRelatedArtist.score += 3;
        existingRelatedArtist.cover = existingRelatedArtist.cover || entry.cover || '';
        existingRelatedArtist.anchorAlbumTitle =
          existingRelatedArtist.anchorAlbumTitle || entry.title || '';
        relatedArtistMap.set(otherArtistKey, existingRelatedArtist);
      });
    }

    return {
      fans: Array.from(fanMap.values()).slice(0, 4),
      reviews: reviewsForArtist,
      relatedArtists: Array.from(relatedArtistMap.values())
        .sort((left, right) => right.score - left.score)
        .slice(0, 6),
    };
  };
  const getListById = (listId) => {
    if (listId === 'wishlist') {
      return wishlistList;
    }

    return lists.find((list) => list.id === listId) || null;
  };
  const getChatById = (chatId) =>
    globalChats.find((chat) => chat.id === chatId) || null;
  const isAlbumInWishlist = (album) => {
    if (!album) {
      return false;
    }

    const albumKey = createAlbumKey(album.title, album.artist);
    const albumId = album.albumId || album.id || albumKey;

    return wishlist.some(
      (item) =>
        (item.albumId || item.id) === albumId ||
        createAlbumKey(item.title, item.artist) === albumKey
    );
  };

  const hydrateResolvedPlaybackAcrossState = (originalTrack, playableTrack) => {
    const reference = buildAlbumReference(originalTrack);

    if (!reference.albumId && !reference.albumKey) {
      return;
    }

    setWishlist((prevWishlist) =>
      prevWishlist.map((item) =>
        matchesAlbumReference(item, reference)
          ? mergePlayableTrackData(item, playableTrack)
          : item
      )
    );
    setLists((prevLists) =>
      prevLists.map((list) => ({
        ...list,
        items: list.items.map((item) =>
          matchesAlbumReference(item, reference)
            ? mergePlayableTrackData(item, playableTrack)
            : item
        ),
      }))
    );
    setTop5((prevTop5) =>
      prevTop5.map((item) =>
        matchesAlbumReference(item, reference)
          ? mergePlayableTrackData(item, playableTrack)
          : item
      )
    );
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        matchesAlbumReference(
          {
            albumId: review.albumId,
            title: review.albumTitle,
            artist: review.artist,
          },
          reference
        )
          ? {
              ...review,
              previewUrl: review.previewUrl || playableTrack.previewUrl || '',
            }
          : review
      )
    );
    setReviewAlbum((prevAlbum) =>
      prevAlbum && matchesAlbumReference(prevAlbum, reference)
        ? mergePlayableTrackData(prevAlbum, playableTrack)
        : prevAlbum
    );
    setListModalAlbum((prevAlbum) =>
      prevAlbum && matchesAlbumReference(prevAlbum, reference)
        ? mergePlayableTrackData(prevAlbum, playableTrack)
        : prevAlbum
    );
    setRecommendedAlbum((prevAlbum) =>
      prevAlbum && matchesAlbumReference(prevAlbum, reference)
        ? mergePlayableTrackData(prevAlbum, playableTrack)
        : prevAlbum
    );
    setCurrentTrack((prevTrack) =>
      prevTrack && matchesAlbumReference(prevTrack, reference)
        ? mergePlayableTrackData(prevTrack, playableTrack)
        : prevTrack
    );
  };

  const openExternalPlaybackLink = async (track) => {
    const nextUrl = `${track?.externalUrl || ''}`.trim();

    if (!nextUrl) {
      return false;
    }

    try {
      const canOpen = await Linking.canOpenURL(nextUrl);

      if (!canOpen) {
        return false;
      }

      await Linking.openURL(nextUrl);
      return true;
    } catch (error) {
      console.warn('No pudimos abrir el enlace externo del album:', error);
      return false;
    }
  };

  const resolveTrackForPlayback = async (track) => {
    if (!track) {
      return null;
    }

    if (track.previewUrl) {
      return track;
    }

    const reference = buildAlbumReference(track);
    const cacheKey = reference.albumId || reference.albumKey;

    if (cacheKey && playbackResolutionCacheRef.current.has(cacheKey)) {
      const cachedTrack = playbackResolutionCacheRef.current.get(cacheKey);
      return cachedTrack
        ? mergePlayableTrackData(track, cachedTrack)
        : null;
    }

    const resolution = await resolveAlbumPlayback(track);
    let playableTrack =
      resolution?.ok && resolution.track?.previewUrl
        ? mergePlayableTrackData(track, resolution.track)
        : null;

    if (!playableTrack) {
      try {
        const albumTracks = await fetchAlbumTracks(track);
        const firstPlayableTrack =
          albumTracks.find((candidate) => candidate.previewUrl) ||
          albumTracks.find((candidate) => candidate.externalUrl) ||
          null;

        if (firstPlayableTrack) {
          playableTrack = mergePlayableTrackData(track, firstPlayableTrack);
        }
      } catch (error) {
        if (error?.name === 'AbortError') {
          throw error;
        }
      }
    }

    if (!playableTrack) {
      if (cacheKey) {
        playbackResolutionCacheRef.current.set(cacheKey, null);
      }

      return null;
    }

    if (cacheKey) {
      playbackResolutionCacheRef.current.set(cacheKey, playableTrack);
    }

    hydrateResolvedPlaybackAcrossState(track, playableTrack);
    return playableTrack;
  };

  const playTrack = async (track) => {
    if (!track) return false;

    const playableTrack = track.previewUrl
      ? track
      : await resolveTrackForPlayback(track);

    if (!playableTrack?.previewUrl) {
      const fallbackTrack = playableTrack || track;
      const hasExternalUrl = `${fallbackTrack?.externalUrl || ''}`.trim().length > 0;

      if (hasExternalUrl) {
        void triggerSelectionFeedback();
        const didOpenExternal = await openExternalPlaybackLink(fallbackTrack);

        if (!didOpenExternal) {
          void triggerErrorFeedback();
          Alert.alert(
            'No pudimos abrir el release',
            'B-Side encontro un enlace externo, pero no logramos abrirlo desde este dispositivo.'
          );
        }

        return false;
      }

      void triggerWarningFeedback();
      Alert.alert(
        'Sin audio disponible',
        'Este release aparece en el catálogo, pero no trajo preview ni una salida externa confiable. Igual podés guardarlo, reseñarlo o seguir al artista.'
      );

      return false;
    }

    const nextListeningEntry = normalizeListeningEntry({
      ...playableTrack,
      albumId: playableTrack.albumId || playableTrack.id || playableTrack.title,
      createdAt: new Date().toISOString(),
      source: 'player',
    });
    const latestSameAlbum = listeningHistory.find(
      (entry) => entry.albumId === nextListeningEntry.albumId
    );
    const shouldStoreListeningEvent = !(
      latestSameAlbum &&
      Date.now() - getTimestampValue(latestSameAlbum.createdAt) < 20 * 60 * 1000
    );

    setCurrentTrack(playableTrack);
    void triggerSelectionFeedback();
    if (!shouldStoreListeningEvent) {
      return true;
    }

    setListeningHistory((prevHistory) =>
      [nextListeningEntry, ...prevHistory].slice(0, 80)
    );

    if (supabaseStatus.isConfigured && authSession?.user?.id) {
      void createListeningEventRecord(authSession.user.id, nextListeningEntry).then(
        (result) => {
          if (!result.ok && !result.skipped) {
            setAuthMessage(result.message);
          }
        }
      );
    }

    return true;
  };
  const closeTrack = () => setCurrentTrack(null);

  const completeOnboarding = (sessionMode = 'guest') => {
    setPreferences((prevPreferences) => ({
      ...prevPreferences,
      hasCompletedOnboarding: true,
      sessionMode,
    }));

    pushNotification({
      type: 'product',
      title: 'B-Side listo para explorar',
      body:
        sessionMode === 'member_preview'
          ? 'Tu cuenta ya está creada. Solo falta confirmar el email.'
          : 'Entraste como invitado. Todo queda guardado solo en este dispositivo.',
      read: true,
    });
  };

  const restartExperience = () => {
    setPreferences((prevPreferences) => ({
      ...prevPreferences,
      hasCompletedOnboarding: false,
      sessionMode: 'guest',
    }));
    setOracleRecommendations([]);
  };

  const updatePreferences = (nextPreferences) => {
    setPreferences((prevPreferences) => ({
      ...prevPreferences,
      ...nextPreferences,
    }));
  };

  const syncFollowMutation = async (targetHandle, shouldFollow) => {
    if (!supabaseStatus.isConfigured || !authSession?.user?.id) {
      return { ok: false, skipped: true };
    }

    const response = shouldFollow
      ? await followProfileByHandle({
          followerId: authSession.user.id,
          targetHandle,
        })
      : await unfollowProfileByHandle({
          followerId: authSession.user.id,
          targetHandle,
        });

    if (!response.ok && !response.skipped) {
      setAuthMessage(response.message);
    }

    return response;
  };

  const syncBlockMutation = async (targetHandle, shouldBlock) => {
    if (!supabaseStatus.isConfigured || !authSession?.user?.id) {
      return { ok: false, skipped: true };
    }

    const response = shouldBlock
      ? await blockProfileByHandle({
          blockerId: authSession.user.id,
          targetHandle,
        })
      : await unblockProfileByHandle({
          blockerId: authSession.user.id,
          targetHandle,
        });

    if (!response.ok && !response.skipped) {
      setAuthMessage(response.message);
    }

    return response;
  };

  const syncReportMutation = async (localReport) => {
    if (!supabaseStatus.isConfigured || !authSession?.user?.id) {
      return { ok: false, skipped: true };
    }

    const response = await submitProfileReport({
      reporterId: authSession.user.id,
      targetHandle: localReport.targetHandle,
      reason: localReport.reason,
      details: localReport.details,
    });

    if (!response.ok) {
      setAuthMessage(response.message);
      return response;
    }

    if (response.report) {
      setReports((prevReports) =>
        [
          response.report,
          ...prevReports.filter((report) => report.id !== localReport.id),
        ].slice(0, 50)
      );
    }

    return response;
  };

  const toggleFollowUser = (handle) => {
    if (!handle || isCurrentUserHandle(handle)) {
      return false;
    }

    const normalizedHandle = normalizeHandle(handle);
    let isFollowingNow = false;

    setFollowingHandles((prevHandles) => {
      if (prevHandles.includes(normalizedHandle)) {
        return prevHandles.filter((item) => item !== normalizedHandle);
      }

      isFollowingNow = true;
      return [...prevHandles, normalizedHandle];
    });
    setCommunityProfiles((prevProfiles) =>
      prevProfiles.map((profile) => {
        if (normalizeHandle(profile.handle) !== normalizedHandle) {
          return profile;
        }

        return {
          ...profile,
          followersCount: Math.max(
            0,
            (profile.followersCount || 0) + (isFollowingNow ? 1 : -1)
          ),
        };
      })
    );

    void triggerSelectionFeedback();

    pushNotification({
      type: 'social',
      title: isFollowingNow ? 'Ahora sigues este perfil' : 'Dejaste de seguir',
      body: isFollowingNow
        ? `${normalizedHandle} ya aparece en tu radar social.`
        : `${normalizedHandle} salio de tus seguidos.`,
      read: true,
    });

    void syncFollowMutation(normalizedHandle, isFollowingNow).then((response) => {
      if (
        response?.ok &&
        isFollowingNow &&
        authSession?.user?.id &&
        response.targetProfile?.id
      ) {
        return createBackendNotification({
          recipientId: response.targetProfile.id,
          actorId: authSession.user.id,
          type: 'social',
          title: `${currentUserHandle} empezo a seguirte`,
          body: 'Tu perfil sumo un nuevo seguidor en B-Side.',
          entityType: 'profile',
          entityId: normalizedHandle,
        });
      }

      return response;
    });

    return isFollowingNow;
  };

  const blockUser = (handle) => {
    if (!handle || isCurrentUserHandle(handle)) {
      return false;
    }

    const normalizedHandle = normalizeHandle(handle);
    const wasFollowingBeforeBlock = followingHandles.includes(normalizedHandle);
    let hasBlocked = false;

    setBlockedHandles((prevHandles) => {
      if (prevHandles.includes(normalizedHandle)) {
        return prevHandles;
      }

      hasBlocked = true;
      return [...prevHandles, normalizedHandle];
    });
    setFollowingHandles((prevHandles) =>
      prevHandles.filter((item) => item !== normalizedHandle)
    );
    if (wasFollowingBeforeBlock) {
      setCommunityProfiles((prevProfiles) =>
        prevProfiles.map((profile) => {
          if (normalizeHandle(profile.handle) !== normalizedHandle) {
            return profile;
          }

          return {
            ...profile,
            followersCount: Math.max(0, (profile.followersCount || 0) - 1),
          };
        })
      );
    }

    if (hasBlocked) {
      pushNotification({
        type: 'security',
        title: 'Perfil bloqueado',
        body: `${normalizedHandle} deja de aparecer en feed y mensajes.`,
        read: true,
      });
    }

    if (hasBlocked) {
      void syncBlockMutation(normalizedHandle, true);
    }

    return hasBlocked;
  };

  const unblockUser = (handle) => {
    if (!handle) {
      return false;
    }

    const normalizedHandle = normalizeHandle(handle);
    let hasChanged = false;

    setBlockedHandles((prevHandles) => {
      if (!prevHandles.includes(normalizedHandle)) {
        return prevHandles;
      }

      hasChanged = true;
      return prevHandles.filter((item) => item !== normalizedHandle);
    });

    if (hasChanged) {
      pushNotification({
        type: 'security',
        title: 'Perfil desbloqueado',
        body: `${normalizedHandle} vuelve a poder verse dentro de la demo.`,
        read: true,
      });
      void syncBlockMutation(normalizedHandle, false);
    }

    return hasChanged;
  };

  const reportUser = ({ targetHandle, reason = 'Perfil inapropiado', details = '' }) => {
    if (!targetHandle || isCurrentUserHandle(targetHandle)) {
      return null;
    }

    const normalizedHandle = normalizeHandle(targetHandle);
    const existingOpenReport = reports.find(
      (report) =>
        report.targetHandle === normalizedHandle && report.status === 'open'
    );

    if (existingOpenReport) {
      return {
        ok: true,
        duplicate: true,
        report: existingOpenReport,
      };
    }

    const nextReport = {
      id: createId('report'),
      targetHandle: normalizedHandle,
      reason,
      details,
      status: 'open',
      createdLabel: 'Ahora',
    };

    setReports((prevReports) => [nextReport, ...prevReports].slice(0, 50));
    pushNotification({
      type: 'security',
      title: 'Reporte enviado',
      body: `${normalizedHandle} quedo marcado para revision manual.`,
      read: true,
    });
    void syncReportMutation(nextReport);

    return {
      ok: true,
      duplicate: false,
      report: nextReport,
    };
  };

  const saveAuthPreview = ({ name, email, handle, birthDate }) => {
    const normalizedEmail = email.trim().toLowerCase();

    setCurrentUser((prevUser) => ({
      ...prevUser,
      name: name?.trim() || prevUser.name,
      email: normalizedEmail,
      handle: handle?.trim()?.replace(/^@+/, '') || prevUser.handle,
      birthDate: birthDate || prevUser.birthDate || '',
    }));

    setPreferences((prevPreferences) => ({
      ...prevPreferences,
      sessionMode: normalizedEmail ? 'member_preview' : 'guest',
    }));

    pushNotification({
      type: 'security',
      title: 'Acceso listo',
      body: normalizedEmail
        ? `${normalizedEmail} quedó como email principal para entrar después.`
        : 'Seguís usando la app en modo invitado.',
    });
  };

  const registerRealAccount = async ({ name, handle, birthDate, email, password }) => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedBirthDate = birthDate || '';

    setIsAuthBusy(true);
    setAuthMessage('');

    if (authSessionRef.current?.user?.id) {
      logAuthDebug('register_real_account:pre_sign_out', {
        existingUserId: authSessionRef.current.user.id,
        email: normalizedEmail,
      });
      const signOutResult = await signOutSession();

      if (!signOutResult.ok) {
        setIsAuthBusy(false);
        setAuthMessage(signOutResult.message);
        return signOutResult;
      }

      resetToAuthEntry({ entry: 'access', message: '' });
    }

    const handleCheck = await checkHandleAvailability(
      handle,
      authSessionRef.current?.user?.id
    );

    if (!handleCheck.ok || !handleCheck.available) {
      setIsAuthBusy(false);
      setAuthMessage(handleCheck.message || 'Ese @ no está disponible.');
      return {
        ok: false,
        message: handleCheck.message || 'Ese @ no está disponible.',
      };
    }

    const response = await registerWithEmail({
      email: normalizedEmail,
      password,
      metadata: {
        display_name: normalizedName || currentUser.name,
        handle: handleCheck.handle,
        birth_date: normalizedBirthDate,
      },
    });

    if (!response.ok) {
      setIsAuthBusy(false);
      setAuthMessage(response.message);
      return response;
    }

    const provisionalUser = {
      ...initialState.currentUser,
      name: normalizedName || currentUser.name,
      handle: handleCheck.handle || currentUser.handle,
      email: normalizedEmail,
      birthDate: normalizedBirthDate || currentUser.birthDate || '',
      bio: '',
      avatarUrl: '',
      wallpaperUrl: '',
      profileCompletedAt: '',
    };

    currentUserRef.current = {
      ...initialState.currentUser,
      ...provisionalUser,
      top5: top5Ref.current,
    };
    setCurrentUser((prevUser) => ({
      ...prevUser,
      ...provisionalUser,
      top5: prevUser.top5,
    }));

    if (response.data?.session?.user) {
      const ensuredProfile = await upsertProfile({
        ...provisionalUser,
        id: response.data.session.user.id,
      });

      if (ensuredProfile.ok) {
        applyAuthenticatedUser(response.data.session, ensuredProfile.user, {
          userChanged: true,
        });
      } else {
        await refreshAuthenticatedUser(provisionalUser, {
          source: 'register',
          userChanged: true,
        });
      }
    } else {
      setPreferences((prevPreferences) => ({
        ...prevPreferences,
        hasCompletedOnboarding: true,
        sessionMode: 'member_preview',
        profileSetupRequired: true,
      }));
    }

    if (response.data?.session?.user) {
      setPreferences((prevPreferences) => ({
        ...prevPreferences,
        profileSetupRequired: true,
      }));
    }

    pushNotification({
      type: 'security',
      title: 'Cuenta creada',
      body: 'Tu cuenta real ya quedó lista. Revisá tu email para activarla si hace falta.',
      read: true,
    });

    setIsAuthBusy(false);
    setAuthMessage(
      response.data?.session?.user
        ? 'Tu cuenta ya quedó conectada.'
        : 'Revisá tu email para activar tu cuenta.'
    );

    return response;
  };

  const signInRealAccount = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    setIsAuthBusy(true);
    setAuthMessage('');

    if (authSessionRef.current?.user?.id) {
      logAuthDebug('sign_in_real_account:pre_sign_out', {
        existingUserId: authSessionRef.current.user.id,
        email: normalizedEmail,
      });
      const signOutResult = await signOutSession();

      if (!signOutResult.ok) {
        setIsAuthBusy(false);
        setAuthMessage(signOutResult.message);
        return signOutResult;
      }

      resetToAuthEntry({ entry: 'access', message: '' });
    }

    const response = await signInWithEmail({
      email: normalizedEmail,
      password,
    });

    if (!response.ok) {
      setIsAuthBusy(false);
      setAuthMessage(response.message);
      return response;
    }

    const refreshResult = await refreshAuthenticatedUser(
      buildAuthFallbackUser(
        response.data?.user || response.data?.session?.user || {},
        initialState.currentUser,
        true
      ),
      {
        source: 'sign_in',
        userChanged: true,
      }
    );

    if (refreshResult.ok && refreshResult.session?.user) {
      setPreferences((prevPreferences) => ({
        ...prevPreferences,
        profileSetupRequired: !hasCompletedPublicProfile(refreshResult.user),
      }));
      pushNotification({
        type: 'security',
        title: 'Sesión iniciada',
        body: 'Tu cuenta ya quedó activa en B-Side.',
        read: true,
      });
      setAuthMessage('Ya entraste con tu cuenta.');
    }

    setIsAuthBusy(false);

    return response;
  };

  const sendMagicLinkAccess = async (email) => {
    const normalizedEmail = email.trim().toLowerCase();

    setIsAuthBusy(true);
    setAuthMessage('');

    const response = await sendMagicLink(normalizedEmail);

    if (response.ok) {
      setCurrentUser((prevUser) => ({
        ...prevUser,
        email: normalizedEmail,
      }));
      setPreferences((prevPreferences) => ({
        ...prevPreferences,
        hasCompletedOnboarding: true,
        sessionMode: supabaseStatus.isConfigured
          ? 'member_preview'
          : prevPreferences.sessionMode,
      }));
      pushNotification({
        type: 'security',
        title: 'Email enviado',
        body: 'Revisá tu email para continuar.',
        read: true,
      });
      setAuthMessage('Te mandamos un email para entrar.');
    } else {
      setAuthMessage(response.message);
    }

    setIsAuthBusy(false);

    return response;
  };

  const sendPasswordResetAccess = async (email) => {
    const normalizedEmail = email.trim().toLowerCase();

    setIsAuthBusy(true);
    setAuthMessage('');

    const response = await sendPasswordReset(normalizedEmail);

    if (response.ok) {
      setAuthMessage('Te mandamos un email para cambiar la contraseña.');
    } else {
      setAuthMessage(response.message);
    }

    setIsAuthBusy(false);

    return response;
  };

  const signOutBackendAccount = async () => {
    if (!supabaseStatus.isConfigured || !authSessionRef.current?.user) {
      resetToAuthEntry({
        entry: 'access',
        message: 'Sesión cerrada.',
      });
      return { ok: true };
    }

    setIsAuthBusy(true);
    const response = await signOutSession();
    setIsAuthBusy(false);

    if (response.ok) {
      resetToAuthEntry({
        entry: 'access',
        message: 'Sesión cerrada.',
      });
    } else {
      setAuthMessage(response.message);
    }

    return response;
  };

  const resendVerificationEmail = async () => {
    const targetEmail = `${
      authSessionRef.current?.user?.email || currentUserRef.current.email || ''
    }`
      .trim()
      .toLowerCase();

    if (!targetEmail) {
      return {
        ok: false,
        message: 'No encontramos un email para reenviar la verificación.',
      };
    }

    setIsAuthBusy(true);

    const response = await resendSignupVerificationEmail(targetEmail);

    setIsAuthBusy(false);

    if (response.ok) {
      setAuthMessage('Revisá tu email para activar tu cuenta.');
    } else if (response.message) {
      setAuthMessage(response.message);
    }

    return response;
  };

  const checkProfileHandleAvailability = async (handle) => {
    const activeSession = authSessionRef.current;
    const normalizedHandle = sanitizeProfileHandle(handle);

    logProfileDebug('check_handle:start', {
      handle: normalizedHandle,
      userId: activeSession?.user?.id || currentUserRef.current?.id || '',
    });

    const response = await checkHandleAvailability(
      normalizedHandle,
      activeSession?.user?.id || currentUserRef.current?.id || ''
    );

    logProfileDebug('check_handle:done', {
      handle: normalizedHandle,
      ok: response?.ok,
      available: response?.available,
    });

    return response;
  };

  const signOutOtherBackendSessions = async () => {
    if (!supabaseStatus.isConfigured || !authSessionRef.current?.user) {
      return {
        ok: false,
        message: 'No hay una sesión activa para cerrar en otros dispositivos.',
      };
    }

    setIsAuthBusy(true);
    const response = await signOutOtherSessions();
    setIsAuthBusy(false);

    if (response.ok) {
      setAuthMessage('Las otras sesiones ya quedaron cerradas.');
    } else if (response.message) {
      setAuthMessage(response.message);
    }

    return response;
  };

  const deleteBackendAccount = async () => {
    if (!supabaseStatus.isConfigured || !authSessionRef.current?.user) {
      return {
        ok: false,
        message: 'Necesitás una sesión real activa para borrar la cuenta.',
      };
    }

    setIsAuthBusy(true);
    const response = await requestAccountDeletion();
    setIsAuthBusy(false);

    if (!response.ok) {
      logAuthDebug('delete_account:error', {
        message: response.message,
        details: response.details || null,
      });
      if (response.message) {
        setAuthMessage(response.message);
      }
      return response;
    }

    resetToAuthEntry({
      entry: 'intro',
      keepOnboardingCompleted: false,
      message: 'Tu cuenta se borró y este dispositivo volvió al inicio.',
    });

    return response;
  };

  const setFreemiumPlan = (plan) => {
    let hasChanged = false;
    let nextUser = null;

    setCurrentUser((prevUser) => {
      if (prevUser.plan === plan) return prevUser;

      hasChanged = true;
      nextUser = {
        ...prevUser,
        plan,
      };
      return nextUser;
    });

    if (hasChanged) {
      pushNotification({
        type: 'subscription',
        title: plan === 'plus' ? 'Plan Plus activado' : 'Volviste a Free',
        body:
          plan === 'plus'
            ? 'La demo ya muestra personalizacion y extras premium.'
            : 'La experiencia vuelve al plan base.',
      });

      if (nextUser && authSession?.user) {
        upsertProfile({
          ...nextUser,
          id: authSession.user.id,
          email: authSession.user.email || nextUser.email,
        }).then((result) => {
          if (result.ok) {
            setCurrentUser((prevUser) => ({
              ...prevUser,
              ...result.user,
              email: authSession.user.email || prevUser.email,
              top5,
            }));
          }
        });
      }
    }
  };

  const markNotificationsAsRead = () => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    );

    if (authSession?.user?.id) {
      void markBackendNotificationsAsRead(authSession.user.id).then((result) => {
        if (!result.ok && !result.skipped) {
          setAuthMessage(result.message);
        }
      });
    }
  };

  const dismissNotification = (notificationId) => {
    const targetNotification = notifications.find(
      (notification) => notification.id === notificationId
    );

    setNotifications((prevNotifications) =>
      prevNotifications.filter(
        (notification) => notification.id !== notificationId
      )
    );

    if (authSession?.user?.id && (targetNotification?.backendId || notificationId)) {
      void dismissBackendNotification(
        targetNotification?.backendId || notificationId,
        authSession.user.id
      ).then((result) => {
        if (!result.ok && !result.skipped) {
          setAuthMessage(result.message);
        }
      });
    }
  };

  const openCreateListModal = () => setIsCreateListVisible(true);
  const closeCreateListModal = () => setIsCreateListVisible(false);

  const createList = (input) => {
    const listDraft =
      typeof input === 'string'
        ? { name: input, isPublic: !preferences.privateListsByDefault }
        : input || {};
    const trimmedName = listDraft.name?.trim();

    if (!trimmedName) return;

    const newList = normalizeList({
      id: createId('list'),
      name: trimmedName,
      color: createRandomColor(),
      isPublic:
        typeof listDraft.isPublic === 'boolean'
          ? listDraft.isPublic
          : !preferences.privateListsByDefault,
      items: [],
    });

    setLists((prevLists) => [...prevLists, newList]);
    setIsCreateListVisible(false);

    void syncListDraftToBackend(newList);

    pushNotification({
      type: 'product',
      title: 'Nueva lista creada',
      body: `"${trimmedName}" ya quedo lista como ${
        newList.isPublic ? 'publica' : 'privada'
      }.`,
      read: true,
    });
  };

  const addAlbumToWishlist = (album) => {
    if (!album) return false;

    const nextEntry = createListEntry(album);

    if (
      wishlist.some(
        (item) =>
          (item.albumId || item.id) === nextEntry.albumId ||
          createAlbumKey(item.title, item.artist) ===
            createAlbumKey(nextEntry.title, nextEntry.artist)
      )
    ) {
      Alert.alert(
        'Ya estaba guardado',
        `"${album.title}" ya está en tu lista Por escuchar.`
      );
      return false;
    }

    setWishlist((prevWishlist) => [nextEntry, ...prevWishlist].slice(0, 80));
    pushNotification({
      type: 'product',
      title: 'Guardado para después',
      body: `"${album.title}" entró en tu lista Por escuchar.`,
      read: true,
    });

    return true;
  };

  const removeWishlistAlbum = (entryId) => {
    setWishlist((prevWishlist) =>
      prevWishlist.filter((item) => (item.entryId || item.id) !== entryId)
    );
  };

  const pinToTop5 = (album) => {
    let nextTop5 = null;

    setTop5((prevTop5) => {
      const isAlreadyPinned = prevTop5.some((item) => item.id === album.id);

      if (isAlreadyPinned) {
        nextTop5 = prevTop5.filter((item) => item.id !== album.id);
        return nextTop5;
      }

      if (prevTop5.length >= 5) {
        void triggerWarningFeedback();
        Alert.alert(
          'Limite',
          'Maximo 5 discos. Desfija uno para agregar este.'
        );
        return prevTop5;
      }

      nextTop5 = [...prevTop5, album];
      return nextTop5;
    });

    if (nextTop5) {
      void triggerSuccessFeedback();
      pushNotification({
        type: 'product',
        title: 'Top 5 actualizado',
        body: `"${album.title}" ahora forma parte de tu seleccion.`,
        read: true,
      });
    }
  };

  const toggleScratch = (reviewId) => {
    let scratchState = null;

    setReviews((prevReviews) =>
      prevReviews.map((review) => {
        if (review.id !== reviewId) return review;

        const isScratched = review.scratchedBy === currentUserHandle;
        scratchState = {
          isScratched: !isScratched,
          albumTitle: review.albumTitle,
        };

        return {
          ...review,
          scratchedBy: isScratched ? null : currentUserHandle,
        };
      })
    );

    if (scratchState?.isScratched) {
      pushNotification({
        type: 'social',
        title: 'Scratch guardado',
        body: `Dejaste marcada la reseña de "${scratchState.albumTitle}".`,
        read: true,
      });
    }
  };

  const toggleReviewLike = (reviewId) => {
    let likeState = null;
    const targetReview = reviews.find((review) => review.id === reviewId);

    setReviews((prevReviews) =>
      prevReviews.map((review) => {
        if (review.id !== reviewId) return review;

        const hasLiked = review.likedBy.includes(currentUserHandle);
        const nextLikedBy = hasLiked
          ? review.likedBy.filter((handle) => handle !== currentUserHandle)
          : [...review.likedBy, currentUserHandle];

        likeState = {
          added: !hasLiked,
          albumTitle: review.albumTitle,
          reviewBackendId: review.backendId,
        };

        return {
          ...review,
          likedBy: nextLikedBy,
        };
      })
    );

    if (likeState?.added) {
      void triggerSuccessFeedback();
      pushNotification({
        type: 'social',
        title: 'Like guardado',
        body: `Te gustó la reseña de "${likeState.albumTitle}".`,
        read: true,
      });
    }

    if (likeState?.reviewBackendId && authSession?.user?.id) {
      void toggleReviewLikeRecord({
        reviewBackendId: likeState.reviewBackendId,
        userId: authSession.user.id,
        shouldLike: Boolean(
          targetReview && !targetReview.likedBy.includes(currentUserHandle)
        ),
      }).then((result) => {
        if (!result.ok && !result.skipped) {
          setAuthMessage(result.message);
          return;
        }

        if (
          result.ok &&
          likeState?.added &&
          targetReview?.userId &&
          targetReview.userId !== authSession.user.id
        ) {
          void createBackendNotification({
            recipientId: targetReview.userId,
            actorId: authSession.user.id,
            type: 'social',
            title: `${currentUserHandle} le dio like a tu reseña`,
            body: `"${targetReview.albumTitle}" acaba de sumar un nuevo like.`,
            entityType: 'review',
            entityId: likeState.reviewBackendId,
          });
        }
      });
    }
  };

  const addReviewComment = (reviewId, commentText) => {
    const trimmedComment = commentText.trim();

    if (!trimmedComment) return;

    let commentState = null;
    let optimisticCommentId = '';

    setReviews((prevReviews) =>
      prevReviews.map((review) => {
        if (review.id !== reviewId) return review;

        const nextComment = normalizeComment({
          id: createId('comment'),
          user: currentUserHandle,
          text: trimmedComment,
          createdLabel: 'Ahora',
        });

        optimisticCommentId = nextComment.id;
        commentState = {
          albumTitle: review.albumTitle,
          reviewBackendId: review.backendId,
          reviewOwnerId: review.userId,
        };

        return {
          ...review,
          comments: [...review.comments, nextComment],
        };
      })
    );

    if (commentState) {
      void triggerSuccessFeedback();
      pushNotification({
        type: 'social',
        title: 'Comentario enviado',
        body: `Tu comentario en "${commentState.albumTitle}" ya aparece en el feed.`,
        read: true,
      });
    }

    if (commentState?.reviewBackendId && authSession?.user?.id) {
      void createReviewCommentRecord({
        reviewBackendId: commentState.reviewBackendId,
        userId: authSession.user.id,
        text: trimmedComment,
        userHandle: currentUserHandle,
      }).then((result) => {
        if (!result.ok) {
          setAuthMessage(result.message);
          return;
        }

        if (!result.comment) {
          return;
        }

        setReviews((prevReviews) =>
          prevReviews.map((review) => {
            if (review.id !== reviewId) return review;

            return {
              ...review,
              comments: review.comments.map((comment) =>
                comment.id === optimisticCommentId ? result.comment : comment
              ),
            };
          })
        );

        if (
          commentState?.reviewOwnerId &&
          commentState.reviewOwnerId !== authSession.user.id
        ) {
          void createBackendNotification({
            recipientId: commentState.reviewOwnerId,
            actorId: authSession.user.id,
            type: 'social',
            title: `${currentUserHandle} comentó tu reseña`,
            body: `Tu reseña de "${commentState.albumTitle}" tiene una respuesta nueva.`,
            entityType: 'review',
            entityId: commentState.reviewBackendId,
          });
        }
      });
    }
  };

  const deleteReview = (reviewId) => {
    const reviewToDelete = reviews.find((review) => review.id === reviewId);

    setReviews((prevReviews) =>
      prevReviews.filter((review) => review.id !== reviewId)
    );

    if (reviewToDelete) {
      void syncDeletedReviewToBackend(reviewToDelete);
    }
  };

  const openCreateReview = (album, options = {}) => {
    setEditingReview(null);
    setReviewAlbum(album);
    setReviewContext({
      origin: options.origin || 'standard',
    });
    setIsCreatingReview(true);
  };

  const openEditReview = (review) => {
    setEditingReview(review);
    setReviewAlbum({
      title: review.albumTitle,
      cover: review.cover,
      artist: review.artist,
    });
    setReviewContext({
      origin: review.contextType || 'standard',
    });
    setIsCreatingReview(true);
  };

  const openReviewWhileListening = () => {
    if (!currentTrack) {
      return false;
    }

    openCreateReview(
      {
        ...currentTrack,
        albumId: currentTrack.albumId || currentTrack.id || currentTrack.title,
      },
      { origin: 'while-listening' }
    );

    return true;
  };

  const closeReviewModal = () => {
    setIsCreatingReview(false);
    setEditingReview(null);
    setReviewAlbum(null);
    setReviewContext(null);
  };

  const publishReview = (data) => {
    let albumTitle = data.album;
    let nextReview = null;

    if (editingReview) {
      nextReview = normalizeReview({
        ...editingReview,
        userId: editingReview.userId || authSession?.user?.id || currentUser.id,
        user: currentUserHandle,
        text: data.text,
        rating: data.rating,
        contextType: editingReview.contextType || 'standard',
      });

      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === editingReview.id ? nextReview : review
        )
      );
      albumTitle = editingReview.albumTitle;
    } else if (reviewAlbum) {
      const contextType =
        reviewContext?.origin === 'while-listening'
          ? 'while-listening'
          : 'standard';

      nextReview = normalizeReview({
        id: createId('review'),
        userId: authSession?.user?.id || currentUser.id,
        user: currentUserHandle,
        albumId: reviewAlbum.id || reviewAlbum.albumId || data.album,
        albumTitle: data.album,
        artist: reviewAlbum.artist,
        artistId: reviewAlbum.artistId,
        artistUrl: reviewAlbum.artistUrl,
        cover: reviewAlbum.cover,
        previewUrl: reviewAlbum.previewUrl,
        rating: data.rating,
        text: data.text,
        likedBy: [],
        comments: [],
        scratchedBy: null,
        createdAt: new Date().toISOString(),
        contextType,
      });

      setReviews((prevReviews) => [
        nextReview,
        ...prevReviews,
      ]);
    }

    if (nextReview) {
      void syncReviewDraftToBackend(nextReview);
    }

    pushNotification({
      type: 'social',
      title: editingReview
        ? 'Reseña actualizada'
        : reviewContext?.origin === 'while-listening'
          ? 'Review while listening publicada'
          : 'Reseña publicada',
      body:
        reviewContext?.origin === 'while-listening'
          ? `"${albumTitle}" ya quedo marcada mientras sonaba.`
          : `"${albumTitle}" ya forma parte de tu actividad.`,
      read: true,
    });

    closeReviewModal();
  };

  const openAddToList = (album) => {
    setListModalAlbum(album);
  };

  const closeAddToList = () => {
    setListModalAlbum(null);
  };

  const addAlbumToList = (listId) => {
    if (listId === 'wishlist') {
      if (listModalAlbum) {
        addAlbumToWishlist(listModalAlbum);
        closeAddToList();
      }
      return;
    }

    if (!listModalAlbum) return;

    const targetList = lists.find((list) => list.id === listId);

    if (!targetList) return;

    const nextEntry = createListEntry(listModalAlbum);

    if (
      targetList.items.some(
        (item) => (item.albumId || item.id) === nextEntry.albumId
      )
    ) {
      Alert.alert(
        'Ya esta guardado',
        `"${listModalAlbum.title}" ya existe dentro de esa lista.`
      );
      return;
    }

    let syncedList = null;

    setLists((prevLists) =>
      prevLists.map((list) => {
        if (list.id !== listId) return list;

        const nextItems = [...list.items, nextEntry];
        syncedList = normalizeList({
          ...list,
          items: nextItems,
        });
        return syncedList;
      })
    );

    if (syncedList) {
      void syncListDraftToBackend(syncedList);
    }

    pushNotification({
      type: 'product',
      title: 'Disco guardado',
      body: `"${listModalAlbum.title}" entro en "${targetList.name}".`,
      read: true,
    });

    closeAddToList();
  };

  const removeListItem = (listId, entryId) => {
    if (listId === 'wishlist') {
      removeWishlistAlbum(entryId);
      return;
    }

    let syncedList = null;

    setLists((prevLists) =>
      prevLists.map((list) => {
        if (list.id !== listId) return list;

        const nextItems = list.items.filter((item) => item.entryId !== entryId);
        syncedList = normalizeList({
          ...list,
          items: nextItems,
        });
        return syncedList;
      })
    );

    if (syncedList) {
      void syncListDraftToBackend(syncedList);
    }
  };

  const updateListOrder = (listId, items) => {
    if (listId === 'wishlist') {
      setWishlist(items);
      return;
    }

    let syncedList = null;

    setLists((prevLists) =>
      prevLists.map((list) => {
        if (list.id !== listId) return list;

        syncedList = normalizeList({
          ...list,
          items,
        });

        return syncedList;
      })
    );

    if (syncedList) {
      void syncListDraftToBackend(syncedList);
    }
  };

  const shuffleList = (listId) => {
    if (listId === 'wishlist') {
      if (wishlist.length === 0) {
        return false;
      }

      const nextItems = [...wishlist];

      for (let index = nextItems.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        const currentItem = nextItems[index];
        nextItems[index] = nextItems[swapIndex];
        nextItems[swapIndex] = currentItem;
      }

      setWishlist(nextItems);

      const wishlistPlaybackCandidate =
        nextItems.find((item) => item.previewUrl) ||
        nextItems.find((item) => item.externalUrl) ||
        nextItems[0];

      if (wishlistPlaybackCandidate) {
        void playTrack(wishlistPlaybackCandidate);
      }

      pushNotification({
        type: 'product',
        title: 'Wishlist mezclada',
        body: 'Tu lista Por escuchar se reorganizo en modo aleatorio.',
        read: true,
      });

      return true;
    }

    let nextList = null;
    let shuffledTrack = null;

    setLists((prevLists) =>
      prevLists.map((list) => {
        if (list.id !== listId) return list;

        if (list.items.length <= 1) {
          nextList = list;
          shuffledTrack = list.items[0] || null;
          return list;
        }

        const nextItems = [...list.items];

        for (let index = nextItems.length - 1; index > 0; index -= 1) {
          const swapIndex = Math.floor(Math.random() * (index + 1));
          const currentItem = nextItems[index];
          nextItems[index] = nextItems[swapIndex];
          nextItems[swapIndex] = currentItem;
        }

        shuffledTrack =
          nextItems.find((item) => item.previewUrl) ||
          nextItems.find((item) => item.externalUrl) ||
          nextItems[0] ||
          null;
        nextList = normalizeList({
          ...list,
          items: nextItems,
        });
        return nextList;
      })
    );

    if (!nextList) {
      return false;
    }

    if (shuffledTrack) {
      void playTrack(shuffledTrack);
    }

    pushNotification({
      type: 'product',
      title: 'Lista mezclada',
      body: `"${nextList.name}" se reorganizo en modo aleatorio.`,
      read: true,
    });

    void syncListDraftToBackend(nextList);

    return true;
  };

  const toggleListVisibility = (listId) => {
    if (listId === 'wishlist') {
      return false;
    }

    let nextVisibility = null;
    let listName = '';
    let nextList = null;

    setLists((prevLists) =>
      prevLists.map((list) => {
        if (list.id !== listId) return list;

        nextVisibility = !list.isPublic;
        listName = list.name;

        nextList = normalizeList({
          ...list,
          isPublic: nextVisibility,
        });
        return nextList;
      })
    );

    if (nextVisibility === null) {
      return false;
    }

    pushNotification({
      type: 'product',
      title: nextVisibility ? 'Lista ahora publica' : 'Lista ahora privada',
      body: `"${listName}" paso a modo ${
        nextVisibility ? 'publico' : 'privado'
      }.`,
      read: true,
    });

    if (nextList) {
      void syncListDraftToBackend(nextList);
    }

    return nextVisibility;
  };

  const saveProfile = async (profileUpdates) => {
    const activeSession = authSessionRef.current;
    const nextHandle =
      sanitizeProfileHandle(profileUpdates.handle || currentUser.handle) ||
      currentUser.handle;

    const handleCheck = await checkHandleAvailability(
      nextHandle,
      activeSession?.user?.id
    );

    if (!handleCheck.ok || !handleCheck.available) {
      return {
        ok: false,
        message: handleCheck.message || 'Ese @ no está disponible.',
      };
    }

    const avatarReview = reviewProfileAssetSource(profileUpdates.avatarUrl);
    const wallpaperReview = reviewProfileAssetSource(profileUpdates.wallpaperUrl);

    if (!avatarReview.accepted) {
      return avatarReview;
    }

    if (!wallpaperReview.accepted) {
      return wallpaperReview;
    }

    const localDraft = {
      ...currentUser,
      ...profileUpdates,
      handle: handleCheck.handle || nextHandle,
      avatarModerationStatus:
        avatarReview.moderationStatus || currentUser.avatarModerationStatus,
      wallpaperModerationStatus:
        wallpaperReview.moderationStatus ||
        currentUser.wallpaperModerationStatus,
    };

    setIsProfileSaving(true);
    logProfileDebug('save_profile:start', {
      userId: activeSession?.user?.id || currentUser.id,
      handle: localDraft.handle,
      isAuthenticated: Boolean(activeSession?.user),
    });
    currentUserRef.current = localDraft;
    setCurrentUser(localDraft);

    try {
      let backendResult = null;

      if (activeSession?.user) {
        backendResult = await persistProfileToBackend(localDraft);

        if (!backendResult.ok && !backendResult.skipped) {
          setAuthMessage(backendResult.message);
          pushNotification({
            type: 'security',
            title: 'Guardado solo en este dispositivo',
            body: backendResult.message,
            read: true,
          });

          return backendResult;
        }

        if (backendResult?.ok) {
          currentUserRef.current = backendResult.user;
          setCurrentUser(backendResult.user);
        }
      }

      pushNotification({
        type: 'product',
        title: 'Perfil actualizado',
        body: activeSession?.user
          ? 'Tus cambios ya quedaron sincronizados.'
          : 'Tus cambios quedaron guardados en este dispositivo.',
        read: true,
      });

      return backendResult || { ok: true, skipped: true };
    } finally {
      setIsProfileSaving(false);
    }
  };

  const completeProfileSetup = async (profileUpdates) => {
    const completionTimestamp = new Date().toISOString();
    const result = await saveProfile({
      ...profileUpdates,
      profileCompletedAt: completionTimestamp,
    });

    if (result?.ok || result?.skipped) {
      const resolvedUser = {
        ...currentUserRef.current,
        ...profileUpdates,
        ...(result?.user || {}),
        profileCompletedAt:
          result?.user?.profileCompletedAt || completionTimestamp,
      };

      currentUserRef.current = resolvedUser;
      setCurrentUser(resolvedUser);
      setPreferences((prevPreferences) => ({
        ...prevPreferences,
        profileSetupRequired: false,
      }));
      logProfileDebug('complete_profile:success', {
        handle: resolvedUser.handle,
      });
      setAuthMessage('Tu perfil ya está listo. Ahora sí, a explorar.');
    }

    return result;
  };

  const markChatAsRead = (chatId) => {
    const targetChat = globalChats.find((chat) => chat.id === chatId);

    setGlobalChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, unread: 0 } : chat
      )
    );

    if (authSession?.user?.id && targetChat?.user?.handle) {
      void markConversationMessagesAsRead({
        userId: authSession.user.id,
        peerHandle: targetChat.user.handle,
      }).then((result) => {
        if (!result.ok && !result.skipped) {
          setAuthMessage(result.message);
        }
      });
    }
  };

  const updateChatTheme = (chatId, themeColor) => {
    if (!chatId || !themeColor) {
      return false;
    }

    setGlobalChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              themeColor,
            }
          : chat
      )
    );

    return true;
  };

  const sendChatMessage = (chatId, messageData) => {
    const timestamp = getTimeLabel();
    const createdAt = new Date().toISOString();
    let targetChatRef = null;
    let optimisticMessage = null;

    setGlobalChats((prevChats) => {
      const targetChat = prevChats.find((chat) => chat.id === chatId);

      if (!targetChat) {
        return prevChats;
      }

      targetChatRef = targetChat;
      optimisticMessage = {
        id: createId('message'),
        createdAt,
        messageType: messageData?.messageType || 'text',
        ...messageData,
        sender: 'me',
        time: timestamp,
      };

      const nextChat = {
        ...targetChat,
        unread: 0,
        messages: [
          ...targetChat.messages,
          optimisticMessage,
        ],
      };

      return [
        nextChat,
        ...prevChats.filter((chat) => chat.id !== chatId),
      ];
    });

    if (!targetChatRef || !optimisticMessage) {
      return;
    }

    void triggerSelectionFeedback();

    if (supabaseStatus.isConfigured && authSession?.user?.id && targetChatRef.user?.handle) {
      void createMessageRecord({
        senderId: authSession.user.id,
        receiverHandle: targetChatRef.user.handle,
        message: optimisticMessage,
      }).then((result) => {
        if (!result.ok && !result.skipped) {
          setAuthMessage(result.message);
          return;
        }

        if (result.message?.backendId) {
          setGlobalChats((prevChats) =>
            prevChats.map((chat) => {
              if (chat.id !== chatId) {
                return chat;
              }

              return {
                ...chat,
                messages: chat.messages.map((message) =>
                  message.id === optimisticMessage.id
                    ? {
                        ...message,
                        ...result.message,
                      }
                    : message
                ),
              };
            })
          );
        }

        if (result.receiverProfile?.id) {
          const isRecommendation = optimisticMessage.messageType === 'recommendation';
          void createBackendNotification({
            recipientId: result.receiverProfile.id,
            actorId: authSession.user.id,
            type: 'social',
            title: isRecommendation
              ? `${currentUserHandle} te recomendó un disco`
              : `${currentUserHandle} te escribió`,
            body: isRecommendation
              ? `"${optimisticMessage.albumTitle}" te llegó por recomendación directa.`
              : optimisticMessage.text || 'Tienes un mensaje nuevo en B-Side.',
            entityType: isRecommendation ? 'album-recommendation' : 'message',
            entityId:
              optimisticMessage.albumId || result.message?.backendId || optimisticMessage.id,
          });
        }
      });
    }
  };

  const openRecommendAlbum = (album) => {
    if (!preferences.allowDirectMessages) {
      Alert.alert(
        'Mensajes desactivados',
        'Activa las recomendaciones directas desde el Centro de privacidad para compartir discos por mensaje.'
      );
      return false;
    }

    setRecommendedAlbum(album);
    return true;
  };
  const closeRecommendAlbum = () => setRecommendedAlbum(null);
  const recommendAlbumToFriend = ({ chatId, note = '' }) => {
    if (!recommendedAlbum || !chatId) {
      return false;
    }

    const targetChat = globalChats.find((chat) => chat.id === chatId);

    if (!targetChat) {
      return false;
    }

    const targetHandle = normalizeHandle(targetChat.user.handle);

    if (blockedHandles.includes(targetHandle)) {
      Alert.alert(
        'Perfil bloqueado',
        'Desbloquea este perfil para volver a recomendarle discos.'
      );
      return false;
    }

    const artistKey = `${recommendedAlbum.artist || ''}`.trim().toLowerCase();
    const recommendationReason = ownTasteArtistKeys.has(artistKey)
      ? 'Va con la música que más te mueve últimamente.'
      : followingSet.has(targetHandle)
        ? 'Puede entrar muy bien en su radar musical.'
        : 'Ideal para sumar algo nuevo a su descubrimiento.';

    sendChatMessage(chatId, {
      messageType: 'recommendation',
      text: note.trim() ? 'Te dejé esta recomendación.' : '',
      albumId:
        recommendedAlbum.albumId ||
        recommendedAlbum.id ||
        createAlbumKey(recommendedAlbum.title, recommendedAlbum.artist),
      recommendationNote: note.trim(),
      recommendationReason,
      albumCover: recommendedAlbum.cover,
      albumTitle: recommendedAlbum.title,
      albumArtist: recommendedAlbum.artist,
      previewUrl: recommendedAlbum.previewUrl || '',
      ctaLabel: 'Abrir álbum',
    });

    void triggerSuccessFeedback();

    pushNotification({
      type: 'social',
      title: 'Recomendación enviada',
      body: `"${recommendedAlbum.title}" ya viaja por mensaje hacia ${targetHandle}.`,
      read: true,
    });

    setRecommendedAlbum(null);
    return true;
  };

  const openShareProfile = () => setIsShareVisible(true);
  const closeShareProfile = () => setIsShareVisible(false);

  const openStoryCard = () => {
    if (top5.length === 0) {
      Alert.alert(
        'Top 5 vacío',
        'Fija al menos un disco desde el buscador para armar tu tarjeta.'
      );
      return false;
    }

    setIsStoryVisible(true);
    return true;
  };

  const closeStoryCard = () => setIsStoryVisible(false);

  return {
    fadeAnim,
    isLoading,
    preferences,
    currentUser: currentUserWithSocialStats,
    reviews,
    visibleReviews,
    feedReviews,
    wishlist,
    wishlistList,
    listeningHistory,
    listeningStreak,
    recentListening,
    friendActivity,
    interestingUsers,
    interestingAlbums,
    interestingArtists,
    oracleRecommendations,
    oracleSource,
    oracleMessage,
    musicOracleStatus,
    achievementSummary,
    latestAchievementUnlock,
    lists,
    top5,
    globalChats,
    visibleChats,
    notifications,
    followingHandles,
    blockedHandles,
    reports,
    authSession,
    spotifySession,
    spotifyProfile,
    authMessage,
    isAuthenticated,
    isEmailVerified,
    needsProfileCompletion,
    isAuthBusy,
    isProfileSaving,
    isSpotifyExportBusy,
    spotifyExportStatus,
    isBackendConfigured: supabaseStatus.isConfigured,
    spotifyStatus,
    spotifyPlaybackStatus,
    pushSupportStatus,
    pushPermissionStatus,
    isOracleBusy,
    currentTrack,
    listModalAlbum,
    isCreateListVisible,
    isShareVisible,
    isStoryVisible,
    recommendedAlbum,
    editingReview,
    reviewAlbum,
    reviewContext,
    isCreatingReview,
    shareReview,
    hasUnreadMessages,
    hasUnreadNotifications,
    isCurrentUserHandle,
    isFollowingHandle,
    isBlockedHandle,
    getSocialStatsForHandle,
    getCompatibilityForHandle,
    getUserByHandle,
    getArtistSnapshot,
    getListById,
    getChatById,
    isAlbumInWishlist,
    playTrack,
    closeTrack,
    completeOnboarding,
    restartExperience,
    updatePreferences,
    toggleFollowUser,
    blockUser,
    unblockUser,
    reportUser,
    saveAuthPreview,
    registerRealAccount,
    signInRealAccount,
    sendMagicLinkAccess,
    sendPasswordResetAccess,
    signOutBackendAccount,
    signOutOtherBackendSessions,
    resendVerificationEmail,
    checkProfileHandleAvailability,
    deleteBackendAccount,
    refreshAuthenticatedUser,
    connectSpotifyAccount,
    disconnectSpotifyAccount,
    exportListToSpotify,
    requestPushPermissions,
    runMusicOracle,
    setFreemiumPlan,
    markNotificationsAsRead,
    dismissNotification,
    openCreateListModal,
    closeCreateListModal,
    createList,
    addAlbumToWishlist,
    shuffleList,
    toggleListVisibility,
    pinToTop5,
    toggleScratch,
    toggleReviewLike,
    addReviewComment,
    deleteReview,
    openCreateReview,
    openReviewWhileListening,
    openEditReview,
    closeReviewModal,
    publishReview,
    openAddToList,
    closeAddToList,
    addAlbumToList,
    removeListItem,
    updateListOrder,
    saveProfile,
    completeProfileSetup,
    markChatAsRead,
    sendChatMessage,
    handleShareAlbum: openRecommendAlbum,
    openRecommendAlbum,
    closeRecommendAlbum,
    recommendAlbumToFriend,
    updateChatTheme,
    openShareProfile,
    closeShareProfile,
    openStoryCard,
    closeStoryCard,
  };
}

