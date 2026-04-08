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
  CircleHelp,
  LockKeyhole,
  LogOut,
  Mail,
  RefreshCw,
  Shield,
  Smartphone,
  Trash2,
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
  onOpenSessions,
  onOpenHelp,
  onSendPasswordReset,
  onSyncSession,
  onResendVerificationEmail,
  onRefreshVerification,
  onDeleteAccount,
  onSignOut,
}) => {
  const email = authSession?.user?.email || currentUser?.email || '';
  const isAuthenticated =
    sessionMode === 'authenticated' && Boolean(authSession?.user);
  const isPreview = sessionMode === 'member_preview' && !isAuthenticated;
  const isEmailVerified = Boolean(
    authSession?.user?.email_confirmed_at || authSession?.user?.confirmed_at
  );
  const shouldShowVerificationActions =
    Boolean(email) && (!isAuthenticated || !isEmailVerified);

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert(
        'Falta un email',
        'Primero necesitás conectar una cuenta con email.'
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
        'Cuenta actualizada',
        'Refrescamos el estado de tu cuenta y tu sesión.'
      );
      return;
    }

    Alert.alert(
      'No pudimos sincronizarla',
      response?.message || 'Probá otra vez en un rato.'
    );
  };

  const handleResendVerification = async () => {
    const response = await onResendVerificationEmail?.();

    if (response?.ok) {
      Alert.alert(
        'Email reenviado',
        'Te volvimos a mandar el correo de verificación.'
      );
      return;
    }

    Alert.alert(
      'No pudimos reenviarlo',
      response?.message || 'Probá otra vez en unos segundos.'
    );
  };

  const handleRefreshVerification = async () => {
    const response = await onRefreshVerification?.();

    if (response?.ok && response?.session?.user?.email_confirmed_at) {
      Alert.alert('Email verificado', 'Tu cuenta ya figura como verificada.');
      return;
    }

    if (response?.ok) {
      Alert.alert(
        'Todavía pendiente',
        'Todavía no vemos la confirmación. Probá otra vez en unos segundos.'
      );
      return;
    }

    Alert.alert(
      'No pudimos actualizarla',
      response?.message || 'Probá otra vez en un rato.'
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Borrar cuenta',
      'Esto va a borrar tu acceso, tu perfil y la información asociada. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar cuenta',
          style: 'destructive',
          onPress: async () => {
            const response = await onDeleteAccount?.();

            if (response?.ok) {
              Alert.alert(
                'Cuenta eliminada',
                response?.message || 'La cuenta fue borrada correctamente.'
              );
              return;
            }

            Alert.alert(
              'No pudimos borrarla',
              response?.message || 'Probá otra vez en un rato.'
            );
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Querés cerrar tu cuenta en este dispositivo?',
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
                'Tu cuenta se cerró en este dispositivo.'
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
          <Text style={styles.eyebrow}>CUENTA Y SESIÓN</Text>
          <Text style={styles.title}>
            {isAuthenticated
              ? 'Tu cuenta ya está conectada'
              : isPreview
                ? 'Tu cuenta quedó pendiente'
                : 'Todavía estás en modo invitado'}
          </Text>
          <Text style={styles.subtitle}>
            {isAuthenticated
              ? 'Desde acá podés revisar acceso, verificación, sesiones y ayuda.'
              : isPreview
                ? 'Terminá de verificar el email y dejá tu perfil listo.'
                : 'Si querés guardar tu progreso de verdad, este es el lugar para crear o conectar una cuenta.'}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <Smartphone color="#E9D5FF" size={18} />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryTitle}>{currentUser?.name || 'Tu lado B'}</Text>
              <Text style={styles.summaryHandle}>@{currentUser?.handle || 'tu_handle'}</Text>
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
                {isAuthenticated ? 'Activa' : isPreview ? 'Pendiente' : 'Invitado'}
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
                    ? 'Pendiente de verificación'
                    : 'No aplica todavía'}
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
                ? 'Tu cuenta ya quedó creada. Revisá el email y después volvé a iniciar sesión para seguir.'
                : 'Pasá de invitado a cuenta real para guardar listas, reseñas, chats y recomendaciones.'}
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
            Mantené tu acceso al día y revisá la parte sensible de tu cuenta sin entrar en
            menús escondidos.
          </Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleSyncSession}
            activeOpacity={0.86}>
            <RefreshCw color="#E9D5FF" size={18} />
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Sincronizar cuenta</Text>
              <Text style={styles.actionDescription}>
                Actualiza la sesión, el perfil y el estado real del backend.
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
            onPress={onOpenSessions}
            activeOpacity={0.86}>
            <Smartphone color="#E9D5FF" size={18} />
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Sesiones</Text>
              <Text style={styles.actionDescription}>
                Revisá este dispositivo y cerrá otras sesiones abiertas.
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
                Controlá quién ve tu actividad, tus listas y tu perfil.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Verificación y ayuda</Text>
          <Text style={styles.sectionText}>
            {shouldShowVerificationActions
              ? 'Si todavía no confirmaste el email, desde acá podés reenviarlo o refrescar el estado. También tenés ayuda y contacto.'
              : 'Tu cuenta ya figura verificada. Igual te dejamos ayuda y contacto a mano por si necesitás soporte.'}
          </Text>

          {shouldShowVerificationActions ? (
            <>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleResendVerification}
                activeOpacity={0.86}>
                <Mail color="#E9D5FF" size={18} />
                <View style={styles.actionCopy}>
                  <Text style={styles.actionTitle}>Reenviar email de verificación</Text>
                  <Text style={styles.actionDescription}>
                    Útil si el primer correo no llegó o quedó en spam.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleRefreshVerification}
                activeOpacity={0.86}>
                <BadgeCheck color="#E9D5FF" size={18} />
                <View style={styles.actionCopy}>
                  <Text style={styles.actionTitle}>Ya verifiqué</Text>
                  <Text style={styles.actionDescription}>
                    Refresca tu estado de verificación contra el backend.
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.verifiedCard}>
              <BadgeCheck color="#4ADE80" size={18} />
              <View style={styles.actionCopy}>
                <Text style={styles.verifiedTitle}>Email verificado</Text>
                <Text style={styles.actionDescription}>
                  La cuenta ya quedó confirmada y lista para usar sin pasos pendientes.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.actionRow}
            onPress={onOpenHelp}
            activeOpacity={0.86}>
            <CircleHelp color="#E9D5FF" size={18} />
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Ayuda</Text>
              <Text style={styles.actionDescription}>
                Contacto, preguntas frecuentes y soporte básico.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Zona sensible</Text>
          <Text style={styles.sectionText}>
            Usá estas acciones solo si de verdad querés salir de la cuenta o borrar todo.
          </Text>

          <TouchableOpacity
            style={[styles.signOutButton, isAuthBusy && styles.buttonDisabled]}
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

          {isAuthenticated ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
              activeOpacity={0.9}
              disabled={isAuthBusy}>
              <Trash2 color="#FECACA" size={18} />
              <Text style={styles.deleteButtonText}>Borrar cuenta</Text>
            </TouchableOpacity>
          ) : null}
        </View>
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
  verifiedCard: {
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.18)',
    backgroundColor: 'rgba(20, 83, 45, 0.18)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  verifiedTitle: {
    color: '#DCFCE7',
    fontSize: 15,
    fontWeight: '800',
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
  deleteButton: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
    backgroundColor: 'rgba(69, 10, 10, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  deleteButtonText: {
    color: '#FECACA',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});

export default AccountScreen;
