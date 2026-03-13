import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  Check,
  ImagePlus,
  Palette,
  Sparkles,
  X,
} from 'lucide-react-native';

import {
  PROFILE_THEME_PRESETS,
  WALLPAPER_LIBRARY,
  buildProfileTheme,
} from '../data/appState';

const ProfileEditModal = ({ visible, user, onClose, onSave, isSaving }) => {
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatarUrl || '');
  const [editWallpaperUrl, setEditWallpaperUrl] = useState(
    user?.wallpaperUrl || ''
  );
  const [editThemePreset, setEditThemePreset] = useState(
    user?.themePreset || 'vinyl-night'
  );

  const previewTheme = useMemo(
    () =>
      buildProfileTheme({
        ...user,
        themePreset: editThemePreset,
        wallpaperUrl: editWallpaperUrl,
      }),
    [editThemePreset, editWallpaperUrl, user]
  );
  const hasPendingMediaChange =
    editAvatarUrl !== (user?.avatarUrl || '') ||
    editWallpaperUrl !== (user?.wallpaperUrl || '');
  const moderationMessage =
    user?.avatarModerationStatus === 'pending_review' ||
    user?.wallpaperModerationStatus === 'pending_review'
      ? 'Tu foto o fondo siguen en revision antes de quedar plenamente publicos.'
      : hasPendingMediaChange
        ? 'Si guardas una foto o fondo nuevos en una cuenta real, quedaran en revision antes de mostrarse como contenido publico.'
        : 'Puedes personalizar tu perfil ahora y luego sumar una capa de moderacion automatica.';

  const syncFromUser = () => {
    setEditName(user?.name || '');
    setEditBio(user?.bio || '');
    setEditAvatarUrl(user?.avatarUrl || '');
    setEditWallpaperUrl(user?.wallpaperUrl || '');
    setEditThemePreset(user?.themePreset || 'vinyl-night');
  };

  useEffect(() => {
    if (visible) {
      syncFromUser();
    }
  }, [visible, user]);

  const closeModal = () => {
    syncFromUser();
    onClose();
  };

  const pickImage = async (target) => {
    try {
      if (Platform.OS !== 'web') {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            'Permiso requerido',
            'Necesitamos acceso a tu galeria para elegir una imagen.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
        aspect: target === 'avatar' ? [1, 1] : [16, 9],
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      if (target === 'avatar') {
        setEditAvatarUrl(result.assets[0].uri);
      } else {
        setEditWallpaperUrl(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        'No pudimos abrir tu galeria',
        'Si quieres, pega una URL manualmente.'
      );
    }
  };

  const handleSave = async () => {
    const result = await onSave({
      name: editName.trim() || user?.name || 'Usuario',
      bio: editBio.trim() || user?.bio || '',
      avatarUrl: editAvatarUrl.trim(),
      wallpaperUrl: editWallpaperUrl.trim(),
      themePreset: editThemePreset,
    });

    if (result?.ok || result?.skipped) {
      onClose();
      return;
    }

    if (result?.message) {
      Alert.alert('No pudimos guardar el perfil', result.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Editar perfil</Text>
            <TouchableOpacity onPress={closeModal}>
              <X color="white" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.previewCard}>
              <LinearGradient
                colors={previewTheme.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {previewTheme.wallpaperUrl ? (
                <Image
                  source={{ uri: previewTheme.wallpaperUrl }}
                  style={styles.previewWallpaper}
                  resizeMode="cover"
                />
              ) : null}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: `rgba(4, 5, 10, ${previewTheme.overlay})` },
                ]}
              />

              <View style={styles.previewTop}>
                <View
                  style={[
                    styles.previewAvatar,
                    { backgroundColor: user?.avatarColor || previewTheme.accent },
                  ]}>
                  {editAvatarUrl ? (
                    <Image
                      source={{ uri: editAvatarUrl }}
                      style={styles.previewAvatarImage}
                    />
                  ) : (
                    <Text style={styles.previewAvatarText}>
                      {(editName || user?.name || 'U').charAt(0)}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewName}>
                    {editName || user?.name || 'Usuario'}
                  </Text>
                  <Text
                    style={[styles.previewHandle, { color: previewTheme.accent }]}>
                    @{user?.handle}
                  </Text>
                </View>
              </View>

              <Text style={styles.previewBio} numberOfLines={2}>
                {editBio || user?.bio || 'Cuenta lista para personalizar.'}
              </Text>
            </View>

            <View style={styles.mediaRow}>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={() => pickImage('avatar')}>
                <Camera color="#A855F7" size={18} />
                <Text style={styles.mediaText}>Elegir foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={() => pickImage('wallpaper')}>
                <ImagePlus color="#A855F7" size={18} />
                <Text style={styles.mediaText}>Elegir fondo</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.moderationNote}>{moderationMessage}</Text>

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Tu nombre"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Cuenta algo sobre vos..."
              placeholderTextColor="#666"
              multiline
            />

            <Text style={styles.label}>URL de foto</Text>
            <TextInput
              style={styles.input}
              value={editAvatarUrl}
              onChangeText={setEditAvatarUrl}
              placeholder="Pega una URL de imagen"
              placeholderTextColor="#666"
              autoCapitalize="none"
            />

            <Text style={styles.label}>URL de fondo</Text>
            <TextInput
              style={styles.input}
              value={editWallpaperUrl}
              onChangeText={setEditWallpaperUrl}
              placeholder="Pega una URL de wallpaper"
              placeholderTextColor="#666"
              autoCapitalize="none"
            />

            <View style={styles.groupHeader}>
              <Palette color="#A855F7" size={18} />
              <Text style={styles.groupTitle}>Tema visual</Text>
            </View>

            <View style={styles.themeGrid}>
              {PROFILE_THEME_PRESETS.map((preset) => {
                const isActive = preset.id === editThemePreset;

                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.themeOption,
                      isActive && styles.themeOptionActive,
                    ]}
                    onPress={() => setEditThemePreset(preset.id)}>
                    <LinearGradient
                      colors={preset.colors}
                      style={styles.themeSwatch}
                    />
                    <Text style={styles.themeName}>{preset.name}</Text>
                    {isActive ? (
                      <View style={styles.checkBadge}>
                        <Check color="white" size={12} />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.groupHeader}>
              <Sparkles color="#A855F7" size={18} />
              <Text style={styles.groupTitle}>Wallpapers base</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.wallpaperRow}>
              {WALLPAPER_LIBRARY.map((wallpaper) => {
                const isActive = wallpaper.uri === editWallpaperUrl;

                return (
                  <TouchableOpacity
                    key={wallpaper.id}
                    style={[
                      styles.wallpaperOption,
                      isActive && styles.wallpaperOptionActive,
                    ]}
                    onPress={() => setEditWallpaperUrl(wallpaper.uri)}>
                    {wallpaper.uri ? (
                      <Image
                        source={{ uri: wallpaper.uri }}
                        style={styles.wallpaperThumb}
                      />
                    ) : (
                      <LinearGradient
                        colors={previewTheme.colors}
                        style={styles.wallpaperThumb}
                      />
                    )}
                    <Text style={styles.wallpaperLabel}>{wallpaper.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveText}>Guardar cambios</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  content: {
    height: '88%',
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { color: 'white', fontSize: 24, fontWeight: '800' },
  previewCard: {
    height: 190,
    borderRadius: 26,
    overflow: 'hidden',
    padding: 18,
    justifyContent: 'space-between',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  previewWallpaper: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  previewAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  previewAvatarImage: { width: '100%', height: '100%' },
  previewAvatarText: { color: 'white', fontSize: 24, fontWeight: '800' },
  previewName: { color: 'white', fontSize: 20, fontWeight: '800' },
  previewHandle: { marginTop: 4, fontWeight: '700' },
  previewBio: { color: '#E5E7EB', lineHeight: 20, maxWidth: '80%' },
  mediaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  mediaButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  mediaText: {
    color: '#E5E7EB',
    fontWeight: '700',
  },
  moderationNote: {
    color: '#9CA3AF',
    lineHeight: 19,
    marginBottom: 18,
  },
  label: {
    color: '#C4B5FD',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    backgroundColor: '#111827',
    color: 'white',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 20,
  },
  textarea: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  groupTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  themeOption: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 12,
    backgroundColor: '#0F172A',
  },
  themeOptionActive: {
    borderColor: '#A855F7',
  },
  themeSwatch: {
    height: 54,
    borderRadius: 12,
    marginBottom: 10,
  },
  themeName: {
    color: 'white',
    fontWeight: '700',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wallpaperRow: {
    gap: 12,
    paddingBottom: 8,
    marginBottom: 24,
  },
  wallpaperOption: {
    width: 116,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 8,
    backgroundColor: '#0F172A',
  },
  wallpaperOptionActive: {
    borderColor: '#A855F7',
  },
  wallpaperThumb: {
    width: '100%',
    height: 82,
    borderRadius: 12,
    marginBottom: 8,
  },
  wallpaperLabel: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#8A2BE2',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.72,
  },
  saveText: { color: 'white', fontSize: 16, fontWeight: '800' },
});

export default ProfileEditModal;
