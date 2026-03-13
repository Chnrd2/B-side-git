import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronLeft,
  FileText,
  Gavel,
  ShieldCheck,
} from 'lucide-react-native';

const CATEGORY_LABELS = {
  account: 'Cuenta y acceso',
  privacy: 'Datos y privacidad',
  safety: 'Comunidad y seguridad',
  billing: 'Planes y pagos',
};

const LegalDocumentScreen = ({ document, onBack }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{document?.shortTitle || 'Legal'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <FileText color="#E9D5FF" size={18} />
            <Text style={styles.heroEyebrow}>
              {CATEGORY_LABELS[document?.category] || 'Documento interno'}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{document?.title}</Text>
          <Text style={styles.heroText}>{document?.summary}</Text>

          <View style={styles.metaWrap}>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Version {document?.version}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Actualizado {document?.updatedAt}</Text>
            </View>
          </View>
        </View>

        <View style={styles.touchpointsCard}>
          <View style={styles.sectionHeader}>
            <ShieldCheck color="#E9D5FF" size={18} />
            <Text style={styles.sectionTitle}>Donde conviene mostrarlo</Text>
          </View>
          <View style={styles.touchpointsWrap}>
            {(document?.touchpoints || []).map((touchpoint) => (
              <View key={touchpoint} style={styles.touchpointBadge}>
                <Text style={styles.touchpointText}>{touchpoint}</Text>
              </View>
            ))}
          </View>
        </View>

        {(document?.sections || []).map((section) => (
          <View key={section.heading} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Gavel color="#E9D5FF" size={18} />
              <Text style={styles.sectionTitle}>{section.heading}</Text>
            </View>
            <Text style={styles.sectionText}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Nota de trabajo</Text>
          <Text style={styles.noticeText}>
            Esto sigue siendo un borrador de producto. Antes de publicar,
            conviene revisarlo con alguien de legal y adaptarlo al pais, al
            modelo de negocio y al proveedor de pagos que termine usando B-Side.
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
    gap: 12,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroEyebrow: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: { color: 'white', fontSize: 28, lineHeight: 34, fontWeight: '900' },
  heroText: { color: '#D1D5DB', lineHeight: 22 },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  metaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
    backgroundColor: 'rgba(7, 10, 18, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaText: { color: '#F5F3FF', fontSize: 12, fontWeight: '800' },
  touchpointsCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 18,
    gap: 12,
  },
  touchpointsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  touchpointBadge: {
    borderRadius: 999,
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  touchpointText: { color: '#E9D5FF', fontWeight: '700', fontSize: 12 },
  sectionCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 18,
    gap: 10,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: '800', flex: 1 },
  sectionText: { color: '#D1D5DB', lineHeight: 21 },
  noticeCard: {
    backgroundColor: '#111827',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 18,
    gap: 8,
  },
  noticeTitle: { color: 'white', fontSize: 16, fontWeight: '800' },
  noticeText: { color: '#E5E7EB', lineHeight: 21 },
});

export default LegalDocumentScreen;
