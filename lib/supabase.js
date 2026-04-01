import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import {
  createListEntry,
  normalizeChat,
  normalizeComment,
  normalizeHandle,
  normalizeListeningEntry,
  normalizeList,
  normalizeNotification,
  normalizeReport,
  normalizeReview,
  normalizeUser,
} from '../data/appState';

const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
const rawSupabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

const isPlaceholderSupabaseValue = (value = '') =>
  !value ||
  value.includes('tu-proyecto') ||
  value.includes('tu-anon-key') ||
  value.includes('example.supabase.co');

const supabaseUrl = isPlaceholderSupabaseValue(rawSupabaseUrl)
  ? ''
  : rawSupabaseUrl;
const supabaseAnonKey = isPlaceholderSupabaseValue(rawSupabaseAnonKey)
  ? ''
  : rawSupabaseAnonKey;

let supabaseClient = null;

export const SUPABASE_TABLES = [
  'profiles',
  'reviews',
  'review_likes',
  'review_comments',
  'lists',
  'list_items',
  'follows',
  'blocks',
  'messages',
  'reports',
  'subscriptions',
  'listening_events',
  'notifications',
  'push_devices',
];

export const SUPABASE_STORAGE_BUCKETS = ['avatars', 'wallpapers'];
export const SUPABASE_LOCAL_URLS = ['http://localhost:19006'];
export const SUPABASE_DASHBOARD_PATHS = [
  'Project Settings > API para URL y anon key.',
  'SQL Editor para correr supabase/schema.sql.',
  'Storage para crear avatars y wallpapers.',
  'Authentication > URL Configuration para Site URL y Redirect URLs.',
];

export const SUPABASE_SETUP_STEPS = [
  'Crear un proyecto en Supabase.',
  'Copiar EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY desde Project Settings > API a .env.',
  'Correr una sola vez el schema de supabase/schema.sql en SQL Editor.',
  'Crear buckets publicos o privados para avatars y wallpapers.',
  'Activar email auth y agregar http://localhost:19006 en Authentication > URL Configuration.',
  'Definir revision manual para avatar y wallpaper antes de abrir perfiles publicos.',
];

export const getSupabaseStatus = () => ({
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  projectHost: supabaseUrl
    ? supabaseUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : 'Pendiente',
});

const mapProfileRowToUser = (profileRow = {}, fallbackUser = {}) =>
  normalizeUser({
    ...fallbackUser,
    id: profileRow.id || fallbackUser.id,
    name: profileRow.display_name || fallbackUser.name,
    handle: profileRow.handle || fallbackUser.handle,
    bio: profileRow.bio || fallbackUser.bio,
    avatarUrl: profileRow.avatar_url || fallbackUser.avatarUrl,
    avatarModerationStatus:
      profileRow.avatar_moderation_status ||
      fallbackUser.avatarModerationStatus,
    wallpaperUrl: profileRow.wallpaper_url || fallbackUser.wallpaperUrl,
    wallpaperModerationStatus:
      profileRow.wallpaper_moderation_status ||
      fallbackUser.wallpaperModerationStatus,
    themePreset: profileRow.theme_preset || fallbackUser.themePreset,
    plan: profileRow.plan || fallbackUser.plan,
    email: fallbackUser.email,
  });

const cleanHandle = (handle = '') => normalizeHandle(handle).replace('@', '');
const formatCreatedLabel = (value) =>
  value ? new Date(value).toLocaleDateString('es-AR') : 'Ahora';
const formatChatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuidLike = (value = '') => UUID_PATTERN.test(value);
const PROFILE_CHAT_SELECT =
  'id, handle, display_name, bio, avatar_url, avatar_moderation_status, wallpaper_url, wallpaper_moderation_status, theme_preset, plan, created_at';

const encodeMessageBody = (message = {}) =>
  JSON.stringify({
    messageType: message.messageType || 'text',
    text: message.text || '',
    recommendationNote: message.recommendationNote || '',
    recommendationReason: message.recommendationReason || '',
    ctaLabel: message.ctaLabel || '',
    previewUrl: message.previewUrl || '',
  });

const decodeMessageBody = (body = '') => {
  try {
    const parsed = JSON.parse(body);
    return typeof parsed === 'object' && parsed ? parsed : { text: body };
  } catch (error) {
    return { text: body };
  }
};

export const mapUserToProfilePayload = (user = {}) => ({
  id: user.id,
  handle: user.handle,
  display_name: user.name,
  bio: user.bio || '',
  avatar_url: user.avatarUrl || '',
  avatar_moderation_status: user.avatarModerationStatus || 'approved',
  wallpaper_url: user.wallpaperUrl || '',
  wallpaper_moderation_status: user.wallpaperModerationStatus || 'approved',
  theme_preset: user.themePreset || 'vinyl-night',
  plan: user.plan || 'free',
});

const mapReviewPayload = (review, userId) => ({
  user_id: userId,
  album_id: review.albumId || review.albumTitle,
  album_title: review.albumTitle,
  album_artist: review.artist || '',
  cover_url: review.cover || '',
  rating: review.rating,
  body: review.text || '',
});

