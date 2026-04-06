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
  Crown,
  Disc,
  Edit2,
  Flame,
  Flag,
  Headphones,
  ListMusic,
  LockKeyhole,
  LogOut,
  Radio,
  Send,
  Shield,
  Sparkles,
  Trash2,
  User as UserIcon,
  UserMinus,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react-native';

import { buildProfileTheme } from '../data/appState';
import ProfileEditModal from './ProfileEditModal';
import ProfileHero from './ProfileHero';

const ACHIEVEMENT_ICON_MAP = {
  pen: Edit2,
  list: ListMusic,
  flame: Flame,
  radio: Radio,
  send: Send,
  crown: Crown,
};

const ProfileScreen = ({
  user,
  reviews,
  top5,
  currentTrack,
  preferences = {},
  onPlaySong,
  onDeleteReview,
  onEditReview,
  onShareProfile,
  onOpenStory,
  onOpenAccount,
  onOpenFoundation,
  onOpenPrivacy,
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
  achievementSummary,
  onOpenReviewWhileListening,
  interestingUsers = [],
  profileCompatibility,
  onViewSuggestedProfile,
  isPublic,
}) => {
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [isStreakInfoVisible, setIsStreakInfoVisible] = useState(false);

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
    { label: 'Reseñas', value: profileReviews.length },
  ];
  const suggestedUsers = interestingUsers
    .filter((candidate) => `@${candidate?.handle}` !== profileHandle)
    .slice(0, 4);

  const submitProfileReport = (reason) => {
    const result = onReportUser?.({
      targetHandle: user.handle,
      reason,
    });

    if (result?.duplicate) {
      Alert.alert(
        'Reporte ya enviado',
        'Ese perfil ya está marcado para revisión. No hace falta reportarlo de nuevo.'
      );
      return;
    }

    if (result?.ok) {
      Alert.alert(
        'Reporte enviado',
        `Marcamos a @${user.handle} para revisión manual.`
      );
      return;
    }

    Alert.alert('No pudimos enviar el reporte', 'Intenta otra vez en un rato.');
  };

  const handleReport = () => {
    if (!isPublic || !user?.handle) return;

    Alert.alert('Reportar perfil', `¿Qué querés marcar de @${user.handle}?`, [
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
        {isPublic ? `Top de ${user?.name}` : 'Tu Top 5 histórico'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.top5Row}>
        {top5.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Todavía no hay discos fijados</Text>
          </View>
        ) : (
          top5.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.top5Item}
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
    if (isPublic || preferences.showRecentActivity === false) return null;

    const latestListen = recentListening[0];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tu ritmo</Text>
        <View style={styles.listeningCard}>
          <View style={styles.listeningTopRow}>
            <TouchableOpacity
              style={[
                styles.streakChip,
                listeningStreak?.isAtRisk && styles.streakChipWarning,
              ]}
              onPress={() => setIsStreakInfoVisible(true)}>
              <Flame
                color={listeningStreak?.isAtRisk ? '#FCA5A5' : '#FDBA74'}
                size={15}
              />
              <Text
                style={[
                  styles.streakChipText,
                  listeningStreak?.isAtRisk && styles.streakChipTextWarning,
                ]}>
                {listeningStreak?.current
                  ? `${listeningStreak.current} días`
                  : listeningStreak?.isAtRisk
                    ? 'En riesgo'
                    : 'Sin racha'}
              </Text>
            </TouchableOpacity>

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
                <Text style={styles.latestListenEyebrow}>ÚLTIMA ESCUCHA</Text>
                <Text style={styles.latestListenTitle} numberOfLines={1}>
                  {latestListen.title}
                </Text>
                <Text style={styles.latestListenArtist} numberOfLines={1}>
                  {latestListen.artist}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.reviewWhileListeningButton,
                  !currentTrack && styles.reviewWhileListeningButtonDisabled,
                ]}
                disabled={!currentTrack}
                onPress={() => onOpenReviewWhileListening?.()}>
                <Headphones color="white" size={16} />
                <Text style={styles.reviewWhileListeningText}>Reseñar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.reviewWhileListeningButton,
                !currentTrack && styles.reviewWhileListeningButtonDisabled,
              ]}
              disabled={!currentTrack}
              onPress={() => onOpenReviewWhileListening?.()}>
              <Headphones color="white" size={18} />
              <Text style={styles.reviewWhileListeningText}>
                Reseñar ahora
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderSuggestedUsersSection = () => {
    if (suggestedUsers.length === 0 || preferences.showSuggestedProfiles === false)
      return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isPublic ? 'Perfiles para interactuar' : 'Gente para conectar'}
        </Text>

        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestedUsersRow}>
          {suggestedUsers.map((candidate) => (
            <TouchableOpacity
              key={candidate.handle}
              style={styles.suggestedUserCard}
              onPress={() => onViewSuggestedProfile?.(candidate.handle)}>
              <View
                style={[
                  styles.suggestedAvatar,
                  { backgroundColor: candidate.avatarColor || '#8A2BE2' },
                ]}>
                {candidate.avatarUrl ? (
                  <Image
                    source={{ uri: candidate.avatarUrl }}
                    style={styles.suggestedAvatarImage}
                  />
                ) : (
                  <UserRound color="white" size={18} />
                )}
              </View>

              <Text style={styles.suggestedName} numberOfLines={1}>
                {candidate.name}
              </Text>
              <Text style={styles.suggestedHandle}>@{candidate.handle}</Text>
              <Text style={styles.suggestedMeta}>
                {candidate.followersCount || 0} seguidores
              </Text>
              {preferences.showTasteCompatibility !== false &&
              candidate.compatibilityScore ? (
                <View style={styles.compatibilityChip}>
                  <Sparkles color="#FDE68A" size={12} />
                  <Text style={styles.compatibilityChipText}>
                    {candidate.compatibilityScore}% afinidad
                  </Text>
                </View>
              ) : null}
              <Text style={styles.suggestedReason} numberOfLines={2}>
                {candidate.reason}
              </Text>

              <View style={styles.suggestedButton}>
                <Text style={styles.suggestedButtonText}>Ver perfil</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderAchievementsSection = () => {
    if (isPublic || !achievementSummary) return null;

    const unlockedBadges = achievementSummary.unlockedBadges || [];
    const nextBadge = achievementSummary.nextBadge;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tu progreso</Text>

        <View style={styles.achievementCard}>
          <View style={styles.achievementHeader}>
            <View style={styles.achievementCopy}>
              <Text style={styles.achievementEyebrow}>MEDALLAS Y DESBLOQUEOS</Text>
              <Text style={styles.achievementTitle}>
                {unlockedBadges.length
                  ? `${unlockedBadges.length} insignias activas`
                  : 'Todavía no desbloqueaste insignias'}
              </Text>
              <Text style={styles.achievementText}>
                {achievementSummary.avatarFrame?.id === 'default'
                  ? 'Tu perfil ya suma progreso. Cuando avances, también vas a desbloquear marcos para el avatar.'
                  : `Ya destrabaste el marco ${achievementSummary.avatarFrame.label.toLowerCase()} para tu avatar.`}
              </Text>
            </View>

            <View style={styles.avatarFrameChip}>
              <Text style={styles.avatarFrameChipText}>
                {achievementSummary.avatarFrame?.label || 'Clásico'}
              </Text>
            </View>
          </View>

          {unlockedBadges.length ? (
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementBadgesRow}>
              {unlockedBadges.map((badge) => {
                const BadgeIcon = ACHIEVEMENT_ICON_MAP[badge.icon] || Sparkles;

                return (
                  <View key={badge.id} style={styles.achievementBadgeCard}>
                    <View style={styles.achievementBadgeIconWrap}>
                      <BadgeIcon color="#E9D5FF" size={18} />
                    </View>
                    <Text style={styles.achievementBadgeTitle} numberOfLines={1}>
                      {badge.title}
                    </Text>
                    <Text style={styles.achievementBadgeDescription} numberOfLines={2}>
                      {badge.description}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.achievementEmptyState}>
              <Text style={styles.achievementEmptyText}>
                Cada reseña, lista o recomendación suma para tus próximos
                desbloqueos.
              </Text>
            </View>
          )}

          {nextBadge ? (
            <View style={styles.nextBadgeCard}>
              <View style={styles.nextBadgeTopRow}>
                <Text style={styles.nextBadgeLabel}>SIGUIENTE META</Text>
                <Text style={styles.nextBadgeProgressText}>
                  {nextBadge.value}/{nextBadge.threshold}
                </Text>
              </View>

              <Text style={styles.nextBadgeTitle}>{nextBadge.title}</Text>
              <Text style={styles.nextBadgeDescription}>{nextBadge.description}</Text>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width:
                        nextBadge.progress > 0
                          ? `${Math.max(8, Math.round(nextBadge.progress * 100))}%`
                          : '0%',
                    },
                  ]}
                />
              </View>

              <Text style={styles.nextBadgeHint}>{nextBadge.progressLabel}</Text>
            </View>
          ) : (
            <View style={styles.completedBadgeCard}>
              <Sparkles color="#FDE68A" size={16} />
              <Text style={styles.completedBadgeText}>
                Ya desbloqueaste todas las insignias de esta etapa.
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderReviewsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {isPublic ? `Reseñas de ${user?.name}` : 'Tu actividad'}
      </Text>

      {profileReviews.length === 0 ? (
        <View style={styles.reviewEmptyCard}>
          <Text style={styles.reviewEmptyText}>
            {isPublic
              ? 'Este perfil todavía no publicó reseñas.'
              : 'Todavía no tenés reseñas o scratches guardados.'}
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

  const renderCompatibilitySection = () => {
    if (
      !isPublic ||
      preferences.showTasteCompatibility === false ||
      !profileCompatibility
    ) {
      return null;
    }

    return (
      <View style={styles.compatibilitySection}>
        <View style={styles.compatibilitySectionIcon}>
          <Sparkles color="#FDE68A" size={18} />
        </View>
        <View style={styles.compatibilitySectionBody}>
          <Text style={styles.compatibilitySectionEyebrow}>
            COMPATIBILIDAD MUSICAL
          </Text>
          <Text style={styles.compatibilitySectionTitle}>
            {profileCompatibility.percent}% de afinidad
          </Text>
          <Text style={styles.compatibilitySectionText}>
            {profileCompatibility.reason}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHero
          user={user}
          currentTrack={currentTrack}
          showListeningStatus={preferences.showListeningStatus !== false}
          isPublic={isPublic}
          avatarFrame={achievementSummary?.avatarFrame}
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

        {renderCompatibilitySection()}

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
            <Text style={styles.blockedTitle}>Este perfil está bloqueado</Text>
            <Text style={styles.blockedText}>
              Mientras siga bloqueado, B-Side lo oculta del feed, mensajes y
              actividad visible.
            </Text>
          </View>
        ) : (
          <>
            {renderListeningSection()}
            {renderAchievementsSection()}
            {renderTopSection()}
            {renderSuggestedUsersSection()}
            {renderReviewsSection()}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={isSettingsVisible} animationType="fade" transparent={true}>
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsContent}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Configuración</Text>
              <TouchableOpacity onPress={() => setIsSettingsVisible(false)}>
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => {
                setIsSettingsVisible(false);
                onOpenAccount?.();
              }}>
              <LockKeyhole color="#A855F7" size={20} />
              <Text style={styles.settingText}>Cuenta y sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => {
                setIsSettingsVisible(false);
                setIsEditProfileVisible(true);
              }}>
              <UserIcon color="#A855F7" size={20} />
              <Text style={styles.settingText}>Editar perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => {
                setIsSettingsVisible(false);
                onOpenPrivacy?.();
              }}>
              <Shield color="#A855F7" size={20} />
              <Text style={styles.settingText}>Centro de privacidad</Text>
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
                  ? 'Cerrar sesión'
                  : 'Salir'}
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

      <Modal
        visible={isStreakInfoVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsStreakInfoVisible(false)}>
        <View style={styles.streakOverlay}>
          <View style={styles.streakModal}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Tu racha</Text>
              <TouchableOpacity onPress={() => setIsStreakInfoVisible(false)}>
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.streakSummaryRow}>
              <View style={styles.streakSummaryCard}>
                <Text style={styles.streakSummaryValue}>
                  {listeningStreak?.current || 0}
                </Text>
                <Text style={styles.streakSummaryLabel}>días seguidos</Text>
              </View>
              <View style={styles.streakSummaryCard}>
                <Text style={styles.streakSummaryValue}>
                  {listeningStreak?.longest || 0}
                </Text>
                <Text style={styles.streakSummaryLabel}>mejor marca</Text>
              </View>
            </View>

            <Text style={styles.streakParagraph}>
              La racha cuenta si escuchás al menos una vez por día. No hace falta
              spamear reproducciones: una escucha alcanza para mantenerla viva.
            </Text>
            <Text style={styles.streakParagraph}>
              {listeningStreak?.isAtRisk
                ? 'Hoy todavía no escuchaste nada y se corta al terminar el día. B-Side te avisa dentro de la app cuando eso pasa.'
                : listeningStreak?.current
                  ? 'Hoy ya está cubierta. Mañana vuelve a contar una nueva escucha para sostenerla.'
                  : 'Todavía no arrancaste una racha estable, pero la primera escucha del día ya te pone en juego.'}
            </Text>
          </View>
        </View>
      </Modal>
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
  compatibilitySection: {
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.22)',
    backgroundColor: 'rgba(30, 24, 8, 0.78)',
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  compatibilitySectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(250,204,21,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compatibilitySectionBody: { flex: 1, gap: 4 },
  compatibilitySectionEyebrow: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  compatibilitySectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  compatibilitySectionText: {
    color: '#E5E7EB',
    lineHeight: 20,
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
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(7, 10, 18, 0.78)',
    padding: 16,
    gap: 12,
  },
  achievementCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.18)',
    backgroundColor: 'rgba(7, 10, 18, 0.82)',
    padding: 16,
    gap: 14,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  achievementCopy: {
    flex: 1,
    gap: 5,
  },
  achievementEyebrow: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  achievementTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  achievementText: {
    color: '#D1D5DB',
    lineHeight: 19,
  },
  avatarFrameChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
  },
  avatarFrameChipText: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '800',
  },
  achievementBadgesRow: {
    paddingRight: 8,
  },
  achievementBadgeCard: {
    width: 172,
    marginRight: 12,
    borderRadius: 20,
    padding: 14,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  achievementBadgeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(168,85,247,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementBadgeTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
  achievementBadgeDescription: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
  achievementEmptyState: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  achievementEmptyText: {
    color: '#9CA3AF',
    lineHeight: 19,
  },
  nextBadgeCard: {
    borderRadius: 20,
    padding: 14,
    gap: 8,
    backgroundColor: 'rgba(22, 16, 35, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.22)',
  },
  nextBadgeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  nextBadgeLabel: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  nextBadgeProgressText: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '800',
  },
  nextBadgeTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  nextBadgeDescription: {
    color: '#D1D5DB',
    lineHeight: 19,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#8A2BE2',
  },
  nextBadgeHint: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '700',
  },
  completedBadgeCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(250,204,21,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  completedBadgeText: {
    flex: 1,
    color: '#FDE68A',
    lineHeight: 19,
    fontWeight: '700',
  },
  listeningTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(249,115,22,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  streakChipWarning: {
    backgroundColor: 'rgba(127, 29, 29, 0.3)',
  },
  streakChipText: {
    color: '#FED7AA',
    fontWeight: '800',
    fontSize: 12,
  },
  streakChipTextWarning: {
    color: '#FCA5A5',
  },
  listeningMeta: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  latestListenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  latestListenCover: {
    width: 54,
    height: 54,
    borderRadius: 14,
  },
  latestListenPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 14,
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
  latestListenTitle: { color: 'white', fontSize: 16, fontWeight: '900' },
  latestListenArtist: { color: '#D1D5DB', fontSize: 13 },
  reviewWhileListeningButton: {
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  reviewWhileListeningButtonDisabled: {
    opacity: 0.5,
  },
  reviewWhileListeningText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
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
  suggestedUsersRow: { paddingLeft: 20, paddingRight: 8 },
  suggestedUserCard: {
    width: 170,
    marginRight: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(7, 10, 18, 0.78)',
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  suggestedAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestedAvatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  suggestedName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  suggestedHandle: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '700',
  },
  suggestedMeta: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  compatibilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(250,204,21,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compatibilityChipText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
  },
  suggestedReason: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    minHeight: 36,
  },
  suggestedButton: {
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(168,85,247,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestedButtonText: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '800',
  },
  top5Item: { width: 110, marginRight: 15 },
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
  streakOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  streakModal: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0A0A0A',
    padding: 22,
  },
  streakSummaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  streakSummaryCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  streakSummaryValue: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
  },
  streakSummaryLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  streakParagraph: {
    color: '#D1D5DB',
    lineHeight: 21,
    marginTop: 8,
  },
});

export default ProfileScreen;


