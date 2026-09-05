import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { HospitalDoctorItem } from '../../types/hospital';
import { normalizeImageUrl } from '../../utils/imageUrl';

interface HospitalDoctorsScreenProps {
  navigation: any;
}

export const HospitalDoctorsScreen: React.FC<HospitalDoctorsScreenProps> = ({ navigation }) => {
  const [doctors, setDoctors] = useState<HospitalDoctorItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modal Form State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const [name, setName] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('');
  const [qualification, setQualification] = useState<string>('');
  const [experience, setExperience] = useState<string>('');
  const [treatments, setTreatments] = useState<string>('');
  const [about, setAbout] = useState<string>('');
  const [image, setImage] = useState<string>('');

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await api.get('/hospital/doctors');
      if (res.data && Array.isArray(res.data.doctors)) {
        setDoctors(res.data.doctors);
      }
    } catch (err) {
      console.log('Error fetching hospital doctors:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctors();
  };

  const openAddModal = () => {
    setEditingIndex(null);
    setName('');
    setSpecialty('');
    setQualification('');
    setExperience('');
    setTreatments('');
    setAbout('');
    setImage('');
    setModalVisible(true);
  };

  const openEditModal = (doc: HospitalDoctorItem, index: number) => {
    setEditingIndex(index);
    setName(doc.name || '');
    setSpecialty(doc.specialty || '');
    setQualification(doc.qualification || '');
    setExperience(doc.experience || '');
    setTreatments(Array.isArray(doc.treatments) ? doc.treatments.join(', ') : '');
    setAbout(doc.about || '');
    setImage(doc.image || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !specialty.trim()) {
      Alert.alert('Required Fields', 'Doctor Name and Specialty are required.');
      return;
    }

    try {
      setSaving(true);
      const parsedTreatments = treatments
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingIndex !== null) {
        // Edit doctor
        const res = await api.put('/hospital/doctors', {
          index: editingIndex,
          name: name.trim(),
          specialty: specialty.trim(),
          qualification: qualification.trim(),
          experience: experience.trim(),
          treatments: parsedTreatments,
          about: about.trim(),
          image: image.trim() || undefined,
        });
        if (res.data?.doctors) {
          setDoctors(res.data.doctors);
          setModalVisible(false);
        }
      } else {
        // Add doctor
        const res = await api.post('/hospital/doctors', {
          name: name.trim(),
          specialty: specialty.trim(),
          qualification: qualification.trim(),
          experience: experience.trim(),
          treatments: parsedTreatments,
          about: about.trim(),
          image: image.trim() || undefined,
        });
        if (res.data?.doctors) {
          setDoctors(res.data.doctors);
          setModalVisible(false);
        }
      }
    } catch (err: any) {
      Alert.alert('Save Failed', err?.response?.data?.error || 'Unable to save doctor profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (index: number, docName: string) => {
    Alert.alert(
      'Remove Doctor',
      `Are you sure you want to remove Dr. ${docName} from your hospital profile?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/hospital/doctors?index=${index}`);
              if (res.data?.doctors) {
                setDoctors(res.data.doctors);
              }
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to remove doctor.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hospital Specialists</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {/* Top Info Card */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              Doctors listed here appear on your hospital profile and help patients choose your clinic for specialized procedures.
            </Text>
          </View>

          {doctors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👨‍⚕️</Text>
              <Text style={styles.emptyTitle}>No doctors added yet</Text>
              <Text style={styles.emptySub}>
                Add your chief surgeons and specialists to increase patient inquiries.
              </Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddModal}>
                <Text style={styles.emptyAddBtnText}>+ Add First Doctor</Text>
              </TouchableOpacity>
            </View>
          ) : (
            doctors.map((doc, idx) => (
              <View key={idx} style={styles.doctorCard}>
                <View style={styles.doctorHeader}>
                  <Image
                    source={{
                      uri:
                        normalizeImageUrl(doc.image) ||
                        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
                    }}
                    style={styles.doctorAvatar}
                  />
                  <View style={styles.doctorMeta}>
                    <Text style={styles.doctorName}>Dr. {doc.name}</Text>
                    <Text style={styles.doctorSpecialty}>{doc.specialty}</Text>
                    {doc.qualification ? (
                      <Text style={styles.doctorQual}>{doc.qualification}</Text>
                    ) : null}
                    {doc.experience ? (
                      <Text style={styles.doctorExp}>⏳ {doc.experience} Experience</Text>
                    ) : null}
                  </View>
                </View>

                {doc.about ? (
                  <Text style={styles.doctorAbout} numberOfLines={3}>
                    {doc.about}
                  </Text>
                ) : null}

                {doc.treatments && doc.treatments.length > 0 ? (
                  <View style={styles.treatmentsRow}>
                    {doc.treatments.slice(0, 4).map((t, tIdx) => (
                      <View key={tIdx} style={styles.treatmentPill}>
                        <Text style={styles.treatmentPillText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Actions */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => openEditModal(doc, idx)}
                  >
                    <Text style={styles.editBtnText}>✏️ Edit Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(idx, doc.name)}
                  >
                    <Text style={styles.deleteBtnText}>🗑️ Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add / Edit Doctor Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>
              {editingIndex !== null ? 'Edit Doctor' : 'Add New Doctor'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.modalDoneText, saving && { opacity: 0.5 }]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.formLabel}>Doctor Full Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Dr. Rajesh Sharma"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.formLabel}>Specialty / Department *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Orthopedics, Cardiology, Dermatology"
              placeholderTextColor={colors.textMuted}
              value={specialty}
              onChangeText={setSpecialty}
            />

            <Text style={styles.formLabel}>Qualifications</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. MBBS, MS (Ortho), MCh"
              placeholderTextColor={colors.textMuted}
              value={qualification}
              onChangeText={setQualification}
            />

            <Text style={styles.formLabel}>Years of Experience</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 15+ Years"
              placeholderTextColor={colors.textMuted}
              value={experience}
              onChangeText={setExperience}
            />

            <Text style={styles.formLabel}>Treatments / Procedures (comma-separated)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Knee Replacement, ACL Surgery, Arthroscopy"
              placeholderTextColor={colors.textMuted}
              value={treatments}
              onChangeText={setTreatments}
            />

            <Text style={styles.formLabel}>Profile Photo URL (Optional)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="https://example.com/doctor.jpg"
              placeholderTextColor={colors.textMuted}
              value={image}
              onChangeText={setImage}
              autoCapitalize="none"
            />

            <Text style={styles.formLabel}>About Doctor / Summary</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              placeholder="Brief summary of doctor's achievements, background..."
              placeholderTextColor={colors.textMuted}
              value={about}
              onChangeText={setAbout}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.saveSubmitBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveSubmitBtnText}>
                {saving ? 'Saving Doctor...' : editingIndex !== null ? 'Update Doctor Profile ✓' : 'Add Doctor to Profile ✓'}
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
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textWhite,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 17,
  },
  doctorCard: {
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
  doctorHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  doctorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
    backgroundColor: colors.surfaceSecondary,
  },
  doctorMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  doctorSpecialty: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  doctorQual: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  doctorExp: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  doctorAbout: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  treatmentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  treatmentPill: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  treatmentPillText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  emptyContainer: {
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
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    paddingHorizontal: 30,
  },
  emptyAddBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyAddBtnText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  modalCancelText: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '600',
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalDoneText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  formScroll: {
    padding: 20,
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
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  saveSubmitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveSubmitBtnText: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },
});
