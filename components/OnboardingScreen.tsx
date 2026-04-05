import React, { useEffect, useMemo, useState } from 'react';
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
    description: 'Guardá tu progreso, elegí tu @ y dejá listo tu perfil real.',
  },
  {
    id: 'login',
    title: 'Iniciar sesión',
    description: 'Entrá con tu cuenta para recuperar listas, reseñas y chats.',
  },
];

const buildHandleCandidate = (value = '') =>
  `${value}`
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20);

const formatBirthDateInput = (value = '') => {
  const digits = `${value}`.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
};

const parseBirthDateInput = (value = '') => {
  const digits = `${value}`.replace(/\D/g, '');

  if (digits.length !== 8) {
    return { ok: false, message: 'Usá la fecha en formato DD/MM/AAAA.' };
  }

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getDate() !== day ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getFullYear() !== year
  ) {
    return { ok: false, message: 'Esa fecha no parece válida.' };
  }

  const today = new Date();
  const minimumAgeDate = new Date(
    today.getFullYear() - 13,
    today.getMonth(),
    today.getDate()
  );

  if (parsedDate > minimumAgeDate) {
    return {
      ok: false,
      message: 'Necesitás tener al menos 13 años para crear una cuenta.',
    };
  }

  return {
    ok: true,
    normalized: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
      2,
      '0'
    )}`,
  };
};

const getInitialName = (currentUser) => {
  if (!currentUser?.name) return '';
  if (currentUser?.name === 'Tu lado B') return '';
  return currentUser.name;
};

const OnboardingScreen = ({
  currentUser,
  authMessage,
  isAuthBusy,
  isBackendConfigured,
  onContinueGuest,
  onRegisterRealAccount,
  onSignInRealAccount,
  onSendMagicLink,
  onSendPasswordReset,
}) => {
  const initialName = useMemo(() => getInitialName(currentUser), [currentUser]);
  const initialEmail = currentUser?.email || '';

  const [step, setStep] = useState('intro');
  const [mode, setMode] = useState('register');
  const [name, setName] = useState(initialName);
  const [handle, setHandle] = useState(buildHandleCandidate(initialName));
  const [email, setEmail] = useState(initialEmail);
  const [birthDateInput, setBirthDateInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [hasEditedHandle, setHasEditedHandle] = useState(false);

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

  useEffect(() => {
    if (!hasEditedHandle) {
      setHandle(buildHandleCandidate(name));
    }
  }, [hasEditedHandle, name]);

  const resetFeedback = () => setFeedback(null);

  const goToAccess = () => {
    resetFeedback();
    setStep('access');
  };

  const goBackToIntro = () => {
    resetFeedback();
    setPassword('');
    setConfirmPassword('');
    setStep('intro');
  };

  const submitRegister = async () => {
    const normalizedName = name.trim();
    const normalizedHandle = buildHandleCandidate(handle);
    const normalizedEmail = email.trim().toLowerCase();
    const parsedBirthDate = parseBirthDateInput(birthDateInput);

    if (!normalizedName) {
      setFeedback({
        tone: 'error',
        text: 'Escribí cómo querés aparecer en tu perfil.',
      });
      return;
    }

    if (normalizedHandle.length < 3) {
      setFeedback({
        tone: 'error',
        text: 'Elegí un @ de al menos 3 caracteres.',
      });
      return;
    }

    if (!normalizedEmail) {
      setFeedback({
        tone: 'error',
        text: 'Escribí un email para crear la cuenta.',
      });
      return;
    }

    if (!parsedBirthDate.ok) {
      setFeedback({
        tone: 'error',
        text: parsedBirthDate.message,
      });
      return;
    }

    if (password.trim().length < 6) {
      setFeedback({
        tone: 'error',
        text: 'Usá una contraseña de al menos 6 caracteres.',
      });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({
        tone: 'error',
        text: 'Las contraseñas no coinciden.',
      });
      return;
    }

    const response = await onRegisterRealAccount?.({
      name: normalizedName,
      handle: normalizedHandle,
      birthDate: parsedBirthDate.normalized,
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

  const submitLogin = async () => {
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

  const submitMagicLink = async () => {
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
        text: response?.message || 'No pudimos enviarte el acceso por email.',
      });
      return;
    }

    setFeedback({
      tone: 'success',
      text: 'Te mandamos un enlace de acceso por email. Revisá tu bandeja.',
    });
  };

  const submitPasswordReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setFeedback({
        tone: 'error',
        text: 'Escribí tu email para recuperar la contraseña.',
      });
      return;
    }

    const response = await onSendPasswordReset?.(normalizedEmail);

    if (!response?.ok) {
      setFeedback({
        tone: 'error',
        text:
          response?.message ||
          'No pudimos enviarte el email para cambiar la contraseña.',
      });
      return;
    }

    setFeedback({
      tone: 'success',
      text: 'Te enviamos un email para cambiar la contraseña.',
    });
  };

  const renderIntro = () => (
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
            Guardá discos para escuchar después y armá listas con tu propio criterio.
          </Text>
        </View>
        <View style={styles.pointRow}>
          <Shield color="#A855F7" size={18} />
          <Text style={styles.pointText}>
            Personalizá tu perfil, compartí reseñas y descubrí artistas desde una
            comunidad hecha para melómanos.
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
  );

  const renderAccess = () => (
    <View style={styles.accessCard}>
      <TouchableOpacity style={styles.backRow} onPress={goBackToIntro}>
        <ArrowLeft color="#E9D5FF" size={18} />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.accessTitle}>Elegí cómo querés entrar</Text>
      <Text style={styles.accessSubtitle}>
        Podés seguir como invitado o dejar tu cuenta real lista desde ya.
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
                resetFeedback();
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

      {!isBackendConfigured ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Acceso real pendiente</Text>
          <Text style={styles.noticeText}>
            Todavía no pudimos conectar el backend de esta instalación. Igual podés
            entrar como invitado y terminar la cuenta más adelante.
          </Text>
        </View>
      ) : null}

      <View style={styles.formCard}>
        {mode === 'register' ? (
          <>
            <View style={styles.inputGroup}>
              <UserRound color="#A855F7" size={18} />
              <TextInput
                style={styles.input}
                placeholder="Nombre visible"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.handlePrefix}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="tu_handle"
                placeholderTextColor="#666"
                value={handle}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(value) => {
                  setHasEditedHandle(true);
                  setHandle(buildHandleCandidate(value));
                }}
              />
            </View>

            <Text style={styles.metaNote}>
              Ese @ va a ser público y es la forma en la que la gente te va a encontrar.
            </Text>

            <View style={styles.inputGroup}>
              <Shield color="#A855F7" size={18} />
              <TextInput
                style={styles.input}
                placeholder="Fecha de nacimiento (DD/MM/AAAA)"
                placeholderTextColor="#666"
                value={birthDateInput}
                keyboardType="number-pad"
                onChangeText={(value) =>
                  setBirthDateInput(formatBirthDateInput(value))
                }
              />
            </View>

            <Text style={styles.metaNote}>
              No mostramos tu fecha en el perfil. Solo la usamos para validar la edad
              mínima y proteger mejor la cuenta.
            </Text>
          </>
        ) : null}

        <View style={styles.inputGroup}>
          <Mail color="#A855F7" size={18} />
          <TextInput
            style={styles.input}
            placeholder="tuemail@ejemplo.com"
            placeholderTextColor="#666"
            value={email}
            autoCapitalize="none"
            autoCorrect={false}
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

        {mode === 'register' ? (
          <View style={styles.inputGroup}>
            <LockKeyhole color="#A855F7" size={18} />
            <TextInput
              style={styles.input}
              placeholder="Repetí tu contraseña"
              placeholderTextColor="#666"
              value={confirmPassword}
              secureTextEntry
              onChangeText={setConfirmPassword}
            />
          </View>
        ) : null}

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
          style={[styles.primaryButton, !isBackendConfigured && styles.disabledButton]}
          onPress={mode === 'register' ? submitRegister : submitLogin}
          disabled={isAuthBusy || !isBackendConfigured}>
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

        {mode === 'login' ? (
          <TouchableOpacity
            style={styles.textActionButton}
            onPress={submitPasswordReset}
            disabled={isAuthBusy || !isBackendConfigured}>
            <Text style={styles.textActionLabel}>Olvidé mi contraseña</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.secondaryButton, !isBackendConfigured && styles.disabledButton]}
          onPress={submitMagicLink}
          disabled={isAuthBusy || !isBackendConfigured}>
          {isAuthBusy ? (
            <ActivityIndicator color="#E9D5FF" />
          ) : (
            <Text style={styles.secondaryText}>Enviar acceso por email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={onContinueGuest}
          disabled={isAuthBusy}>
          <Text style={styles.guestText}>Seguir como invitado</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.accessFootnote}>
        Podés entrar como invitado y conectar tu cuenta después desde el perfil, sin
        perder el acceso a la app.
      </Text>
    </View>
  );

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
          <Text style={styles.title}>Descubrí, guardá y compartí música a tu manera</Text>
          <Text style={styles.subtitle}>
            Encontrá discos, armá tus listas, dejá reseñas y conectá con gente que
            vibra con la música como vos.
          </Text>
        </View>

        {step === 'intro' ? renderIntro() : renderAccess()}
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
    backgroundColor: 'rgba(10, 10, 10, 0.92)',
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
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  visualRecordOuter: {
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: 'rgba(76, 29, 149, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualRecordMiddle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualRecordInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  pointText: {
    flex: 1,
    color: '#E5E7EB',
    fontSize: 15,
    lineHeight: 24,
  },
  accessCard: {
    backgroundColor: 'rgba(7, 10, 24, 0.94)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.22)',
    padding: 24,
    gap: 18,
  },
  backRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    color: '#F3E8FF',
    fontSize: 15,
    fontWeight: '700',
  },
  accessTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
  },
  accessSubtitle: {
    color: '#C4B5FD',
    fontSize: 15,
    lineHeight: 22,
  },
  modeTabs: {
    gap: 12,
  },
  modeButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.14)',
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    gap: 8,
  },
  modeButtonActive: {
    borderColor: 'rgba(168, 85, 247, 0.5)',
    backgroundColor: 'rgba(44, 16, 74, 0.7)',
  },
  modeButtonTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  modeButtonTitleActive: {
    color: 'white',
  },
  modeButtonText: {
    color: '#C4B5FD',
    fontSize: 14,
    lineHeight: 20,
  },
  modeButtonTextActive: {
    color: '#F3E8FF',
  },
  noticeCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: 'rgba(120, 53, 15, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.28)',
    gap: 8,
  },
  noticeTitle: {
    color: '#FCD34D',
    fontWeight: '800',
    fontSize: 14,
  },
  noticeText: {
    color: '#FDE68A',
    fontSize: 13,
    lineHeight: 20,
  },
  formCard: {
    gap: 14,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  handlePrefix: {
    color: '#A855F7',
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    paddingVertical: 16,
  },
  metaNote: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
    marginTop: -4,
  },
  feedbackCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackError: {
    backgroundColor: 'rgba(127, 29, 29, 0.34)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.28)',
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(20, 83, 45, 0.32)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.22)',
  },
  feedbackInfo: {
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
  },
  feedbackText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: '#A855F7',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
  },
  primaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    backgroundColor: 'rgba(29, 18, 43, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryText: {
    color: '#F3E8FF',
    fontSize: 15,
    fontWeight: '700',
  },
  textActionButton: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  textActionLabel: {
    color: '#C4B5FD',
    fontSize: 14,
    fontWeight: '700',
  },
  guestButton: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  guestText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.45,
  },
  footnote: {
    alignSelf: 'center',
  },
  footnoteText: {
    color: '#6B7280',
    fontSize: 15,
    textAlign: 'center',
  },
  accessFootnote: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default OnboardingScreen;
