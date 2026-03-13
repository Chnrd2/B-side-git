import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Ban,
  Disc,
  Edit2,
  Flame,
  Flag,
  Headphones,
  LogOut,
  Shield,
  Trash2,
  User as UserIcon,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react-native';

import { buildProfileTheme } from '../data/appState';
import ProfileEditModal from './ProfileEditModal';
import ProfileHero from './ProfileHero';

const ProfileScreen = ({
  user,
  reviews,
  top5,
  currentTrack,
  onPlaySong,
  onDeleteReview,
  onEditReview,
  onShareProfile,
  onOpenStory,
  onOpenFoundation,
  onSaveProfile,
  onToggleFollow,
  onBlockUser,
  onUnblockUser,
  onReportUser,
  onSignOut,
  onBack,
  sessionMode,
  isProfileSaving,
  isFollowing,
  isBlocked,
  followersCount = 0,
  followingCount = 0,
  listeningStreak,
  recentListening = [],
  onOpenReviewWhileListening,
  isPublic,
}) => {
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);

  const profileHandle = `@${user?.handle}`;
  const profileTheme = buildProfileTheme(user);
  const profileReviews =
    reviews
      ?.filter((review) => {
        const isOwner = review.user === profileHandle;
        const hasScratched = review.scratchedBy === profileHandle;
        return isPublic ? isOwner : isOwner || hasScratched;
      })
      .sort((left, right) => {
        const leftTime = left?.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right?.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
      }) || [];
  const statItems = [
    { label: 'Seguidores', value: followersCount },
    { label: 'Siguiendo', value: followingCount },
    { label: 'Resenas', value: profileReviews.length },
  ];

  const submitProfileReport = (reason) => {
    const result = onReportUser?.({
      targetHandle: user.handle,
      reason,
    });

    if (result?.duplicate) {
      Alert.alert(
        'Reporte ya enviado',
        'Ese perfil ya esta marcado para revision. No hace falta reportarlo de nuevo.'
      );
      return;
    }

    if (result?.ok) {
      Alert.alert(
        'Reporte enviado',
        `Marcamos a @${user.handle} para revision manual.`
      );
      return;
    }

    Alert.alert('No pudimos enviar el reporte', 'Intenta otra vez en un rato.');
  };

  const handleReport = () => {
    if (!isPublic || !user?.handle) return;

    Alert.alert('Reportar perfil', `Que quieres marcar de @${user.handle}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Spam o acoso',
        onPress: () => submitProfileReport('Spam o acoso'),
      },
      {
        text: 'Perfil inapropiado',
        onPress: () => submitProfileReport('Perfil inapropiado'),
      },
    ]);
  };

  const renderTopSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {isPublic ? `Top de ${user?.name}` : 'Tu Top 5 historico'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.top5Row}>
        {top5.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Todavia no hay discos fijados</Text>
          </View>
        ) : (
          top5.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.top5Item, !item.previewUrl && styles.top5ItemDisabled]}
              disabled={!item.previewUrl}
              onPress={() => onPlaySong(item)}>
              <Image source={{ uri: item.cover }} style={styles.top5Image} />
              <Text style={styles.top5Title} numberOfLines={1}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );

  const renderListeningSection = () => {
    if (isPublic) return null;

    const latestListen = recentListening[0];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tu ritmo</Text>
        <View style={styles.listeningCard}>
          <View style={styles.listeningHeader}>
            <View style={styles.listeningBadge}>
              <Flame color="#FDBA74" size={16} />
              <Text style={styles.listeningBadgeText}>
                {listeningStreak?.current || 0} dias seguidos
              </Text>
            </View>
            <Text style={styles.listeningMeta}>
              {listeningStreak?.last7DaysCount || 0} escuchas esta semana
            </Text>
          </View>

          {latestListen ? (
            <View style={styles.latestListenRow}>
              {latestListen.cover ? (
                <Image
                  source={{ uri: latestListen.cover }}
                  style={styles.latestListenCover}
                />
              ) : (
                <View style={styles.latestListenPlaceholder}>
                  <Headphones color="#A855F7" size={18} />
                </View>
              )}
              <View style={styles.latestListenInfo}>
                <Text style={styles.latestListenEyebrow}>ULTIMA ESCUCHA</Text>
                <Text style={styles.latestListenTitle} numberOfLines={1}>
                  {latestListen.title}
                </Text>
                <Text style={styles.latestListenArtist} numberOfLines={1}>
                  {latestListen.artist}
                </Text>
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.reviewWhileListeningButton,
              !currentTrack && styles.reviewWhileListeningButtonDisabled,
            ]}
            disabled={!currentTrack}
            onPress={() => onOpenReviewWhileListening?.()}>
            <Headphones color="white" size={18} />
            <Text style={styles.reviewWhileListeningText}>
              Review while listening
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderReviewsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {isPublic ? `Resenas de ${user?.name}` : 'Tu actividad'}
      </Text>

      {profileReviews.length === 0 ? (
        <View style={styles.reviewEmptyCard}>
          <Text style={styles.reviewEmptyText}>
            {isPublic
              ? 'Este perfil todavia no publico resenas.'
              : 'Todavia no tienes resenas o scratches guardados.'}
          </Text>
        </View>
      ) : (
        profileReviews.map((review) => {
          const isMyRepost =
            review.scratchedBy === profileHandle && review.user !== profileHandle;

          return (
            <View
              key={review.id}
              style={[styles.reviewCard, isMyRepost && styles.scratchedCard]}>
              {isMyRepost ? (
                <View style={styles.repostLabel}>
                  <Disc color={profileTheme.accent} size={12} />
                  <Text
                    style={[styles.repostLabelText, { color: profileTheme.accent }]}>
                    Scratcheado por vos
                  </Text>
                </View>
              ) : null}

              <View style={styles.reviewHeaderContent}>
                {review.cover ? (
                  <Image source={{ uri: review.cover }} style={styles.reviewCover} />
                ) : (
                  <View style={styles.reviewCoverPlaceholder}>
                    <Text style={styles.placeholderText}>CD</Text>
                  </View>
                )}
                <View style={styles.reviewInfoContent}>
                  <Text style={styles.reviewAlbum} numberOfLines={1}>
                    {review.albumTitle}
                  </Text>
                  <Text style={styles.reviewArtist} numberOfLines={1}>
                    {review.artist}
                  </Text>
                  <Text style={styles.reviewRating}>{review.rating}/5</Text>
                </View>

                {!isPublic && review.user === profileHandle ? (
                  <View style={styles.reviewActions}>
                    <TouchableOpacity
                      onPress={() => onEditReview(review)}
                      style={styles.actionIcon}>
                      <Edit2 color={profileTheme.accent} size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onDeleteReview(review.id)}
                      style={styles.actionIcon}>
                      <Trash2 color="#FF3B30" size={18} />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              <Text style={styles.reviewText}>"{review.text}"</Text>
              {isMyRepost ? (
                <Text style={styles.originalAuthor}>Original de {review.user}</Text>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHero
          user={user}
          currentTrack={currentTrack}
          isPublic={isPublic}
          onBack={onBack}
          onShareProfile={onShareProfile}
          onOpenStory={onOpenStory}
          onOpenSettings={() => setIsSettingsVisible(true)}
        />

        <View style={styles.statsStrip}>
          {statItems.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {isPublic ? (
          <View style={styles.publicActionsSection}>
            <TouchableOpacity
              style={[
                styles.primaryPublicButton,
                isFollowing && styles.primaryPublicButtonActive,
              ]}
              onPress={() => onToggleFollow?.(user?.handle)}>
              {isFollowing ? (
                <UserMinus color="white" size={18} />
              ) : (
                <UserPlus color="white" size={18} />
              )}
              <Text style={styles.primaryPublicButtonText}>
                {isFollowing ? 'Siguiendo' : 'Seguir perfil'}
              </Text>
            </TouchableOpacity>

            <View style={styles.secondaryPublicActions}>
              <TouchableOpacity
                style={styles.secondaryPublicButton}
                onPress={() =>
                  isBlocked
                    ? onUnblockUser?.(user?.handle)
                    : onBlockUser?.(user?.handle)
                }>
                {isBlocked ? (
                  <UserMinus color="#E5E7EB" size={16} />
                ) : (
                  <Ban color="#E5E7EB" size={16} />
                )}
                <Text style={styles.secondaryPublicButtonText}>
                  {isBlocked ? 'Desbloquear' : 'Bloquear'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryPublicButton}
                onPress={handleReport}>
                <Flag color="#E5E7EB" size={16} />
                <Text style={styles.secondaryPublicButtonText}>Reportar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {isPublic && isBlocked ? (
          <View style={styles.blockedCard}>
            <Text style={styles.blockedTitle}>Este perfil esta bloqueado</Text>
            <Text style={styles.blockedText}>
              Mientras siga bloqueado, B-Side lo oculta del feed, mensajes y
              actividad visible.
            </Text>
          </View>
        ) : (
          <>
            {renderListeningSection()}
            {renderTopSection()}
            {renderReviewsSection()}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={isSettingsVisible} animationType="fade" transparent={true}>
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsContent}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Configuracion</Text>
              <TouchableOpacity onPress={() => setIsSettingsVisible(false)}>
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => {
                setIsSettingsVisible(false);
                setIsEditProfileVisible(true);
              }}>
              <UserIcon color="#A855F7" size={20} />
              <Text style={styles.settingText}>Editar perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Shield color="#A855F7" size={20} />
              <Text style={styles.settingText}>Privacidad demo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => {
                setIsSettingsVisible(false);
                onOpenFoundation?.();
              }}>
              <Disc color="#A855F7" size={20} />
              <Text style={styles.settingText}>Base de producto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.settingItem, { borderBottomWidth: 0 }]}
              onPress={async () => {
                setIsSettingsVisible(false);
                await onSignOut?.();
              }}>
              <LogOut color="#FF3B30" size={20} />
              <Text style={[styles.settingText, { color: '#FF3B30' }]}>
                {sessionMode === 'authenticated'
                  ? 'Cerrar sesion real'
                  : 'Salir del modo demo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ProfileEditModal
        visible={isEditProfileVisible}
        user={user}
        onClose={() => setIsEditProfileVisible(false)}
        onSave={onSaveProfile}
        isSaving={isProfileSaving}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: 'transparent' },
  statsStrip: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 22,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(7, 10, 18, 0.76)',
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  publicActionsSection: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 26,
  },
  primaryPublicButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryPublicButtonActive: {
    backgroundColor: '#14532D',
  },
  primaryPublicButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryPublicActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryPublicButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(7, 10, 18, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryPublicButtonText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '700',
  },
  blockedCard: {
    marginHorizontal: 20,
    marginTop: 28,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.28)',
    backgroundColor: 'rgba(28, 7, 7, 0.82)',
    gap: 10,
  },
  blockedTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  blockedText: {
    color: '#D1D5DB',
    lineHeight: 21,
  },
  listeningCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.18)',
    backgroundColor: 'rgba(7, 10, 18, 0.84)',
    padding: 18,
    gap: 16,
  },
  listeningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  listeningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(249,115,22,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listeningBadgeText: {
    color: '#FED7AA',
    fontWeight: '800',
    fontSize: 12,
  },
  listeningMeta: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  latestListenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  latestListenCover: {
    width: 62,
    height: 62,
    borderRadius: 18,
  },
  latestListenPlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  latestListenInfo: { flex: 1, gap: 4 },
  latestListenEyebrow: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  latestListenTitle: { color: 'white', fontSize: 18, fontWeight: '900' },
  latestListenArtist: { color: '#D1D5DB', fontSize: 14 },
  reviewWhileListeningButton: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  reviewWhileListeningButtonDisabled: {
    opacity: 0.5,
  },
  reviewWhileListeningText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
  },
  section: { marginTop: 28 },
  sectionTitle: {
    color: 'white',
    fontSize: 21,
    fontWeight: '900',
    marginLeft: 20,
    marginBottom: 16,
  },
  top5Row: { paddingLeft: 20 },
  top5Item: { width: 110, marginRight: 15 },
  top5ItemDisabled: { opacity: 0.75 },
  top5Image: {
    width: 110,
    height: 110,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  top5Title: {
    color: 'white',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyCard: {
    width: 280,
    height: 100,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#273244',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 10, 18, 0.5)',
  },
  emptyText: { color: '#6B7280', fontWeight: '700' },
  reviewCard: {
    backgroundColor: 'rgba(7, 10, 18, 0.84)',
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 24,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.18)',
  },
  scratchedCard: {
    borderColor: 'rgba(168, 85, 247, 0.4)',
    borderStyle: 'dashed',
  },
  reviewEmptyCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: 'rgba(7, 10, 18, 0.8)',
  },
  reviewEmptyText: { color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  repostLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  repostLabelText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  reviewHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewCover: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  reviewCoverPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#6B7280',
    fontWeight: '700',
  },
  reviewInfoContent: { flex: 1, justifyContent: 'center', gap: 3 },
  reviewAlbum: { color: 'white', fontWeight: '900', fontSize: 16 },
  reviewArtist: { color: '#9CA3AF', fontSize: 13 },
  reviewRating: {
    color: '#FBBF24',
    fontWeight: '800',
    fontSize: 14,
  },
  reviewActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionIcon: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 8,
    borderRadius: 12,
  },
  reviewText: {
    color: '#E5E7EB',
    fontStyle: 'italic',
    lineHeight: 22,
    fontSize: 15,
  },
  originalAuthor: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'right',
    fontWeight: '700',
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  settingsContent: {
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  settingsTitle: { color: 'white', fontSize: 24, fontWeight: '800' },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    gap: 15,
  },
  settingText: { color: '#E5E7EB', fontSize: 16, fontWeight: '600' },
});

export default ProfileScreen;
