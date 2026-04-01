import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronLeft,
  Phone,
  Plus,
  Send,
  Settings,
  Video,
  X,
} from 'lucide-react-native';

const rgbaFromHex = (hex, alpha = 1) => {
  const safeHex = `${hex || '#000000'}`.replace('#', '');
  const normalizedHex =
    safeHex.length === 3
      ? safeHex
          .split('')
          .map((value) => value + value)
          .join('')
      : safeHex.padEnd(6, '0').slice(0, 6);
  const bigint = parseInt(normalizedHex, 16);
  const red = (bigint >> 16) & 255;
  const green = (bigint >> 8) & 255;
  const blue = bigint & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const ChatScreen = ({
  chat,
  onClose,
  onSendMessage,
  onOpenAlbum,
  onOpenProfile,
  onUpdateTheme,
}) => {
  const [inputText, setInputText] = useState('');
  const [chatBgColor, setChatBgColor] = useState(chat?.themeColor || '#000000');
  const [isBgMenuVisible, setIsBgMenuVisible] = useState(false);
  const [reactions, setReactions] = useState({});

  const bgOptions = [
    { id: '1', color: '#000000', name: 'Negro puro' },
    { id: '2', color: '#1A1025', name: 'Violeta oscuro' },
    { id: '3', color: '#0F172A', name: 'Azul noche' },
    { id: '4', color: '#171717', name: 'Gris carbón' },
    { id: '5', color: '#07131A', name: 'Tinta fría' },
  ];

  useEffect(() => {
    setChatBgColor(chat?.themeColor || '#000000');
  }, [chat?.id, chat?.themeColor]);

  const shellStyles = useMemo(
    () => ({
      backgroundColor: chatBgColor,
      headerColor: rgbaFromHex(chatBgColor, 0.9),
      panelColor: rgbaFromHex(chatBgColor, 0.94),
      borderColor: rgbaFromHex('#FFFFFF', 0.08),
    }),
    [chatBgColor]
  );

  const handleSend = () => {
    if (inputText.trim() === '') return;
    onSendMessage(chat.id, { text: inputText });
    setInputText('');
  };

  const handleShareAlbum = () => {
    onSendMessage(chat.id, {
      messageType: 'recommendation',
      text: 'Te dejo esto para escuchar con tiempo.',
      albumId: 'demo-recommendation-1',
      albumCover:
        'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/2b/3e/2e/2b3e2e5c-9c9e-0e9e-5e5e-5e5e5e5e5e5e/196362125692.jpg/600x600bb.jpg',
      albumTitle: 'Malos Cantores',
      albumArtist: 'C.R.O',
      previewUrl: '',
      recommendationNote: 'El track 4 es un palo. Dale play de punta a punta.',
      recommendationReason: 'Te puede entrar perfecto por el costado del trap.',
      ctaLabel: 'Abrir álbum',
    });
  };

  const toggleReaction = (messageId) => {
    setReactions((prev) => ({
      ...prev,
      [messageId]: prev[messageId] ? null : 'Fuego',
    }));
  };

  const selectBackground = (color) => {
    setChatBgColor(color);
    onUpdateTheme?.(chat?.id, color);
    setIsBgMenuVisible(false);
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === 'me';
    const hasReaction = reactions[item.id];
    const isRecommendation = item.messageType === 'recommendation';

    const albumPayload =
      item.albumTitle || item.albumArtist || item.albumCover
        ? {
            id: item.albumId || item.albumTitle,
            albumId: item.albumId || item.albumTitle,
            title: item.albumTitle,
            artist: item.albumArtist,
            cover: item.albumCover,
            previewUrl: item.previewUrl || '',
          }
        : null;

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
          {isRecommendation ? (
            <View style={styles.recommendationHeader}>
              <Text style={styles.recommendationEyebrow}>RECOMENDACIÓN</Text>
            </View>
          ) : null}

          {item.albumCover ? (
            <View style={styles.sharedAlbumContainer}>
              <Image source={{ uri: item.albumCover }} style={styles.sharedAlbumCover} />
              <View style={styles.sharedAlbumInfo}>
                <Text style={styles.sharedAlbumTitle} numberOfLines={1}>
                  {item.albumTitle}
                </Text>
                <Text style={styles.sharedAlbumArtist}>{item.albumArtist}</Text>
                {item.recommendationReason ? (
                  <Text style={styles.sharedAlbumReason}>
                    {item.recommendationReason}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {item.text ? <Text style={styles.messageText}>{item.text}</Text> : null}
          {item.recommendationNote ? (
            <Text style={styles.recommendationNote}>{item.recommendationNote}</Text>
          ) : null}
          {item.ctaLabel && albumPayload ? (
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => onOpenAlbum?.(albumPayload)}
              style={styles.recommendationCta}>
              <Text style={styles.recommendationCtaText}>{item.ctaLabel}</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.messageTime}>{item.time}</Text>
        </TouchableOpacity>

        {hasReaction ? (
          <View
            style={[
              styles.reactionBadge,
              isMe ? styles.reactionBadgeMe : styles.reactionBadgeThem,
            ]}>
            <Text style={styles.reactionText}>{hasReaction}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (!chat) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: shellStyles.backgroundColor }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: shellStyles.headerColor,
            borderBottomColor: shellStyles.borderColor,
          },
        ]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <ChevronLeft color="white" size={28} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerProfileTouch}
            activeOpacity={0.85}
            onPress={() => onOpenProfile?.(chat.user.handle)}>
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
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Phone color="white" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Video color="white" size={20} />
          </TouchableOpacity>
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
        <View
          style={[
            styles.inputArea,
            {
              backgroundColor: shellStyles.panelColor,
              borderTopColor: shellStyles.borderColor,
            },
          ]}>
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

      {isBgMenuVisible ? (
        <View style={styles.absoluteOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: shellStyles.panelColor, borderColor: shellStyles.borderColor },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fondo del chat</Text>
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
                  onPress={() => selectBackground(bg.color)}>
                  <View style={[styles.bgPreview, { backgroundColor: bg.color }]} />
                  <Text style={styles.bgOptionText}>{bg.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? 36 : 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { padding: 5, marginRight: 10 },
  headerProfileTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
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
  headerRight: { flexDirection: 'row', gap: 6 },
  iconBtn: { padding: 8 },
  messagesContainer: { padding: 15, paddingBottom: 20 },
  messageRow: { marginBottom: 20, position: 'relative' },
  rowMe: { alignItems: 'flex-end' },
  rowThem: { alignItems: 'flex-start' },
  messageBubble: { maxWidth: '82%', padding: 12, borderRadius: 20 },
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
  reactionBadge: {
    position: 'absolute',
    bottom: -12,
    backgroundColor: '#222',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#444',
    zIndex: 10,
  },
  reactionBadgeMe: { right: 10 },
  reactionBadgeThem: { left: 10 },
  reactionText: { fontSize: 12, color: 'white', fontWeight: '700' },
  recommendationHeader: { marginBottom: 8 },
  recommendationEyebrow: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
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
  sharedAlbumReason: {
    color: '#C4B5FD',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },
  recommendationNote: {
    color: '#F9FAFB',
    fontSize: 14,
    lineHeight: 20,
  },
  recommendationCta: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  recommendationCtaText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
  },
  inputArea: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
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
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
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
    borderRadius: 16,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  bgOptionSelected: { borderColor: '#8A2BE2' },
  bgPreview: {
    width: '100%',
    height: 60,
    borderRadius: 12,
    marginBottom: 10,
  },
  bgOptionText: { color: 'white', fontSize: 13, fontWeight: '700' },
});

export default ChatScreen;
