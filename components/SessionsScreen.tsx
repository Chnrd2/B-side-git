import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Device from 'expo-device';
import {
  ChevronLeft,
  Laptop2,
  LogOut,
  ShieldCheck,
  Smartphone,
} from 'lucide-react-native';

const getCurrentDeviceLabel = () => {
  const modelName = Device.modelName || '';

  if (Platform.OS === 'ios') {
    return modelName ? `iPhone · ${modelName}` : 'iPhone actual';
  }

  if (Platform.OS === 'android') {
    return modelName ? `Android · ${modelName}` : 'Android actual';
  }

  return 'Este navegador';
};

const SessionsScreen = ({
  authSession,
  currentUser,
  isAuthBusy,
  onBack,
  onCloseOtherSessions,
  onSignOut,
}) => {
  const currentSessionLabel = useMemo(() => getCurrentDeviceLabel(), []);
  const lastSignIn = authSession?.user?.last_sign_in_at
    ? new Date(authSession.user.last_sign_in_at).toLocaleString('es-AR')
    : 'Ahora mismo';

  const confirmCloseOthers = () => {
    Alert.alert(
      'Cerrar otras sesiones',
      'Vamos a cerrar esta cuenta en los demás dispositivos y navegadores, dejando abierta solo esta sesión.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar otras sesiones',
          style: 'destructive',
          onPress: () => {
            void onCloseOtherSessions?.();
          },
        },
      ]
    );
  };

  const confirmSignOut = () => {
    Alert.alert(
      'Cerrar esta sesión',
      'Tu cuenta se va a desconectar solo de este dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            void onSignOut?.();
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
          <Text style={styles.headerTitle}>Sesiones</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>DISPOSITIVO ACTUAL</Text>
          <Text style={styles.title}>{currentSessionLabel}</Text>
          <Text style={styles.subtitle}>
            Esta es la sesión que estás usando ahora con {currentUser?.email || 'tu cuenta'}.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sessionRow}>
            <View style={styles.sessionIcon}>
              {Platform.OS === 'web' ? (
                <Laptop2 color="#E9D5FF" size={18} />
              ) : (
                <Smartphone color="#E9D5FF" size={18} />
              )}
            </View>
            <View style={styles.sessionCopy}>
              <Text style={styles.sessionTitle}>Este dispositivo</Text>
              <Text style={styles.sessionDescription}>Último acceso: {lastSignIn}</Text>
            </View>
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Actual</Text>
            </View>
          </View>

          <View style={styles.infoCallout}>
            <ShieldCheck color="#A855F7" size={16} />
            <Text style={styles.infoText}>
              Podés cerrar el resto de las sesiones sin desconectar este dispositivo.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isAuthBusy && styles.buttonDisabled]}
            onPress={confirmCloseOthers}
            disabled={isAuthBusy}>
            {isAuthBusy ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Cerrar otras sesiones</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, isAuthBusy && styles.buttonDisabled]}
            onPress={confirmSignOut}
            disabled={isAuthBusy}>
            <LogOut color="#E9D5FF" size={16} />
            <Text style={styles.secondaryButtonText}>Cerrar esta sesión</Text>
          </TouchableOpacity>
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
    borderColor: 'rgba(168,85,247,0.24)',
    backgroundColor: 'rgba(16, 10, 30, 0.88)',
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
  },
  subtitle: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 21,
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(7, 10, 18, 0.82)',
    padding: 18,
    gap: 16,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionCopy: {
    flex: 1,
    gap: 3,
  },
  sessionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  sessionDescription: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  currentBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(34,197,94,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.24)',
  },
  currentBadgeText: {
    color: '#86EFAC',
    fontSize: 12,
    fontWeight: '800',
  },
  infoCallout: {
    borderRadius: 16,
    backgroundColor: 'rgba(138,43,226,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 15,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(233,213,255,0.16)',
    backgroundColor: 'rgba(12, 16, 28, 0.92)',
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

export default SessionsScreen;
