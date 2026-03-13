import { corsHeaders } from '../_shared/cors.ts';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_SEARCH_URL = 'https://api.spotify.com/v1/search';

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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim();
    const limit = Math.min(
      Math.max(Number(url.searchParams.get('limit') || 20), 1),
      50
    );

    if (q.length < 2) {
      return jsonResponse(200, {
        items: [],
      });
    }

    const accessToken = await getSpotifyAccessToken();
    const spotifyUrl = new URL(SPOTIFY_SEARCH_URL);
    spotifyUrl.searchParams.set('q', q);
    spotifyUrl.searchParams.set('type', 'track');
    spotifyUrl.searchParams.set('limit', `${limit}`);
    spotifyUrl.searchParams.set('market', 'AR');

    const response = await fetch(spotifyUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Spotify search respondio ${response.status}.`);
    }

    const payload = await response.json();

    return jsonResponse(200, {
      items: payload?.tracks?.items || [],
    });
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Spotify proxy fallo.',
    });
  }
});
