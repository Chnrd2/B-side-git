import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Image,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

const InboxScreen = ({ chats, onClose, onOpenChat }) => {
  const orderedChats = [...chats].sort((left, right) => {
    const leftLastMessage = left.messages[left.messages.length - 1];
    const rightLastMessage = right.messages[right.messages.length - 1];
    const leftTime = leftLastMessage?.createdAt
      ? new Date(leftLastMessage.createdAt).getTime()
      : 0;
    const rightTime = rightLastMessage?.createdAt
      ? new Date(rightLastMessage.createdAt).getTime()
      : 0;

    return rightTime - leftTime;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mensajes</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={orderedChats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => {
          const lastMessage =
            item.messages.length > 0
              ? item.messages[item.messages.length - 1]
              : { text: '...', time: '' };
          const lastMessagePreview =
            lastMessage.messageType === 'recommendation'
              ? lastMessage.albumTitle
                ? `Recomendación: ${lastMessage.albumTitle}`
                : 'Te llegó una recomendación'
              : lastMessage.text;

          return (
            <TouchableOpacity
              style={styles.chatRow}
              activeOpacity={0.7}
              onPress={() => onOpenChat(item)}>
              <View style={styles.avatar}>
                {item.user.avatarUrl ? (
                  <Image source={{ uri: item.user.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{item.user.name.charAt(0)}</Text>
                )}
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.chatName}>{item.user.name}</Text>
                  <Text style={styles.chatTime}>{lastMessage.time}</Text>
                </View>
                <View style={styles.messageRow}>
                  <Text
                    style={[
                      styles.lastMessage,
                      item.unread > 0 && styles.unreadMessage,
                    ]}
                    numberOfLines={1}>
                    {lastMessagePreview}
                  </Text>
                  {item.unread > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unread}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backBtn: { padding: 5, marginLeft: -5 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  chatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  chatInfo: { flex: 1, justifyContent: 'center' },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatName: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  chatTime: { color: '#666', fontSize: 13 },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: { color: '#999', fontSize: 15, flex: 1, marginRight: 10 },
  unreadMessage: { color: 'white', fontWeight: 'bold' },
  badge: {
    backgroundColor: '#A855F7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
});

export default InboxScreen;

