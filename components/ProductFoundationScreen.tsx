import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronLeft,
  CircleDollarSign,
  FileText,
  LockKeyhole,
  ShieldAlert,
  Sparkles,
  UserRound,
} from 'lucide-react-native';

import { buildProfileTheme } from '../data/appState';
import { isSpotifyCatalogConfigured } from '../lib/musicCatalog';
import { getSupabaseStatus } from '../lib/supabase';

const SECTION_CONFIG = [
  {
    id: 'security',
    icon: ShieldAlert,
    title: 'Seguridad y confianza',
    items: [
      'Reportes, bloqueo y controles básicos de abuso.',
      'Sesiones, verificación por mail y alertas de acceso.',
      'Backups, límites de uso y protección de APIs.',
      'Política de contenido y copyright musical.',
    ],
  },
  {
    id: 'legal',
    icon: FileText,
    title: 'Legal y políticas',
    items: [
      'Términos y condiciones.',
      'Política de privacidad.',
      'Lineamientos de comunidad.',
      'Condiciones del plan Plus y baja de cuenta.',
    ],
  },
  {
    id: 'auth',
    icon: UserRound,
    title: 'Cuentas y login',
    items: [
      'Registro por mail.',
      'Acceso por mail y proveedores sociales.',
      'Recuperación de contraseña y verificación.',
      'Perfiles y preferencias persistidas.',
    ],
  },
  {
    id: 'money',
    icon: CircleDollarSign,
    title: 'Monetización futura',
    items: [
      'Freemium con personalización y stats premium.',
      'Afiliación o compra de vinilos/merch.',
      'Promos para lanzamientos o artistas.',
      'Beneficios para usuarios más activos.',
    ],
  },
];

