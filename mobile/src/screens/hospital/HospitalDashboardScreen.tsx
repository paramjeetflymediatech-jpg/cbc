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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { HospitalProfileData, HospitalLeadItem } from '../../types/hospital';

interface HospitalDashboardScreenProps {
  navigation: any;
}

export const HospitalDashboardScreen: React.FC<HospitalDashboardScreenProps> = ({ navigation }) => {
  const [hospital, setHospital] = useState<HospitalProfileData | null>(null);
  const [leads, setLeads] = useState<HospitalLeadItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      const [profRes, leadsRes] = await Promise.all([
        api.get('/hospital/profile').catch(() => ({ data: null })),
        api.get('/hospital/leads').catch(() => ({ data: null })),
      ]);

      if (profRes?.data?.hospital) {
        setHospital(profRes.data.hospital);
      }
      if (leadsRes?.data?.leads) {
        setLeads(leadsRes.data.leads);
      }
    } catch (err) {
      console.log('Error loading hospital dashboard data:', err);
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Hospital Dashboard...</Text>
      </SafeAreaView>
    );
  }

  const remaining = hospital?.leadsRemaining || 0;
  const purchased = hospital?.totalLeadsPurchased || 0;
  const used = hospital?.totalLeadsUsed || 0;
  const percentageUsed = purchased > 0 ? Math.min(100, Math.round((used / purchased) * 100)) : 0;
  const isLowBalance = remaining <= 3;
  const newLeadsCount = leads.filter((l) => l.status === 'NEW').length;
  const convertedCount = leads.filter((l) => l.status === 'CONVERTED').length;
  const doctorsCount = hospital?.doctors?.length || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hospital Portal</Text>
        <TouchableOpacity
          style={styles.refreshIconBtn}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Welcome Hospital Banner */}
        <View style={styles.welcomeBanner}>
          <View style={styles.badgeRow}>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>HOSPITAL PARTNER</Text>
            </View>
            <View style={[styles.statusBadge, hospital?.status === 'APPROVED' ? styles.statusApproved : styles.statusPending]}>
              <Text style={styles.statusText}>{hospital?.status || 'ACTIVE'}</Text>
            </View>
          </View>
          <Text style={styles.hospitalName}>{hospital?.name || 'My Hospital Partner'}</Text>
          <Text style={styles.hospitalCity}>📍 {hospital?.city || 'India'} {hospital?.state ? `• ${hospital?.state}` : ''}</Text>
        </View>

        {/* Low Balance / Exhausted Warning Banner */}
        {isLowBalance && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {remaining === 0 ? 'Lead Balance Exhausted!' : 'Low Lead Balance!'}
              </Text>
              <Text style={styles.alertDesc}>
                {remaining === 0
                  ? 'All patient lead credits have been used. Top up package to receive new enquiries.'
                  : `You have ${remaining} lead credit(s) left.`}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.alertBtn}
              onPress={() => navigation.navigate('HospitalPackages')}
            >
              <Text style={styles.alertBtnText}>Top Up</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lead Meter Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Enquiry Lead Balance</Text>
            <View style={styles.balanceBadge}>
              <Text style={styles.balanceBadgeText}>{remaining} Available</Text>
            </View>
          </View>

          <View style={styles.meterContainer}>
            <View style={styles.meterBarBackground}>
              <View style={[styles.meterBarFill, { width: `${percentageUsed}%` }]} />
            </View>
            <View style={styles.meterLabels}>
              <Text style={styles.meterLabelText}>Used: {used} Leads</Text>
              <Text style={styles.meterLabelText}>Total Purchased: {purchased}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.rechargeBtn}
            onPress={() => navigation.navigate('HospitalPackages')}
          >
            <Text style={styles.rechargeBtnText}>+ Purchase Lead Package</Text>
          </TouchableOpacity>
        </View>

        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('HospitalLeads')}
          >
            <Text style={styles.kpiIcon}>📥</Text>
            <Text style={styles.kpiValue}>{leads.length}</Text>
            <Text style={styles.kpiLabel}>Total Leads</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, styles.kpiHighlight]}
            onPress={() => navigation.navigate('HospitalLeads', { filter: 'NEW' })}
          >
            <Text style={styles.kpiIcon}>🔔</Text>
            <Text style={[styles.kpiValue, { color: colors.primary }]}>{newLeadsCount}</Text>
            <Text style={styles.kpiLabel}>New Uncontacted</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('HospitalLeads', { filter: 'CONVERTED' })}
          >
            <Text style={styles.kpiIcon}>✅</Text>
            <Text style={[styles.kpiValue, { color: colors.success }]}>{convertedCount}</Text>
            <Text style={styles.kpiLabel}>Converted</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('HospitalDoctors')}
          >
            <Text style={styles.kpiIcon}>👨‍⚕️</Text>
            <Text style={styles.kpiValue}>{doctorsCount}</Text>
            <Text style={styles.kpiLabel}>Specialists</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Management Actions */}
        <Text style={styles.sectionHeading}>Management Hub</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => navigation.navigate('HospitalLeads')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Text style={styles.actionIcon}>📋</Text>
            </View>
            <Text style={styles.actionTitle}>Patient Leads</Text>
            <Text style={styles.actionSubtitle}>Call & update status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => navigation.navigate('HospitalDoctors')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FDF2F8' }]}>
              <Text style={styles.actionIcon}>👨‍⚕️</Text>
            </View>
            <Text style={styles.actionTitle}>Doctors</Text>
            <Text style={styles.actionSubtitle}>Add & edit profiles</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => navigation.navigate('HospitalServices')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#F0FDF4' }]}>
              <Text style={styles.actionIcon}>🩺</Text>
            </View>
            <Text style={styles.actionTitle}>Services</Text>
            <Text style={styles.actionSubtitle}>Offerings & pricing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => navigation.navigate('HospitalProfile')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FAF5FF' }]}>
              <Text style={styles.actionIcon}>🏥</Text>
            </View>
            <Text style={styles.actionTitle}>Hospital Info</Text>
            <Text style={styles.actionSubtitle}>Address & facilities</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Patient Leads preview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Patient Enquiries</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HospitalLeads')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {leads.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No patient enquiries received yet.</Text>
            </View>
          ) : (
            leads.slice(0, 4).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.leadRow}
                onPress={() => navigation.navigate('HospitalLeads')}
              >
                <View style={styles.leadInfo}>
                  <Text style={styles.leadName}>{item.patientName}</Text>
                  <Text style={styles.leadService}>{item.service?.name || 'General Healthcare'}</Text>
                </View>
                <View style={styles.leadRight}>
                  <View style={[
                    styles.leadStatusPill,
                    item.status === 'NEW' ? styles.pillNew :
                    item.status === 'CONVERTED' ? styles.pillConverted : styles.pillOther
                  ]}>
                    <Text style={styles.leadStatusText}>{item.status}</Text>
                  </View>
                  <Text style={styles.leadDate}>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
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
    paddingVertical: 6,
    paddingHorizontal: 8,
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
  refreshIconBtn: {
    padding: 6,
  },
  refreshIcon: {
    fontSize: 18,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  welcomeBanner: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleTag: {
    backgroundColor: 'rgba(253, 29, 116, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleTagText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusText: {
    color: colors.textWhite,
    fontSize: 11,
    fontWeight: '800',
  },
  hospitalName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textWhite,
    marginBottom: 4,
  },
  hospitalCity: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  alertBanner: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.error,
  },
  alertDesc: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2,
  },
  alertBtn: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alertBtnText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  balanceBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  balanceBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  meterContainer: {
    marginBottom: 14,
  },
  meterBarBackground: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  meterBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meterLabelText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rechargeBtn: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  rechargeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  kpiHighlight: {
    borderColor: 'rgba(253, 29, 116, 0.3)',
    backgroundColor: '#FFF9FB',
  },
  kpiIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  actionTile: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  actionSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  viewAllText: {
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
  leadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  leadInfo: {
    flex: 1,
    marginRight: 10,
  },
  leadName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  leadService: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  leadRight: {
    alignItems: 'flex-end',
  },
  leadStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  pillNew: {
    backgroundColor: '#FFE4E6',
  },
  pillConverted: {
    backgroundColor: '#DCFCE7',
  },
  pillOther: {
    backgroundColor: '#F1F5F9',
  },
  leadStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  leadDate: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
