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
  AlertTriangle,
  ChevronLeft,
  LockKeyhole,
  Shield,
  Siren,
} from 'lucide-react-native';

const SecurityCenterScreen = ({
  preferences,
  onBack,
  onUpdatePreferences,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seguridad</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>
            Lo mínimo para que una comunidad musical se sienta segura
          </Text>
          <Text style={styles.heroText}>
            Esta parte conviene resolverla temprano para que la experiencia se
            sienta cuidada desde el primer uso.
          </Text>
        </View>

        <View style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextBlock}>
              <Text style={styles.toggleTitle}>Reportes de contenido</Text>
              <Text style={styles.toggleText}>
                Base para denunciar reseñas, comentarios, perfiles y mensajes.
              </Text>
            </View>
            <Switch
              value={preferences.contentReportsEnabled}
              onValueChange={(value) =>
                onUpdatePreferences({ contentReportsEnabled: value })
              }
              trackColor={{ false: '#333', true: '#8A2BE2' }}
              thumbColor="white"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextBlock}>
              <Text style={styles.toggleTitle}>Corte de sesión sensible</Text>
              <Text style={styles.toggleText}>
                Ayuda a cerrar sesiones en dispositivos inactivos.
              </Text>
            </View>
            <Switch
              value={preferences.sessionTimeoutEnabled}
              onValueChange={(value) =>
                onUpdatePreferences({ sessionTimeoutEnabled: value })
              }
              trackColor={{ false: '#333', true: '#8A2BE2' }}
              thumbColor="white"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextBlock}>
              <Text style={styles.toggleTitle}>Alertas de login</Text>
              <Text style={styles.toggleText}>
                Para avisar accesos nuevos o cambios sensibles de cuenta.
              </Text>
            </View>
            <Switch
              value={preferences.loginAlertsEnabled}
              onValueChange={(value) =>
                onUpdatePreferences({ loginAlertsEnabled: value })
              }
              trackColor={{ false: '#333', true: '#8A2BE2' }}
              thumbColor="white"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextBlock}>
              <Text style={styles.toggleTitle}>Bloqueo entre usuarios</Text>
              <Text style={styles.toggleText}>
                Estructura mínima para cortar acoso o spam directo.
              </Text>
            </View>
            <Switch
              value={preferences.blockedUsersEnabled}
              onValueChange={(value) =>
                onUpdatePreferences({ blockedUsersEnabled: value })
              }
              trackColor={{ false: '#333', true: '#8A2BE2' }}
              thumbColor="white"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextBlock}>
              <Text style={styles.toggleTitle}>Revisión de avatar y fondo</Text>
              <Text style={styles.toggleText}>
                Deja lista la cola manual para revisar fotos antes de volverlas
                públicas.
              </Text>
            </View>
            <Switch
              value={preferences.profileModerationEnabled}
              onValueChange={(value) =>
                onUpdatePreferences({ profileModerationEnabled: value })
              }
              trackColor={{ false: '#333', true: '#8A2BE2' }}
              thumbColor="white"
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionRow}>
            <Shield color="#E9D5FF" size={18} />
            <Text style={styles.sectionTitle}>Seguridad de cuenta</Text>
          </View>
          <Text style={styles.sectionText}>
            Login seguro, verificación por mail, recuperación de contraseña,
            sesiones y doble factor opcional.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionRow}>
            <Siren color="#E9D5FF" size={18} />
            <Text style={styles.sectionTitle}>Moderación y abuso</Text>
          </View>
          <Text style={styles.sectionText}>
            Reportes, bloqueo entre usuarios, filtros básicos y revisión manual.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionRow}>
            <Shield color="#E9D5FF" size={18} />
            <Text style={styles.sectionTitle}>Fotos de perfil y wallpapers</Text>
          </View>
          <Text style={styles.sectionText}>
            Lo más razonable para arrancar es una mezcla: subir imagen, marcarla
            como pendiente, dejar revisión manual y sumar detección automática
            después con un proveedor externo.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionRow}>
            <LockKeyhole color="#E9D5FF" size={18} />
            <Text style={styles.sectionTitle}>Protección de datos</Text>
          </View>
          <Text style={styles.sectionText}>
            Acceso mínimo, backups, logs, cifrado de secretos y rotación de
            credenciales.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionRow}>
            <AlertTriangle color="#E9D5FF" size={18} />
            <Text style={styles.sectionTitle}>Siguientes cuidados</Text>
          </View>
          <Text style={styles.sectionText}>
            Política de incidentes, canal de soporte, revisión de dependencias,
            cierre de sesión remoto y monitoreo de acceso.
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
    backgroundColor: 'rgba(138,43,226,0.12)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
    padding: 22,
    gap: 10,
  },
  heroTitle: { color: 'white', fontSize: 26, lineHeight: 32, fontWeight: '900' },
  heroText: { color: '#D1D5DB', lineHeight: 22 },
  toggleCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 18,
    gap: 18,
  },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 18 },
  toggleTextBlock: { flex: 1 },
  toggleTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  toggleText: { color: '#9CA3AF', lineHeight: 20, marginTop: 6 },
  sectionCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 18,
    gap: 10,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  sectionText: { color: '#D1D5DB', lineHeight: 21 },
});

export default SecurityCenterScreen;

