import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronLeft,
  ExternalLink,
  Headphones,
  Music4,
  Play,
  Users,
} from 'lucide-react-native';

import { fetchArtistCatalogProfile, getPlaybackState } from '../lib/musicCatalog';

const ArtistAlbumCard = ({ album, onSelectAlbum, onPlaySong }) => {
  const playbackState = getPlaybackState(album);

  return (
    <TouchableOpacity
      style={styles.albumCard}
      activeOpacity={0.88}
      onPress={() => onSelectAlbum?.(album)}>
      {album.cover ? (
        <Image source={{ uri: album.cover }} style={styles.albumCover} />
      ) : (
        <View style={styles.albumFallback}>
          <Music4 color="#E9D5FF" size={20} />
        </View>
      )}

      <Text style={styles.albumTitle} numberOfLines={1}>
        {album.title}
      </Text>
      <Text style={styles.albumMeta} numberOfLines={1}>
        {album.year || 'Sin fecha'}
      </Text>
      <Text style={styles.albumAvailability}>{playbackState.badge}</Text>

      <TouchableOpacity
        style={[
          styles.albumPlayPill,
          playbackState.mode === 'external' && styles.albumPlayPillExternal,
          !playbackState.canInteract && styles.albumPlayPillDisabled,
        ]}
        disabled={!playbackState.canInteract}
        onPress={() => onPlaySong?.(album)}>
        {playbackState.mode === 'external' ? (
          <ExternalLink color="white" size={14} />
        ) : (
          <Play
            color="white"
            fill={playbackState.mode === 'preview' ? 'white' : 'transparent'}
            size={14}
          />
        )}
        <Text style={styles.albumPlayText}>{playbackState.actionLabel}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const RelatedArtistCard = ({ artist, onOpenArtist }) => (
  <TouchableOpacity
    style={styles.relatedArtistCard}
    activeOpacity={0.88}
    onPress={() =>
      onOpenArtist?.({
        artist: artist.name,
        artistId: artist.artistId,
        artistUrl: artist.artistUrl,
        source: artist.source,
      })
    }>
    {artist.cover ? (
      <Image source={{ uri: artist.cover }} style={styles.relatedArtistCover} />
    ) : (
      <View style={styles.relatedArtistFallback}>
        <Music4 color="#E9D5FF" size={20} />
      </View>
    )}
    <Text style={styles.relatedArtistName} numberOfLines={1}>
      {artist.name}
    </Text>
    <Text style={styles.relatedArtistAnchor} numberOfLines={2}>
      {artist.anchorAlbumTitle
        ? `Entra desde ${artist.anchorAlbumTitle}.`
        : 'Tiene pinta de enganchar con tu lado B.'}
    </Text>
  </TouchableOpacity>
);

const ArtistProfileScreen = ({
  artistName,
  artistId,
  artistUrl,
  artistSnapshot,
  onBack,
  onSelectAlbum,
  onPlaySong,
  onViewProfile,
  onOpenArtist,
}) => {
  const [catalogProfile, setCatalogProfile] = useState({
    source: 'itunes',
    artist: {
      id: artistId || '',
      name: artistName || '',
      url: artistUrl || '',
      cover: '',
    },
    albums: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const heroChips = [
    catalogProfile.source === 'spotify' ? 'Spotify' : 'Catálogo abierto',
    artistSnapshot.fans.length
      ? `${artistSnapshot.fans.length} perfiles afines`
      : 'Radar en crecimiento',
    catalogProfile.albums.length
      ? `${catalogProfile.albums.length} lanzamientos`
      : 'Sin discografía amplia aún',
  ];

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    setIsLoading(true);

    fetchArtistCatalogProfile(
      {
        artistName,
        artistId,
        artistUrl,
      },
      { signal: controller.signal }
    )
      .then((result) => {
        if (isMounted) {
          setCatalogProfile(result);
        }
      })
      .catch((error) => {
        if (error?.name === 'AbortError') {
          return;
        }

        if (isMounted) {
          setCatalogProfile((prevState) => ({
            ...prevState,
            artist: {
              ...prevState.artist,
              name: artistName || prevState.artist.name,
              id: artistId || prevState.artist.id,
              url: artistUrl || prevState.artist.url,
            },
          }));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [artistId, artistName, artistUrl]);

  const handleOpenExternal = async () => {
    const nextUrl = `${catalogProfile.artist.url || artistUrl || ''}`.trim();

    if (!nextUrl) {
      return;
    }

    try {
      await Linking.openURL(nextUrl);
    } catch (error) {
      console.warn('No pudimos abrir el artista afuera:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ChevronLeft color="white" size={24} />
          </TouchableOpacity>

          {catalogProfile.artist.url ? (
            <TouchableOpacity onPress={handleOpenExternal} style={styles.externalBtn}>
              <ExternalLink color="#E9D5FF" size={18} />
              <Text style={styles.externalBtnText}>Abrir artista</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.hero}>
          {catalogProfile.artist.cover ? (
            <Image source={{ uri: catalogProfile.artist.cover }} style={styles.heroCover} />
          ) : (
            <View style={styles.heroFallback}>
              <Music4 color="#E9D5FF" size={52} />
            </View>
          )}

          <Text style={styles.artistName}>{catalogProfile.artist.name}</Text>
          <View style={styles.heroChipsRow}>
            {heroChips.map((chip) => (
              <View key={chip} style={styles.heroChip}>
                <Text style={styles.heroChipText}>{chip}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.artistSource}>
            Perfil musical armado con {catalogProfile.source === 'spotify' ? 'Spotify' : 'iTunes'} y la actividad de B-Side.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Music4 color="#A855F7" size={18} />
            <Text style={styles.statValue}>{catalogProfile.albums.length}</Text>
            <Text style={styles.statLabel}>Álbumes detectados</Text>
          </View>

          <View style={styles.statCard}>
            <Users color="#A855F7" size={18} />
            <Text style={styles.statValue}>{artistSnapshot.fans.length}</Text>
            <Text style={styles.statLabel}>Perfiles afines</Text>
          </View>

          <View style={styles.statCard}>
            <Headphones color="#A855F7" size={18} />
            <Text style={styles.statValue}>{artistSnapshot.reviews.length}</Text>
            <Text style={styles.statLabel}>Reseñas en B-Side</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Álbumes y lanzamientos</Text>
          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#A855F7" />
              <Text style={styles.loadingText}>Buscando lanzamientos del artista...</Text>
            </View>
          ) : catalogProfile.albums.length ? (
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.albumsRow}>
              {catalogProfile.albums.map((album) => (
                <ArtistAlbumCard
                  key={album.id}
                  album={album}
                  onSelectAlbum={onSelectAlbum}
                  onPlaySong={onPlaySong}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No encontramos álbumes claros</Text>
              <Text style={styles.emptyText}>
                Igual dejamos este espacio listo para seguir ampliando el catálogo y la comunidad del artista.
              </Text>
            </View>
          )}
        </View>

        {artistSnapshot.fans.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Perfiles que también lo tienen en radar
            </Text>
            {artistSnapshot.fans.map((fan) => (
              <TouchableOpacity
                key={fan.handle}
                style={styles.profileRow}
                onPress={() => onViewProfile?.(fan.handle)}>
                <View style={[styles.profileAvatar, { backgroundColor: fan.avatarColor || '#A855F7' }]}>
                  <Text style={styles.profileAvatarText}>
                    {(fan.name || fan.handle || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.profileMeta}>
                  <Text style={styles.profileName}>{fan.name}</Text>
                  <Text style={styles.profileReason} numberOfLines={2}>
                    {fan.reason}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {artistSnapshot.relatedArtists.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Relacionados para descubrir</Text>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedRow}>
              {artistSnapshot.relatedArtists.map((relatedArtist) => (
                <RelatedArtistCard
                  key={relatedArtist.name}
                  artist={relatedArtist}
                  onOpenArtist={onOpenArtist}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {artistSnapshot.reviews.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lo que dice la comunidad</Text>
            {artistSnapshot.reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <Text style={styles.reviewAlbum}>{review.albumTitle}</Text>
                <Text style={styles.reviewBody} numberOfLines={3}>
                  {review.text}
                </Text>
                <Text style={styles.reviewMeta}>
                  @{review.user.replace('@', '')} · {review.rating}/5
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  backBtn: {
    borderRadius: 18,
    padding: 10,
    backgroundColor: 'rgba(9,12,20,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  externalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(88,28,135,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
  },
  externalBtnText: {
    color: '#F5E8FF',
    fontWeight: '800',
    fontSize: 13,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 22,
  },
  heroCover: {
    width: 168,
    height: 168,
    borderRadius: 30,
    marginBottom: 18,
  },
  heroFallback: {
    width: 168,
    height: 168,
    borderRadius: 30,
    marginBottom: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(88,28,135,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.28)',
  },
  artistName: {
    color: 'white',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  heroChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(17,24,39,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.18)',
  },
  heroChipText: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '800',
  },
  artistSource: {
    marginTop: 8,
    color: '#9CA3AF',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    gap: 5,
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '700',
  },
  section: {
    marginTop: 12,
  },
  albumsRow: {
    paddingRight: 8,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 14,
  },
  loadingCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#C4B5FD',
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  emptyText: {
    color: '#9CA3AF',
    lineHeight: 20,
  },
  albumCard: {
    width: 172,
    marginRight: 14,
    borderRadius: 22,
    padding: 14,
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  albumCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    marginBottom: 12,
  },
  albumFallback: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(88,28,135,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.28)',
  },
  albumTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '900',
  },
  albumMeta: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 5,
  },
  albumAvailability: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
  },
  albumPlayPill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(168,85,247,0.24)',
  },
  albumPlayPillExternal: {
    backgroundColor: 'rgba(124,58,237,0.42)',
  },
  albumPlayPillDisabled: {
    opacity: 0.45,
  },
  albumPlayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  profileReason: {
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 18,
  },
  relatedRow: {
    paddingRight: 8,
  },
  relatedArtistCard: {
    width: 176,
    marginRight: 14,
    borderRadius: 22,
    padding: 14,
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  relatedArtistCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
  },
  relatedArtistFallback: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(88,28,135,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.28)',
  },
  relatedArtistName: {
    color: 'white',
    fontSize: 15,
    fontWeight: '900',
  },
  relatedArtistAnchor: {
    color: '#C4B5FD',
    lineHeight: 18,
    fontSize: 12,
  },
  reviewCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  reviewAlbum: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  reviewBody: {
    color: '#D1D5DB',
    marginTop: 8,
    lineHeight: 20,
  },
  reviewMeta: {
    color: '#A855F7',
    marginTop: 10,
    fontWeight: '700',
  },
});

export default ArtistProfileScreen;