const mapListPayload = (list, userId) => ({
  user_id: userId,
  name: list.name,
  color: list.color || '#A855F7',
  is_public: list.isPublic !== false,
});

const mapListItemsPayload = (listBackendId, items = []) =>
  items.map((item, index) => ({
    list_id: listBackendId,
    album_id: item.albumId || item.id,
    album_title: item.title,
    album_artist: item.artist || '',
    cover_url: item.cover || '',
    position: index,
  }));

const invokePushDispatch = async ({ recipientId, title, body, data = {} }) => {
  const client = getSupabaseClient();

  if (!client || !recipientId || !title || !body) {
    return { ok: false, skipped: true };
  }

  try {
    const { data: responseData, error } = await client.functions.invoke(
      'push-dispatch',
      {
        body: {
          recipientId,
          title,
          body,
          data,
        },
      }
    );

    if (error) {
      throw error;
    }

    return {
      ok: true,
      delivered: responseData?.delivered || 0,
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos disparar el push remoto.',
    };
  }
};

export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: typeof window !== 'undefined',
      },
    });
  }

  return supabaseClient;
};

async function fetchProfilesByIds(profileIds = []) {
  const client = getSupabaseClient();

  if (!client || profileIds.length === 0) {
    return [];
  }

  const uniqueIds = [...new Set(profileIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from('profiles')
    .select('id, handle')
    .in('id', uniqueIds);

  if (error) {
    throw error;
  }

  return data || [];
}

async function fetchDetailedProfilesByIds(profileIds = []) {
  const client = getSupabaseClient();

  if (!client || profileIds.length === 0) {
    return [];
  }

  const uniqueIds = [...new Set(profileIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from('profiles')
    .select(PROFILE_CHAT_SELECT)
    .in('id', uniqueIds);

  if (error) {
    throw error;
  }

  return data || [];
}

async function fetchProfileHandleMap(profileIds = []) {
  const profiles = await fetchProfilesByIds(profileIds);

  return Object.fromEntries(
    profiles.map((profile) => [profile.id, normalizeHandle(profile.handle)])
  );
}

const mapMessageRowToLocalMessage = ({ row, currentUserId, canReadState = true }) => {
  const payload = decodeMessageBody(row.body || '');

  return {
    id: row.id,
    backendId: row.id,
    createdAt: row.created_at,
    sender: row.sender_id === currentUserId ? 'me' : 'them',
    time: formatChatTime(row.created_at),
    text: payload.text || '',
    messageType:
      payload.messageType || (row.album_title || row.album_artist ? 'recommendation' : 'text'),
    albumId: row.album_id || null,
    albumCover: row.album_cover || '',
    albumTitle: row.album_title || '',
    albumArtist: row.album_artist || '',
    previewUrl: payload.previewUrl || '',
    recommendationNote: payload.recommendationNote || '',
    recommendationReason: payload.recommendationReason || '',
    ctaLabel: payload.ctaLabel || '',
    readAt: canReadState ? row.read_at || null : null,
  };
};

export async function getCurrentSession() {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message:
        'Supabase todav\u00eda no est\u00e1 configurado. Complet\u00e1 la conexi\u00f3n antes de activar la cuenta real.',
    };
  }

  try {
    const { data, error } = await client.auth.getSession();

    if (error) {
      throw error;
    }

    return { ok: true, session: data.session || null };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos recuperar la sesi\u00f3n actual.',
    };
  }
}

export async function registerWithEmail({ email, password, metadata = {} }) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message:
        'Supabase todav\u00eda no est\u00e1 configurado. Complet\u00e1 la conexi\u00f3n antes de activar la cuenta real.',
    };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      throw error;
    }

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos registrar la cuenta.',
    };
  }
}

export async function signInWithEmail({ email, password }) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message:
        'Supabase todav\u00eda no est\u00e1 configurado. Complet\u00e1 la conexi\u00f3n antes de activar la cuenta real.',
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos iniciar sesi\u00f3n.',
    };
  }
}

export async function sendMagicLink(email) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message:
        'Supabase todav\u00eda no est\u00e1 configurado. Pod\u00e9s seguir usando tu cuenta local por ahora.',
    };
  }

  try {
    const { data, error } = await client.auth.signInWithOtp({ email });

    if (error) {
      throw error;
    }

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos enviar el acceso por mail.',
    };
  }
}

export async function signOutSession() {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos cerrar la sesi\u00f3n.',
    };
  }
}

export async function fetchProfileById(userId, fallbackUser = {}) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return {
      ok: true,
      profile: data,
      user: mapProfileRowToUser(data, fallbackUser),
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos recuperar el perfil.',
    };
  }
}

export async function fetchProfileByHandle(handle, fallbackUser = {}) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('handle', cleanHandle(handle))
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return {
        ok: true,
        profile: null,
        user: null,
      };
    }

    return {
      ok: true,
      profile: data,
      user: mapProfileRowToUser(data, fallbackUser),
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos recuperar el perfil por handle.',
    };
  }
}

