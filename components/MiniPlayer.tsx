import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Share,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  triggerErrorFeedback,
  triggerSelectionFeedback,
} from '../lib/feedback';
import SafeArtwork from './SafeArtwork';

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

const formatTime = (millis = 0) => {
  const safeMillis = Number(millis) || 0;
  const minutes = Math.floor(safeMillis / 60000);
  const seconds = Math.floor((safeMillis % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const MiniPlayer = ({ currentTrack, onClose, onOpenReview }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioFeedback, setAudioFeedback] = useState('');

  const soundRef = useRef(null);
  const isDesktopWeb = Platform.OS === 'web';
  const insets = useSafeAreaInsets();

  const shareCurrentTrack = useCallback(async () => {
    if (!currentTrack) {
      return;
    }

    try {
      await Share.share({
        title: `${currentTrack.title} · ${currentTrack.artist}`,
        message: `${currentTrack.title} · ${currentTrack.artist}${
          currentTrack.externalUrl ? `\n${currentTrack.externalUrl}` : ''
        }`,
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('No pudimos compartir el track actual:', error);
      }
    }
  }, [currentTrack]);

  const onPlaybackStatusUpdate = (status) => {
    if (!status.isLoaded) {
      return;
    }

    setPosition(status.positionMillis || 0);
    setDuration(status.durationMillis || 0);
    setIsPlaying(Boolean(status.isPlaying));

    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  };

  const unloadSound = useCallback(async () => {
    if (!soundRef.current) {
      return;
    }

    try {
      await soundRef.current.unloadAsync();
    } catch (error) {
      if (__DEV__) {
        console.warn('No pudimos limpiar el audio anterior:', error);
      }
    } finally {
      soundRef.current = null;
    }
  }, []);

  const playSound = useCallback(async (url) => {
    if (!url) {
      setAudioFeedback('No hay audio disponible para esta muestra.');
      return;
    }

    setIsLoading(true);
    setAudioFeedback('');

    try {
      await unloadSound();
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      setIsPlaying(true);
    } catch (error) {
      setAudioFeedback('No pudimos reproducir esta muestra ahora mismo.');
      void triggerErrorFeedback();

      if (__DEV__) {
        console.error('Error en audio:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [unloadSound]);

  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) {
      return;
    }

    if (isPlaying) {
      await soundRef.current.pauseAsync();
      return;
    }

    await soundRef.current.playAsync();
  }, [isPlaying]);

  const handleSeek = useCallback(async (value) => {
    if (!soundRef.current) {
      return;
    }

    await soundRef.current.setPositionAsync(Number(value) || 0);
  }, []);

  const handleJump = useCallback(async (deltaMs) => {
    if (!soundRef.current || !duration) {
      return;
    }

    const nextPosition = Math.max(0, Math.min(duration, position + deltaMs));
    await handleSeek(nextPosition);
  }, [duration, handleSeek, position]);

  const handleRestart = useCallback(async () => {
    if (!soundRef.current) {
      return;
    }

    await handleSeek(0);

    if (!isPlaying) {
      await soundRef.current.playAsync();
    }
  }, [handleSeek, isPlaying]);

  const closePlayer = useCallback(async () => {
    await unloadSound();
    setIsExpanded(false);
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
    setAudioFeedback('');
    onClose?.();
  }, [onClose, unloadSound]);

  useEffect(() => {
    if (currentTrack?.previewUrl) {
      void playSound(currentTrack.previewUrl);
    } else {
      setAudioFeedback('');
    }

    return () => {
      void unloadSound();
    };
  }, [currentTrack, playSound, unloadSound]);

  useEffect(() => {
    if (!currentTrack) {
      setIsExpanded(false);
      setIsPlaying(false);
      setAudioFeedback('');
    }
  }, [currentTrack]);

  if (!currentTrack?.previewUrl) {
    return null;
  }

  return (
    <>
      {!isExpanded ? (
        <TouchableOpacity
          style={[styles.miniContainer, { bottom: Math.max(insets.bottom + 72, 88) }]}
          onPress={() => {
            void triggerSelectionFeedback();
            setIsExpanded(true);
          }}
          activeOpacity={0.92}
        >
          <SafeArtwork
            uri={currentTrack.cover}
            style={styles.miniCover}
            variant="track"
          />

          <View style={styles.miniInfo}>
            <Text style={styles.miniTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.miniArtist} numberOfLines={1}>
              {isLoading ? 'Cargando audio…' : currentTrack.artist}
            </Text>
            {audioFeedback ? (
              <Text style={styles.miniFeedback} numberOfLines={1}>
                {audioFeedback}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={(event) => {
              event?.stopPropagation?.();
              void triggerSelectionFeedback();
              void togglePlayPause();
            }}
            style={styles.miniIconBtn}
            activeOpacity={0.82}
          >
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
              void triggerSelectionFeedback();
              void closePlayer();
            }}
            style={styles.miniIconBtn}
            activeOpacity={0.82}
          >
            <X color="#94A3B8" size={18} />
          </TouchableOpacity>
        </TouchableOpacity>
      ) : null}

      <Modal visible={isExpanded} animationType="slide" transparent={false}>
        <View style={styles.fullContainer}>
          <View style={[styles.fullHeader, { paddingTop: Math.max(insets.top + 8, 24) }]}>
            <TouchableOpacity
              onPress={() => {
                void triggerSelectionFeedback();
                setIsExpanded(false);
              }}
              activeOpacity={0.82}
            >
              <ChevronDown color="white" size={30} />
            </TouchableOpacity>
            <Text style={styles.fullHeaderText}>Reproduciendo</Text>
            <TouchableOpacity onPress={() => void shareCurrentTrack()} activeOpacity={0.82}>
              <Share2 color="white" size={22} />
            </TouchableOpacity>
          </View>

          <View style={styles.fullPanel}>
            <View style={styles.fullArtworkShell}>
              <SafeArtwork
                uri={currentTrack.cover}
                style={styles.fullCover}
                variant="track"
                label="Sin portada"
                showLabel={true}
              />
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
                void triggerSelectionFeedback();
                onOpenReview?.();
                setIsExpanded(false);
              }}
              activeOpacity={0.88}
            >
              <Headphones color="#E9D5FF" size={18} />
              <Text style={styles.reviewCtaText}>Reseñar mientras suena</Text>
            </TouchableOpacity>

            {audioFeedback ? (
              <View style={styles.audioFeedbackCard}>
                <Text style={styles.audioFeedbackText}>{audioFeedback}</Text>
              </View>
            ) : null}

            <View style={styles.sliderContainer}>
              <Slider
                minimumValue={0}
                maximumValue={duration || 1}
                value={position}
                minimumTrackTintColor="#8A2BE2"
                maximumTrackTintColor="#333"
                thumbTintColor="#8A2BE2"
                onSlidingComplete={(value) =>
                  handleSeek(Array.isArray(value) ? value[0] : value)
                }
              />

              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>

            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={() => void handleRestart()} activeOpacity={0.82}>
                <Repeat color="#777" size={24} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => void handleJump(-10000)} activeOpacity={0.82}>
                <SkipBack color="white" fill="white" size={32} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void togglePlayPause()}
                style={styles.bigPlayBtn}
                activeOpacity={0.88}
              >
                {isPlaying ? (
                  <Pause color="black" fill="black" size={35} />
                ) : (
                  <Play color="black" fill="black" size={35} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => void handleJump(10000)} activeOpacity={0.82}>
                <SkipForward color="white" fill="white" size={32} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => void closePlayer()} activeOpacity={0.82}>
                <X color="#777" size={24} />
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
  miniFeedback: {
    color: '#FCA5A5',
    fontSize: 11,
    marginTop: 4,
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
    paddingHorizontal: Platform.OS === 'web' ? 32 : 24,
  },
  fullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
  },
  fullHeaderText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  fullPanel: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  fullArtworkShell: {
    alignItems: 'center',
  },
  fullCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 28,
    maxWidth: 360,
    alignSelf: 'center',
  },
  fullMeta: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
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
  audioFeedbackCard: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.18)',
    backgroundColor: 'rgba(69,10,10,0.26)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  audioFeedbackText: {
    color: '#FECACA',
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 12,
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
  },
  timeText: {
    color: '#888',
    fontSize: 12,
  },
  controlsRow: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bigPlayBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MiniPlayer;
