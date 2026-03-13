import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  Globe2,
  Lock,
  Play,
  Shuffle,
  Trash2,
} from 'lucide-react-native';

const ListDetailScreen = ({
  list,
  onClose,
  onNavigateToSearch,
  onPlaySong,
  onUpdateListOrder,
  onRemoveItem,
  onShuffleList,
  onToggleVisibility,
}) => {
  if (!list) return null;

  const handleMoveUp = (index) => {
    if (index === 0) return;

    const nextItems = [...list.items];
    const currentItem = nextItems[index];
    nextItems[index] = nextItems[index - 1];
    nextItems[index - 1] = currentItem;

    onUpdateListOrder(list.id, nextItems);
  };

  const handleMoveDown = (index) => {
    if (index === list.items.length - 1) return;

    const nextItems = [...list.items];
    const currentItem = nextItems[index];
    nextItems[index] = nextItems[index + 1];
    nextItems[index + 1] = currentItem;

    onUpdateListOrder(list.id, nextItems);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <View style={[styles.coverPlaceholder, { backgroundColor: list.color }]}>
          <Text style={styles.coverText}>{list.name.charAt(0)}</Text>
        </View>
        <Text style={styles.listName}>{list.name}</Text>
        <Text style={styles.listCount}>
          {list.items.length} {list.items.length === 1 ? 'cancion' : 'canciones'}
        </Text>

        <View
          style={[
            styles.visibilityBadge,
            list.isPublic ? styles.visibilityBadgePublic : styles.visibilityBadgePrivate,
          ]}>
          {list.isPublic ? (
            <Globe2 color="#86EFAC" size={14} />
          ) : (
            <Lock color="#FDE68A" size={14} />
          )}
          <Text style={styles.visibilityBadgeText}>
            {list.isPublic ? 'Lista publica' : 'Lista privada'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.visibilityButton}
          onPress={() => onToggleVisibility?.(list.id)}>
          <Text style={styles.visibilityButtonText}>
            {list.isPublic ? 'Pasar a privada' : 'Hacer publica'}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => list.items.length > 0 && onPlaySong(list.items[0])}>
            <Play color="black" fill="black" size={20} />
            <Text style={styles.playText}>Reproducir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shuffleBtn,
              list.items.length === 0 && styles.shuffleBtnDisabled,
            ]}
            disabled={list.items.length === 0}
            onPress={() => onShuffleList?.(list.id)}>
            <Shuffle color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {list.items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Tu lista esta vacia.</Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={onNavigateToSearch}>
            <Text style={styles.exploreText}>Explorar musica</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(item, index) => item.entryId || `${item.id}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.trackItem}
              activeOpacity={0.92}
              onPress={() => onPlaySong(item)}>
              <Text style={styles.trackIndex}>{index + 1}</Text>

              <Image source={{ uri: item.cover }} style={styles.trackCover} />

              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>

              <View style={styles.controls}>
                <TouchableOpacity
                  onPress={() => handleMoveUp(index)}
                  style={styles.controlBtn}>
                  <ArrowUp color={index === 0 ? '#334155' : '#A855F7'} size={22} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleMoveDown(index)}
                  style={styles.controlBtn}>
                  <ArrowDown
                    color={index === list.items.length - 1 ? '#334155' : '#A855F7'}
                    size={22}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onRemoveItem(list.id, item.entryId || item.id)}
                  style={styles.deleteBtn}>
                  <Trash2 color="#FF3B30" size={22} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', padding: 20, paddingTop: 56 },
  header: { marginBottom: 20 },
  backBtn: {
    backgroundColor: 'rgba(9, 12, 20, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  infoSection: { alignItems: 'center', marginBottom: 26 },
  coverPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 15,
    elevation: 10,
  },
  coverText: {
    fontSize: 60,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.8)',
  },
  listName: { color: 'white', fontSize: 28, fontWeight: '900', marginBottom: 6 },
  listCount: { color: '#9CA3AF', fontSize: 16, marginBottom: 12, fontWeight: '700' },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  visibilityBadgeText: { color: '#E5E7EB', fontWeight: '800', fontSize: 13 },
  visibilityButton: {
    marginTop: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  visibilityButtonText: { color: '#E9D5FF', fontWeight: '800', fontSize: 13 },
  actionButtons: { flexDirection: 'row', gap: 15, marginTop: 18 },
  playBtn: {
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    gap: 8,
  },
  playText: { color: 'black', fontWeight: 'bold', fontSize: 16 },
  shuffleBtn: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shuffleBtnDisabled: {
    opacity: 0.45,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
  },
  emptyText: { color: '#9CA3AF', fontSize: 18, marginBottom: 20 },
  exploreBtn: {
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#8A2BE2',
  },
  exploreText: { color: '#E9D5FF', fontWeight: 'bold', fontSize: 16 },
  listContent: { paddingBottom: 150 },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(7, 10, 18, 0.84)',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  trackIndex: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
    width: 28,
    textAlign: 'center',
    marginRight: 10,
  },
  trackCover: { width: 55, height: 55, borderRadius: 12, marginRight: 15 },
  trackInfo: { flex: 1, justifyContent: 'center' },
  trackTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  trackArtist: { color: '#A855F7', fontSize: 14 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 10 },
  controlBtn: { padding: 5 },
  deleteBtn: {
    padding: 5,
    marginLeft: 4,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 10,
  },
});

export default ListDetailScreen;
