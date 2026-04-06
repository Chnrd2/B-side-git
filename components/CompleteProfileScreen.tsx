import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  LockKeyhole,
  UserRound,
} from 'lucide-react-native';

const sanitizeHandle = (value = '') =>
  `${value}`
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, 20);

const CompleteProfileScreen = ({
  currentUser,
  authMessage,
  isSaving,
  isEmailVerified,
  onSubmit,
  onSignOut,
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [handle, setHandle] = useState(currentUser?.handle || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setName(currentUser?.name || '');
    setHandle(currentUser?.handle || '');
    setBio(currentUser?.bio || '');
    setAvatarUrl(currentUser?.avatarUrl || '');
  }, [currentUser]);

  const helperText = useMemo(() => feedback || authMessage || '', [authMessage, feedback]);

  const pickAvatar = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            'Permiso requerido',
            'Necesitamos acceso a tu galería para elegir una foto de perfil.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.92,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setAvatarUrl(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        'No pudimos abrir la galería',
        'Si querés, podés terminar el perfil ahora y sumar la foto después.'
      );
    }
  };

  const handleSubmit = async () => {
    const normalizedHandle = sanitizeHandle(handle);
    const normalizedName = name.trim();

    if (normalizedHandle.length < 3) {
      setFeedback('Elegí un @ de al menos 3 caracteres para completar el perfil.');
      return;
    }

    setFeedback('');

    const result = await onSubmit?.({
      name: normalizedName || currentUser?.name || 'Tu lado B',
      handle: normalizedHandle,
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
    });

    if (!result?.ok && !result?.skipped) {
      setFeedback(result?.message || 'No pudimos guardar el perfil.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.shell}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text style={styles.eyebrow}>COMPLETAR PERFIL</Text>
          <Text style={styles.title}>Dejá lista tu identidad en B-Side</Text>
          <Text style={styles.subtitle}>
            Antes de entrar a la app te pedimos un @ único. La foto y la bio son opcionales,
            pero ya te dejan el perfil mucho más presentable.
          </Text>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {(name || currentUser?.name || 'B').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.previewMeta}>
            <Text style={styles.previewName}>{name || currentUser?.name || 'Tu lado B'}</Text>
            <Text style={styles.previewHandle}>@{sanitizeHandle(handle) || 'tu_handle'}</Text>
            <Text style={styles.previewBio} numberOfLines={2}>
              {bio || 'Todavía sin bio. Podés sumarla ahora o más tarde.'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.mediaButton} onPress={pickAvatar}>
            <Camera color="#A855F7" size={18} />
            <Text style={styles.mediaButtonText}>Elegir foto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mediaButton} onPress={() => setAvatarUrl('')}>
            <ImagePlus color="#A855F7" size={18} />
            <Text style={styles.mediaButtonText}>Sin foto</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Nombre visible</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Cómo querés aparecer"
            placeholderTextColor="#6B7280"
            autoCapitalize="words"
          />

          <Text style={styles.label}>@ de perfil</Text>
          <View style={styles.handleRow}>
            <Text style={styles.handlePrefix}>@</Text>
            <TextInput
              style={styles.handleInput}
              value={handle}
              onChangeText={(value) => setHandle(sanitizeHandle(value))}
              placeholder="tu_handle"
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text style={styles.helper}>
            El @ es obligatorio, público y tiene que ser único para que otras personas te
            encuentren.
          </Text>

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Contá algo sobre tus gustos musicales..."
            placeholderTextColor="#6B7280"
            multiline={true}
            textAlignVertical="top"
          />

          {helperText ? <Text style={styles.feedback}>{helperText}</Text> : null}

          <View style={styles.statusRow}>
            <CheckCircle2 color={isEmailVerified ? '#4ADE80' : '#FBBF24'} size={16} />
            <Text style={styles.statusText}>
              {isEmailVerified
                ? 'Tu email ya figura como verificado.'
                : 'La cuenta puede seguir, pero te conviene verificar el email cuanto antes.'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isSaving && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Guardar y entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, isSaving && styles.buttonDisabled]}
            onPress={onSignOut}
            disabled={isSaving}>
            <LockKeyhole color="#E9D5FF" size={16} />
            <Text style={styles.secondaryButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 44,
    gap: 18,
  },
  headerCard: {
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
    backgroundColor: 'rgba(8, 11, 22, 0.88)',
    gap: 8,
  },
  eyebrow: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  subtitle: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 21,
  },
  previewCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(7, 10, 18, 0.84)',
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    borderRadius: 38,
    backgroundColor: '#BE185D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarFallbackText: {
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
    fontSize: 24,
    fontWeight: '900',
  },
  previewHandle: {
    color: '#A855F7',
    fontSize: 15,
    fontWeight: '800',
  },
  previewBio: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
    backgroundColor: 'rgba(10, 10, 10, 0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mediaButtonText: {
    color: '#E9D5FF',
    fontWeight: '800',
  },
  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.16)',
    backgroundColor: 'rgba(8, 11, 22, 0.9)',
    padding: 20,
    gap: 12,
  },
  label: {
    color: '#E9D5FF',
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: '#111827',
    color: 'white',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  textarea: {
    minHeight: 116,
  },
  handleRow: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  handlePrefix: {
    color: '#A855F7',
    fontSize: 16,
    fontWeight: '900',
    marginRight: 8,
  },
  handleInput: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    paddingVertical: 14,
  },
  helper: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
  feedback: {
    color: '#FCA5A5',
    fontSize: 13,
    lineHeight: 19,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  statusText: {
    flex: 1,
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(233,213,255,0.16)',
    backgroundColor: 'rgba(14, 19, 34, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#E9D5FF',
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});

export default CompleteProfileScreen;
