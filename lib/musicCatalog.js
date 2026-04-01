const rawSpotifyProxyUrl = process.env.EXPO_PUBLIC_SPOTIFY_PROXY_URL?.trim() || '';
const rawSupabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search';
const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup';
const SPOTIFY_ALBUM_TRACKS_LIMIT = 8;

const formatDurationLabel = (durationMillis = 0) => {
  const safeDuration = Number(durationMillis) || 0;
  const totalSeconds = Math.max(30, Math.round(safeDuration / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const normalizeCatalogText = (value = '') =>
  `${value}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getSpotifyProxyUrl = () => {
  if (!rawSpotifyProxyUrl) {
    return '';
  }

  return rawSpotifyProxyUrl.replace(/\/$/, '');
};

const buildSpotifySearchUrl = (term, limit) => {
  const baseUrl = getSpotifyProxyUrl();

  if (!baseUrl) {
    return '';
  }

  const separator = baseUrl.includes('?') ? '&' : '?';
  return (
    `${baseUrl}${separator}q=${encodeURIComponent(term)}` +
    `&limit=${encodeURIComponent(limit)}`
  );
};

const getSpotifyProxyHeaders = () => {
  if (!rawSupabaseAnonKey) {
    return {};
  }

  return {
    apikey: rawSupabaseAnonKey,
    Authorization: `Bearer ${rawSupabaseAnonKey}`,
  };
};

const getPlaybackTextByMode = (mode, source = '') => {
  if (mode === 'preview') {
    return {
      badge: 'Muestra 30s',
      actionLabel: 'Escuchar',
      hint: 'Suena adentro de B-Side.',
    };
  }

  if (mode === 'external') {
    const isSpotifySource = `${source}`.trim().toLowerCase() === 'spotify';

    return {
      badge: isSpotifySource ? 'Abrir en Spotify' : 'Abrir afuera',
      actionLabel: isSpotifySource ? 'Abrir Spotify' : 'Abrir',
      hint: isSpotifySource
        ? 'No lleg\u00f3 audio, pero pod\u00e9s seguir escuchando en Spotify.'
        : 'No lleg\u00f3 audio, pero hay una salida externa disponible.',
    };
  }

  return {
    badge: 'Sin audio',
    actionLabel: 'Sin audio',
    hint: 'Solo disponible como ficha, lista o rese\u00f1a.',
  };
};

const formatItunesAlbumResult = (item = {}) => ({
  id: `${item.collectionId || item.artistId || item.trackId || ''}`,
  albumId: `${item.collectionId || item.artistId || item.trackId || ''}`,
  title: item.collectionName || item.trackName || item.artistName || 'Album',
  artist: item.artistName || '',
  cover: item.artworkUrl100
    ? item.artworkUrl100.replace('100x100bb', '600x600bb')
    : '',
  genre: item.primaryGenreName || '',
  year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : '',
  previewUrl: item.previewUrl || '',
  externalUrl: item.collectionViewUrl || item.trackViewUrl || item.artistLinkUrl || '',
  artistId: `${item.artistId || ''}`,
  artistUrl: item.artistViewUrl || item.artistLinkUrl || '',
  source: 'itunes',
});

const formatItunesTrackResult = (item = {}) => ({
  id: `${item.trackId || item.collectionId || item.artistId || ''}`,
  trackId: `${item.trackId || ''}`,
  albumId: `${item.collectionId || item.trackId || ''}`,
  title: item.trackName || item.collectionName || 'Track',
  artist: item.artistName || '',
  cover: item.artworkUrl100
    ? item.artworkUrl100.replace('100x100bb', '600x600bb')
    : '',
  previewUrl: item.previewUrl || '',
  externalUrl: item.trackViewUrl || item.collectionViewUrl || item.artistLinkUrl || '',
  artistId: `${item.artistId || ''}`,
  artistUrl: item.artistViewUrl || item.artistLinkUrl || '',
  durationMs: item.trackTimeMillis || 30000,
  durationLabel: formatDurationLabel(item.trackTimeMillis),
  trackNumber: item.trackNumber || 0,
  source: 'itunes',
});

const dedupeItunesAlbumResults = (items = []) => {
  const uniqueAlbums = new Set();
  const formattedResults = [];

  items.forEach((item) => {
    const formattedItem = formatItunesAlbumResult(item);
    const uniqueKey = formattedItem.albumId || formattedItem.id;

    if (!uniqueKey || uniqueAlbums.has(uniqueKey)) {
      return;
    }

    uniqueAlbums.add(uniqueKey);
    formattedResults.push(formattedItem);
  });

  return formattedResults;
};

const normalizeSpotifyAlbumCandidates = (items = []) => {
  const uniqueAlbums = new Set();

  return items.reduce((accumulator, item) => {
    const album = item?.album || item || {};
    const albumId = album.id || item?.id;
    const primaryArtist = (album.artists || item?.artists || []).find(Boolean) || {};

    if (!albumId || uniqueAlbums.has(albumId)) {
      return accumulator;
    }

    uniqueAlbums.add(albumId);

    accumulator.push({
      id: albumId,
      albumId,
      title: album.name || item?.name || 'Album',
      artist:
        (album.artists || item?.artists || [])
          .map((artist) => artist?.name)
          .filter(Boolean)
          .join(', ') || '',
      cover: album.images?.[0]?.url || item?.images?.[0]?.url || '',
      genre: 'Spotify',
      year:
        album.release_date || item?.release_date
          ? new Date(album.release_date || item.release_date).getFullYear()
          : '',
      previewUrl: item?.preview_url || '',
      externalUrl: album.external_urls?.spotify || item?.external_urls?.spotify || '',
      artistId: primaryArtist?.id || '',
      artistUrl: primaryArtist?.external_urls?.spotify || '',
      source: 'spotify',
    });

    return accumulator;
  }, []);
};

const formatSpotifyTrackResult = (item = {}, albumFallback = {}) => {
  const album = item?.album || albumFallback || {};
  const primaryArtist = (item?.artists || album?.artists || []).find(Boolean) || {};

  return {
    id: `${item?.id || item?.uri || album?.id || ''}`,
    trackId: `${item?.id || ''}`,
    albumId: `${album?.id || albumFallback?.id || item?.album?.id || ''}`,
    title: item?.name || 'Track',
    artist:
      (item?.artists || album?.artists || [])
        .map((artist) => artist?.name)
        .filter(Boolean)
        .join(', ') || '',
    cover: album?.images?.[0]?.url || '',
    previewUrl: item?.preview_url || '',
    externalUrl: item?.external_urls?.spotify || album?.external_urls?.spotify || '',
    artistId: primaryArtist?.id || '',
    artistUrl: primaryArtist?.external_urls?.spotify || '',
    durationMs: item?.duration_ms || 30000,
    durationLabel: formatDurationLabel(item?.duration_ms || 30000),
    trackNumber: item?.track_number || 0,
    source: 'spotify',
  };
};

const scoreSpotifyAlbumCandidate = (candidate, term) => {
  const normalizedTerm = normalizeCatalogText(term);

  if (!normalizedTerm) {
    return 0;
  }

  const normalizedTitle = normalizeCatalogText(candidate?.title);
  const normalizedArtist = normalizeCatalogText(candidate?.artist);
  const termTokens = normalizedTerm.split(' ').filter(Boolean);
  let score = 0;

  if (normalizedArtist === normalizedTerm) {
    score += 140;
  } else if (normalizedArtist.startsWith(normalizedTerm)) {
    score += 90;
  } else if (normalizedArtist.includes(normalizedTerm)) {
    score += 55;
  }

  if (normalizedTitle === normalizedTerm) {
    score += 110;
  } else if (normalizedTitle.startsWith(normalizedTerm)) {
    score += 70;
  } else if (normalizedTitle.includes(normalizedTerm)) {
    score += 40;
  }

  if (
    termTokens.length > 1 &&
    termTokens.every(
      (token) => normalizedArtist.includes(token) || normalizedTitle.includes(token)
    )
  ) {
    score += 45;
  }

  if (candidate?.previewUrl) {
    score += 12;
  }

  if (candidate?.year) {
    score += Math.max(0, 10 - Math.min(10, new Date().getFullYear() - candidate.year));
  }

  return score;
};

const rankSpotifyAlbumCandidates = (items = [], term) =>
  [...items].sort(
    (left, right) =>
      scoreSpotifyAlbumCandidate(right, term) -
      scoreSpotifyAlbumCandidate(left, term)
  );

const searchSpotifyCatalog = async (term, { signal, limit = 20 } = {}) => {
  const searchUrl = buildSpotifySearchUrl(term, limit);

  if (!searchUrl) {
    return [];
  }

  const response = await fetch(searchUrl, {
    signal,
    headers: getSpotifyProxyHeaders(),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Spotify proxy respondi\u00f3 ${response.status}${
        detail ? `: ${detail}` : ''
      }`
    );
  }

  const payload = await response.json();
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.tracks?.items)
      ? payload.tracks.items
      : [];
  const normalizedItems = normalizeSpotifyAlbumCandidates(items);

  return rankSpotifyAlbumCandidates(normalizedItems, term);
};

