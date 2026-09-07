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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useSweetAlert } from '../../context/SweetAlertContext';
import { HospitalLeadItem } from '../../types/hospital';

const STATUS_OPTIONS: Array<{ key: HospitalLeadItem['status']; label: string; bg: string; text: string; border: string }> = [
  { key: 'NEW', label: 'New Lead', bg: '#FFE4E6', text: '#BE123C', border: '#FDA4AF' },
  { key: 'CONTACTED', label: 'Contacted', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  { key: 'IN_PROGRESS', label: 'In Progress', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  { key: 'CONVERTED', label: 'Converted', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  { key: 'CANCELLED', label: 'Cancelled', bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
];

export const HospitalLeadDetailScreen: React.FC<any> = ({ route, navigation }) => {
  const { leadId, initialLead } = route?.params || {};
  const { showAlert } = useSweetAlert();

  const [lead, setLead] = useState<HospitalLeadItem | null>(initialLead || null);
  const [loading, setLoading] = useState<boolean>(!initialLead);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);

  // Notes state
  const [noteText, setNoteText] = useState<string>('');
  const [addingNote, setAddingNote] = useState<boolean>(false);

  const fetchLeadDetails = useCallback(async () => {
    if (!leadId) return;
    try {
      const res = await api.get('/hospital/leads');
      if (res.data && Array.isArray(res.data.leads)) {
        const found = res.data.leads.find((l: HospitalLeadItem) => String(l.id) === String(leadId));
        if (found) {
          setLead(found);
        }
      }
    } catch (err) {
      console.log('Error fetching lead detail:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeadDetails();
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!lead) return;
    if (lead.status === 'UNASSIGNED' || lead.status === 'EXPIRED') {
      showAlert({
        title: 'Lead Locked',
        message: 'Cannot update status of a locked or expired lead.',
        type: 'warning',
      });
      return;
    }

    try {
      setStatusUpdating(true);
      const res = await api.put('/hospital/leads', {
        leadId: lead.id,
        status: newStatus,
      });
      if (res.data?.lead) {
        setLead((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        showAlert({
          title: 'Status Updated',
          message: `Lead status changed to ${newStatus}.`,
          type: 'success',
        });
      }
    } catch (err: any) {
      showAlert({
        title: 'Update Failed',
        message: err?.response?.data?.error || 'Failed to update lead status.',
        type: 'error',
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!lead || !noteText.trim()) {
      showAlert({
        title: 'Required',
        message: 'Please write a note before submitting.',
        type: 'warning',
      });
      return;
    }

    try {
      setAddingNote(true);
      const res = await api.post(`/hospital/leads/${lead.id}/notes`, {
        content: noteText.trim(),
      });

      if (res.data?.notes) {
        setLead((prev) => (prev ? { ...prev, notes: res.data.notes } : null));
        setNoteText('');
        showAlert({
          title: 'Note Added',
          message: 'Follow-up note logged successfully.',
          type: 'success',
        });
      }
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err?.response?.data?.error || 'Failed to add follow-up note.',
        type: 'error',
      });
    } finally {
      setAddingNote(false);
    }
  };

  const handleCall = () => {
    if (!lead?.phone || lead.phone.includes('XXXX')) {
      showAlert({
        title: 'Contact Masked',
        message: 'Purchase a lead package to unlock full patient phone number.',
        type: 'warning',
      });
      return;
    }
    Linking.openURL(`tel:${lead.phone.replace(/[^0-9+]/g, '')}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call.');
    });
  };

  const handleWhatsApp = () => {
    if (!lead?.phone || lead.phone.includes('XXXX')) {
      showAlert({
        title: 'Contact Masked',
        message: 'Purchase a lead package to unlock WhatsApp chat.',
        type: 'warning',
      });
      return;
    }
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const serviceName = lead.service?.name ? `for ${lead.service.name}` : '';
    const message = encodeURIComponent(
      `Hello ${lead.patientName}, this is regarding your consultation inquiry ${serviceName} on ClinicByChoice. How may we assist you today?`
    );
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp.');
    });
  };

  const handleEmail = () => {
    if (!lead?.email || lead.email.includes('***')) {
      showAlert({
        title: 'Contact Masked',
        message: 'Purchase a lead package to unlock full patient email.',
        type: 'warning',
      });
      return;
    }
    const subject = encodeURIComponent(`Consultation Inquiry - ${lead.service?.name || 'ClinicByChoice'}`);
    Linking.openURL(`mailto:${lead.email}?subject=${subject}`).catch(() => {
      Alert.alert('Error', 'Unable to open email client.');
    });
  };

  const isLocked = lead?.status === 'UNASSIGNED' || lead?.status === 'EXPIRED';

  const notesList = Array.isArray(lead?.notes) ? lead.notes : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Lead #{lead?.id || leadId}
        </Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading lead history...</Text>
        </View>
      ) : !lead ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>Lead Record Not Found</Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backHomeBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          >
            {/* Patient Overview Card */}
            <View style={styles.patientCard}>
              <View style={styles.patientTopRow}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>
                    {lead.patientName ? lead.patientName.charAt(0).toUpperCase() : 'P'}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.patientName}>{lead.patientName}</Text>
                  <Text style={styles.serviceName}>
                    🩺 {lead.service?.name || 'General Consultation'}
                  </Text>
                  <Text style={styles.cityLocation}>
                    📍 {lead.city || 'Location not specified'}
                  </Text>
                </View>
              </View>

              {/* Quick Contact Action Bar */}
              <View style={styles.contactBar}>
                <TouchableOpacity
                  style={[styles.contactBtn, styles.callBtn, isLocked && styles.contactBtnDisabled]}
                  onPress={handleCall}
                >
                  <Text style={styles.contactBtnIcon}>📞</Text>
                  <Text style={styles.callBtnText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.contactBtn, styles.whatsappBtn, isLocked && styles.contactBtnDisabled]}
                  onPress={handleWhatsApp}
                >
                  <Text style={styles.contactBtnIcon}>💬</Text>
                  <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.contactBtn, styles.emailBtn, isLocked && styles.contactBtnDisabled]}
                  onPress={handleEmail}
                >
                  <Text style={styles.contactBtnIcon}>✉️</Text>
                  <Text style={styles.emailBtnText}>Email</Text>
                </TouchableOpacity>
              </View>

              {/* Contact Details List */}
              <View style={styles.contactInfoList}>
                <View style={styles.contactInfoRow}>
                  <Text style={styles.contactInfoLabel}>Phone Number</Text>
                  <Text style={styles.contactInfoValue}>{lead.phone || 'N/A'}</Text>
                </View>
                <View style={styles.contactInfoRow}>
                  <Text style={styles.contactInfoLabel}>Email Address</Text>
                  <Text style={styles.contactInfoValue}>{lead.email || 'N/A'}</Text>
                </View>
                {lead.preferredContactTime ? (
                  <View style={styles.contactInfoRow}>
                    <Text style={styles.contactInfoLabel}>Preferred Time</Text>
                    <Text style={styles.contactInfoValue}>⏱️ {lead.preferredContactTime}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Status Transition History Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Current Lead Status</Text>
                {statusUpdating && <ActivityIndicator size="small" color={colors.primary} />}
              </View>

              <Text style={styles.sectionSubtitle}>
                Tap to update the progress stage of this patient lead:
              </Text>

              <View style={styles.statusChipsGrid}>
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected = lead.status === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.statusChip,
                        { backgroundColor: isSelected ? opt.bg : '#F8FAFC', borderColor: isSelected ? opt.text : opt.border },
                        isSelected && styles.statusChipSelected,
                      ]}
                      onPress={() => handleUpdateStatus(opt.key)}
                      disabled={statusUpdating || isLocked}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: isSelected ? opt.text : '#475569' },
                          isSelected && { fontWeight: '900' },
                        ]}
                      >
                        {isSelected ? '✓ ' : ''}{opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Patient Message / Medical Symptoms */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>📝 Patient Medical Request</Text>
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>
                  {lead.message || 'No additional message or symptoms provided.'}
                </Text>
              </View>
            </View>

            {/* Lead Deduction & History Audit */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>⚡ Lead Credit & Delivery Audit</Text>
              <View style={styles.auditGrid}>
                <View style={styles.auditItem}>
                  <Text style={styles.auditLabel}>INQUIRY RECEIVED</Text>
                  <Text style={styles.auditValue}>
                    {new Date(lead.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <View style={styles.auditItem}>
                  <Text style={styles.auditLabel}>CREDIT DEDUCTION</Text>
                  <Text style={[styles.auditValue, { color: '#059669' }]}>
                    -1 Lead Credit Deducted
                  </Text>
                </View>

                <View style={styles.auditItem}>
                  <Text style={styles.auditLabel}>DELIVERY CHANNEL</Text>
                  <Text style={styles.auditValue}>Mobile App + Portal Push</Text>
                </View>

                <View style={styles.auditItem}>
                  <Text style={styles.auditLabel}>STATUS STAGE</Text>
                  <Text style={[styles.auditValue, { color: colors.primary }]}>
                    {lead.status}
                  </Text>
                </View>
              </View>
            </View>

            {/* Follow-up Notes History */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>
                  📋 Follow-up Notes & Remarks ({notesList.length})
                </Text>
              </View>

              {/* Add Note Input Box */}
              {!isLocked && (
                <View style={styles.addNoteBox}>
                  <TextInput
                    style={styles.noteInput}
                    value={noteText}
                    onChangeText={setNoteText}
                    placeholder="Log patient consultation remarks, doctor assigned, or appointment date..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.saveNoteBtn, addingNote && { opacity: 0.6 }]}
                    onPress={handleAddNote}
                    disabled={addingNote}
                  >
                    {addingNote ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.saveNoteBtnText}>+ Add Note</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Notes Timeline List */}
              {notesList.length === 0 ? (
                <View style={styles.emptyNotesBox}>
                  <Text style={styles.emptyNotesEmoji}>🗒️</Text>
                  <Text style={styles.emptyNotesText}>
                    No follow-up notes recorded yet. Add internal remarks to keep your team aligned.
                  </Text>
                </View>
              ) : (
                <View style={styles.timelineList}>
                  {notesList.map((n, idx) => (
                    <View key={idx} style={styles.timelineItem}>
                      <View style={styles.timelineDot} />
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                          <Text style={styles.timelineAuthor}>
                            👤 {n.author || 'Hospital Staff'}
                          </Text>
                          <Text style={styles.timelineTime}>
                            {n.createdAt
                              ? new Date(n.createdAt).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Recent'}
                          </Text>
                        </View>
                        <Text style={styles.timelineNoteText}>{n.content}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  refreshBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
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
  patientCard: {
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
  patientTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FBCFE8',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  cityLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactBar: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 12,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 5,
  },
  contactBtnIcon: {
    fontSize: 14,
  },
  contactBtnDisabled: {
    opacity: 0.4,
  },
  callBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  whatsappBtn: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  whatsappBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  emailBtn: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#D8B4FE',
  },
  emailBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7E22CE',
  },
  contactInfoList: {
    gap: 8,
  },
  contactInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  contactInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  contactInfoValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
  },
  statusChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusChipSelected: {
    borderWidth: 1.5,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  messageBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  auditGrid: {
    gap: 8,
    marginTop: 8,
  },
  auditItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  auditLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
  },
  auditValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  addNoteBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    marginBottom: 12,
  },
  noteInput: {
    fontSize: 13,
    color: colors.textPrimary,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  saveNoteBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  saveNoteBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyNotesBox: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 4,
  },
  emptyNotesEmoji: {
    fontSize: 26,
  },
  emptyNotesText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
  },
  timelineList: {
    gap: 10,
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 10,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineAuthor: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  timelineTime: {
    fontSize: 10,
    color: colors.textMuted,
  },
  timelineNoteText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
  },
});
