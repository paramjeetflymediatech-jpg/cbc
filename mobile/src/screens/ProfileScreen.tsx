import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useSweetAlert } from '../context/SweetAlertContext';
import { normalizeImageUrl } from '../utils/imageUrl';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout, deleteAccount, isAuthenticated, userEnquiries, fetchUserProfile } = useAuth();
  const { showAlert } = useSweetAlert();

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    showAlert({
      title: 'Logout',
      message: 'Are you sure you want to log out of your account?',
      type: 'warning',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await logout();
        navigation.navigate('Auth');
      },
    });
  };

  const handleDeleteAccount = () => {
    showAlert({
      title: 'Delete Account & Data',
      message:
        'Are you sure you want to permanently delete your account? All your personal details and consultation inquiries will be permanently removed. This action cannot be reversed.',
      type: 'warning',
      confirmText: 'Delete Forever',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const res = await deleteAccount();
        if (res.success) {
          showAlert({
            title: 'Account Deleted',
            message: 'Your account and personal data have been permanently deleted.',
            type: 'success',
            confirmText: 'OK',
            onConfirm: () => navigation.navigate('Home'),
          });
        } else {
          showAlert({
            title: 'Deletion Failed',
            message: res.message || 'Unable to delete account. Please try again or contact privacy@clinicbychoice.com.',
            type: 'error',
          });
        }
      },
    });
  };

  const menuSections = [
    {
      title: 'Healthcare & Requests',
      items: [
        {
          icon: '📋',
          label: 'My Requests / Enquiries',
          onPress: () => {
            if (!isAuthenticated) {
              showAlert({
                title: 'Login Required',
                message: 'Please login first to view your requests.',
                type: 'warning',
                confirmText: 'Login',
                cancelText: 'Cancel',
                onConfirm: () => navigation.navigate('Auth'),
              });
            } else if (userEnquiries.length === 0) {
              showAlert({
                title: 'No Requests',
                message: "You haven't submitted any consultation requests yet.",
                type: 'info',
              });
            } else {
              navigation.navigate('Requests');
            }
          },
        },
        {
          icon: '❤️',
          label: 'Saved Hospitals',
          onPress: () => {
            if (isAuthenticated) {
              navigation.navigate('SavedHospitals');
            } else {
              showAlert({
                title: 'Login Required',
                message: 'Please login first to view your saved hospitals.',
                type: 'warning',
                confirmText: 'Login',
                cancelText: 'Cancel',
                onConfirm: () => navigation.navigate('Auth'),
              });
            }
          },
        },
        {
          icon: '🔔',
          label: 'Notification Center',
          onPress: () => {
            if (isAuthenticated) {
              navigation.navigate('Notifications');
            } else {
              showAlert({
                title: 'Login Required',
                message: 'Please login first to view notifications.',
                type: 'warning',
                confirmText: 'Login',
                cancelText: 'Cancel',
                onConfirm: () => navigation.navigate('Auth'),
              });
            }
          },
        },
      ],
    },
    {
      title: 'Providers & Partners',
      items: [
        { icon: '🏥', label: 'List Your Hospital', onPress: () => navigation.navigate('GetListed') },
      ],
    },
    {
      title: 'Settings & Support',
      items: [
        {
          icon: '🛡️',
          label: 'Privacy & Security',
          onPress: () => navigation.navigate('Privacy'),
        },
        {
          icon: '💬',
          label: 'Help & Support',
          onPress: () => navigation.navigate('Help'),
        },
        {
          icon: 'ℹ️',
          label: 'About Clinic By Choice',
          onPress: () => navigation.navigate('About'),
        },
        ...(isAuthenticated
          ? [
              {
                icon: '🗑️',
                label: 'Delete Account & Data',
                onPress: handleDeleteAccount,
                isDestructive: true,
              },
            ]
          : [
              {
                icon: '🗑️',
                label: 'Request Data Deletion',
                onPress: () => {
                  Linking.openURL('https://clinicbychoice.com/data-deletion').catch(() => {});
                },
              },
            ]),
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Title */}
      <View style={styles.header}>
        <Text style={styles.title}>Account Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Info Header Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: normalizeImageUrl(user?.avatarUrl) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80' }}
              style={[
                styles.avatar,
                {
                  transform: [
                    { scale: user?.avatarScale || 1 },
                    { translateX: user?.avatarTranslateX || 0 },
                    { translateY: user?.avatarTranslateY || 0 },
                    { rotate: `${user?.avatarRotate || 0}deg` },
                  ],
                },
              ]}
            />
          </View>
          <View style={styles.userMeta}>
            <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
            <Text style={styles.userContact}>{user?.phone || '+91 98765 43210'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'patient@clinicbychoice.com'}</Text>
          </View>

          {isAuthenticated ? (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('Auth')}>
              <Text style={styles.editText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Menu Groups */}
        {menuSections.map((group, idx) => (
          <View key={idx} style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, itemIdx) => (
                <TouchableOpacity
                  key={itemIdx}
                  style={[styles.menuRow, itemIdx < group.items.length - 1 && styles.menuRowBorder]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuLeft}>
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text style={[styles.menuLabel, (item as any).isDestructive && { color: '#e11d48', fontWeight: '700' }]}>
                      {item.label}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout / Login Button */}
        {isAuthenticated ? (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.loginBannerBtn} onPress={() => navigation.navigate('Auth')} activeOpacity={0.85}>
            <Text style={styles.loginBannerText}>Sign In / Register →</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.appVersionText}>Clinic By Choice Mobile • v1.0.0 (Production Build)</Text>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  userContact: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textMuted,
  },
  editBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  editText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  groupContainer: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: colors.errorLight,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginBottom: 16,
  },
  logoutText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '800',
  },
  loginBannerBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginBannerText: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },
  appVersionText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
