import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Search as SearchIcon } from 'lucide-react-native';

const GENRES = ['Rock', 'Pop', 'Hip Hop', 'Electrónica', 'Jazz', 'Indie'];

const SearchScreen = ({ onSelectAlbum }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const searchMusic = async (term) => {
    if (term.length < 2) {
      requestIdRef.current += 1;
      setResults([]);
      setLoading(false);
      return;
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    setLoading(true);

    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          term
        )}&entity=song&limit=30`
      );
      const data = await response.json();

      if (currentRequestId !== requestIdRef.current) return;

      const uniqueAlbums = new Set();
      const formattedResults = [];

      data.results.forEach((item) => {
        if (uniqueAlbums.has(item.collectionId) || !item.previewUrl) return;

        uniqueAlbums.add(item.collectionId);
        formattedResults.push({
          id: item.collectionId.toString(),
          title: item.collectionName || item.trackName,
          artist: item.artistName,
          cover: item.artworkUrl100.replace('100x100bb', '600x600bb'),
          genre: item.primaryGenreName,
          year: new Date(item.releaseDate).getFullYear(),
          previewUrl: item.previewUrl,
        });
      });

      setResults(formattedResults.slice(0, 25));
    } catch (error) {
      if (currentRequestId === requestIdRef.current) {
        setResults([]);
      }
      console.error('Error buscando música:', error);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const sanitizedQuery = query.trim();

    if (sanitizedQuery.length < 2) {
      requestIdRef.current += 1;
      setResults([]);
      setLoading(false);
      return;
    }

    const delay = setTimeout(() => {
      searchMusic(sanitizedQuery);
    }, 400);

    return () => clearTimeout(delay);
  }, [query]);

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

      {loading && (
        <ActivityIndicator color="#A855F7" style={{ marginBottom: 20 }} />
      )}

      {query.trim().length === 0 ? (
        <View>
          <Text style={styles.sectionTitle}>Explorar Géneros</Text>
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
        </View>
      ) : !loading && results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No encontramos resultados</Text>
          <Text style={styles.emptyText}>
            Probá con otro nombre de disco, artista o género.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => onSelectAlbum(item)}>
              <Image source={{ uri: item.cover }} style={styles.albumCover} />
              <View style={styles.infoContainer}>
                <Text style={styles.albumTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.artistName} numberOfLines={1}>
                  {item.artist} • {item.year}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60 },
  headerTitle: { color: 'white', fontSize: 32, fontWeight: '900', marginBottom: 20 },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  searchIcon: { marginRight: 10 },
  searchBar: { flex: 1, color: 'white', paddingVertical: 15, fontSize: 16 },
  sectionTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginVertical: 15 },
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  genreCard: {
    width: '48%',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    padding: 25,
    borderRadius: 16,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  genreText: { color: '#E9D5FF', fontWeight: 'bold', fontSize: 16 },
  resultItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  albumCover: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  infoContainer: { flex: 1 },
  albumTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  artistName: { color: '#A855F7', fontSize: 14, marginTop: 4 },
  emptyState: {
    marginTop: 20,
    backgroundColor: '#0A0A0A',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  emptyTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { color: '#9CA3AF', lineHeight: 20 },
});

export default SearchScreen;
