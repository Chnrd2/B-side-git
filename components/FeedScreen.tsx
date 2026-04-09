import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Bell,
  Crown,
  Disc,
  Flame,
  Headphones,
  Heart,
  LockKeyhole,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerSelectionFeedback } from '../lib/feedback';
import SafeArtwork from './SafeArtwork';

const SectionLabel = React.memo(({ eyebrow, title, subtitle, secondary = false }) => (
  <View style={[styles.sectionLabel, secondary && styles.sectionLabelSecondary]}>
    <Text style={[styles.sectionEyebrow, secondary && styles.sectionEyebrowSecondary]}>
      {eyebrow}
    </Text>
    <Text style={[styles.sectionTitle, secondary && styles.sectionTitleSecondary]}>
      {title}
    </Text>
    {subtitle ? (
      <Text style={[styles.sectionSubtitle, secondary && styles.sectionSubtitleSecondary]}>
        {subtitle}
      </Text>
    ) : null}
  </View>
));

const formatRecommendationReason = (reason = '') => {
  if (!reason) {
    return 'Porque tu perfil ya está pidiendo algo nuevo.';
  }

  const normalized = reason.trim();
  if (!normalized) {
    return 'Porque tu perfil ya está pidiendo algo nuevo.';
  }

  const lower = normalized.toLowerCase();
  if (lower.startsWith('porque')) {
    return normalized;
  }

  return `Porque ${lower.charAt(0)}${lower.slice(1)}`;
};

const formatRecommendationContext = (reason = '') => {
  const normalized = `${reason}`.trim();

  if (!normalized) {
    return 'Porque ya dejaste pistas de tu gusto.';
  }

  const lower = normalized.toLowerCase();

  if (lower.includes('escuchas recientes de')) {
    const artist = normalized.split('de').slice(1).join('de').trim();
    return artist ? `Porque escuchaste ${artist}` : 'Porque viene pegado a tus últimas escuchas.';
  }

  if (lower.includes('por escuchar')) {
    return 'Porque lo guardaste para más tarde.';
  }

  if (lower.includes('recomienda') || lower.includes('moviendo ahora')) {
    return normalized;
  }

  if (lower.startsWith('porque')) {
    return normalized;
  }

  return `Porque ${lower.charAt(0)}${lower.slice(1)}`;
};

