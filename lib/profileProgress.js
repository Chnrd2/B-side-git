const ACHIEVEMENT_CONFIG = [
  {
    id: 'first-review',
    title: 'Primera reseña',
    description: 'Tu primera opinión ya dejó huella.',
    condition: 'Publicar 1 reseña',
    icon: 'pen',
    metric: 'reviews',
    threshold: 1,
  },
  {
    id: 'three-listens',
    title: 'Radar despierto',
    description: 'Metiste tres escuchas y tu semana ya arrancó con intención.',
    condition: 'Escuchar 3 discos',
    icon: 'radio',
    metric: 'listeningDays',
    threshold: 3,
  },
  {
    id: 'profile-complete',
    title: 'Perfil afilado',
    description: 'Tu lado B ya se reconoce sin explicar demasiado.',
    condition: 'Completar perfil',
    icon: 'sparkles',
    metric: 'profileCompleted',
    threshold: 1,
  },
  {
    id: 'list-builder',
    title: 'Curador en marcha',
    description: 'Tus listas ya muestran criterio propio.',
    condition: 'Crear 3 listas',
    icon: 'list',
    metric: 'lists',
    threshold: 3,
  },
  {
    id: 'streak-keeper',
    title: 'Racha firme',
    description: 'Sostuviste el ritmo durante siete días seguidos.',
    condition: 'Llegar a 7 días de racha',
    icon: 'flame',
    metric: 'streak',
    threshold: 7,
  },
  {
    id: 'trusted-curator',
    title: 'Recomendador de confianza',
    description: 'Tus recomendaciones ya están moviendo a otros.',
    condition: 'Enviar 5 recomendaciones',
    icon: 'send',
    metric: 'recommendations',
    threshold: 5,
  },
  {
    id: 'top-keeper',
    title: 'Top con firma',
    description: 'Tu Top 5 ya cuenta de dónde viene tu gusto.',
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
  { level: 1, minPoints: 0, title: 'Encendiendo radar' },
  { level: 2, minPoints: 60, title: 'Subiendo el nivel' },
  { level: 3, minPoints: 140, title: 'Curando con intención' },
  { level: 4, minPoints: 240, title: 'Tu identidad ya pesa' },
  { level: 5, minPoints: 360, title: 'Referencia B-Side' },
];

const clampProgress = (value = 0, threshold = 1) =>
  Math.max(0, Math.min(1, value / Math.max(threshold, 1)));

const getMetricProgressLabel = (achievement) => {
  if (achievement.unlocked) {
    return 'Ya lo destrabaste';
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
    [...LEVEL_STEPS].reverse().find((step) => points >= step.minPoints) || LEVEL_STEPS[0];
  const nextStep = LEVEL_STEPS.find((step) => step.level === activeStep.level + 1) || null;
  const basePoints = activeStep.minPoints;
  const nextPoints = nextStep?.minPoints || basePoints + 120;
  const progress = clampProgress(points - basePoints, nextPoints - basePoints);

  return {
    level: activeStep.level,
    levelTitle: activeStep.title,
    points,
    nextLevel: nextStep?.level || activeStep.level,
    nextLevelTitle: nextStep?.title || 'Pico actual',
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
    return 'Ya destrabaste todo lo de esta etapa. Ahora toca sostener el ritmo.';
  }

  if (streakCurrent >= 7) {
    return 'Tu semana viene filosa. Estás a nada de otro salto.';
  }

  if (!profileCompleted) {
    return 'Terminá tu perfil y vas a sentir el progreso mucho más rápido.';
  }

  if (unlockedCount === 0) {
    return 'Con una reseña, una lista y un par de escuchas ya arranca el juego.';
  }

  return 'Cada escucha, lista y recomendación te hace pesar un poco más.';
};

const buildLevelHeadline = (level = 1) => {
  if (level <= 1) return 'Tu gusto ya está tomando forma';
  if (level === 2) return 'Estás subiendo el nivel 🎧';
  if (level === 3) return 'Tu perfil ya tiene firma propia';
  if (level === 4) return 'Tu identidad musical ya se nota';
  return 'Ya sos referencia en B-Side';
};

const buildActivityPercentile = (points = 0) =>
  Math.max(18, Math.min(96, Math.round(28 + points / 5.5)));

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

  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked);
  const lockedAchievements = achievements.filter((achievement) => !achievement.unlocked);
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
  const activityPercentile = buildActivityPercentile(totalPoints);

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
    levelHeadline: buildLevelHeadline(levelSummary.level),
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
    activityPercentile,
    comparisonCopy: `Más activo que el ${activityPercentile}% de los perfiles nuevos`,
  };
};
