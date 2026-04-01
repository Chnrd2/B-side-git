export const CURRENT_USER_HANDLE = '@marianitooo';

export const PROFILE_THEME_PRESETS = [
  {
    id: 'vinyl-night',
    name: 'Vinyl Night',
    colors: ['#050816', '#111827', '#1E1B4B'],
    accent: '#A855F7',
  },
  {
    id: 'sunset-room',
    name: 'Sunset Room',
    colors: ['#1F1208', '#5B1D14', '#A3411F'],
    accent: '#F97316',
  },
  {
    id: 'emerald-stage',
    name: 'Emerald Stage',
    colors: ['#07130E', '#0D2B24', '#14532D'],
    accent: '#22C55E',
  },
  {
    id: 'blue-cassette',
    name: 'Blue Cassette',
    colors: ['#05111F', '#0F2744', '#1D4ED8'],
    accent: '#38BDF8',
  },
  {
    id: 'rose-bootleg',
    name: 'Rose Bootleg',
    colors: ['#19070F', '#4C0519', '#9D174D'],
    accent: '#F472B6',
  },
];

export const WALLPAPER_LIBRARY = [
  {
    id: 'none',
    name: 'Sin foto',
    uri: '',
  },
  {
    id: 'records',
    name: 'Vinilos',
    uri:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'studio',
    name: 'Estudio',
    uri:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'concert',
    name: 'Show',
    uri:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'headphones',
    name: 'Auriculares',
    uri:
      'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&w=1200&q=80',
  },
];

export const createId = (prefix = 'id') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createRandomColor = () =>
  `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`;

export const createListEntry = (album) => ({
  ...album,
  backendId: album?.backendId || null,
  albumId: album?.albumId || album?.id || createId('album'),
  entryId: album?.entryId || createId('list-entry'),
});

export const normalizeListVisibility = (isPublic) => isPublic !== false;

const getValidDate = (value) => {
  const nextDate = value ? new Date(value) : new Date();
  return Number.isNaN(nextDate.getTime()) ? new Date() : nextDate;
};

const toIsoDate = (value) => getValidDate(value).toISOString();
const createRelativeIso = ({ days = 0, hours = 0, minutes = 0 }) => {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() - days);
  nextDate.setHours(nextDate.getHours() - hours);
  nextDate.setMinutes(nextDate.getMinutes() - minutes);
  return nextDate.toISOString();
};

const DEFAULT_THEME_PRESET = PROFILE_THEME_PRESETS[0];

export const DEFAULT_CURRENT_USER = {
  id: 'user-me',
  name: 'Marianitooo',
  handle: 'marianitooo',
  email: '',
  plan: 'free',
  bio: 'B-Side Lab | Trap, drill y discos para escuchar de punta a punta.',
  avatarUrl: '',
  avatarColor: '#BE185D',
  avatarModerationStatus: 'approved',
  themePreset: DEFAULT_THEME_PRESET.id,
  wallpaperUrl: '',
  wallpaperModerationStatus: 'approved',
  wallpaperOverlay: 0.36,
  top5: [],
};

export const DEFAULT_PREFERENCES = {
  hasCompletedOnboarding: false,
  sessionMode: 'guest',
  notificationsEnabled: true,
  streakAlertsEnabled: true,
  analyticsEnabled: false,
  contentReportsEnabled: true,
  sessionTimeoutEnabled: false,
  loginAlertsEnabled: true,
  blockedUsersEnabled: true,
  profileModerationEnabled: true,
  privateListsByDefault: true,
  showSuggestedProfiles: true,
  showTasteCompatibility: true,
  showRecentActivity: true,
  showListeningStatus: true,
  allowDirectMessages: true,
};

