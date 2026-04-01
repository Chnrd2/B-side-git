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
  Disc,
  Eye,
  Flame,
  MessageCircle,
  Shield,
  Sparkles,
} from 'lucide-react-native';

const PRIVACY_ROWS = [
  {
    key: 'privateListsByDefault',
    title: 'Listas privadas por defecto',
    text: 'Toda lista nueva arranca cerrada y después decidís si la hacés pública.',
    icon: Disc,
  },
  {
    key: 'showSuggestedProfiles',
    title: 'Sugerencias de perfiles',
    text: 'Muestra gente para conectar dentro del perfil en lugar de recargar el feed.',
    icon: Sparkles,
  },
  {
    key: 'showTasteCompatibility',
    title: 'Compatibilidad musical',
    text: 'Deja visible el ranking suave de afinidad entre gustos y perfiles.',
    icon: Sparkles,
  },
  {
    key: 'showRecentActivity',
    title: 'Actividad reciente',
    text: 'Mantiene a la vista tu bloque de ritmo y última escucha dentro del perfil.',
    icon: Eye,
  },
  {
    key: 'showListeningStatus',
    title: 'Estado de escucha',
    text: 'Controla si el perfil muestra que estás escuchando algo en este momento.',
    icon: Eye,
  },
  {
    key: 'allowDirectMessages',
    title: 'Recomendaciones por mensaje',
    text: 'Permite abrir el flujo para enviar discos y notas personales a tus contactos.',
    icon: MessageCircle,
  },
  {
    key: 'streakAlertsEnabled',
    title: 'Avisos de racha',
    text: 'Te avisa dentro de la app cuando tu racha está por cortarse al final del día.',
    icon: Flame,
  },
];

const PrivacyCenterScreen = ({ preferences, onBack, onUpdatePreferences }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacidad</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Shield color="#E9D5FF" size={20} />
          </View>
          <Text style={styles.heroTitle}>Controlá lo visible sin romper la onda social</Text>
          <Text style={styles.heroText}>
            Este centro ordena lo importante: listas, sugerencias, afinidad, mensajes
            y avisos. Lo que cambiás acá ya impacta en tu perfil y en la experiencia.
          </Text>
        </View>

        <View style={styles.panel}>
          {PRIVACY_ROWS.map((row, index) => {
            const Icon = row.icon;
            const value = Boolean(preferences[row.key]);

            return (
              <View
                key={row.key}
                style={[
                  styles.toggleRow,
                  index === PRIVACY_ROWS.length - 1 && styles.toggleRowLast,
                ]}>
                <View style={styles.toggleBody}>
                  <View style={styles.toggleIcon}>
                    <Icon color="#E9D5FF" size={18} />
                  </View>
                  <View style={styles.toggleTextBlock}>
                    <Text style={styles.toggleTitle}>{row.title}</Text>
                    <Text style={styles.toggleText}>{row.text}</Text>
                  </View>
                </View>

                <Switch
                  value={value}
                  onValueChange={(nextValue) =>
                    onUpdatePreferences({ [row.key]: nextValue })
                  }
                  trackColor={{ false: '#2A2A2A', true: '#8A2BE2' }}
                  thumbColor="white"
                />
              </View>
            );
          })}
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Lo que conviene dejar activado</Text>
          <Text style={styles.tipText}>
            Para una experiencia musical más viva, conviene dejar activadas la
            compatibilidad, las sugerencias de perfiles y los avisos de racha. Lo más
            delicado es mantener listas privadas por defecto y no exponer datos como el
            email.
          </Text>
        </View>
      </ScrollView>
    </View>
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
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
    backgroundColor: 'rgba(88,28,135,0.18)',
    padding: 22,
    gap: 12,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(168,85,247,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { color: 'white', fontSize: 24, lineHeight: 30, fontWeight: '900' },
  heroText: { color: '#D1D5DB', lineHeight: 21 },
  panel: {
    backgroundColor: '#0A0A0A',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    paddingHorizontal: 18,
  },
  toggleRow: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#171717',
    gap: 16,
  },
  toggleRowLast: {
    borderBottomWidth: 0,
  },
  toggleBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  toggleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(168,85,247,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTextBlock: { flex: 1, paddingRight: 12 },
  toggleTitle: { color: 'white', fontSize: 16, fontWeight: '800' },
  toggleText: { color: '#9CA3AF', lineHeight: 20, marginTop: 6 },
  tipCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    backgroundColor: '#0A0A0A',
    padding: 18,
    gap: 10,
  },
  tipTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  tipText: { color: '#D1D5DB', lineHeight: 21 },
});

export default PrivacyCenterScreen;

