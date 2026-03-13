import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { X, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const CreateReviewScreen = ({ visible, initialAlbum, initialText, initialRating, onCancel, onPublish }) => {
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (visible) {
      setText(initialText || "");
      setRating(initialRating || 0);
    }
  }, [visible, initialText, initialRating]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}><X color="white" size={24} /></TouchableOpacity>
            <Text style={styles.headerTitle}>{initialText ? 'Editar' : 'Reseñar'}</Text>
            <TouchableOpacity onPress={() => onPublish({ album: initialAlbum?.title, text, rating })}>
              <LinearGradient colors={['#A855F7', '#8A2BE2']} style={styles.publishBtn}>
                <Text style={styles.publishText}>Publicar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <View style={styles.albumInfo}>
            {initialAlbum?.cover && <Image source={{ uri: initialAlbum.cover }} style={styles.albumCover} />}
            <Text style={styles.albumTitle} numberOfLines={1}>{initialAlbum?.title}</Text>
            
            {/* SISTEMA DE ESTRELLAS DECIMALES MAGNÉTICAS */}
            <View style={styles.ratingContainer}>
              <View style={styles.starsVisual}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <View key={s} style={styles.starWrapper}>
                    <Star color={s <= Math.ceil(rating) ? "#FFD700" : "#333"} fill={s <= Math.floor(rating) ? "#FFD700" : "transparent"} size={40} />
                    {/* Renderiza media estrella si el puntaje es x.5 */}
                    {s - 0.5 === rating && (
                      <View style={styles.halfStarOverlay}>
                        <Star color="#FFD700" fill="#FFD700" size={40} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
              
              {/* Grilla invisible para detectar el toque exacto */}
              <View style={styles.touchZones}>
                {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((val) => (
                  <TouchableOpacity key={val} style={styles.touchZone} onPress={() => setRating(val)} />
                ))}
              </View>
            </View>
            <Text style={styles.ratingNumber}>{rating > 0 ? `${rating} Estrellas` : 'Tocá para calificar'}</Text>
          </View>

          <TextInput style={styles.input} placeholder="Escribí tu reseña acá..." placeholderTextColor="#555" multiline value={text} onChangeText={setText} autoFocus />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  closeBtn: { padding: 5 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '900' },
  publishBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  publishText: { color: 'white', fontWeight: 'bold' },
  albumInfo: { alignItems: 'center', marginBottom: 20 },
  albumCover: { width: 120, height: 120, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  albumTitle: { color: 'white', fontSize: 24, fontWeight: '900', marginBottom: 20 },
  
  ratingContainer: { position: 'relative', width: 220, height: 40, marginBottom: 10 },
  starsVisual: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', position: 'absolute' },
  starWrapper: { position: 'relative' },
  halfStarOverlay: { position: 'absolute', left: 0, top: 0, width: 20, overflow: 'hidden' },
  touchZones: { flexDirection: 'row', width: '100%', height: '100%', position: 'absolute' },
  touchZone: { flex: 1 },
  
  ratingNumber: { color: '#8A2BE2', fontWeight: 'bold', fontSize: 16 },
  input: { color: 'white', fontSize: 20, lineHeight: 28, textAlignVertical: 'top', flex: 1, marginTop: 20 }
});

export default CreateReviewScreen;