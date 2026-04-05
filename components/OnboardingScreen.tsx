import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  Disc3,
  LockKeyhole,
  Mail,
  Shield,
  Sparkles,
  UserRound,
} from 'lucide-react-native';

const ACCESS_MODES = [
  {
    id: 'register',
    title: 'Crear cuenta',
    description: 'Guardá tu progreso y empezá a construir tu perfil real.',
  },
  {
    id: 'login',
    title: 'Iniciar sesión',
    description: 'Entrá con tu cuenta para recuperar listas, reseñas y chats.',
  },
];

const OnboardingScreen = ({
  currentUser,
  authMessage,
  isAuthBusy,
  isBackendConfigured,
  onContinueGuest,
  onRegisterRealAccount,
  onSignInRealAccount,
  onSendMagicLink,
}) => {
  const [step, setStep] = useState('intro');
  const [mode, setMode] = useState('register');
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState(null);

  const helperText = useMemo(() => {
    if (feedback?.text) {
      return feedback;
    }

    if (authMessage) {
      return {
        tone: 'info',
        text: authMessage,
      };
    }

    return null;
  }, [authMessage, feedback]);

  const isAuthAvailable = Boolean(isBackendConfigured);

  const goToAccess = () => {
    setFeedback(null);
    setStep('access');
  };

  const goBackToIntro = () => {
    setFeedback(null);
    setPassword('');
    setStep('intro');
  };

  const handleGuestAccess = () => {
    setFeedback(null);
    onContinueGuest?.();
  };

  const handleRegister = async () => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setFeedback({
        tone: 'error',
        text: 'Escribí un email para crear la cuenta.',
      });
      return;
    }

    if (password.trim().length < 6) {
      setFeedback({
        tone: 'error',
        text: 'Usá al menos 6 caracteres para la contraseña.',
      });
      return;
    }

    const response = await onRegisterRealAccount?.({
      name: normalizedName || currentUser?.name || '',
      email: normalizedEmail,
      password,
    });

    if (!response?.ok) {
      setFeedback({
        tone: 'error',
        text: response?.message || 'No pudimos crear la cuenta.',
      });
      return;
    }

    setFeedback({
      tone: 'success',
      text: response.data?.session?.user
        ? 'La cuenta quedó conectada y lista para entrar.'
        : 'La cuenta ya se creó. Revisá tu email para confirmarla.',
    });
  };

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      setFeedback({
        tone: 'error',
        text: 'Completá email y contraseña para iniciar sesión.',
      });
      return;
    }

    const response = await onSignInRealAccount?.({
      email: normalizedEmail,
      password,
    });

    if (!response?.ok) {
      setFeedback({
        tone: 'error',
        text: response?.message || 'No pudimos iniciar sesión.',
      });
      return;
    }

    setFeedback({
      tone: 'success',
      text: 'Sesión iniciada. Tu cuenta real ya está activa.',
    });
  };

  const handleMagicLink = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setFeedback({
        tone: 'error',
        text: 'Escribí un email para enviarte el acceso.',
      });
      return;
    }

    const response = await onSendMagicLink?.(normalizedEmail);

    if (!response?.ok) {
      setFeedback({
        tone: 'error',
        text: response?.message || 'No pudimos enviar el acceso por email.',
      });
      return;
    }

    setFeedback({
      tone: 'success',
      text: 'Te mandamos el acceso por email. Revisá tu bandeja para continuar.',
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardShell}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.glow} />

        <View style={styles.header}>
          <View style={styles.badge}>
            <Disc3 color="#E9D5FF" size={18} />
            <Text style={styles.badgeText}>B-SIDE</Text>
          </View>
          <Text style={styles.title}>
            Descubrí, guardá y compartí música a tu manera
          </Text>
          <Text style={styles.subtitle}>
            Encontrá discos, armá tus listas, dejá reseñas y conectá con gente que
            vibra con la música como vos.
          </Text>
        </View>

        {step === 'intro' ? (
          <>
            <View style={styles.previewCard}>
              <View style={styles.previewVisual}>
                <View style={styles.visualGlow} />
                <View style={styles.visualRecordOuter}>
                  <View style={styles.visualRecordMiddle}>
                    <View style={styles.visualRecordInner}>
                      <Disc3 color="#F3E8FF" size={28} />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.pointRow}>
                <Sparkles color="#A855F7" size={18} />
                <Text style={styles.pointText}>
                  Guardá discos para escuchar después y armá listas con tu propio
                  criterio.
                </Text>
              </View>
              <View style={styles.pointRow}>
                <Shield color="#A855F7" size={18} />
                <Text style={styles.pointText}>
                  Personalizá tu perfil, compartí reseñas y descubrí artistas
                  desde una comunidad hecha para melómanos.
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={goToAccess}>
              <Text style={styles.primaryText}>Entrar</Text>
              <ArrowRight color="white" size={18} />
            </TouchableOpacity>

            <Pressable style={styles.footnote} onPress={goToAccess}>
              <Text style={styles.footnoteText}>
                Tu lado B también merece un lugar propio.
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.accessCard}>
            <TouchableOpacity style={styles.backRow} onPress={goBackToIntro}>
              <ArrowLeft color="#E9D5FF" size={18} />
              <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>

            <Text style={styles.accessTitle}>Elegí cómo querés entrar</Text>
            <Text style={styles.accessSubtitle}>
              Podés seguir como invitado o dejar lista tu cuenta real desde ya.
            </Text>

            <View style={styles.modeTabs}>
              {ACCESS_MODES.map((option) => {
                const isActive = mode === option.id;

                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.modeButton, isActive && styles.modeButtonActive]}
                    onPress={() => {
                      setMode(option.id);
                      setFeedback(null);
                    }}>
                    <Text
                      style={[
                        styles.modeButtonTitle,
                        isActive && styles.modeButtonTitleActive,
                      ]}>
                      {option.title}
                    </Text>
                    <Text
                      style={[
                        styles.modeButtonText,
                        isActive && styles.modeButtonTextActive,
                      ]}>
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!isAuthAvailable ? (
              <View style={styles.noticeCard}>
                <Text style={styles.noticeTitle}>Acceso real pendiente</Text>
                <Text style={styles.noticeText}>
                  Supabase no está listo en este entorno. Mientras tanto podés
                  seguir como invitado y terminar el acceso más adelante.
                </Text>
              </View>
            ) : null}

            <View style={styles.formCard}>
              {mode === 'register' ? (
                <View style={styles.inputGroup}>
                  <UserRound color="#A855F7" size={18} />
                  <TextInput
                    style={styles.input}
                    placeholder="Tu nombre"
                    placeholderTextColor="#666"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Mail color="#A855F7" size={18} />
                <TextInput
                  style={styles.input}
                  placeholder="tuemail@ejemplo.com"
                  placeholderTextColor="#666"
                  value={email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <LockKeyhole color="#A855F7" size={18} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#666"
                  value={password}
                  secureTextEntry
                  onChangeText={setPassword}
                />
              </View>

              {helperText ? (
                <View
                  style={[
                    styles.feedbackCard,
                    helperText.tone === 'error'
                      ? styles.feedbackError
                      : helperText.tone === 'success'
                        ? styles.feedbackSuccess
                        : styles.feedbackInfo,
                  ]}>
                  <Text style={styles.feedbackText}>{helperText.text}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  !isAuthAvailable && styles.disabledButton,
                ]}
                onPress={mode === 'register' ? handleRegister : handleLogin}
                disabled={isAuthBusy || !isAuthAvailable}>
                {isAuthBusy ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.primaryText}>
                      {mode === 'register' ? 'Crear cuenta real' : 'Iniciar sesión'}
                    </Text>
                    <ArrowRight color="white" size={18} />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  !isAuthAvailable && styles.disabledButton,
                ]}
                onPress={handleMagicLink}
                disabled={isAuthBusy || !isAuthAvailable}>
                {isAuthBusy ? (
                  <ActivityIndicator color="#E9D5FF" />
                ) : (
                  <Text style={styles.secondaryText}>Enviar acceso por email</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.guestButton}
                onPress={handleGuestAccess}
                disabled={isAuthBusy}>
                <Text style={styles.guestText}>Seguir como invitado</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.accessFootnote}>
              Podés entrar como invitado y conectar tu cuenta después desde el
              perfil, sin perder la puerta de entrada de la app.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardShell: {
    flex: 1,
    backgroundColor: '#050816',
  },
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 44,
    gap: 26,
  },
  glow: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
  },
  header: {
    gap: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(138, 43, 226, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  badgeText: {
    color: '#E9D5FF',
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 12,
  },
  title: {
    color: 'white',
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 16,
    lineHeight: 24,
  },
  previewCard: {
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 22,
    gap: 18,
  },
  previewVisual: {
    alignSelf: 'center',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  visualGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
  },
  visualRecordOuter: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: '#090C14',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.36)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 8,
  },
  visualRecordMiddle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualRecordInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  pointText: {
    flex: 1,
    color: '#E5E7EB',
    lineHeight: 21,
  },
  accessCard: {
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 22,
    gap: 18,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#E9D5FF',
    fontWeight: '700',
  },
  accessTitle: {
    color: 'white',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  accessSubtitle: {
    color: '#9CA3AF',
    lineHeight: 22,
  },
  modeTabs: {
    gap: 12,
  },
  modeButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: '#0F172A',
    padding: 16,
    gap: 6,
  },
  modeButtonActive: {
    borderColor: 'rgba(168, 85, 247, 0.35)',
    backgroundColor: 'rgba(138, 43, 226, 0.12)',
  },
  modeButtonTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  modeButtonTitleActive: {
    color: '#F5F3FF',
  },
  modeButtonText: {
    color: '#9CA3AF',
    lineHeight: 20,
  },
  modeButtonTextActive: {
    color: '#D8B4FE',
  },
  noticeCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.18)',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    padding: 14,
    gap: 8,
  },
  noticeTitle: {
    color: '#F5F3FF',
    fontWeight: '800',
  },
  noticeText: {
    color: '#D1D5DB',
    lineHeight: 20,
  },
  formCard: {
    gap: 14,
  },
  inputGroup: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    color: 'white',
  },
  feedbackCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(96, 165, 250, 0.18)',
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(74, 222, 128, 0.22)',
  },
  feedbackError: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  feedbackText: {
    color: '#E5E7EB',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#8A2BE2',
    minHeight: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.22)',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  secondaryText: {
    color: '#E9D5FF',
    fontWeight: '800',
    fontSize: 15,
  },
  guestButton: {
    minHeight: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  guestText: {
    color: '#E5E7EB',
    fontWeight: '800',
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.45,
  },
  accessFootnote: {
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 20,
  },
  footnote: {
    paddingHorizontal: 8,
  },
  footnoteText: {
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default OnboardingScreen;
