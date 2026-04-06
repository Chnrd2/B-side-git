import React from 'react';
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeft, CircleHelp, LifeBuoy, Mail } from 'lucide-react-native';

const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'hola@bside.app';

const FAQ_ITEMS = [
  {
    id: 'account',
    title: '¿Cómo recupero mi cuenta?',
    text: 'Desde Cuenta y sesión podés pedir un email para cambiar la contraseña o volver a entrar con magic link.',
  },
  {
    id: 'spotify',
    title: '¿Qué pasa si un disco no se reproduce?',
    text: 'B-Side usa previews cuando están disponibles. Si un lanzamiento no trae audio directo, la ficha te ofrece abrirlo en Spotify o en su release original.',
  },
  {
    id: 'privacy',
    title: '¿Cómo controlo quién ve mi actividad?',
    text: 'En el Centro de privacidad podés ocultar actividad reciente, compatibilidad musical y sugerencias de perfiles.',
  },
];

const HelpScreen = ({ onBack }) => {
  const openMail = () => {
    void Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Ayuda B-Side')}`
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
          <Text style={styles.headerTitle}>Ayuda</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <LifeBuoy color="#E9D5FF" size={20} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>SOPORTE</Text>
            <Text style={styles.title}>Todo lo clave para destrabarte rápido</Text>
            <Text style={styles.subtitle}>
              Dejamos una base simple y clara para que la app se pueda usar sin perder
              tiempo en menús raros.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.contactCard} onPress={openMail}>
          <View style={styles.contactIcon}>
            <Mail color="#E9D5FF" size={18} />
          </View>
          <View style={styles.contactCopy}>
            <Text style={styles.contactTitle}>Contacto</Text>
            <Text style={styles.contactText}>{SUPPORT_EMAIL}</Text>
            <Text style={styles.contactHint}>
              Usalo para soporte, bugs y consultas de cuenta.
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <CircleHelp color="#A855F7" size={18} />
            <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>
          </View>

          {FAQ_ITEMS.map((item) => (
            <View key={item.id} style={styles.faqItem}>
              <Text style={styles.faqTitle}>{item.title}</Text>
              <Text style={styles.faqText}>{item.text}</Text>
            </View>
          ))}
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
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
    backgroundColor: 'rgba(13, 10, 28, 0.9)',
    padding: 20,
    flexDirection: 'row',
    gap: 14,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(138,43,226,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 6,
  },
  eyebrow: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  subtitle: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
  },
  contactCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(7, 10, 18, 0.84)',
    padding: 18,
    flexDirection: 'row',
    gap: 12,
  },
  contactIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(138,43,226,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactCopy: {
    flex: 1,
    gap: 3,
  },
  contactTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  contactText: {
    color: '#A855F7',
    fontSize: 15,
    fontWeight: '800',
  },
  contactHint: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(7, 10, 18, 0.82)',
    padding: 18,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  faqItem: {
    gap: 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  faqTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  faqText: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 19,
  },
});

export default HelpScreen;