export async function upsertProfile(user) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const payload = mapUserToProfilePayload(user);
    const { data, error } = await client
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return {
      ok: true,
      profile: data,
      user: mapProfileRowToUser(data, user),
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos guardar el perfil.',
    };
  }
}

async function fetchProfileHandlesByIds(profileIds = []) {
  const profiles = await fetchProfilesByIds(profileIds);

  return profiles.map((profile) => normalizeHandle(profile.handle)).filter(Boolean);
}

export async function fetchCurrentUserReviews(userId, fallbackHandle) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { data: reviewRows, error: reviewsError } = await client
      .from('reviews')
      .select('id, user_id, album_id, album_title, album_artist, cover_url, rating, body, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      throw reviewsError;
    }

    const reviewIds = (reviewRows || []).map((review) => review.id);

    if (reviewIds.length === 0) {
      return { ok: true, reviews: [] };
    }

    const [likesResult, commentsResult] = await Promise.all([
      client
        .from('review_likes')
        .select('review_id, user_id')
        .in('review_id', reviewIds),
      client
        .from('review_comments')
        .select('id, review_id, user_id, body, created_at')
        .in('review_id', reviewIds)
        .order('created_at', { ascending: true }),
    ]);

    if (likesResult.error) {
      throw likesResult.error;
    }

    if (commentsResult.error) {
      throw commentsResult.error;
    }

    const profileHandleMap = await fetchProfileHandleMap([
      ...(reviewRows || []).map((review) => review.user_id),
      ...(likesResult.data || []).map((like) => like.user_id),
      ...(commentsResult.data || []).map((comment) => comment.user_id),
    ]);

    const likesByReviewId = (likesResult.data || []).reduce((accumulator, like) => {
      const existingLikes = accumulator[like.review_id] || [];
      const nextHandle =
        profileHandleMap[like.user_id] || normalizeHandle(fallbackHandle);

      accumulator[like.review_id] = [...existingLikes, nextHandle];
      return accumulator;
    }, {});

    const commentsByReviewId = (commentsResult.data || []).reduce(
      (accumulator, comment) => {
        const existingComments = accumulator[comment.review_id] || [];
        const nextComment = normalizeComment({
          id: comment.id,
          backendId: comment.id,
          user: profileHandleMap[comment.user_id] || normalizeHandle(fallbackHandle),
          text: comment.body,
          createdLabel: formatCreatedLabel(comment.created_at),
          createdAt: comment.created_at,
        });

        accumulator[comment.review_id] = [...existingComments, nextComment];
        return accumulator;
      },
      {}
    );

    return {
      ok: true,
      reviews: (reviewRows || []).map((review) =>
        normalizeReview({
          id: review.id,
          backendId: review.id,
          userId: review.user_id,
          user: profileHandleMap[review.user_id] || normalizeHandle(fallbackHandle),
          albumId: review.album_id,
          albumTitle: review.album_title,
          artist: review.album_artist,
          cover: review.cover_url,
          rating: review.rating,
          text: review.body,
          likedBy: likesByReviewId[review.id] || [],
          comments: commentsByReviewId[review.id] || [],
          createdAt: review.created_at,
        })
      ),
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos recuperar las rese\u00f1as.',
    };
  }
}

export async function fetchCommunityFeedReviews(limit = 40) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { data: reviewRows, error: reviewsError } = await client
      .from('reviews')
      .select(
        'id, user_id, album_id, album_title, album_artist, cover_url, rating, body, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (reviewsError) {
      throw reviewsError;
    }

    const reviewIds = (reviewRows || []).map((review) => review.id);

    if (reviewIds.length === 0) {
      return { ok: true, reviews: [] };
    }

    const [likesResult, commentsResult] = await Promise.all([
      client
        .from('review_likes')
        .select('review_id, user_id')
        .in('review_id', reviewIds),
      client
        .from('review_comments')
        .select('id, review_id, user_id, body, created_at')
        .in('review_id', reviewIds)
        .order('created_at', { ascending: true }),
    ]);

    if (likesResult.error) {
      throw likesResult.error;
    }

    if (commentsResult.error) {
      throw commentsResult.error;
    }

    const profileHandleMap = await fetchProfileHandleMap([
      ...(reviewRows || []).map((review) => review.user_id),
      ...(likesResult.data || []).map((like) => like.user_id),
      ...(commentsResult.data || []).map((comment) => comment.user_id),
    ]);

    const likesByReviewId = (likesResult.data || []).reduce((accumulator, like) => {
      const existingLikes = accumulator[like.review_id] || [];
      const nextHandle = profileHandleMap[like.user_id];

      accumulator[like.review_id] = nextHandle
        ? [...existingLikes, nextHandle]
        : existingLikes;
      return accumulator;
    }, {});

    const commentsByReviewId = (commentsResult.data || []).reduce(
      (accumulator, comment) => {
        const existingComments = accumulator[comment.review_id] || [];
        const nextHandle = profileHandleMap[comment.user_id];

        if (!nextHandle) {
          accumulator[comment.review_id] = existingComments;
          return accumulator;
        }

        accumulator[comment.review_id] = [
          ...existingComments,
          normalizeComment({
            id: comment.id,
            backendId: comment.id,
            user: nextHandle,
            text: comment.body,
            createdLabel: formatCreatedLabel(comment.created_at),
            createdAt: comment.created_at,
          }),
        ];
        return accumulator;
      },
      {}
    );

    return {
      ok: true,
      reviews: (reviewRows || []).map((review) =>
        normalizeReview({
          id: review.id,
          backendId: review.id,
          userId: review.user_id,
          user: profileHandleMap[review.user_id] || '@bside',
          albumId: review.album_id,
          albumTitle: review.album_title,
          artist: review.album_artist,
          cover: review.cover_url,
          rating: review.rating,
          text: review.body,
          likedBy: likesByReviewId[review.id] || [],
          comments: commentsByReviewId[review.id] || [],
          createdAt: review.created_at,
        })
      ),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error?.message || 'No pudimos recuperar el feed de comunidad.',
    };
  }
}

