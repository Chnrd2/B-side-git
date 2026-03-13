import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Globe2, Lock, Plus } from 'lucide-react-native';

const ListsScreen = ({ lists, onOpenList, onCreateList }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>CURADAS POR VOS</Text>
          <Text style={styles.headerTitle}>Mis listas</Text>
        </View>

        <TouchableOpacity onPress={onCreateList} style={styles.addBtn}>
          <Plus color="white" size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.listCard,
              {
                backgroundColor: `${item.color}15`,
                borderColor: `${item.color}30`,
              },
            ]}
            activeOpacity={0.9}
            onPress={() => onOpenList(item)}>
            <View style={styles.cardTop}>
              <View style={[styles.colorBadge, { backgroundColor: item.color }]} />
              <View
                style={[
                  styles.visibilityBadge,
                  item.isPublic
                    ? styles.visibilityBadgePublic
                    : styles.visibilityBadgePrivate,
                ]}>
                {item.isPublic ? (
                  <Globe2 color="#86EFAC" size={12} />
                ) : (
                  <Lock color="#FDE68A" size={12} />
                )}
                <Text style={styles.visibilityText}>
                  {item.isPublic ? 'Publica' : 'Privada'}
                </Text>
              </View>
            </View>

            <View>
              <Text style={styles.listName}>{item.name}</Text>
              <Text style={styles.listCount}>
                {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerEyebrow: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  headerTitle: { color: 'white', fontSize: 32, fontWeight: '900', marginTop: 4 },
  addBtn: {
    backgroundColor: 'rgba(9, 12, 20, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    borderRadius: 18,
  },
  gridContent: {
    paddingBottom: 140,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 12,
  },
  listCard: {
    flex: 1,
    minHeight: 180,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  visibilityText: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '800',
  },
  listName: { color: 'white', fontSize: 18, fontWeight: '900' },
  listCount: { color: '#9CA3AF', fontSize: 13, marginTop: 6, fontWeight: '700' },
});

export default ListsScreen;