const CommentsModal = ({ visible, review, onClose, onViewProfile, onAddComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleSendComment = () => {
    if (!newComment.trim() || !review) return;
    void triggerSelectionFeedback();
    onAddComment(review.id, newComment);
    setNewComment('');
  };

  const canSendComment = Boolean(newComment.trim());

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Comentarios</Text>
              <Text style={styles.modalSubtitle}>{review?.albumTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color="white" size={22} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={review?.comments || []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.commentsContent}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Todavía no hay comentarios.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onViewProfile(item.user);
                  }}>
                  <Text style={styles.commentUser}>{item.user}</Text>
                </TouchableOpacity>
                <Text style={styles.commentText}>{item.text}</Text>
              </View>
            )}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Escribí un comentario..."
              placeholderTextColor="#666"
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !canSendComment && styles.sendBtnDisabled]}
              onPress={handleSendComment}
              disabled={!canSendComment}>
              <Send color="white" size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const DayCard = React.memo(({
  currentTrack,
  latestListen,
  listeningStreak,
  dailyMusicSummary,
  onOpenReviewWhileListening,
  onSelectAlbum,
}) => {
  const artwork =
    currentTrack?.cover || dailyMusicSummary?.latestEntry?.cover || latestListen?.cover || '';
  const title =
    dailyMusicSummary?.headline || currentTrack?.title || latestListen?.title || 'Tu día musical';
  const artist = dailyMusicSummary?.topArtist
    ? `Artista del día: ${dailyMusicSummary.topArtist}`
    : currentTrack?.artist || latestListen?.artist || 'Todavía no hay un artista dominante.';
  const hasAction = Boolean(currentTrack || latestListen);
  const heroLine =
    dailyMusicSummary?.moodCopy ||
    (currentTrack
      ? 'Tu semana ya está sonando. Aprovechá el envión.'
      : latestListen
        ? 'Tenés algo fresco para retomar sin pensar demasiado.'
        : 'Arrancá con una escucha y esta parte se vuelve el centro de la app.');

  return (
    <View style={[styles.panel, styles.heroPanel]}>
      <View style={styles.heroGlowLarge} />
      <View style={styles.heroGlowSmall} />

      <View style={styles.heroHeaderRow}>
        <View style={styles.heroBadge}>
          <Sparkles color="#FDE68A" size={13} />
          <Text style={styles.heroBadgeText}>TU DÍA MUSICAL</Text>
        </View>
        <Text style={styles.heroHint}>
          {dailyMusicSummary?.tracksToday
            ? `${dailyMusicSummary.tracksToday} tracks hoy`
            : listeningStreak?.current
              ? `${listeningStreak.current} días arriba`
              : 'Tu radar espera señal'}
        </Text>
      </View>

      <View style={styles.heroBodyRow}>
        <SafeArtwork
          uri={artwork}
          style={styles.heroArtwork}
          variant="track"
          label="Sin portada"
        />
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroArtist}>{artist}</Text>
          <Text style={styles.heroText}>{heroLine}</Text>
          <Text style={styles.heroMicroReward}>
            {dailyMusicSummary?.welcomeCopy || 'Tu semana ya empezó 🎧'}
          </Text>
        </View>
      </View>

      <View style={styles.heroStatRow}>
        <View style={styles.heroStatPill}>
          <Headphones color="#C4B5FD" size={15} />
          <Text style={styles.heroStatValue}>
            {dailyMusicSummary?.tracksToday || 0} plays hoy
          </Text>
        </View>
        <View style={styles.heroStatPill}>
          <Sparkles color="#FDE68A" size={15} />
          <Text style={styles.heroStatValue}>
            Modo {dailyMusicSummary?.moodLabel || 'libre'}
          </Text>
        </View>
        <View style={[styles.heroStatPill, listeningStreak?.isAtRisk && styles.heroStatPillWarn]}>
          <Flame color={listeningStreak?.isAtRisk ? '#FCA5A5' : '#FDBA74'} size={15} />
          <Text style={styles.heroStatValue}>
            {listeningStreak?.current
              ? `${listeningStreak.current} días`
              : listeningStreak?.isAtRisk
                ? 'En riesgo'
                : 'Sin racha'}
          </Text>
        </View>
      </View>

      <View style={styles.heroInsightStrip}>
        <Text style={styles.heroInsightText}>
          {dailyMusicSummary?.activityLine || 'Tu próxima escucha puede cambiar el tono del día.'}
        </Text>
        <Text style={styles.heroInsightMeta}>
          {dailyMusicSummary?.comparisonCopy || 'Más activo que el 60%'}
        </Text>
      </View>

      <View style={styles.heroActionRow}>
        <TouchableOpacity
          style={[styles.heroPrimaryButton, !hasAction && styles.disabledButton]}
          disabled={!hasAction}
          onPress={
            currentTrack
              ? onOpenReviewWhileListening
              : latestListen
                ? () => onSelectAlbum(latestListen)
                : undefined
          }>
          <Text style={styles.heroPrimaryButtonText}>
            {currentTrack ? 'Dejar reseña al vuelo' : 'Retomar esta ficha'}
          </Text>
        </TouchableOpacity>
        {hasAction ? (
          <TouchableOpacity
            style={styles.heroSecondaryButton}
            onPress={() => onSelectAlbum(currentTrack || latestListen)}>
            <Text style={styles.heroSecondaryButtonText}>Ver detalle</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
});

const ProgressCard = React.memo(({ achievementSummary, latestAchievementUnlock, onOpenProfile }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const previousLevelRef = useRef(achievementSummary?.level || 1);
  const [levelUpMessage, setLevelUpMessage] = useState('');

  useEffect(() => {
    if (!latestAchievementUnlock) return undefined;
    const animation = Animated.sequence([
      Animated.timing(scale, { toValue: 1.02, duration: 170, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [latestAchievementUnlock, scale]);

  useEffect(() => {
    const nextLevel = achievementSummary?.level || 1;
    if (nextLevel > previousLevelRef.current) {
      setLevelUpMessage('Subiste de nivel 🔥');
    }
    previousLevelRef.current = nextLevel;
  }, [achievementSummary?.level]);

  useEffect(() => {
    if (!levelUpMessage) return undefined;
    const timer = setTimeout(() => setLevelUpMessage(''), 2600);
    return () => clearTimeout(timer);
  }, [levelUpMessage]);

  if (!achievementSummary) return null;

  return (
    <Animated.View style={[styles.panel, { transform: [{ scale }] }]}>
      {levelUpMessage ? (
        <View style={styles.levelUpBanner}>
          <Sparkles color="#FDE68A" size={15} />
          <Text style={styles.levelUpBannerText}>{levelUpMessage}</Text>
        </View>
      ) : null}

      {latestAchievementUnlock ? (
        <View style={styles.unlockBanner}>
          <Sparkles color="#FDE68A" size={15} />
          <Text style={styles.unlockBannerText}>
            Destrabaste algo nuevo 🔥 {latestAchievementUnlock.title}
          </Text>
        </View>
      ) : null}

      <View style={styles.rowBetween}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.kicker}>PROGRESO / LOGROS</Text>
          <Text style={styles.panelTitle}>{achievementSummary.levelHeadline}</Text>
          <Text style={styles.panelText}>{achievementSummary.momentumCopy}</Text>
          <Text style={styles.panelAccentText}>{achievementSummary.comparisonCopy}</Text>
        </View>
        <View style={styles.levelChip}>
          <Trophy color="#FDE68A" size={14} />
          <Text style={styles.levelChipText}>
            {achievementSummary.unlockedCount}/{achievementSummary.totalCount}
          </Text>
        </View>
      </View>

      <View style={styles.rowBetween}>
        <Text style={styles.mutedSmall}>Camino al siguiente nivel</Text>
        <Text style={styles.mutedSmall}>
          {achievementSummary.nextLevelRemaining > 0
            ? `${achievementSummary.nextLevelRemaining} pts`
            : 'Completado'}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.max(
                10,
                Math.round((achievementSummary.nextLevelProgress || 0) * 100)
              )}%`,
            },
          ]}
        />
      </View>

      {achievementSummary.nextAchievement ? (
        <View style={styles.goalCard}>
          <Text style={styles.goalKicker}>LO QUE VIENE</Text>
          <Text style={styles.goalTitle}>{achievementSummary.nextAchievement.title}</Text>
          <Text style={styles.goalText}>{achievementSummary.nextAchievement.progressLabel}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.secondaryButtonWide} onPress={onOpenProfile}>
        <Text style={styles.secondaryButtonText}>Ver progreso completo</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const RecommendationCard = React.memo(({ album, onSelectAlbum, onPlaySong }) => (
  <TouchableOpacity
    style={styles.recommendationCard}
    activeOpacity={0.9}
    onPress={() => onSelectAlbum(album)}>
    <SafeArtwork
      uri={album.cover}
      style={styles.recommendationCover}
      variant="album"
      label="Sin portada"
      showLabel={true}
    />
    <Text style={styles.recommendationTitle} numberOfLines={1}>
      {album.title}
    </Text>
    <Text style={styles.recommendationArtist} numberOfLines={1}>
      {album.artist}
    </Text>
    <Text style={styles.recommendationEyebrow}>POR QUÉ APARECE</Text>
    <Text style={styles.recommendationReason} numberOfLines={2}>
      {formatRecommendationContext(album.reason)}
    </Text>
    <TouchableOpacity
      style={styles.primaryButtonSmall}
      activeOpacity={0.86}
      onPress={() => {
        void triggerSelectionFeedback();
        onPlaySong?.(album);
      }}>
      <Text style={styles.primaryButtonText}>
        {album.previewUrl ? 'Escuchar ahora' : 'Ver ficha'}
      </Text>
    </TouchableOpacity>
  </TouchableOpacity>
));

const ProInsightsCard = React.memo(
  ({ currentPlan = 'free', dailyMusicSummary, achievementSummary, onOpenPlans, onOpenProfile }) => {
    const isPro = currentPlan === 'plus';

    if (isPro) {
      return (
        <View style={[styles.panel, styles.proPanel, styles.proUnlockedPanel]}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.kicker}>B-SIDE PRO</Text>
              <Text style={styles.panelTitle}>Tus insights del día</Text>
              <Text style={styles.panelText}>{dailyMusicSummary?.proInsightLine}</Text>
            </View>
            <View style={[styles.levelChip, styles.proBadge]}>
              <Crown color="#FDE68A" size={14} />
              <Text style={styles.levelChipText}>Activo</Text>
            </View>
          </View>

          <View style={styles.proStatGrid}>
            <View style={styles.proStatCard}>
              <Text style={styles.proStatLabel}>Pico</Text>
              <Text style={styles.proStatValue}>{dailyMusicSummary?.dayWindowLabel || '—'}</Text>
            </View>
            <View style={styles.proStatCard}>
              <Text style={styles.proStatLabel}>Fuente</Text>
              <Text style={styles.proStatValue}>{dailyMusicSummary?.dominantSource || 'B-Side'}</Text>
            </View>
            <View style={styles.proStatCard}>
              <Text style={styles.proStatLabel}>Escena</Text>
              <Text style={styles.proStatValue}>{achievementSummary?.comparisonCopy || 'En movimiento'}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.secondaryButtonWide} onPress={onOpenProfile}>
            <Text style={styles.secondaryButtonText}>Ver más stats</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.panel, styles.proPanel]}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.kicker}>B-SIDE PRO</Text>
            <Text style={styles.panelTitle}>Desbloqueá tu lado más fino</Text>
            <Text style={styles.panelText}>
              Stats avanzados, comparativas detalladas e insights de escucha en un solo lugar.
            </Text>
          </View>
          <View style={[styles.levelChip, styles.proBadge]}>
            <LockKeyhole color="#FDE68A" size={14} />
            <Text style={styles.levelChipText}>Pro</Text>
          </View>
        </View>

        <View style={styles.proTeaserRow}>
          <View style={styles.proTeaserPill}>
            <Text style={styles.proTeaserText}>Pico del día</Text>
          </View>
          <View style={styles.proTeaserPill}>
            <Text style={styles.proTeaserText}>Comparativas reales</Text>
          </View>
          <View style={styles.proTeaserPill}>
            <Text style={styles.proTeaserText}>Perfil más tuyo</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButtonWide} onPress={onOpenPlans}>
          <Text style={styles.primaryButtonText}>Desbloquear con B-Side Pro</Text>
        </TouchableOpacity>
      </View>
    );
  }
);

const FriendActivityCard = React.memo(({ review, onViewProfile }) => (
  <TouchableOpacity style={styles.friendCard} onPress={() => onViewProfile(review.user)}>
    <View style={styles.rowBetween}>
      <View>
        <Text style={styles.friendHandle}>{review.user}</Text>
        <Text style={styles.friendMeta}>
          {review.profile?.followersCount || 0} seguidores
        </Text>
      </View>
      <View style={styles.scorePill}>
        <Text style={styles.scorePillText}>{review.rating}/5</Text>
      </View>
    </View>
    <View style={styles.row}>
      <SafeArtwork uri={review.cover} style={styles.friendCover} variant="album" />
      <View style={{ flex: 1 }}>
        <Text style={styles.friendTitle} numberOfLines={1}>
          {review.albumTitle}
        </Text>
        <Text style={styles.friendMeta} numberOfLines={1}>
          {review.artist}
        </Text>
      </View>
    </View>
    <Text style={styles.friendQuote} numberOfLines={3}>
      "{review.text}"
    </Text>
  </TouchableOpacity>
));

const FeedItem = React.memo(({
  review,
  currentUserHandle,
  onDeleteReview,
  onViewProfile,
  onToggleScratch,
  onToggleLikeReview,
  onAddReviewComment,
}) => {
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const isScratched = review.scratchedBy === currentUserHandle;
  const isLiked = review.likedBy.includes(currentUserHandle);
  const scratchScale = useRef(new Animated.Value(1)).current;
  const likeScale = useRef(new Animated.Value(1)).current;
  const commentScale = useRef(new Animated.Value(1)).current;
  const commentPreview = useMemo(
    () => review.comments[review.comments.length - 1],
    [review.comments]
  );

  const pulseAction = (animatedValue, callback) => {
    void triggerSelectionFeedback();
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.08,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(animatedValue, {
        toValue: 1,
        speed: 18,
        bounciness: 10,
        useNativeDriver: true,
      }),
    ]).start();
    callback?.();
  };

  return (
    <View style={styles.feedCard}>
      {review.contextType === 'while-listening' ? (
        <View style={styles.inlineRow}>
          <Headphones color="#A855F7" size={14} />
          <Text style={styles.inlineKicker}>Mientras suena</Text>
        </View>
      ) : null}

      <View style={styles.rowBetween}>
        <TouchableOpacity onPress={() => onViewProfile(review.user)}>
          <Text style={styles.reviewUser}>{review.user}</Text>
        </TouchableOpacity>
        {review.user === currentUserHandle ? (
          <TouchableOpacity onPress={() => onDeleteReview(review.id)}>
            <Trash2 color="#FF3B30" size={16} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.row}>
        <SafeArtwork uri={review.cover} style={styles.feedCover} variant="album" />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.feedTitle} numberOfLines={1}>{review.albumTitle}</Text>
          <Text style={styles.feedArtist} numberOfLines={1}>{review.artist}</Text>
          <Text style={styles.feedRating}>{review.rating}/5</Text>
        </View>
      </View>

      <Text style={styles.feedBody}>{review.text}</Text>

      {commentPreview ? (
        <View style={styles.commentPreviewCard}>
          <MessageCircle color="#A855F7" size={18} />
          <Text style={styles.commentPreviewText}>
            <Text style={styles.commentPreviewAuthor}>{commentPreview.user}: </Text>
            {commentPreview.text}
          </Text>
        </View>
      ) : null}

      <View style={styles.footerRow}>
        <Animated.View style={{ transform: [{ scale: scratchScale }] }}>
          <TouchableOpacity
            style={[styles.iconAction, isScratched && styles.iconActionActive]}
            activeOpacity={0.82}
            onPress={() => pulseAction(scratchScale, () => onToggleScratch(review.id))}>
            <Disc color={isScratched ? '#A855F7' : '#9CA3AF'} size={18} />
            <Text style={[styles.iconActionText, isScratched && styles.accentText]}>
              {isScratched ? 1 : review.scratchCount || 0}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: likeScale }] }}>
          <TouchableOpacity
            style={[styles.iconAction, isLiked && styles.iconActionDanger]}
            activeOpacity={0.82}
            onPress={() => pulseAction(likeScale, () => onToggleLikeReview(review.id))}>
            <Heart
              color={isLiked ? '#FF3B30' : '#9CA3AF'}
              size={18}
              fill={isLiked ? '#FF3B30' : 'transparent'}
            />
            <Text style={[styles.iconActionText, isLiked && styles.errorText]}>
              {review.likesCount ?? review.likedBy.length}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: commentScale }] }}>
          <TouchableOpacity
            style={styles.iconAction}
            activeOpacity={0.82}
            onPress={() => pulseAction(commentScale, () => setIsCommentsVisible(true))}>
            <MessageCircle color="#9CA3AF" size={18} />
            <Text style={styles.iconActionText}>
              {review.commentsCount ?? review.comments.length}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <CommentsModal
        visible={isCommentsVisible}
        review={review}
        onClose={() => setIsCommentsVisible(false)}
        onViewProfile={onViewProfile}
        onAddComment={onAddReviewComment}
      />
    </View>
  );
});

const FeedScreen = ({
  reviews,
  currentUserHandle,
  currentTrack,
  friendActivity,
  listeningStreak,
  dailyMusicSummary,
  recentListening = [],
  achievementSummary,
  latestAchievementUnlock,
  interestingAlbums = [],
  currentPlan = 'free',
  hasUnreadMessages,
  hasUnreadNotifications,
  onDeleteReview,
  onViewProfile,
  onToggleScratch,
  onToggleLikeReview,
  onAddReviewComment,
  onOpenInbox,
  onOpenNotifications,
  onOpenPlans,
  onOpenReviewWhileListening,
  onSelectAlbum,
  onPlaySong,
}) => {
  const latestListen = recentListening[0] || null;
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.headerRow,
          {
            paddingTop:
              Platform.OS === 'android'
                ? Math.max(insets.top + 16, 60)
                : Math.max(insets.top + 12, 42),
          },
        ]}>
        <View>
          <Text style={styles.headerEyebrow}>VOLVÉS A TU RITMO</Text>
          <Text style={styles.headerTitle}>Tu día musical</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIcon} onPress={onOpenNotifications}>
            <Bell color="white" size={22} />
            {hasUnreadNotifications ? <View style={styles.notificationDot} /> : null}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={onOpenInbox}>
            <Send color="white" size={22} />
            {hasUnreadMessages ? <View style={styles.notificationDot} /> : null}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={8}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 108, 126) },
        ]}
        ListHeaderComponent={
          <>
            <DayCard
              currentTrack={currentTrack}
              latestListen={latestListen}
              listeningStreak={listeningStreak}
              dailyMusicSummary={dailyMusicSummary}
              onOpenReviewWhileListening={onOpenReviewWhileListening}
              onSelectAlbum={onSelectAlbum}
            />

            <View style={styles.block}>
              <SectionLabel
                eyebrow="PROGRESO / LOGROS"
                title="Tu avance viene sonando"
                subtitle="Cada escucha y cada reseña empujan algo real."
                secondary={true}
              />
              <ProgressCard
                achievementSummary={achievementSummary}
                latestAchievementUnlock={latestAchievementUnlock}
                onOpenProfile={() => onViewProfile(currentUserHandle)}
              />
            </View>

            <View style={styles.block}>
              <SectionLabel
                eyebrow="INSIGHTS / PRO"
                title={currentPlan === 'plus' ? 'Tu capa más fina' : 'Llevá tu identidad más lejos'}
                subtitle={
                  currentPlan === 'plus'
                    ? 'Tu escucha ya deja patrones claros.'
                    : 'Hay una capa más profunda lista para destrabarse.'
                }
                secondary={true}
              />
              <ProInsightsCard
                currentPlan={currentPlan}
                dailyMusicSummary={dailyMusicSummary}
                achievementSummary={achievementSummary}
                onOpenPlans={onOpenPlans}
                onOpenProfile={() => onViewProfile(currentUserHandle)}
              />
            </View>

            <View style={styles.block}>
              <SectionLabel
                eyebrow="SEGUÍ ESCUCHANDO"
                title="Esto te puede enganchar"
                subtitle="Recomendaciones con contexto, no al azar."
                secondary={true}
              />
              {interestingAlbums.length ? (
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                  {interestingAlbums.slice(0, 6).map((album) => (
                    <RecommendationCard
                      key={`${album.id}-${album.title}`}
                      album={album}
                      onSelectAlbum={onSelectAlbum}
                      onPlaySong={onPlaySong}
                    />
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Tu radar todavía se está armando</Text>
                  <Text style={styles.emptyText}>
                    Con algunas reseñas, listas y escuchas más, esta parte se vuelve mucho más personal.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.block}>
              <SectionLabel
                eyebrow="ÚLTIMA ACTIVIDAD"
                title="Lo último de tu círculo"
                subtitle="Primero la gente que más te mueve."
                secondary={true}
              />
              {friendActivity.length ? (
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                  {friendActivity.map((review) => (
                    <FriendActivityCard
                      key={review.id}
                      review={review}
                      onViewProfile={onViewProfile}
                    />
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Todavía no se movió tu círculo</Text>
                  <Text style={styles.emptyText}>
                    Cuando la gente que seguís publique algo, aparece primero acá.
                  </Text>
                </View>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Todavía está todo tranquilo</Text>
            <Text style={styles.emptyText}>
              Seguí algunos perfiles o dejá tu primera reseña para que esto empiece a moverse.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <FeedItem
            review={item}
            currentUserHandle={currentUserHandle}
            onDeleteReview={onDeleteReview}
            onViewProfile={onViewProfile}
            onToggleScratch={onToggleScratch}
            onToggleLikeReview={onToggleLikeReview}
            onAddReviewComment={onAddReviewComment}
          />
        )}
        ListFooterComponent={<View style={{ height: 120 }} />}
      />
    </View>
  );
};

const baseCard = {
  borderRadius: 24,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.07)',
  backgroundColor: 'rgba(7, 10, 18, 0.78)',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  headerRow: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 60 : 42,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerEyebrow: { color: '#C4B5FD', fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  headerTitle: { color: 'white', fontSize: 30, fontWeight: '900', marginTop: 6 },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: 'rgba(9, 12, 20, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#111827',
  },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  block: { marginTop: 26 },
  sectionLabel: { marginBottom: 14 },
  sectionLabelSecondary: { marginBottom: 10 },
  sectionEyebrow: { color: '#A78BFA', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  sectionEyebrowSecondary: { color: '#8B7ABF' },
  sectionTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginTop: 6 },
  sectionTitleSecondary: { fontSize: 20 },
  sectionSubtitle: { color: '#9CA3AF', marginTop: 6, lineHeight: 20 },
  sectionSubtitleSecondary: { color: '#7C8597' },
  panel: { ...baseCard, padding: 18, gap: 14 },
  heroPanel: {
    overflow: 'hidden',
    padding: 22,
    gap: 18,
    backgroundColor: '#0B0F1E',
    borderColor: 'rgba(168,85,247,0.22)',
    shadowColor: '#8A2BE2',
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
  },
  heroGlowLarge: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(138,43,226,0.18)',
    top: -120,
    right: -40,
  },
  heroGlowSmall: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(59,130,246,0.1)',
    bottom: -70,
    left: -40,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(19, 10, 36, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.2)',
  },
  heroBadgeText: { color: '#F5E8FF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  heroHint: { color: '#C4B5FD', fontSize: 12, fontWeight: '700' },
  heroBodyRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroArtwork: {
    width: 84,
    height: 84,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroPlaceholder: {
    backgroundColor: 'rgba(18, 24, 42, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCopy: { flex: 1, gap: 6 },
  heroTitle: { color: 'white', fontSize: 28, fontWeight: '900', lineHeight: 30 },
  heroArtist: { color: '#C4B5FD', fontSize: 15, fontWeight: '800' },
  heroText: { color: '#E5E7EB', lineHeight: 21, fontSize: 14 },
  heroMicroReward: { color: '#FDE68A', fontSize: 12, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  artwork: { width: 56, height: 56, borderRadius: 16 },
  placeholder: { backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  kicker: { color: '#C4B5FD', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  panelTitle: { color: 'white', fontSize: 18, fontWeight: '900' },
  panelText: { color: '#D1D5DB', lineHeight: 20 },
  panelAccentText: { color: '#FDE68A', fontSize: 12, fontWeight: '700' },
  statRow: { flexDirection: 'row', gap: 10 },
  heroStatRow: { flexDirection: 'row', gap: 10 },
  statPill: {
    flex: 1,
    minHeight: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  warnPill: { backgroundColor: 'rgba(69,10,10,0.3)', borderColor: 'rgba(248,113,113,0.2)' },
  statValue: { color: 'white', fontSize: 13, fontWeight: '800' },
  heroStatPill: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  heroStatPillWarn: {
    backgroundColor: 'rgba(69,10,10,0.34)',
    borderColor: 'rgba(248,113,113,0.22)',
  },
  heroStatValue: { color: 'white', fontSize: 13, fontWeight: '900' },
  heroInsightStrip: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  heroInsightText: { color: '#F3F4F6', fontSize: 13, fontWeight: '700' },
  heroInsightMeta: { color: '#C4B5FD', fontSize: 12, fontWeight: '800' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  heroActionRow: { flexDirection: 'row', gap: 10 },
  primaryButton: {
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonSmall: {
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: { color: 'white', fontSize: 13, fontWeight: '800' },
  heroPrimaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#9D3CFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  heroPrimaryButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonWide: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.22)',
    backgroundColor: 'rgba(168,85,247,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#E5E7EB', fontSize: 13, fontWeight: '800' },
  primaryButtonWide: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#9D3CFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSecondaryButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(233,213,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  heroSecondaryButtonText: { color: '#F5E8FF', fontSize: 13, fontWeight: '800' },
  disabledButton: { opacity: 0.55 },
  unlockBanner: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(250,204,21,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unlockBannerText: { color: '#FDE68A', fontSize: 13, fontWeight: '800', flex: 1 },
  levelUpBanner: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(168,85,247,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.24)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelUpBannerText: { color: '#F5E8FF', fontSize: 13, fontWeight: '800', flex: 1 },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(250,204,21,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.18)',
  },
  levelChipText: { color: '#FDE68A', fontSize: 12, fontWeight: '800' },
  mutedSmall: { color: '#9CA3AF', fontSize: 12, fontWeight: '700' },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#8A2BE2' },
  goalCard: {
    borderRadius: 18,
    padding: 14,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  goalKicker: { color: '#A78BFA', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  goalTitle: { color: 'white', fontSize: 15, fontWeight: '900' },
  goalText: { color: '#D1D5DB', lineHeight: 19 },
  proPanel: {
    gap: 14,
    borderColor: 'rgba(168,85,247,0.24)',
    backgroundColor: 'rgba(11, 15, 30, 0.88)',
  },
  proUnlockedPanel: {
    backgroundColor: 'rgba(16, 20, 38, 0.9)',
  },
  proBadge: {
    backgroundColor: 'rgba(250,204,21,0.12)',
    borderColor: 'rgba(250,204,21,0.28)',
  },
  proStatGrid: {
    gap: 10,
  },
  proStatCard: {
    borderRadius: 16,
    padding: 14,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  proStatLabel: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  proStatValue: {
    color: 'white',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  proTeaserRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  proTeaserPill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  proTeaserText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '800',
  },
  recommendationCard: { ...baseCard, width: 206, padding: 14, gap: 10, marginRight: 14 },
  recommendationCover: { width: '100%', height: 150, borderRadius: 18 },
  recommendationTitle: { color: 'white', fontSize: 16, fontWeight: '900' },
  recommendationArtist: { color: '#C4B5FD', fontSize: 13, fontWeight: '700' },
  recommendationEyebrow: { color: '#FDE68A', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  recommendationReason: { color: '#D1D5DB', lineHeight: 19, minHeight: 38 },
  emptyCard: { ...baseCard, padding: 18, gap: 8 },
  emptyTitle: { color: 'white', fontSize: 18, fontWeight: '900' },
  emptyText: { color: '#9CA3AF', lineHeight: 21 },
  friendCard: { ...baseCard, width: 228, padding: 14, gap: 10, marginRight: 14 },
  friendHandle: { color: 'white', fontWeight: '900', fontSize: 15 },
  friendMeta: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
  scorePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(251,191,36,0.12)' },
  scorePillText: { color: '#FBBF24', fontWeight: '800', fontSize: 12 },
  friendCover: { width: 52, height: 52, borderRadius: 14 },
  friendTitle: { color: 'white', fontWeight: '800', fontSize: 15 },
  friendQuote: { color: '#E5E7EB', lineHeight: 19, fontSize: 13 },
  feedCard: { ...baseCard, padding: 18, marginTop: 18 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  inlineKicker: { color: '#C4B5FD', fontSize: 12, fontWeight: '800' },
  reviewUser: { color: '#C4B5FD', fontWeight: '800', fontSize: 15 },
  feedCover: { width: 62, height: 62, borderRadius: 14, marginRight: 15 },
  cdText: { color: '#6B7280', fontWeight: '700' },
  feedTitle: { color: 'white', fontWeight: '800', fontSize: 18 },
  feedArtist: { color: '#9CA3AF', fontSize: 13 },
  feedRating: { color: '#FBBF24', fontWeight: '700' },
  feedBody: { color: '#E5E7EB', fontStyle: 'italic', lineHeight: 22, fontSize: 15, marginTop: 10 },
  commentPreviewCard: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    flexDirection: 'row',
    gap: 10,
  },
  commentPreviewText: { flex: 1, color: '#D1D5DB', lineHeight: 19 },
  commentPreviewAuthor: { color: '#C4B5FD', fontWeight: '800' },
  footerRow: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 30,
  },
  iconAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  iconActionActive: {
    backgroundColor: 'rgba(168,85,247,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.18)',
  },
  iconActionDanger: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.18)',
  },
  iconActionText: { color: '#9CA3AF', fontSize: 14, fontWeight: '700' },
  accentText: { color: '#A855F7' },
  errorText: { color: '#FF3B30' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalContent: {
    height: '64%',
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: '800' },
  modalSubtitle: { color: '#A855F7', fontSize: 14, marginTop: 4 },
  commentsContent: { padding: 20, gap: 12, paddingBottom: 110 },
  commentItem: { backgroundColor: '#111827', padding: 15, borderRadius: 16, gap: 6 },
  commentUser: { color: '#C4B5FD', fontWeight: '800' },
  commentText: { color: '#E5E7EB', fontSize: 15, lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    backgroundColor: '#0A0A0A',
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#111827',
    color: 'white',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  sendBtn: {
    backgroundColor: '#8A2BE2',
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
});

export default FeedScreen;

