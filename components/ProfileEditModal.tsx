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

const sanitizeHandle = (value = '') =>
  `${value}`
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, 20);

const ProfileEditModal = ({ visible, user, onClose, onSave, isSaving }) => {
  const [editName, setEditName] = useState(user?.name || '');
  const [editHandle, setEditHandle] = useState(user?.handle || '');
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
      ? 'Tu foto o tu fondo siguen en revisión antes de quedar públicos.'
      : hasPendingMediaChange
        ? 'Si guardás una foto o un fondo nuevos en una cuenta real, van a quedar en revisión antes de mostrarse en el perfil.'
        : 'Podés personalizar tu perfil ahora y seguir afinándolo con el uso.';

  const syncFromUser = () => {
    setEditName(user?.name || '');
    setEditHandle(user?.handle || '');
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
            'Necesitamos acceso a tu galería para elegir una imagen.'
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
        'No pudimos abrir tu galería',
        'Si querés, podés pegar una URL manualmente.'
      );
    }
  };

  const handleSave = async () => {
    const result = await onSave({
      name: editName.trim() || user?.name || 'Usuario',
      handle: sanitizeHandle(editHandle) || user?.handle || 'tu_lado_b',
      bio: editBio.trim() || '',
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
            <TouchableOpacity onPress={closeModal} accessibilityLabel="Cerrar">
              <X color="white" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}>
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

                <View style={styles.previewMeta}>
                  <Text style={styles.previewName}>
                    {editName || user?.name || 'Usuario'}
                  </Text>
                  <Text
                    style={[styles.previewHandle, { color: previewTheme.accent }]}>
                    @{sanitizeHandle(editHandle) || user?.handle || 'tu_lado_b'}
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

            <Text style={styles.label}>@ de perfil</Text>
            <TextInput
              style={styles.input}
              value={editHandle}
              onChangeText={(value) => setEditHandle(sanitizeHandle(value))}
              placeholder="tu_handle"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.helperText}>
              Ese @ es público y es la forma en la que otras personas te encuentran.
            </Text>

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Contá algo sobre vos..."
              placeholderTextColor="#666"
              multiline
            />

            <Text style={styles.label}>URL de foto</Text>
            <TextInput
              style={styles.input}
              value={editAvatarUrl}
              onChangeText={setEditAvatarUrl}
              placeholder="Pegá una URL de imagen"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>URL de fondo</Text>
            <TextInput
              style={styles.input}
              value={editWallpaperUrl}
              onChangeText={setEditWallpaperUrl}
              placeholder="Pegá una URL de wallpaper"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
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
              <Text style={styles.groupTitle}>Fondos base</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
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
    maxHeight: '92%',
    backgroundColor: '#070914',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 26,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.22)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
  },
  scrollContent: {
    paddingBottom: 28,
  },
  previewCard: {
    minHeight: 220,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 22,
    justifyContent: 'space-between',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  previewWallpaper: {
    ...StyleSheet.absoluteFillObject,
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  previewAvatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  previewAvatarImage: {
    width: '100%',
    height: '100%',
  },
  previewAvatarText: {
    color: 'white',
    fontSize: 30,
    fontWeight: '900',
  },
  previewMeta: {
    flex: 1,
    gap: 4,
  },
  previewName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
  },
  previewHandle: {
    fontSize: 15,
    fontWeight: '700',
  },
  previewBio: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  mediaButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(17, 24, 39, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  mediaText: {
    color: '#E9D5FF',
    fontWeight: '700',
  },
  moderationNote: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  label: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#13162A',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    color: 'white',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textarea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  helperText: {
    color: '#8FA2C4',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 22,
    marginBottom: 14,
  },
  groupTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeOption: {
    width: '47%',
    borderRadius: 18,
    backgroundColor: '#111526',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    padding: 12,
    gap: 10,
    position: 'relative',
  },
  themeOptionActive: {
    borderColor: 'rgba(168, 85, 247, 0.56)',
  },
  themeSwatch: {
    height: 58,
    borderRadius: 14,
  },
  themeName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wallpaperRow: {
    gap: 12,
    paddingRight: 8,
  },
  wallpaperOption: {
    width: 128,
    gap: 8,
  },
  wallpaperOptionActive: {
    opacity: 1,
  },
  wallpaperThumb: {
    width: 128,
    height: 88,
    borderRadius: 18,
    backgroundColor: '#111526',
  },
  wallpaperLabel: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '700',
  },
  saveButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#A855F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default ProfileEditModal;
