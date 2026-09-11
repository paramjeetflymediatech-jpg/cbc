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
import { useSweetAlert } from '../../context/SweetAlertContext';

export const HospitalPackageDetailScreen: React.FC<any> = ({ route, navigation }) => {
  const { packageId, initialPackage } = route?.params || {};
  const { showAlert } = useSweetAlert();

  const [pkg, setPkg] = useState<any>(initialPackage || null);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(!initialPackage);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await api.get('/hospital/packages');
      if (res.data) {
        if (Array.isArray(res.data.packages)) {
          const found = res.data.packages.find((p: any) => p.id === Number(packageId));
          if (found) {
            setPkg(found);
          }
        }
        if (res.data.hospital) {
          setHospitalInfo(res.data.hospital);
        }
        if (Array.isArray(res.data.recentPayments)) {
          const matchingPayments = res.data.recentPayments.filter(
            (p: any) => p.packageId === Number(packageId) || p.package?.id === Number(packageId)
          );
          setPurchaseHistory(matchingPayments);
        }
      }
    } catch (err) {
      console.log('Error fetching package detail for hospital:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [packageId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const [buying, setBuying] = useState<boolean>(false);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetails();
  };

  const handleBuyWithPhonePe = () => {
    if (!pkg) return;
    const lCount = pkg.leadCount || pkg.leadsCount || 0;
    const pPrice = Number(pkg.price || 0);

    Alert.alert(
      `Recharge ${pkg.name}`,
      `⚡ ${lCount} Patient Leads\n💰 ₹${pPrice.toLocaleString('en-IN')} (Incl. 18% GST)\n\nProceed to secure payment with PhonePe?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay with PhonePe',
          onPress: async () => {
            try {
              setBuying(true);
              const res = await api.post('/payments/phonepe/initiate', { packageId: pkg.id });
              if (res.data?.success && res.data?.redirectUrl) {
                navigation.navigate('HospitalPaymentCheckout', {
                  redirectUrl: res.data.redirectUrl,
                  merchantTransactionId: res.data.merchantTransactionId,
                  packageInfo: {
                    id: pkg.id,
                    name: pkg.name,
                    leadCount: lCount,
                    price: pPrice,
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
              setBuying(false);
            }
          },
        },
      ]
    );
  };

  const handleContactBilling = () => {
    Alert.alert(
      'Partner Billing Desk',
      `Would you like to speak to our billing manager for package "${pkg?.name}" (₹${Number(
        pkg?.price || 0
      ).toLocaleString('en-IN')})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call +91 98765 43210',
          onPress: () => {
            Linking.openURL('tel:+919876543210').catch(() => {});
          },
        },
        {
          text: 'WhatsApp Us',
          onPress: () => {
            Linking.openURL(
              `https://wa.me/919876543210?text=Hello,%20we%20want%20to%20activate%20Lead%20Package:%20${encodeURIComponent(
                pkg?.name || 'Leads'
              )}%20for%20our%20hospital.`
            ).catch(() => {});
          },
        },
      ]
    );
  };

  // Render formatted rich-text description
  const renderFormattedDescription = (html: string) => {
    if (!html || !html.trim()) {
      return (
        <Text style={styles.emptyDescText}>
          Standard verified patient lead package with SMS & Email alert notifications.
        </Text>
      );
    }

    const cleanLines = html
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n§§H2§§$1§§END§§\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n§§H3§§$1§§END§§\n')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '\n§§QUOTE§§$1§§END§§\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(p|ul|ol|div|span|section)[^>]*>/gi, '\n')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');

    const blocks = cleanLines.split('\n').filter((l) => l.trim().length > 0);

    return (
      <View style={styles.richTextContainer}>
        {blocks.map((block, idx) => {
          if (block.includes('§§H2§§')) {
            const heading = block.replace('§§H2§§', '').replace('§§END§§', '').replace(/<[^>]+>/g, '');
            return (
              <Text key={idx} style={styles.richH2}>
                {heading}
              </Text>
            );
          }
          if (block.includes('§§H3§§')) {
            const heading = block.replace('§§H3§§', '').replace('§§END§§', '').replace(/<[^>]+>/g, '');
            return (
              <Text key={idx} style={styles.richH3}>
                {heading}
              </Text>
            );
          }
          if (block.includes('§§QUOTE§§')) {
            const quote = block.replace('§§QUOTE§§', '').replace('§§END§§', '').replace(/<[^>]+>/g, '');
            return (
              <View key={idx} style={styles.richQuoteBox}>
                <Text style={styles.richQuoteText}>"{quote}"</Text>
              </View>
            );
          }
          if (block.startsWith('•')) {
            const bullet = block.replace('•', '').replace(/<[^>]+>/g, '').trim();
            return (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>✓</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            );
          }

          const cleanParagraph = block.replace(/<[^>]+>/g, '').trim();
          if (!cleanParagraph) return null;

          return (
            <Text key={idx} style={styles.richParagraph}>
              {cleanParagraph}
            </Text>
          );
        })}
      </View>
    );
  };

  const leadCount = pkg?.leadCount || pkg?.leadsCount || 0;
  const price = Number(pkg?.price || 0);
  const perLeadRate = leadCount > 0 ? (price / leadCount).toFixed(0) : '0';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {pkg?.name || 'Package Details'}
        </Text>
        <TouchableOpacity style={styles.helpBtn} onPress={handleContactBilling}>
          <Text style={styles.helpBtnText}>📞 Support</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading package features...</Text>
        </View>
      ) : !pkg ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>Package Not Found</Text>
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
          {/* Main Price Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopBadgeRow}>
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>⚡ VERIFIED PATIENT LEADS</Text>
              </View>
              <View style={styles.tierPill}>
                <Text style={styles.tierPillText}>Instant Activation</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>{pkg.name}</Text>

            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.mainPrice}>{price.toLocaleString('en-IN')}</Text>
                <Text style={styles.priceSubText}>+ GST</Text>
              </View>
              <View style={styles.perLeadPill}>
                <Text style={styles.perLeadPillText}>₹{perLeadRate} / Lead</Text>
              </View>
            </View>

            {/* Quota Highlights */}
            <View style={styles.metricsBox}>
              <View style={styles.metricCol}>
                <Text style={styles.metricVal}>⚡ {leadCount}</Text>
                <Text style={styles.metricLbl}>Credits Included</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={styles.metricVal}>Instant</Text>
                <Text style={styles.metricLbl}>Lead Delivery</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={styles.metricVal}>100%</Text>
                <Text style={styles.metricLbl}>Verified Inquiries</Text>
              </View>
            </View>

            {/* CTA Buttons */}
            <TouchableOpacity
              style={[styles.rechargeBtn, buying && { opacity: 0.7 }]}
              onPress={handleBuyWithPhonePe}
              disabled={buying}
            >
              {buying ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.rechargeBtnText}>
                  ⚡ Pay ₹{price.toLocaleString('en-IN')} with PhonePe
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Hospital Account Balance Card */}
          {hospitalInfo && (
            <View style={styles.balanceCard}>
              <View style={styles.balanceLeft}>
                <Text style={styles.balanceLabel}>Current Hospital Balance</Text>
                <Text style={styles.balanceValue}>
                  {hospitalInfo.leadsRemaining ?? hospitalInfo.leadBalance ?? 0} Lead Credits
                </Text>
              </View>
              <View style={styles.balanceBadge}>
                <Text style={styles.balanceBadgeText}>
                  +{leadCount} on Top-up
                </Text>
              </View>
            </View>
          )}

          {/* Package Features / Description (CKEditor Styled) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>✨ What's Included in This Package</Text>
            </View>
            {renderFormattedDescription(pkg.description || '')}
          </View>

          {/* Lead Delivery Workflow */}
          <View style={styles.workflowCard}>
            <Text style={styles.workflowTitle}>How Leads Are Delivered</Text>

            <View style={styles.stepRow}>
              <View style={styles.stepNumBox}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>Patient Submits Consultation Inquiry</Text>
                <Text style={styles.stepDesc}>
                  Patients searching for your specialties in your city submit appointment requests.
                </Text>
              </View>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumBox}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>Instant Mobile & Email Alert</Text>
                <Text style={styles.stepDesc}>
                  You receive patient name, phone number, medical condition, and preferred time instantly.
                </Text>
              </View>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumBox}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>Automatic Credit Deduction</Text>
                <Text style={styles.stepDesc}>
                  1 lead credit is deducted only when complete patient contact info is delivered.
                </Text>
              </View>
            </View>
          </View>

          {/* Support Banner */}
          <View style={styles.supportBanner}>
            <Text style={styles.supportBannerEmoji}>💬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportBannerTitle}>Need a custom volume tier?</Text>
              <Text style={styles.supportBannerSub}>
                Talk to your dedicated account manager for multi-specialty hospital packages.
              </Text>
            </View>
            <TouchableOpacity style={styles.supportBannerBtn} onPress={handleContactBilling}>
              <Text style={styles.supportBannerBtnText}>Contact</Text>
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
    marginHorizontal: 8,
  },
  helpBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  helpBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
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
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  popularBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  tierPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 14,
  },
  priceLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginRight: 2,
  },
  mainPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  priceSubText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
    fontWeight: '600',
  },
  perLeadPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  perLeadPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  metricsBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  metricCol: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  metricLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },
  rechargeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  rechargeBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  balanceCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLeft: {
    gap: 2,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  balanceBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  balanceBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeader: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyDescText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  richTextContainer: {
    gap: 8,
  },
  richH2: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 6,
    marginBottom: 2,
  },
  richH3: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  richQuoteBox: {
    borderLeftWidth: 3,
    borderColor: colors.primary,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginVertical: 4,
  },
  richQuoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9F1239',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 2,
  },
  bulletDot: {
    fontSize: 13,
    fontWeight: '900',
    color: '#059669',
    marginTop: 1,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
    flex: 1,
  },
  richParagraph: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  workflowCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  },
  workflowTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNumBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1E40AF',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  stepDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  subsList: {
    gap: 8,
    marginTop: 8,
  },
  subCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  subCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  subPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  supportBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  supportBannerEmoji: {
    fontSize: 24,
  },
  supportBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  supportBannerSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
    lineHeight: 15,
  },
  supportBannerBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  supportBannerBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
