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
  Share,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useSweetAlert } from '../../context/SweetAlertContext';

export const HospitalLeadPurchaseDetailScreen: React.FC<any> = ({ route, navigation }) => {
  const { purchaseId, initialPurchase } = route?.params || {};
  const { showAlert } = useSweetAlert();

  const [purchase, setPurchase] = useState<any>(initialPurchase || null);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [relatedLeads, setRelatedLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(!initialPurchase);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchPurchaseDetail = useCallback(async () => {
    try {
      const [pkgRes, leadsRes, profRes] = await Promise.all([
        api.get('/hospital/packages').catch(() => ({ data: null })),
        api.get('/hospital/leads').catch(() => ({ data: null })),
        api.get('/hospital/profile').catch(() => ({ data: null })),
      ]);

      if (pkgRes?.data) {
        if (Array.isArray(pkgRes.data.activePackages)) {
          const found = pkgRes.data.activePackages.find(
            (p: any) => String(p.id) === String(purchaseId) || String(p.packageId) === String(purchaseId)
          );
          if (found) {
            setPurchase(found);
          }
        }
      }

      if (profRes?.data?.hospital) {
        setHospitalInfo(profRes.data.hospital);
      }

      if (leadsRes?.data?.leads && Array.isArray(leadsRes.data.leads)) {
        setRelatedLeads(leadsRes.data.leads.slice(0, 10));
      }
    } catch (err) {
      console.log('Error fetching lead purchase details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [purchaseId]);

  useEffect(() => {
    fetchPurchaseDetail();
  }, [fetchPurchaseDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPurchaseDetail();
  };

  const handleShareReceipt = async () => {
    if (!purchase) return;
    const pkgName = purchase.package?.name || 'Lead Package';
    const leads = purchase.leadLimit || purchase.leadCount || purchase.package?.leadCount || 0;
    const price = purchase.purchasePrice || purchase.payment?.amount || purchase.package?.price || 0;
    const txnId = purchase.payment?.merchantTransactionId || `TXN-${purchase.id}`;
    const date = new Date(purchase.purchasedAt || purchase.createdAt).toLocaleDateString('en-IN');

    const message = `ClinicByChoice Lead Package Receipt\nPackage: ${pkgName}\nLeads Credited: ${leads} Patient Leads\nAmount Paid: ₹${Number(price).toLocaleString('en-IN')}\nTransaction Ref: ${txnId}\nDate: ${date}\nHospital: ${hospitalInfo?.name || 'Partner Hospital'}\nStatus: Verified`;

    try {
      await Share.share({ message, title: 'Lead Purchase Receipt' });
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  const handleContactBilling = () => {
    Alert.alert(
      'Billing Support',
      'Contact our finance desk regarding this invoice or request GST input tax invoice:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Accounts Desk',
          onPress: () => Linking.openURL('tel:+919876543210').catch(() => {}),
        },
        {
          text: 'Email Accounts',
          onPress: () =>
            Linking.openURL(
              `mailto:accounts@clinicbychoice.com?subject=Tax%20Invoice%20Request%20-%20Txn%20${purchase?.payment?.merchantTransactionId || purchase?.id}`
            ).catch(() => {}),
        },
      ]
    );
  };

  const leadLimit = purchase?.leadLimit || purchase?.leadCount || purchase?.package?.leadCount || 0;
  const leadsUsed = purchase?.leadsUsed || 0;
  const leadsRemaining = purchase?.leadsRemaining ?? Math.max(0, leadLimit - leadsUsed);
  const progressPct = leadLimit > 0 ? Math.min(100, Math.round((leadsUsed / leadLimit) * 100)) : 0;
  const pricePaid = Number(purchase?.purchasePrice || purchase?.payment?.amount || purchase?.package?.price || 0);
  const perLeadRate = leadLimit > 0 ? (pricePaid / leadLimit).toFixed(0) : '0';
  const isActive = purchase?.status === 'ACTIVE';

  const txnId = purchase?.payment?.merchantTransactionId || `TXN-ORD-${purchase?.id || '001'}`;
  const gateway = purchase?.payment?.gateway || purchase?.paymentMethod || 'PHONEPE / ONLINE';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Purchase Invoice #{purchase?.id || purchaseId}
        </Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShareReceipt}>
          <Text style={styles.shareBtnText}>📤 Share</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading purchase invoice details...</Text>
        </View>
      ) : !purchase ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>Purchase Record Not Found</Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backHomeBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {/* Main Hero Invoice Card */}
          <View style={styles.heroInvoiceCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.brandTag}>
                <Text style={styles.brandTagText}>CLINICBYCHOICE INVOICE</Text>
              </View>
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
                  ● {purchase.status || 'ACTIVE'}
                </Text>
              </View>
            </View>

            <Text style={styles.packageName}>
              {purchase.package?.name || `Lead Package #${purchase.packageId}`}
            </Text>

            <View style={styles.priceContainer}>
              <View>
                <Text style={styles.priceLabel}>TOTAL AMOUNT PAID</Text>
                <Text style={styles.priceValue}>₹{pricePaid.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.ratePill}>
                <Text style={styles.ratePillText}>₹{perLeadRate} / Lead</Text>
              </View>
            </View>

            {/* Quota Progress Meter */}
            <View style={styles.quotaMeterCard}>
              <View style={styles.quotaHeader}>
                <Text style={styles.quotaTitle}>Lead Credits Allocation</Text>
                <Text style={styles.quotaCount}>
                  <Text style={{ color: colors.primary, fontWeight: '900' }}>{leadsRemaining}</Text> of {leadLimit} Available
                </Text>
              </View>

              <View style={styles.meterTrack}>
                <View
                  style={[
                    styles.meterFill,
                    {
                      width: `${progressPct}%`,
                      backgroundColor: progressPct >= 100 ? '#EF4444' : colors.primary,
                    },
                  ]}
                />
              </View>

              <View style={styles.quotaFooter}>
                <Text style={styles.quotaFooterText}>🔥 {leadsUsed} Leads Delivered</Text>
                <Text style={styles.quotaFooterText}>{progressPct}% Consumed</Text>
              </View>
            </View>
          </View>

          {/* Payment & Audit Details Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>🧾 Payment & Transaction Audit</Text>

            <View style={styles.auditList}>
              <View style={styles.auditRow}>
                <Text style={styles.auditLabel}>Transaction Ref</Text>
                <Text style={styles.auditValueMono} numberOfLines={1}>{txnId}</Text>
              </View>

              <View style={styles.auditRow}>
                <Text style={styles.auditLabel}>Payment Gateway</Text>
                <Text style={styles.auditValue}>{gateway}</Text>
              </View>

              <View style={styles.auditRow}>
                <Text style={styles.auditLabel}>Purchase Date</Text>
                <Text style={styles.auditValue}>
                  {new Date(purchase.purchasedAt || purchase.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <View style={styles.auditRow}>
                <Text style={styles.auditLabel}>Validity Period</Text>
                <Text style={styles.auditValue}>
                  {purchase.expiresAt
                    ? `Until ${new Date(purchase.expiresAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}`
                    : 'Unlimited (No Expiry)'}
                </Text>
              </View>

              <View style={styles.auditRow}>
                <Text style={styles.auditLabel}>Hospital Account</Text>
                <Text style={styles.auditValue}>{hospitalInfo?.name || 'My Hospital Partner'}</Text>
              </View>
            </View>
          </View>

          {/* Consultation Leads Delivered from this Quota */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>
                🩺 Patient Inquiries Delivered ({relatedLeads.length})
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('HospitalLeads')}>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            {relatedLeads.length === 0 ? (
              <View style={styles.emptyLeadsBox}>
                <Text style={styles.emptyLeadsEmoji}>📥</Text>
                <Text style={styles.emptyLeadsTitle}>Awaiting Patient Inquiries</Text>
                <Text style={styles.emptyLeadsSub}>
                  Patient leads generated for your hospital will be deducted from this credit allocation.
                </Text>
              </View>
            ) : (
              <View style={styles.leadsList}>
                {relatedLeads.map((lead) => (
                  <TouchableOpacity
                    key={lead.id}
                    style={styles.leadItemCard}
                    onPress={() =>
                      navigation.navigate('HospitalLeadDetail', {
                        leadId: lead.id,
                        initialLead: lead,
                      })
                    }
                  >
                    <View style={styles.leadItemLeft}>
                      <Text style={styles.leadItemName}>{lead.patientName}</Text>
                      <Text style={styles.leadItemService}>
                        🩺 {lead.service?.name || 'Consultation'} • {lead.city || 'India'}
                      </Text>
                    </View>
                    <View style={styles.leadItemRight}>
                      <View style={styles.leadItemPill}>
                        <Text style={styles.leadItemPillText}>{lead.status}</Text>
                      </View>
                      <Text style={styles.leadItemTime}>
                        {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Action Row */}
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={styles.viewInvoicePrimaryBtn}
              onPress={() =>
                navigation.navigate('HospitalInvoice', {
                  subscriptionId: purchase.id,
                  paymentId: purchase.paymentId,
                })
              }
            >
              <Text style={styles.viewInvoicePrimaryBtnText}>🧾 View Official Tax Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.topUpAgainBtn} onPress={() => navigation.navigate('HospitalPackages')}>
              <Text style={styles.topUpAgainBtnText}>⚡ Buy More Leads</Text>
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
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  shareBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  backHomeBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backHomeBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  heroInvoiceCard: {
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
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTag: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  brandTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
  packageName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingBottom: 12,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 2,
  },
  ratePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ratePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  quotaMeterCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 8,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  quotaCount: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  meterTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  quotaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quotaFooterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  auditList: {
    gap: 10,
    marginTop: 4,
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  auditLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  auditValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  auditValueMono: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
    fontFamily: 'Courier',
    maxWidth: 180,
  },
  emptyLeadsBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  emptyLeadsEmoji: {
    fontSize: 26,
  },
  emptyLeadsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyLeadsSub: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 16,
  },
  leadsList: {
    gap: 8,
  },
  leadItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadItemLeft: {
    flex: 1,
    paddingRight: 8,
  },
  leadItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  leadItemService: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  leadItemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  leadItemPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  leadItemPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  leadItemTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  actionBtnRow: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  },
  viewInvoicePrimaryBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  viewInvoicePrimaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  topUpAgainBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  topUpAgainBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
