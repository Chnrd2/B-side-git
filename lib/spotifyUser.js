import AsyncStorage from '@react-native-async-storage/async-storage';

const rawSpotifyClientId =
  process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID?.trim() || '';
const rawSpotifyRedirectUri =
  process.env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI?.trim() ||
  'http://127.0.0.1:19006/spotify/callback';

const SPOTIFY_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const SPOTIFY_SESSION_KEY = '@bside/spotify-session';
const SPOTIFY_AUTH_STATE_KEY = '@bside/spotify-auth-state';
const SPOTIFY_CODE_VERIFIER_KEY = '@bside/spotify-code-verifier';
const SPOTIFY_PENDING_EXPORT_KEY = '@bside/spotify-pending-export-list';
const SPOTIFY_EXPORT_SCOPES = [
  'playlist-modify-private',
  'playlist-modify-public',
];
const SPOTIFY_PROFILE_SCOPES = ['user-read-private'];
export const SPOTIFY_FULL_PLAYBACK_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
];
const SPOTIFY_SCOPES = [
  ...new Set([...SPOTIFY_EXPORT_SCOPES, ...SPOTIFY_PROFILE_SCOPES]),
];

const isWebEnvironment = () =>
  typeof window !== 'undefined' && typeof document !== 'undefined';

const normalizeSpotifyText = (value = '') =>
  `${value}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const generateRandomString = (length = 64) => {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const cryptoApi = globalThis?.crypto;

  if (cryptoApi?.getRandomValues) {
    const randomValues = new Uint8Array(length);
    cryptoApi.getRandomValues(randomValues);

    return Array.from(randomValues)
      .map((value) => alphabet[value % alphabet.length])
      .join('');
  }

  return Array.from({ length }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join('');
};

const base64UrlEncode = (bytes) => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const createCodeChallenge = async (codeVerifier) => {
  const cryptoApi = globalThis?.crypto;

  if (!cryptoApi?.subtle) {
    throw new Error(
      'Tu navegador no soporta PKCE. Usa la web moderna de B-Side para conectar Spotify.'
    );
  }

  const hashed = await cryptoApi.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier)
  );

  return base64UrlEncode(new Uint8Array(hashed));
};

const serializeSession = (payload = {}) => ({
  accessToken: payload.accessToken || payload.access_token || '',
  refreshToken: payload.refreshToken || payload.refresh_token || '',
  expiresAt:
    payload.expiresAt ||
    Date.now() + (Number(payload.expires_in || 3600) - 60) * 1000,
  tokenType: payload.tokenType || payload.token_type || 'Bearer',
  scope:
    payload.scope ||
    SPOTIFY_SCOPES.join(' '),
});

const loadStoredSession = async () => {
  const rawSession = await AsyncStorage.getItem(SPOTIFY_SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return serializeSession(JSON.parse(rawSession));
  } catch (error) {
    return null;
  }
};

const saveStoredSession = async (session) => {
  await AsyncStorage.setItem(
    SPOTIFY_SESSION_KEY,
    JSON.stringify(serializeSession(session))
  );
};

const getSpotifyScopeSet = (session = {}) =>
  new Set(
    `${session?.scope || ''}`
      .split(' ')
      .map((scope) => scope.trim())
      .filter(Boolean)
  );

const clearAuthArtifacts = async () => {
  await AsyncStorage.multiRemove([
    SPOTIFY_AUTH_STATE_KEY,
    SPOTIFY_CODE_VERIFIER_KEY,
  ]);
};

const fetchSpotifyApi = async (path, accessToken, options = {}) => {
  const response = await fetch(`${SPOTIFY_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        `Spotify API respondio ${response.status}.`
    );
  }

  return payload;
};

const refreshSpotifySession = async (session) => {
  if (!session?.refreshToken || !rawSpotifyClientId) {
    return null;
  }

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: rawSpotifyClientId,
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
    }),
  });

  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.error_description ||
        payload?.error ||
        `Spotify refresh respondio ${response.status}.`
    );
  }

  const nextSession = serializeSession({
    ...session,
    ...payload,
    refresh_token: payload?.refresh_token || session.refreshToken,
  });

  await saveStoredSession(nextSession);
  return nextSession;
};

const ensureSpotifySession = async () => {
  const session = await loadStoredSession();

  if (!session) {
    return null;
  }

  if (Date.now() < session.expiresAt) {
    return session;
  }

  return refreshSpotifySession(session);
};

