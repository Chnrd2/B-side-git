const ACHIEVEMENT_CONFIG = [
  {
    id: 'first-review',
    title: 'Primera reseña',
    description: 'Publicá tu primera reseña para empezar a dejar huella.',
    condition: 'Publicar 1 reseña',
    icon: 'pen',
    metric: 'reviews',
    threshold: 1,
  },
  {
    id: 'three-listens',
    title: 'Tres escuchas',
    description: 'Escuchá tres discos desde B-Side para activar tu radar.',
    condition: 'Escuchar 3 discos',
    icon: 'radio',
    metric: 'listeningDays',
    threshold: 3,
  },
  {
    id: 'profile-complete',
    title: 'Perfil completo',
    description: 'Completá tu perfil para que la gente te encuentre de verdad.',
    condition: 'Completar perfil',
    icon: 'sparkles',
    metric: 'profileCompleted',
    threshold: 1,
  },
  {
    id: 'list-builder',
    title: 'Armador de listas',
    description: 'Creá tres listas propias y empezá a ordenar tu lado B.',
    condition: 'Crear 3 listas',
    icon: 'list',
    metric: 'lists',
    threshold: 3,
  },
  {
    id: 'streak-keeper',
    title: 'Racha firme',
    description: 'Mantené una racha de 7 días y destrabá un marco nuevo.',
    condition: 'Llegar a 7 días de racha',
    icon: 'flame',
    metric: 'streak',
    threshold: 7,
  },
  {
    id: 'trusted-curator',
    title: 'Curador de confianza',
    description: 'Mandá 5 recomendaciones y convertite en referencia para otros.',
    condition: 'Enviar 5 recomendaciones',
    icon: 'send',
    metric: 'recommendations',
    threshold: 5,
  },
  {
    id: 'top-keeper',
    title: 'Top afilado',
    description: 'Completá tu Top 5 histórico y dejá claro de dónde viene tu gusto.',
    condition: 'Fijar 5 discos en tu Top 5',
    icon: 'crown',
    metric: 'topAlbumsPinned',
    threshold: 5,
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
    label: 'Brillo suave',
    glowColor: 'rgba(168,85,247,0.36)',
    ringColor: 'rgba(221,214,254,0.96)',
  },
  neon: {
    id: 'neon',
    label: 'Neón',
    glowColor: 'rgba(168,85,247,0.54)',
    ringColor: 'rgba(196,181,253,1)',
  },
  gold: {
    id: 'gold',
    label: 'Dorado',
    glowColor: 'rgba(251,191,36,0.42)',
    ringColor: 'rgba(253,224,71,1)',
  },
};

const LEVEL_STEPS = [
  { level: 1, minPoints: 0, title: 'Recién llegado' },
  { level: 2, minPoints: 60, title: 'Radar activo' },
  { level: 3, minPoints: 140, title: 'Curador en ascenso' },
  { level: 4, minPoints: 240, title: 'Coleccionista nocturno' },
  { level: 5, minPoints: 360, title: 'Referencia B-Side' },
];

const clampProgress = (value = 0, threshold = 1) =>
  Math.max(0, Math.min(1, value / Math.max(threshold, 1)));

const getMetricProgressLabel = (achievement) => {
  if (achievement.unlocked) {
    return 'Desbloqueado';
  }

  const remaining = Math.max(0, achievement.threshold - achievement.value);
  return remaining === 1 ? 'Te falta 1 paso' : `Te faltan ${remaining} pasos`;
};

const getAvatarFrame = ({ unlockedCount = 0, streakCurrent = 0, totalCount = 0 }) => {
  if (unlockedCount >= totalCount || streakCurrent >= 30) {
    return AVATAR_FRAME_CONFIG.gold;
  }

  if (streakCurrent >= 7 || unlockedCount >= 4) {
    return AVATAR_FRAME_CONFIG.neon;
  }

  if (unlockedCount >= 2) {
    return AVATAR_FRAME_CONFIG.glow;
  }

  return AVATAR_FRAME_CONFIG.default;
};

