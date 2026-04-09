import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Disc, Headphones, Music4, UserRound } from 'lucide-react-native';

const ICON_BY_VARIANT = {
  album: Disc,
  artist: Music4,
  track: Headphones,
  user: UserRound,
};

const DEFAULT_LABEL_BY_VARIANT = {
  album: 'Sin portada',
  artist: 'Sin foto',
  track: 'Sin arte',
  user: 'Sin foto',
};

const SafeArtwork = ({
  uri = '',
  style,
  variant = 'album',
  label = '',
  resizeMode = 'cover',
  iconColor = '#C4B5FD',
  showLabel = false,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  const ArtworkIcon = ICON_BY_VARIANT[variant] || Disc;
  const resolvedLabel = label || DEFAULT_LABEL_BY_VARIANT[variant] || 'Sin imagen';
  const shouldRenderImage = Boolean(uri) && !hasError;

  if (shouldRenderImage) {
    return (
      <Image
        source={{ uri }}
        style={style}
        resizeMode={resizeMode}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <View style={[style, styles.fallback]}>
      <ArtworkIcon color={iconColor} size={20} />
      {showLabel ? <Text style={styles.fallbackText}>{resolvedLabel}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  fallbackText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});

export default SafeArtwork;