const buildSpotifyAlbumTracksUrl = (albumId, limit = SPOTIFY_ALBUM_TRACKS_LIMIT) => {
  const baseUrl = getSpotifyProxyUrl();

  if (!baseUrl || !albumId) {
    return '';
  }

  const separator = baseUrl.includes('?') ? '&' : '?';
  return (
    `${baseUrl}${separator}mode=album-tracks&id=${encodeURIComponent(albumId)}` +
    `&limit=${encodeURIComponent(limit)}`
  );
};

const searchItunesCatalog = async (term, { signal, limit = 30 } = {}) => {
  const songResponse = await fetch(
    `${ITUNES_SEARCH_URL}?term=${encodeURIComponent(
      term
    )}&entity=song&limit=${limit}`,
    { signal }
  );

  if (!songResponse.ok) {
    throw new Error(`iTunes search respondi\u00f3 ${songResponse.status}`);
  }

  const songPayload = await songResponse.json();
  const albumResponse = await fetch(
    `${ITUNES_SEARCH_URL}?term=${encodeURIComponent(
      term
    )}&entity=album&limit=${Math.max(10, Math.floor(limit / 2))}`,
    { signal }
  );

  if (!albumResponse.ok) {
    throw new Error(`iTunes album search respondi\u00f3 ${albumResponse.status}`);
  }

  const albumPayload = await albumResponse.json();
  return dedupeItunesAlbumResults([
    ...(songPayload?.results || []),
    ...(albumPayload?.results || []),
  ]).slice(0, 25);
};

