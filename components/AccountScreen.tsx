import React from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BadgeCheck,
  ChevronLeft,
  LockKeyhole,
  LogOut,
  Mail,
  RefreshCw,
  Shield,
  UserRound,
} from 'lucide-react-native';

const formatBirthDate = (value = '') => {
  if (!value) return 'Sin completar';

  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('es-AR');
};

const AccountScreen = ({
  currentUser,
  authSession,
  authMessage,
  isAuthBusy,
  sessionMode,
  onBack,
  onOpenAuth,
  onOpenPrivacy,
  onSendPasswordReset,
  onSyncSession,
  onSignOut,
}) => {
  const email = authSession?.user?.email || currentUser?.email || '';
  const isAuthenticated =
    sessionMode === 'authenticated' && Boolean(authSession?.user);
  const isPreview = sessionMode === 'member_preview' && !isAuthenticated;
  const isEmailVerified = Boolean(authSession?.user?.email_confirmed_at);

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert(
        'Falta un email',
        'Primero necesitás guardar o conectar una cuenta con email.'
      );
      return;
    }

    const response = await onSendPasswordReset?.(email);

    if (response?.ok) {
      Alert.alert(
        'Email enviado',
        'Te mandamos un enlace para cambiar la contraseña.'
      );
      return;
    }

    Alert.alert(
      'No pudimos enviarlo',
      response?.message || 'Probá otra vez en un rato.'
    );
  };

  const handleSyncSession = async () => {
    const response = await onSyncSession?.();

    if (response?.ok) {
      Alert.alert(
        'Cuenta sincronizada',
        'Tu cuenta real y el perfil local ya quedaron alineados.'
      );
      return;
    }

    Alert.alert(
      'No pudimos sincronizarla',
      response?.message || 'Probá otra vez en un rato.'
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Querés desconectar tu cuenta real de este dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            const response = await onSignOut?.();

            if (response?.ok) {
              Alert.alert(
                'Sesión cerrada',
                'Tu cuenta real se desconectó de este dispositivo.'
              );
              return;
            }

            Alert.alert(
              'No pudimos cerrar la sesión',
              response?.message || 'Probá otra vez en un rato.'
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cuenta</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>CUENTA Y SESION</Text>
          <Text style={styles.title}>
            {isAuthenticated
              ? 'Tu cuenta real ya está conectada'
              : isPreview
                ? 'Tu cuenta ya está casi lista'
                : 'Todavía estás en modo invitado'}
          </Text>
          <Text style={styles.subtitle}>
            {isAuthenticated
              ? 'Desde acá podés revisar el acceso, cambiar la contraseña y cerrar sesión sin perder tu perfil.'
              : isPreview
                ? 'Te faltan uno o dos pasos para dejar la cuenta lista y que todo quede guardado con tu identidad.'
                : 'Si querés guardar tu progreso de verdad, este es el lugar para crear o conectar una cuenta.'}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <UserRound color="#E9D5FF" size={18} />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryTitle}>{currentUser?.name || 'Tu lado B'}</Text>
              <Text style={styles.summaryHandle}>@{currentUser?.handle || 'tu_lado_b'}</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                isAuthenticated
                  ? styles.statusPillSuccess
                  : isPreview
                    ? styles.statusPillWarning
                    : styles.statusPillMuted,
              ]}>
              <Text style={styles.statusPillText}>
                {isAuthenticated
                  ? 'Activa'
                  : isPreview
                    ? 'Pendiente'
                    : 'Invitado'}
              </Text>
            </View>
          </View>

          <View style={styles.metaList}>
            <View style={styles.metaRow}>
              <Mail color="#C4B5FD" size={16} />
              <Text style={styles.metaLabel}>Email</Text>
              <Text style={styles.metaValue}>{email || 'Sin conectar'}</Text>
            </View>
            <View style={styles.metaRow}>
              <BadgeCheck color="#C4B5FD" size={16} />
              <Text style={styles.metaLabel}>Verificación</Text>
              <Text style={styles.metaValue}>
                {isAuthenticated
                  ? isEmailVerified
                    ? 'Email verificado'
                    : 'Email pendiente de verificar'
                  : isPreview
                    ? 'Revisá tu email para activarla'
                    : 'Todavía no aplica'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <LockKeyhole color="#C4B5FD" size={16} />
              <Text style={styles.metaLabel}>Fecha de nacimiento</Text>
              <Text style={styles.metaValue}>
                {formatBirthDate(currentUser?.birthDate)}
              </Text>
            </View>
          </View>
        </View>

        {authMessage ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>{authMessage}</Text>
          </View>
        ) : null}

        {!isAuthenticated ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Terminar acceso real</Text>
            <Text style={styles.sectionText}>
              {isPreview
                ? 'Tu cuenta ya quedó creada. Si todavía no confirmaste el email, hacelo desde la bandeja y después volvé para iniciar sesión.'
                : 'Pasá de invitado a cuenta real para guardar listas, reseñas, chats y recomendaciones con tu identidad.'}
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onOpenAuth}
              activeOpacity={0.9}>
              <Text style={styles.primaryButtonText}>
                {isPreview ? 'Volver al acceso' : 'Crear cuenta o iniciar sesión'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Seguridad y cuenta</Text>
          <Text style={styles.sectionText}>
            Mantené el acceso al día y revisá la parte sensible de tu perfil sin entrar en menús escondidos.
          </Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleSyncSession}
            activeOpacity={0.86}>
            <RefreshCw color="#E9D5FF" size={18} />
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Sincronizar cuenta</Text>
              <Text style={styles.actionDescription}>
                Actualiza sesión, perfil y estado real del backend.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handlePasswordReset}
            activeOpacity={0.86}>
            <LockKeyhole color="#E9D5FF" size={18} />
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Cambiar contraseña</Text>
              <Text style={styles.actionDescription}>
                Te mandamos un email seguro para actualizarla.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={onOpenPrivacy}
            activeOpacity={0.86}>
            <Shield color="#E9D5FF" size={18} />
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Centro de privacidad</Text>
              <Text style={styles.actionDescription}>
                Controlá quién ve tu actividad, tus listas y tus recomendaciones.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.9}
          disabled={isAuthBusy}>
          {isAuthBusy ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <LogOut color="white" size={18} />
              <Text style={styles.signOutButtonText}>
                {isAuthenticated ? 'Cerrar sesión' : 'Salir del modo invitado'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 120,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(7, 10, 18, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
  },
  headerSpacer: {
    width: 42,
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.28)',
    backgroundColor: 'rgba(17, 10, 31, 0.88)',
    gap: 8,
  },
  eyebrow: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
  },
  subtitle: {
    color: '#D1D5DB',
    lineHeight: 21,
  },
  summaryCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(7, 10, 18, 0.82)',
    gap: 18,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(168,85,247,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCopy: {
    flex: 1,
    gap: 2,
  },
  summaryTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  summaryHandle: {
    color: '#A855F7',
    fontWeight: '700',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  statusPillSuccess: {
    backgroundColor: 'rgba(22, 101, 52, 0.22)',
    borderColor: 'rgba(34, 197, 94, 0.28)',
  },
  statusPillWarning: {
    backgroundColor: 'rgba(120, 53, 15, 0.22)',
    borderColor: 'rgba(251, 191, 36, 0.28)',
  },
  statusPillMuted: {
    backgroundColor: 'rgba(51, 65, 85, 0.22)',
    borderColor: 'rgba(148, 163, 184, 0.28)',
  },
  statusPillText: {
    color: '#F5F3FF',
    fontSize: 12,
    fontWeight: '800',
  },
  metaList: {
    gap: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaLabel: {
    width: 120,
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
  },
  metaValue: {
    flex: 1,
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '600',
  },
  messageCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(20, 24, 38, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
  },
  messageText: {
    color: '#E9D5FF',
    lineHeight: 20,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(7, 10, 18, 0.82)',
    gap: 14,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  sectionText: {
    color: '#D1D5DB',
    lineHeight: 21,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  actionRow: {
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(16, 18, 29, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  actionDescription: {
    color: '#9CA3AF',
    lineHeight: 18,
  },
  signOutButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default AccountScreen;
