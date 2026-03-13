import { Alert, Animated, Platform } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

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
import { loadAppState, saveAppState } from '../lib/storage';
import {
  createBackendNotification,
  getAuthenticatedProfileSnapshot,
  createListRecord,
  createListeningEventRecord,
  createReviewCommentRecord,
  createReviewRecord,
  dismissBackendNotification,
  fetchBackendNotifications,
  fetchCommunityFeedReviews,
  fetchCommunityProfiles,
  fetchCurrentUserListeningHistory,
  fetchSocialSnapshot,
  fetchCurrentUserLists,
  fetchCurrentUserReviews,
  followProfileByHandle,
  getSupabaseStatus,
  markBackendNotificationsAsRead,
  blockProfileByHandle,
  registerWithEmail,
  replaceListItemsRecord,
  signInWithEmail,
  signOutSession,
  sendMagicLink,
  submitProfileReport,
  unfollowProfileByHandle,
  unblockProfileByHandle,
  updateListRecord,
  updateReviewRecord,
  upsertProfile,
  deleteReviewRecord,
  toggleReviewLikeRecord,
  subscribeToUserNotifications,
} from '../lib/supabase';

const initialState = createInitialState();

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

export default function useBSideApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);

  const [currentUser, setCurrentUser] = useState(initialState.currentUser);
  const [reviews, setReviews] = useState(initialState.reviews);
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

  const [currentTrack, setCurrentTrack] = useState(null);
  const [listModalAlbum, setListModalAlbum] = useState(null);
  const [isCreateListVisible, setIsCreateListVisible] = useState(false);
  const [isShareVisible, setIsShareVisible] = useState(false);
  const [isStoryVisible, setIsStoryVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewAlbum, setReviewAlbum] = useState(null);
  const [reviewContext, setReviewContext] = useState(null);
  const [isCreatingReview, setIsCreatingReview] = useState(false);

  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const supabaseStatus = useMemo(() => getSupabaseStatus(), []);
  const currentUserHandle = normalizeHandle(
    currentUser?.handle || CURRENT_USER_HANDLE
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
      ),
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
          const overlapArtists = [
            ...new Set(
              userReviews
                .map((review) => `${review.artist || ''}`.trim().toLowerCase())
                .filter((artist) => ownTasteArtistKeys.has(artist))
            ),
          ];
          const overlapAlbums = [
            ...new Set(
              [...(user.top5 || []), ...userReviews]
                .map((album) =>
                  createAlbumKey(
                    album.title || album.albumTitle,
                    album.artist || album.artistName
                  )
                )
                .filter((albumKey) => ownTasteAlbumKeys.has(albumKey))
            ),
          ];
          const engagementScore = userReviews.reduce(
            (accumulator, review) =>
              accumulator + review.likedBy.length * 2 + review.comments.length * 3,
            0
          );
          const score =
            overlapAlbums.length * 18 +
            overlapArtists.length * 10 +
            engagementScore +
            user.followersCount * 2;

          return {
            ...user,
            score,
            reason: overlapAlbums.length
              ? `Comparte tu onda con ${overlapAlbums[0].split('::')[0]}`
              : overlapArtists.length
                ? `Tiene afinidad con ${overlapArtists[0]}`
                : user.followersCount
                  ? `${user.followersCount} seguidores en B-Side`
                  : 'Perfil activo para descubrir musica',
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
    followingSet,
    ownTasteAlbumKeys,
    ownTasteArtistKeys,
  ]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const persistedState = await loadAppState();

      if (!isMounted) return;

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

      if (supabaseStatus.isConfigured) {
        const snapshot = await getAuthenticatedProfileSnapshot(
          persistedState.currentUser
        );

        if (!isMounted) return;

        if (snapshot.ok) {
          setAuthSession(snapshot.session || null);

          if (snapshot.session?.user) {
            nextCurrentUser = {
              ...nextCurrentUser,
              ...snapshot.user,
              top5: persistedState.top5,
            };
            nextPreferences = {
              ...nextPreferences,
              hasCompletedOnboarding: true,
              sessionMode: 'authenticated',
            };

            const remoteState = await loadAuthenticatedCollections({
              userId: snapshot.session.user.id,
              fallbackHandle: snapshot.user.handle || nextCurrentUser.handle,
              localReviews: persistedState.reviews,
              localLists: persistedState.lists,
              localFollowingHandles: persistedState.followingHandles,
              localBlockedHandles: persistedState.blockedHandles,
              localReports: persistedState.reports,
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
      setListeningHistory(persistedState.listeningHistory);
      setLists(nextLists);
      setTop5(persistedState.top5);
      setGlobalChats(persistedState.chats);
      setNotifications(persistedState.notifications);
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
    }, 1200);

    return () => clearTimeout(timer);
  }, [hasHydrated]);

  useEffect(() => {
    setCurrentUser((prevUser) => ({
      ...prevUser,
      top5,
    }));
  }, [top5]);

  useEffect(() => {
    if (!hasHydrated) return;

    const timer = setTimeout(() => {
      saveAppState({
        currentUser,
        reviews,
        listeningHistory,
        lists,
        top5,
        chats: globalChats,
        notifications,
        followingHandles,
        blockedHandles,
        reports,
        preferences,
      }).catch((error) => {
        console.error('No pudimos guardar el estado local:', error);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [
    hasHydrated,
    currentUser,
    reviews,
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
      const [remoteState, listeningSnapshot, notificationsSnapshot] =
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
      },
    });
  }, [authSession?.user?.id, hasHydrated, supabaseStatus.isConfigured]);

  const pushNotification = ({
    type = 'product',
    title,
    body,
    read = false,
  }) => {
    const nextNotification = normalizeNotification({
      id: createId('notification'),
      type,
      title,
      body,
      timeLabel: getTimeLabel(),
      createdAt: new Date().toISOString(),
      read,
    });

    setNotifications((prevNotifications) =>
      [nextNotification, ...prevNotifications].slice(0, 50)
    );
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

  const applyAuthenticatedUser = (session, nextUser) => {
    setAuthSession(session || null);
    setCurrentUser((prevUser) => ({
      ...prevUser,
      ...nextUser,
      email: session?.user?.email || nextUser.email || prevUser.email,
      top5,
    }));
    setPreferences((prevPreferences) => ({
      ...prevPreferences,
      hasCompletedOnboarding: true,
      sessionMode: session?.user ? 'authenticated' : prevPreferences.sessionMode,
    }));
  };

  const persistProfileToBackend = async (profileDraft) => {
    if (!supabaseStatus.isConfigured || !authSession?.user?.id) {
      return {
        ok: false,
        skipped: true,
        message: 'Supabase todavia no esta conectado a una sesion activa.',
      };
    }

    let nextUser = {
      ...currentUser,
      ...profileDraft,
      id: authSession.user.id,
      email: authSession.user.email || currentUser.email,
    };

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
        userId: authSession.user.id,
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
        userId: authSession.user.id,
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
        email: authSession.user.email || nextUser.email,
        top5,
      },
    };
  };

  const refreshAuthenticatedUser = async (fallbackUser = currentUser) => {
    if (!supabaseStatus.isConfigured) {
      return {
        ok: false,
        message: 'Supabase todavia no esta configurado.',
      };
    }

    const snapshot = await getAuthenticatedProfileSnapshot(fallbackUser);

    if (!snapshot.ok) {
      return snapshot;
    }

    if (!snapshot.session?.user) {
      setAuthSession(null);
      return {
        ok: true,
        session: null,
      };
    }

    applyAuthenticatedUser(snapshot.session, snapshot.user);

    const remoteState = await loadAuthenticatedCollections({
      userId: snapshot.session.user.id,
      fallbackHandle: snapshot.user.handle || fallbackUser.handle,
      localReviews: reviews,
      localLists: lists,
      localFollowingHandles: followingHandles,
      localBlockedHandles: blockedHandles,
      localReports: reports,
    });

    setReviews(remoteState.reviews);
    setLists(remoteState.lists);
    setFollowingHandles(remoteState.followingHandles);
    setBlockedHandles(remoteState.blockedHandles);
    setReports(remoteState.reports);

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
  const getUserByHandle = (handle) => resolveUserSnapshot(handle);
  const getListById = (listId) => lists.find((list) => list.id === listId) || null;
  const getChatById = (chatId) =>
    globalChats.find((chat) => chat.id === chatId) || null;

  const playTrack = (track) => {
    if (!track) return;

    const nextListeningEntry = normalizeListeningEntry({
      ...track,
      albumId: track.albumId || track.id || track.title,
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

    setCurrentTrack(track);
    if (!shouldStoreListeningEvent) {
      return;
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
      title: 'Demo lista para explorar',
      body:
        sessionMode === 'member_preview'
          ? 'Entraste en modo cuenta demo.'
          : 'Entraste como invitado.',
      read: true,
    });
  };

  const restartExperience = () => {
    setPreferences((prevPreferences) => ({
      ...prevPreferences,
      hasCompletedOnboarding: false,
      sessionMode: 'guest',
    }));
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

  const saveAuthPreview = ({ name, email }) => {
    const normalizedEmail = email.trim().toLowerCase();

    setCurrentUser((prevUser) => ({
      ...prevUser,
      name: name?.trim() || prevUser.name,
      email: normalizedEmail,
    }));

    setPreferences((prevPreferences) => ({
      ...prevPreferences,
      sessionMode: normalizedEmail ? 'member_preview' : 'guest',
    }));

    pushNotification({
      type: 'security',
      title: 'Cuenta demo actualizada',
      body: normalizedEmail
        ? `Guardaste ${normalizedEmail} como acceso principal de prueba.`
        : 'La cuenta demo sigue en modo invitado.',
    });
  };

  const registerRealAccount = async ({ name, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    setIsAuthBusy(true);
    setAuthMessage('');

    const response = await registerWithEmail({
      email: normalizedEmail,
      password,
      metadata: {
        display_name: name.trim() || currentUser.name,
        handle: currentUser.handle,
      },
    });

    if (!response.ok) {
      setIsAuthBusy(false);
      setAuthMessage(response.message);
      return response;
    }

    setCurrentUser((prevUser) => ({
      ...prevUser,
      name: name.trim() || prevUser.name,
      email: normalizedEmail,
    }));

    if (response.data?.session?.user) {
      const ensuredProfile = await upsertProfile({
        ...currentUser,
        id: response.data.session.user.id,
        name: name.trim() || currentUser.name,
        email: normalizedEmail,
      });

      if (ensuredProfile.ok) {
        applyAuthenticatedUser(response.data.session, ensuredProfile.user);
      } else {
        await refreshAuthenticatedUser({
          ...currentUser,
          email: normalizedEmail,
        });
      }
    } else {
      setPreferences((prevPreferences) => ({
        ...prevPreferences,
        hasCompletedOnboarding: true,
        sessionMode: 'member_preview',
      }));
    }

    pushNotification({
      type: 'security',
      title: 'Registro iniciado',
      body: 'Tu cuenta real quedo creada. Revisa el mail si Supabase pide confirmacion.',
      read: true,
    });

    setIsAuthBusy(false);
    setAuthMessage(
      response.data?.session?.user
        ? 'Cuenta real conectada.'
        : 'Cuenta creada. Falta confirmar el email.'
    );

    return response;
  };

  const signInRealAccount = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    setIsAuthBusy(true);
    setAuthMessage('');

    const response = await signInWithEmail({
      email: normalizedEmail,
      password,
    });

    if (!response.ok) {
      setIsAuthBusy(false);
      setAuthMessage(response.message);
      return response;
    }

    const refreshResult = await refreshAuthenticatedUser({
      ...currentUser,
      id: response.data?.user?.id || currentUser.id,
      email: normalizedEmail,
    });

    if (refreshResult.ok && refreshResult.session?.user) {
      pushNotification({
        type: 'security',
        title: 'Sesion iniciada',
        body: 'Tu cuenta real ya quedo activa en esta demo.',
        read: true,
      });
      setAuthMessage('Sesion iniciada.');
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
        title: 'Magic link enviado',
        body: 'Revisa tu email para continuar el acceso.',
        read: true,
      });
      setAuthMessage('Magic link enviado.');
    } else {
      setAuthMessage(response.message);
    }

    setIsAuthBusy(false);

    return response;
  };

  const signOutBackendAccount = async () => {
    if (!supabaseStatus.isConfigured || !authSession?.user) {
      setPreferences((prevPreferences) => ({
        ...prevPreferences,
        sessionMode: 'guest',
      }));
      return { ok: true };
    }

    setIsAuthBusy(true);
    const response = await signOutSession();
    setIsAuthBusy(false);

    if (response.ok) {
      setAuthSession(null);
      setPreferences((prevPreferences) => ({
        ...prevPreferences,
        sessionMode: 'guest',
      }));
      setAuthMessage('Sesion cerrada.');
      pushNotification({
        type: 'security',
        title: 'Sesion cerrada',
        body: 'La cuenta real se desconecto de este dispositivo.',
        read: true,
      });
    } else {
      setAuthMessage(response.message);
    }

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
        ? { name: input, isPublic: false }
        : input || {};
    const trimmedName = listDraft.name?.trim();

    if (!trimmedName) return;

    const newList = normalizeList({
      id: createId('list'),
      name: trimmedName,
      color: createRandomColor(),
      isPublic: listDraft.isPublic !== false,
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

  const pinToTop5 = (album) => {
    let nextTop5 = null;

    setTop5((prevTop5) => {
      const isAlreadyPinned = prevTop5.some((item) => item.id === album.id);

      if (isAlreadyPinned) {
        nextTop5 = prevTop5.filter((item) => item.id !== album.id);
        return nextTop5;
      }

      if (prevTop5.length >= 5) {
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
        body: `Dejaste marcada la resena de "${scratchState.albumTitle}".`,
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
      pushNotification({
        type: 'social',
        title: 'Like guardado',
        body: `Te gusto la resena de "${likeState.albumTitle}".`,
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
            title: `${currentUserHandle} le dio like a tu resena`,
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
            title: `${currentUserHandle} comento tu resena`,
            body: `Tu resena de "${commentState.albumTitle}" tiene una respuesta nueva.`,
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
        ? 'Resena actualizada'
        : reviewContext?.origin === 'while-listening'
          ? 'Review while listening publicada'
          : 'Resena publicada',
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

        shuffledTrack = nextItems[0] || null;
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
      playTrack(shuffledTrack);
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
      avatarModerationStatus:
        avatarReview.moderationStatus || currentUser.avatarModerationStatus,
      wallpaperModerationStatus:
        wallpaperReview.moderationStatus ||
        currentUser.wallpaperModerationStatus,
    };

    setIsProfileSaving(true);
    setCurrentUser(localDraft);

    try {
      let backendResult = null;

      if (authSession?.user) {
        backendResult = await persistProfileToBackend(localDraft);

        if (!backendResult.ok && !backendResult.skipped) {
          setAuthMessage(backendResult.message);
          pushNotification({
            type: 'security',
            title: 'Perfil guardado solo en local',
            body: backendResult.message,
            read: true,
          });

          return backendResult;
        }

        if (backendResult?.ok) {
          setCurrentUser(backendResult.user);
        }
      }

      pushNotification({
        type: 'product',
        title: 'Perfil actualizado',
        body: authSession?.user
          ? 'Foto, fondo y datos del perfil quedaron sincronizados.'
          : 'Foto, fondo y datos del perfil quedaron guardados.',
        read: true,
      });

      return backendResult || { ok: true, skipped: true };
    } finally {
      setIsProfileSaving(false);
    }
  };

  const markChatAsRead = (chatId) => {
    setGlobalChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, unread: 0 } : chat
      )
    );
  };

  const sendChatMessage = (chatId, messageData) => {
    const timestamp = getTimeLabel();

    setGlobalChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id !== chatId) return chat;

        return {
          ...chat,
          unread: 0,
          messages: [
            ...chat.messages,
            {
              id: createId('message'),
              ...messageData,
              sender: 'me',
              time: timestamp,
            },
          ],
        };
      })
    );
  };

  const handleShareAlbum = (albumToShare, onSent) => {
    Alert.alert(
      'Enviar a Fran',
      `Queres enviarle "${albumToShare.title}" a @fran_bside?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: () => {
            sendChatMessage('chat-1', {
              text: 'Mira este disco.',
              albumCover: albumToShare.cover,
              albumTitle: albumToShare.title,
              albumArtist: albumToShare.artist,
            });
            pushNotification({
              type: 'social',
              title: 'Disco compartido',
              body: `"${albumToShare.title}" se mando por mensaje.`,
              read: true,
            });
            Alert.alert('Enviado', 'El disco se mando por mensaje.');
            onSent?.();
          },
        },
      ]
    );
  };

  const openShareProfile = () => setIsShareVisible(true);
  const closeShareProfile = () => setIsShareVisible(false);

  const openStoryCard = () => {
    if (top5.length === 0) {
      Alert.alert(
        'Top 5 vacio',
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
    listeningHistory,
    listeningStreak,
    recentListening,
    friendActivity,
    interestingUsers,
    interestingAlbums,
    lists,
    top5,
    globalChats,
    visibleChats,
    notifications,
    followingHandles,
    blockedHandles,
    reports,
    authSession,
    authMessage,
    isAuthBusy,
    isProfileSaving,
    isBackendConfigured: supabaseStatus.isConfigured,
    currentTrack,
    listModalAlbum,
    isCreateListVisible,
    isShareVisible,
    isStoryVisible,
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
    getUserByHandle,
    getListById,
    getChatById,
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
    signOutBackendAccount,
    refreshAuthenticatedUser,
    setFreemiumPlan,
    markNotificationsAsRead,
    dismissNotification,
    openCreateListModal,
    closeCreateListModal,
    createList,
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
    markChatAsRead,
    sendChatMessage,
    handleShareAlbum,
    openShareProfile,
    closeShareProfile,
    openStoryCard,
    closeStoryCard,
  };
}