const lookupItunesAlbumTracks = async (albumId, { signal } = {}) => {
  if (!/^\d+$/.test(`${albumId || ''}`)) {
    return [];
  }

  const response = await fetch(
    `${ITUNES_LOOKUP_URL}?id=${encodeURIComponent(albumId)}&entity=song&limit=12`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`iTunes lookup respondi\u00f3 ${response.status}`);
  }

  const payload = await response.json();

  return (payload?.results || [])
    .filter((item) => item?.wrapperType === 'track')
    .map((item) => formatItunesTrackResult(item))
    .sort((left, right) => left.trackNumber - right.trackNumber);
};

const scoreItunesPreviewCandidate = (candidate, album) => {
  if (!candidate?.previewUrl) {
    return -1;
  }

  const normalizedAlbumTitle = normalizeCatalogText(
    album?.title || album?.albumTitle
  );
  const normalizedAlbumArtist = normalizeCatalogText(
    album?.artist || album?.artistName
  );
  const normalizedCollection = normalizeCatalogText(candidate?.collectionName);
  const normalizedTrack = normalizeCatalogText(candidate?.trackName);
  const normalizedArtist = normalizeCatalogText(candidate?.artistName);

  let score = 20;

  if (normalizedAlbumTitle && normalizedCollection === normalizedAlbumTitle) {
    score += 80;
  } else if (
    normalizedAlbumTitle &&
    (normalizedCollection.includes(normalizedAlbumTitle) ||
      normalizedAlbumTitle.includes(normalizedCollection))
  ) {
    score += 45;
  }

  if (normalizedAlbumTitle && normalizedTrack === normalizedAlbumTitle) {
    score += 35;
  } else if (
    normalizedAlbumTitle &&
    (normalizedTrack.includes(normalizedAlbumTitle) ||
      normalizedAlbumTitle.includes(normalizedTrack))
  ) {
    score += 18;
  }

  if (normalizedAlbumArtist && normalizedArtist === normalizedAlbumArtist) {
    score += 60;
  } else if (
    normalizedAlbumArtist &&
    (normalizedArtist.includes(normalizedAlbumArtist) ||
      normalizedAlbumArtist.includes(normalizedArtist))
  ) {
    score += 30;
  }

  return score;
};

