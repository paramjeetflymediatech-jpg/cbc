import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { colors } from '../theme/colors';
import { normalizeImageUrl } from '../utils/imageUrl';

interface AppHeaderProps {
  userName?: string;
  avatarUrl?: string;
  avatarScale?: number;
  avatarTranslateX?: number;
  avatarTranslateY?: number;
  avatarRotate?: number;
  location?: string;
  unreadCount?: number;
  onLocationPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  userName,
  avatarUrl,
  avatarScale = 1,
  avatarTranslateX = 0,
  avatarTranslateY = 0,
  avatarRotate = 0,
  location = 'Chandigarh',
  unreadCount = 2,
  onLocationPress,
  onNotificationPress,
  onProfilePress,
}) => {
  const isGuest = !userName || userName.toLowerCase() === 'guest';
  const displayAvatar = normalizeImageUrl(avatarUrl) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftRow}>
        {!isGuest && (
          <TouchableOpacity style={styles.avatarPressable} onPress={onProfilePress} activeOpacity={0.8}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: displayAvatar }}
                style={[
                  styles.avatarImage,
                  {
                    transform: [
                      { scale: avatarScale },
                      { translateX: avatarTranslateX },
                      { translateY: avatarTranslateY },
                      { rotate: `${avatarRotate}deg` },
                    ],
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
        )}
        <View style={styles.textColumn}>
          <Text style={styles.greetingText}>
            {isGuest ? 'Welcome 👋' : `Hello, ${userName} 👋`}
          </Text>
          <TouchableOpacity style={styles.locationSelector} onPress={onLocationPress} activeOpacity={0.7}>
            <Text style={styles.locationPin}>📍</Text>
            <Text style={styles.locationText}>{location}</Text>
            <Text style={styles.dropdownChevron}>▾</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.notificationButton} onPress={onNotificationPress} activeOpacity={0.8}>
        <Text style={styles.bellIcon}>🔔</Text>
        {unreadCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPressable: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 2,
    marginRight: 12,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  textColumn: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationPin: {
    fontSize: 13,
    marginRight: 4,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginRight: 4,
  },
  dropdownChevron: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: '800',
  },
});
