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
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useSweetAlert } from '../../context/SweetAlertContext';

export const HospitalLeadPurchaseHistoryScreen: React.FC<any> = ({ navigation }) => {
  const { showAlert } = useSweetAlert();

  const [activePackages, setActivePackages] = useState<any[]>([]);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');

  const fetchData = useCallback(async () => {
    try {
      const [pkgRes, profRes] = await Promise.all([
        api.get('/hospital/packages').catch(() => ({ data: null })),
        api.get('/hospital/profile').catch(() => ({ data: null })),
      ]);

      if (pkgRes?.data && Array.isArray(pkgRes.data.activePackages)) {
        setActivePackages(pkgRes.data.activePackages);
      }

      if (profRes?.data?.hospital) {
        setHospitalInfo(profRes.data.hospital);
      }
    } catch (err) {
      console.log('Error fetching lead purchase history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSupportRecharge = () => {
    Alert.alert(
      'Partner Billing Desk',
      'Need to recharge or purchase custom lead packages for your hospital?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Browse Packages',
          onPress: () => navigation.navigate('HospitalPackages'),
        },
        {
          text: 'Call +91 98765 43210',
          onPress: () => Linking.openURL('tel:+919876543210').catch(() => {}),
        },
      ]
    );
  };

  // Filter subscriptions
  const filteredSubscriptions = activePackages.filter((sub) => {
    const matchFilter =
      selectedFilter === 'ALL' ||
      (selectedFilter === 'ACTIVE' && sub.status === 'ACTIVE') ||
      (selectedFilter === 'EXPIRED' && sub.status !== 'ACTIVE');

    const query = search.toLowerCase().trim();
    const matchQuery =
      !query ||
      sub.package?.name?.toLowerCase().includes(query) ||
      sub.payment?.merchantTransactionId?.toLowerCase().includes(query) ||
      sub.payment?.gateway?.toLowerCase().includes(query);

    return matchFilter && matchQuery;
  });

  const remaining = hospitalInfo?.leadsRemaining || 0;
  const totalPurchased = hospitalInfo?.totalLeadsPurchased || 0;
  const totalUsed = hospitalInfo?.totalLeadsUsed || 0;

  const totalSpent = activePackages.reduce(
    (sum, s) => sum + (Number(s.purchasePrice || s.payment?.amount) || 0),
    0
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Buy History</Text>
        <TouchableOpacity
          style={styles.buyNewBtn}
          onPress={() => navigation.navigate('HospitalPackages')}
        >
          <Text style={styles.buyNewBtnText}>+ Buy Leads</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading lead purchase records...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {/* Summary Metric Cards */}
          <View style={styles.metricsHeroCard}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroSubtitle}>AVAILABLE BALANCE</Text>
                <Text style={styles.heroMainBalance}>{remaining} Leads</Text>
              </View>
              <TouchableOpacity style={styles.topUpBtn} onPress={() => navigation.navigate('HospitalPackages')}>
                <Text style={styles.topUpBtnText}>⚡ Top Up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>{totalPurchased}</Text>
                <Text style={styles.metricLbl}>Total Purchased</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={[styles.metricVal, { color: '#D97706' }]}>{totalUsed}</Text>
                <Text style={styles.metricLbl}>Leads Used</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={[styles.metricVal, { color: '#2563EB' }]}>
                  ₹{totalSpent.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.metricLbl}>Total Invested</Text>
              </View>
            </View>
          </View>

          {/* Search & Filter Tabs */}
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search by package name, transaction ID..."
              placeholderTextColor={colors.textMuted}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterTabsRow}>
            {(['ALL', 'ACTIVE', 'EXPIRED'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, selectedFilter === tab && styles.filterTabActive]}
                onPress={() => setSelectedFilter(tab)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === tab && styles.filterTabTextActive,
                  ]}
                >
                  {tab === 'ALL'
                    ? `All Packages (${activePackages.length})`
                    : tab === 'ACTIVE'
                    ? `Active (${activePackages.filter((p) => p.status === 'ACTIVE').length})`
                    : `Expired / Completed`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Subscriptions List */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              📦 Package Purchases & Grants ({filteredSubscriptions.length})
            </Text>
          </View>

          {filteredSubscriptions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>No Purchase Records Found</Text>
              <Text style={styles.emptySubtitle}>
                {search
                  ? 'No lead packages match your search filter.'
                  : 'You have not purchased any lead packages yet. Choose a plan to start receiving patient inquiries.'}
              </Text>
              <TouchableOpacity
                style={styles.browsePlansBtn}
                onPress={() => navigation.navigate('HospitalPackages')}
              >
                <Text style={styles.browsePlansBtnText}>Browse Lead Packages</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredSubscriptions.map((sub) => {
              const leadLimit = sub.leadLimit || sub.package?.leadCount || 0;
              const leadsUsed = sub.leadsUsed || 0;
              const leadsRemaining = sub.leadsRemaining ?? Math.max(0, leadLimit - leadsUsed);
              const progressPct = leadLimit > 0 ? Math.min(100, Math.round((leadsUsed / leadLimit) * 100)) : 0;
              const pricePaid = Number(sub.purchasePrice || sub.payment?.amount || sub.package?.price || 0);
              const isActive = sub.status === 'ACTIVE';

              return (
                <TouchableOpacity
                  key={sub.id}
                  style={styles.subCard}
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation.navigate('HospitalLeadPurchaseDetail', {
                      purchaseId: sub.id,
                      initialPurchase: sub,
                    })
                  }
                >
                  {/* Top Bar */}
                  <View style={styles.subTopRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.subPkgName}>
                        {sub.package?.name || `Lead Package #${sub.packageId}`}
                      </Text>
                      <Text style={styles.subDate}>
                        📅 Purchased on{' '}
                        {new Date(sub.purchasedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>

                    <View style={styles.subPriceCol}>
                      <Text style={styles.subPriceText}>₹{pricePaid.toLocaleString('en-IN')}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isActive ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive,
                          ]}
                        >
                          ● {sub.status || 'ACTIVE'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Lead Usage Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabels}>
                      <Text style={styles.progressTitle}>Lead Quota Consumption</Text>
                      <Text style={styles.progressFraction}>
                        {leadsUsed} / {leadLimit} Used ({leadsRemaining} left)
                      </Text>
                    </View>
                    <View style={styles.progressBarBackground}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${progressPct}%`, backgroundColor: progressPct >= 100 ? '#EF4444' : colors.primary },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Payment & Audit Info */}
                  <View style={styles.subAuditRow}>
                    <View style={styles.auditCol}>
                      <Text style={styles.auditLbl}>PAYMENT METHOD</Text>
                      <Text style={styles.auditVal}>{sub.payment?.gateway || 'PREPAID / MANUAL'}</Text>
                    </View>

                    {sub.payment?.merchantTransactionId ? (
                      <View style={styles.auditCol}>
                        <Text style={styles.auditLbl}>TRANSACTION ID</Text>
                        <Text style={styles.auditVal} numberOfLines={1}>
                          {sub.payment.merchantTransactionId}
                        </Text>
                      </View>
                    ) : null}

                    {sub.expiresAt ? (
                      <View style={styles.auditCol}>
                        <Text style={styles.auditLbl}>EXPIRES ON</Text>
                        <Text style={styles.auditVal}>
                          {new Date(sub.expiresAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}`
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.auditCol}>
                        <Text style={styles.auditLbl}>VALIDITY</Text>
                        <Text style={styles.auditVal}>Unlimited</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.subCardFooter}>
                    <TouchableOpacity
                      style={styles.invoiceCardBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        navigation.navigate('HospitalInvoice', {
                          subscriptionId: sub.id,
                        });
                      }}
                    >
                      <Text style={styles.invoiceCardBtnText}>🧾 Tax Invoice</Text>
                    </TouchableOpacity>

                    <Text style={styles.viewDetailLink}>👁️ Quota Details →</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Help Desk Banner */}
          <View style={styles.helpBanner}>
            <Text style={styles.helpEmoji}>💬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.helpTitle}>Questions regarding your invoice?</Text>
              <Text style={styles.helpSub}>
                Contact our accounts support team for GST tax invoices and custom billing receipts.
              </Text>
            </View>
            <TouchableOpacity style={styles.helpBtn} onPress={handleSupportRecharge}>
              <Text style={styles.helpBtnText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 10,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  buyNewBtn: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buyNewBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  metricsHeroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingBottom: 14,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  heroMainBalance: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 2,
  },
  topUpBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  topUpBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    height: 44,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    height: '100%',
  },
  clearSearchText: {
    fontSize: 14,
    color: '#64748B',
    padding: 4,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  sectionHeader: {
    marginTop: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 6,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
  browsePlansBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  browsePlansBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  subCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  subTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subPkgName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subDate: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  subPriceCol: {
    alignItems: 'flex-end',
  },
  subPriceText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadgeTextActive: {
    color: '#15803D',
  },
  statusBadgeTextInactive: {
    color: '#475569',
  },
  progressContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  progressFraction: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  subAuditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: 8,
  },
  subCardFooter: {
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceCardBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  invoiceCardBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  viewDetailLink: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  auditCol: {
    flex: 1,
  },
  auditLbl: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  auditVal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  helpBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  helpEmoji: {
    fontSize: 24,
  },
  helpTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  helpSub: {
    fontSize: 12,
    color: '#1E3A8A',
    marginTop: 2,
    lineHeight: 16,
  },
  helpBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  helpBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
