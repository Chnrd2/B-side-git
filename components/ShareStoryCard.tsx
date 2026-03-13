import React from 'react';
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Copy, Disc, Instagram, Share2, X } from 'lucide-react-native';

import { buildProfileTheme } from '../data/appState';

const { width, height } = Dimensions.get('window');

const ShareStoryCard = ({ visible, onClose, albums, username, user }) => {
  if (!visible) return null;

  const theme = buildProfileTheme(user);
  const safeAlbums =
    albums.length > 0
      ? [...albums, ...albums, ...albums, ...albums].slice(0, 4)
      : [null, null, null, null];

  return (
    <Modal animationType="fade" transparent={true} visible={visible}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeArea} onPress={onClose}>
          <View style={styles.closeBtn}>
            <X color="white" size={24} />
          </View>
        </TouchableOpacity>

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
              { backgroundColor: `${theme.accent}22`, borderColor: `${theme.accent}55` },
            ]}>
            <Disc color="#F3E8FF" size={34} />
            <Text style={styles.appName}>B-SIDE</Text>
          </View>

          <View style={styles.gridContainer}>
            <View style={styles.row}>
              <AlbumTile album={safeAlbums[0]} />
              <View style={styles.gridGap} />
              <AlbumTile album={safeAlbums[1]} />
            </View>
            <View style={styles.gridGap} />
            <View style={styles.row}>
              <AlbumTile album={safeAlbums[2]} />
              <View style={styles.gridGap} />
              <AlbumTile album={safeAlbums[3]} />
            </View>
          </View>

          <View style={styles.footerText}>
            <Text style={styles.title}>MI LADO B</Text>
            <Text style={[styles.handle, { color: theme.accent }]}>
              @{username}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.iconBtn}>
            <Copy color="white" size={22} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, styles.instaBtn]}
            onPress={() => alert('Abriendo Instagram!')}>
            <Instagram color="white" size={28} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn}>
            <Share2 color="white" size={22} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const AlbumTile = ({ album }) => {
  if (!album?.cover) {
    return (
      <View style={styles.placeholderTile}>
        <Disc color="#C4B5FD" size={22} />
      </View>
    );
  }

  return <Image source={{ uri: album.cover }} style={styles.img} />;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeArea: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  closeBtn: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  card: {
    width: width * 0.85,
    height: height * 0.68,
    borderRadius: 35,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  wallpaper: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  logoContainer: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  appName: {
    color: 'white',
    fontWeight: '900',
    fontSize: 20,
    marginTop: 8,
    letterSpacing: 3,
  },
  gridContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row' },
  gridGap: {
    width: 15,
    height: 15,
  },
  img: {
    width: 125,
    height: 125,
    borderRadius: 16,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  placeholderTile: {
    width: 125,
    height: 125,
    borderRadius: 16,
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: { alignItems: 'center', marginBottom: 10 },
  title: {
    color: 'white',
    fontWeight: '900',
    fontSize: 28,
    fontStyle: 'italic',
    marginBottom: 5,
    letterSpacing: -1,
  },
  handle: { fontSize: 16, fontWeight: '800' },
  actionsRow: {
    flexDirection: 'row',
    gap: 25,
    marginTop: 35,
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
