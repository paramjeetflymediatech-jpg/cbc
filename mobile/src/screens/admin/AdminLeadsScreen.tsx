import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';

interface AdminLeadsScreenProps {
  navigation: any;
  route?: any;
}

const STATUS_FILTERS = ['ALL', 'NEW', 'UNASSIGNED', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'EXPIRED'];

export const AdminLeadsScreen: React.FC<AdminLeadsScreenProps> = ({ navigation, route }) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [hospitalFilter, setHospitalFilter] = useState<{ id?: number | string; name?: string } | null>(
    route?.params?.hospitalId || route?.params?.hospitalName
      ? { id: route.params.hospitalId, name: route.params.hospitalName }
      : null
  );

  const fetchLeads = useCallback(async () => {
    try {
      const res = await api.get('/admin/leads');
      if (res.data && Array.isArray(res.data.leads)) {
        setLeads(res.data.leads);
      }
    } catch (err) {
      console.log('Error fetching admin leads:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (route?.params?.hospitalId || route?.params?.hospitalName) {
      setHospitalFilter({
        id: route.params.hospitalId,
        name: route.params.hospitalName,
      });
    }
  }, [route?.params?.hospitalId, route?.params?.hospitalName]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  const handleCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`).catch(() => {});
  };

  const handleEmail = (email: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {});
  };

  const handleDelete = (lead: any) => {
    Alert.alert(
      'Delete Lead',
      `Permanently delete inquiry from "${lead.patientName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/leads?id=${lead.id}&type=lead`);
              fetchLeads();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to delete lead.');
            }
          },
        },
      ]
    );
  };

  const filtered = leads.filter((l) => {
    const matchHospital =
      !hospitalFilter ||
      (hospitalFilter.id && String(l.hospitalId) === String(hospitalFilter.id)) ||
      (hospitalFilter.name && l.hospital?.name?.toLowerCase().includes(hospitalFilter.name.toLowerCase()));

    const matchStatus = selectedStatus === 'ALL' || l.status === selectedStatus;
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      l.patientName?.toLowerCase().includes(q) ||
      l.phone?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.hospital?.name?.toLowerCase().includes(q) ||
      l.service?.name?.toLowerCase().includes(q);

    return matchHospital && matchStatus && matchSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {hospitalFilter?.name ? `${hospitalFilter.name} Leads` : 'All Platform Leads'}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filtered.length}</Text>
        </View>
      </View>

      {/* Active Hospital Filter Banner */}
      {hospitalFilter && (
        <View style={styles.filterBanner}>
          <Text style={styles.filterBannerText} numberOfLines={1}>
            🏥 Filtering leads for <Text style={{ fontWeight: '800' }}>{hospitalFilter.name || 'Selected Hospital'}</Text>
          </Text>
          <TouchableOpacity
            style={styles.clearFilterBtn}
            onPress={() => setHospitalFilter(null)}
          >
            <Text style={styles.clearFilterBtnText}>Show All ✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search leads by patient, clinic, specialty..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {STATUS_FILTERS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.filterPill, selectedStatus === s && styles.filterPillActive]}
              onPress={() => setSelectedStatus(s)}
            >
              <Text style={[styles.filterPillText, selectedStatus === s && styles.filterPillTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading all platform leads...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No leads found</Text>
              <Text style={styles.emptySub}>No inquiries match your current filters.</Text>
            </View>
          ) : (
            filtered.map((lead) => (
              <TouchableOpacity
                key={lead.id}
                style={styles.leadCard}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('AdminLeadDetail', { leadId: lead.id, lead })}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.patientCol}>
                    <Text style={styles.patientName}>{lead.patientName}</Text>
                    <Text style={styles.serviceName}>🩺 {lead.service?.name || 'General Inquiry'}</Text>
                    <Text style={styles.hospitalName}>🏥 {lead.hospital?.name || 'Unassigned Provider'}</Text>
                  </View>

                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{lead.status}</Text>
                  </View>
                </View>

                {lead.message ? (
                  <View style={styles.messageBox}>
                    <Text style={styles.messageText} numberOfLines={2}>
                      {lead.message}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.contactDetails}>
                  <Text style={styles.contactText}>📞 {lead.phone || 'N/A'}</Text>
                  <Text style={styles.contactText}>✉️ {lead.email || 'N/A'}</Text>
                  <Text style={styles.dateText}>
                    🕒 {new Date(lead.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.viewBtn]}
                    onPress={() => navigation.navigate('AdminLeadDetail', { leadId: lead.id, lead })}
                  >
                    <Text style={styles.viewBtnText}>👁️ View Info</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.callBtn]}
                    onPress={() => handleCall(lead.phone)}
                  >
                    <Text style={styles.callBtnText}>📞 Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.emailBtn]}
                    onPress={() => handleEmail(lead.email)}
                  >
                    <Text style={styles.emailBtnText}>✉️ Email</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(lead)}
                  >
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
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
  countBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: colors.surface,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.textMuted,
    padding: 4,
  },
  filtersContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingBottom: 10,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.textWhite,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  leadCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  patientCol: {
    flex: 1,
    marginRight: 10,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  hospitalName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  messageBox: {
    backgroundColor: colors.surfaceSecondary,
    padding: 10,
    borderRadius: 10,
    marginVertical: 8,
  },
  messageText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  contactDetails: {
    gap: 3,
    marginBottom: 10,
  },
  contactText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: 10,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewBtn: {
    flex: 1.1,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#DCFCE7',
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  emailBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  emailBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
  },
  deleteBtnText: {
    fontSize: 14,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  filterBanner: {
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterBannerText: {
    fontSize: 13,
    color: '#1E40AF',
    flex: 1,
    marginRight: 8,
  },
  clearFilterBtn: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  clearFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
});