export async function createReviewRecord(userId, review) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { data, error } = await client
      .from('reviews')
      .insert(mapReviewPayload(review, userId))
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return {
      ok: true,
      backendId: data.id,
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos crear la rese\u00f1a en backend.',
    };
  }
}

export async function updateReviewRecord(reviewBackendId, review) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { error } = await client
      .from('reviews')
      .update({
        album_id: review.albumId || review.albumTitle,
        album_title: review.albumTitle,
        album_artist: review.artist || '',
        cover_url: review.cover || '',
        rating: review.rating,
        body: review.text || '',
      })
      .eq('id', reviewBackendId);

    if (error) {
      throw error;
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos actualizar la rese\u00f1a.',
    };
  }
}

export async function deleteReviewRecord(reviewBackendId) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { error } = await client.from('reviews').delete().eq('id', reviewBackendId);

    if (error) {
      throw error;
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos borrar la rese\u00f1a.',
    };
  }
}

export async function toggleReviewLikeRecord({
  reviewBackendId,
  userId,
  shouldLike,
}) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    if (shouldLike) {
      const { error } = await client.from('review_likes').upsert(
        {
          review_id: reviewBackendId,
          user_id: userId,
        },
        {
          onConflict: 'review_id,user_id',
        }
      );

      if (error) {
        throw error;
      }
    } else {
      const { error } = await client
        .from('review_likes')
        .delete()
        .eq('review_id', reviewBackendId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos sincronizar el like.',
    };
  }
}

export async function createReviewCommentRecord({
  reviewBackendId,
  userId,
  text,
  userHandle,
}) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { data, error } = await client
      .from('review_comments')
      .insert({
        review_id: reviewBackendId,
        user_id: userId,
        body: text,
      })
      .select('id, body, created_at')
      .single();

    if (error) {
      throw error;
    }

    return {
      ok: true,
      comment: normalizeComment({
        id: data.id,
        backendId: data.id,
        user: userHandle,
        text: data.body,
        createdLabel: formatCreatedLabel(data.created_at),
        createdAt: data.created_at,
      }),
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos sincronizar el comentario.',
    };
  }
}

export async function fetchCurrentUserListeningHistory(userId) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { data, error } = await client
      .from('listening_events')
      .select(
        'id, user_id, album_id, album_title, album_artist, cover_url, preview_url, source, created_at'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(80);

    if (error) {
      throw error;
    }

    return {
      ok: true,
      listeningHistory: (data || []).map((entry) =>
        normalizeListeningEntry({
          id: entry.id,
          albumId: entry.album_id,
          title: entry.album_title,
          artist: entry.album_artist,
          cover: entry.cover_url,
          previewUrl: entry.preview_url,
          source: entry.source,
          createdAt: entry.created_at,
        })
      ),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error?.message || 'No pudimos recuperar tu historial de escucha.',
    };
  }
}

export async function createListeningEventRecord(userId, listeningEntry) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const payload = normalizeListeningEntry(listeningEntry);
    const { data, error } = await client
      .from('listening_events')
      .insert({
        user_id: userId,
        album_id: payload.albumId,
        album_title: payload.title,
        album_artist: payload.artist,
        cover_url: payload.cover,
        preview_url: payload.previewUrl,
        source: payload.source || 'player',
      })
      .select(
        'id, album_id, album_title, album_artist, cover_url, preview_url, source, created_at'
      )
      .single();

    if (error) {
      throw error;
    }

    return {
      ok: true,
      entry: normalizeListeningEntry({
        id: data.id,
        albumId: data.album_id,
        title: data.album_title,
        artist: data.album_artist,
        cover: data.cover_url,
        previewUrl: data.preview_url,
        source: data.source,
        createdAt: data.created_at,
      }),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error?.message || 'No pudimos guardar la escucha en backend.',
    };
  }
}

