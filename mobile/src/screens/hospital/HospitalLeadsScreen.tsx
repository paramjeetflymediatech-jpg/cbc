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
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { HospitalLeadItem } from '../../types/hospital';

interface HospitalLeadsScreenProps {
  navigation: any;
  route?: any;
}

const STATUS_FILTERS = ['ALL', 'NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'UNASSIGNED'];
const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'CANCELLED'];

export const HospitalLeadsScreen: React.FC<HospitalLeadsScreenProps> = ({ navigation, route }) => {
  const initialFilter = route?.params?.filter || 'ALL';
  const [leads, setLeads] = useState<HospitalLeadItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter);

  // Status Change Modal State
  const [selectedLead, setSelectedLead] = useState<HospitalLeadItem | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await api.get('/hospital/leads');
      if (res.data && Array.isArray(res.data.leads)) {
        setLeads(res.data.leads);
      }
    } catch (err) {
      console.log('Error fetching hospital leads:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  const handleCall = (phone: string) => {
    if (!phone || phone.includes('XXXX')) {
      Alert.alert('Contact Masked', 'Purchase a lead package to unlock patient contact details.');
      return;
    }
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call.');
    });
  };

  const handleEmail = (email: string) => {
    if (!email || email.includes('***')) {
      Alert.alert('Contact Masked', 'Purchase a lead package to unlock patient email address.');
      return;
    }
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to open mail client.');
    });
  };

  const openStatusModal = (lead: HospitalLeadItem) => {
    if (lead.status === 'UNASSIGNED' || lead.status === 'EXPIRED') {
      Alert.alert('Lead Locked', 'Cannot update status of a locked or expired lead.');
      return;
    }
    setSelectedLead(lead);
    setModalVisible(true);
  };

  const updateLeadStatus = async (newStatus: string) => {
    if (!selectedLead) return;
    try {
      setUpdating(true);
      const res = await api.put('/hospital/leads', {
        leadId: selectedLead.id,
        status: newStatus,
      });
      if (res.data?.lead) {
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedLead.id ? { ...l, status: newStatus as any } : l))
        );
        setModalVisible(false);
        setSelectedLead(null);
      }
    } catch (err: any) {
      Alert.alert('Update Failed', err?.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  // Filter and Search logic
  const filteredLeads = leads.filter((lead) => {
    const matchStatus = selectedStatus === 'ALL' || lead.status === selectedStatus;
    const query = search.toLowerCase().trim();
    const matchQuery =
      !query ||
      lead.patientName?.toLowerCase().includes(query) ||
      lead.phone?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.service?.name?.toLowerCase().includes(query);

    return matchStatus && matchQuery;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return { bg: '#FFE4E6', text: '#BE123C' };
      case 'CONTACTED': return { bg: '#EFF6FF', text: '#1D4ED8' };
      case 'IN_PROGRESS': return { bg: '#FEF3C7', text: '#B45309' };
      case 'CONVERTED': return { bg: '#DCFCE7', text: '#15803D' };
      case 'UNASSIGNED': return { bg: '#F3E8FF', text: '#7E22CE' };
      case 'EXPIRED': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Leads</Text>
        <View style={styles.leadCountBadge}>
          <Text style={styles.leadCountText}>{filteredLeads.length}</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient name, phone, service..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Status Filter Scroll */}
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

      {/* Leads List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading patient inquiries...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {filteredLeads.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📥</Text>
              <Text style={styles.emptyTitle}>No patient inquiries found</Text>
              <Text style={styles.emptySub}>
                {search || selectedStatus !== 'ALL'
                  ? 'Try changing your search keywords or filter.'
                  : 'New patient consultation requests will appear here.'}
              </Text>
            </View>
          ) : (
            filteredLeads.map((lead) => {
              const statusStyle = getStatusColor(lead.status);
              const isLocked = lead.status === 'UNASSIGNED' || lead.status === 'EXPIRED';

              return (
                <View key={lead.id} style={styles.leadCard}>
                  {/* Top Bar */}
                  <View style={styles.cardTop}>
                    <View style={styles.patientMeta}>
                      <Text style={styles.patientName}>{lead.patientName}</Text>
                      <Text style={styles.serviceTag}>
                        🩺 {lead.service?.name || 'General Consultation'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
                      onPress={() => openStatusModal(lead)}
                    >
                      <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                        {lead.status} ▼
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Message / Treatment Detail */}
                  {lead.message ? (
                    <View style={styles.messageBox}>
                      <Text style={styles.messageText}>{lead.message}</Text>
                    </View>
                  ) : null}

                  {/* Contact & Meta Details */}
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Phone:</Text>
                      <Text style={styles.detailVal}>{lead.phone || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Email:</Text>
                      <Text style={styles.detailVal}>{lead.email || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Time:</Text>
                      <Text style={styles.detailVal}>{lead.preferredContactTime || 'Anytime'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Received:</Text>
                      <Text style={styles.detailVal}>
                        {new Date(lead.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.callBtn, isLocked && { opacity: 0.5 }]}
                      onPress={() => handleCall(lead.phone)}
                    >
                      <Text style={styles.callBtnText}>📞 Call Patient</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.emailBtn, isLocked && { opacity: 0.5 }]}
                      onPress={() => handleEmail(lead.email)}
                    >
                      <Text style={styles.emailBtnText}>✉️ Email</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.statusBtn, isLocked && { opacity: 0.5 }]}
                      onPress={() => openStatusModal(lead)}
                    >
                      <Text style={styles.statusBtnText}>Status ⚙️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Status Picker Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Lead Status</Text>
            <Text style={styles.modalSub}>
              Change status for {selectedLead?.patientName}:
            </Text>

            <View style={styles.modalOptions}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.modalOptionBtn,
                    selectedLead?.status === opt && styles.modalOptionBtnActive,
                  ]}
                  onPress={() => updateLeadStatus(opt)}
                  disabled={updating}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedLead?.status === opt && styles.modalOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                  {selectedLead?.status === opt && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            {updating && <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setModalVisible(false)}
              disabled={updating}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  leadCountBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leadCountText: {
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  patientMeta: {
    flex: 1,
    marginRight: 10,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  serviceTag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  messageBox: {
    backgroundColor: colors.surfaceSecondary,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  messageText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  detailsGrid: {
    gap: 4,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    width: 65,
  },
  detailVal: {
    fontSize: 12,
    color: colors.textPrimary,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  emailBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  emailBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  statusBtn: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 50,
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
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
  },
  modalOptions: {
    gap: 8,
  },
  modalOptionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalOptionBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalOptionTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  modalCloseBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
  },
});
