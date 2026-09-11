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
import { colors } from '../theme/colors';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface LeadPackageItem {
  id: number;
  name: string;
  leadCount: number;
  price: number;
  originalPrice: number;
  popular?: boolean;
  tag: string;
  targetAudience: string;
  description: string;
  features: string[];
}

const defaultPackages: LeadPackageItem[] = [
  {
    id: 1,
    name: 'Starter Clinic Pack',
    leadCount: 10,
    price: 3000,
    originalPrice: 4500,
    tag: 'Entry Level',
    targetAudience: 'Single Clinics & Specialists',
    description: 'Get started with verified digital patient enquiries in your local area with zero monthly commitments.',
    features: [
      '10 Verified Patient Enquiries',
      'Direct Patient Mobile & Email Access',
      'Instant Lead Push Alerts',
      'Standard Hospital CRM Dashboard',
      '48-Hour Held Lead Protection',
      'Basic Specialty Profile Listing',
    ],
  },
  {
    id: 2,
    name: 'Growth Care Pack',
    leadCount: 30,
    price: 8000,
    originalPrice: 12000,
    popular: true,
    tag: 'Most Popular',
    targetAudience: 'Established Specialty Centers',
    description: 'Our most popular package designed to scale daily OPD footfall and boost surgical procedure bookings.',
    features: [
      '30 Verified Patient Enquiries',
      'Direct Patient Mobile, WhatsApp & Email',
      'Real-Time Instant Lead Alerts',
      'Full CRM Dashboard with Lead Notes',
      '48-Hour Held Lead Protection',
      'Verified Hospital Profile Badge',
      'Multiple Doctors Support',
      'Priority Phone & WhatsApp Support',
    ],
  },
  {
    id: 3,
    name: 'Super Specialty Pro',
    leadCount: 50,
    price: 13000,
    originalPrice: 19500,
    tag: 'Best Value',
    targetAudience: 'Multi-Specialty & Tertiary Hospitals',
    description: 'Accelerate high-ticket elective surgeries, inpatient admissions, and tertiary care consultations.',
    features: [
      '50 Verified Patient Enquiries',
      'Highest Priority Direct Lead Delivery',
      'Real-Time Email, SMS & Push Alerts',
      'Comprehensive Multi-User Hospital CRM',
      'Enhanced 72-Hour Held Lead Protection',
      'Featured Top Placement on City Pages',
      'Unlimited Doctor Profiles',
      'Dedicated Account Coordination Manager',
    ],
  },
];

const comparisonRows = [
  { feature: 'Patient Lead Credits', starter: '10 Leads', growth: '30 Leads', pro: '50 Leads' },
  { feature: 'Cost per Verified Lead', starter: '₹300 / lead', growth: '₹267 / lead', pro: '₹260 / lead' },
  { feature: 'Contact Info Access', starter: 'Phone & Email', growth: 'Phone, WhatsApp & Email', pro: 'Full Details + Priority Alerts' },
  { feature: 'Held Lead Grace Period', starter: '48 Hours', growth: '48 Hours', pro: '72 Hours' },
  { feature: 'Profile Listing Badge', starter: 'Standard Listing', growth: 'Verified Hospital Badge', pro: 'Featured Top Placement' },
  { feature: 'Doctor Profiles', starter: 'Up to 3 Doctors', growth: 'Up to 10 Doctors', pro: 'Unlimited Doctors' },
  { feature: 'Support Level', starter: 'Email Support', growth: 'Priority Phone & WhatsApp', pro: 'Dedicated Account Manager' },
];

const faqsList = [
  {
    q: 'How does the Clinic By Choice patient lead system work?',
    a: 'Each lead package credits your hospital account with genuine patient enquiries. When a patient in your city submits an enquiry, 1 lead credit unlocks their complete contact details (Full Name, Phone, Email & Medical Query) instantly.',
  },
  {
    q: 'Are patient enquiries exclusive to our hospital?',
    a: 'Yes! When a patient selects your hospital or requests a specialized treatment in your location, the lead is routed directly to your dashboard in real-time.',
  },
  {
    q: 'Can we recharge or purchase top-ups anytime?',
    a: 'Yes! Any new package you purchase is immediately added on top of your existing lead credits with zero downtime.',
  },
  {
    q: 'How fast is package activation after payment?',
    a: 'Instantaneous! Payments are processed securely via PhonePe, UPI, Net Banking, and Cards with instant activation.',
  },
];