const PUBLIC_TOP_ALBUMS = {
  '@fran_bside': [
    {
      id: 'fran-top-1',
      title: 'Manana Sera Bonito',
      artist: 'KAROL G',
      cover:
        'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/78/ba/95/78ba95d1-c11c-54b9-d77c-7038d594f6ad/23UMGIM16882.rgb.jpg/600x600bb.jpg',
    },
    {
      id: 'fran-top-2',
      title: 'SATURNO',
      artist: 'Rauw Alejandro',
      cover:
        'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/c9/83/40/c9834007-6390-e8d7-06f4-295f3cc9bfe5/196589642531.jpg/600x600bb.jpg',
    },
    {
      id: 'fran-top-3',
      title: 'DATA',
      artist: 'Tainy',
      cover:
        'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/49/5f/97/495f9790-0d52-1937-f228-eb168af52da9/196589844218.jpg/600x600bb.jpg',
    },
  ],
  '@coni_music': [
    {
      id: 'coni-top-1',
      title: 'SOS',
      artist: 'SZA',
      cover:
        'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/55/96/9a/55969a77-a6b7-a770-5eea-97ef64c84a1b/196589561085.jpg/600x600bb.jpg',
    },
    {
      id: 'coni-top-2',
      title: 'emails i cant send',
      artist: 'Sabrina Carpenter',
      cover:
        'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/c8/f8/bf/c8f8bf2d-a729-7fc0-b318-bef8e62f8ca1/22UM1IM22398.rgb.jpg/600x600bb.jpg',
    },
    {
      id: 'coni-top-3',
      title: 'Red Moon In Venus',
      artist: 'Kali Uchis',
      cover:
        'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/95/18/56/951856c0-03c3-e9c9-5ebd-6aa109f108ec/23UMGIM12704.rgb.jpg/600x600bb.jpg',
    },
  ],
};

export const normalizeHandle = (handle = '') =>
  handle.startsWith('@') ? handle : `@${handle.replace('@', '')}`;

export const findThemePreset = (themePresetId) =>
  PROFILE_THEME_PRESETS.find((preset) => preset.id === themePresetId) ||
  DEFAULT_THEME_PRESET;

export const canDisplayProfileAsset = (
  moderationStatus = 'approved',
  allowUnreviewedAssets = true
) => allowUnreviewedAssets || moderationStatus === 'approved';

export const buildProfileTheme = (user, options = {}) => {
  const { allowUnreviewedAssets = true } = options;
  const preset = findThemePreset(user?.themePreset);

  return {
    presetId: preset.id,
    presetName: preset.name,
    colors:
      Array.isArray(user?.customThemeColors) && user.customThemeColors.length >= 2
        ? user.customThemeColors
        : preset.colors,
    accent: user?.accentColor || preset.accent,
    wallpaperUrl: canDisplayProfileAsset(
      user?.wallpaperModerationStatus,
      allowUnreviewedAssets
    )
      ? user?.wallpaperUrl || ''
      : '',
    overlay:
      typeof user?.wallpaperOverlay === 'number'
        ? user.wallpaperOverlay
        : 0.36,
  };
};

export const normalizeUser = (user = {}) => {
  const baseUser = {
    ...DEFAULT_CURRENT_USER,
    ...user,
  };

  const theme = findThemePreset(baseUser.themePreset);

  return {
    ...baseUser,
    handle: baseUser.handle.replace('@', '') || DEFAULT_CURRENT_USER.handle,
    avatarColor: baseUser.avatarColor || createRandomColor(),
    avatarModerationStatus:
      baseUser.avatarModerationStatus || DEFAULT_CURRENT_USER.avatarModerationStatus,
    themePreset: theme.id,
    wallpaperUrl: baseUser.wallpaperUrl || '',
    wallpaperModerationStatus:
      baseUser.wallpaperModerationStatus ||
      DEFAULT_CURRENT_USER.wallpaperModerationStatus,
    wallpaperOverlay:
      typeof baseUser.wallpaperOverlay === 'number'
        ? baseUser.wallpaperOverlay
        : 0.36,
    top5: Array.isArray(baseUser.top5) ? baseUser.top5 : [],
  };
};

