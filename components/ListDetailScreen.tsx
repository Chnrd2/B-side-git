import React from 'react';
import {
  FlatList,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ExternalLink,
  Globe2,
  Lock,
  Play,
  Radio,
  Shuffle,
  Trash2,
} from 'lucide-react-native';
import { getPlaybackState } from '../lib/musicCatalog';

const ListDetailScreen = ({
  list,
  onClose,
  onNavigateToSearch,
  onPlaySong,
  onUpdateListOrder,
  onRemoveItem,
  onShuffleList,
  onToggleVisibility,
  onExportToSpotify,
  isSpotifyConnected,
  isSpotifyExportBusy,
  spotifyExportStatus,
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

  const preferredPlaybackItem =
    list.items.find((item) => item.previewUrl) ||
    list.items.find((item) => item.externalUrl) ||
    list.items[0] ||
    null;
  const preferredPlaybackState = getPlaybackState(preferredPlaybackItem || {});
  const exportSummary =
    spotifyExportStatus?.listId === list.id ? spotifyExportStatus : null;

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
          {list.items.length} {list.items.length === 1 ? 'disco' : 'discos'}
        </Text>

        {list.isSystem ? (
          <View style={[styles.visibilityBadge, styles.systemBadge]}>
            <Lock color="#C4B5FD" size={14} />
            <Text style={styles.visibilityBadgeText}>Solo para vos</Text>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.visibilityBadge,
                list.isPublic
                  ? styles.visibilityBadgePublic
                  : styles.visibilityBadgePrivate,
              ]}>
              {list.isPublic ? (
                <Globe2 color="#86EFAC" size={14} />
              ) : (
                <Lock color="#FDE68A" size={14} />
              )}
              <Text style={styles.visibilityBadgeText}>
                {list.isPublic ? 'Lista pública' : 'Lista privada'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.visibilityButton}
              onPress={() => onToggleVisibility?.(list.id)}>
              <Text style={styles.visibilityButtonText}>
                {list.isPublic ? 'Pasar a privada' : 'Hacer pública'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.playBtn,
              !preferredPlaybackState.canInteract && styles.playBtnDisabled,
              preferredPlaybackState.mode === 'external' && styles.playBtnExternal,
            ]}
            disabled={!preferredPlaybackState.canInteract}
            onPress={() => preferredPlaybackItem && onPlaySong(preferredPlaybackItem)}>
            {preferredPlaybackState.mode === 'external' ? (
              <ExternalLink color="white" size={18} />
            ) : (
              <Play
                color={preferredPlaybackState.canInteract ? 'black' : '#94A3B8'}
                fill={preferredPlaybackState.mode === 'preview' ? 'black' : 'transparent'}
                size={20}
              />
            )}
            <Text
              style={[
                styles.playText,
                preferredPlaybackState.mode === 'external' && styles.playTextExternal,
                !preferredPlaybackState.canInteract && styles.playTextDisabled,
              ]}>
              {preferredPlaybackState.mode === 'preview'
                ? 'Reproducir'
                : preferredPlaybackState.mode === 'external'
                  ? 'Abrir'
                  : 'Sin audio'}
            </Text>
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

        <TouchableOpacity
          style={[
            styles.spotifyExportBtn,
            (!list.items.length || isSpotifyExportBusy) && styles.spotifyExportBtnDisabled,
          ]}
          disabled={!list.items.length || isSpotifyExportBusy}
          onPress={() => onExportToSpotify?.(list.id)}>
          {isSpotifyConnected ? (
            <ExternalLink color="#E9D5FF" size={18} />
          ) : (
            <Radio color="#E9D5FF" size={18} />
          )}
          <Text style={styles.spotifyExportText}>
            {isSpotifyExportBusy
              ? 'Creando playlist...'
              : isSpotifyConnected
                ? 'Llevar a Spotify'
                : 'Vincular Spotify'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.spotifyExportHint}>
          Si hace falta, B-Side usa un tema representativo por cada disco para armar la playlist.
        </Text>

        {exportSummary ? (
          <View
            style={[
              styles.exportStatusCard,
              exportSummary.status === 'success'
                ? styles.exportStatusCardSuccess
                : exportSummary.status === 'pending-connection'
                  ? styles.exportStatusCardPending
                : styles.exportStatusCardError,
            ]}>
            <Text style={styles.exportStatusTitle}>{exportSummary.title}</Text>
            <Text style={styles.exportStatusText}>{exportSummary.message}</Text>
            <Text style={styles.exportStatusMeta}>
              {exportSummary.matchedCount || 0} adentro ·{' '}
              {exportSummary.missingCount || 0} afuera
              {exportSummary.albumSeedCount
                ? ` · ${exportSummary.albumSeedCount} por track representativo`
                : ''}
            </Text>

            {exportSummary.unmatchedTracks?.length ? (
              <Text style={styles.exportStatusHint} numberOfLines={3}>
                No entraron: {exportSummary.unmatchedTracks.join(', ')}
              </Text>
            ) : null}

            {exportSummary.playlistUrl ? (
              <TouchableOpacity
                style={styles.exportStatusButton}
                onPress={() => {
                  void Linking.openURL(exportSummary.playlistUrl);
                }}>
                <Text style={styles.exportStatusButtonText}>Abrir playlist</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>

      {list.items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Tu lista está vacía.</Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={onNavigateToSearch}>
            <Text style={styles.exploreText}>Explorar música</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(item, index) => item.entryId || `${item.id}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            const itemPlaybackState = getPlaybackState(item);

            return (
            <TouchableOpacity
              style={[
                styles.trackItem,
                !itemPlaybackState.canInteract && styles.trackItemDisabled,
              ]}
              activeOpacity={itemPlaybackState.canInteract ? 0.92 : 1}
              disabled={!itemPlaybackState.canInteract}
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
                <Text style={styles.trackPlaybackLabel} numberOfLines={1}>
                  {itemPlaybackState.badge}
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
            );
          }}
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
  systemBadge: {
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderColor: 'rgba(168,85,247,0.24)',
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
  playBtnDisabled: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  playBtnExternal: {
    backgroundColor: '#8A2BE2',
    borderWidth: 1,
    borderColor: 'rgba(233,213,255,0.22)',
  },
  playText: { color: 'black', fontWeight: 'bold', fontSize: 16 },
  playTextExternal: { color: 'white' },
  playTextDisabled: { color: '#94A3B8' },
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
  spotifyExportBtn: {
    marginTop: 14,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
    backgroundColor: 'rgba(88,28,135,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spotifyExportBtnDisabled: {
    opacity: 0.45,
  },
  spotifyExportText: {
    color: '#F5E8FF',
    fontWeight: '800',
    fontSize: 13,
  },
  spotifyExportHint: {
    marginTop: 10,
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 320,
  },
  exportStatusCard: {
    marginTop: 14,
    width: '100%',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  exportStatusCardSuccess: {
    backgroundColor: 'rgba(88,28,135,0.16)',
    borderColor: 'rgba(168,85,247,0.22)',
  },
  exportStatusCardError: {
    backgroundColor: 'rgba(127,29,29,0.18)',
    borderColor: 'rgba(248,113,113,0.22)',
  },
  exportStatusCardPending: {
    backgroundColor: 'rgba(30,41,59,0.5)',
    borderColor: 'rgba(196,181,253,0.18)',
  },
  exportStatusTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  exportStatusText: {
    color: '#E5E7EB',
    lineHeight: 20,
  },
  exportStatusMeta: {
    color: '#C4B5FD',
    fontWeight: '700',
    fontSize: 12,
  },
  exportStatusHint: {
    color: '#CBD5E1',
    lineHeight: 19,
    fontSize: 12,
  },
  exportStatusButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  exportStatusButtonText: {
    color: '#F5F3FF',
    fontWeight: '800',
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
  trackItemDisabled: {
    opacity: 0.58,
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
  trackPlaybackLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '700',
  },
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

