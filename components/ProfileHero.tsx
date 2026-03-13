import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Disc,
  Headphones,
  Settings,
  Share2,
} from 'lucide-react-native';

import { buildProfileTheme, canDisplayProfileAsset } from '../data/appState';

const ProfileHero = ({
  user,
  currentTrack,
  isPublic,
  onBack,
  onShareProfile,
  onOpenStory,
  onOpenSettings,
}) => {
  const theme = buildProfileTheme(user, {
    allowUnreviewedAssets: !isPublic,
  });
  const showAvatar = canDisplayProfileAsset(
    user?.avatarModerationStatus,
    !isPublic
  );

  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={theme.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
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

      {onBack ? (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
      ) : null}

      <View style={styles.topActions}>
        {!isPublic ? (
          <TouchableOpacity onPress={onShareProfile}>
            <Share2 color="white" size={22} />
          </TouchableOpacity>
        ) : null}
        {!isPublic ? (
          <TouchableOpacity style={styles.actionSpacing} onPress={onOpenStory}>
            <Disc color={theme.accent} size={22} />
          </TouchableOpacity>
        ) : null}
        {!isPublic ? (
          <TouchableOpacity
            style={styles.actionSpacing}
            onPress={onOpenSettings}>
            <Settings color="white" size={22} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={[styles.avatarGlow, { backgroundColor: `${theme.accent}44` }]}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: user?.avatarColor || theme.accent },
          ]}>
          {user?.avatarUrl && showAvatar ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
          )}
        </View>
      </View>

      <Text style={styles.name}>{user?.name}</Text>
      <Text style={[styles.handle, { color: theme.accent }]}>@{user?.handle}</Text>

      {!isPublic ? (
        <View style={styles.metaRow}>
          <View
            style={[
              styles.planBadge,
              {
                backgroundColor: `${theme.accent}22`,
                borderColor: `${theme.accent}55`,
              },
            ]}>
            <Text style={styles.planBadgeText}>
              {user?.plan === 'plus' ? 'Plan Plus' : 'Plan Free'}
            </Text>
          </View>
          {user?.email ? (
            <Text style={styles.emailText} numberOfLines={1}>
              {user.email}
            </Text>
          ) : null}
        </View>
      ) : null}

      {!isPublic && currentTrack ? (
        <View
          style={[
            styles.nowPlaying,
            {
              backgroundColor: `${theme.accent}22`,
              borderColor: `${theme.accent}44`,
            },
          ]}>
          <Headphones color={theme.accent} size={14} />
          <Text style={styles.nowPlayingText} numberOfLines={1}>
            Escuchando: {currentTrack.title}
          </Text>
        </View>
      ) : null}

      <Text style={styles.bio}>{user?.bio}</Text>
      <Text style={styles.hint}>
        {isPublic
          ? 'Este perfil tiene una ambientacion propia.'
          : user?.avatarModerationStatus === 'pending_review' ||
              user?.wallpaperModerationStatus === 'pending_review'
            ? 'Tus imagenes nuevas siguen en revision antes de quedar publicas.'
            : 'Tu foto, fondo y tema ya quedan guardados en local.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    minHeight: 360,
    alignItems: 'center',
    paddingTop: 68,
    paddingBottom: 32,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  wallpaper: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.48,
  },
  backButton: {
    position: 'absolute',
    top: 58,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(8, 10, 18, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topActions: {
    position: 'absolute',
    top: 60,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionSpacing: {
    marginLeft: 18,
  },
  avatarGlow: {
    padding: 5,
    borderRadius: 54,
    marginBottom: 16,
  },
  avatar: {
    width: 98,
    height: 98,
    borderRadius: 49,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 49,
  },
  avatarText: { color: 'white', fontSize: 34, fontWeight: '800' },
  name: { color: 'white', fontSize: 30, fontWeight: '900' },
  handle: { fontSize: 16, marginTop: 4, fontWeight: '800' },
  metaRow: {
    marginTop: 12,
    alignItems: 'center',
    gap: 10,
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  planBadgeText: {
    color: '#F5F3FF',
    fontSize: 12,
    fontWeight: '800',
  },
  emailText: {
    color: '#D1D5DB',
    maxWidth: 260,
  },
  nowPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 1,
  },
  nowPlayingText: {
    color: '#F3F4F6',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
    maxWidth: 220,
  },
  bio: {
    color: '#E5E7EB',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  hint: {
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
    fontSize: 12,
  },
});

export default ProfileHero;
