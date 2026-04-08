import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
  CircleAlert,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerSuccessFeedback } from '../lib/feedback';

const MIN_HANDLE_LENGTH = 3;
const HANDLE_CHECK_DELAY_MS = 350;

const sanitizeHandle = (value = '') =>
  `${value}`
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, 20);

const buildStatusMessage = (tone, text) => ({ tone, text });

const CompleteProfileScreen = ({
  currentUser,
  authMessage,
  isSaving,
  isEmailVerified,
  onSubmit,
  onSignOut,
  onCheckHandle,
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(currentUser?.name || '');
  const [handle, setHandle] = useState(currentUser?.handle || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [formMessage, setFormMessage] = useState(null);
  const previewScale = useRef(new Animated.Value(1)).current;
  const [handleStatus, setHandleStatus] = useState(
    buildStatusMessage('idle', 'Elegí un @ único para que la gente pueda encontrarte.')
  );

  useEffect(() => {
    setName(currentUser?.name || '');
    setHandle(currentUser?.handle || '');
    setBio(currentUser?.bio || '');
    setAvatarUrl(currentUser?.avatarUrl || '');
  }, [currentUser]);

  useEffect(() => {
    if (formMessage?.tone !== 'success') {
      return undefined;
    }

    void triggerSuccessFeedback();
    const animation = Animated.sequence([
      Animated.timing(previewScale, {
        toValue: 1.02,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(previewScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [formMessage?.tone, previewScale]);

  const normalizedHandle = useMemo(() => sanitizeHandle(handle), [handle]);
  const normalizedName = useMemo(() => name.trim(), [name]);
  const profilePreviewName = normalizedName || currentUser?.name || 'Tu lado B';
  const helperMessage = formMessage?.text || authMessage || '';
  const completionProgress = useMemo(() => {
    const checks = [
      normalizedHandle.length >= MIN_HANDLE_LENGTH,
      normalizedName.length > 0,
    ];
    return checks.filter(Boolean).length / checks.length;
  }, [normalizedHandle.length, normalizedName.length]);

  useEffect(() => {
    let cancelled = false;

    if (!normalizedHandle) {
      setHandleStatus(
        buildStatusMessage('idle', 'Elegí un @ único para que la gente pueda encontrarte.')
      );
      return undefined;
    }

    if (normalizedHandle.length < MIN_HANDLE_LENGTH) {
      setHandleStatus(
        buildStatusMessage(
          'error',
          `Elegí un @ de al menos ${MIN_HANDLE_LENGTH} caracteres.`
        )
      );
      return undefined;
    }

    if (
      currentUser?.handle &&
      normalizedHandle === sanitizeHandle(currentUser.handle) &&
      currentUser?.profileCompletedAt
    ) {
      setHandleStatus(buildStatusMessage('success', 'Ese @ ya está listo para usar.'));
      return undefined;
    }

    if (!onCheckHandle) {
      setHandleStatus(
        buildStatusMessage('info', 'Vamos a revisar tu @ al momento de guardar.')
      );
      return undefined;
    }

    setHandleStatus(buildStatusMessage('loading', 'Revisando si ese @ está disponible...'));

    const timer = setTimeout(async () => {
      const response = await onCheckHandle(normalizedHandle);

      if (cancelled) {
        return;
      }

      if (!response?.ok) {
        setHandleStatus(
          buildStatusMessage(
            'error',
            response?.message || 'No pudimos revisar ese @ ahora mismo.'
          )
        );
        return;
      }

      if (!response.available) {
        setHandleStatus(
          buildStatusMessage(
            'error',
            response?.message || `@${normalizedHandle} ya está en uso.`
          )
        );
        return;
      }

      setHandleStatus(
        buildStatusMessage('success', `@${response.handle || normalizedHandle} está disponible.`)
      );
    }, HANDLE_CHECK_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    currentUser?.handle,
    currentUser?.profileCompletedAt,
    normalizedHandle,
    onCheckHandle,
  ]);

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
        setFormMessage(
          buildStatusMessage('info', 'La foto se ve bien. Solo falta guardarla.')
        );
      }
    } catch (error) {
      Alert.alert(
        'No pudimos abrir la galería',
        'Si querés, podés terminar el perfil ahora y sumar la foto después.'
      );
    }
  };

  const handleSubmit = async () => {
    if (!normalizedName) {
      setFormMessage(
        buildStatusMessage('error', 'Escribí cómo querés aparecer en tu perfil.')
      );
      return;
    }

    if (normalizedHandle.length < MIN_HANDLE_LENGTH) {
      setFormMessage(
        buildStatusMessage(
          'error',
          `Elegí un @ de al menos ${MIN_HANDLE_LENGTH} caracteres para completar el perfil.`
        )
      );
      return;
    }

    if (handleStatus?.tone === 'error') {
      setFormMessage(
        buildStatusMessage('error', handleStatus.text || 'Revisá tu @ antes de seguir.')
      );
      return;
    }

    setFormMessage(null);

    const result = await onSubmit?.({
      name: normalizedName || currentUser?.name || 'Tu lado B',
      handle: normalizedHandle,
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
    });

    if (result?.ok || result?.skipped) {
      setFormMessage(
        buildStatusMessage('success', 'Perfil listo. Ya podés entrar con todo en orden.')
      );
      return;
    }

    setFormMessage(
      buildStatusMessage(
        'error',
        result?.message || 'No pudimos guardar el perfil. Probá otra vez.'
      )
    );
  };

  const renderHandleStatus = () => {
    if (!handleStatus?.text) {
      return null;
    }

    const tone = handleStatus.tone || 'idle';
    const iconColor =
      tone === 'success'
        ? '#4ADE80'
        : tone === 'error'
          ? '#FCA5A5'
          : tone === 'loading'
            ? '#C4B5FD'
            : '#9CA3AF';

    return (
      <View style={styles.inlineStatusRow}>
        {tone === 'loading' ? (
          <LoaderCircle color={iconColor} size={14} />
        ) : tone === 'success' ? (
          <CheckCircle2 color={iconColor} size={14} />
        ) : tone === 'error' ? (
          <CircleAlert color={iconColor} size={14} />
        ) : (
          <ImagePlus color={iconColor} size={14} />
        )}
        <Text
          style={[
            styles.inlineStatusText,
            tone === 'success' && styles.inlineStatusTextSuccess,
            tone === 'error' && styles.inlineStatusTextError,
          ]}
        >
          {handleStatus.text}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.shell}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 28, 44) },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.eyebrow}>PASO 2 DE 2</Text>
            <Text style={styles.progressLabel}>Último detalle antes de entrar</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(16, Math.round(completionProgress * 100))}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.headerCard}>
          <Text style={styles.title}>Dejá listo tu perfil</Text>
          <Text style={styles.subtitle}>
            Elegí cómo querés aparecer en B-Side. Con un @ único ya podés entrar; la foto y la bio
            ayudan a que el perfil se sienta completo desde el primer día.
          </Text>
        </View>

        <Animated.View style={[styles.previewCard, { transform: [{ scale: previewScale }] }]}>
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {profilePreviewName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.previewMeta}>
            <Text style={styles.previewName}>{profilePreviewName}</Text>
            <Text style={styles.previewHandle}>@{normalizedHandle || 'tu_handle'}</Text>
            <Text style={styles.previewBio} numberOfLines={2}>
              {bio.trim()
                ? bio.trim()
                : 'Todavía sin bio. Podés sumarla ahora o más tarde, sin romper el perfil.'}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.mediaButton} onPress={pickAvatar}>
            <Camera color="#A855F7" size={18} />
            <Text style={styles.mediaButtonText}>Elegir foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaButton}
            onPress={() => {
              setAvatarUrl('');
              setFormMessage(
                buildStatusMessage(
                  'info',
                  'Podés seguir sin foto por ahora. Después la cambiás desde el perfil.'
                )
              );
            }}
          >
            <ImagePlus color="#A855F7" size={18} />
            <Text style={styles.mediaButtonText}>Usar inicial</Text>
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
            returnKeyType="next"
          />

          <Text style={styles.label}>@ de perfil</Text>
          <View style={styles.handleRow}>
            <Text style={styles.handlePrefix}>@</Text>
            <TextInput
              style={styles.handleInput}
              value={handle}
              onChangeText={(value) => {
                setHandle(sanitizeHandle(value));
                setFormMessage(null);
              }}
              placeholder="tu_handle"
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>
          {renderHandleStatus()}

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Contá algo sobre tus gustos musicales..."
            placeholderTextColor="#6B7280"
            multiline
            textAlignVertical="top"
          />

          {helperMessage ? (
            <View
              style={[
                styles.feedbackCard,
                formMessage?.tone === 'success' && styles.feedbackCardSuccess,
                formMessage?.tone === 'error' && styles.feedbackCardError,
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  formMessage?.tone === 'success' && styles.feedbackTextSuccess,
                  formMessage?.tone === 'error' && styles.feedbackTextError,
                ]}
              >
                {helperMessage}
              </Text>
            </View>
          ) : null}

          <View style={styles.statusRow}>
            <CheckCircle2 color={isEmailVerified ? '#4ADE80' : '#FBBF24'} size={16} />
            <Text style={styles.statusText}>
              {isEmailVerified
                ? 'Tu email ya está verificado.'
                : 'La cuenta puede seguir, pero conviene verificar el email cuanto antes.'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (isSaving || handleStatus?.tone === 'loading') && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSaving || handleStatus?.tone === 'loading'}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Terminar perfil</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, isSaving && styles.buttonDisabled]}
            onPress={onSignOut}
            disabled={isSaving}
          >
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
    paddingTop: 18,
    gap: 18,
  },
  progressCard: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.18)',
    backgroundColor: 'rgba(10, 12, 24, 0.88)',
    gap: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  eyebrow: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  progressLabel: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#A855F7',
  },
  headerCard: {
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
    backgroundColor: 'rgba(8, 11, 22, 0.88)',
    gap: 8,
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
  inlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineStatusText: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
  inlineStatusTextSuccess: {
    color: '#86EFAC',
  },
  inlineStatusTextError: {
    color: '#FCA5A5',
  },
  feedbackCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(76, 29, 29, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  feedbackCardSuccess: {
    backgroundColor: 'rgba(20, 83, 45, 0.26)',
    borderColor: 'rgba(74, 222, 128, 0.22)',
  },
  feedbackCardError: {
    backgroundColor: 'rgba(76, 29, 29, 0.48)',
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  feedbackText: {
    color: '#FCA5A5',
    fontSize: 13,
    lineHeight: 19,
  },
  feedbackTextSuccess: {
    color: '#BBF7D0',
  },
  feedbackTextError: {
    color: '#FCA5A5',
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


