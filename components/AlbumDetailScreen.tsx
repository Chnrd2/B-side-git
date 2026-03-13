import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronDown,
  Disc,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Send,
} from 'lucide-react-native';

const AlbumDetailScreen = ({
  album,
  onClose,
  onPlaySong,
  onPinToTop5,
  isPinned,
  onWriteReview,
  onAddToList,
  onShareAlbum,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const handlePlayToggle = () => {
    if (onPlaySong && album.previewUrl) {
      setIsLoadingAudio(true);
      onPlaySong(album);
      setIsPlaying(true);
      setTimeout(() => setIsLoadingAudio(false), 800);
      return;
    }

    Alert.alert(
      'Preview no disponible',
      'No hay preview disponible para este tema.'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <ChevronDown color="white" size={32} />
          </TouchableOpacity>
        </View>

        <View style={styles.coverContainer}>
          <Image source={{ uri: album.cover }} style={styles.coverImage} />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {album.title}
          </Text>
          <Text style={styles.artist}>{album.artist}</Text>

          <TouchableOpacity
            style={[styles.playBtnBig, !album.previewUrl && { opacity: 0.5 }]}
            onPress={handlePlayToggle}
            activeOpacity={0.8}>
            {isLoadingAudio ? (
              <ActivityIndicator color="black" />
            ) : isPlaying ? (
              <Pause color="black" fill="black" size={24} />
            ) : (
              <Play
                color="black"
                fill="black"
                size={24}
                style={{ marginLeft: 4 }}
              />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={onPinToTop5}>
            <Disc color={isPinned ? '#A855F7' : 'white'} size={28} />
            <Text style={[styles.actionText, isPinned && { color: '#A855F7' }]}>
              {isPinned ? 'Fijado' : 'Fijar Top 5'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onWriteReview}>
            <MessageSquare color="white" size={28} />
            <Text style={styles.actionText}>Reseñar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onAddToList}>
            <Plus color="white" size={32} />
            <Text style={styles.actionText}>A Lista</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onShareAlbum(album)}>
            <Send color="white" size={28} />
            <Text style={styles.actionText}>Enviar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tracklistContainer}>
          <Text style={styles.sectionTitle}>Canciones Populares</Text>
          {[1, 2, 3, 4, 5].map((num) => (
            <View key={num} style={styles.trackItem}>
              <Text style={styles.trackNumber}>{num}</Text>
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle}>Track {num} (Preview)</Text>
                <Text style={styles.trackDuration}>0:30</Text>
              </View>
              <TouchableOpacity style={styles.trackPlayBtn}>
                <Play color="#666" size={20} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  closeBtn: { padding: 5 },
  coverContainer: {
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#A855F7',
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
  },
  coverImage: { width: 280, height: 280, borderRadius: 20 },
  infoContainer: { paddingHorizontal: 25, marginTop: 30, alignItems: 'center' },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 5,
  },
  artist: { color: '#A855F7', fontSize: 18, fontWeight: 'bold' },
  playBtnBig: {
    backgroundColor: 'white',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    paddingBottom: 30,
  },
  actionBtn: { alignItems: 'center' },
  actionText: { color: 'white', fontSize: 12, marginTop: 8, fontWeight: '600' },
  tracklistContainer: { paddingHorizontal: 25, marginTop: 30 },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  trackItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  trackNumber: { color: '#666', fontSize: 16, fontWeight: 'bold', width: 30 },
  trackInfo: { flex: 1 },
  trackTitle: { color: 'white', fontSize: 16, fontWeight: '500' },
  trackDuration: { color: '#666', fontSize: 13, marginTop: 4 },
  trackPlayBtn: { padding: 10 },
});

export default AlbumDetailScreen;
