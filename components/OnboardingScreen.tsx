import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowRight, Disc3, Shield, Sparkles } from 'lucide-react-native';

const OnboardingScreen = ({ onContinue }) => {
  return (
    <View style={styles.container}>
      <View style={styles.glow} />

      <View style={styles.header}>
        <View style={styles.badge}>
          <Disc3 color="#E9D5FF" size={18} />
          <Text style={styles.badgeText}>B-SIDE PREVIEW</Text>
        </View>
        <Text style={styles.title}>Tu rincon para descubrir y guardar discos</Text>
        <Text style={styles.subtitle}>
          Esta version ya tiene feed, busqueda, listas, perfiles, likes,
          comentarios, notificaciones, follow, bloqueo, reportes y chat mock.
          Auth real, legal y monetizacion quedan preparados para la siguiente
          etapa.
        </Text>
      </View>

      <View style={styles.previewCard}>
        <Image
          source={{ uri: 'https://i.postimg.cc/85M3p6Xn/vinilo-violeta.png' }}
          style={styles.previewImage}
        />

        <View style={styles.pointRow}>
          <Sparkles color="#A855F7" size={18} />
          <Text style={styles.pointText}>
            Explora como invitado y personaliza tu foto y fondo desde perfil.
          </Text>
        </View>
        <View style={styles.pointRow}>
          <Shield color="#A855F7" size={18} />
          <Text style={styles.pointText}>
            La estructura ya esta lista para sumar auth, terminos y seguridad.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={onContinue}>
        <Text style={styles.primaryText}>Entrar a la demo</Text>
        <ArrowRight color="white" size={18} />
      </TouchableOpacity>

      <Pressable style={styles.footnote} onPress={onContinue}>
        <Text style={styles.footnoteText}>
          Cuando quieras, esto se puede reemplazar por onboarding real y login.
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 30,
    justifyContent: 'space-between',
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
  previewImage: {
    width: 96,
    height: 96,
    alignSelf: 'center',
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