const buildLevelSummary = (points = 0) => {
  const activeStep =
    [...LEVEL_STEPS]
      .reverse()
      .find((step) => points >= step.minPoints) || LEVEL_STEPS[0];

  const nextStep =
    LEVEL_STEPS.find((step) => step.level === activeStep.level + 1) || null;
  const basePoints = activeStep.minPoints;
  const nextPoints = nextStep?.minPoints || basePoints + 120;
  const progress = clampProgress(points - basePoints, nextPoints - basePoints);

  return {
    level: activeStep.level,
    levelTitle: activeStep.title,
    points,
    nextLevel: nextStep?.level || activeStep.level,
    nextLevelTitle: nextStep?.title || 'Máximo nivel por ahora',
    nextLevelProgress: progress,
    nextLevelRemaining: nextStep ? Math.max(0, nextStep.minPoints - points) : 0,
  };
};

const buildMomentumCopy = ({
  unlockedCount = 0,
  totalCount = 0,
  streakCurrent = 0,
  profileCompleted = false,
}) => {
  if (unlockedCount >= totalCount) {
    return 'Ya destrabaste todo lo disponible. Ahora toca sostener el nivel.';
  }

  if (streakCurrent >= 7) {
    return 'Tu ritmo está firme. Un par de movimientos más y subís otro escalón.';
  }

  if (!profileCompleted) {
    return 'Completá tu perfil y destrabá una base más sólida para tu lado B.';
  }

  if (unlockedCount === 0) {
    return 'Con una reseña, una escucha y una lista ya empezás a sumar señales reales.';
  }

  return 'Cada escucha, lista y recomendación empuja tu progreso un poco más.';
};

export const buildAchievementSummary = ({
  userHandle = '',
  reviewCount = 0,
  listCount = 0,
  streakCurrent = 0,
  listeningDays = 0,
  recommendationsSent = 0,
  topAlbumsPinned = 0,
  profileCompleted = false,
} = {}) => {
  const metrics = {
    reviews: reviewCount,
    lists: listCount,
    streak: streakCurrent,
    listeningDays,
    recommendations: recommendationsSent,
    topAlbumsPinned,
    profileCompleted: profileCompleted ? 1 : 0,
  };

  const achievements = ACHIEVEMENT_CONFIG.map((achievement) => {
    const value = metrics[achievement.metric] || 0;
    const unlocked = value >= achievement.threshold;

    return {
      ...achievement,
      value,
      unlocked,
      status: unlocked ? 'unlocked' : 'locked',
      progress: clampProgress(value, achievement.threshold),
      progressLabel: getMetricProgressLabel({
        ...achievement,
        unlocked,
        value,
      }),
    };
  });

  const unlockedAchievements = achievements.filter(
    (achievement) => achievement.unlocked
  );
  const lockedAchievements = achievements.filter(
    (achievement) => !achievement.unlocked
  );
  const nextAchievement =
    lockedAchievements.sort((left, right) => {
      const leftRemaining = left.threshold - left.value;
      const rightRemaining = right.threshold - right.value;
      return leftRemaining - rightRemaining;
    })[0] || null;

  const unlockedCount = unlockedAchievements.length;
  const totalCount = achievements.length;
  const totalPoints =
    reviewCount * 14 +
    listCount * 10 +
    recommendationsSent * 8 +
    listeningDays * 4 +
    topAlbumsPinned * 6 +
    streakCurrent * 3 +
    (profileCompleted ? 20 : 0);
  const levelSummary = buildLevelSummary(totalPoints);

  return {
    userHandle,
    achievements,
    unlockedAchievements,
    lockedAchievements,
    nextAchievement,
    unlockedCount,
    totalCount,
    progress: clampProgress(unlockedCount, totalCount),
    progressLabel: `${unlockedCount}/${totalCount}`,
    avatarFrame: getAvatarFrame({
      unlockedCount,
      totalCount,
      streakCurrent,
    }),
    totalPoints,
    level: levelSummary.level,
    levelTitle: levelSummary.levelTitle,
    nextLevel: levelSummary.nextLevel,
    nextLevelTitle: levelSummary.nextLevelTitle,
    nextLevelProgress: levelSummary.nextLevelProgress,
    nextLevelRemaining: levelSummary.nextLevelRemaining,
    momentumCopy: buildMomentumCopy({
      unlockedCount,
      totalCount,
      streakCurrent,
      profileCompleted,
    }),
  };
};
