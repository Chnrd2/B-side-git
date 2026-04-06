import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronDown,
  Clock3,
  Disc,
  ExternalLink,
  Mic2,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Send,
} from 'lucide-react-native';

import {
  fetchAlbumTracks,
  getAlbumPlaybackState,
  getAlbumPlaybackTarget,
  getPlaybackState,
} from '../lib/musicCatalog';

const TrackRow = ({ track, index, onPlaySong }) => {
  const playbackState = getPlaybackState(track);

  return (
    <TouchableOpacity
      style={[
        styles.trackItem,
        !playbackState.canInteract && styles.trackItemDisabled,
      ]}
      activeOpacity={playbackState.canInteract ? 0.86 : 1}
      disabled={!playbackState.canInteract}
      onPress={() => onPlaySong?.(track)}>
      <Text style={styles.trackNumber}>{index + 1}</Text>

      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.trackMeta} numberOfLines={2}>
          {track.durationLabel ||
            (playbackState.mode === 'preview' ? '0:30' : '--:--')}
          {' · '}
          {playbackState.hint}
        </Text>
      </View>

      <View style={styles.trackAction}>
        <View
          style={[
            styles.trackStatusPill,
            playbackState.mode === 'preview'
              ? styles.trackStatusPillPreview
              : playbackState.mode === 'external'
                ? styles.trackStatusPillExternal
                : styles.trackStatusPillMuted,
          ]}>
          <Text style={styles.trackStatusPillText}>{playbackState.badge}</Text>
        </View>

        {playbackState.mode === 'preview' ? (
          <Play color="#A855F7" fill="#A855F7" size={18} />
        ) : playbackState.mode === 'external' ? (
          <ExternalLink color="#C4B5FD" size={18} />
        ) : (
          <Play color="#334155" size={18} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const AlbumDetailScreen = ({
  album,
  onClose,
  onPlaySong,
  onPinToTop5,
  isPinned,
  isSavedForLater,
  onWriteReview,
  onAddToList,
  onSaveForLater,
  onShareAlbum,
  onOpenArtist,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);

  const albumPlaybackTarget = useMemo(
    () => getAlbumPlaybackTarget(album, tracks),
    [album, tracks]
  );
  const albumPlaybackState = useMemo(
    () => getAlbumPlaybackState(album, tracks),
    [album, tracks]
  );

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    setIsPlaying(false);
    setIsLoadingAudio(false);
    setIsLoadingTracks(true);
    setTracks([]);

    fetchAlbumTracks(album, { signal: controller.signal })
      .then((nextTracks) => {
        if (isMounted) {
          setTracks(nextTracks);
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError' && isMounted) {
          setTracks([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingTracks(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [album]);

  const handlePlayToggle = async () => {
    if (!onPlaySong || !albumPlaybackState.canInteract) {
      return;
    }

    setIsLoadingAudio(true);

    try {
      const didStartPlayback = await onPlaySong(albumPlaybackTarget);
      setIsPlaying(Boolean(didStartPlayback && albumPlaybackState.mode === 'preview'));
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const playbackSummary = useMemo(() => {
    const previewCount = tracks.filter((track) => track.previewUrl).length;
    const externalOnlyCount = tracks.filter(
      (track) => !track.previewUrl && track.externalUrl
    ).length;

    if (isLoadingTracks) {
      return 'Cargando la lista real de canciones y buscando audio disponible.';
    }

    if (!tracks.length) {
      return albumPlaybackState.mode === 'external'
        ? 'Este lanzamiento no trajo audio reproducible en B-Side, pero dejamos listo el salto al origen para que sigas escuchando afuera.'
        : 'Este álbum no trajo audio usable en B-Side, aunque igual podés guardarlo, reseñarlo o seguir al artista.';
    }

    if (albumPlaybackState.mode === 'external') {
      return `No llegó audio directo para este lanzamiento. ${
        externalOnlyCount > 0
          ? `${externalOnlyCount} track${externalOnlyCount === 1 ? '' : 's'} abren afuera.`
          : 'B-Side te lleva al origen cuando el catálogo no trae audio.'
      }`;
    }

    if (previewCount === 0) {
      return 'Las canciones ya están cargadas, pero ninguna trajo audio. B-Side intentará abrir la fuente externa más confiable.';
    }

    return `${previewCount} de ${tracks.length} track${
      tracks.length === 1 ? '' : 's'
    } tienen audio acá. ${
      externalOnlyCount > 0
        ? `${externalOnlyCount} quedan con salida externa.`
        : 'El resto también debería dejarte seguir explorando desde la ficha.'
    }`;
  }, [albumPlaybackState.mode, isLoadingTracks, tracks]);
  const playbackHighlights = useMemo(() => {
    const previewCount = tracks.filter((track) => track.previewUrl).length;
    const externalCount = tracks.filter(
      (track) => !track.previewUrl && track.externalUrl
    ).length;

    return [
      {
        label: 'Catálogo',
        value:
          album.source === 'spotify'
            ? 'Spotify'
            : album.source === 'itunes'
              ? 'iTunes'
              : 'B-Side',
      },
      {
        label: 'Con audio',
        value: `${previewCount}/${Math.max(tracks.length, previewCount || 1)}`,
      },
      {
        label: 'Salida externa',
        value: externalCount ? `${externalCount} tracks` : 'No hace falta',
      },
    ];
  }, [album.source, tracks]);
  const albumMetaChips = [
    album.year ? `${album.year}` : null,
    album.genre || null,
    albumPlaybackState.badge,
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <ChevronDown color="white" size={32} />
          </TouchableOpacity>
        </View>

        <View style={styles.coverContainer}>
          {album.cover ? (
            <Image source={{ uri: album.cover }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverFallback}>
              <Disc color="#E9D5FF" size={58} />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.metaChipRow}>
            {albumMetaChips.map((chip) => (
              <View key={chip} style={styles.metaChip}>
                <Text style={styles.metaChipText}>{chip}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {album.title}
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!onOpenArtist}
            onPress={() =>
              onOpenArtist?.({
                artist: album.artist,
                artistId: album.artistId,
                artistUrl: album.artistUrl,
                source: album.source,
              })
            }>
            <Text style={styles.artist}>{album.artist}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.playBtnBig,
              albumPlaybackState.mode === 'external' && styles.playBtnBigExternal,
              !albumPlaybackState.canInteract && styles.playBtnBigDisabled,
            ]}
            onPress={handlePlayToggle}
            activeOpacity={albumPlaybackState.canInteract ? 0.8 : 1}
            disabled={!albumPlaybackState.canInteract}>
            {isLoadingAudio ? (
              <ActivityIndicator
                color={albumPlaybackState.mode === 'external' ? 'white' : 'black'}
              />
            ) : isPlaying ? (
              <Pause color="black" fill="black" size={24} />
            ) : albumPlaybackState.mode === 'external' ? (
              <ExternalLink color="white" size={22} />
            ) : (
              <Play
                color={albumPlaybackState.canInteract ? 'black' : '#9CA3AF'}
                fill={albumPlaybackState.mode === 'preview' ? 'black' : 'transparent'}
                size={24}
                style={{ marginLeft: albumPlaybackState.mode === 'preview' ? 4 : 0 }}
              />
            )}
          </TouchableOpacity>

          <Text style={styles.playBtnLabel}>
            {isLoadingAudio ? 'Preparando audio…' : albumPlaybackState.actionLabel}
          </Text>

          <Text style={styles.playHint}>{playbackSummary}</Text>

          <View style={styles.playbackStatsRow}>
            {playbackHighlights.map((highlight) => (
              <View key={highlight.label} style={styles.playbackStatCard}>
                <Text style={styles.playbackStatLabel}>{highlight.label}</Text>
                <Text style={styles.playbackStatValue}>{highlight.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() =>
                onOpenArtist?.({
                  artist: album.artist,
                  artistId: album.artistId,
                  artistUrl: album.artistUrl,
                  source: album.source,
                })
              }>
              <Mic2 color="#C4B5FD" size={16} />
              <Text style={styles.secondaryActionText}>Ver artista</Text>
            </TouchableOpacity>

            {albumPlaybackState.mode === 'external' ? (
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={handlePlayToggle}>
                <ExternalLink color="#C4B5FD" size={16} />
                <Text style={styles.secondaryActionText}>Abrir lanzamiento</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={onPinToTop5}>
            <Disc color={isPinned ? '#A855F7' : 'white'} size={28} />
            <Text style={[styles.actionText, isPinned && { color: '#A855F7' }]}>
              {isPinned ? 'Fijado' : 'Fijar Top 5'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onWriteReview}>
            <MessageSquare color="white" size={28} />
            <Text style={styles.actionText}>Reseñar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onAddToList}>
            <Plus color="white" size={32} />
            <Text style={styles.actionText}>A lista</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onShareAlbum(album)}>
            <Send color="white" size={28} />
            <Text style={styles.actionText}>Recomendar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.saveForLaterButton,
            isSavedForLater && styles.saveForLaterButtonActive,
          ]}
          onPress={onSaveForLater}>
          <Clock3 color={isSavedForLater ? '#C4B5FD' : '#E5E7EB'} size={18} />
          <Text
            style={[
              styles.saveForLaterText,
              isSavedForLater && styles.saveForLaterTextActive,
            ]}>
            {isSavedForLater ? 'Ya está en Por escuchar' : 'Guardar para escuchar'}
          </Text>
        </TouchableOpacity>

        <View style={styles.tracklistContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionTitle}>Canciones del álbum</Text>
              <Text style={styles.sectionSubtitle}>
                Tocá un track para escuchar la muestra o abrirlo afuera si el catálogo no trae audio.
              </Text>
            </View>
            {album.source ? (
              <View style={styles.sourcePill}>
                <Text style={styles.sourcePillText}>
                  {album.source === 'spotify' ? 'Spotify' : 'iTunes'}
                </Text>
              </View>
            ) : null}
          </View>

          {isLoadingTracks ? (
            <View style={styles.loadingTracks}>
              <ActivityIndicator color="#A855F7" />
              <Text style={styles.loadingTracksText}>
                Trayendo canciones reales del álbum…
              </Text>
            </View>
          ) : tracks.length === 0 ? (
            <View style={styles.emptyTracksCard}>
              <Text style={styles.emptyTracksTitle}>No llegó una lista usable de canciones</Text>
              <Text style={styles.emptyTracksText}>
                En algunos lanzamientos Spotify no entrega audio. Igual podés
                abrir el artista, guardar el disco o reseñarlo desde B-Side.
              </Text>
            </View>
          ) : (
            tracks.map((track, index) => (
              <TrackRow
                key={track.id || `${track.title}-${index}`}
                track={track}
                index={index}
                onPlaySong={onPlaySong}
              />
            ))
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  closeBtn: {
    padding: 5,
    borderRadius: 18,
    backgroundColor: 'rgba(9,12,20,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  coverContainer: {
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#A855F7',
    shadowOpacity: 0.32,
    shadowRadius: 30,
    elevation: 15,
  },
  coverImage: { width: 280, height: 280, borderRadius: 24 },
  coverFallback: {
    width: 280,
    height: 280,
    borderRadius: 24,
    backgroundColor: 'rgba(88,28,135,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
  },
  infoContainer: { paddingHorizontal: 25, marginTop: 30, alignItems: 'center' },
  metaChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metaChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(17,24,39,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.16)',
  },
  metaChipText: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 5,
  },
  artist: {
    color: '#A855F7',
    fontSize: 18,
    fontWeight: '800',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(168,85,247,0.35)',
  },
  playBtnBig: {
    backgroundColor: 'white',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  playBtnBigExternal: {
    backgroundColor: '#8A2BE2',
    borderWidth: 1,
    borderColor: 'rgba(233,213,255,0.24)',
  },
  playBtnBigDisabled: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  playBtnLabel: {
    marginTop: 10,
    color: '#F5F3FF',
    fontSize: 14,
    fontWeight: '800',
  },
  playHint: {
    marginTop: 12,
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 320,
  },
  playbackStatsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  playbackStatCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(7, 10, 18, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  playbackStatLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  playbackStatValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.2)',
  },
  secondaryActionText: {
    color: '#F5E8FF',
    fontSize: 12,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    paddingBottom: 30,
  },
  actionBtn: { alignItems: 'center' },
  actionText: { color: 'white', fontSize: 12, marginTop: 8, fontWeight: '700' },
  saveForLaterButton: {
    marginTop: 18,
    marginHorizontal: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.22)',
    backgroundColor: 'rgba(11,17,33,0.78)',
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  saveForLaterButtonActive: {
    borderColor: 'rgba(168,85,247,0.36)',
    backgroundColor: 'rgba(31,11,49,0.72)',
  },
  saveForLaterText: {
    color: '#E5E7EB',
    fontWeight: '700',
    fontSize: 14,
  },
  saveForLaterTextActive: {
    color: '#F5E8FF',
  },
  tracklistContainer: { paddingHorizontal: 25, marginTop: 30 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 12,
  },
  sectionTitleGroup: {
    flex: 1,
    gap: 5,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
  sourcePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
    backgroundColor: 'rgba(88,28,135,0.22)',
  },
  sourcePillText: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '800',
  },
  loadingTracks: {
    paddingVertical: 22,
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  loadingTracksText: {
    color: '#C4B5FD',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyTracksCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(10,10,10,0.92)',
  },
  emptyTracksTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  emptyTracksText: {
    color: '#9CA3AF',
    lineHeight: 20,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: 'rgba(8,12,24,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  trackItemDisabled: {
    opacity: 0.56,
  },
  trackNumber: {
    width: 28,
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '800',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 4,
    paddingRight: 10,
  },
  trackTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  trackMeta: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 5,
    lineHeight: 17,
  },
  trackAction: {
    alignItems: 'flex-end',
    gap: 10,
  },
  trackStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  trackStatusPillPreview: {
    backgroundColor: 'rgba(168,85,247,0.18)',
    borderColor: 'rgba(168,85,247,0.32)',
  },
  trackStatusPillExternal: {
    backgroundColor: 'rgba(196,181,253,0.12)',
    borderColor: 'rgba(196,181,253,0.22)',
  },
  trackStatusPillMuted: {
    backgroundColor: 'rgba(51,65,85,0.18)',
    borderColor: 'rgba(71,85,105,0.28)',
  },
  trackStatusPillText: {
    color: '#F5F3FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});

export default AlbumDetailScreen;


