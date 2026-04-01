import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowRight,
  ChevronLeft,
  FileText,
  Gavel,
  ShieldCheck,
} from 'lucide-react-native';

import { LEGAL_DOCUMENTS } from '../data/legalDocuments';

const LegalCenterScreen = ({ onBack, onOpenDocument }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <FileText color="#E9D5FF" size={18} />
            <Text style={styles.heroEyebrow}>VERSIÓN PRELIMINAR</Text>
          </View>
          <Text style={styles.heroTitle}>Lo legal también forma parte de la experiencia</Text>
          <Text style={styles.heroText}>
            Acá queda reunido todo lo que conviene tener claro para cuentas,
            privacidad, comunidad y plan Plus.
          </Text>
        </View>

        {LEGAL_DOCUMENTS.map((document) => (
          <TouchableOpacity
            key={document.id}
            style={styles.sectionCard}
            activeOpacity={0.88}
            onPress={() => onOpenDocument?.(document.id)}>
            <View style={styles.sectionHeader}>
              <Gavel color="#E9D5FF" size={18} />
              <Text style={styles.sectionTitle}>{document.title}</Text>
            </View>
            <Text style={styles.sectionText}>{document.summary}</Text>
            <View style={styles.sectionFooter}>
              <Text style={styles.sectionMeta}>
                Versión {document.version} {' · '} {document.updatedAt}
              </Text>
              <View style={styles.openRow}>
                <Text style={styles.openText}>Abrir documento</Text>
                <ArrowRight color="#E9D5FF" size={16} />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.noticeCard}>
          <ShieldCheck color="#E9D5FF" size={18} />
          <Text style={styles.noticeText}>
            Conviene mantener estos textos visibles dentro de la app, en web,
            durante el registro y junto a cualquier alta del plan Plus.
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
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroEyebrow: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: { color: 'white', fontSize: 26, lineHeight: 32, fontWeight: '900' },
  heroText: { color: '#D1D5DB', lineHeight: 22 },
  sectionCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 18,
    gap: 10,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  sectionText: { color: '#D1D5DB', lineHeight: 21 },
  sectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  sectionMeta: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openText: {
    color: '#E9D5FF',
    fontSize: 13,
    fontWeight: '800',
  },
  noticeCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 18,
    flexDirection: 'row',
    gap: 12,
  },
  noticeText: { flex: 1, color: '#E5E7EB', lineHeight: 21 },
});

export default LegalCenterScreen;


