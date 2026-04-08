import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
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
  Disc,
  Flame,
  Headphones,
  Heart,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from 'lucide-react-native';

const SectionLabel = ({ eyebrow, title, subtitle }) => (
  <View style={styles.sectionLabel}>
    <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
  </View>
);

const CommentsModal = ({ visible, review, onClose, onViewProfile, onAddComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleSendComment = () => {
    if (!newComment.trim() || !review) return;
    onAddComment(review.id, newComment);
    setNewComment('');
  };

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
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendComment}>
              <Send color="white" size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const WeekCard = ({ currentTrack, latestListen, listeningStreak, onOpenReviewWhileListening, onSelectAlbum }) => {
  const artwork = currentTrack?.cover || latestListen?.cover || '';
  const title = currentTrack?.title || latestListen?.title || 'Todavía no arrancó tu semana';
  const artist =
    currentTrack?.artist || latestListen?.artist || 'Cuando escuches algo, te lo dejamos bien a mano.';
  const hasAction = Boolean(currentTrack || latestListen);

  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        {artwork ? (
          <Image source={{ uri: artwork }} style={styles.artwork} />
        ) : (
          <View style={[styles.artwork, styles.placeholder]}>
            <Headphones color="#A855F7" size={18} />
          </View>
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.kicker}>TU SEMANA MUSICAL</Text>
          <Text style={styles.panelTitle}>{title}</Text>
          <Text style={styles.panelText}>{artist}</Text>
        </View>
      </View>

      <View style={styles.statRow}>
        <View style={[styles.statPill, listeningStreak?.isAtRisk && styles.warnPill]}>
          <Flame color={listeningStreak?.isAtRisk ? '#FCA5A5' : '#FDBA74'} size={15} />
          <Text style={styles.statValue}>
            {listeningStreak?.current
              ? `${listeningStreak.current} días`
              : listeningStreak?.isAtRisk
                ? 'En riesgo'
                : 'Sin racha'}
          </Text>
        </View>
        <View style={styles.statPill}>
          <Headphones color="#C4B5FD" size={15} />
          <Text style={styles.statValue}>
            {listeningStreak?.last7DaysCount || 0} escuchas
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.primaryButton, !hasAction && styles.disabledButton]}
          disabled={!hasAction}
          onPress={
            currentTrack
              ? onOpenReviewWhileListening
              : latestListen
                ? () => onSelectAlbum(latestListen)
                : undefined
          }>
          <Text style={styles.primaryButtonText}>
            {currentTrack ? 'Reseñar ahora' : 'Abrir última ficha'}
          </Text>
        </TouchableOpacity>
        {hasAction ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => onSelectAlbum(currentTrack || latestListen)}>
            <Text style={styles.secondaryButtonText}>Ver ficha</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const ProgressCard = ({ achievementSummary, latestAchievementUnlock, onOpenProfile }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!latestAchievementUnlock) return undefined;
    const animation = Animated.sequence([
      Animated.timing(scale, { toValue: 1.02, duration: 170, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [latestAchievementUnlock, scale]);

  if (!achievementSummary) return null;

  return (
    <Animated.View style={[styles.panel, { transform: [{ scale }] }]}>
      {latestAchievementUnlock ? (
        <View style={styles.unlockBanner}>
          <Sparkles color="#FDE68A" size={15} />
          <Text style={styles.unlockBannerText}>
            Nuevo logro: {latestAchievementUnlock.title}
          </Text>
        </View>
      ) : null}

      <View style={styles.rowBetween}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.kicker}>PROGRESO / LOGROS</Text>
          <Text style={styles.panelTitle}>
            Nivel {achievementSummary.level} · {achievementSummary.levelTitle}
          </Text>
          <Text style={styles.panelText}>{achievementSummary.momentumCopy}</Text>
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
          <Text style={styles.goalKicker}>SIGUIENTE OBJETIVO</Text>
          <Text style={styles.goalTitle}>{achievementSummary.nextAchievement.title}</Text>
          <Text style={styles.goalText}>{achievementSummary.nextAchievement.progressLabel}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.secondaryButtonWide} onPress={onOpenProfile}>
        <Text style={styles.secondaryButtonText}>Ver progreso completo</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const RecommendationCard = ({ album, onSelectAlbum, onPlaySong }) => (
  <TouchableOpacity
    style={styles.recommendationCard}
    activeOpacity={0.9}
    onPress={() => onSelectAlbum(album)}>
    {album.cover ? (
      <Image source={{ uri: album.cover }} style={styles.recommendationCover} />
    ) : (
      <View style={[styles.recommendationCover, styles.placeholder]}>
        <Disc color="#C4B5FD" size={18} />
      </View>
    )}
    <Text style={styles.recommendationTitle} numberOfLines={1}>
      {album.title}
    </Text>
    <Text style={styles.recommendationArtist} numberOfLines={1}>
      {album.artist}
    </Text>
    <Text style={styles.recommendationReason} numberOfLines={2}>
      {album.reason}
    </Text>
    <TouchableOpacity style={styles.primaryButtonSmall} onPress={() => onPlaySong?.(album)}>
      <Text style={styles.primaryButtonText}>
        {album.previewUrl ? 'Escuchar muestra' : 'Abrir ficha'}
      </Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

const FriendActivityCard = ({ review, onViewProfile }) => (
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
      {review.cover ? (
        <Image source={{ uri: review.cover }} style={styles.friendCover} />
      ) : (
        <View style={[styles.friendCover, styles.placeholder]}>
          <Disc color="#A855F7" size={16} />
        </View>
      )}
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
);

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
  const commentPreview = useMemo(
    () => review.comments[review.comments.length - 1],
    [review.comments]
  );

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
        {review.cover ? (
          <Image source={{ uri: review.cover }} style={styles.feedCover} />
        ) : (
          <View style={[styles.feedCover, styles.placeholder]}>
            <Text style={styles.cdText}>CD</Text>
          </View>
        )}
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
        <TouchableOpacity style={styles.iconAction} onPress={() => onToggleScratch(review.id)}>
          <Disc color={isScratched ? '#A855F7' : '#9CA3AF'} size={18} />
          <Text style={[styles.iconActionText, isScratched && styles.accentText]}>
            {review.scratchCount || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconAction} onPress={() => onToggleLikeReview(review.id)}>
          <Heart
            color={isLiked ? '#FF3B30' : '#9CA3AF'}
            size={18}
            fill={isLiked ? '#FF3B30' : 'transparent'}
          />
          <Text style={[styles.iconActionText, isLiked && styles.errorText]}>
            {review.likesCount || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconAction} onPress={() => setIsCommentsVisible(true)}>
          <MessageCircle color="#9CA3AF" size={18} />
          <Text style={styles.iconActionText}>{review.comments.length}</Text>
        </TouchableOpacity>
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
  recentListening = [],
  achievementSummary,
  latestAchievementUnlock,
  interestingAlbums = [],
  hasUnreadMessages,
  hasUnreadNotifications,
  onDeleteReview,
  onViewProfile,
  onToggleScratch,
  onToggleLikeReview,
  onAddReviewComment,
  onOpenInbox,
  onOpenNotifications,
  onOpenReviewWhileListening,
  onSelectAlbum,
  onPlaySong,
}) => {
  const latestListen = recentListening[0] || null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerEyebrow}>INICIO B-SIDE</Text>
          <Text style={styles.headerTitle}>Tu espacio musical</Text>
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
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <WeekCard
              currentTrack={currentTrack}
              latestListen={latestListen}
              listeningStreak={listeningStreak}
              onOpenReviewWhileListening={onOpenReviewWhileListening}
              onSelectAlbum={onSelectAlbum}
            />

            <View style={styles.block}>
              <SectionLabel
                eyebrow="PROGRESO / LOGROS"
                title="Cómo viene tu lado B"
                subtitle="Cada escucha, lista y reseña suma algo visible."
              />
              <ProgressCard
                achievementSummary={achievementSummary}
                latestAchievementUnlock={latestAchievementUnlock}
                onOpenProfile={() => onViewProfile(currentUserHandle)}
              />
            </View>

            <View style={styles.block}>
              <SectionLabel
                eyebrow="RECOMENDACIONES"
                title="No te quedes en loop"
                subtitle="Una tanda corta para salir a descubrir sin perder tu eje."
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
                title="Lo que se está moviendo ahora"
                subtitle="Primero tu círculo; abajo, el pulso completo de la comunidad."
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
            <Text style={styles.emptyTitle}>Tu home todavía está tranquila</Text>
            <Text style={styles.emptyText}>
              Empezá a seguir perfiles o dejá tu primera reseña para activar el movimiento.
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
  sectionEyebrow: { color: '#A78BFA', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  sectionTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginTop: 6 },
  sectionSubtitle: { color: '#9CA3AF', marginTop: 6, lineHeight: 20 },
  panel: { ...baseCard, padding: 18, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  artwork: { width: 56, height: 56, borderRadius: 16 },
  placeholder: { backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  kicker: { color: '#C4B5FD', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  panelTitle: { color: 'white', fontSize: 18, fontWeight: '900' },
  panelText: { color: '#D1D5DB', lineHeight: 20 },
  statRow: { flexDirection: 'row', gap: 10 },
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
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
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
  recommendationCard: { ...baseCard, width: 206, padding: 14, gap: 10, marginRight: 14 },
  recommendationCover: { width: '100%', height: 150, borderRadius: 18 },
  recommendationTitle: { color: 'white', fontSize: 16, fontWeight: '900' },
  recommendationArtist: { color: '#C4B5FD', fontSize: 13, fontWeight: '700' },
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
  iconAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
});

export default FeedScreen;