const ProductFoundationScreen = ({
  currentUser,
  preferences,
  notifications,
  spotifySession,
  spotifyStatus,
  spotifyPlaybackStatus,
  musicOracleStatus,
  achievementSummary,
  pushSupportStatus,
  pushPermissionStatus,
  onBack,
  onResetExperience,
  onUpdatePreferences,
  onOpenAuth,
  onOpenSecurity,
  onOpenLegal,
  onOpenPlans,
  onConnectSpotify,
}) => {
  const supabaseStatus = getSupabaseStatus();
  const theme = buildProfileTheme(currentUser);
  const spotifyCatalogReady = isSpotifyCatalogConfigured();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Base de producto</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>PANORAMA GENERAL</Text>
          <Text style={styles.heroTitle}>
            Todo lo importante para que B-Side crezca con una base sólida.
          </Text>
          <Text style={styles.heroText}>
            Acá podés seguir de cerca cuentas, seguridad, legal,
            monetización y personalización sin mezclarlo con la
            experiencia principal.
          </Text>
        </View>

        <View style={styles.snapshotCard}>
          <Text style={styles.snapshotTitle}>Estado actual</Text>
          <Text style={styles.snapshotText}>
            Sesión:{' '}
            {preferences.sessionMode === 'authenticated'
              ? 'cuenta real activa'
              : preferences.sessionMode === 'member_preview'
                ? 'cuenta lista para terminar'
                : 'invitado'}
          </Text>
          <Text style={styles.snapshotText}>
            Plan: {currentUser.plan === 'plus' ? 'Plus' : 'Free'}
          </Text>
          <Text style={styles.snapshotText}>
            Supabase: {supabaseStatus.isConfigured ? 'configurado' : 'pendiente'}
          </Text>
          <Text style={styles.snapshotText}>
            Spotify catálogo: {spotifyCatalogReady ? 'conectado' : 'pendiente'}
          </Text>
          <Text style={styles.snapshotText}>
            Spotify export: {spotifySession?.accessToken ? 'cuenta conectada' : spotifyStatus?.isConfigured ? 'lista para conectar' : 'pendiente'}
          </Text>
          <Text style={styles.snapshotText}>
            Spotify reproducción completa:{' '}
            {spotifyPlaybackStatus?.label || 'pendiente'}
          </Text>
          <Text style={styles.snapshotText}>
            Oráculo B-Side:{' '}
            {musicOracleStatus?.isConfigured ? 'IA conectada' : 'fallback local activo'}
          </Text>
          <Text style={styles.snapshotText}>
            Push del sistema:{' '}
            {pushPermissionStatus === 'granted'
              ? 'permisos activos'
              : pushSupportStatus?.isWeb
                ? 'permiso del navegador pendiente'
                : 'permiso pendiente o dispositivo no listo'}
          </Text>
          <Text style={styles.snapshotText}>
            Personalización: {theme.presetName}
            {currentUser.wallpaperUrl ? ' + fondo' : ''}
          </Text>
          <Text style={styles.snapshotText}>
            Moderación de perfil:{' '}
            {preferences.profileModerationEnabled ? 'activa' : 'pendiente'}
          </Text>
          <Text style={styles.snapshotText}>
            Insignias activas: {achievementSummary?.unlockedBadges?.length || 0}
          </Text>
          <Text style={styles.snapshotText}>
            Notificaciones guardadas: {notifications.length}
          </Text>
          <Text style={styles.snapshotText}>
            Caché local: activa
          </Text>
        </View>

        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={onOpenAuth}>
            <Text style={styles.actionTitle}>Cuentas</Text>
            <Text style={styles.actionText}>
              Revisar acceso, sesión y datos guardados.
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={onOpenSecurity}>
            <Text style={styles.actionTitle}>Seguridad</Text>
            <Text style={styles.actionText}>
              Revisar reportes, sesiones, bloqueos y alertas.
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={onOpenLegal}>
            <Text style={styles.actionTitle}>Legal</Text>
            <Text style={styles.actionText}>
              Ver qué textos y políticas necesita la app.
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={onOpenPlans}>
            <Text style={styles.actionTitle}>Freemium</Text>
            <Text style={styles.actionText}>
              Probar Plus y pensar un precio simple sin romper lo social.
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={onConnectSpotify}>
            <Text style={styles.actionTitle}>Spotify</Text>
            <Text style={styles.actionText}>
              {spotifySession?.accessToken
                ? spotifyPlaybackStatus?.message ||
                  'Cuenta conectada para exportar listas reales.'
                : 'Conectá tu cuenta para exportar listas desde B-Side.'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.preferenceCard}>
          <View style={styles.preferenceRow}>
            <View>
              <Text style={styles.preferenceTitle}>Notificaciones en la app</Text>
              <Text style={styles.preferenceText}>
                Mantiene a mano la actividad y los avisos importantes.
              </Text>
            </View>
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={(value) =>
                onUpdatePreferences({ notificationsEnabled: value })
              }
              trackColor={{ false: '#333', true: '#8A2BE2' }}
              thumbColor="white"
            />
          </View>

          <View style={styles.preferenceRow}>
            <View>
              <Text style={styles.preferenceTitle}>Analytics locales</Text>
              <Text style={styles.preferenceText}>
                Base inicial para entender qué partes mueven más la app.
              </Text>
            </View>
            <Switch
              value={preferences.analyticsEnabled}
              onValueChange={(value) =>
                onUpdatePreferences({ analyticsEnabled: value })
              }
              trackColor={{ false: '#333', true: '#8A2BE2' }}
              thumbColor="white"
            />
          </View>
        </View>

        <View style={styles.roadmapCard}>
          <View style={styles.roadmapHeader}>
            <Sparkles color="#E9D5FF" size={18} />
            <Text style={styles.roadmapTitle}>Siguiente bloque recomendado</Text>
          </View>
          <Text style={styles.roadmapText}>
            1. Mostrar una vista previa del export a Spotify antes de crear la
            playlist. 2. Llevar las push remotas a Android con dev build. 3.
            Afinar descubrir con artistas relacionados y hubs por artista. 4.
            Mejorar el Oráculo con prompts y señales más finas. 5. Definir qué
            queda en Free y qué entra en Plus.
          </Text>
        </View>

        {SECTION_CONFIG.map((section) => {
          const Icon = section.icon;

          return (
            <View key={section.id} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Icon color="#E9D5FF" size={18} />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>

              {section.items.map((item) => (
                <View key={item} style={styles.sectionItem}>
                  <View style={styles.sectionBullet} />
                  <Text style={styles.sectionText}>{item}</Text>
                </View>
              ))}
            </View>
          );
        })}

        <TouchableOpacity style={styles.resetButton} onPress={onResetExperience}>
          <LockKeyhole color="white" size={18} />
          <Text style={styles.resetText}>Volver a ver el onboarding</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 55,
  },
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 18,
  },
  heroCard: {
    backgroundColor: 'rgba(138,43,226,0.12)',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
    gap: 10,
  },
  heroEyebrow: {
    color: '#E9D5FF',
    letterSpacing: 1.3,
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    color: 'white',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
  },
  heroText: {
    color: '#D1D5DB',
    lineHeight: 22,
  },
  snapshotCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 18,
    gap: 8,
  },
  snapshotTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  snapshotText: { color: '#D1D5DB', lineHeight: 20 },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#111827',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 16,
    minHeight: 118,
    justifyContent: 'space-between',
  },
  actionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  actionText: {
    color: '#D1D5DB',
    lineHeight: 20,
  },
  preferenceCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 18,
    gap: 18,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 18,
  },
  preferenceTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  preferenceText: {
    color: '#9CA3AF',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 240,
  },
  roadmapCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 18,
    gap: 10,
  },
  roadmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roadmapTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  roadmapText: { color: '#D1D5DB', lineHeight: 21 },
  sectionCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 18,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(138,43,226,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  sectionBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8A2BE2',
    marginTop: 7,
  },
  sectionText: {
    flex: 1,
    color: '#D1D5DB',
    lineHeight: 21,
  },
  resetButton: {
    backgroundColor: '#8A2BE2',
    borderRadius: 20,
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  resetText: { color: 'white', fontWeight: '800', fontSize: 15 },
});

export default ProductFoundationScreen;