const scoreTrackCandidate = (item, track) => {
  const normalizedTrack = normalizeSpotifyText(track?.title || '');
  const normalizedArtist = normalizeSpotifyText(track?.artist || '');
  const itemName = normalizeSpotifyText(item?.name || '');
  const itemArtists = normalizeSpotifyText(
    (item?.artists || []).map((artist) => artist?.name).join(' ')
  );
  let score = 0;

  if (itemName === normalizedTrack) {
    score += 80;
  } else if (itemName.includes(normalizedTrack)) {
    score += 40;
  }

  if (itemArtists === normalizedArtist) {
    score += 70;
  } else if (itemArtists.includes(normalizedArtist)) {
    score += 35;
  }

  if (item?.preview_url) {
    score += 8;
  }

  return score;
};

export const getSpotifyUserStatus = () => ({
  isConfigured: Boolean(rawSpotifyClientId),
  isConnected: false,
  isWeb: isWebEnvironment(),
  redirectUri: rawSpotifyRedirectUri,
  requestedScopes: SPOTIFY_SCOPES,
  fullPlaybackScopes: SPOTIFY_FULL_PLAYBACK_SCOPES,
});

export const getSpotifyFullPlaybackStatus = (session = null, profile = null) => {
  const scopeSet = getSpotifyScopeSet(session || {});
  const missingScopes = SPOTIFY_FULL_PLAYBACK_SCOPES.filter(
    (scope) => !scopeSet.has(scope)
  );
  const product = `${profile?.product || ''}`.trim().toLowerCase();

  if (!rawSpotifyClientId) {
    return {
      isConfigured: false,
      isConnected: false,
      canUseFullPlayback: false,
      readiness: 'not-configured',
      label: 'pendiente',
      message: 'Falta terminar la configuraci\u00f3n de Spotify.',
      missingScopes: SPOTIFY_FULL_PLAYBACK_SCOPES,
      product: '',
    };
  }

  if (!session?.accessToken) {
    return {
      isConfigured: true,
      isConnected: false,
      canUseFullPlayback: false,
      readiness: 'needs-connection',
      label: 'requiere cuenta conectada',
      message: 'Necesitas conectar una cuenta real de Spotify.',
      missingScopes: SPOTIFY_FULL_PLAYBACK_SCOPES,
      product,
    };
  }

  if (missingScopes.length > 0) {
    return {
      isConfigured: true,
      isConnected: true,
      canUseFullPlayback: false,
      readiness: 'needs-scopes',
      label: 'faltan permisos de playback',
      message:
        'La base est\u00e1 lista, pero la cuenta todav\u00eda no tiene los permisos de reproducci\u00f3n web.',
      missingScopes,
      product,
    };
  }

  if (product && product !== 'premium') {
    return {
      isConfigured: true,
      isConnected: true,
      canUseFullPlayback: false,
      readiness: 'premium-required',
      label: 'requiere Spotify Premium',
      message:
        'Spotify solo habilita la reproducci\u00f3n completa dentro de la app con cuentas Premium.',
      missingScopes: [],
      product,
    };
  }

  if (!isWebEnvironment()) {
    return {
      isConfigured: true,
      isConnected: true,
      canUseFullPlayback: false,
      readiness: 'needs-web-sdk',
      label: 'base lista para SDK nativo',
      message:
        'La cuenta ya est\u00e1 bastante lista; el siguiente paso ser\u00eda sumar reproducci\u00f3n web real o un SDK nativo.',
      missingScopes: [],
      product,
    };
  }

  return {
    isConfigured: true,
    isConnected: true,
    canUseFullPlayback: product === 'premium',
    readiness: product === 'premium' ? 'ready' : 'plan-unknown',
    label: product === 'premium' ? 'base premium lista' : 'falta chequear plan',
    message:
      product === 'premium'
        ? 'La cuenta ya qued\u00f3 lista para avanzar con una reproducci\u00f3n web completa.'
        : 'La cuenta ya tiene permisos base. Solo falta confirmar el plan o reconectar con los permisos finales.',
    missingScopes: [],
    product,
  };
};

export async function getSpotifyUserSession() {
  try {
    const session = await ensureSpotifySession();

    return {
      ok: true,
      session,
      isConfigured: Boolean(rawSpotifyClientId),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error?.message || 'No pudimos recuperar la sesi\u00f3n de Spotify.',
      isConfigured: Boolean(rawSpotifyClientId),
    };
  }
}

export async function startSpotifyConnect() {
  if (!rawSpotifyClientId) {
    return {
      ok: false,
      message:
        'Falta EXPO_PUBLIC_SPOTIFY_CLIENT_ID para conectar una cuenta real de Spotify.',
    };
  }

  if (!isWebEnvironment()) {
    return {
      ok: false,
      message:
        'La conexion directa con Spotify quedo preparada primero para la web.',
    };
  }

  const codeVerifier = generateRandomString(96);
  const codeChallenge = await createCodeChallenge(codeVerifier);
  const state = generateRandomString(24);

  await AsyncStorage.multiSet([
    [SPOTIFY_CODE_VERIFIER_KEY, codeVerifier],
    [SPOTIFY_AUTH_STATE_KEY, state],
  ]);

  const authorizeUrl = new URL(SPOTIFY_AUTHORIZE_URL);
  authorizeUrl.searchParams.set('client_id', rawSpotifyClientId);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('redirect_uri', rawSpotifyRedirectUri);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('scope', SPOTIFY_SCOPES.join(' '));
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('show_dialog', 'false');

  window.location.assign(authorizeUrl.toString());

  return {
    ok: true,
    redirected: true,
  };
}