export async function fetchCurrentUserChats(userId) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  const baseSelect =
    'id, sender_id, receiver_id, body, album_id, album_title, album_artist, album_cover, created_at';
  let canReadState = true;

  try {
    let messagesResult = await client
      .from('messages')
      .select(`${baseSelect}, read_at`)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });

    if (messagesResult.error && `${messagesResult.error.message || ''}`.includes('read_at')) {
      canReadState = false;
      messagesResult = await client
        .from('messages')
        .select(baseSelect)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true });
    }

    if (messagesResult.error) {
      throw messagesResult.error;
    }

    const messageRows = messagesResult.data || [];

    if (messageRows.length === 0) {
      return { ok: true, chats: [], canReadState };
    }

    const counterpartIds = [
      ...new Set(
        messageRows.map((row) =>
          row.sender_id === userId ? row.receiver_id : row.sender_id
        )
      ),
    ];
    const profileRows = await fetchDetailedProfilesByIds(counterpartIds);
    const profileMap = Object.fromEntries(profileRows.map((row) => [row.id, row]));
    const chatsByCounterpart = new Map();

    messageRows.forEach((row) => {
      const counterpartId = row.sender_id === userId ? row.receiver_id : row.sender_id;
      const counterpartProfile = profileMap[counterpartId];

      if (!counterpartProfile) {
        return;
      }

      const existingChat =
        chatsByCounterpart.get(counterpartId) ||
        normalizeChat({
          id: `chat-${counterpartId}`,
          user: mapProfileRowToUser(counterpartProfile),
          unread: 0,
          messages: [],
        });

      existingChat.messages.push(
        mapMessageRowToLocalMessage({
          row,
          currentUserId: userId,
          canReadState,
        })
      );

      if (canReadState && row.receiver_id === userId && !row.read_at) {
        existingChat.unread += 1;
      }

      chatsByCounterpart.set(counterpartId, existingChat);
    });

    return {
      ok: true,
      canReadState,
      chats: Array.from(chatsByCounterpart.values()).sort((left, right) => {
        const leftTime =
          left.messages[left.messages.length - 1]?.createdAt
            ? new Date(left.messages[left.messages.length - 1].createdAt).getTime()
            : 0;
        const rightTime =
          right.messages[right.messages.length - 1]?.createdAt
            ? new Date(right.messages[right.messages.length - 1].createdAt).getTime()
            : 0;

        return rightTime - leftTime;
      }),
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos recuperar los mensajes.',
    };
  }
}

export async function createMessageRecord({ senderId, receiverHandle, message }) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  const receiverResult = await fetchProfileByHandle(receiverHandle);

  if (!receiverResult.ok) {
    return receiverResult;
  }

  if (!receiverResult.profile?.id) {
    return {
      ok: false,
      skipped: true,
      message:
        'Ese perfil todav\u00eda no existe en Supabase. El mensaje queda solo en modo local por ahora.',
    };
  }

  try {
    const { data, error } = await client
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverResult.profile.id,
        body: encodeMessageBody(message),
        album_id: message.albumId || null,
        album_title: message.albumTitle || null,
        album_artist: message.albumArtist || null,
        album_cover: message.albumCover || null,
      })
      .select(
        'id, sender_id, receiver_id, body, album_id, album_title, album_artist, album_cover, created_at'
      )
      .single();

    if (error) {
      throw error;
    }

    return {
      ok: true,
      receiverProfile: receiverResult.profile,
      message: mapMessageRowToLocalMessage({
        row: data,
        currentUserId: senderId,
        canReadState: false,
      }),
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos persistir el mensaje.',
    };
  }
}

export async function upsertPushDeviceToken({
  userId,
  token,
  platform = 'unknown',
  projectId = '',
}) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      skipped: true,
      message: 'Supabase todavía no está configurado.',
    };
  }

  if (!userId || !token) {
    return {
      ok: false,
      skipped: true,
      message: 'Falta el usuario o el token de push.',
    };
  }

  try {
    const { error } = await client.from('push_devices').upsert(
      {
        user_id: userId,
        expo_push_token: token,
        platform,
        project_id: projectId || null,
        is_active: true,
        last_seen_at: new Date().toISOString(),
      },
      {
        onConflict: 'expo_push_token',
      }
    );

    if (error) {
      throw error;
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      skipped: true,
      message: error?.message || 'No pudimos guardar el token push.',
    };
  }
}

export async function markConversationMessagesAsRead({ userId, peerHandle }) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  const peerResult = await fetchProfileByHandle(peerHandle);

  if (!peerResult.ok) {
    return peerResult;
  }

  if (!peerResult.profile?.id) {
    return { ok: false, skipped: true };
  }

  try {
    const { error } = await client
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', userId)
      .eq('sender_id', peerResult.profile.id)
      .is('read_at', null);

    if (error && `${error.message || ''}`.includes('read_at')) {
      return { ok: false, skipped: true };
    }

    if (error) {
      throw error;
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos marcar el chat como leido.',
    };
  }
}

