import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Bell,
  ChevronLeft,
  Heart,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react-native';

const ICONS_BY_TYPE = {
  social: Heart,
  security: ShieldAlert,
  subscription: Sparkles,
  product: Bell,
};

const NotificationsCenterScreen = ({
  notifications,
  onBack,
  onMarkAllRead,
  onDismiss,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <TouchableOpacity onPress={onMarkAllRead}>
          <Text style={styles.markAllText}>Marcar todo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Bell color="#E9D5FF" size={22} />
            <Text style={styles.emptyTitle}>Todo tranquilo por ahora</Text>
            <Text style={styles.emptyText}>
              Cuando haya actividad, seguridad o cambios de plan, aparece acá.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => {
            const Icon = ICONS_BY_TYPE[notification.type] || MessageCircle;

            return (
              <View
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationCardUnread,
                ]}>
                <View style={styles.notificationRow}>
                  <View style={styles.notificationIcon}>
                    <Icon color="#E9D5FF" size={18} />
                  </View>

                  <View style={styles.notificationBody}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      {!notification.read ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <Text style={styles.notificationText}>{notification.body}</Text>
                    <Text style={styles.notificationTime}>
                      {notification.timeLabel}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => onDismiss(notification.id)}
                    style={styles.dismissButton}>
                    <Trash2 color="#9CA3AF" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
    paddingTop: 55,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
  },
  markAllText: {
    color: '#E9D5FF',
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 14,
  },
  emptyCard: {
    backgroundColor: 'rgba(10,10,10,0.9)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    color: '#9CA3AF',
    lineHeight: 20,
    textAlign: 'center',
  },
  notificationCard: {
    backgroundColor: 'rgba(10,10,10,0.88)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 16,
  },
  notificationCardUnread: {
    borderColor: 'rgba(168,85,247,0.35)',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  notificationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(168,85,247,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBody: {
    flex: 1,
    gap: 6,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A855F7',
  },
  notificationText: {
    color: '#D1D5DB',
    lineHeight: 20,
  },
  notificationTime: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
});

export default NotificationsCenterScreen;