export async function completeSpotifyConnectFromUrl() {
  if (!isWebEnvironment()) {
    return { ok: false, skipped: true };
  }

  const currentUrl = new URL(window.location.href);

  if (!currentUrl.pathname.startsWith('/spotify/callback')) {
    return { ok: false, skipped: true };
  }

  const code = currentUrl.searchParams.get('code');
  const state = currentUrl.searchParams.get('state');
  const error = currentUrl.searchParams.get('error');

  if (error) {
    await clearAuthArtifacts();
    window.history.replaceState({}, document.title, '/');
    return {
      ok: false,
      message: `Spotify rechaz\u00f3 el acceso: ${error}.`,
    };
  }

  if (!code) {
    await clearAuthArtifacts();
    window.history.replaceState({}, document.title, '/');
    return {
      ok: false,
      message: 'Spotify no devolvi\u00f3 c\u00f3digo de acceso.',
    };
  }

  const [[, storedState], [, storedVerifier]] = await AsyncStorage.multiGet([
    SPOTIFY_AUTH_STATE_KEY,
    SPOTIFY_CODE_VERIFIER_KEY,
  ]);

  if (!storedState || !storedVerifier || storedState !== state) {
    await clearAuthArtifacts();
    window.history.replaceState({}, document.title, '/');
    return {
      ok: false,
      message:
        'La validaci\u00f3n de Spotify no coincide. Reintent\u00e1 la conexi\u00f3n.',
    };
  }

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: rawSpotifyClientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: rawSpotifyRedirectUri,
      code_verifier: storedVerifier,
    }),
  });

  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch (parseError) {
    payload = null;
  }

  if (!response.ok) {
    await clearAuthArtifacts();
    window.history.replaceState({}, document.title, '/');
    return {
      ok: false,
      message:
        payload?.error_description ||
        payload?.error ||
        `Spotify auth respondio ${response.status}.`,
    };
  }

  const session = serializeSession(payload || {});
  await saveStoredSession(session);
  await clearAuthArtifacts();
  window.history.replaceState({}, document.title, '/');

  return {
    ok: true,
    session,
  };
}

export async function disconnectSpotifyUser() {
  await clearAuthArtifacts();
  await AsyncStorage.removeItem(SPOTIFY_SESSION_KEY);
  return { ok: true };
}

export async function setPendingSpotifyExportList(listId = '') {
  if (!listId) {
    await AsyncStorage.removeItem(SPOTIFY_PENDING_EXPORT_KEY);
    return;
  }

  await AsyncStorage.setItem(SPOTIFY_PENDING_EXPORT_KEY, listId);
}

export async function consumePendingSpotifyExportList() {
  const listId = await AsyncStorage.getItem(SPOTIFY_PENDING_EXPORT_KEY);

  if (listId) {
    await AsyncStorage.removeItem(SPOTIFY_PENDING_EXPORT_KEY);
  }

  return listId || '';
}

export async function fetchSpotifyCurrentUser() {
  const session = await ensureSpotifySession();

  if (!session?.accessToken) {
    return {
      ok: false,
      message: 'Primero conecta tu cuenta de Spotify.',
      needsAuth: true,
    };
  }

  try {
    const profile = await fetchSpotifyApi('/me', session.accessToken);

    return { ok: true, profile, session };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos leer tu cuenta de Spotify.',
    };
  }
}

const searchTrackUri = async (accessToken, track) => {
  const query = `track:${track.title} artist:${track.artist}`;
  const payload = await fetchSpotifyApi(
    `/search?type=track&limit=3&market=AR&q=${encodeURIComponent(query)}`,
    accessToken
  );
  const items = Array.isArray(payload?.tracks?.items) ? payload.tracks.items : [];

  if (!items.length) {
    return null;
  }

  const bestMatch = [...items].sort(
    (left, right) => scoreTrackCandidate(right, track) - scoreTrackCandidate(left, track)
  )[0];

  return bestMatch?.uri || null;
};

