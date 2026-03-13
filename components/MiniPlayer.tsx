import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Platform, Modal, Animated } from 'react-native';
import { Play, Pause, X, ChevronDown, SkipBack, SkipForward, Repeat, Share2 } from 'lucide-react-native';
import { Audio } from 'expo-av';
// ACÁ ESTÁ EL CAMBIO DE LIBRERÍA:
import { Slider } from '@miblanchard/react-native-slider';

// --- VISUALIZER ---
const Visualizer = ({ isPlaying }) => {
  const anim1 = useRef(new Animated.Value(0.2)).current;
  const anim2 = useRef(new Animated.Value(0.2)).current;
  const anim3 = useRef(new Animated.Value(0.2)).current;
  const anim4 = useRef(new Animated.Value(0.2)).current;

  // Se usa React.useMemo para evitar advertencias de ESLint si no importaste useMemo arriba
  const anims = React.useMemo(() => [anim1, anim2, anim3, anim4], [anim1, anim2, anim3, anim4]);

  useEffect(() => {
    if (isPlaying) {
      const animations = anims.map(anim => 
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: Math.random() * 500 + 400, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0.2, duration: Math.random() * 500 + 400, useNativeDriver: false }),
          ])
        )
      );
      animations.forEach(a => a.start());
      return () => animations.forEach(a => a.stop());
    }
  }, [isPlaying, anims]);

  return (
    <View style={styles.vizContainer}>
      {anims.map((anim, i) => (
        <Animated.View key={i} style={[styles.vizBar, { height: anim.interpolate({ inputRange: [0, 1], outputRange: [5, 40] }) }]} />
      ))}
    </View>
  );
};

// --- MINI PLAYER PRINCIPAL ---
const MiniPlayer = ({ currentTrack, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const soundRef = useRef(null);

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) setIsPlaying(false);
    }
  };

  const playSound = useCallback(async (url) => {
    setIsLoading(true);
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      setIsPlaying(true);
    } catch (error) {
      console.error("Error en audio:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const togglePlayPause = async () => {
    if (!soundRef.current) return;
    if (isPlaying) await soundRef.current.pauseAsync();
    else await soundRef.current.playAsync();
  };

  const handleSeek = async (value) => {
    if (soundRef.current) await soundRef.current.setPositionAsync(value);
  };

  useEffect(() => {
    if (currentTrack?.previewUrl) {
      playSound(currentTrack.previewUrl);
    }
    return () => { 
      if (soundRef.current) soundRef.current.unloadAsync(); 
    };
  }, [currentTrack, playSound]);

  if (!currentTrack) return null;

  const formatTime = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <>
      {/* MINI PLAYER VIEW */}
      {!isExpanded && (
        <TouchableOpacity style={styles.miniContainer} onPress={() => setIsExpanded(true)} activeOpacity={0.9}>
          <Image source={{ uri: currentTrack.cover }} style={styles.miniCover} />
          <View style={styles.miniInfo}>
            <Text style={styles.miniTitle} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.miniArtist}>{isLoading ? "Cargando..." : currentTrack.artist}</Text>
          </View>
          <TouchableOpacity onPress={togglePlayPause} style={styles.miniPlayBtn}>
            {isLoading ? <ActivityIndicator color="#8A2BE2" size="small" /> : isPlaying ? <Pause color="white" fill="white" size={22} /> : <Play color="white" fill="white" size={22} />}
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* FULL PLAYER MODAL */}
      <Modal visible={isExpanded} animationType="slide" transparent={false}>
        <View style={styles.fullContainer}>
          <View style={styles.fullHeader}>
            <TouchableOpacity onPress={() => setIsExpanded(false)}><ChevronDown color="white" size={30} /></TouchableOpacity>
            <Text style={styles.fullHeaderText}>Reproduciendo</Text>
            <TouchableOpacity><Share2 color="white" size={22} /></TouchableOpacity>
          </View>

          <Image source={{ uri: currentTrack.cover }} style={styles.fullCover} />

          <View style={styles.fullMeta}>
            <View style={{flex: 1}}>
              <Text style={styles.fullTitle}>{currentTrack.title}</Text>
              <Text style={styles.fullArtist}>{currentTrack.artist}</Text>
            </View>
            <Visualizer isPlaying={isPlaying} />
          </View>

          <View style={styles.sliderContainer}>
            <Slider
              minimumValue={0}
              maximumValue={duration || 1}
              value={position}
              minimumTrackTintColor="#8A2BE2"
              maximumTrackTintColor="#333"
              thumbTintColor="#8A2BE2"
              // LA NUEVA LIBRERÍA DEVUELVE UN ARRAY [valor], POR ESO EL [0]
              onSlidingComplete={(val) => handleSeek(val[0])} 
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity><Repeat color="#555" size={24} /></TouchableOpacity>
            <TouchableOpacity><SkipBack color="white" fill="white" size={32} /></TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause} style={styles.bigPlayBtn}>
              {isPlaying ? <Pause color="black" fill="black" size={35} /> : <Play color="black" fill="black" size={35} />}
            </TouchableOpacity>
            <TouchableOpacity><SkipForward color="white" fill="white" size={32} /></TouchableOpacity>
            <TouchableOpacity onPress={() => { if(soundRef.current) soundRef.current.unloadAsync(); onClose(); setIsExpanded(false); }}><X color="#555" size={24} /></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  miniContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, left: 15, right: 15, backgroundColor: '#111', borderRadius: 18, flexDirection: 'row', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: '#222', zIndex: 9998 },
  miniCover: { width: 45, height: 45, borderRadius: 10 },
  miniInfo: { flex: 1, marginLeft: 12 },
  miniTitle: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  miniArtist: { color: '#8A2BE2', fontSize: 12 },
  miniPlayBtn: { marginRight: 10 },
  fullContainer: { flex: 1, backgroundColor: '#000', padding: 30 },
  fullHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  fullHeaderText: { color: 'white', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  fullCover: { width: '100%', aspectRatio: 1, borderRadius: 20, marginTop: 40 },
  fullMeta: { marginTop: 40, flexDirection: 'row', alignItems: 'center' },
  fullTitle: { color: 'white', fontSize: 26, fontWeight: '900' },
  fullArtist: { color: '#8A2BE2', fontSize: 18, marginTop: 5, fontWeight: 'bold' },
  vizContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 40, width: 40 },
  vizBar: { width: 4, backgroundColor: '#8A2BE2', borderRadius: 2 },
  sliderContainer: { marginTop: 30 },
  timeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  timeText: { color: '#666', fontSize: 12 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 },
  bigPlayBtn: { backgroundColor: 'white', width: 75, height: 75, borderRadius: 40, justifyContent: 'center', alignItems: 'center' }
});

export default MiniPlayer;