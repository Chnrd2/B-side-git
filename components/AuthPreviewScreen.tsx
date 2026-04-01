import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronLeft,
  Database,
  LockKeyhole,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';

import {
  SUPABASE_DASHBOARD_PATHS,
  SUPABASE_LOCAL_URLS,
  SUPABASE_SETUP_STEPS,
  SUPABASE_STORAGE_BUCKETS,
  SUPABASE_TABLES,
  getSupabaseStatus,
} from '../lib/supabase';

const AuthPreviewScreen = ({
  currentUser,
  preferences,
  authSession,
  authMessage,
  isAuthBusy,
  onBack,
  onSave,
  onRegisterRealAccount,
  onSignInRealAccount,
  onSendMagicLink,
  onSignOut,
  onSyncSession,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [password, setPassword] = useState('');

  const supabaseStatus = useMemo(() => getSupabaseStatus(), []);

  const handleSaveLocal = () => {
    onSave({
      name,
      email,
    });
  };

  const handleRegister = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      Alert.alert('Falta email', 'Escribe un email para seguir.');
      return;
    }

    if (password.trim().length < 6) {
      Alert.alert(
        'Contraseña muy corta',
        'Usá al menos 6 caracteres para crear la cuenta.'
      );
      return;
    }

    handleSaveLocal();

    const response = await onRegisterRealAccount({
      name,
      email: trimmedEmail,
      password,
    });

    if (response.ok) {
      Alert.alert(
        'Registro iniciado',
        response.data?.session?.user
          ? 'La cuenta quedó conectada y lista para usarse.'
          : 'Revisa tu mail para confirmar la cuenta real.'
      );
      return;
    }

    Alert.alert('No pudimos registrar la cuenta', response.message);
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password.trim()) {
      Alert.alert(
        'Faltan datos',
        'Escribí email y contraseña para iniciar sesión.'
      );
      return;
    }

    handleSaveLocal();

    const response = await onSignInRealAccount({
      email: trimmedEmail,
      password,
    });

    if (response.ok) {
      Alert.alert('Sesión iniciada', 'La cuenta real ya está activa.');
      return;
    }

    Alert.alert('No pudimos iniciar sesión', response.message);
  };

  const handleMagicLink = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      Alert.alert('Falta email', 'Escribí un email para enviar el acceso.');
      return;
    }

    handleSaveLocal();
    const response = await onSendMagicLink(trimmedEmail);

    if (response.ok) {
      Alert.alert(
        'Acceso por mail enviado',
        'Buscá el mail de acceso rápido para continuar.'
      );
      return;
    }

    Alert.alert('No pudimos enviar el acceso', response.message);
  };

  const handleSignOut = async () => {
    const response = await onSignOut();

    if (!response.ok) {
      Alert.alert('No pudimos cerrar la sesión', response.message);
      return;
    }

    Alert.alert('Sesión cerrada', 'La cuenta real se desconectó.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cuenta y acceso</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>CUENTAS Y DATOS</Text>
          <Text style={styles.title}>Acceso, cuenta y datos</Text>
          <Text style={styles.subtitle}>
            Esta base te permite tener acceso real, perfiles, reseñas,
            listas, likes y permisos por usuario sin volver pesada la app.
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Sparkles color="#E9D5FF" size={18} />
            <Text style={styles.statusTitle}>
              Estado: {supabaseStatus.isConfigured ? 'configurado' : 'pendiente'}
            </Text>
          </View>
          <Text style={styles.statusText}>
            Proyecto conectado: {supabaseStatus.projectHost}
          </Text>
          <Text style={styles.statusText}>
            Sesión:{' '}
            {authSession?.user
              ? `activa como ${authSession.user.email || currentUser.email}`
              : 'sin login real'}
          </Text>
          <Text style={styles.statusText}>
            Modo local:{' '}
            {preferences.sessionMode === 'authenticated'
              ? 'autenticado'
              : preferences.sessionMode}
          </Text>
        </View>

        {!supabaseStatus.isConfigured ? (
          <View style={styles.pendingCard}>
            <Text style={styles.pendingTitle}>Lo que todavía falta</Text>
            <Text style={styles.pendingText}>
              La app todavía está usando el modo local porque falta
              terminar la conexión real. Cuando eso quede listo, la cuenta
              se va a sincronizar con perfiles, listas y reseñas.
            </Text>

            {SUPABASE_DASHBOARD_PATHS.map((item) => (
              <View key={item} style={styles.pendingRow}>
                <View style={styles.pendingDot} />
                <Text style={styles.pendingItem}>{item}</Text>
              </View>
            ))}

            <View style={styles.localUrlsCard}>
              <Text style={styles.localUrlsTitle}>URLs locales recomendadas</Text>
              {SUPABASE_LOCAL_URLS.map((url) => (
                <View key={url} style={styles.localUrlBadge}>
                  <Text style={styles.localUrlText}>{url}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Database color="#E9D5FF" size={18} />
            <Text style={styles.summaryText}>
              Tablas listas para perfiles, reseñas, comentarios, likes, listas,
              follows, mensajes, reportes y suscripciones.
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <ShieldCheck color="#E9D5FF" size={18} />
            <Text style={styles.summaryText}>
              Permisos por usuario para que cada persona vea y edite solo lo
              que le corresponde.
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <LockKeyhole color="#E9D5FF" size={18} />
            <Text style={styles.summaryText}>
              Email, contraseña, acceso por mail y guardado de avatar y fondos.
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Cuenta actual</Text>
          <Text style={styles.cardText}>
            Si la conexión ya está activa, podés registrar, iniciar
            sesión y sincronizar tu perfil. Si no, igual podés seguir
            usando el modo local.
          </Text>

          <View style={styles.inputGroup}>
            <Sparkles color="#A855F7" size={18} />
            <TextInput
              style={styles.input}
              placeholder="Tu nombre"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
          </View>

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

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSaveLocal}
            disabled={isAuthBusy}>
            <Text style={styles.primaryText}>Guardar datos locales</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleRegister}
            disabled={isAuthBusy}>
            {isAuthBusy ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.secondaryText}>Crear cuenta real</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isAuthBusy}>
            <Text style={styles.loginText}>Iniciar sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={handleMagicLink}
            disabled={isAuthBusy}>
            <Text style={styles.ghostText}>Enviar acceso por mail</Text>
          </TouchableOpacity>

          {authSession?.user ? (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={() => onSyncSession()}
              disabled={isAuthBusy}>
              <Text style={styles.syncText}>Sincronizar perfil ahora</Text>
            </TouchableOpacity>
          ) : null}

          {authSession?.user ? (
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              disabled={isAuthBusy}>
              <LogOut color="white" size={18} />
              <Text style={styles.signOutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.footnote}>
            {authMessage ||
              `Modo actual: ${
                preferences.sessionMode === 'authenticated'
                  ? 'autenticado'
                  : preferences.sessionMode
              }`}
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tablas base</Text>
          <View style={styles.badgesWrap}>
            {SUPABASE_TABLES.map((tableName) => (
              <View key={tableName} style={styles.badge}>
                <Text style={styles.badgeText}>{tableName}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Espacios para archivos</Text>
          <View style={styles.badgesWrap}>
            {SUPABASE_STORAGE_BUCKETS.map((bucketName) => (
              <View key={bucketName} style={styles.badge}>
                <Text style={styles.badgeText}>{bucketName}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Pasos de conexión</Text>
          {SUPABASE_SETUP_STEPS.map((step) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepDot} />
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', paddingTop: 55 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '800' },
  content: { paddingHorizontal: 20, paddingBottom: 120, gap: 18 },
  heroCard: {
    backgroundColor: 'rgba(138,43,226,0.12)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
    padding: 22,
    gap: 10,
  },
  eyebrow: {
    color: '#E9D5FF',
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  title: { color: 'white', fontSize: 28, lineHeight: 34, fontWeight: '900' },
  subtitle: { color: '#D1D5DB', lineHeight: 22 },
  statusCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 18,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  statusTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  statusText: { color: '#D1D5DB', lineHeight: 20 },
  summaryCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 18,
    gap: 14,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  summaryText: { flex: 1, color: '#E5E7EB', lineHeight: 21 },
  pendingCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 18,
    gap: 12,
  },
  pendingTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  pendingText: { color: '#D1D5DB', lineHeight: 21 },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8A2BE2',
    marginTop: 6,
  },
  pendingItem: { flex: 1, color: '#E5E7EB', lineHeight: 21 },
  localUrlsCard: {
    marginTop: 4,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    gap: 10,
  },
  localUrlsTitle: {
    color: '#E9D5FF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  localUrlBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.22)',
    backgroundColor: 'rgba(168,85,247,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignSelf: 'flex-start',
  },
  localUrlText: { color: '#F5F3FF', fontWeight: '700', fontSize: 12 },
  formCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 18,
    gap: 16,
  },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  cardText: { color: '#9CA3AF', lineHeight: 20 },
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
  input: { flex: 1, color: 'white' },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryText: { color: 'white', fontWeight: '800', fontSize: 15 },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryText: { color: 'white', fontWeight: '800', fontSize: 15 },
  loginButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: { color: 'white', fontWeight: '800', fontSize: 15 },
  ghostButton: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostText: { color: '#E9D5FF', fontWeight: '800', fontSize: 15 },
  syncButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncText: { color: '#E5E7EB', fontWeight: '800', fontSize: 15 },
  signOutButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: '#B91C1C',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  signOutText: { color: 'white', fontWeight: '800', fontSize: 15 },
  footnote: {
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 18,
    gap: 14,
  },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.18)',
  },
  badgeText: { color: '#E9D5FF', fontWeight: '700', fontSize: 12 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8A2BE2',
    marginTop: 6,
  },
  stepText: { flex: 1, color: '#D1D5DB', lineHeight: 21 },
});

export default AuthPreviewScreen;