const pickBestItunesPreviewCandidate = (results = [], album) =>
  [...results]
    .filter((candidate) => candidate?.previewUrl)
    .sort(
      (left, right) =>
        scoreItunesPreviewCandidate(right, album) -
        scoreItunesPreviewCandidate(left, album)
    )[0] || null;

const searchItunesPreviewCandidate = async (album, { signal } = {}) => {
  const query = [album?.artist, album?.title || album?.albumTitle]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (!query) {
    return null;
  }

  const response = await fetch(
    `${ITUNES_SEARCH_URL}?term=${encodeURIComponent(
      query
    )}&entity=song&limit=15`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`iTunes search respondi\u00f3 ${response.status}`);
  }

  const payload = await response.json();
  return pickBestItunesPreviewCandidate(payload?.results || [], album);
};

const searchItunesAlbumTracks = async (album, { signal } = {}) => {
  const query = [album?.artist, album?.title || album?.albumTitle]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (!query) {
    return [];
  }

  const response = await fetch(
    `${ITUNES_SEARCH_URL}?term=${encodeURIComponent(
      query
    )}&entity=song&limit=12`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`iTunes search respondi\u00f3 ${response.status}`);
  }

  const payload = await response.json();

  return (payload?.results || [])
    .filter((candidate) => scoreItunesPreviewCandidate(candidate, album) >= 40)
    .map((candidate) => formatItunesTrackResult(candidate))
    .sort((left, right) => left.trackNumber - right.trackNumber);
};

const scoreItunesTrackCandidate = (candidate, track) => {
  if (!candidate?.previewUrl) {
    return -1;
  }

  const normalizedTrackTitle = normalizeCatalogText(track?.title);
  const normalizedTrackArtist = normalizeCatalogText(track?.artist);
  const candidateTitle = normalizeCatalogText(candidate?.trackName);
  const candidateArtist = normalizeCatalogText(candidate?.artistName);
  let score = 0;

  if (candidateTitle === normalizedTrackTitle) {
    score += 90;
  } else if (candidateTitle.includes(normalizedTrackTitle)) {
    score += 45;
  }

  if (candidateArtist === normalizedTrackArtist) {
    score += 75;
  } else if (
    candidateArtist.includes(normalizedTrackArtist) ||
    normalizedTrackArtist.includes(candidateArtist)
  ) {
    score += 35;
  }

  return score;
};

const searchItunesTrackPreviewByTrack = async (track, { signal } = {}) => {
  const query = [track?.artist, track?.title].filter(Boolean).join(' ').trim();

  if (!query) {
    return null;
  }

  const response = await fetch(
    `${ITUNES_SEARCH_URL}?term=${encodeURIComponent(
      query
    )}&entity=song&limit=5`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`iTunes search respondi\u00f3 ${response.status}`);
  }

  const payload = await response.json();
  const bestCandidate =
    [...(payload?.results || [])]
      .filter((candidate) => candidate?.previewUrl)
      .sort(
        (left, right) =>
          scoreItunesTrackCandidate(right, track) -
          scoreItunesTrackCandidate(left, track)
      )[0] || null;

  return bestCandidate ? formatItunesTrackResult(bestCandidate) : null;
};

