import { Alert, Animated, Platform } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import {
  CURRENT_USER_HANDLE,
  buildDemoSocialGraph,
  buildViewedUser,
  createId,
  createInitialState,
  createListEntry,
  createRandomColor,
  normalizeHandle,
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
  getAuthenticatedProfileSnapshot,
  fetchSocialSnapshot,
  followProfileByHandle,
  getSupabaseStatus,
  blockProfileByHandle,
  registerWithEmail,
  signInWithEmail,
  signOutSession,
  sendMagicLink,
  submitProfileReport,
  unfollowProfileByHandle,
  unblockProfileByHandle,
  upsertProfile,
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

const getTimeLabel = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

export default function useBSideApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);

  const [currentUser, setCurrentUser] = useState(initialState.currentUser);
  const [reviews, setReviews] = useState(initialState.reviews);
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

  const [currentTrack, setCurrentTrack] = useState(null);
  const [listModalAlbum, setListModalAlbum] = useState(null);
  const [isCreateListVisible, setIsCreateListVisible] = useState(false);
  const [isShareVisible, setIsShareVisible] = useState(false);
  const [isStoryVisible, setIsStoryVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewAlbum, setReviewAlbum] = useState(null);
  const [isCreatingReview, setIsCreatingReview] = useState(false);

  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const supabaseStatus = useMemo(() => getSupabaseStatus(), []);

  const shareReview = useMemo(() => {
    const latestOwnReview = reviews.find(
      (review) => review.user === CURRENT_USER_HANDLE
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
  }, [reviews, currentUser.handle]);

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
  const currentUserWithSocialStats = useMemo(
    () => ({
      ...currentUser,
      ...socialGraph.getCountsForHandle(
        normalizeHandle(currentUser?.handle || CURRENT_USER_HANDLE)
      ),
    }),
    [currentUser, socialGraph]
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

            const socialSnapshot = await fetchSocialSnapshot(snapshot.session.user.id);

            if (!isMounted) return;

            if (socialSnapshot.ok) {
              nextFollowingHandles = mergeHandleCollections(
                persistedState.followingHandles,
                socialSnapshot.followingHandles
              );
              nextBlockedHandles = mergeHandleCollections(
                persistedState.blockedHandles,
                socialSnapshot.blockedHandles
              );
              nextReports = mergeReportsById(
                socialSnapshot.reports,
                persistedState.reports
              );
            } else if (socialSnapshot.message) {
              setAuthMessage(socialSnapshot.message);
            }
          }

          if (snapshot.warning) {
            setAuthMessage(snapshot.warning);
          }
        }
      }

      setCurrentUser(nextCurrentUser);
      setReviews(persistedState.reviews);
      setLists(persistedState.lists);
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
    lists,
    top5,
    globalChats,
    notifications,
    followingHandles,
    blockedHandles,
    reports,
    preferences,
  ]);

  const pushNotification = ({
    type = 'product',
    title,
    body,
    read = false,
  }) => {
    setNotifications((prevNotifications) => [
      {
        id: createId('notification'),
        type,
        title,
        body,
        timeLabel: getTimeLabel(),
        read,
      },
      ...prevNotifications,
    ].slice(0, 50));
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

    return {
      ok: true,
      session: snapshot.session,
      user: snapshot.user,
    };
  };

  const isCurrentUserHandle = (handle) => {
    if (!handle) return false;

    const normalizedHandle = normalizeHandle(handle);

    return (
      normalizedHandle === CURRENT_USER_HANDLE ||
      normalizedHandle === `@${currentUser.handle}`
    );
  };
  const isFollowingHandle = (handle) =>
    followingHandles.includes(normalizeHandle(handle));
  const isBlockedHandle = (handle) =>
    blockedHandles.includes(normalizeHandle(handle));

  const getSocialStatsForHandle = (handle) =>
    socialGraph.getCountsForHandle(handle || normalizeHandle(currentUser.handle));
  const getUserByHandle = (handle) => ({
    ...buildViewedUser(handle, currentUser),
    ...getSocialStatsForHandle(handle),
  });
  const getListById = (listId) => lists.find((list) => list.id === listId) || null;
  const getChatById = (chatId) =>
    globalChats.find((chat) => chat.id === chatId) || null;

  const playTrack = (track) => setCurrentTrack(track);
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

    pushNotification({
      type: 'social',
      title: isFollowingNow ? 'Ahora sigues este perfil' : 'Dejaste de seguir',
      body: isFollowingNow
        ? `${normalizedHandle} ya aparece en tu radar social.`
        : `${normalizedHandle} salio de tus seguidos.`,
      read: true,
    });

    void syncFollowMutation(normalizedHandle, isFollowingNow);

    return isFollowingNow;
  };

  const blockUser = (handle) => {
    if (!handle || isCurrentUserHandle(handle)) {
      return false;
    }

    const normalizedHandle = normalizeHandle(handle);
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
  };

  const dismissNotification = (notificationId) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter(
        (notification) => notification.id !== notificationId
      )
    );
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

    const newList = {
      id: createId('list'),
      name: trimmedName,
      count: 0,
      color: createRandomColor(),
      isPublic: listDraft.isPublic !== false,
      items: [],
    };

    setLists((prevLists) => [...prevLists, newList]);
    setIsCreateListVisible(false);

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

        const isScratched = review.scratchedBy === CURRENT_USER_HANDLE;
        scratchState = {
          isScratched: !isScratched,
          albumTitle: review.albumTitle,
        };

        return {
          ...review,
          scratchedBy: isScratched ? null : CURRENT_USER_HANDLE,
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

    setReviews((prevReviews) =>
      prevReviews.map((review) => {
        if (review.id !== reviewId) return review;

        const hasLiked = review.likedBy.includes(CURRENT_USER_HANDLE);
        const nextLikedBy = hasLiked
          ? review.likedBy.filter((handle) => handle !== CURRENT_USER_HANDLE)
          : [...review.likedBy, CURRENT_USER_HANDLE];

        likeState = {
          added: !hasLiked,
          albumTitle: review.albumTitle,
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
  };

  const addReviewComment = (reviewId, commentText) => {
    const trimmedComment = commentText.trim();

    if (!trimmedComment) return;

    let commentState = null;

    setReviews((prevReviews) =>
      prevReviews.map((review) => {
        if (review.id !== reviewId) return review;

        const nextComment = {
          id: createId('comment'),
          user: CURRENT_USER_HANDLE,
          text: trimmedComment,
          createdLabel: 'Ahora',
        };

        commentState = {
          albumTitle: review.albumTitle,
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
  };

  const deleteReview = (reviewId) => {
    setReviews((prevReviews) =>
      prevReviews.filter((review) => review.id !== reviewId)
    );
  };

  const openCreateReview = (album) => {
    setEditingReview(null);
    setReviewAlbum(album);
    setIsCreatingReview(true);
  };

  const openEditReview = (review) => {
    setEditingReview(review);
    setReviewAlbum({
      title: review.albumTitle,
      cover: review.cover,
      artist: review.artist,
    });
    setIsCreatingReview(true);
  };

  const closeReviewModal = () => {
    setIsCreatingReview(false);
    setEditingReview(null);
    setReviewAlbum(null);
  };

  const publishReview = (data) => {
    let albumTitle = data.album;

    if (editingReview) {
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === editingReview.id
            ? { ...review, text: data.text, rating: data.rating }
            : review
        )
      );
      albumTitle = editingReview.albumTitle;
    } else if (reviewAlbum) {
      setReviews((prevReviews) => [
        {
          id: createId('review'),
          user: CURRENT_USER_HANDLE,
          albumTitle: data.album,
          artist: reviewAlbum.artist,
          cover: reviewAlbum.cover,
          rating: data.rating,
          text: data.text,
          likedBy: [],
          comments: [],
          scratchedBy: null,
        },
        ...prevReviews,
      ]);
    }

    pushNotification({
      type: 'social',
      title: editingReview ? 'Resena actualizada' : 'Resena publicada',
      body: `"${albumTitle}" ya forma parte de tu actividad.`,
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

    if (targetList.items.some((item) => item.id === listModalAlbum.id)) {
      Alert.alert(
        'Ya esta guardado',
        `"${listModalAlbum.title}" ya existe dentro de esa lista.`
      );
      return;
    }

    setLists((prevLists) =>
      prevLists.map((list) => {
        if (list.id !== listId) return list;

        const nextItems = [...list.items, createListEntry(listModalAlbum)];
        return {
          ...list,
          items: nextItems,
          count: nextItems.length,
        };
      })
    );

    pushNotification({
      type: 'product',
      title: 'Disco guardado',
      body: `"${listModalAlbum.title}" entro en "${targetList.name}".`,
      read: true,
    });

    closeAddToList();
  };

  const removeListItem = (listId, entryId) => {
    setLists((prevLists) =>
      prevLists.map((list) => {
        if (list.id !== listId) return list;

        const nextItems = list.items.filter((item) => item.entryId !== entryId);
        return {
          ...list,
          items: nextItems,
          count: nextItems.length,
        };
      })
    );
  };

  const updateListOrder = (listId, items) => {
    setLists((prevLists) =>
      prevLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items,
              count: items.length,
            }
          : list
      )
    );
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
        nextList = {
          ...list,
          items: nextItems,
          count: nextItems.length,
        };
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

    return true;
  };

  const toggleListVisibility = (listId) => {
    let nextVisibility = null;
    let listName = '';

    setLists((prevLists) =>
      prevLists.map((list) => {
        if (list.id !== listId) return list;

        nextVisibility = !list.isPublic;
        listName = list.name;

        return {
          ...list,
          isPublic: nextVisibility,
        };
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