export const MOCK_USERS = {
  '@fran_bside': normalizeUser({
    id: 'user-fran',
    name: 'Fran',
    handle: 'fran_bside',
    bio: 'B-Side Lab co-founder | Trap y drill 24/7.',
    avatarUrl: '',
    avatarColor: '#8A2BE2',
    themePreset: 'blue-cassette',
    wallpaperUrl: WALLPAPER_LIBRARY[1].uri,
    top5: PUBLIC_TOP_ALBUMS['@fran_bside'],
  }),
  '@coni_music': normalizeUser({
    id: 'user-coni',
    name: 'Coni',
    handle: 'coni_music',
    bio: 'Pop, R&B y reseñas que pegan primero en la melodía.',
    avatarUrl: '',
    avatarColor: '#F472B6',
    themePreset: 'rose-bootleg',
    wallpaperUrl: WALLPAPER_LIBRARY[3].uri,
    top5: PUBLIC_TOP_ALBUMS['@coni_music'],
  }),
  [CURRENT_USER_HANDLE]: normalizeUser(DEFAULT_CURRENT_USER),
};

export const DEMO_FOLLOW_RELATIONSHIPS = [
  { followerHandle: '@fran_bside', followedHandle: CURRENT_USER_HANDLE },
  { followerHandle: '@coni_music', followedHandle: CURRENT_USER_HANDLE },
  { followerHandle: '@coni_music', followedHandle: '@fran_bside' },
];

export const createInitialLists = () => [
  {
    id: 'list-1',
    name: 'Favoritos',
    count: 0,
    color: '#FF3B30',
    isPublic: true,
    items: [],
  },
  {
    id: 'list-2',
    name: 'Para el gym',
    count: 0,
    color: '#34C759',
    isPublic: false,
    items: [],
  },
  {
    id: 'list-3',
    name: 'Para escuchar',
    count: 0,
    color: '#A855F7',
    isPublic: false,
    items: [],
  },
];

export const normalizeComment = (comment = {}) => ({
  id: comment?.id || createId('comment'),
  backendId: comment?.backendId || null,
  user: normalizeHandle(comment?.user || CURRENT_USER_HANDLE),
  text: comment?.text || '',
  createdLabel: comment?.createdLabel || 'Ahora',
  createdAt: toIsoDate(comment?.createdAt),
});

export const normalizeReview = (review = {}) => ({
  id: review?.id || createId('review'),
  backendId: review?.backendId || null,
  userId: review?.userId || null,
  user: normalizeHandle(review?.user || CURRENT_USER_HANDLE),
  albumId: review?.albumId || review?.albumTitle || createId('album'),
  albumTitle: review?.albumTitle || 'Album',
  artist: review?.artist || '',
  artistId: review?.artistId || '',
  artistUrl: review?.artistUrl || '',
  rating: Number.isFinite(review?.rating) ? review.rating : 0,
  text: review?.text || '',
  cover: review?.cover || '',
  previewUrl: review?.previewUrl || '',
  scratchedBy: review?.scratchedBy ? normalizeHandle(review.scratchedBy) : null,
  likedBy: Array.isArray(review?.likedBy)
    ? [...new Set(review.likedBy.map((handle) => normalizeHandle(handle)))]
    : [],
  comments: Array.isArray(review?.comments)
    ? review.comments.map((comment) => normalizeComment(comment))
    : [],
  createdAt: toIsoDate(review?.createdAt),
  contextType: review?.contextType || 'standard',
});