export async function fetchCurrentUserLists(userId) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { data: listRows, error: listsError } = await client
      .from('lists')
      .select('id, name, color, is_public, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (listsError) {
      throw listsError;
    }

    const listIds = (listRows || []).map((list) => list.id);

    if (listIds.length === 0) {
      return { ok: true, lists: [] };
    }

    const { data: listItemsRows, error: itemsError } = await client
      .from('list_items')
      .select('id, list_id, album_id, album_title, album_artist, cover_url, position')
      .in('list_id', listIds)
      .order('position', { ascending: true });

    if (itemsError) {
      throw itemsError;
    }

    const itemsByListId = (listItemsRows || []).reduce((accumulator, item) => {
      const existingItems = accumulator[item.list_id] || [];
      accumulator[item.list_id] = [
        ...existingItems,
        createListEntry({
          id: item.album_id,
          albumId: item.album_id,
          backendId: item.id,
          entryId: item.id,
          title: item.album_title,
          artist: item.album_artist,
          cover: item.cover_url,
        }),
      ];
      return accumulator;
    }, {});

    return {
      ok: true,
      lists: (listRows || []).map((list) =>
        normalizeList({
          id: list.id,
          backendId: list.id,
          name: list.name,
          color: list.color,
          isPublic: list.is_public,
          items: itemsByListId[list.id] || [],
        })
      ),
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos recuperar las listas.',
    };
  }
}

export async function createListRecord(userId, list) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { data, error } = await client
      .from('lists')
      .insert(mapListPayload(list, userId))
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return {
      ok: true,
      backendId: data.id,
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos crear la lista en backend.',
    };
  }
}

export async function updateListRecord(listBackendId, list) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { error } = await client
      .from('lists')
      .update({
        name: list.name,
        color: list.color || '#A855F7',
        is_public: list.isPublic !== false,
      })
      .eq('id', listBackendId);

    if (error) {
      throw error;
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos actualizar la lista.',
    };
  }
}

export async function replaceListItemsRecord(listBackendId, items = []) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { error: deleteError } = await client
      .from('list_items')
      .delete()
      .eq('list_id', listBackendId);

    if (deleteError) {
      throw deleteError;
    }

    if (items.length === 0) {
      return { ok: true };
    }

    const { error: insertError } = await client
      .from('list_items')
      .insert(mapListItemsPayload(listBackendId, items));

    if (insertError) {
      throw insertError;
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos sincronizar los items de la lista.',
    };
  }
}

export async function fetchSocialSnapshot(userId) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const [followsResult, blocksResult, reportsResult] = await Promise.all([
      client
        .from('follows')
        .select('followed_id')
        .eq('follower_id', userId),
      client
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', userId),
      client
        .from('reports')
        .select('id, target_id, reason, details, status, created_at')
        .eq('reporter_id', userId)
        .eq('target_type', 'profile')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (followsResult.error) {
      throw followsResult.error;
    }

    if (blocksResult.error) {
      throw blocksResult.error;
    }

    if (reportsResult.error) {
      throw reportsResult.error;
    }

    const [followingHandles, blockedHandles] = await Promise.all([
      fetchProfileHandlesByIds(
        (followsResult.data || []).map((row) => row.followed_id)
      ),
      fetchProfileHandlesByIds(
        (blocksResult.data || []).map((row) => row.blocked_id)
      ),
    ]);

    return {
      ok: true,
      followingHandles,
      blockedHandles,
      reports: (reportsResult.data || []).map((report) =>
        normalizeReport({
          id: report.id,
          targetHandle: report.target_id,
          reason: report.reason,
          details: report.details,
          status: report.status,
          createdLabel: report.created_at
            ? new Date(report.created_at).toLocaleDateString('es-AR')
            : 'Sincronizado',
        })
      ),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error?.message || 'No pudimos sincronizar follows, bloqueos y reportes.',
    };
  }
}

export async function fetchCommunityProfiles({
  excludeUserId = null,
  limit = 24,
} = {}) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    let query = client
      .from('profiles')
      .select(
        'id, handle, display_name, bio, avatar_url, avatar_moderation_status, wallpaper_url, wallpaper_moderation_status, theme_preset, plan, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (excludeUserId && isUuidLike(excludeUserId)) {
      query = query.neq('id', excludeUserId);
    }

    const { data: profileRows, error: profilesError } = await query;

    if (profilesError) {
      throw profilesError;
    }

    const profileIds = (profileRows || []).map((profile) => profile.id);

    if (profileIds.length === 0) {
      return { ok: true, users: [] };
    }

    const { data: followsRows, error: followsError } = await client
      .from('follows')
      .select('follower_id, followed_id');

    if (followsError) {
      throw followsError;
    }

    const countsById = profileIds.reduce((accumulator, profileId) => {
      accumulator[profileId] = {
        followersCount: 0,
        followingCount: 0,
      };
      return accumulator;
    }, {});

    (followsRows || []).forEach((followRow) => {
      if (countsById[followRow.followed_id]) {
        countsById[followRow.followed_id].followersCount += 1;
      }

      if (countsById[followRow.follower_id]) {
        countsById[followRow.follower_id].followingCount += 1;
      }
    });

    return {
      ok: true,
      users: (profileRows || []).map((profileRow) => ({
        ...mapProfileRowToUser(profileRow),
        followersCount: countsById[profileRow.id]?.followersCount || 0,
        followingCount: countsById[profileRow.id]?.followingCount || 0,
      })),
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos recuperar perfiles de comunidad.',
    };
  }
}

