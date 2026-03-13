import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { buildProfileTheme } from '../data/appState';

const AppBackground = ({ user }) => {
  const theme = buildProfileTheme(user);

  return (
    <View pointerEvents="none" style={styles.container}>
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
          blurRadius={14}
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
          styles.orb,
          styles.topOrb,
          { backgroundColor: `${theme.accent}33` },
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.bottomOrb,
          { backgroundColor: `${theme.accent}22` },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  wallpaper: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.45,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  topOrb: {
    width: 320,
    height: 320,
    top: -120,
    right: -90,
  },
  bottomOrb: {
    width: 260,
    height: 260,
    bottom: -80,
    left: -80,
  },
});

export default AppBackground;
