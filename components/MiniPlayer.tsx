import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronDown,
  Headphones,
  Pause,
  Play,
  Repeat,
  Share2,
  SkipBack,
  SkipForward,
  X,
} from 'lucide-react-native';
import { Audio } from 'expo-av';
import { Slider } from '@miblanchard/react-native-slider';

const Visualizer = ({ isPlaying }) => {
  const anim1 = useRef(new Animated.Value(0.2)).current;
  const anim2 = useRef(new Animated.Value(0.2)).current;
  const anim3 = useRef(new Animated.Value(0.2)).current;
  const anim4 = useRef(new Animated.Value(0.2)).current;
  const anims = useMemo(() => [anim1, anim2, anim3, anim4], [anim1, anim2, anim3, anim4]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const animations = anims.map((anim) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: Math.random() * 500 + 400,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0.2,
            duration: Math.random() * 500 + 400,
            useNativeDriver: false,
          }),
        ])
      )
    );

    animations.forEach((animation) => animation.start());

    return () => animations.forEach((animation) => animation.stop());
  }, [anims, isPlaying]);

  return (
    <View style={styles.vizContainer}>
      {anims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.vizBar,
            {
              height: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [5, 40],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const MiniPlayer = ({ currentTrack, onClose, onOpenReview }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const soundRef = useRef(null);
  const isDesktopWeb = Platform.OS === 'web';

  const onPlaybackStatusUpdate = (status) => {
    if (!status.isLoaded) {
      return;
    }

    setPosition(status.positionMillis);
    setDuration(status.durationMillis);
    setIsPlaying(status.isPlaying);

    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  };

  const playSound = useCallback(async (url) => {
    setIsLoading(true);

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error en audio:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const togglePlayPause = async () => {
    if (!soundRef.current) {
      return;
    }

    if (isPlaying) {
      await soundRef.current.pauseAsync();
      return;
    }

    await soundRef.current.playAsync();
  };

  const handleSeek = async (value) => {
    if (!soundRef.current) {
      return;
    }

    await soundRef.current.setPositionAsync(value);
  };

  const closePlayer = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    setIsExpanded(false);
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (currentTrack?.previewUrl) {
      void playSound(currentTrack.previewUrl);
    }

    return () => {
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
      }
    };
  }, [currentTrack, playSound]);

  useEffect(() => {
    if (!currentTrack) {
      setIsExpanded(false);
      setIsPlaying(false);
    }
  }, [currentTrack]);

  if (!currentTrack?.previewUrl) {
    return null;
  }

  const formatTime = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <>
      {!isExpanded ? (
        <TouchableOpacity
          style={styles.miniContainer}
          onPress={() => setIsExpanded(true)}
          activeOpacity={0.92}>
          <Image source={{ uri: currentTrack.cover }} style={styles.miniCover} />

          <View style={styles.miniInfo}>
            <Text style={styles.miniTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.miniArtist} numberOfLines={1}>
              {isLoading ? 'Cargando...' : currentTrack.artist}
            </Text>
          </View>

          <TouchableOpacity
            onPress={(event) => {
              event?.stopPropagation?.();
              void togglePlayPause();
            }}
            style={styles.miniIconBtn}>
            {isLoading ? (
              <ActivityIndicator color="#8A2BE2" size="small" />
            ) : isPlaying ? (
              <Pause color="white" fill="white" size={22} />
            ) : (
              <Play color="white" fill="white" size={22} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(event) => {
              event?.stopPropagation?.();
              void closePlayer();
            }}
            style={styles.miniIconBtn}>
            <X color="#94A3B8" size={18} />
          </TouchableOpacity>
        </TouchableOpacity>
      ) : null}

      <Modal visible={isExpanded} animationType="slide" transparent={false}>
        <View style={styles.fullContainer}>
          <View style={styles.fullHeader}>
            <TouchableOpacity onPress={() => setIsExpanded(false)}>
              <ChevronDown color="white" size={30} />
            </TouchableOpacity>
            <Text style={styles.fullHeaderText}>Reproduciendo</Text>
            <TouchableOpacity>
              <Share2 color="white" size={22} />
            </TouchableOpacity>
          </View>

          <View style={styles.fullPanel}>
            <View style={styles.fullArtworkShell}>
              <Image source={{ uri: currentTrack.cover }} style={styles.fullCover} />
            </View>

            <View style={styles.fullMeta}>
              <View style={styles.fullMetaCopy}>
                <Text style={styles.fullTitle}>{currentTrack.title}</Text>
                <Text style={styles.fullArtist}>{currentTrack.artist}</Text>
              </View>
              {!isDesktopWeb ? <Visualizer isPlaying={isPlaying} /> : null}
            </View>

            <TouchableOpacity
              style={styles.reviewCta}
              onPress={() => {
                onOpenReview?.();
                setIsExpanded(false);
              }}>
              <Headphones color="#E9D5FF" size={18} />
              <Text style={styles.reviewCtaText}>Reseñar ahora</Text>
            </TouchableOpacity>

            <View style={styles.sliderContainer}>
              <Slider
                minimumValue={0}
                maximumValue={duration || 1}
                value={position}
                minimumTrackTintColor="#8A2BE2"
                maximumTrackTintColor="#333"
                thumbTintColor="#8A2BE2"
                onSlidingComplete={(value) => handleSeek(value[0])}
              />

              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>

            <View style={styles.controlsRow}>
              <TouchableOpacity>
                <Repeat color="#555" size={24} />
              </TouchableOpacity>
              <TouchableOpacity>
                <SkipBack color="white" fill="white" size={32} />
              </TouchableOpacity>
              <TouchableOpacity onPress={togglePlayPause} style={styles.bigPlayBtn}>
                {isPlaying ? (
                  <Pause color="black" fill="black" size={35} />
                ) : (
                  <Play color="black" fill="black" size={35} />
                )}
              </TouchableOpacity>
              <TouchableOpacity>
                <SkipForward color="white" fill="white" size={32} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => void closePlayer()}>
                <X color="#555" size={24} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  miniContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 15,
    right: 15,
    backgroundColor: '#111',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#222',
    zIndex: 9998,
  },
  miniCover: {
    width: 45,
    height: 45,
    borderRadius: 10,
  },
  miniInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  miniTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  miniArtist: {
    color: '#8A2BE2',
    fontSize: 12,
  },
  miniIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginLeft: 4,
  },
  fullContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 30,
  },
  fullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  fullHeaderText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fullPanel: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingTop: 28,
    paddingBottom: 20,
  },
  fullArtworkShell: {
    width: '100%',
    alignItems: 'center',
  },
  fullCover: {
    width: '100%',
    maxWidth: 420,
    aspectRatio: 1,
    borderRadius: 24,
    backgroundColor: '#0F172A',
  },
  fullMeta: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fullMetaCopy: {
    flex: 1,
  },
  fullTitle: {
    color: 'white',
    fontSize: 26,
    fontWeight: '900',
  },
  fullArtist: {
    color: '#8A2BE2',
    fontSize: 18,
    marginTop: 5,
    fontWeight: 'bold',
  },
  reviewCta: {
    marginTop: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.18)',
    backgroundColor: 'rgba(88, 28, 135, 0.28)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  reviewCtaText: {
    color: '#F5F3FF',
    fontWeight: '800',
    fontSize: 14,
  },
  vizContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 40,
    width: 40,
  },
  vizBar: {
    width: 4,
    backgroundColor: '#8A2BE2',
    borderRadius: 2,
  },
  sliderContainer: {
    marginTop: 26,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  timeText: {
    color: '#666',
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 34,
  },
  bigPlayBtn: {
    backgroundColor: 'white',
    width: 75,
    height: 75,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MiniPlayer;
