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
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
              {user?.role === 'SUPER_ADMIN' ? (
                <View style={[styles.rolePill, { backgroundColor: '#FDF2F8' }]}>
                  <Text style={[styles.rolePillText, { color: '#BE185D' }]}>ADMIN</Text>
                </View>
              ) : user?.role === 'HOSPITAL' ? (
                <View style={[styles.rolePill, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.rolePillText, { color: '#1D4ED8' }]}>HOSPITAL</Text>
                </View>
              ) : null}
            </View>
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

        {/* Super Admin Control Center Hub (for SUPER_ADMIN or ADMIN) */}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
          <View style={styles.adminHubCard}>
            <View style={styles.adminHubHeader}>
              <View style={styles.adminHubTitleRow}>
                <Text style={styles.adminHubIcon}>🛡️</Text>
                <View>
                  <Text style={styles.adminHubTitle}>Super Admin Center</Text>
                  <Text style={styles.adminHubSubtitle}>Manage platform clinics, leads & users</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.adminHubEnterBtn}
                onPress={() => navigation.navigate('AdminDashboard')}
              >
                <Text style={styles.adminHubEnterBtnText}>Open Center →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hubShortcutsGrid}>
              <TouchableOpacity
                style={styles.hubShortcutTile}
                onPress={() => navigation.navigate('AdminHospitals')}
              >
                <Text style={styles.hubShortcutIcon}>🏥</Text>
                <Text style={styles.hubShortcutText}>Hospitals</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hubShortcutTile}
                onPress={() => navigation.navigate('AdminLeads')}
              >
                <Text style={styles.hubShortcutIcon}>📋</Text>
                <Text style={styles.hubShortcutText}>All Leads</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hubShortcutTile}
                onPress={() => navigation.navigate('AdminUsers')}
              >
                <Text style={styles.hubShortcutIcon}>👥</Text>
                <Text style={styles.hubShortcutText}>Users</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hubShortcutTile}
                onPress={() => navigation.navigate('AdminServices')}
              >
                <Text style={styles.hubShortcutIcon}>🩺</Text>
                <Text style={styles.hubShortcutText}>Specialties</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Hospital Partner Management Hub (for HOSPITAL role) */}
        {user?.role === 'HOSPITAL' && (
          <View style={styles.hospitalHubCard}>
            <View style={styles.adminHubHeader}>
              <View style={styles.adminHubTitleRow}>
                <Text style={styles.adminHubIcon}>🏥</Text>
                <View>
                  <Text style={styles.hospitalHubTitle}>Hospital Partner Portal</Text>
                  <Text style={styles.hospitalHubSubtitle}>Manage patient leads, doctors & services</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.hospitalHubEnterBtn}
                onPress={() => navigation.navigate('HospitalDashboard')}
              >
                <Text style={styles.hospitalHubEnterBtnText}>Dashboard →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hubShortcutsGrid}>
              <TouchableOpacity
                style={styles.hubShortcutTile}
                onPress={() => navigation.navigate('HospitalLeads')}
              >
                <Text style={styles.hubShortcutIcon}>📥</Text>
                <Text style={styles.hubShortcutText}>Leads</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hubShortcutTile}
                onPress={() => navigation.navigate('HospitalDoctors')}
              >
                <Text style={styles.hubShortcutIcon}>👨‍⚕️</Text>
                <Text style={styles.hubShortcutText}>Doctors</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hubShortcutTile}
                onPress={() => navigation.navigate('HospitalServices')}
              >
                <Text style={styles.hubShortcutIcon}>🩺</Text>
                <Text style={styles.hubShortcutText}>Services</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hubShortcutTile}
                onPress={() => navigation.navigate('HospitalPackages')}
              >
                <Text style={styles.hubShortcutIcon}>⚡</Text>
                <Text style={styles.hubShortcutText}>Packages</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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

        <Text style={styles.appVersionText}>Clinic By Choice Mobile • v1.0.1 (Production Build)</Text>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  adminHubCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#312E81',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  hospitalHubCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  adminHubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  adminHubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  adminHubIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  adminHubTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textWhite,
  },
  adminHubSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  adminHubEnterBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  adminHubEnterBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textWhite,
  },
  hospitalHubTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textWhite,
  },
  hospitalHubSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  hospitalHubEnterBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  hospitalHubEnterBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textWhite,
  },
  hubShortcutsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  hubShortcutTile: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  hubShortcutIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  hubShortcutText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textWhite,
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
