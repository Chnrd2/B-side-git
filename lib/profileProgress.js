const BADGE_CONFIG = [
  {
    id: 'review-rookie',
    title: 'Reseñador novato',
    icon: 'pen',
    metric: 'reviews',
    threshold: 5,
    description: 'Publicá 5 reseñas para desbloquearla.',
  },
  {
    id: 'collector',
    title: 'Coleccionista compulsivo',
    icon: 'list',
    metric: 'lists',
    threshold: 5,
    description: 'Armá 5 listas propias para desbloquearla.',
  },
  {
    id: 'streak-keeper',
    title: 'Racha firme',
    icon: 'flame',
    metric: 'streak',
    threshold: 7,
    description: 'Escuchá 7 días seguidos para desbloquearla.',
  },
  {
    id: 'deep-diver',
    title: 'Radar fino',
    icon: 'radio',
    metric: 'listeningDays',
    threshold: 20,
    description: 'Sumá 20 escuchas registradas para desbloquearla.',
  },
  {
    id: 'trusted-curator',
    title: 'Curador de confianza',
    icon: 'send',
    metric: 'recommendations',
    threshold: 10,
    description: 'Mandá 10 recomendaciones directas para desbloquearla.',
  },
  {
    id: 'god-mode',
    title: 'Modo Dios',
    icon: 'crown',
    metric: 'streak',
    threshold: 100,
    description: 'Llegá a 100 días de racha para desbloquearla.',
  },
];

const AVATAR_FRAME_CONFIG = {
  default: {
    id: 'default',
    label: 'Clásico',
    glowColor: 'rgba(168,85,247,0.22)',
    ringColor: 'rgba(255,255,255,0.9)',
  },
  glow: {
    id: 'glow',
    label: 'Neón suave',
    glowColor: 'rgba(168,85,247,0.34)',
    ringColor: 'rgba(221,214,254,0.96)',
  },
  neon: {
    id: 'neon',
    label: 'Neón desbloqueado',
    glowColor: 'rgba(168,85,247,0.5)',
    ringColor: 'rgba(196,181,253,1)',
  },
  gold: {
    id: 'gold',
    label: 'Marco dorado',
    glowColor: 'rgba(251,191,36,0.42)',
    ringColor: 'rgba(253,224,71,1)',
  },
};

const clampProgress = (value = 0, threshold = 1) =>
  Math.max(0, Math.min(1, value / threshold));

export const buildAchievementSummary = ({
  reviewCount = 0,
  listCount = 0,
  streakCurrent = 0,
  listeningDays = 0,
  recommendationsSent = 0,
} = {}) => {
  const metrics = {
    reviews: reviewCount,
    lists: listCount,
    streak: streakCurrent,
    listeningDays,
    recommendations: recommendationsSent,
  };

  const badges = BADGE_CONFIG.map((badge) => {
    const value = metrics[badge.metric] || 0;
    const unlocked = value >= badge.threshold;

    return {
      ...badge,
      unlocked,
      value,
      progress: clampProgress(value, badge.threshold),
      progressLabel: unlocked
        ? 'Desbloqueada'
        : `${Math.max(0, badge.threshold - value)} para llegar`,
    };
  });

  const unlockedBadges = badges.filter((badge) => badge.unlocked);
  const nextBadge =
    badges
      .filter((badge) => !badge.unlocked)
      .sort((left, right) => {
        const leftRemaining = left.threshold - left.value;
        const rightRemaining = right.threshold - right.value;
        return leftRemaining - rightRemaining;
      })[0] || null;

  let avatarFrame = AVATAR_FRAME_CONFIG.default;

  if (streakCurrent >= 100) {
    avatarFrame = AVATAR_FRAME_CONFIG.gold;
  } else if (streakCurrent >= 30) {
    avatarFrame = AVATAR_FRAME_CONFIG.neon;
  } else if (streakCurrent >= 7) {
    avatarFrame = AVATAR_FRAME_CONFIG.glow;
  }

  return {
    badges,
    unlockedBadges,
    nextBadge,
    avatarFrame,
  };
};
