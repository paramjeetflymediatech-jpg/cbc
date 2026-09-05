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
import { AdminDashboardData } from '../../types/admin';

interface AdminDashboardScreenProps {
  navigation: any;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.log('Error fetching admin dashboard stats:', err);
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
        <Text style={styles.loadingText}>Loading Admin Control Center...</Text>
      </SafeAreaView>
    );
  }

  const stats = data?.stats || {
    totalHospitals: 0,
    pendingHospitals: 0,
    approvedHospitals: 0,
    totalLeads: 0,
    totalRevenue: 0,
    activePackagesCount: 0,
    activeServicesCount: 0,
  };

  const recentLeads = data?.recentLeads || [];
  const recentPayments = data?.recentPayments || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Super Admin Center</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Banner */}
        <View style={styles.adminBanner}>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>🛡️ MASTER ADMIN</Text>
          </View>
          <Text style={styles.adminBannerTitle}>Clinic By Choice Platform</Text>
          <Text style={styles.adminBannerSub}>
            Manage clinic partnerships, lead allocations, user security, and verified revenue.
          </Text>
        </View>

        {/* Pending Approvals Warning */}
        {stats.pendingHospitals > 0 && (
          <View style={styles.pendingAlert}>
            <Text style={styles.alertIcon}>⏳</Text>
            <View style={styles.alertTextCol}>
              <Text style={styles.alertTitle}>
                {stats.pendingHospitals} Pending Hospital Registration(s)
              </Text>
              <Text style={styles.alertDesc}>
                Review new clinic onboarding applications to grant dashboard access.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => navigation.navigate('AdminHospitals', { filter: 'PENDING' })}
            >
              <Text style={styles.reviewBtnText}>Review</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          {/* Revenue */}
          <View style={[styles.kpiCard, { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }]}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Total Revenue</Text>
              <Text style={styles.kpiIcon}>💰</Text>
            </View>
            <Text style={[styles.kpiValue, { color: '#15803D' }]}>
              ₹{Number(stats.totalRevenue).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.kpiFooter}>Verified PhonePe Sales</Text>
          </View>

          {/* Hospitals */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('AdminHospitals')}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Total Hospitals</Text>
              <Text style={styles.kpiIcon}>🏥</Text>
            </View>
            <Text style={styles.kpiValue}>{stats.totalHospitals}</Text>
            <Text style={[styles.kpiFooter, { color: colors.primary }]}>
              {stats.pendingHospitals} Pending Review
            </Text>
          </TouchableOpacity>

          {/* Total Leads */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('AdminLeads')}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Total Leads</Text>
              <Text style={styles.kpiIcon}>📋</Text>
            </View>
            <Text style={styles.kpiValue}>{stats.totalLeads}</Text>
            <Text style={styles.kpiFooter}>Delivered Inquiries</Text>
          </TouchableOpacity>

          {/* Medical Specialties */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('AdminServices')}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Specialties</Text>
              <Text style={styles.kpiIcon}>🩺</Text>
            </View>
            <Text style={styles.kpiValue}>{stats.activeServicesCount}</Text>
            <Text style={styles.kpiFooter}>Active Specialties</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Navigation Hub */}
        <Text style={styles.sectionHeading}>Platform Management</Text>
        <View style={styles.navGrid}>
          <TouchableOpacity
            style={styles.navTile}
            onPress={() => navigation.navigate('AdminHospitals')}
          >
            <View style={[styles.navIconBox, { backgroundColor: '#FDF2F8' }]}>
              <Text style={styles.navIcon}>🏥</Text>
            </View>
            <Text style={styles.navTitle}>Hospitals</Text>
            <Text style={styles.navSub}>Approvals & credits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTile}
            onPress={() => navigation.navigate('AdminLeads')}
          >
            <View style={[styles.navIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Text style={styles.navIcon}>📋</Text>
            </View>
            <Text style={styles.navTitle}>Platform Leads</Text>
            <Text style={styles.navSub}>All enquiries stream</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTile}
            onPress={() => navigation.navigate('AdminUsers')}
          >
            <View style={[styles.navIconBox, { backgroundColor: '#F5F3FF' }]}>
              <Text style={styles.navIcon}>👥</Text>
            </View>
            <Text style={styles.navTitle}>User Directory</Text>
            <Text style={styles.navSub}>Roles & status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTile}
            onPress={() => navigation.navigate('AdminServices')}
          >
            <View style={[styles.navIconBox, { backgroundColor: '#F0FDF4' }]}>
              <Text style={styles.navIcon}>🩺</Text>
            </View>
            <Text style={styles.navTitle}>Specialties</Text>
            <Text style={styles.navSub}>Departments & tiers</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Enquiries Stream */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Platform Leads</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AdminLeads')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {recentLeads.length === 0 ? (
            <Text style={styles.emptyText}>No leads recorded yet.</Text>
          ) : (
            recentLeads.map((lead) => (
              <View key={lead.id} style={styles.leadRow}>
                <View style={styles.leadLeft}>
                  <Text style={styles.leadPatient}>{lead.patientName}</Text>
                  <Text style={styles.leadMeta}>
                    {lead.hospital?.name || 'Unassigned'} • {lead.service?.name || 'General'}
                  </Text>
                </View>
                <View style={styles.leadRight}>
                  <Text style={styles.leadDate}>
                    {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.leadStatus}>{lead.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent Payments Stream */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Package Purchases</Text>
          </View>

          {recentPayments.length === 0 ? (
            <Text style={styles.emptyText}>No package purchases recorded yet.</Text>
          ) : (
            recentPayments.map((p) => (
              <View key={p.id} style={styles.leadRow}>
                <View style={styles.leadLeft}>
                  <Text style={styles.leadPatient}>{p.hospital?.name || 'Hospital Partner'}</Text>
                  <Text style={[styles.leadMeta, { color: '#15803D', fontWeight: '800' }]}>
                    ₹{Number(p.amount).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.leadRight}>
                  <View style={styles.paymentSuccessPill}>
                    <Text style={styles.paymentSuccessText}>{p.status}</Text>
                  </View>
                </View>
              </View>
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
  refreshBtn: {
    padding: 6,
  },
  refreshIcon: {
    fontSize: 18,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  adminBanner: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
  },
  adminBadge: {
    backgroundColor: 'rgba(253, 29, 116, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  adminBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  adminBannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textWhite,
    marginBottom: 4,
  },
  adminBannerSub: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
  },
  pendingAlert: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
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
  alertTextCol: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  alertDesc: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  reviewBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewBtnText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '800',
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
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  kpiIcon: {
    fontSize: 16,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  kpiFooter: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
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
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  navTile: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  navIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  navIcon: {
    fontSize: 20,
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  navSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  leadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  leadLeft: {
    flex: 1,
    marginRight: 10,
  },
  leadPatient: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  leadMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  leadRight: {
    alignItems: 'flex-end',
  },
  leadDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  leadStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 14,
  },
  paymentSuccessPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paymentSuccessText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
});
