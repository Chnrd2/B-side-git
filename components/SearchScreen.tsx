import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  ChevronDown,
  Disc,
  Headphones,
  Radio,
  Search as SearchIcon,
  Sparkles,
} from 'lucide-react-native';
import { triggerSelectionFeedback } from '../lib/feedback';

import {
  getPlaybackState,
  getMusicCatalogProvider,
  isSpotifyCatalogConfigured,
  searchMusicCatalog,
} from '../lib/musicCatalog';

const GENRES = ['Rock', 'Pop', 'Hip Hop', 'Electrónica', 'Jazz', 'Indie'];

const DiscoveryAlbumCard = ({ album, onSelectAlbum, onPlaySong, cardWidth }) => {
  const playbackState = getPlaybackState(album);

  return (
    <TouchableOpacity
      style={[styles.discoveryCard, { width: cardWidth }]}
      onPress={() => onSelectAlbum(album)}>
      {album.cover ? (
        <Image source={{ uri: album.cover }} style={styles.discoveryCover} />
      ) : (
        <View style={styles.discoveryPlaceholder}>
          <Disc color="#A855F7" size={18} />
        </View>
      )}

      <Text style={styles.discoveryTitle} numberOfLines={1}>
        {album.title}
      </Text>
      <Text style={styles.discoveryArtist} numberOfLines={1}>
        {album.artist}
      </Text>
      <Text style={styles.discoveryReason} numberOfLines={2}>
        {album.reason}
      </Text>
      <Text style={styles.discoveryPlaybackHint}>{playbackState.badge}</Text>

      {playbackState.canInteract ? (
        <TouchableOpacity
          style={styles.discoveryButton}
          onPress={() => onPlaySong?.(album)}>
          <Headphones color="white" size={14} />
          <Text style={styles.discoveryButtonText}>
            {playbackState.mode === 'preview' ? 'Escuchar muestra' : 'Abrir'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
};

const DiscoveryArtistCard = ({ artist, onOpenArtist, cardWidth }) => (
  <TouchableOpacity
    style={[styles.artistDiscoveryCard, { width: cardWidth }]}
    activeOpacity={0.9}
    onPress={() =>
      onOpenArtist?.({
        artist: artist.name,
        artistId: artist.artistId,
        artistUrl: artist.artistUrl,
        source: artist.source,
      })
    }>
    <View style={styles.artistDiscoveryBadge}>
      <Radio color="#E9D5FF" size={18} />
    </View>
    <Text style={styles.artistDiscoveryName} numberOfLines={1}>
      {artist.name}
    </Text>
    <Text style={styles.artistDiscoveryReason} numberOfLines={2}>
      {artist.reason}
    </Text>
  </TouchableOpacity>
);

const OracleAlbumCard = ({ album, onSelectAlbum, onPlaySong, cardWidth }) => {
  const playbackState = getPlaybackState(album);

  return (
    <TouchableOpacity
      style={[styles.oracleResultCard, { width: cardWidth }]}
      activeOpacity={0.92}
      onPress={() => onSelectAlbum(album)}>
      <View style={styles.oracleResultArtworkWrap}>
        {album.cover ? (
          <Image source={{ uri: album.cover }} style={styles.oracleResultArtwork} />
        ) : (
          <View style={styles.oracleResultPlaceholder}>
            <Disc color="#E9D5FF" size={18} />
          </View>
        )}
      </View>

      <Text style={styles.oracleResultTitle} numberOfLines={1}>
        {album.title}
      </Text>
      <Text style={styles.oracleResultArtist} numberOfLines={1}>
        {album.artist}
      </Text>
      <Text style={styles.oracleResultReason} numberOfLines={3}>
        {album.reason}
      </Text>

      {playbackState.canInteract ? (
        <TouchableOpacity
          style={styles.oracleResultButton}
          onPress={() => onPlaySong?.(album)}>
          <Headphones color="white" size={14} />
          <Text style={styles.oracleResultButtonText}>
            {playbackState.mode === 'preview' ? 'Escuchar muestra' : 'Abrir'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
};

const SearchScreen = ({
  interestingAlbums = [],
  interestingArtists = [],
  oracleRecommendations = [],
  oracleSource = 'local',
  oracleMessage = '',
  isOracleBusy = false,
  hasFloatingPlayer = false,
  onSelectAlbum,
  onPlaySong,
  onRunOracle,
  onOpenArtist,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catalogSource, setCatalogSource] = useState(getMusicCatalogProvider());
  const [hasSearched, setHasSearched] = useState(false);

  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const { width } = useWindowDimensions();

  const spotifyCatalogReady = isSpotifyCatalogConfigured();
  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length >= 2;
  const showDiscovery = !isSearching;
  const showExpandedOracle = !isSearching && oracleRecommendations.length > 0;
  const showCompactOracle = isSearching || !oracleRecommendations.length;
  const bottomSpacer = hasFloatingPlayer
    ? Platform.OS === 'android'
      ? 320
      : 280
    : Platform.OS === 'android'
      ? 220
      : 160;
  const albumCardWidth = width < 420 ? Math.min(204, width * 0.56) : 208;
  const artistCardWidth = width < 420 ? Math.min(214, width * 0.6) : 220;
  const oracleCardWidth = width < 420 ? Math.min(218, width * 0.6) : 226;

  const oracleStatusText = useMemo(() => {
    if (oracleSource === 'remote') return 'Afinado con B-Side Lab';
    if (oracleSource === 'fallback') return 'Tanda de rescate';
    if (oracleSource === 'shuffle') return 'Otra vuelta sobre tu perfil';
    return 'Afinado con tu perfil actual';
  }, [oracleSource]);

  const oracleHelperText =
    oracleMessage ||
    (trimmedQuery.length >= 2
      ? `Podemos usar "${trimmedQuery}" como pista extra para afinar la tanda.`
      : 'Pedí otra tanda cuando quieras salir del loop sin perder tu identidad musical.');

  const searchMusic = async (term) => {
    if (term.length < 2) {
      requestIdRef.current += 1;
      abortControllerRef.current?.abort();
      setResults([]);
      setCatalogSource(getMusicCatalogProvider());
      setHasSearched(false);
      setLoading(false);
      return;
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    setLoading(true);

    try {
      const response = await searchMusicCatalog(term, {
        signal: abortControllerRef.current.signal,
        limit: 10,
      });

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setResults((response.items || []).slice(0, 25));
      setCatalogSource(response.source || 'itunes');
      setHasSearched(true);
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }

      if (currentRequestId === requestIdRef.current) {
        setResults([]);
        setHasSearched(true);
      }

      console.error('Error buscando música:', error);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      requestIdRef.current += 1;
      abortControllerRef.current?.abort();
      setResults([]);
      setCatalogSource(getMusicCatalogProvider());
      setHasSearched(false);
      setLoading(false);
      return undefined;
    }

    const delay = setTimeout(() => {
      void searchMusic(trimmedQuery);
    }, 400);

    return () => {
      clearTimeout(delay);
      abortControllerRef.current?.abort();
    };
  }, [trimmedQuery]);

  const handleRunOracle = async () => {
    void triggerSelectionFeedback();
    const didRefresh = await onRunOracle?.(trimmedQuery);

    if (didRefresh) {
      setQuery('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Buscar</Text>

      <View style={styles.searchBarContainer}>
        <SearchIcon color="#A855F7" size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Discos o artistas..."
          placeholderTextColor="#666"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomSpacer },
        ]}>
        <View style={styles.catalogCard}>
          <Text style={styles.catalogHintEyebrow}>FUENTE</Text>
          <Text style={styles.catalogHintTitle}>
            {catalogSource === 'spotify' || (!hasSearched && spotifyCatalogReady)
              ? 'Spotify'
              : 'iTunes'}
          </Text>
          <Text style={styles.catalogHint}>
            {!hasSearched
              ? spotifyCatalogReady
                ? 'Buscá artistas, discos y canciones desde tu fuente principal.'
                : 'Buscá artistas, discos y canciones desde el catálogo disponible.'
              : catalogSource === 'spotify'
                ? 'Resultados encontrados en Spotify.'
                : spotifyCatalogReady
                  ? 'Estos resultados llegaron por una fuente alternativa.'
                  : 'Resultados encontrados en iTunes.'}
          </Text>
        </View>

        <View
          style={[
            styles.oracleCard,
            showCompactOracle && styles.oracleCompactCard,
          ]}>
          <View
            style={[
              styles.oracleHeader,
              width < 420 && styles.oracleHeaderStack,
            ]}>
            <View style={styles.oracleCopy}>
              <Text style={styles.oracleEyebrow}>ORÁCULO B-SIDE</Text>
              <Text style={styles.oracleTitle}>
                {showExpandedOracle
                  ? 'Tres discos para destrabarte'
                  : 'Tanda afinada para tu perfil'}
              </Text>
              <Text style={styles.oracleText}>
                {showExpandedOracle
                  ? 'Cruza tu Top 5, tus reseñas y tus escuchas para acercarte algo nuevo sin perder tu identidad musical.'
                  : isSearching
                    ? 'Buscá tranquilo: el Oráculo se resume para no taparte los resultados.'
                    : 'Pedí una nueva tanda cuando quieras abrir el radar sin perder tu eje.'}
              </Text>
            </View>

            <View style={styles.oracleActions}>
              {isSearching && oracleRecommendations.length ? (
                <Pressable
                  style={styles.oracleGhostButton}
                  onPress={() => setQuery('')}>
                  <ChevronDown color="#E9D5FF" size={14} />
                  <Text style={styles.oracleGhostButtonText}>Ver tanda</Text>
                </Pressable>
              ) : null}

              <TouchableOpacity
                style={[styles.oracleButton, isOracleBusy && styles.oracleButtonDisabled]}
                disabled={isOracleBusy}
                onPress={() => void handleRunOracle()}>
                {isOracleBusy ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Sparkles color="white" size={16} />
                    <Text style={styles.oracleButtonText}>
                      {oracleRecommendations.length ? 'Otra tanda' : 'Preguntarle'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.oracleMetaBlock}>
            <Text style={styles.oracleStatus}>{oracleStatusText}</Text>
            <Text style={styles.oracleMetaText}>{oracleHelperText}</Text>
          </View>

          {showExpandedOracle ? (
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.oracleResultsRow}>
              {oracleRecommendations.map((album) => (
                <OracleAlbumCard
                  key={`oracle-${album.id}`}
                  album={album}
                  onSelectAlbum={onSelectAlbum}
                  onPlaySong={onPlaySong}
                  cardWidth={oracleCardWidth}
                />
              ))}
            </ScrollView>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#A855F7" />
            <Text style={styles.loadingTitle}>Buscando música</Text>
            <Text style={styles.loadingText}>
              Estamos cruzando tu búsqueda con el catálogo disponible.
            </Text>
          </View>
        ) : showDiscovery ? (
          <>
            {interestingAlbums.length ? (
              <View style={styles.discoverySection}>
                <Text style={styles.discoveryEyebrow}>DESCUBRIR</Text>
                <Text style={styles.discoverySectionTitle}>
                  Álbumes para vos
                </Text>
                <Text style={styles.discoverySectionText}>
                  Se apoyan en tus reseñas, tus listas, tus escuchas y lo que se mueve en la comunidad.
                </Text>

                <ScrollView
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.discoveryRow}>
                  {interestingAlbums.map((album) => (
                    <DiscoveryAlbumCard
                      key={`${album.id}-${album.title}`}
                      album={album}
                      onSelectAlbum={onSelectAlbum}
                      onPlaySong={onPlaySong}
                      cardWidth={albumCardWidth}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {interestingArtists.length ? (
              <View style={styles.discoverySection}>
                <Text style={styles.discoveryEyebrow}>ARTISTAS PARA VOS</Text>
                <Text style={styles.discoverySectionTitle}>
                  Gente y sonidos para seguir explorando
                </Text>
                <Text style={styles.discoverySectionText}>
                  Se apoyan en tus reseñas, tus listas y lo que más se acerca a tu gusto.
                </Text>

                <ScrollView
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.discoveryRow}>
                  {interestingArtists.map((artist) => (
                    <DiscoveryArtistCard
                      key={`${artist.name}-${artist.artistId || 'artist'}`}
                      artist={artist}
                      onOpenArtist={onOpenArtist}
                      cardWidth={artistCardWidth}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {!interestingAlbums.length && !interestingArtists.length ? (
              <View style={styles.discoveryEmptyCard}>
                <Text style={styles.discoveryEmptyTitle}>
                  El radar todavía se está armando
                </Text>
                <Text style={styles.discoveryEmptyText}>
                  Sumá más reseñas, listas o escuchas para que B-Side te devuelva recomendaciones más afinadas.
                </Text>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Explorar géneros</Text>
            <View style={styles.genreGrid}>
              {GENRES.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={styles.genreCard}
                  onPress={() => setQuery(genre)}>
                  <Text style={styles.genreText}>{genre}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No encontramos resultados</Text>
            <Text style={styles.emptyText}>
              Probá con otro nombre de disco, artista o género.
            </Text>
            {!spotifyCatalogReady ? (
              <Text style={styles.emptyHelper}>
                Si buscabas algo más de nicho o nuevo, probablemente falte activar Spotify en el catálogo.
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.resultsGroup}>
            {results.map((item) => {
              const playbackState = getPlaybackState(item);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.resultItem}
                  onPress={() => onSelectAlbum(item)}>
                  <Image source={{ uri: item.cover }} style={styles.albumCover} />
                  <View style={styles.infoContainer}>
                    <Text style={styles.albumTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() =>
                        onOpenArtist?.({
                          artist: item.artist,
                          artistId: item.artistId,
                          artistUrl: item.artistUrl,
                          source: item.source,
                        })
                      }>
                      <Text style={styles.artistName} numberOfLines={1}>
                        {item.artist}
                        {item.year ? ` · ${item.year}` : ''}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.resultMetaRow}>
                      <Text style={styles.sourceBadge}>
                        {item.source === 'spotify' ? 'Spotify' : 'iTunes'}
                      </Text>
                      <Text style={styles.playbackBadgeText}>
                        {playbackState.badge}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  headerTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 20,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 10, 0.92)',
    borderRadius: 18,
    paddingHorizontal: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  searchIcon: { marginRight: 10 },
  searchBar: {
    flex: 1,
    color: 'white',
    paddingVertical: 15,
    fontSize: 16,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 180,
  },
  catalogCard: {
    marginBottom: 16,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(10,10,10,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.18)',
  },
  catalogHintEyebrow: {
    color: '#A78BFA',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  catalogHintTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },
  catalogHint: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  oracleCard: {
    marginBottom: 18,
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(11, 10, 20, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.22)',
    gap: 14,
  },
  oracleCompactCard: {
    gap: 10,
    paddingBottom: 14,
  },
  oracleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  oracleHeaderStack: {
    flexDirection: 'column',
  },
  oracleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  oracleCopy: {
    flex: 1,
    gap: 6,
  },
  oracleEyebrow: {
    color: '#C4B5FD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  oracleTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  oracleText: {
    color: '#D1D5DB',
    lineHeight: 19,
    fontSize: 13,
  },
  oracleButton: {
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-start',
  },
  oracleButtonDisabled: {
    opacity: 0.7,
  },
  oracleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  oracleGhostButton: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  oracleGhostButtonText: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '800',
  },
  oracleMetaBlock: {
    gap: 6,
  },
  oracleStatus: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '700',
  },
  oracleMetaText: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
  oracleResultsRow: {
    paddingRight: 8,
  },
  oracleResultCard: {
    marginRight: 14,
    borderRadius: 22,
    padding: 14,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  oracleResultArtworkWrap: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  oracleResultArtwork: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
  },
  oracleResultPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  oracleResultTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  oracleResultArtist: {
    color: '#C4B5FD',
    fontSize: 13,
    fontWeight: '700',
  },
  oracleResultReason: {
    color: '#E5E7EB',
    fontSize: 13,
    lineHeight: 18,
    minHeight: 54,
  },
  oracleResultButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(168,85,247,0.24)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  oracleResultButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  loader: {
    marginBottom: 20,
    marginTop: 10,
  },
  loadingCard: {
    marginBottom: 20,
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(11, 10, 20, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.18)',
    gap: 10,
  },
  loadingTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  loadingText: {
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 19,
  },
  discoverySection: {
    marginBottom: 22,
  },
  discoveryEyebrow: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  discoverySectionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
  },
  discoverySectionText: {
    color: '#9CA3AF',
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 14,
  },
  discoveryRow: {
    paddingRight: 8,
  },
  discoveryEmptyCard: {
    marginBottom: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    padding: 18,
    gap: 8,
  },
  discoveryEmptyTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
  discoveryEmptyText: {
    color: '#9CA3AF',
    lineHeight: 20,
  },
  discoveryCard: {
    borderRadius: 22,
    backgroundColor: 'rgba(10, 10, 10, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    marginRight: 14,
    gap: 8,
  },
  discoveryCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
  },
  discoveryPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discoveryTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  discoveryArtist: {
    color: '#A855F7',
    fontSize: 13,
  },
  discoveryReason: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 18,
  },
  discoveryPlaybackHint: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  discoveryButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(168,85,247,0.24)',
  },
  discoveryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  artistDiscoveryCard: {
    borderRadius: 22,
    backgroundColor: 'rgba(10, 10, 10, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginRight: 14,
    gap: 10,
  },
  artistDiscoveryBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(168,85,247,0.18)',
  },
  artistDiscoveryName: {
    color: 'white',
    fontSize: 17,
    fontWeight: '900',
  },
  artistDiscoveryReason: {
    color: '#D1D5DB',
    lineHeight: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  genreCard: {
    width: '48%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.22)',
    backgroundColor: 'rgba(18, 9, 28, 0.84)',
    minHeight: 82,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  genreText: {
    color: '#E9D5FF',
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyState: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
  },
  emptyText: {
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
  },
  emptyHelper: {
    color: '#A78BFA',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
  },
  resultsGroup: {
    gap: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  albumCover: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#111827',
  },
  infoContainer: {
    flex: 1,
    gap: 4,
  },
  albumTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
  artistName: {
    color: '#A78BFA',
    fontSize: 14,
  },
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  sourceBadge: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  playbackBadgeText: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default SearchScreen;
