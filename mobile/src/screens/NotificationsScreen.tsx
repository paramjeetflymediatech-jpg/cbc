import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockNotifications } from '../data/mockData';
import { NotificationItem } from '../types';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useSweetAlert } from '../context/SweetAlertContext';

interface NotificationsScreenProps {
  navigation: any;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const { showAlert } = useSweetAlert();
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  useEffect(() => {
    if (!isAuthenticated) {
      showAlert({
        title: 'Login Required',
        message: 'Please login first to view notifications.',
        type: 'warning',
        confirmText: 'Login',
        cancelText: 'Cancel',
        onConfirm: () => navigation.navigate('Auth'),
        onCancel: () => navigation.navigate('Main', { screen: 'Home' }),
      });
    }
  }, [isAuthenticated, navigation]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.readAllText}>Mark Read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {notifications.map((item) => (
          <View key={item.id} style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>
                {item.type === 'status_update' ? '🟢' : item.type === 'view_update' ? '👁️' : '🔔'}
              </Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.titleRow}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
              <Text style={styles.notifMessage}>{item.message}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  backBtn: {
    paddingVertical: 4,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  readAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  notifCardUnread: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textMuted,
  },
  notifMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
