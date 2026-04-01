import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Plus, X } from 'lucide-react-native';

const CreateListModal = ({ visible, onClose, onSubmit, defaultIsPublic = false }) => {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (!visible) {
      setName('');
      setIsPublic(defaultIsPublic);
    }
  }, [defaultIsPublic, visible]);

  useEffect(() => {
    if (visible) {
      setIsPublic(defaultIsPublic);
    }
  }, [defaultIsPublic, visible]);

  const handleSubmit = () => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    onSubmit({
      name: trimmedName,
      isPublic,
    });
    setName('');
    setIsPublic(defaultIsPublic);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Nueva lista</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="white" size={24} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Crea una lista propia para guardar discos y elegir si quieres que
            quede privada o lista para compartir.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej: Trap argentino"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          <Text style={styles.visibilityLabel}>Visibilidad</Text>
          <View style={styles.visibilityRow}>
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                !isPublic && styles.visibilityOptionActive,
              ]}
              onPress={() => setIsPublic(false)}>
              <Text
                style={[
                  styles.visibilityTitle,
                  !isPublic && styles.visibilityTitleActive,
                ]}>
                Privada
              </Text>
              <Text style={styles.visibilityText}>
                Solo aparece para vos.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.visibilityOption,
                isPublic && styles.visibilityOptionActive,
              ]}
              onPress={() => setIsPublic(true)}>
              <Text
                style={[
                  styles.visibilityTitle,
                  isPublic && styles.visibilityTitleActive,
                ]}>
                Pública
              </Text>
              <Text style={styles.visibilityText}>
                Ideal para compartirla.
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, !name.trim() && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!name.trim()}>
            <Plus color="white" size={18} />
            <Text style={styles.submitText}>Crear lista</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#0A0A0A',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { color: 'white', fontSize: 22, fontWeight: '900' },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#111',
    color: 'white',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  visibilityLabel: {
    color: '#C4B5FD',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 10,
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityOption: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: '#111827',
    padding: 14,
    gap: 6,
  },
  visibilityOptionActive: {
    borderColor: '#8A2BE2',
    backgroundColor: 'rgba(138,43,226,0.12)',
  },
  visibilityTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  visibilityTitleActive: {
    color: '#E9D5FF',
  },
  visibilityText: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#8A2BE2',
    borderRadius: 18,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default CreateListModal;
