import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Bell,
  Disc,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  X,
} from 'lucide-react-native';

import { CURRENT_USER_HANDLE } from '../data/appState';

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
                  Todavia no hay comentarios. Rompe el hielo.
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
              placeholder="Escribi un comentario..."
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

const FeedItem = React.memo(
  ({
    review,
    onDeleteReview,
    onViewProfile,
    onToggleScratch,
    onToggleLikeReview,
    onAddReviewComment,
  }) => {
    const [isCommentsVisible, setIsCommentsVisible] = useState(false);
    const isScratched = review.scratchedBy === CURRENT_USER_HANDLE;
    const isLiked = review.likedBy.includes(CURRENT_USER_HANDLE);
    const commentPreview = useMemo(
      () => review.comments[review.comments.length - 1],
      [review.comments]
    );

    return (
      <View style={styles.card}>
        {isScratched ? (
          <View style={styles.repostIndicator}>
            <Disc color="#A855F7" size={14} />
            <Text style={styles.repostText}>Hiciste scratch a esta resena</Text>
          </View>
        ) : null}

        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={() => onViewProfile(review.user)}>
            <Text style={styles.userName}>{review.user}</Text>
          </TouchableOpacity>
          {review.user === CURRENT_USER_HANDLE ? (
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
  hasUnreadMessages,
  hasUnreadNotifications,
  onDeleteReview,
  onViewProfile,
  onToggleScratch,
  onToggleLikeReview,
  onAddReviewComment,
  onOpenInbox,
  onOpenNotifications,
}) => (
  <View style={styles.mainContainer}>
    <View style={styles.headerRow}>
      <View>
        <Text style={styles.headerEyebrow}>B-SIDE COMMUNITY</Text>
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
      renderItem={({ item }) => (
        <FeedItem
          review={item}
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
  headerTitle: { color: 'white', fontSize: 32, fontWeight: '900', marginTop: 4 },
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
  feedContent: { paddingHorizontal: 20 },
  card: {
    backgroundColor: 'rgba(7, 10, 18, 0.84)',
    padding: 20,
    borderRadius: 28,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.16)',
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
