const rawSpotifyProxyUrl = process.env.EXPO_PUBLIC_SPOTIFY_PROXY_URL?.trim() || '';

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

const normalizeSpotifyAlbumCandidates = (items = []) => {
  const uniqueAlbums = new Set();

  return items.reduce((accumulator, item) => {
    const album = item?.album || {};
    const albumId = album.id || item?.id;

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
      cover: album.images?.[0]?.url || '',
      genre: 'Spotify',
      year: album.release_date ? new Date(album.release_date).getFullYear() : '',
      previewUrl: item?.preview_url || '',
      externalUrl: album.external_urls?.spotify || item?.external_urls?.spotify || '',
      source: 'spotify',
    });

    return accumulator;
  }, []);
};

const searchSpotifyCatalog = async (term, { signal, limit = 20 } = {}) => {
  const searchUrl = buildSpotifySearchUrl(term, limit);

  if (!searchUrl) {
    return [];
  }

  const response = await fetch(searchUrl, { signal });

  if (!response.ok) {
    throw new Error(`Spotify proxy respondio ${response.status}`);
  }

  const payload = await response.json();
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.tracks?.items)
      ? payload.tracks.items
      : [];

  return normalizeSpotifyAlbumCandidates(items);
};

const searchItunesCatalog = async (term, { signal, limit = 30 } = {}) => {
  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(
      term
    )}&entity=song&limit=${limit}`,
    { signal }
  );
  const data = await response.json();
  const uniqueAlbums = new Set();
  const formattedResults = [];

  (data.results || []).forEach((item) => {
    if (uniqueAlbums.has(item.collectionId) || !item.collectionId) {
      return;
    }

    uniqueAlbums.add(item.collectionId);
    formattedResults.push({
      id: item.collectionId.toString(),
      albumId: item.collectionId.toString(),
      title: item.collectionName || item.trackName,
      artist: item.artistName,
      cover: item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb', '600x600bb')
        : '',
      genre: item.primaryGenreName,
      year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : '',
      previewUrl: item.previewUrl || '',
      source: 'itunes',
    });
  });

  return formattedResults.slice(0, 25);
};

export const getMusicCatalogProvider = () =>
  getSpotifyProxyUrl() ? 'spotify' : 'itunes';

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
