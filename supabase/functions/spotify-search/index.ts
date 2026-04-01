import { corsHeaders } from '../_shared/cors.ts';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_SEARCH_URL = 'https://api.spotify.com/v1/search';
const SPOTIFY_ALBUMS_URL = 'https://api.spotify.com/v1/albums';

const jsonResponse = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const getSpotifyAccessToken = async () => {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID') || '';
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET') || '';

  if (!clientId || !clientSecret) {
    throw new Error('Faltan SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET.');
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error(`Spotify token respondio ${response.status}.`);
  }

  const payload = await response.json();

  if (!payload?.access_token) {
    throw new Error('Spotify no devolvio access_token.');
  }

  return payload.access_token as string;
};

const buildSpotifySearchUrl = ({
  q,
  limit,
  market,
  types,
}: {
  q: string;
  limit: number;
  market?: string;
  types: string[];
}) => {
  const spotifyUrl = new URL(SPOTIFY_SEARCH_URL);
  spotifyUrl.searchParams.set('q', q);
  spotifyUrl.searchParams.set('type', types.join(','));
  spotifyUrl.searchParams.set('limit', `${limit}`);

  if (market) {
    spotifyUrl.searchParams.set('market', market);
  }

  return spotifyUrl.toString();
};

const fetchSpotifySearch = async ({
  accessToken,
  q,
  limit,
  market,
  types,
}: {
  accessToken: string;
  q: string;
  limit: number;
  market?: string;
  types: string[];
}) => {
  const response = await fetch(
    buildSpotifySearchUrl({ q, limit, market, types }),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const text = await response.text();
  let payload: Record<string, unknown> | null = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    detail: text,
    payload,
  };
};

const fetchSpotifyJson = async ({
  accessToken,
  url,
}: {
  accessToken: string;
  url: string;
}) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const text = await response.text();
  let payload: Record<string, unknown> | null = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    detail: text,
    payload,
  };
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const mode = (url.searchParams.get('mode') || 'search').trim();
    const q = (url.searchParams.get('q') || '').trim();
    const requestedLimit = Math.min(
      Math.max(Number(url.searchParams.get('limit') || 12), 1),
      12
    );

    if (mode === 'search' && q.length < 2) {
      return jsonResponse(200, {
        items: [],
      });
    }

    const accessToken = await getSpotifyAccessToken();

    if (mode === 'album-tracks') {
      const albumId = (url.searchParams.get('id') || '').trim();

      if (!albumId) {
        return jsonResponse(400, {
          error: 'Falta id del album.',
        });
      }

      const safeLimit = Math.min(requestedLimit, 10);
      const albumAttemptUrls = [
        `${SPOTIFY_ALBUMS_URL}/${encodeURIComponent(albumId)}?market=AR`,
        `${SPOTIFY_ALBUMS_URL}/${encodeURIComponent(albumId)}`,
      ];
      const tracksAttemptUrls = [
        `${SPOTIFY_ALBUMS_URL}/${encodeURIComponent(
          albumId
        )}/tracks?limit=${safeLimit}&market=AR`,
        `${SPOTIFY_ALBUMS_URL}/${encodeURIComponent(
          albumId
        )}/tracks?limit=${safeLimit}`,
      ];

      let albumPayload: Record<string, unknown> | null = null;
      let tracksPayload: Record<string, unknown> | null = null;
      let lastAlbumFailure:
        | { status: number; detail: string; url: string }
        | null = null;
      let lastTracksFailure:
        | { status: number; detail: string; url: string }
        | null = null;

      for (const attemptUrl of albumAttemptUrls) {
        const result = await fetchSpotifyJson({
          accessToken,
          url: attemptUrl,
        });

        if (result.ok) {
          albumPayload = result.payload;
          break;
        }

        lastAlbumFailure = {
          status: result.status,
          detail: result.detail,
          url: attemptUrl,
        };

        if (result.status !== 400) {
          break;
        }
      }

      for (const attemptUrl of tracksAttemptUrls) {
        const result = await fetchSpotifyJson({
          accessToken,
          url: attemptUrl,
        });

        if (result.ok) {
          tracksPayload = result.payload;
          break;
        }

        lastTracksFailure = {
          status: result.status,
          detail: result.detail,
          url: attemptUrl,
        };

        if (result.status !== 400) {
          break;
        }
      }

      if (!albumPayload || !tracksPayload) {
        const detail = [
          lastAlbumFailure
            ? `album ${lastAlbumFailure.status} ${lastAlbumFailure.url} ${lastAlbumFailure.detail}`
            : '',
          lastTracksFailure
            ? `tracks ${lastTracksFailure.status} ${lastTracksFailure.url} ${lastTracksFailure.detail}`
            : '',
        ]
          .filter(Boolean)
          .join(' | ');

        throw new Error(`Spotify album tracks fallo. ${detail}`.trim());
      }

      return jsonResponse(200, {
        album: albumPayload,
        tracks: Array.isArray(tracksPayload?.items) ? tracksPayload.items : [],
      });
    }

    const safeLimit = Math.min(requestedLimit, 10);
    const attempts = [
      { limit: safeLimit, market: 'AR', types: ['album', 'track'] },
      { limit: safeLimit, market: undefined, types: ['album', 'track'] },
      { limit: safeLimit, market: 'AR', types: ['track'] },
      { limit: safeLimit, market: undefined, types: ['track'] },
    ] as const;

    let payload: Record<string, unknown> | null = null;
    let lastFailure:
      | { status: number; detail: string; types: string[]; market?: string }
      | null = null;

    for (const attempt of attempts) {
      const result = await fetchSpotifySearch({
        accessToken,
        q,
        limit: attempt.limit,
        market: attempt.market,
        types: [...attempt.types],
      });

      if (result.ok) {
        payload = result.payload;
        break;
      }

      lastFailure = {
        status: result.status,
        detail: result.detail,
        types: [...attempt.types],
        market: attempt.market,
      };

      if (result.status !== 400) {
        break;
      }
    }

    if (!payload) {
      const context = lastFailure
        ? ` tipos=${lastFailure.types.join(',')} mercado=${lastFailure.market || 'none'} detalle=${lastFailure.detail}`
        : '';

      throw new Error(
        `Spotify search respondio ${lastFailure?.status || 500}.${context}`.trim()
      );
    }

    const albumItems = Array.isArray(payload?.albums?.items)
      ? payload.albums.items
      : [];
    const trackItems = Array.isArray(payload?.tracks?.items)
      ? payload.tracks.items
      : [];

    return jsonResponse(200, {
      items: [...albumItems, ...trackItems],
    });
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Spotify proxy fallo.',
    });
  }
});
