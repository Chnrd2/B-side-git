import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowRight, Disc3, Shield, Sparkles } from 'lucide-react-native';

const OnboardingScreen = ({ onContinue }) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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
            Personalizá tu perfil, compartí reseñas y descubrí artistas desde una
            comunidad hecha para melómanos.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={onContinue}>
        <Text style={styles.primaryText}>Entrar</Text>
        <ArrowRight color="white" size={18} />
      </TouchableOpacity>

      <Pressable style={styles.footnote} onPress={onContinue}>
        <Text style={styles.footnoteText}>
          Tu lado B también merece un lugar propio.
        </Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 44,
    justifyContent: 'space-between',
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
    alignSelf: 'center',
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