export const createInitialReviews = () => [
  normalizeReview({
    id: 'review-1',
    user: '@marianitooo',
    albumTitle: 'Serotonina',
    artist: 'Khea',
    rating: 5,
    text: 'Una joya del trap. Corta, directa y con replay infinito.',
    cover:
      'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/4b/3e/2e/4b3e2e5c-9c9e-0e9e-5e5e-5e5e5e5e5e5e/196362125692.jpg/600x600bb.jpg',
    likedBy: ['@fran_bside', '@coni_music'],
    comments: [
      {
        id: 'comment-1',
        user: '@fran_bside',
        text: 'Ese disco envejecio mejor de lo que parecia.',
        createdLabel: 'Hace 2 h',
        createdAt: createRelativeIso({ hours: 2 }),
      },
    ],
    createdAt: createRelativeIso({ hours: 4 }),
    contextType: 'while-listening',
  }),
  normalizeReview({
    id: 'review-2',
    user: '@fran_bside',
    albumTitle: 'Malos Cantores',
    artist: 'C.R.O',
    rating: 4,
    text: 'Breakdown epico. Tiene una crudeza que suma mucho.',
    cover:
      'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/2b/3e/2e/2b3e2e5c-9c9e-0e9e-5e5e-5e5e5e5e5e5e/196362125692.jpg/600x600bb.jpg',
    likedBy: ['@marianitooo'],
    comments: [
      {
        id: 'comment-2',
        user: '@marianitooo',
        text: 'Lo mejor del album es como entra el track 4.',
        createdLabel: 'Hace 40 min',
        createdAt: createRelativeIso({ minutes: 40 }),
      },
      {
        id: 'comment-3',
        user: '@coni_music',
        text: 'No esperaba ese cierre. Muy arriba.',
        createdLabel: 'Hace 20 min',
        createdAt: createRelativeIso({ minutes: 20 }),
      },
    ],
    createdAt: createRelativeIso({ hours: 1 }),
  }),
];

export const normalizeListeningEntry = (entry = {}) => ({
  id: entry?.id || createId('listen'),
  albumId: entry?.albumId || entry?.id || createId('album'),
  title: entry?.title || entry?.albumTitle || 'Album',
  artist: entry?.artist || '',
  artistId: entry?.artistId || '',
  artistUrl: entry?.artistUrl || '',
  cover: entry?.cover || '',
  previewUrl: entry?.previewUrl || '',
  source: entry?.source || 'manual',
  createdAt: toIsoDate(entry?.createdAt || entry?.playedAt),
});

export const normalizeListeningHistory = (history = []) =>
  Array.isArray(history) ? history.map((entry) => normalizeListeningEntry(entry)) : [];

export const createInitialListeningHistory = () => [
  normalizeListeningEntry({
    id: 'listen-1',
    albumId: 'serotonina',
    title: 'Serotonina',
    artist: 'Khea',
    cover:
      'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/4b/3e/2e/4b3e2e5c-9c9e-0e9e-5e5e-5e5e5e5e5e5e/196362125692.jpg/600x600bb.jpg',
    source: 'profile-top5',
    createdAt: createRelativeIso({ minutes: 18 }),
  }),
  normalizeListeningEntry({
    id: 'listen-2',
    albumId: 'manana-sera-bonito',
    title: 'Manana Sera Bonito',
    artist: 'KAROL G',
    cover:
      'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/78/ba/95/78ba95d1-c11c-54b9-d77c-7038d594f6ad/23UMGIM16882.rgb.jpg/600x600bb.jpg',
    source: 'friend-activity',
    createdAt: createRelativeIso({ days: 1, hours: 3 }),
  }),
  normalizeListeningEntry({
    id: 'listen-3',
    albumId: 'saturno',
    title: 'SATURNO',
    artist: 'Rauw Alejandro',
    cover:
      'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/c9/83/40/c9834007-6390-e8d7-06f4-295f3cc9bfe5/196589642531.jpg/600x600bb.jpg',
    source: 'discovery',
    createdAt: createRelativeIso({ days: 2, hours: 2 }),
  }),
];

