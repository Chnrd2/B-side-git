import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BadgeCheck, ChevronLeft, Sparkles } from 'lucide-react-native';

const PLANS = [
  {
    id: 'free',
    title: 'Free',
    price: '$0',
    caption: 'Para explorar y compartir lo básico.',
    features: [
      'Perfil, feed, likes, comentarios y reseñas',
      'Listas personales',
      'Chat básico',
      'Personalización base',
    ],
  },
  {
    id: 'plus',
    title: 'Plus',
    price: '$4.99',
    caption: 'Freemium simple, estético y lógico para esta app.',
    features: [
      'Más personalización de fondo y perfil',
      'Stats personales y tops históricos',
      'Listas avanzadas y templates',
      'Insignias y extras para usuarios muy fan',
    ],
  },
];

const PlansScreen = ({ currentPlan, onBack, onSelectPlan }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Freemium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>
            La mejor monetización acá parece ser freemium
          </Text>
          <Text style={styles.heroText}>
            Mantiene el corazón social gratis y cobra por herramientas,
            estética y profundidad para el usuario más fanático.
          </Text>
        </View>

        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.id;

          return (
            <View
              key={plan.id}
              style={[styles.planCard, isActive && styles.planCardActive]}>
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                </View>
                {isActive ? (
                  <View style={styles.activeBadge}>
                    <BadgeCheck color="white" size={14} />
                    <Text style={styles.activeBadgeText}>Activo</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.planCaption}>{plan.caption}</Text>

              {plan.features.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Sparkles color="#A855F7" size={16} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}

              <TouchableOpacity
                style={[
                  styles.planButton,
                  isActive && styles.planButtonDisabled,
                ]}
                disabled={isActive}
                onPress={() => onSelectPlan(plan.id)}>
                <Text style={styles.planButtonText}>
                  {isActive ? 'Plan actual' : `Probar ${plan.title}`}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
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
  planCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 18,
    gap: 14,
  },
  planCardActive: {
    borderColor: '#8A2BE2',
    backgroundColor: 'rgba(138,43,226,0.12)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: { color: 'white', fontSize: 22, fontWeight: '900' },
  planPrice: { color: '#E9D5FF', fontSize: 18, marginTop: 4, fontWeight: '700' },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  activeBadgeText: { color: 'white', fontWeight: '800', fontSize: 12 },
  planCaption: { color: '#D1D5DB', lineHeight: 21 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureText: { flex: 1, color: '#E5E7EB', lineHeight: 21 },
  planButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planButtonDisabled: { opacity: 0.6 },
  planButtonText: { color: 'white', fontWeight: '800', fontSize: 15 },
});

export default PlansScreen;

