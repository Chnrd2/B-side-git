import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import {
  ChevronLeft,
  Send,
  Phone,
  Video,
  Plus,
  Settings,
  X,
} from 'lucide-react-native';

const ChatScreen = ({ chat, onClose, onSendMessage }) => {
  const [inputText, setInputText] = useState('');

  // ESTADOS
  const [chatBgColor, setChatBgColor] = useState('#000');
  const [isBgMenuVisible, setIsBgMenuVisible] = useState(false); // Cambiado a Menu
  const [reactions, setReactions] = useState({});

  const bgOptions = [
    { id: '1', color: '#000000', name: 'Negro Puro' },
    { id: '2', color: '#1A1025', name: 'Violeta Oscuro' },
    { id: '3', color: '#0F172A', name: 'Azul Noche' },
    { id: '4', color: '#171717', name: 'Gris Carbón' },
  ];

  const handleSend = () => {
    if (inputText.trim() === '') return;
    onSendMessage(chat.id, { text: inputText });
    setInputText('');
  };

  const handleShareAlbum = () => {
    const albumToShare = {
      text: '¡Mirá esta locura! 💿',
      albumCover:
        'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/2b/3e/2e/2b3e2e5c-9c9e-0e9e-5e5e-5e5e5e5e5e5e/196362125692.jpg/600x600bb.jpg',
      albumTitle: 'Malos Cantores',
      albumArtist: 'C.R.O',
    };
    onSendMessage(chat.id, albumToShare);
  };

  // REACCIONES
  const toggleReaction = (messageId) => {
    setReactions((prev) => ({
      ...prev,
      [messageId]: prev[messageId] ? null : '🔥',
    }));
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === 'me';
    const hasReaction = reactions[item.id];

    return (
      <View style={[styles.messageRow, isMe ? styles.rowMe : styles.rowThem]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => toggleReaction(item.id)}
          delayLongPress={200}
          style={[
            styles.messageBubble,
            isMe ? styles.myMessage : styles.theirMessage,
          ]}>
          {item.albumCover && (
            <View style={styles.sharedAlbumContainer}>
              <Image
                source={{ uri: item.albumCover }}
                style={styles.sharedAlbumCover}
              />
              <View style={styles.sharedAlbumInfo}>
                <Text style={styles.sharedAlbumTitle} numberOfLines={1}>
                  {item.albumTitle}
                </Text>
                <Text style={styles.sharedAlbumArtist}>{item.albumArtist}</Text>
              </View>
            </View>
          )}

          {item.text ? (
            <Text style={styles.messageText}>{item.text}</Text>
          ) : null}
          <Text style={styles.messageTime}>{item.time}</Text>
        </TouchableOpacity>

        {hasReaction && (
          <View
            style={[
              styles.reactionBadge,
              isMe ? styles.reactionBadgeMe : styles.reactionBadgeThem,
            ]}>
            <Text style={{ fontSize: 14 }}>{hasReaction}</Text>
          </View>
        )}
      </View>
    );
  };

  if (!chat) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: chatBgColor }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <ChevronLeft color="white" size={28} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            {chat.user.avatarUrl ? (
              <Image source={{ uri: chat.user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{chat.user.name.charAt(0)}</Text>
            )}
          </View>
          <View>
            <Text style={styles.headerName}>{chat.user.name}</Text>
            <Text style={styles.headerHandle}>@{chat.user.handle}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Phone color="white" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Video color="white" size={20} />
          </TouchableOpacity>
          {/* BOTÓN DE AJUSTES */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsBgMenuVisible(true)}>
            <Settings color="#A855F7" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={chat.messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleShareAlbum}>
            <Plus color="#A855F7" size={26} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Escribí un mensaje..."
            placeholderTextColor="#666"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Send color="white" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* MENÚ DE FONDOS (Sin Modal, vista absoluta) */}
      {isBgMenuVisible && (
        <View style={styles.absoluteOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fondo del Chat</Text>
              <TouchableOpacity onPress={() => setIsBgMenuVisible(false)}>
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.bgOptionsContainer}>
              {bgOptions.map((bg) => (
                <TouchableOpacity
                  key={bg.id}
                  style={[
                    styles.bgOptionCard,
                    chatBgColor === bg.color && styles.bgOptionSelected,
                  ]}
                  onPress={() => {
                    setChatBgColor(bg.color);
                    setIsBgMenuVisible(false);
                  }}>
                  <View
                    style={[styles.bgPreview, { backgroundColor: bg.color }]}
                  />
                  <Text style={styles.bgOptionText}>{bg.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#000',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 5, marginRight: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  headerName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  headerHandle: { color: '#8A2BE2', fontSize: 12 },
  headerRight: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 8 },

  messagesContainer: { padding: 15, paddingBottom: 20 },
  messageRow: { marginBottom: 20, position: 'relative' },
  rowMe: { alignItems: 'flex-end' },
  rowThem: { alignItems: 'flex-start' },

  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 20 },
  myMessage: { backgroundColor: '#8A2BE2', borderBottomRightRadius: 5 },
  theirMessage: {
    backgroundColor: '#1A1A1A',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  messageText: { color: 'white', fontSize: 15, lineHeight: 20 },
  messageTime: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 5,
  },

  // Reacciones
  reactionBadge: {
    position: 'absolute',
    bottom: -12,
    backgroundColor: '#222',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#444',
    zIndex: 10,
  },
  reactionBadgeMe: { right: 10 },
  reactionBadgeThem: { left: 10 },

  sharedAlbumContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sharedAlbumCover: { width: 45, height: 45, borderRadius: 8, marginRight: 10 },
  sharedAlbumInfo: { flex: 1 },
  sharedAlbumTitle: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  sharedAlbumArtist: { color: '#E5E7EB', fontSize: 12 },

  inputArea: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
  },
  attachBtn: { padding: 10, marginRight: 5 },
  input: {
    flex: 1,
    backgroundColor: '#111',
    color: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: '#8A2BE2',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Vista superpuesta antibug
  absoluteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  bgOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bgOptionCard: {
    width: '48%',
    marginBottom: 15,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  bgOptionSelected: {
    borderColor: '#A855F7',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  bgPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  bgOptionText: { color: 'white', fontSize: 12, textAlign: 'center' },
});

export default ChatScreen;
