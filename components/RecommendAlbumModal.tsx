import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MessageCircle, Send, UserRound, X } from 'lucide-react-native';

const RecommendAlbumModal = ({
  visible,
  album,
  chats = [],
  onClose,
  onSubmit,
}) => {
  const [selectedChatId, setSelectedChatId] = useState('');
  const [note, setNote] = useState('');

  const recommendedChats = useMemo(
    () => chats.filter((chat) => chat?.user?.handle),
    [chats]
  );

  useEffect(() => {
    if (!visible) {
      setSelectedChatId('');
      setNote('');
      return;
    }

    setSelectedChatId((current) => current || recommendedChats[0]?.id || '');
  }, [recommendedChats, visible]);

  const handleSubmit = () => {
    if (!selectedChatId || !album) {
      return;
    }

    const sent = onSubmit?.({
      chatId: selectedChatId,
      note,
    });

    if (sent) {
      setNote('');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <View style={styles.headerTitleGroup}>
                <View style={styles.headerIcon}>
                  <MessageCircle color="#E9D5FF" size={18} />
                </View>
                <View style={styles.headerCopy}>
                  <Text style={styles.title}>Recomendar disco</Text>
                  <Text style={styles.subtitle}>
                    Mandalo con contexto, no como un share frío.
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={onClose}>
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>

            {album ? (
              <View style={styles.albumCard}>
                {album.cover ? (
                  <Image source={{ uri: album.cover }} style={styles.albumCover} />
                ) : null}
                <View style={styles.albumBody}>
                  <Text style={styles.albumEyebrow}>DISCO ELEGIDO</Text>
                  <Text style={styles.albumTitle} numberOfLines={1}>
                    {album.title}
                  </Text>
                  <Text style={styles.albumArtist} numberOfLines={1}>
                    {album.artist}
                  </Text>
                </View>
              </View>
            ) : null}

            <Text style={styles.label}>Mandárselo a</Text>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.chatRow}>
              {recommendedChats.map((chat) => {
                const isSelected = chat.id === selectedChatId;

                return (
                  <TouchableOpacity
                    key={chat.id}
                    style={[
                      styles.chatCard,
                      isSelected && styles.chatCardActive,
                    ]}
                    onPress={() => setSelectedChatId(chat.id)}>
                    <View
                      style={[
                        styles.chatAvatar,
                        { backgroundColor: chat.user.avatarColor || '#8A2BE2' },
                      ]}>
                      {chat.user.avatarUrl ? (
                        <Image
                          source={{ uri: chat.user.avatarUrl }}
                          style={styles.chatAvatarImage}
                        />
                      ) : (
                        <UserRound color="white" size={18} />
                      )}
                    </View>
                    <Text style={styles.chatName} numberOfLines={1}>
                      {chat.user.name}
                    </Text>
                    <Text style={styles.chatHandle}>@{chat.user.handle}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>Decile por qué va con él o ella</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: el track 3 te va a romper la cabeza."
              placeholderTextColor="#6B7280"
              value={note}
              onChangeText={setNote}
              multiline={true}
              maxLength={180}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!album || !selectedChatId) && styles.submitButtonDisabled,
              ]}
              disabled={!album || !selectedChatId}
              onPress={handleSubmit}>
              <Send color="white" size={18} />
              <Text style={styles.submitText}>Enviar recomendación</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.86)',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  content: {
    maxHeight: '84%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    backgroundColor: '#0A0A0A',
    padding: 22,
    paddingBottom: 28,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerCopy: {
    flex: 1,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(168,85,247,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: 'white', fontSize: 22, fontWeight: '900' },
  subtitle: { color: '#9CA3AF', marginTop: 4, lineHeight: 19 },
  albumCard: {
    marginTop: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.22)',
    backgroundColor: 'rgba(17,24,39,0.8)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  albumCover: { width: 74, height: 74, borderRadius: 18 },
  albumBody: { flex: 1, gap: 5 },
  albumEyebrow: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  albumTitle: { color: 'white', fontSize: 18, fontWeight: '900' },
  albumArtist: { color: '#D1D5DB', fontSize: 14, fontWeight: '600' },
  label: {
    color: '#E9D5FF',
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 10,
  },
  chatRow: {
    paddingRight: 8,
    gap: 12,
  },
  chatCard: {
    width: 122,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: '#111827',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 7,
  },
  chatCardActive: {
    borderColor: '#8A2BE2',
    backgroundColor: 'rgba(138,43,226,0.14)',
  },
  chatAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAvatarImage: {
    width: '100%',
    height: '100%',
  },
  chatName: { color: 'white', fontWeight: '800' },
  chatHandle: { color: '#A78BFA', fontSize: 12, fontWeight: '700' },
  input: {
    minHeight: 112,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: '#111827',
    color: 'white',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 21,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 18,
    backgroundColor: '#8A2BE2',
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: { color: 'white', fontSize: 15, fontWeight: '800' },
});

export default RecommendAlbumModal;