export async function fetchBackendNotifications(userId) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { data, error } = await client
      .from('notifications')
      .select(
        'id, recipient_id, actor_id, type, title, body, entity_type, entity_id, read, created_at'
      )
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    const actorHandleMap = await fetchProfileHandleMap(
      (data || []).map((notification) => notification.actor_id).filter(Boolean)
    );

    return {
      ok: true,
      notifications: (data || []).map((notification) =>
        normalizeNotification({
          id: notification.id,
          backendId: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          actorId: notification.actor_id,
          actorHandle: actorHandleMap[notification.actor_id] || '',
          entityType: notification.entity_type,
          entityId: notification.entity_id,
          read: notification.read,
          timeLabel: formatCreatedLabel(notification.created_at),
          createdAt: notification.created_at,
        })
      ),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error?.message || 'No pudimos recuperar tus notificaciones.',
    };
  }
}

export async function markBackendNotificationsAsRead(userId) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { error } = await client
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    if (error) {
      throw error;
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error?.message || 'No pudimos marcar las notificaciones como leidas.',
    };
  }
}

export async function dismissBackendNotification(notificationId, userId) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  if (!isUuidLike(notificationId)) {
    return { ok: false, skipped: true };
  }

  try {
    const { error } = await client
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', userId);

    if (error) {
      throw error;
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error?.message || 'No pudimos descartar la notificacion.',
    };
  }
}

export async function createBackendNotification({
  recipientId,
  actorId = null,
  type = 'social',
  title,
  body = '',
  entityType = 'social',
  entityId = null,
}) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  if (!recipientId || !title || (actorId && recipientId === actorId)) {
    return { ok: false, skipped: true };
  }

  try {
    const { data, error } = await client
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        actor_id: actorId,
        type,
        title,
        body,
        entity_type: entityType,
        entity_id: entityId,
      })
      .select(
        'id, actor_id, type, title, body, entity_type, entity_id, read, created_at'
      )
      .single();

    if (error) {
      throw error;
    }

    const actorHandleMap = await fetchProfileHandleMap(
      data?.actor_id ? [data.actor_id] : []
    );
    const pushResult = await invokePushDispatch({
      recipientId,
      title: data.title,
      body: data.body,
      data: {
        type: data.type,
        entityType: data.entity_type,
        entityId: data.entity_id,
      },
    });

    return {
      ok: true,
      push: pushResult,
      notification: normalizeNotification({
        id: data.id,
        backendId: data.id,
        actorId: data.actor_id,
        actorHandle: actorHandleMap[data.actor_id] || '',
        type: data.type,
        title: data.title,
        body: data.body,
        entityType: data.entity_type,
        entityId: data.entity_id,
        read: data.read,
        timeLabel: formatCreatedLabel(data.created_at),
        createdAt: data.created_at,
      }),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error?.message || 'No pudimos crear la notificacion en backend.',
    };
  }
}

export async function followProfileByHandle({ followerId, targetHandle }) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  const targetProfileResult = await fetchProfileByHandle(targetHandle);

  if (!targetProfileResult.ok) {
    return targetProfileResult;
  }

  if (!targetProfileResult.profile?.id) {
    return {
      ok: false,
      skipped: true,
      message:
        'Ese perfil todav\u00eda no existe en Supabase. El follow queda solo en modo local por ahora.',
    };
  }

  try {
    const { error } = await client.from('follows').upsert(
      {
        follower_id: followerId,
        followed_id: targetProfileResult.profile.id,
      },
      {
        onConflict: 'follower_id,followed_id',
      }
    );

    if (error) {
      throw error;
    }

    return {
      ok: true,
      targetProfile: targetProfileResult.profile,
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos guardar el follow.',
    };
  }
}

export async function unfollowProfileByHandle({ followerId, targetHandle }) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  const targetProfileResult = await fetchProfileByHandle(targetHandle);

  if (!targetProfileResult.ok) {
    return targetProfileResult;
  }

  if (!targetProfileResult.profile?.id) {
    return {
      ok: false,
      skipped: true,
      message:
        'Ese perfil todav\u00eda no existe en Supabase. El unfollow queda solo en modo local por ahora.',
    };
  }

  try {
    const { error } = await client
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('followed_id', targetProfileResult.profile.id);

    if (error) {
      throw error;
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos quitar el follow.',
    };
  }
}

export async function blockProfileByHandle({ blockerId, targetHandle }) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  const targetProfileResult = await fetchProfileByHandle(targetHandle);

  if (!targetProfileResult.ok) {
    return targetProfileResult;
  }

  if (!targetProfileResult.profile?.id) {
    return {
      ok: false,
      skipped: true,
      message:
        'Ese perfil todav\u00eda no existe en Supabase. El bloqueo queda solo en modo local por ahora.',
    };
  }

  try {
    const { error } = await client.from('blocks').upsert(
      {
        blocker_id: blockerId,
        blocked_id: targetProfileResult.profile.id,
      },
      {
        onConflict: 'blocker_id,blocked_id',
      }
    );

    if (error) {
      throw error;
    }

    const { error: cleanupFollowError } = await client
      .from('follows')
      .delete()
      .eq('follower_id', blockerId)
      .eq('followed_id', targetProfileResult.profile.id);

    if (cleanupFollowError) {
      throw cleanupFollowError;
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos guardar el bloqueo.',
    };
  }
}