export const normalizeChat = (chat = {}) => {
  const fallbackHandle = chat?.user?.handle
    ? normalizeHandle(chat.user.handle)
    : '@usuario';
  const fallbackUser = normalizeUser(
    MOCK_USERS[fallbackHandle] || {
      id: createId('user'),
      name: chat?.user?.name || 'Usuario',
      handle: chat?.user?.handle || 'usuario',
      bio: chat?.user?.bio || 'Usuario de B-Side',
      avatarUrl: chat?.user?.avatarUrl || '',
      avatarColor: chat?.user?.avatarColor || '#8A2BE2',
      themePreset: DEFAULT_THEME_PRESET.id,
      wallpaperUrl: '',
      top5: [],
    }
  );

  return {
    id: chat?.id || createId('chat'),
    user: fallbackUser,
    themeColor: chat?.themeColor || '#000000',
    unread: Number.isFinite(chat?.unread) ? chat.unread : 0,
    messages: Array.isArray(chat?.messages)
      ? chat.messages.map((message) => ({
          id: message?.id || createId('message'),
          backendId: message?.backendId || null,
          text: message?.text || '',
          sender: message?.sender === 'them' ? 'them' : 'me',
          time: message?.time || '',
          createdAt: message?.createdAt || toIsoDate(),
          messageType: message?.messageType || 'text',
          albumId: message?.albumId || null,
          albumCover: message?.albumCover,
          albumTitle: message?.albumTitle,
          albumArtist: message?.albumArtist,
          previewUrl: message?.previewUrl || '',
          recommendationNote: message?.recommendationNote || '',
          recommendationReason: message?.recommendationReason || '',
          ctaLabel: message?.ctaLabel || '',
        }))
      : [],
  };
};

export const normalizeWishlist = (wishlist = []) =>
  Array.isArray(wishlist) ? wishlist.map((item) => createListEntry(item)) : [];

export const createInitialChats = () => [
  normalizeChat({
    id: 'chat-1',
    user: MOCK_USERS['@fran_bside'],
    unread: 2,
    messages: [
      {
        id: 'message-1',
        text: 'Che, escuchaste lo nuevo?',
        sender: 'them',
        time: '12:28',
        createdAt: createRelativeIso({ minutes: 6 }),
      },
      {
        id: 'message-2',
        text: 'Si, zafa. La produccion esta buena.',
        sender: 'me',
        time: '12:29',
        createdAt: createRelativeIso({ minutes: 5 }),
      },
      {
        id: 'message-3',
        text: 'El track 4 es una locura.',
        sender: 'them',
        time: '12:30',
        createdAt: createRelativeIso({ minutes: 4 }),
      },
    ],
  }),
  normalizeChat({
    id: 'chat-2',
    user: MOCK_USERS['@coni_music'],
    unread: 0,
    messages: [
      {
        id: 'message-4',
        text: 'Ese disco es malisimo jajaja',
        sender: 'them',
        time: 'Ayer',
        createdAt: createRelativeIso({ days: 1, minutes: 4 }),
      },
    ],
  }),
];

export const normalizeNotification = (notification = {}) => ({
  id: notification?.id || createId('notification'),
  backendId: notification?.backendId || null,
  type: notification?.type || 'product',
  title: notification?.title || 'Actividad en B-Side',
  body: notification?.body || '',
  timeLabel: notification?.timeLabel || 'Ahora',
  read: Boolean(notification?.read),
  actorId: notification?.actorId || null,
  actorHandle: notification?.actorHandle || '',
  entityType: notification?.entityType || 'social',
  entityId: notification?.entityId || null,
  createdAt: toIsoDate(notification?.createdAt),
});

export const normalizeHandleList = (handles = []) =>
  Array.isArray(handles)
    ? [...new Set(handles.filter(Boolean).map((handle) => normalizeHandle(handle)))]
    : [];

export const normalizeReport = (report = {}) => ({
  id: report?.id || createId('report'),
  targetHandle: normalizeHandle(report?.targetHandle || '@usuario'),
  reason: report?.reason || 'Perfil inapropiado',
  details: report?.details || '',
  status: report?.status || 'open',
  createdLabel: report?.createdLabel || 'Ahora',
});

