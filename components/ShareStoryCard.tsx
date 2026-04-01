import React from 'react';
import {
  Alert,
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
import { Copy, Disc, Instagram, Share2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildProfileTheme } from '../data/appState';

const { width, height } = Dimensions.get('window');

const StoryAlbumTile = ({ album, rank, compact = false }) => {
  const shellStyle = compact ? styles.compactTileShell : styles.largeTileShell;
  const imageStyle = compact ? styles.compactImage : styles.largeImage;
  const placeholderAccent = compact
    ? 'rgba(168,85,247,0.18)'
    : 'rgba(244,114,182,0.18)';

  return (
    <View style={[styles.tileShell, shellStyle]}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>

      {album?.cover ? (
        <Image source={{ uri: album.cover }} style={imageStyle} />
      ) : (
        <View
          style={[
            styles.placeholderTile,
            imageStyle,
            { backgroundColor: placeholderAccent },
          ]}>
          <Disc color="#E9D5FF" size={compact ? 20 : 24} />
          <Text style={styles.placeholderRank}>#{rank}</Text>
        </View>
      )}

      <View style={styles.tileCopy}>
        <Text style={styles.tileTitle} numberOfLines={1}>
          {album?.title || 'Tu próximo fijo'}
        </Text>
        <Text style={styles.tileArtist} numberOfLines={1}>
          {album?.artist || 'Elegí un disco'}
        </Text>
      </View>
    </View>
  );
};

const ShareStoryCard = ({ visible, onClose, albums = [], username, user }) => {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const theme = buildProfileTheme(user);
  const topFive = [...albums.slice(0, 5)];

  while (topFive.length < 5) {
    topFive.push(null);
  }

  const safeUsername = `${username || user?.handle || ''}`.replace('@', '');
  const shareSummary = [
    'Mi lado B en B-Side',
    `@${safeUsername}`,
    ...topFive
      .filter(Boolean)
      .map(
        (album, index) =>
          `#${index + 1} ${album.title} · ${album.artist || 'Artista por confirmar'}`
      ),
  ].join('\n');

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Mi Top 5 en B-Side',
        message: shareSummary,
      });
    } catch (error) {
      console.warn('No pudimos compartir la story del Top 5:', error);
    }
  };

  const handleCopySummary = async () => {
    try {
      if (globalThis?.navigator?.clipboard?.writeText) {
        await globalThis.navigator.clipboard.writeText(shareSummary);
        Alert.alert('Copiado', 'Tu resumen del Top 5 quedó copiado.');
        return;
      }
    } catch (error) {
      // fallback below
    }

    Alert.alert(
      'Copiar resumen',
      'En este dispositivo no pudimos copiarlo directo. Podés compartirlo desde el botón central.'
    );
  };

  const handleInstagramShare = async () => {
    Alert.alert(
      'Compartir en Instagram',
      'De momento abrimos el share nativo para que lo mandes a Stories o a la app que prefieras.'
    );
    await handleShare();
  };

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(insets.top + 12, 24),
            paddingBottom: Math.max(insets.bottom + 20, 28),
          },
        ]}>
        <View style={styles.modalStack}>
          <View style={styles.closeBar}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X color="white" size={22} />
            </TouchableOpacity>
          </View>

          <LinearGradient colors={theme.colors} style={styles.card}>
            {theme.wallpaperUrl ? (
              <Image
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
                styles.logoContainer,
                {
                  backgroundColor: `${theme.accent}22`,
                  borderColor: `${theme.accent}55`,
                },
              ]}>
              <Disc color="#F3E8FF" size={22} />
              <Text style={styles.appName}>B-SIDE</Text>
            </View>

            <View style={styles.headerBlock}>
              <Text style={styles.eyebrow}>TU TOP 5 HISTÓRICO</Text>
              <Text style={styles.title}>MI LADO B</Text>
              <Text style={[styles.handle, { color: theme.accent }]}>@{safeUsername}</Text>
            </View>

            <View style={styles.gridContainer}>
              <View style={styles.topRow}>
                {topFive.slice(0, 3).map((album, index) => (
                  <StoryAlbumTile
                    key={`top-${index}`}
                    album={album}
                    rank={index + 1}
                    compact
                  />
                ))}
              </View>

              <View style={styles.bottomRow}>
                {topFive.slice(3, 5).map((album, index) => (
                  <StoryAlbumTile
                    key={`bottom-${index}`}
                    album={album}
                    rank={index + 4}
                  />
                ))}
              </View>
            </View>

            <Text style={styles.caption}>
              Cinco discos para contar de dónde viene tu gusto.
            </Text>
          </LinearGradient>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => void handleCopySummary()}>
              <Copy color="white" size={22} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconBtn, styles.instaBtn]}
              onPress={() => void handleInstagramShare()}>
              <Instagram color="white" size={28} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={() => void handleShare()}>
              <Share2 color="white" size={22} />
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 16,
  },
  modalStack: {
    width: '100%',
    alignItems: 'center',
  },
  closeBar: {
    width: width * 0.88,
    maxWidth: 760,
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  closeBtn: {
    backgroundColor: '#111827',
    borderRadius: 999,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 20,
    elevation: 10,
  },
  card: {
    width: width * 0.88,
    maxWidth: 760,
    minHeight: Math.min(height * 0.82, 760),
    borderRadius: 35,
    paddingVertical: 28,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    gap: 22,
  },
  wallpaper: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  appName: {
    color: 'white',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 3,
  },
  headerBlock: {
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  title: {
    color: 'white',
    fontWeight: '900',
    fontSize: 30,
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  handle: {
    fontSize: 16,
    fontWeight: '800',
  },
  gridContainer: {
    width: '100%',
    gap: 22,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bottomRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 16,
  },
  tileShell: {
    alignItems: 'center',
    gap: 10,
  },
  compactTileShell: {
    width: '31.5%',
  },
  largeTileShell: {
    width: '41%',
  },
  compactImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: '#080B14',
  },
  largeImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 22,
    backgroundColor: '#080B14',
  },
  placeholderTile: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 14, 24, 0.82)',
  },
  rankBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(7,10,18,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rankText: {
    color: '#E9D5FF',
    fontSize: 11,
    fontWeight: '900',
  },
  tileCopy: {
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  tileTitle: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
    width: '100%',
  },
  tileArtist: {
    color: '#C4B5FD',
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
  placeholderRank: {
    marginTop: 8,
    color: '#F5F3FF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  caption: {
    color: '#E5E7EB',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 'auto',
    paddingHorizontal: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 25,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    backgroundColor: '#111827',
    width: 55,
    height: 55,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  instaBtn: {
    backgroundColor: '#E1306C',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 0,
  },
});

export default ShareStoryCard;
