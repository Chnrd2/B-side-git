import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import {
  normalizeHandle,
  normalizeReport,
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

export async function getCurrentSession() {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message:
        'Supabase todavia no esta configurado. Completa .env para activar auth real.',
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
      message: error?.message || 'No pudimos recuperar la sesion actual.',
    };
  }
}

export async function registerWithEmail({ email, password, metadata = {} }) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message:
        'Supabase todavia no esta configurado. Completa .env para activar auth real.',
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
        'Supabase todavia no esta configurado. Completa .env para activar auth real.',
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
      message: error?.message || 'No pudimos iniciar sesion.',
    };
  }
}

export async function sendMagicLink(email) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message:
        'Supabase todavia no esta configurado. Guarda la cuenta demo por ahora.',
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
      message: error?.message || 'No pudimos enviar el magic link.',
    };
  }
}

export async function signOutSession() {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todavia no esta configurado.',
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
      message: error?.message || 'No pudimos cerrar la sesion.',
    };
  }
}

export async function fetchProfileById(userId, fallbackUser = {}) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todavia no esta configurado.',
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
      message: 'Supabase todavia no esta configurado.',
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
      message: 'Supabase todavia no esta configurado.',
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

  return data
    .map((profile) => normalizeHandle(profile.handle))
    .filter(Boolean);
}

export async function fetchSocialSnapshot(userId) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todavia no esta configurado.',
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

export async function followProfileByHandle({ followerId, targetHandle }) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      message: 'Supabase todavia no esta configurado.',
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
        'Ese perfil todavia no existe en Supabase. El follow queda solo en demo por ahora.',
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

    return { ok: true };
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
      message: 'Supabase todavia no esta configurado.',
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
        'Ese perfil todavia no existe en Supabase. El unfollow queda solo en demo por ahora.',
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
      message: 'Supabase todavia no esta configurado.',
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
        'Ese perfil todavia no existe en Supabase. El bloqueo queda solo en demo por ahora.',
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
      message: 'Supabase todavia no esta configurado.',
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
        'Ese perfil todavia no existe en Supabase. El desbloqueo queda solo en demo por ahora.',
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
      message: 'Supabase todavia no esta configurado.',
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
