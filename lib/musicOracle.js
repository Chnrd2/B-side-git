const rawMusicOracleUrl = process.env.EXPO_PUBLIC_MUSIC_ORACLE_URL?.trim() || '';
const rawSupabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

const normalizeOracleText = (value = '') =>
  `${value}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getOracleUrl = () => rawMusicOracleUrl.replace(/\/$/, '');

const getOracleHeaders = () => {
  if (!rawSupabaseAnonKey) {
    return {
      'Content-Type': 'application/json',
    };
  }

  return {
    'Content-Type': 'application/json',
    apikey: rawSupabaseAnonKey,
    Authorization: `Bearer ${rawSupabaseAnonKey}`,
  };
};

const buildReasonFromTaste = (candidate, tasteProfile = {}, focus = '') => {
  const favoriteArtists = tasteProfile.favoriteArtists || [];
  const recentMood = tasteProfile.recentReviewMood || '';
  const focusText = `${focus || ''}`.trim();

  if (
    favoriteArtists.some(
      (artist) => normalizeOracleText(artist) === normalizeOracleText(candidate.artist)
    )
  ) {
    return `Ya venís girando alrededor de ${candidate.artist}, y este disco te deja seguir ese hilo sin repetirte.`;
  }

  if (focusText) {
    return `${candidate.reason} Además, conecta muy bien con la pista que marcaste en la búsqueda: ${focusText}.`;
  }

  if (recentMood) {
    return `${candidate.reason} También conversa con el tono que dejaste en tus reseñas recientes: ${recentMood}.`;
  }

  return `${candidate.reason} Tiene mucha pinta de entrar en tu radar si seguís con el mood que venís armando.`;
};

const buildLocalRecommendations = ({
  focus = '',
  tasteProfile = {},
  candidates = [],
}) => {
  const normalizedFocus = normalizeOracleText(focus);
  const favoriteArtists = new Set(
    (tasteProfile.favoriteArtists || []).map((artist) =>
      normalizeOracleText(artist)
    )
  );

  const scoredCandidates = candidates
    .map((candidate, index) => {
      const normalizedTitle = normalizeOracleText(candidate.title);
      const normalizedArtist = normalizeOracleText(candidate.artist);
      let score = Math.max(0, 24 - index);

      if (favoriteArtists.has(normalizedArtist)) {
        score += 25;
      }

      if (normalizedFocus) {
        if (normalizedTitle.includes(normalizedFocus)) {
          score += 28;
        }

        if (normalizedArtist.includes(normalizedFocus)) {
          score += 20;
        }

        if (normalizeOracleText(candidate.reason).includes(normalizedFocus)) {
          score += 14;
        }
      }

      if (candidate.previewUrl) {
        score += 8;
      }

      return {
        ...candidate,
        score,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((candidate) => ({
      ...candidate,
      reason: buildReasonFromTaste(candidate, tasteProfile, focus),
    }));

  return scoredCandidates;
};

const mergeRemoteRecommendations = (recommendations = [], candidates = []) => {
  const candidateMap = new Map(
    candidates.map((candidate) => [candidate.id, candidate])
  );

  return recommendations
    .map((recommendation) => {
      const baseCandidate = candidateMap.get(recommendation.id);

      if (!baseCandidate) {
        return null;
      }

      return {
        ...baseCandidate,
        reason: recommendation.reason || baseCandidate.reason,
      };
    })
    .filter(Boolean)
    .slice(0, 3);
};

export const getMusicOracleStatus = () => ({
  isConfigured: Boolean(getOracleUrl()),
  url: getOracleUrl(),
});

export async function getMusicOracleRecommendations({
  focus = '',
  tasteProfile = {},
  candidates = [],
} = {}) {
  const safeCandidates = candidates.slice(0, 12);

  if (!safeCandidates.length) {
    return {
      ok: true,
      source: 'local',
      recommendations: [],
    };
  }

  if (getOracleUrl()) {
    try {
      const response = await fetch(getOracleUrl(), {
        method: 'POST',
        headers: getOracleHeaders(),
        body: JSON.stringify({
          focus,
          tasteProfile,
          candidates: safeCandidates.map((candidate) => ({
            id: candidate.id,
            title: candidate.title,
            artist: candidate.artist,
            reason: candidate.reason,
          })),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error || `Music Oracle respondió ${response.status}.`
        );
      }

      const mergedRecommendations = mergeRemoteRecommendations(
        payload?.recommendations || [],
        safeCandidates
      );

      if (mergedRecommendations.length) {
        return {
          ok: true,
          source: 'remote',
          recommendations: mergedRecommendations,
        };
      }
    } catch (error) {
      console.warn(
        'Music Oracle remoto no disponible, usamos fallback local:',
        error
      );
    }
  }

  return {
    ok: true,
    source: getOracleUrl() ? 'fallback' : 'local',
    recommendations: buildLocalRecommendations({
      focus,
      tasteProfile,
      candidates: safeCandidates,
    }),
  };
}
