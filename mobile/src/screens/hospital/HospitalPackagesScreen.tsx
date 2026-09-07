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
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await api.get('/hospital/packages');
      if (res.data && Array.isArray(res.data.packages)) {
        setPackages(res.data.packages);
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

  const [initiatingId, setInitiatingId] = useState<number | null>(null);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPackages();
  };

  const handleBuyWithPhonePe = (pkg: any) => {
    const leadCount = pkg.leadsCount || pkg.leadCount || 0;
    const price = Number(pkg.price || 0);

    Alert.alert(
      `Recharge ${pkg.name}`,
      `⚡ ${leadCount} Patient Leads\n💰 ₹${price.toLocaleString('en-IN')} (Incl. 18% GST)\n\nProceed to secure payment with PhonePe?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay with PhonePe',
          onPress: async () => {
            try {
              setInitiatingId(pkg.id);
              const res = await api.post('/payments/phonepe/initiate', { packageId: pkg.id });
              if (res.data?.success && res.data?.redirectUrl) {
                navigation.navigate('HospitalPaymentCheckout', {
                  redirectUrl: res.data.redirectUrl,
                  merchantTransactionId: res.data.merchantTransactionId,
                  packageInfo: {
                    id: pkg.id,
                    name: pkg.name,
                    leadCount: leadCount,
                    price: price,
                  },
                });
              } else {
                Alert.alert('Payment Error', res.data?.error || 'Could not initiate PhonePe payment order.');
              }
            } catch (err: any) {
              console.log('Payment initiate error:', err);
              Alert.alert(
                'Payment Error',
                err?.response?.data?.error || 'Failed to connect to PhonePe gateway. Please try again.'
              );
            } finally {
              setInitiatingId(null);
            }
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
        <TouchableOpacity
          style={styles.historyHeaderBtn}
          onPress={() => navigation.navigate('HospitalLeadPurchaseHistory')}
        >
          <Text style={styles.historyHeaderBtnText}>📜 History</Text>
        </TouchableOpacity>
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
                <TouchableOpacity
                  key={pkg.id}
                  style={styles.packageCard}
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation.navigate('HospitalPackageDetail', {
                      packageId: pkg.id,
                      initialPackage: pkg,
                    })
                  }
                >
                  <View style={styles.packageTop}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.packageName}>{pkg.name}</Text>
                      <Text style={styles.leadsCount}>⚡ {pkg.leadsCount || pkg.leadCount} Verified Leads</Text>
                    </View>
                    <View style={styles.priceCol}>
                      <Text style={styles.packagePrice}>₹{Number(pkg.price).toLocaleString('en-IN')}</Text>
                      <Text style={styles.perLeadRate}>~₹{perLead} / lead</Text>
                    </View>
                  </View>

                  {pkg.description ? (
                    <Text style={styles.pkgDesc} numberOfLines={2}>
                      {pkg.description.replace(/<[^>]*>?/gm, '')}
                    </Text>
                  ) : null}

                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() =>
                        navigation.navigate('HospitalPackageDetail', {
                          packageId: pkg.id,
                          initialPackage: pkg,
                        })
                      }
                    >
                      <Text style={styles.detailsBtnText}>👁️ View Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.selectBtn, initiatingId === pkg.id && { opacity: 0.7 }]}
                      onPress={() => handleBuyWithPhonePe(pkg)}
                      disabled={initiatingId === pkg.id}
                    >
                      {initiatingId === pkg.id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.selectBtnText}>⚡ Pay PhonePe</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
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
  historyHeaderBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  historyHeaderBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
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
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  detailsBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  selectBtn: {
    flex: 1.2,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectBtnText: {
    fontSize: 12,
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
});