export const createInitialNotifications = () => [
  normalizeNotification({
    id: 'notification-1',
    type: 'social',
    title: 'Fran comento tu resena',
    body: '"Serotonina" ya tiene una respuesta en el feed.',
    timeLabel: 'Hace 2 h',
    createdAt: createRelativeIso({ hours: 2 }),
    read: false,
  }),
  normalizeNotification({
    id: 'notification-2',
    type: 'security',
    title: 'Auth real listo para conectar',
    body: 'Cuando quieras, completa .env y corre el schema inicial de Supabase.',
    timeLabel: 'Hace 1 h',
    createdAt: createRelativeIso({ hours: 1 }),
    read: false,
  }),
  normalizeNotification({
    id: 'notification-3',
    type: 'subscription',
    title: 'Plus queda bien en freemium',
    body: 'Personalizacion, stats y extras premium suman sin romper la base gratis.',
    timeLabel: 'Ayer',
    createdAt: createRelativeIso({ days: 1 }),
    read: true,
  }),
];

export const createInitialFollowingHandles = () => ['@fran_bside'];
export const createInitialBlockedHandles = () => [];
export const createInitialReports = () => [];

export const createInitialState = () => ({
  currentUser: normalizeUser(DEFAULT_CURRENT_USER),
  lists: createInitialLists(),
  wishlist: [],
  reviews: createInitialReviews(),
  listeningHistory: createInitialListeningHistory(),
  top5: [],
  chats: createInitialChats(),
  notifications: createInitialNotifications(),
  followingHandles: createInitialFollowingHandles(),
  blockedHandles: createInitialBlockedHandles(),
  reports: createInitialReports(),
  preferences: { ...DEFAULT_PREFERENCES },
});

export const normalizeList = (list) => {
  const items = Array.isArray(list?.items)
    ? list.items.map((item) => createListEntry(item))
    : [];

  return {
    id: list?.id || createId('list'),
    backendId: list?.backendId || null,
    name: list?.name || 'Nueva lista',
    color: list?.color || createRandomColor(),
    isPublic: normalizeListVisibility(list?.isPublic),
    items,
    count: items.length,
  };
};

export const buildDemoSocialGraph = (
  followingHandles = [],
  currentUserHandle = CURRENT_USER_HANDLE
) => {
  const normalizedCurrentHandle = normalizeHandle(currentUserHandle);
  const dynamicRelationships = normalizeHandleList(followingHandles).map(
    (followedHandle) => ({
      followerHandle: normalizedCurrentHandle,
      followedHandle,
    })
  );
  const relationships = [
    ...DEMO_FOLLOW_RELATIONSHIPS,
    ...dynamicRelationships,
  ].map((relationship) => ({
    followerHandle: normalizeHandle(relationship.followerHandle),
    followedHandle: normalizeHandle(relationship.followedHandle),
  }));

  const getCountsForHandle = (handle) => {
    const normalizedHandle = normalizeHandle(handle);

    return {
      followersCount: relationships.filter(
        (relationship) => relationship.followedHandle === normalizedHandle
      ).length,
      followingCount: relationships.filter(
        (relationship) => relationship.followerHandle === normalizedHandle
      ).length,
    };
  };

  return {
    relationships,
    getCountsForHandle,
  };
};

export const buildViewedUser = (handle, currentUser) => {
  if (!handle) return null;

  const normalizedHandle = normalizeHandle(handle);
  const currentUserHandle = normalizeHandle(
    currentUser?.handle || DEFAULT_CURRENT_USER.handle
  );

  if (
    normalizedHandle === CURRENT_USER_HANDLE ||
    normalizedHandle === currentUserHandle
  ) {
    return normalizeUser({
      ...currentUser,
      top5: currentUser?.top5 || [],
    });
  }

  return normalizeUser(
    MOCK_USERS[normalizedHandle] || {
      id: createId('user'),
      name: normalizedHandle.replace('@', ''),
      handle: normalizedHandle.replace('@', ''),
      bio: 'Usuario de B-Side',
      avatarUrl: '',
      avatarColor: '#8A2BE2',
      themePreset: DEFAULT_THEME_PRESET.id,
      wallpaperUrl: '',
      top5: [],
    }
  );
};