const scoreAlbumCandidate = (item, album) => {
  const normalizedAlbum = normalizeSpotifyText(album?.title || '');
  const normalizedArtist = normalizeSpotifyText(album?.artist || '');
  const itemName = normalizeSpotifyText(item?.name || '');
  const itemArtists = normalizeSpotifyText(
    (item?.artists || []).map((artist) => artist?.name).join(' ')
  );
  let score = 0;

  if (itemName === normalizedAlbum) {
    score += 90;
  } else if (
    normalizedAlbum &&
    (itemName.includes(normalizedAlbum) || normalizedAlbum.includes(itemName))
  ) {
    score += 45;
  }

  if (itemArtists === normalizedArtist) {
    score += 75;
  } else if (
    normalizedArtist &&
    (itemArtists.includes(normalizedArtist) ||
      normalizedArtist.includes(itemArtists))
  ) {
    score += 35;
  }

  return score;
};

const fetchAlbumSeedTrackUri = async (accessToken, albumId) => {
  if (!albumId) {
    return null;
  }

  const payload = await fetchSpotifyApi(
    `/albums/${albumId}/tracks?market=AR&limit=5`,
    accessToken
  );
  const tracks = Array.isArray(payload?.items) ? payload.items : [];

  return tracks.find((track) => track?.uri)?.uri || null;
};

const searchAlbumSeedTrack = async (accessToken, album) => {
  const query = `album:${album.title} artist:${album.artist}`;
  const payload = await fetchSpotifyApi(
    `/search?type=album&limit=5&market=AR&q=${encodeURIComponent(query)}`,
    accessToken
  );
  const items = Array.isArray(payload?.albums?.items) ? payload.albums.items : [];

  if (!items.length) {
    return null;
  }

  const bestMatch = [...items].sort(
    (left, right) => scoreAlbumCandidate(right, album) - scoreAlbumCandidate(left, album)
  )[0];
  const uri = await fetchAlbumSeedTrackUri(accessToken, bestMatch?.id);

  if (!uri) {
    return null;
  }

  return {
    uri,
    resolution: 'album-seed',
  };
};

const resolveListItemToSpotifyUri = async (accessToken, item) => {
  const looksLikeTrack = Boolean(
    item?.trackId || item?.trackNumber || item?.durationMs
  );

  if (looksLikeTrack) {
    const directTrackUri = await searchTrackUri(accessToken, item);

    if (directTrackUri) {
      return {
        uri: directTrackUri,
        resolution: 'track-match',
      };
    }
  }

  const albumSeedMatch = await searchAlbumSeedTrack(accessToken, item);

  if (albumSeedMatch) {
    return albumSeedMatch;
  }

  const directTrackUri = await searchTrackUri(accessToken, item);

  if (!directTrackUri) {
    return null;
  }

  return {
    uri: directTrackUri,
    resolution: 'track-match',
  };
};

export async function exportListToSpotifyPlaylist(list) {
  if (!list?.items?.length) {
    return {
      ok: false,
      message: 'La lista est\u00e1 vac\u00eda. Agreg\u00e1 discos antes de exportarla.',
    };
  }

  const profileResult = await fetchSpotifyCurrentUser();

  if (!profileResult.ok) {
    return profileResult;
  }

  try {
    const { session } = profileResult;
    const candidateTracks = list.items.slice(0, 80);
    const resolvedUris = [];
    const unmatchedTracks = [];
    let albumSeedCount = 0;
    let directMatchCount = 0;

    for (const item of candidateTracks) {
      try {
        const resolvedTrack = await resolveListItemToSpotifyUri(
          session.accessToken,
          item
        );

        if (resolvedTrack?.uri) {
          resolvedUris.push(resolvedTrack.uri);

          if (resolvedTrack.resolution === 'album-seed') {
            albumSeedCount += 1;
          } else {
            directMatchCount += 1;
          }
        } else {
          unmatchedTracks.push(`${item.title} \u00b7 ${item.artist}`);
        }
      } catch (error) {
        unmatchedTracks.push(`${item.title} \u00b7 ${item.artist}`);
      }
    }

    if (!resolvedUris.length) {
      return {
        ok: false,
        message:
          'Spotify conect\u00f3 bien, pero no pudimos convertir estos discos en una playlist reproducible. Prob\u00e1 con una lista que tenga m\u00e1s lanzamientos conocidos.',
      };
    }

    const createdPlaylist = await fetchSpotifyApi(
      '/me/playlists',
      session.accessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          name: `B-Side \u00b7 ${list.name}`,
          description:
            `Exportada desde B-Side el ${new Date().toLocaleDateString('es-AR')}. ` +
            'Incluye un tema representativo por cada disco que Spotify pudo ubicar.',
          public: list.isPublic === true,
        }),
      }
    );

    await fetchSpotifyApi(
      `/playlists/${createdPlaylist.id}/items`,
      session.accessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          uris: resolvedUris,
        }),
      }
    );

    return {
      ok: true,
      playlist: createdPlaylist,
      matchedCount: resolvedUris.length,
      missingCount: unmatchedTracks.length,
      albumSeedCount,
      directMatchCount,
      unmatchedTracks,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error?.message || 'No pudimos exportar la lista a Spotify.',
    };
  }
}



