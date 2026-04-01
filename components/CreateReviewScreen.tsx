import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { X, Star, Headphones } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const CreateReviewScreen = ({
  visible,
  initialAlbum,
  initialText,
  initialRating,
  contextType,
  onCancel,
  onPublish,
}) => {
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const isWhileListening = contextType === 'while-listening';
  const canPublish = Boolean(initialAlbum?.title && text.trim() && rating > 0);

  useEffect(() => {
    if (visible) {
      setText(initialText || '');
      setRating(initialRating || 0);
    }
  }, [initialRating, initialText, visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <X color="white" size={24} />
            </TouchableOpacity>

            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>
                {initialText ? 'Editar' : 'Reseñar'}
              </Text>
              {isWhileListening ? (
                <View style={styles.contextBadge}>
                  <Headphones color="#C4B5FD" size={14} />
                  <Text style={styles.contextBadgeText}>
                    Mientras suena
                  </Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              disabled={!canPublish}
              onPress={() =>
                onPublish({
                  album: initialAlbum?.title,
                  text,
                  rating,
                })
              }>
              <LinearGradient
                colors={
                  canPublish
                    ? ['#A855F7', '#8A2BE2']
                    : ['#374151', '#1F2937']
                }
                style={styles.publishBtn}>
                <Text style={styles.publishText}>Publicar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.albumInfo}>
            {initialAlbum?.cover ? (
              <Image source={{ uri: initialAlbum.cover }} style={styles.albumCover} />
            ) : null}
            <Text style={styles.albumTitle} numberOfLines={1}>
              {initialAlbum?.title}
            </Text>

            <View style={styles.ratingContainer}>
              <View style={styles.starsVisual}>
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <View key={starValue} style={styles.starWrapper}>
                    <Star
                      color={starValue <= Math.ceil(rating) ? '#FFD700' : '#333'}
                      fill={
                        starValue <= Math.floor(rating) ? '#FFD700' : 'transparent'
                      }
                      size={40}
                    />
                    {starValue - 0.5 === rating ? (
                      <View style={styles.halfStarOverlay}>
                        <Star color="#FFD700" fill="#FFD700" size={40} />
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>

              <View style={styles.touchZones}>
                {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={styles.touchZone}
                    onPress={() => setRating(value)}
                  />
                ))}
              </View>
            </View>

            <Text style={styles.ratingNumber}>
              {rating > 0 ? `${rating} estrellas` : 'Toca para calificar'}
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder={
              isWhileListening
                ? '¿Qué te está pegando de este tema justo ahora?'
                : 'Escribí tu reseña acá...'
            }
            placeholderTextColor="#555"
            multiline={true}
            value={text}
            onChangeText={setText}
            autoFocus={true}
          />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, padding: 20, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerCopy: {
    alignItems: 'center',
    gap: 6,
  },
  closeBtn: { padding: 5 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '900' },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.24)',
    backgroundColor: 'rgba(88, 28, 135, 0.28)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  contextBadgeText: {
    color: '#E9D5FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  publishBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  publishText: { color: 'white', fontWeight: 'bold' },
  albumInfo: { alignItems: 'center', marginBottom: 20 },
  albumCover: {
    width: 120,
    height: 120,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  albumTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 20,
  },
  ratingContainer: {
    position: 'relative',
    width: 220,
    height: 40,
    marginBottom: 10,
  },
  starsVisual: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    position: 'absolute',
  },
  starWrapper: { position: 'relative' },
  halfStarOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 20,
    overflow: 'hidden',
  },
  touchZones: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  touchZone: { flex: 1 },
  ratingNumber: { color: '#8A2BE2', fontWeight: 'bold', fontSize: 16 },
  input: {
    color: 'white',
    fontSize: 20,
    lineHeight: 28,
    textAlignVertical: 'top',
    flex: 1,
    marginTop: 20,
  },
});

export default CreateReviewScreen;

