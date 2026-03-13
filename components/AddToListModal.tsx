import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Globe2, Lock, X } from 'lucide-react-native';

const AddToListModal = ({ visible, lists, onClose, onSelect }) => {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Guardar en...</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="white" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {lists.map((list) => (
              <TouchableOpacity
                key={list.id}
                style={styles.listItem}
                onPress={() => onSelect(list.id)}>
                <View style={[styles.colorBadge, { backgroundColor: list.color }]} />

                <View style={styles.listTextBlock}>
                  <Text style={styles.listName}>{list.name}</Text>
                  <Text style={styles.listMeta}>
                    {list.isPublic ? 'Publica' : 'Privada'} · {list.items.length}{' '}
                    {list.items.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.visibilityBadge,
                    list.isPublic
                      ? styles.visibilityBadgePublic
                      : styles.visibilityBadgePrivate,
                  ]}>
                  {list.isPublic ? (
                    <Globe2 color="#86EFAC" size={12} />
                  ) : (
                    <Lock color="#FDE68A" size={12} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 30,
  },
  content: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
    maxHeight: '72%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  colorBadge: { width: 12, height: 12, borderRadius: 6, marginRight: 15 },
  listTextBlock: { flex: 1 },
  listName: { color: 'white', fontSize: 16, fontWeight: '800' },
  listMeta: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
  visibilityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  visibilityBadgePublic: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.24)',
  },
  visibilityBadgePrivate: {
    backgroundColor: 'rgba(234,179,8,0.12)',
    borderColor: 'rgba(234,179,8,0.24)',
  },
});

export default AddToListModal;
