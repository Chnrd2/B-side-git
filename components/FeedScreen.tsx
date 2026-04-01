import React, { useMemo, useState } from 'react';
import {
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
  Headphones,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  X,
} from 'lucide-react-native';

const CommentsModal = ({
  visible,
  review,
  onClose,
  onViewProfile,
  onAddComment,
}) => {
  const [newComment, setNewComment] = useState('');
  const comments = review?.comments || [];

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
              <X color="white" size={24} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.commentsContent}
            ListEmptyComponent={
              <View style={styles.commentEmptyCard}>
                <Text style={styles.commentEmptyText}>
                  Todavía no hay comentarios. Rompé el hielo.
                </Text>
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
                <Text style={styles.commentTime}>{item.createdLabel}</Text>
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
              <Send color="white" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const SectionLabel = ({ eyebrow, title, subtitle }) => (
  <View style={styles.sectionLabel}>
    <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
  </View>
);

const ListeningBar = ({ currentTrack, onOpenReviewWhileListening, onSelectAlbum }) => (
  <View style={styles.listeningBar}>
    <View style={styles.listeningBarInfo}>
      {currentTrack?.cover ? (
        <Image source={{ uri: currentTrack.cover }} style={styles.listeningBarCover} />
      ) : (
        <View style={styles.listeningBarPlaceholder}>
          <Headphones color="#A855F7" size={18} />
        </View>
      )}

      <View style={styles.listeningBarCopy}>
        <Text style={styles.listeningBarEyebrow}>AHORA SONANDO</Text>
        <Text style={styles.listeningBarTitle} numberOfLines={1}>
          {currentTrack ? currentTrack.title : 'Poné algo y dejá una reseña en caliente'}
        </Text>
        <Text style={styles.listeningBarSubtitle} numberOfLines={1}>
          {currentTrack
            ? currentTrack.artist
            : 'El feed queda para la comunidad; esto solo te da un atajo rápido.'}
        </Text>
      </View>
    </View>

    <View style={styles.listeningBarActions}>
      <TouchableOpacity
        style={[
          styles.listeningPrimaryButton,
          !currentTrack && styles.listeningButtonDisabled,
        ]}
        onPress={onOpenReviewWhileListening}
        disabled={!currentTrack}>
        <Headphones color="white" size={16} />
        <Text style={styles.listeningPrimaryButtonText}>Reseñar</Text>
      </TouchableOpacity>

      {currentTrack ? (
        <TouchableOpacity
          style={styles.listeningSecondaryButton}
          onPress={() => onSelectAlbum(currentTrack)}>
          <Text style={styles.listeningSecondaryButtonText}>Ficha</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

const FriendActivityCard = ({ review, onViewProfile }) => (
  <TouchableOpacity
    style={styles.friendCard}
    onPress={() => onViewProfile(review.user)}>
    <View style={styles.friendHeader}>
      <View>
        <Text style={styles.friendHandle}>{review.user}</Text>
        <Text style={styles.friendMeta}>
          {review.profile?.followersCount || 0} seguidores
        </Text>
      </View>
      <View style={styles.friendScorePill}>
        <Text style={styles.friendScoreText}>{review.rating}/5</Text>
      </View>
    </View>

    <View style={styles.friendAlbumRow}>
      {review.cover ? (
        <Image source={{ uri: review.cover }} style={styles.friendAlbumCover} />
      ) : (
        <View style={styles.friendAlbumPlaceholder}>
          <Disc color="#A855F7" size={18} />
        </View>
      )}
      <View style={styles.friendAlbumInfo}>
        <Text style={styles.friendAlbumTitle} numberOfLines={1}>
          {review.albumTitle}
        </Text>
        <Text style={styles.friendAlbumArtist} numberOfLines={1}>
          {review.artist}
        </Text>
      </View>
    </View>

    <Text style={styles.friendReviewText} numberOfLines={3}>
      "{review.text}"
    </Text>
  </TouchableOpacity>
);

const FeedItem = React.memo(
  ({
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
      <View style={styles.card}>
        {review.contextType === 'while-listening' ? (
          <View style={styles.contextFlag}>
            <Headphones color="#A855F7" size={14} />
            <Text style={styles.contextFlagText}>Mientras suena</Text>
          </View>
        ) : null}

        {isScratched ? (
          <View style={styles.repostIndicator}>
            <Disc color="#A855F7" size={14} />
            <Text style={styles.repostText}>Le hiciste scratch a esta reseña</Text>
          </View>
        ) : null}

        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={() => onViewProfile(review.user)}>
            <Text style={styles.userName}>{review.user}</Text>
          </TouchableOpacity>
          {review.user === currentUserHandle ? (
            <TouchableOpacity onPress={() => onDeleteReview(review.id)}>
              <Trash2 color="#FF3B30" size={16} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.reviewHeaderContent}>
          {review.cover ? (
            <Image source={{ uri: review.cover }} style={styles.reviewCover} />
          ) : (
            <View style={styles.reviewCoverPlaceholder}>
              <Text style={styles.reviewCoverPlaceholderText}>CD</Text>
            </View>
          )}
          <View style={styles.reviewInfoContent}>
            <Text style={styles.albumTitle} numberOfLines={1}>
              {review.albumTitle}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {review.artist}
            </Text>
            <Text style={styles.rating}>{review.rating}/5</Text>
          </View>
        </View>

        <Text style={styles.reviewBody}>"{review.text}"</Text>

        {commentPreview ? (
          <TouchableOpacity
            style={styles.commentPreviewCard}
            onPress={() => setIsCommentsVisible(true)}>
            <MessageCircle color="#A855F7" size={16} />
            <Text style={styles.commentPreviewText} numberOfLines={2}>
              <Text style={styles.commentPreviewAuthor}>{commentPreview.user} </Text>
              {commentPreview.text}
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.interactionBtn}
            onPress={() => onToggleLikeReview(review.id)}>
            <Heart
              color={isLiked ? '#FF3B30' : '#9CA3AF'}
              fill={isLiked ? '#FF3B30' : 'transparent'}
              size={20}
            />
            <Text style={[styles.interactionText, isLiked && styles.likedText]}>
              {review.likedBy.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.interactionBtn}
            onPress={() => onToggleScratch(review.id)}>
            <Disc color={isScratched ? '#A855F7' : '#9CA3AF'} size={20} />
            <Text
              style={[
                styles.interactionText,
                isScratched && styles.scratchedText,
              ]}>
              {review.scratchedBy ? 1 : 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.interactionBtn}
            onPress={() => setIsCommentsVisible(true)}>
            <MessageCircle color="#9CA3AF" size={20} />
            <Text style={styles.interactionText}>{review.comments.length}</Text>
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
  }
);

const FeedScreen = ({
  reviews,
  currentUserHandle,
  currentTrack,
  friendActivity,
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
}) => (
  <View style={styles.mainContainer}>
    <View style={styles.headerRow}>
      <View>
        <Text style={styles.headerEyebrow}>COMUNIDAD B-SIDE</Text>
        <Text style={styles.headerTitle}>Comunidad</Text>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.iconButton} onPress={onOpenNotifications}>
          <Bell color="white" size={22} />
          {hasUnreadNotifications ? <View style={styles.notificationDot} /> : null}
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={onOpenInbox}>
          <Send color="white" size={22} />
          {hasUnreadMessages ? <View style={styles.notificationDot} /> : null}
        </TouchableOpacity>
      </View>
    </View>

    <FlatList
      data={reviews}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.feedContent}
      initialNumToRender={5}
      windowSize={7}
      removeClippedSubviews={Platform.OS !== 'web'}
      ListHeaderComponent={
        <>
          <ListeningBar
            currentTrack={currentTrack}
            onOpenReviewWhileListening={onOpenReviewWhileListening}
            onSelectAlbum={onSelectAlbum}
          />

          {friendActivity.length ? (
            <View style={styles.sectionBlock}>
              <SectionLabel
                eyebrow="ACTIVIDAD DE AMIGOS"
                title="Lo que está pasando en tu círculo"
                subtitle="Las últimas reseñas de la gente que seguís."
              />
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalRow}>
                {friendActivity.map((review) => (
                  <FriendActivityCard
                    key={review.id}
                    review={review}
                    onViewProfile={onViewProfile}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <SectionLabel
            eyebrow="FEED"
            title="Reseñas primero"
            subtitle="Lo más fuerte de tu círculo y de la comunidad, con el descubrimiento un poco más abajo."
          />
        </>
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

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: 'transparent' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 60 : 42,
    paddingBottom: 22,
  },
  headerEyebrow: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  headerTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
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
  feedContent: { paddingHorizontal: 20, paddingBottom: 24 },
  listeningBar: {
    borderRadius: 22,
    backgroundColor: 'rgba(7, 10, 18, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  listeningBarInfo: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  listeningBarCover: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  listeningBarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listeningBarCopy: { flex: 1, gap: 3 },
  listeningBarEyebrow: {
    color: '#C4B5FD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  listeningBarTitle: { color: 'white', fontSize: 16, fontWeight: '900' },
  listeningBarSubtitle: { color: '#9CA3AF', fontSize: 13, lineHeight: 18 },
  listeningBarActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  listeningPrimaryButton: {
    minHeight: 40,
    borderRadius: 14,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  listeningPrimaryButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
  },
  listeningSecondaryButton: {
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  listeningSecondaryButtonText: {
    color: '#E5E7EB',
    fontWeight: '800',
    fontSize: 13,
  },
  listeningButtonDisabled: { opacity: 0.55 },
  sectionBlock: { marginBottom: 22 },
  sectionLabel: { marginBottom: 14 },
  sectionEyebrow: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
  },
  sectionSubtitle: {
    color: '#9CA3AF',
    marginTop: 6,
    lineHeight: 20,
  },
  horizontalRow: {
    paddingRight: 8,
  },
  friendCard: {
    width: 228,
    borderRadius: 22,
    backgroundColor: 'rgba(7, 10, 18, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    marginRight: 14,
    gap: 10,
  },
  friendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  friendHandle: { color: 'white', fontWeight: '900', fontSize: 15 },
  friendMeta: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
  friendScorePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(251,191,36,0.12)',
  },
  friendScoreText: { color: '#FBBF24', fontWeight: '800', fontSize: 12 },
  friendAlbumRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  friendAlbumCover: { width: 52, height: 52, borderRadius: 14 },
  friendAlbumPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAlbumInfo: { flex: 1, gap: 4 },
  friendAlbumTitle: { color: 'white', fontWeight: '800', fontSize: 15 },
  friendAlbumArtist: { color: '#9CA3AF', fontSize: 13 },
  friendReviewText: { color: '#E5E7EB', lineHeight: 19, fontSize: 13 },
  card: {
    backgroundColor: 'rgba(7, 10, 18, 0.78)',
    padding: 18,
    borderRadius: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.12)',
  },
  contextFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  contextFlagText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '800',
  },
  repostIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    opacity: 0.9,
  },
  repostText: { color: '#A855F7', fontSize: 12, fontWeight: '700' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userName: { color: '#C4B5FD', fontWeight: '800', fontSize: 15 },
  reviewHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewCover: {
    width: 62,
    height: 62,
    borderRadius: 14,
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  reviewCoverPlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 14,
    marginRight: 15,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewCoverPlaceholderText: {
    color: '#6B7280',
    fontWeight: '700',
  },
  reviewInfoContent: { flex: 1, justifyContent: 'center', gap: 3 },
  albumTitle: { color: 'white', fontWeight: '800', fontSize: 18 },
  artistName: { color: '#9CA3AF', fontSize: 13 },
  rating: { color: '#FBBF24', fontWeight: '700' },
  reviewBody: {
    color: '#E5E7EB',
    fontStyle: 'italic',
    lineHeight: 22,
    fontSize: 15,
    marginTop: 4,
  },
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
  commentPreviewText: {
    flex: 1,
    color: '#D1D5DB',
    lineHeight: 19,
  },
  commentPreviewAuthor: {
    color: '#C4B5FD',
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 30,
  },
  interactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  interactionText: { color: '#9CA3AF', fontSize: 14, fontWeight: '700' },
  likedText: { color: '#FF3B30' },
  scratchedText: { color: '#A855F7' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
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
  commentsContent: {
    padding: 20,
    gap: 12,
    paddingBottom: 110,
  },
  commentEmptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 18,
  },
  commentEmptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  commentItem: {
    backgroundColor: '#111827',
    padding: 15,
    borderRadius: 16,
    gap: 6,
  },
  commentUser: { color: '#C4B5FD', fontWeight: '800' },
  commentText: { color: '#E5E7EB', fontSize: 15, lineHeight: 20 },
  commentTime: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
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

