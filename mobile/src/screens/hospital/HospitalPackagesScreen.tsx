import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';

interface HospitalPackagesScreenProps {
  navigation: any;
}

export const HospitalPackagesScreen: React.FC<HospitalPackagesScreenProps> = ({ navigation }) => {
  const [packages, setPackages] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await api.get('/hospital/packages');
      if (res.data) {
        if (Array.isArray(res.data.packages)) {
          setPackages(res.data.packages);
        }
        if (Array.isArray(res.data.recentPayments)) {
          setRecentPayments(res.data.recentPayments);
        }
      }
    } catch (err) {
      console.log('Error fetching packages:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPackages();
  };

  const handleSupportRecharge = (pkg: any) => {
    Alert.alert(
      `Purchase ${pkg.name}`,
      `Total: ₹${Number(pkg.price).toLocaleString('en-IN')} for ${pkg.leadsCount} patient leads. Would you like to connect with our Partner Billing Desk?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact Billing',
          onPress: () => {
            Linking.openURL('tel:+919876543210').catch(() => {});
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Packages</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading package rates...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {/* Banner */}
          <View style={styles.bannerCard}>
            <Text style={styles.bannerIcon}>⚡</Text>
            <Text style={styles.bannerTitle}>Pay-Per-Lead Credit Packages</Text>
            <Text style={styles.bannerDesc}>
              1 Lead credit is deducted per verified patient consultation inquiry received for your hospital.
            </Text>
          </View>

          {/* Package Cards */}
          <Text style={styles.sectionHeading}>Available Packages</Text>
          {packages.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Contact sales for custom hospital lead plans.</Text>
            </View>
          ) : (
            packages.map((pkg) => {
              const perLead = pkg.pricePerLead || (pkg.leadsCount > 0 ? Math.round(pkg.price / pkg.leadsCount) : 0);
              return (
                <View key={pkg.id} style={styles.packageCard}>
                  <View style={styles.packageTop}>
                    <View>
                      <Text style={styles.packageName}>{pkg.name}</Text>
                      <Text style={styles.leadsCount}>{pkg.leadsCount} Verified Leads</Text>
                    </View>
                    <View style={styles.priceCol}>
                      <Text style={styles.packagePrice}>₹{Number(pkg.price).toLocaleString('en-IN')}</Text>
                      <Text style={styles.perLeadRate}>~₹{perLead} / lead</Text>
                    </View>
                  </View>

                  {pkg.description ? (
                    <Text style={styles.pkgDesc}>{pkg.description}</Text>
                  ) : null}

                  <TouchableOpacity
                    style={styles.selectBtn}
                    onPress={() => handleSupportRecharge(pkg)}
                  >
                    <Text style={styles.selectBtnText}>Select Package →</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          {/* Recent Invoices / Payments */}
          {recentPayments.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.sectionHeading}>Recharge History</Text>
              {recentPayments.map((p) => (
                <View key={p.id} style={styles.historyRow}>
                  <View>
                    <Text style={styles.historyTitle}>{p.package?.name || 'Lead Top-up'}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyAmount}>₹{Number(p.amount).toLocaleString('en-IN')}</Text>
                    <View style={[styles.statusPill, p.status === 'SUCCESS' ? styles.statusSuccess : styles.statusPending]}>
                      <Text style={styles.statusPillText}>{p.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: colors.secondary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    alignItems: 'center',
  },
  bannerIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textWhite,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  packageCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  packageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  packageName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  leadsCount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  perLeadRate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  pkgDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  selectBtn: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  emptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  historySection: {
    marginTop: 16,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  historyDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  statusSuccess: {
    backgroundColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textPrimary,
  },
});
