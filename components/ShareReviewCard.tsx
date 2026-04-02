import React from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Disc, Share2, Sparkles, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildProfileTheme } from '../data/appState';

const { width } = Dimensions.get('window');

const ShareReviewCard = ({ visible, onClose, review, user }) => {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const theme = buildProfileTheme(user);
  const profileInitial = (user?.name || 'B').charAt(0).toUpperCase();
  const topCount = Array.isArray(user?.top5) ? user.top5.filter(Boolean).length : 0;
  const reviewTitle = review?.album || review?.albumTitle || 'Sin última reseña todavía';
  const reviewQuote =
    review?.text || 'Perfil listo para descubrir música nueva.';
  const profileStats = [
    user?.plan === 'plus' ? 'Plan Plus' : null,
    `${topCount}/5 top`,
    review?.album || review?.albumTitle
      ? 'Última reseña lista'
      : 'Perfil listo para compartir',
  ].filter(Boolean);
  const shareSummary = [
    `${user?.name || 'B-Side'} en B-Side`,
    `@${user?.handle || review?.user || 'bside'}`,
    review?.album || review?.albumTitle
      ? `Última reseña: ${reviewTitle}`
      : 'Perfil listo para compartir',
    review?.text ? `"${review.text}"` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const handleShare = async () => {
    try {
      await Share.share({
        title: `${user?.name || 'B-Side'} · B-Side`,
        message: shareSummary,
      });
    } catch (error) {
      console.warn('No pudimos abrir el share del perfil:', error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(insets.top + 12, 24),
            paddingBottom: Math.max(insets.bottom + 20, 28),
          },
        ]}>
        <View style={styles.modalStack}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X color="white" size={22} />
            </TouchableOpacity>
          </View>

          <View style={styles.cardShell}>
            <LinearGradient
              colors={theme.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}>
              {theme.wallpaperUrl ? (
                <Image
                  key={theme.wallpaperUrl}
                  source={{ uri: theme.wallpaperUrl }}
                  style={styles.wallpaper}
                  resizeMode="cover"
                />
              ) : null}

              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: `rgba(4, 5, 10, ${theme.overlay})` },
                ]}
              />

              <View
                style={[
                  styles.brandBadge,
                  {
                    borderColor: `${theme.accent}55`,
                    backgroundColor: `${theme.accent}1F`,
                  },
                ]}>
                <Disc color="white" size={20} />
                <Text style={styles.brandText}>B-SIDE</Text>
              </View>

              <View
                style={[
                  styles.avatarShell,
                  {
                    borderColor: `${theme.accent}44`,
                    backgroundColor: `${theme.accent}18`,
                  },
                ]}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: user?.avatarColor || theme.accent },
                  ]}>
                  {user?.avatarUrl ? (
                    <Image
                      key={user.avatarUrl}
                      source={{ uri: user.avatarUrl }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>{profileInitial}</Text>
                  )}
                </View>
              </View>

              <View style={styles.content}>
                <Text style={styles.profileName}>{user?.name || 'B-Side'}</Text>
                <Text style={[styles.userName, { color: theme.accent }]}>
                  @{user?.handle || review?.user || 'marianitooo'}
                </Text>
                <Text style={styles.bio} numberOfLines={2}>
                  {user?.bio || 'Chequeá mi perfil en B-Side.'}
                </Text>
              </View>

              <View style={styles.statsRow}>
                {profileStats.map((item) => (
                  <View
                    key={item}
                    style={[
                      styles.statPill,
                      {
                        borderColor: `${theme.accent}33`,
                        backgroundColor: 'rgba(7, 10, 18, 0.45)',
                      },
                    ]}>
                    <Text style={styles.statText}>{item}</Text>
                  </View>
                ))}
              </View>

              <View
                style={[
                  styles.reviewHighlight,
                  {
                    borderColor: `${theme.accent}33`,
                    backgroundColor: `${theme.accent}12`,
                  },
                ]}>
                <View style={styles.reviewHighlightHeader}>
                  <Sparkles color={theme.accent} size={16} />
                  <Text style={[styles.reviewHighlightEyebrow, { color: theme.accent }]}>
                    ACTIVIDAD RECIENTE
                  </Text>
                </View>
                <Text style={styles.reviewHighlightTitle}>{reviewTitle}</Text>
                <Text style={styles.quote} numberOfLines={3}>
                  "{reviewQuote}"
                </Text>
              </View>
            </LinearGradient>
          </View>

          <TouchableOpacity
            style={[styles.shareBtn, { borderColor: `${theme.accent}55` }]}
            onPress={() => void handleShare()}>
            <Share2 color="white" size={22} />
            <Text style={styles.shareBtnText}>Compartir perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalStack: {
    width: '100%',
    alignItems: 'center',
  },
  topBar: {
    width: width * 0.85,
    maxWidth: 420,
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  closeBtn: {
    backgroundColor: '#111827',
    padding: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 30,
    elevation: 12,
  },
  cardShell: {
    width: width * 0.85,
    maxWidth: 420,
    borderRadius: 35,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 25,
    elevation: 15,
  },
  card: {
    minHeight: 420,
    borderRadius: 35,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  wallpaper: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.38,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  brandText: {
    color: 'white',
    fontWeight: '900',
    letterSpacing: 4,
    fontSize: 16,
  },
  avatarShell: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: '900',
  },
  content: {
    alignItems: 'center',
  },
  profileName: {
    color: 'white',
    fontSize: 31,
    fontWeight: '900',
    textAlign: 'center',
  },
  userName: {
    fontWeight: '800',
    fontSize: 16,
    marginTop: 8,
  },
  bio: {
    color: '#E5E7EB',
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 18,
    maxWidth: 330,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  statPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  reviewHighlight: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  reviewHighlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  reviewHighlightEyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  reviewHighlightTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  quote: {
    color: '#F3E8FF',
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
  },
  shareBtn: {
    backgroundColor: '#E1306C',
    flexDirection: 'row',
    paddingVertical: 18,
    width: width * 0.85,
    maxWidth: 420,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    borderWidth: 1,
  },
  shareBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },
});

export default ShareReviewCard;