export async function unblockProfileByHandle({ blockerId, targetHandle }) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  const targetProfileResult = await fetchProfileByHandle(targetHandle);

  if (!targetProfileResult.ok) {
    return targetProfileResult;
  }

  if (!targetProfileResult.profile?.id) {
    return {
      ok: false,
      skipped: true,
      message:
        'Ese perfil todav\u00eda no existe en Supabase. El desbloqueo queda solo en modo local por ahora.',
    };
  }

  try {
    const { error } = await client
      .from('blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', targetProfileResult.profile.id);

    if (error) {
      throw error;
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos quitar el bloqueo.',
    };
  }
}

export async function submitProfileReport({
  reporterId,
  targetHandle,
  reason,
  details = '',
}) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todav\u00eda no est\u00e1 configurado.',
    };
  }

  try {
    const { data, error } = await client
      .from('reports')
      .insert({
        reporter_id: reporterId,
        target_type: 'profile',
        target_id: normalizeHandle(targetHandle),
        reason,
        details,
        status: 'open',
      })
      .select('id, target_id, reason, details, status, created_at')
      .single();

    if (error) {
      throw error;
    }

    return {
      ok: true,
      report: normalizeReport({
        id: data.id,
        targetHandle: data.target_id,
        reason: data.reason,
        details: data.details,
        status: data.status,
        createdLabel: data.created_at
          ? new Date(data.created_at).toLocaleDateString('es-AR')
          : 'Sincronizado',
      }),
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos guardar el reporte.',
    };
  }
}

export async function getAuthenticatedProfileSnapshot(fallbackUser = {}) {
  const sessionResult = await getCurrentSession();

  if (!sessionResult.ok) {
    return sessionResult;
  }

  if (!sessionResult.session?.user?.id) {
    return {
      ok: true,
      session: null,
      profile: null,
      user: normalizeUser(fallbackUser),
    };
  }

  const profileResult = await fetchProfileById(
    sessionResult.session.user.id,
    normalizeUser({
      ...fallbackUser,
      id: sessionResult.session.user.id,
      email: sessionResult.session.user.email || fallbackUser.email,
    })
  );

  if (!profileResult.ok) {
    return {
      ok: true,
      session: sessionResult.session,
      profile: null,
      user: normalizeUser({
        ...fallbackUser,
        id: sessionResult.session.user.id,
        email: sessionResult.session.user.email || fallbackUser.email,
      }),
      warning: profileResult.message,
    };
  }

  return {
    ok: true,
    session: sessionResult.session,
    profile: profileResult.profile,
    user: normalizeUser({
      ...profileResult.user,
      email: sessionResult.session.user.email || profileResult.user.email,
    }),
  };
}

export function subscribeToUserNotifications({ userId, onInsert }) {
  const client = getSupabaseClient();

  if (!client || !userId || typeof onInsert !== 'function') {
    return () => {};
  }

  const channel = client
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
      },
      async (payload) => {
        try {
          const actorHandleMap = await fetchProfileHandleMap(
            payload?.new?.actor_id ? [payload.new.actor_id] : []
          );

          onInsert(
            normalizeNotification({
              id: payload.new.id,
              backendId: payload.new.id,
              type: payload.new.type,
              title: payload.new.title,
              body: payload.new.body,
              actorId: payload.new.actor_id,
              actorHandle: actorHandleMap[payload.new.actor_id] || '',
              entityType: payload.new.entity_type,
              entityId: payload.new.entity_id,
              read: payload.new.read,
              timeLabel: formatCreatedLabel(payload.new.created_at),
              createdAt: payload.new.created_at,
            })
          );
        } catch (error) {
          console.error('No pudimos abrir la notificacion en tiempo real:', error);
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

export function subscribeToUserMessages({ userId, onInsert }) {
  const client = getSupabaseClient();

  if (!client || !userId || typeof onInsert !== 'function') {
    return () => {};
  }

  const channel = client
    .channel(`messages:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      },
      async (payload) => {
        try {
          const senderRows = await fetchDetailedProfilesByIds([
            payload?.new?.sender_id,
          ]);
          const senderProfile = senderRows[0];

          if (!senderProfile) {
            return;
          }

          onInsert({
            chatUser: mapProfileRowToUser(senderProfile),
            message: mapMessageRowToLocalMessage({
              row: payload.new,
              currentUserId: userId,
              canReadState: Object.prototype.hasOwnProperty.call(
                payload.new || {},
                'read_at'
              ),
            }),
          });
        } catch (error) {
          console.error('No pudimos abrir el mensaje en tiempo real:', error);
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}