export const PricingScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<LeadPackageItem[]>(defaultPackages);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedLeadsIndex, setSelectedLeadsIndex] = useState<number>(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [initiatingId, setInitiatingId] = useState<number | null>(null);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await api.get('/packages');
      if (res.data?.packages && Array.isArray(res.data.packages) && res.data.packages.length > 0) {
        const merged = defaultPackages.map((defPkg, idx) => {
          const apiMatch = res.data.packages[idx] || res.data.packages.find((p: any) => p.leadCount === defPkg.leadCount);
          if (apiMatch) {
            return {
              ...defPkg,
              name: apiMatch.name || defPkg.name,
              price: Number(apiMatch.price) || defPkg.price,
              leadCount: Number(apiMatch.leadCount) || defPkg.leadCount,
            };
          }
          return defPkg;
        });
        setPackages(merged);
      }
    } catch (err) {
      console.log('Error fetching packages in PricingScreen:', err);
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

  const handleActionPress = (pkg: LeadPackageItem) => {
    if (user?.role === 'HOSPITAL') {
      Alert.alert(
        `Purchase ${pkg.name}`,
        `⚡ ${pkg.leadCount} Patient Leads\n💰 ₹${pkg.price.toLocaleString('en-IN')}\n\nProceed to secure payment with PhonePe?`,
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
                      leadCount: pkg.leadCount,
                      price: pkg.price,
                    },
                  });
                } else {
                  Alert.alert('Payment Error', res.data?.error || 'Could not initiate PhonePe checkout.');
                }
              } catch (err: any) {
                Alert.alert('Payment Error', err?.response?.data?.error || 'Failed to connect to PhonePe gateway.');
              } finally {
                setInitiatingId(null);
              }
            },
          },
        ]
      );
    } else {
      navigation.navigate('GetListed');
    }
  };

  // Calculator projections
  const leadOptions = [10, 30, 50, 100];
  const activeLeadCount = leadOptions[selectedLeadsIndex];
  const estPatients = Math.round(activeLeadCount * 0.35);
  const estRevenueMin = (estPatients * 12500).toLocaleString('en-IN');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Pricing</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Hero Section */}
        <View style={styles.heroBanner}>
          <View style={styles.badgeRow}>
            <Text style={styles.sparkleIcon}>⚡</Text>
            <Text style={styles.badgeText}>HOSPITAL GROWTH &amp; PATIENT ACQUISITION</Text>
          </View>
          <Text style={styles.heroTitle}>Simple, Transparent Packages for Guaranteed Patient Enquiries</Text>
          <Text style={styles.heroSubtitle}>
            No retainers. No bidding wars. Connect directly with genuine patients actively searching for medical procedures in your city.
          </Text>

          {/* Highlights */}
          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <Text style={styles.trustCheck}>✓</Text>
              <Text style={styles.trustText}>100% Verified Phones</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.trustCheck}>✓</Text>
              <Text style={styles.trustText}>Direct CRM Delivery</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.trustCheck}>✓</Text>
              <Text style={styles.trustText}>Instant Activation</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.trustCheck}>✓</Text>
              <Text style={styles.trustText}>Zero Commission</Text>
            </View>
          </View>
        </View>

        {/* Pricing Cards */}
        <Text style={styles.sectionTitle}>Select Your Growth Package</Text>

        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading package tiers...</Text>
          </View>
        ) : (
          packages.map((pkg, idx) => {
            const isPopular = pkg.popular || idx === 1;
            const pricePerLead = Math.round(pkg.price / pkg.leadCount);
            const discount = Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100);

            return (
              <View
                key={pkg.id}
                style={[
                  styles.card,
                  isPopular && styles.popularCard,
                ]}
              >
                {isPopular && (
                  <View style={styles.popularBanner}>
                    <Text style={styles.popularBannerText}>★ RECOMMENDED FOR MOST HOSPITALS</Text>
                  </View>
                )}

                <View style={styles.cardHeader}>
                  <View style={styles.tagRow}>
                    <View style={[styles.tierTag, isPopular && styles.popularTierTag]}>
                      <Text style={[styles.tierTagText, isPopular && styles.popularTierTagText]}>{pkg.tag}</Text>
                    </View>
                    {discount > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>Save {discount}%</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <Text style={styles.packageAudience}>{pkg.targetAudience}</Text>
                  <Text style={styles.packageDesc}>{pkg.description}</Text>
                </View>

                {/* Price Box */}
                <View style={styles.priceBox}>
                  <View style={styles.priceMainRow}>
                    <Text style={styles.priceCurrency}>₹</Text>
                    <Text style={styles.priceAmount}>{pkg.price.toLocaleString('en-IN')}</Text>
                    <Text style={styles.originalPrice}>₹{pkg.originalPrice.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.priceSubRow}>
                    <Text style={styles.perLeadText}>₹{pricePerLead} / verified lead</Text>
                    <Text style={styles.instantText}>⚡ Instant Delivery</Text>
                  </View>
                </View>

                {/* Lead Quota */}
                <View style={[styles.quotaBox, isPopular && styles.popularQuotaBox]}>
                  <Text style={[styles.quotaNumber, isPopular && styles.popularQuotaNumber]}>{pkg.leadCount}+</Text>
                  <Text style={[styles.quotaLabel, isPopular && styles.popularQuotaLabel]}>VERIFIED PATIENT ENQUIRIES</Text>
                </View>

                {/* Capabilities */}
                <View style={styles.featureList}>
                  <Text style={styles.featureListHeading}>INCLUDED CAPABILITIES:</Text>
                  {pkg.features.map((feat, fIdx) => (
                    <View key={fIdx} style={styles.featureItem}>
                      <View style={styles.featureBullet}>
                        <Text style={styles.featureBulletText}>✓</Text>
                      </View>
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                {/* CTA Button */}
                <TouchableOpacity
                  style={[styles.ctaBtn, isPopular && styles.popularCtaBtn]}
                  onPress={() => handleActionPress(pkg)}
                  disabled={initiatingId === pkg.id}
                  activeOpacity={0.85}
                >
                  {initiatingId === pkg.id ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={[styles.ctaBtnText, isPopular && styles.popularCtaBtnText]}>
                      {user?.role === 'HOSPITAL' ? `Get ${pkg.leadCount} Patient Leads →` : `List Hospital & Get Leads →`}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Feature Comparison Matrix */}
        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonSub}>DETAILED BREAKDOWN</Text>
          <Text style={styles.comparisonTitle}>Compare Hospital Packages</Text>

          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCol, { flex: 1.4 }]}>Features</Text>
              <Text style={styles.tableHeaderCol}>10 Leads</Text>
              <Text style={[styles.tableHeaderCol, styles.tableHeaderHighlight]}>30 Leads ★</Text>
              <Text style={styles.tableHeaderCol}>50 Leads</Text>
            </View>

            {comparisonRows.map((row, rIdx) => (
              <View key={rIdx} style={[styles.tableBodyRow, rIdx % 2 === 1 && styles.tableRowAlt]}>
                <Text style={[styles.tableBodyColTitle, { flex: 1.4 }]}>{row.feature}</Text>
                <Text style={styles.tableBodyCol}>{row.starter}</Text>
                <Text style={[styles.tableBodyCol, styles.tableBodyColHighlight]}>{row.growth}</Text>
                <Text style={styles.tableBodyCol}>{row.pro}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ROI Calculator Section */}
        <View style={styles.roiCard}>
          <View style={styles.roiHeader}>
            <Text style={styles.roiBadge}>📈 ROI FORECAST</Text>
            <Text style={styles.roiTitle}>Estimate Your Patient Conversions</Text>
            <Text style={styles.roiDesc}>
              Select a lead volume to estimate expected OPD consultations and surgical procedure revenue.
            </Text>
          </View>

          {/* Lead Selector Tabs */}
          <View style={styles.leadTabsRow}>
            {leadOptions.map((opt, idx) => (
              <TouchableOpacity
                key={opt}
                style={[styles.leadTab, selectedLeadsIndex === idx && styles.leadTabActive]}
                onPress={() => setSelectedLeadsIndex(idx)}
              >
                <Text style={[styles.leadTabText, selectedLeadsIndex === idx && styles.leadTabTextActive]}>
                  {opt} Leads
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Outcome Stat Cards */}
          <View style={styles.roiMetricsRow}>
            <View style={styles.roiMetricBox}>
              <Text style={styles.roiMetricVal}>~{estPatients}</Text>
              <Text style={styles.roiMetricLabel}>Estimated Consultations</Text>
            </View>
            <View style={[styles.roiMetricBox, { borderColor: colors.success }]}>
              <Text style={[styles.roiMetricVal, { color: colors.success }]}>₹{estRevenueMin}</Text>
              <Text style={styles.roiMetricLabel}>Estimated Revenue</Text>
            </View>
          </View>

          <Text style={styles.roiNote}>
            * Estimated based on industry-standard 35% clinical enquiry-to-consultation conversion rate.
          </Text>
        </View>

        {/* FAQs */}
        <View style={styles.faqSection}>
          <Text style={styles.faqSectionTitle}>Frequently Asked Questions</Text>
          {faqsList.map((faq, fIdx) => {
            const isOpen = openFaq === fIdx;
            return (
              <TouchableOpacity
                key={fIdx}
                style={styles.faqItem}
                activeOpacity={0.8}
                onPress={() => setOpenFaq(isOpen ? null : fIdx)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Text style={styles.faqToggle}>{isOpen ? '−' : '+'}</Text>
                </View>
                {isOpen && <Text style={styles.faqAnswer}>{faq.a}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Support Footer */}
        <View style={styles.supportCard}>
          <Text style={styles.supportIcon}>📞</Text>
          <Text style={styles.supportTitle}>Need Custom Hospital Pricing?</Text>
          <Text style={styles.supportBody}>
            Our healthcare growth specialists are ready to tailor dedicated lead distribution for your hospital network.
          </Text>
          <TouchableOpacity
            style={styles.supportBtn}
            onPress={() => Linking.openURL('tel:+919876543210').catch(() => {})}
          >
            <Text style={styles.supportBtnText}>📞 Speak with Hospital Advisory</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 50,
  },
  heroBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(253, 29, 116, 0.15)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(253, 29, 116, 0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  sparkleIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 26,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(253, 29, 116, 0.12)',
    paddingTop: 14,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  trustCheck: {
    color: colors.success,
    fontWeight: '900',
    fontSize: 14,
    marginRight: 6,
  },
  trustText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 14,
    marginLeft: 4,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  popularCard: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#FFFDFE',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  popularBanner: {
    backgroundColor: colors.primary,
    marginHorizontal: -18,
    marginTop: -18,
    paddingVertical: 6,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  popularBannerText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardHeader: {
    marginBottom: 14,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tierTag: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  popularTierTag: {
    backgroundColor: colors.primaryLight,
  },
  tierTagText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  popularTierTagText: {
    color: colors.primary,
  },
  discountBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  discountBadgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '800',
  },
  packageName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  packageAudience: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  packageDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  priceBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  priceMainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  priceCurrency: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 2,
  },
  priceAmount: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    marginRight: 8,
  },
  originalPrice: {
    color: colors.textMuted,
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  priceSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 6,
  },
  perLeadText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  instantText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  quotaBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  popularQuotaBox: {
    backgroundColor: colors.primaryLight,
    borderColor: 'rgba(253, 29, 116, 0.25)',
  },
  quotaNumber: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
  },
  popularQuotaNumber: {
    color: colors.primary,
  },
  quotaLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  popularQuotaLabel: {
    color: colors.primary,
  },
  featureList: {
    marginBottom: 18,
  },
  featureListHeading: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureBullet: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  featureBulletText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '900',
  },
  featureText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  ctaBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  popularCtaBtn: {
    backgroundColor: colors.primary,
  },
  ctaBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '900',
  },
  popularCtaBtnText: {
    color: colors.textWhite,
  },
  comparisonSection: {
    marginTop: 12,
    marginBottom: 24,
  },
  comparisonSub: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  comparisonTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  tableCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  tableHeaderCol: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  tableHeaderHighlight: {
    color: colors.primary,
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  tableRowAlt: {
    backgroundColor: colors.surfaceSecondary,
  },
  tableBodyColTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  tableBodyCol: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
  tableBodyColHighlight: {
    color: colors.primary,
    fontWeight: '800',
  },
  roiCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  roiHeader: {
    marginBottom: 14,
  },
  roiBadge: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  roiTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
  },
  roiDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  leadTabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  leadTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  leadTabActive: {
    backgroundColor: colors.primary,
  },
  leadTabText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  leadTabTextActive: {
    color: colors.textWhite,
    fontWeight: '900',
  },
  roiMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  roiMetricBox: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  roiMetricVal: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  roiMetricLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  roiNote: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    fontStyle: 'italic',
  },
  faqSection: {
    marginBottom: 24,
  },
  faqSectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
    marginLeft: 4,
  },
  faqItem: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    paddingRight: 10,
  },
  faqToggle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  faqAnswer: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: 10,
  },
  supportCard: {
    backgroundColor: colors.secondary,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
  },
  supportIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  supportTitle: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  supportBody: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
  },
  supportBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  supportBtnText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '800',
  },
});