const fetchSpotifyAlbumTracks = async (album, { signal } = {}) => {
  const albumId = `${album?.albumId || album?.id || ''}`.trim();
  const requestUrl = buildSpotifyAlbumTracksUrl(albumId);

  if (!requestUrl) {
    return [];
  }

  const response = await fetch(requestUrl, {
    signal,
    headers: getSpotifyProxyHeaders(),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Spotify album tracks respondi\u00f3 ${response.status}${
        detail ? `: ${detail}` : ''
      }`
    );
  }

  const payload = await response.json();
  const albumPayload = payload?.album || {};
  const trackItems = Array.isArray(payload?.tracks) ? payload.tracks : [];

  return trackItems
    .map((track) => formatSpotifyTrackResult(track, albumPayload))
    .sort((left, right) => left.trackNumber - right.trackNumber);
};

const mergeTrackCollections = (primaryTracks = [], fallbackTracks = []) => {
  const fallbackMap = new Map(
    fallbackTracks.map((track) => [normalizeCatalogText(track.title), track])
  );

  return primaryTracks.map((track) => {
    const fallbackTrack = fallbackMap.get(normalizeCatalogText(track.title));

    if (!fallbackTrack) {
      return track;
    }

    return {
      ...fallbackTrack,
      ...track,
      cover: track.cover || fallbackTrack.cover || '',
      previewUrl: track.previewUrl || fallbackTrack.previewUrl || '',
      externalUrl: track.externalUrl || fallbackTrack.externalUrl || '',
      durationMs: track.durationMs || fallbackTrack.durationMs || 30000,
      durationLabel:
        track.durationLabel ||
        fallbackTrack.durationLabel ||
        formatDurationLabel(track.durationMs || fallbackTrack.durationMs),
      artistId: track.artistId || fallbackTrack.artistId || '',
      artistUrl: track.artistUrl || fallbackTrack.artistUrl || '',
    };
  });
};

const scoreArtistMatch = (candidate, artistName) => {
  const normalizedArtist = normalizeCatalogText(candidate?.artist);
  const normalizedTerm = normalizeCatalogText(artistName);

  if (!normalizedTerm) {
    return 0;
  }

  if (normalizedArtist === normalizedTerm) {
    return 100;
  }

  if (normalizedArtist.startsWith(normalizedTerm)) {
    return 70;
  }

  if (normalizedArtist.includes(normalizedTerm)) {
    return 45;
  }

  const termTokens = normalizedTerm.split(' ').filter(Boolean);

  if (
    termTokens.length > 1 &&
    termTokens.every((token) => normalizedArtist.includes(token))
  ) {
    return 30;
  }

  return 0;
};

const lookupItunesAlbumPreviewCandidate = async (album, { signal } = {}) => {
  const albumId = `${album?.albumId || album?.id || ''}`.trim();

  if (!/^\d+$/.test(albumId)) {
    return null;
  }

  const response = await fetch(
    `${ITUNES_LOOKUP_URL}?id=${encodeURIComponent(albumId)}&entity=song&limit=20`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`iTunes lookup respondi\u00f3 ${response.status}`);
  }

  const payload = await response.json();
  const songResults = (payload?.results || []).filter(
    (item) => item?.wrapperType === 'track'
  );

  return pickBestItunesPreviewCandidate(songResults, album);
};

export const getMusicCatalogProvider = () =>
  getSpotifyProxyUrl() ? 'spotify' : 'itunes';

export const isSpotifyCatalogConfigured = () => Boolean(getSpotifyProxyUrl());

export const getPlaybackState = (item = {}) => {
  const previewUrl = `${item?.previewUrl || ''}`.trim();
  const externalUrl = `${item?.externalUrl || ''}`.trim();
  const source = `${item?.source || ''}`.trim().toLowerCase();
  const mode = previewUrl
    ? 'preview'
    : externalUrl
      ? 'external'
      : 'unavailable';
  const playbackText = getPlaybackTextByMode(mode, source);

  return {
    mode,
    canPlayInline: mode === 'preview',
    canInteract: mode !== 'unavailable',
    previewUrl,
    externalUrl,
    ...playbackText,
  };
};

export const getAlbumPlaybackTarget = (album = {}, tracks = []) => {
  if (`${album?.previewUrl || album?.externalUrl || ''}`.trim()) {
    return album;
  }

  return (
    tracks.find((track) => `${track?.previewUrl || ''}`.trim()) ||
    tracks.find((track) => `${track?.externalUrl || ''}`.trim()) ||
    album
  );
};

export const getAlbumPlaybackState = (album = {}, tracks = []) =>
  getPlaybackState(getAlbumPlaybackTarget(album, tracks));

export async function searchMusicCatalog(term, options = {}) {
  const trimmedTerm = `${term || ''}`.trim();

  if (trimmedTerm.length < 2) {
    return {
      items: [],
      source: getMusicCatalogProvider(),
    };
  }

  if (getSpotifyProxyUrl()) {
    try {
      const spotifyItems = await searchSpotifyCatalog(trimmedTerm, options);

      if (spotifyItems.length > 0) {
        return {
          items: spotifyItems,
          source: 'spotify',
        };
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw error;
      }

      console.warn('Spotify proxy no disponible, volvemos a iTunes:', error);
    }
  }

  return {
    items: await searchItunesCatalog(trimmedTerm, options),
    source: 'itunes',
  };
}

export async function resolveAlbumPlayback(album, options = {}) {
  const directPreviewUrl = `${album?.previewUrl || ''}`.trim();

  if (directPreviewUrl) {
    return {
      ok: true,
      track: {
        ...album,
        previewUrl: directPreviewUrl,
      },
    };
  }

  let candidate = null;

  try {
    candidate = await lookupItunesAlbumPreviewCandidate(album, options);
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }
  }

  if (!candidate) {
    try {
      candidate = await searchItunesPreviewCandidate(album, options);
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw error;
      }
    }
  }

  if (!candidate?.previewUrl) {
    return {
      ok: false,
      track: {
        ...album,
      },
    };
  }

  return {
    ok: true,
    track: {
      ...album,
      previewUrl: candidate.previewUrl,
      externalUrl:
        album?.externalUrl || candidate.collectionViewUrl || candidate.trackViewUrl || '',
      source: album?.source || 'itunes',
      playbackResolvedBy: 'itunes-fallback',
      previewTrackTitle: candidate.trackName || '',
    },
  };
}

export async function fetchAlbumTracks(album, options = {}) {
  if (!album) {
    return [];
  }

  let spotifyTracks = [];
  let itunesTracks = [];

  if (`${album?.source || ''}`.trim() === 'spotify') {
    try {
      spotifyTracks = await fetchSpotifyAlbumTracks(album, options);
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw error;
      }
    }
  }

  try {
    const directItunesTracks = await lookupItunesAlbumTracks(
      album?.albumId || album?.id,
      options
    );
    itunesTracks = directItunesTracks.length
      ? directItunesTracks
      : await searchItunesAlbumTracks(album, options);
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }
  }

  if (spotifyTracks.length > 0) {
    const mergedTracks = mergeTrackCollections(spotifyTracks, itunesTracks).slice(
      0,
      SPOTIFY_ALBUM_TRACKS_LIMIT
    );

    const hydratedTracks = [];

    for (const track of mergedTracks) {
      if (track.previewUrl) {
        hydratedTracks.push(track);
        continue;
      }

      try {
        const rescuedTrack = await searchItunesTrackPreviewByTrack(track, options);

        hydratedTracks.push(
          rescuedTrack
            ? {
                ...track,
                previewUrl: rescuedTrack.previewUrl || '',
                durationMs: track.durationMs || rescuedTrack.durationMs,
                durationLabel:
                  track.durationLabel || rescuedTrack.durationLabel || '0:30',
              }
            : track
        );
      } catch (error) {
        if (error?.name === 'AbortError') {
          throw error;
        }

        hydratedTracks.push(track);
      }
    }

    return hydratedTracks;
  }

  return itunesTracks.slice(0, SPOTIFY_ALBUM_TRACKS_LIMIT);
}

export async function fetchArtistCatalogProfile(
  { artistName, artistId = '', artistUrl = '' } = {},
  options = {}
) {
  const trimmedArtistName = `${artistName || ''}`.trim();

  if (trimmedArtistName.length < 2) {
    return {
      source: getMusicCatalogProvider(),
      artist: {
        id: `${artistId || ''}`.trim(),
        name: trimmedArtistName,
        url: `${artistUrl || ''}`.trim(),
        cover: '',
      },
      albums: [],
    };
  }

  const result = await searchMusicCatalog(trimmedArtistName, {
    ...options,
    limit: Math.min(options?.limit || 10, 10),
  });
  const rankedAlbums = [...(result.items || [])]
    .map((album) => ({
      ...album,
      artistScore: scoreArtistMatch(album, trimmedArtistName),
    }))
    .filter((album) => album.artistScore > 0)
    .sort((left, right) => right.artistScore - left.artistScore || right.year - left.year)
    .slice(0, 8);
  const heroAlbum = rankedAlbums[0] || result.items?.[0] || null;

  return {
    source: result.source,
    artist: {
      id: `${artistId || heroAlbum?.artistId || ''}`.trim(),
      name: trimmedArtistName,
      url: `${artistUrl || heroAlbum?.artistUrl || ''}`.trim(),
      cover: heroAlbum?.cover || '',
    },
    albums: rankedAlbums,
  };
}

