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
  Modal,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { AdminLeadDetailItem } from '../../types/admin';

interface AdminLeadDetailScreenProps {
  navigation?: any;
  route?: {
    params?: {
      leadId?: string | number;
      lead?: AdminLeadDetailItem;
    };
  };
}

const LEAD_STATUSES = [
  { key: 'NEW', label: 'New Inquiry', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { key: 'CONTACTED', label: 'Contacted', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' },
  { key: 'CONVERTED', label: 'Converted', color: '#10B981', bg: '#D1FAE5', border: '#A7F3D0' },
  { key: 'LOST', label: 'Lost', color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' },
  { key: 'UNASSIGNED', label: 'Unassigned', color: '#EC4899', bg: '#FCE7F3', border: '#FBCFE8' },
  { key: 'EXPIRED', label: 'Expired', color: '#EF4444', bg: '#FEE2E2', border: '#FECACA' },
] as const;

export const AdminLeadDetailScreen: React.FC<AdminLeadDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const leadId = route?.params?.leadId || route?.params?.lead?.id;

  const [lead, setLead] = useState<AdminLeadDetailItem | null>(route?.params?.lead || null);
  const [loading, setLoading] = useState<boolean>(!route?.params?.lead);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);

  // Note State
  const [noteText, setNoteText] = useState<string>('');
  const [addingNote, setAddingNote] = useState<boolean>(false);

  // Edit Lead Modal State
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editPatientName, setEditPatientName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editCity, setEditCity] = useState<string>('');
  const [editMessage, setEditMessage] = useState<string>('');
  const [editPreferredTime, setEditPreferredTime] = useState<string>('');

  const fetchLeadDetail = useCallback(async () => {
    if (!leadId) return;
    try {
      const res = await api.get(`/admin/leads/${leadId}`);
      if (res.data?.success && res.data.lead) {
        setLead(res.data.lead);
      }
    } catch (err: any) {
      console.log('Error fetching lead detail:', err);
      // If error, keep existing lead from route params if present
      if (!lead) {
        Alert.alert('Error', err?.response?.data?.error || 'Failed to load lead information.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLeadDetail();
  }, [fetchLeadDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeadDetail();
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!lead) return;
    try {
      setStatusUpdating(true);
      const res = await api.patch(`/admin/leads/${lead.id}`, { status: newStatus });
      if (res.data?.success && res.data.lead) {
        setLead(res.data.lead);
      } else {
        setLead((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
      Alert.alert('Status Updated', `Lead status changed to ${newStatus}.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update lead status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!lead || !noteText.trim()) {
      Alert.alert('Required', 'Please enter a note to save.');
      return;
    }

    try {
      setAddingNote(true);
      const res = await api.patch(`/admin/leads/${lead.id}`, { newNote: noteText.trim() });
      if (res.data?.success && res.data.lead) {
        setLead(res.data.lead);
        setNoteText('');
        Alert.alert('Note Saved', 'Follow-up note recorded successfully.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to add follow-up note.');
    } finally {
      setAddingNote(false);
    }
  };

  const handleOpenEditModal = () => {
    if (lead) {
      setEditPatientName(lead.patientName || '');
      setEditPhone(lead.phone || '');
      setEditEmail(lead.email || '');
      setEditCity(lead.city || '');
      setEditMessage(lead.message || '');
      setEditPreferredTime(lead.preferredContactTime || '');
    }
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!lead) return;
    if (!editPatientName.trim() || !editPhone.trim()) {
      Alert.alert('Validation Error', 'Patient Name and Phone Number are required.');
      return;
    }

    try {
      setSavingEdit(true);
      const res = await api.patch(`/admin/leads/${lead.id}`, {
        patientName: editPatientName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        city: editCity.trim(),
        message: editMessage.trim() || null,
        preferredContactTime: editPreferredTime.trim() || null,
      });

      if (res.data?.success && res.data.lead) {
        setLead(res.data.lead);
        setEditModalVisible(false);
        Alert.alert('Success', 'Lead details updated successfully.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update lead.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCall = (phone?: string) => {
    const p = phone || lead?.phone;
    if (!p) return;
    Linking.openURL(`tel:${p.replace(/[^0-9+]/g, '')}`).catch(() => {});
  };

  const handleWhatsApp = (phone?: string) => {
    const p = phone || lead?.phone;
    if (!p) return;
    const cleanPhone = p.replace(/[^0-9]/g, '');
    const formatted = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(
      `Hello ${lead?.patientName || 'there'}, greeting from Clinic By Choice regarding your inquiry for ${
        lead?.service?.name || 'medical care'
      }.`
    );
    Linking.openURL(`whatsapp://send?phone=${formatted}&text=${msg}`).catch(() => {
      Linking.openURL(`https://wa.me/${formatted}?text=${msg}`).catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp.');
      });
    });
  };

  const handleEmail = (email?: string) => {
    const e = email || lead?.email;
    if (!e) return;
    const subject = encodeURIComponent(
      `Clinic By Choice - Medical Inquiry for ${lead?.service?.name || 'Healthcare Service'}`
    );
    Linking.openURL(`mailto:${e}?subject=${subject}`).catch(() => {});
  };

  const handleDelete = () => {
    if (!lead) return;
    Alert.alert(
      'Delete Lead',
      `Permanently delete inquiry from "${lead.patientName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/leads?id=${lead.id}&type=lead`);
              Alert.alert('Deleted', 'Lead deleted successfully.');
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to delete lead.');
            }
          },
        },
      ]
    );
  };

  const currentStatusConfig =
    LEAD_STATUSES.find((s) => s.key === lead?.status) || LEAD_STATUSES[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Lead Information</Text>
          <Text style={styles.headerSub}>ID: #{lead ? String(lead.id).padStart(5, '0') : leadId}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <TouchableOpacity style={styles.headerEditBtn} onPress={handleOpenEditModal}>
            <Text style={styles.headerEditBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerDeleteBtn} onPress={handleDelete}>
            <Text style={styles.headerDeleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading lead details...</Text>
        </View>
      ) : lead ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {/* Hero Status Banner */}
          <View style={[styles.heroBanner, { backgroundColor: currentStatusConfig.bg, borderColor: currentStatusConfig.border }]}>
            <View style={styles.heroLeftCol}>
              <Text style={[styles.heroStatusLabel, { color: currentStatusConfig.color }]}>
                ● {currentStatusConfig.label}
              </Text>
              <Text style={styles.heroDateText}>
                Received {new Date(lead.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            <TouchableOpacity style={styles.editPencilBtn} onPress={handleOpenEditModal}>
              <Text style={styles.editPencilText}>✏️ Edit Details</Text>
            </TouchableOpacity>
          </View>

          {/* Patient Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {lead.patientName ? lead.patientName.charAt(0).toUpperCase() : '👤'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientNameTitle}>{lead.patientName}</Text>
                <Text style={styles.patientLocationSub}>
                  📍 {lead.city ? lead.city : 'Location not specified'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Quick Contact Rows */}
            <View style={styles.contactRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>Phone Number</Text>
                <Text style={styles.metaValue}>{lead.phone}</Text>
              </View>
              <View style={styles.quickActionRow}>
                <TouchableOpacity style={styles.contactIconBtn} onPress={() => handleCall(lead.phone)}>
                  <Text style={styles.contactIconText}>📞 Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contactIconBtn, { backgroundColor: '#DCFCE7' }]}
                  onPress={() => handleWhatsApp(lead.phone)}
                >
                  <Text style={[styles.contactIconText, { color: '#15803D' }]}>💬 WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.contactRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>Email Address</Text>
                <Text style={styles.metaValue} numberOfLines={1}>{lead.email || 'None'}</Text>
              </View>
              {lead.email ? (
                <TouchableOpacity style={styles.contactIconBtn} onPress={() => handleEmail(lead.email)}>
                  <Text style={styles.contactIconText}>✉️ Email</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {lead.preferredContactTime ? (
              <View style={styles.metaInfoBox}>
                <Text style={styles.metaLabel}>Preferred Callback Time</Text>
                <Text style={styles.metaValue}>🕒 {lead.preferredContactTime}</Text>
              </View>
            ) : null}
          </View>

          {/* Requested Treatment & Assigned Hospital Card */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>🏥 Healthcare Request Details</Text>

            {/* Specialty / Service */}
            <View style={styles.serviceItemBox}>
              <Text style={styles.serviceIconText}>{lead.service?.icon || '🩺'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceItemName}>
                  {lead.service?.name || 'General Medical Consultation'}
                </Text>
                {lead.service?.category ? (
                  <Text style={styles.serviceItemSub}>{lead.service.category}</Text>
                ) : null}
              </View>
            </View>

            {/* Hospital Partner */}
            <View style={styles.hospitalItemBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>Assigned Clinic / Hospital Partner</Text>
                <Text style={styles.hospitalItemName}>
                  {lead.hospital?.name || 'Unassigned / Platform Lead'}
                </Text>
                {lead.hospital ? (
                  <Text style={styles.hospitalItemAddress}>
                    📍 {lead.hospital.address ? `${lead.hospital.address}, ` : ''}{lead.hospital.city || ''}
                  </Text>
                ) : null}
              </View>
              {lead.hospital?.id ? (
                <TouchableOpacity
                  style={styles.viewHospBtn}
                  onPress={() =>
                    navigation.navigate('HospitalDetail', {
                      hospitalId: lead.hospital?.id,
                      id: lead.hospital?.id,
                      hospital: lead.hospital,
                    })
                  }
                >
                  <Text style={styles.viewHospBtnText}>View ↗</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Patient Inquiry Message */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>💬 Patient Inquiry Message</Text>
            <View style={styles.patientMessageBox}>
              <Text style={styles.patientMessageText}>
                {lead.message ? `"${lead.message}"` : 'No specific message entered by patient.'}
              </Text>
            </View>
          </View>

          {/* Change Status Card */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>⚡ Update Lead Status</Text>
            <Text style={styles.cardSubText}>
              Keep hospital partners and administration aligned on inquiry progress:
            </Text>

            <View style={styles.statusChipsGrid}>
              {LEAD_STATUSES.map((st) => {
                const isCurrent = lead.status === st.key;
                return (
                  <TouchableOpacity
                    key={st.key}
                    style={[
                      styles.statusChip,
                      { borderColor: st.border, backgroundColor: st.bg },
                      isCurrent && styles.statusChipActive,
                    ]}
                    onPress={() => handleUpdateStatus(st.key)}
                    disabled={statusUpdating}
                  >
                    <Text style={[styles.statusChipText, { color: st.color }, isCurrent && styles.statusChipTextActive]}>
                      {isCurrent ? '✓ ' : ''}{st.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Follow-up Notes & Timeline */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>📝 Follow-up Notes & Remarks</Text>
            <Text style={styles.cardSubText}>
              Record counseling notes, patient feedback, or quotes given:
            </Text>

            <View style={styles.noteInputRow}>
              <TextInput
                style={styles.noteInput}
                placeholder="Type follow-up remarks..."
                placeholderTextColor={colors.textMuted}
                value={noteText}
                onChangeText={setNoteText}
                multiline
              />
              <TouchableOpacity
                style={[styles.addNoteBtn, addingNote && { opacity: 0.6 }]}
                onPress={handleAddNote}
                disabled={addingNote}
              >
                <Text style={styles.addNoteBtnText}>
                  {addingNote ? '...' : 'Add Note +'}
                </Text>
              </TouchableOpacity>
            </View>

            {lead.notes && lead.notes.length > 0 ? (
              <View style={styles.notesList}>
                {lead.notes.map((n, idx) => (
                  <View key={idx} style={styles.noteCard}>
                    <View style={styles.noteHeader}>
                      <Text style={styles.noteAuthor}>👤 {n.author || 'Super Admin'}</Text>
                      <Text style={styles.noteDate}>
                        {new Date(n.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <Text style={styles.noteContent}>{n.content}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyNotesText}>No follow-up notes recorded yet.</Text>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Lead Not Found</Text>
          <Text style={styles.emptySub}>This lead may have been deleted or expired.</Text>
        </View>
      )}

      {/* EDIT LEAD MODAL */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} disabled={savingEdit}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Edit Lead Info</Text>
            <TouchableOpacity onPress={handleSaveEdit} disabled={savingEdit}>
              <Text style={[styles.modalDoneText, savingEdit && { opacity: 0.5 }]}>
                {savingEdit ? 'Saving...' : 'Save ✓'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.formLabel}>Patient Full Name *</Text>
            <TextInput
              style={styles.formInput}
              value={editPatientName}
              onChangeText={setEditPatientName}
              placeholder="e.g. Ramesh Kumar"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.formLabel}>Phone Number *</Text>
            <TextInput
              style={styles.formInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />

            <Text style={styles.formLabel}>Email Address</Text>
            <TextInput
              style={styles.formInput}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="e.g. patient@gmail.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.formLabel}>City / Location</Text>
            <TextInput
              style={styles.formInput}
              value={editCity}
              onChangeText={setEditCity}
              placeholder="e.g. Mumbai"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.formLabel}>Preferred Callback Time</Text>
            <TextInput
              style={styles.formInput}
              value={editPreferredTime}
              onChangeText={setEditPreferredTime}
              placeholder="e.g. Morning (10 AM - 1 PM)"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.formLabel}>Inquiry Message</Text>
            <TextInput
              style={[styles.formInput, { minHeight: 80 }]}
              value={editMessage}
              onChangeText={setEditMessage}
              placeholder="Enter patient medical requirement..."
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <TouchableOpacity
              style={[styles.saveSubmitBtn, savingEdit && { opacity: 0.6 }]}
              onPress={handleSaveEdit}
              disabled={savingEdit}
            >
              <Text style={styles.saveSubmitBtnText}>
                {savingEdit ? 'Saving Changes...' : 'Update Lead Information ✓'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  headerEditBtn: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  headerEditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  headerDeleteBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  headerDeleteBtnText: {
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  heroLeftCol: {
    flex: 1,
  },
  heroStatusLabel: {
    fontSize: 15,
    fontWeight: '900',
  },
  heroDateText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
  editPencilBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  editPencilText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  patientNameTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  patientLocationSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  contactIconBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  contactIconText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  metaInfoBox: {
    backgroundColor: colors.surfaceSecondary,
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  cardSubText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
  },
  serviceItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  serviceIconText: {
    fontSize: 24,
  },
  serviceItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  serviceItemSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  hospitalItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FDF2F8',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  hospitalItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  hospitalItemAddress: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  viewHospBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewHospBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textWhite,
  },
  patientMessageBox: {
    backgroundColor: colors.surfaceSecondary,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  patientMessageText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
    fontStyle: 'italic',
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
  statusChipActive: {
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusChipTextActive: {
    fontWeight: '900',
  },
  noteInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  noteInput: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: colors.textPrimary,
    minHeight: 44,
  },
  addNoteBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 10,
  },
  addNoteBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textWhite,
  },
  notesList: {
    gap: 8,
  },
  noteCard: {
    backgroundColor: colors.surfaceSecondary,
    padding: 10,
    borderRadius: 10,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  noteDate: {
    fontSize: 10,
    color: colors.textMuted,
  },
  noteContent: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  emptyNotesText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  modalCancelText: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '600',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalDoneText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '800',
  },
  formScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  saveSubmitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveSubmitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textWhite,
  },
});
