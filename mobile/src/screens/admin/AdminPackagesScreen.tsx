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
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useSweetAlert } from '../../context/SweetAlertContext';
import {
  AdminLeadPackageItem,
  AdminHospitalPackageSubscription,
  AdminPackageStats,
  AdminHospitalItem,
} from '../../types/admin';
import { RichTextEditor } from '../../components/RichTextEditor';

interface AdminPackagesScreenProps {
  navigation: any;
}

export const AdminPackagesScreen: React.FC<AdminPackagesScreenProps> = ({ navigation }) => {
  const { showAlert } = useSweetAlert();

  const [activeTab, setActiveTab] = useState<'catalog' | 'assign' | 'subscriptions'>('catalog');
  const [packages, setPackages] = useState<AdminLeadPackageItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminHospitalPackageSubscription[]>([]);
  const [hospitals, setHospitals] = useState<AdminHospitalItem[]>([]);
  const [stats, setStats] = useState<AdminPackageStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Search in subscriptions
  const [subSearch, setSubSearch] = useState('');

  // Create / Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formLeads, setFormLeads] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formValidity, setFormValidity] = useState('30');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  // Assign Package State
  const [assignHospitalId, setAssignHospitalId] = useState<string>('');
  const [assignPackageId, setAssignPackageId] = useState<string>('');
  const [assignLeads, setAssignLeads] = useState('');
  const [assignPrice, setAssignPrice] = useState('');
  const [assignValidity, setAssignValidity] = useState('30');
  const [assignMethod, setAssignMethod] = useState('ADMIN_MANUAL');
  const [assignRef, setAssignRef] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [hospitalPickerVisible, setHospitalPickerVisible] = useState(false);
  const [packagePickerVisible, setPackagePickerVisible] = useState(false);
  const [methodPickerVisible, setMethodPickerVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/admin/packages');
      if (res.data) {
        if (Array.isArray(res.data.packages)) setPackages(res.data.packages);
        if (Array.isArray(res.data.hospitalPackages)) setSubscriptions(res.data.hospitalPackages);
        if (Array.isArray(res.data.hospitals)) setHospitals(res.data.hospitals);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.log('Error fetching admin packages:', err);
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

  const openCreateModal = () => {
    setEditingId(null);
    setFormName('');
    setFormLeads('');
    setFormPrice('');
    setFormValidity('30');
    setFormDesc('');
    setFormStatus('ACTIVE');
    setModalVisible(true);
  };

  const openEditModal = (pkg: AdminLeadPackageItem) => {
    setEditingId(pkg.id);
    setFormName(pkg.name);
    setFormLeads(String(pkg.leadCount));
    setFormPrice(String(pkg.price));
    setFormValidity(pkg.validityDays ? String(pkg.validityDays) : '30');
    setFormDesc(pkg.description || '');
    setFormStatus(pkg.status || 'ACTIVE');
    setModalVisible(true);
  };

  const handleSavePackage = async () => {
    if (!formName.trim() || !formLeads.trim() || !formPrice.trim()) {
      showAlert({
        title: 'Required Fields',
        message: 'Please fill in Package Name, Lead Count, and Price.',
        type: 'warning',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: formName.trim(),
        leadCount: Number(formLeads),
        price: Number(formPrice),
        validityDays: formValidity.trim() ? Number(formValidity) : null,
        description: formDesc.trim() || null,
        status: formStatus,
      };

      if (editingId) {
        payload.id = editingId;
        const res = await api.put('/admin/packages', payload);
        if (res.data) {
          showAlert({
            title: 'Package Updated',
            message: `"${formName}" has been updated successfully.`,
            type: 'success',
          });
          setModalVisible(false);
          fetchData();
        }
      } else {
        const res = await api.post('/admin/packages', payload);
        if (res.data) {
          showAlert({
            title: 'Package Created',
            message: `"${formName}" is now available in catalog.`,
            type: 'success',
          });
          setModalVisible(false);
          fetchData();
        }
      }
    } catch (err: any) {
      showAlert({
        title: 'Error Saving Package',
        message: err?.response?.data?.error || 'Failed to save lead package.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePackage = (pkg: AdminLeadPackageItem) => {
    showAlert({
      title: 'Delete Lead Package',
      message: `Are you sure you want to delete "${pkg.name}" (₹${pkg.price})?`,
      type: 'warning',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/packages?id=${pkg.id}`);
          showAlert({
            title: 'Package Deleted',
            message: `"${pkg.name}" has been removed.`,
            type: 'success',
          });
          fetchData();
        } catch (err: any) {
          showAlert({
            title: 'Delete Failed',
            message: err?.response?.data?.error || 'Unable to delete package.',
            type: 'error',
          });
        }
      },
    });
  };

  const handleSelectPackageForAssign = (pkg: AdminLeadPackageItem) => {
    setAssignPackageId(String(pkg.id));
    setAssignLeads(String(pkg.leadCount));
    setAssignPrice(String(pkg.price));
    setAssignValidity(pkg.validityDays ? String(pkg.validityDays) : '30');
    setPackagePickerVisible(false);
  };

  const handleAssignSubmit = async () => {
    if (!assignHospitalId) {
      showAlert({
        title: 'Select Hospital',
        message: 'Please choose a hospital to credit leads to.',
        type: 'warning',
      });
      return;
    }

    if (!assignLeads || Number(assignLeads) <= 0) {
      showAlert({
        title: 'Invalid Leads',
        message: 'Please enter a valid lead count greater than 0.',
        type: 'warning',
      });
      return;
    }

    setAssigning(true);
    try {
      const res = await api.post('/admin/packages/assign', {
        hospitalId: Number(assignHospitalId),
        packageId: assignPackageId ? Number(assignPackageId) : null,
        customLeadCount: Number(assignLeads),
        customPrice: assignPrice ? Number(assignPrice) : 0,
        validityDays: assignValidity ? Number(assignValidity) : null,
        paymentMethod: assignMethod,
        paymentReference: assignRef.trim() || undefined,
        notes: assignNotes.trim() || undefined,
      });

      if (res.data) {
        showAlert({
          title: 'Leads Credited!',
          message: res.data.message || `Successfully assigned ${assignLeads} leads to hospital.`,
          type: 'success',
        });
        setAssignHospitalId('');
        setAssignPackageId('');
        setAssignLeads('');
        setAssignPrice('');
        setAssignRef('');
        setAssignNotes('');
        fetchData();
        setActiveTab('subscriptions');
      }
    } catch (err: any) {
      showAlert({
        title: 'Assignment Failed',
        message: err?.response?.data?.error || 'Failed to assign package to hospital.',
        type: 'error',
      });
    } finally {
      setAssigning(false);
    }
  };

  const selectedHospital = hospitals.find((h) => String(h.id) === String(assignHospitalId));
  const selectedPackageTemplate = packages.find((p) => String(p.id) === String(assignPackageId));

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const searchLower = subSearch.toLowerCase();
    return (
      !subSearch ||
      sub.hospital?.name?.toLowerCase().includes(searchLower) ||
      sub.package?.name?.toLowerCase().includes(searchLower) ||
      sub.payment?.merchantTransactionId?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Packages</Text>
        <TouchableOpacity style={styles.addHeaderBtn} onPress={openCreateModal}>
          <Text style={styles.addHeaderBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'catalog' && styles.tabBtnActive]}
          onPress={() => setActiveTab('catalog')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'catalog' && styles.tabBtnTextActive]}>
            Catalog ({packages.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'assign' && styles.tabBtnActive]}
          onPress={() => setActiveTab('assign')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'assign' && styles.tabBtnTextActive]}>
            Assign Leads
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'subscriptions' && styles.tabBtnActive]}
          onPress={() => setActiveTab('subscriptions')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'subscriptions' && styles.tabBtnTextActive]}>
            Purchases ({subscriptions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading lead packages...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ACTIVE TIERS</Text>
              <Text style={styles.statVal}>
                {packages.filter((p) => p.status === 'ACTIVE').length}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TOTAL SOLD</Text>
              <Text style={[styles.statVal, { color: '#2563EB' }]}>
                {stats?.totalSubscriptions || subscriptions.length}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>LEADS GRANTED</Text>
              <Text style={[styles.statVal, { color: '#16A34A' }]}>
                {stats?.totalLeadsSold || 0}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>REVENUE</Text>
              <Text style={[styles.statVal, { color: colors.primary }]}>
                ₹{((stats?.totalRevenue || 0) / 1000).toFixed(0)}k
              </Text>
            </View>
          </View>

          {/* TAB 1: CATALOG */}
          {activeTab === 'catalog' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Package Catalog</Text>
                <TouchableOpacity style={styles.createBtnInline} onPress={openCreateModal}>
                  <Text style={styles.createBtnInlineText}>+ Add Package</Text>
                </TouchableOpacity>
              </View>

              {packages.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>📦</Text>
                  <Text style={styles.emptyTitle}>No Packages Configured</Text>
                  <Text style={styles.emptySubtitle}>
                    Create lead pricing packages for hospital partners.
                  </Text>
                  <TouchableOpacity style={styles.primaryActionBtn} onPress={openCreateModal}>
                    <Text style={styles.primaryActionBtnText}>Create First Package</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                packages.map((pkg) => {
                  const perLead =
                    pkg.leadCount > 0 ? (Number(pkg.price) / Number(pkg.leadCount)).toFixed(0) : '0';
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      style={styles.packageCard}
                      activeOpacity={0.9}
                      onPress={() =>
                        navigation.navigate('AdminPackageDetail', {
                          packageId: pkg.id,
                          initialPackage: pkg,
                        })
                      }
                    >
                      <View style={styles.cardTop}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={styles.nameBadgeRow}>
                            <Text style={styles.packageName} numberOfLines={1}>{pkg.name}</Text>
                            <View
                              style={[
                                styles.statusPill,
                                pkg.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusText,
                                  pkg.status === 'ACTIVE' ? styles.statusTextActive : styles.statusTextInactive,
                                ]}
                              >
                                {pkg.status}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.packageLeadsCount}>
                            ⚡ {pkg.leadCount} Patient Leads •{' '}
                            {pkg.validityDays ? `${pkg.validityDays} Days` : 'Unlimited'}
                          </Text>
                        </View>
                        <View style={styles.priceCol}>
                          <Text style={styles.packagePrice}>
                            ₹{Number(pkg.price).toLocaleString('en-IN')}
                          </Text>
                          <Text style={styles.perLeadRate}>₹{perLead}/lead</Text>
                        </View>
                      </View>

                      {pkg.description ? (
                        <Text style={styles.packageDesc} numberOfLines={2}>
                          {pkg.description.replace(/<[^>]*>?/gm, '')}
                        </Text>
                      ) : null}

                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.detailsBtn}
                          onPress={() =>
                            navigation.navigate('AdminPackageDetail', {
                              packageId: pkg.id,
                              initialPackage: pkg,
                            })
                          }
                        >
                          <Text style={styles.detailsBtnText}>👁️ View Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.quickAssignBtn}
                          onPress={() => {
                            handleSelectPackageForAssign(pkg);
                            setActiveTab('assign');
                          }}
                        >
                          <Text style={styles.quickAssignBtnText}>Assign to Hospital →</Text>
                        </TouchableOpacity>

                        <View style={styles.actionBtnRow}>
                          <TouchableOpacity
                            style={styles.editIconBtn}
                            onPress={() => openEditModal(pkg)}
                          >
                            <Text style={styles.editIconText}>✏️ Edit</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.deleteIconBtn}
                            onPress={() => handleDeletePackage(pkg)}
                          >
                            <Text style={styles.deleteIconText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 2: ASSIGN PACKAGE */}
          {activeTab === 'assign' && (
            <View style={styles.section}>
              <View style={styles.assignFormCard}>
                <Text style={styles.formTitle}>Grant / Assign Leads to Hospital</Text>
                <Text style={styles.formSubtitle}>
                  Credit leads directly for Offline Bank Transfers, Cash, or Promotional Trials.
                </Text>

                {/* 1. Hospital Selector */}
                <Text style={styles.inputLabel}>Select Hospital *</Text>
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  onPress={() => setHospitalPickerVisible(true)}
                >
                  <Text
                    style={[
                      styles.pickerTriggerText,
                      !selectedHospital && { color: colors.textMuted },
                    ]}
                  >
                    {selectedHospital
                      ? `${selectedHospital.name} (${selectedHospital.city}) • Balance: ${selectedHospital.leadsRemaining} Leads`
                      : 'Choose Hospital Partner...'}
                  </Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>

                {/* 2. Package Template Selector */}
                <Text style={styles.inputLabel}>Package Template (Optional)</Text>
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  onPress={() => setPackagePickerVisible(true)}
                >
                  <Text
                    style={[
                      styles.pickerTriggerText,
                      !selectedPackageTemplate && { color: colors.textMuted },
                    ]}
                  >
                    {selectedPackageTemplate
                      ? `${selectedPackageTemplate.name} (${selectedPackageTemplate.leadCount} Leads - ₹${selectedPackageTemplate.price})`
                      : 'Select Template or enter custom...'}
                  </Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>

                {/* 3. Number of Leads */}
                <Text style={styles.inputLabel}>Number of Leads to Grant *</Text>
                <TextInput
                  style={styles.textInput}
                  value={assignLeads}
                  onChangeText={setAssignLeads}
                  placeholder="e.g. 50"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />

                {/* 4. Price Charged */}
                <Text style={styles.inputLabel}>Amount / Price Charged (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  value={assignPrice}
                  onChangeText={setAssignPrice}
                  placeholder="e.g. 4999 (0 for Free Trial)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />

                {/* 5. Validity Days */}
                <Text style={styles.inputLabel}>Validity Days</Text>
                <TextInput
                  style={styles.textInput}
                  value={assignValidity}
                  onChangeText={setAssignValidity}
                  placeholder="30 (leave blank for unlimited)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />

                {/* 6. Payment Method */}
                <Text style={styles.inputLabel}>Payment Method</Text>
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  onPress={() => setMethodPickerVisible(true)}
                >
                  <Text style={styles.pickerTriggerText}>
                    {assignMethod === 'ADMIN_MANUAL' && 'Admin Manual Credit'}
                    {assignMethod === 'BANK_TRANSFER' && 'Bank Transfer (NEFT/RTGS)'}
                    {assignMethod === 'UPI' && 'UPI Direct / QR'}
                    {assignMethod === 'CASH_CHEQUE' && 'Cash / Cheque'}
                    {assignMethod === 'PROMOTIONAL_TRIAL' && 'Promotional / Free Trial'}
                  </Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>

                {/* 7. Reference ID */}
                <Text style={styles.inputLabel}>Transaction / Reference ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={assignRef}
                  onChangeText={setAssignRef}
                  placeholder="e.g. UTR12345678"
                  placeholderTextColor={colors.textMuted}
                />

                {/* 8. Notes */}
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                  value={assignNotes}
                  onChangeText={setAssignNotes}
                  placeholder="e.g. Approved for onboarding campaign"
                  placeholderTextColor={colors.textMuted}
                  multiline
                />

                <TouchableOpacity
                  style={[styles.submitAssignBtn, assigning && { opacity: 0.6 }]}
                  onPress={handleAssignSubmit}
                  disabled={assigning}
                >
                  {assigning ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.submitAssignBtnText}>✓ Confirm & Credit Leads</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 3: PURCHASES AUDIT */}
          {activeTab === 'subscriptions' && (
            <View style={styles.section}>
              <View style={styles.searchBar}>
                <TextInput
                  style={styles.searchInput}
                  value={subSearch}
                  onChangeText={setSubSearch}
                  placeholder="Search hospital or transaction..."
                  placeholderTextColor={colors.textMuted}
                />
                {subSearch ? (
                  <TouchableOpacity onPress={() => setSubSearch('')}>
                    <Text style={{ color: colors.textMuted, fontSize: 16 }}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {filteredSubscriptions.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyTitle}>No Subscriptions Found</Text>
                </View>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <View key={sub.id} style={styles.subCard}>
                    <View style={styles.subCardTop}>
                      <View>
                        <Text style={styles.subHospitalName}>
                          {sub.hospital?.name || `Hospital #${sub.hospitalId}`}
                        </Text>
                        <Text style={styles.subCity}>{sub.hospital?.city || 'India'}</Text>
                      </View>
                      <View style={[styles.statusPill, styles.statusActive]}>
                        <Text style={[styles.statusText, styles.statusTextActive]}>
                          {sub.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.subDetailsRow}>
                      <View style={styles.subDetailItem}>
                        <Text style={styles.subDetailLabel}>PACKAGE</Text>
                        <Text style={styles.subDetailVal}>
                          {sub.package?.name || 'Custom Package'}
                        </Text>
                      </View>
                      <View style={styles.subDetailItem}>
                        <Text style={styles.subDetailLabel}>GRANTED</Text>
                        <Text style={[styles.subDetailVal, { color: colors.primary }]}>
                          +{sub.leadLimit} Leads
                        </Text>
                      </View>
                      <View style={styles.subDetailItem}>
                        <Text style={styles.subDetailLabel}>AMOUNT</Text>
                        <Text style={styles.subDetailVal}>
                          ₹{Number(sub.purchasePrice).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.subFooter}>
                      <Text style={styles.subFooterDate}>
                        📅 {new Date(sub.purchasedAt).toLocaleDateString('en-IN')}
                      </Text>
                      <Text style={styles.subGateway}>
                        💳 {sub.payment?.gateway || 'PhonePe'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* CREATE / EDIT PACKAGE MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? `Edit Package #${editingId}` : 'Create Lead Package'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Package Name *</Text>
              <TextInput
                style={styles.textInput}
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Starter 25 Leads"
                placeholderTextColor={colors.textMuted}
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Leads Count *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formLeads}
                    onChangeText={setFormLeads}
                    placeholder="25"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Price (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formPrice}
                    onChangeText={setFormPrice}
                    placeholder="4999"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Validity (Days)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formValidity}
                    onChangeText={setFormValidity}
                    placeholder="30"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Status</Text>
                  <View style={styles.statusToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.statusToggleBtn,
                        formStatus === 'ACTIVE' && styles.statusToggleBtnActive,
                      ]}
                      onPress={() => setFormStatus('ACTIVE')}
                    >
                      <Text
                        style={[
                          styles.statusToggleBtnText,
                          formStatus === 'ACTIVE' && styles.statusToggleBtnTextActive,
                        ]}
                      >
                        ACTIVE
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusToggleBtn,
                        formStatus === 'INACTIVE' && styles.statusToggleBtnInactive,
                      ]}
                      onPress={() => setFormStatus('INACTIVE')}
                    >
                      <Text
                        style={[
                          styles.statusToggleBtnText,
                          formStatus === 'INACTIVE' && styles.statusToggleBtnTextInactive,
                        ]}
                      >
                        INACTIVE
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={styles.inputLabel}>Feature Description</Text>
              <RichTextEditor
                value={formDesc}
                onChange={setFormDesc}
                placeholder="Write detailed package features (e.g. 25 Verified patient leads, priority placement)..."
                minHeight={150}
              />

              <TouchableOpacity
                style={[styles.saveModalBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSavePackage}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveModalBtnText}>
                    {editingId ? 'Update Lead Package' : 'Create Lead Package'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* HOSPITAL PICKER MODAL */}
      <Modal visible={hospitalPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Hospital</Text>
              <TouchableOpacity onPress={() => setHospitalPickerVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {hospitals.map((h) => (
                <TouchableOpacity
                  key={h.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setAssignHospitalId(String(h.id));
                    setHospitalPickerVisible(false);
                  }}
                >
                  <View>
                    <Text style={styles.pickerItemTitle}>{h.name}</Text>
                    <Text style={styles.pickerItemSub}>
                      {h.city} • Leads Balance: {h.leadsRemaining}
                    </Text>
                  </View>
                  {String(assignHospitalId) === String(h.id) && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PACKAGE TEMPLATE PICKER MODAL */}
      <Modal visible={packagePickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Package Template</Text>
              <TouchableOpacity onPress={() => setPackagePickerVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {packages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={styles.pickerItem}
                  onPress={() => handleSelectPackageForAssign(pkg)}
                >
                  <View>
                    <Text style={styles.pickerItemTitle}>{pkg.name}</Text>
                    <Text style={styles.pickerItemSub}>
                      {pkg.leadCount} Leads • ₹{pkg.price} •{' '}
                      {pkg.validityDays ? `${pkg.validityDays} Days` : 'Lifetime'}
                    </Text>
                  </View>
                  {String(assignPackageId) === String(pkg.id) && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PAYMENT METHOD PICKER MODAL */}
      <Modal visible={methodPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <TouchableOpacity onPress={() => setMethodPickerVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {[
              { key: 'ADMIN_MANUAL', label: 'Admin Manual Credit' },
              { key: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT / RTGS / IMPS)' },
              { key: 'UPI', label: 'UPI Direct / QR' },
              { key: 'CASH_CHEQUE', label: 'Cash / Cheque' },
              { key: 'PROMOTIONAL_TRIAL', label: 'Promotional / Free Trial' },
            ].map((m) => (
              <TouchableOpacity
                key={m.key}
                style={styles.pickerItem}
                onPress={() => {
                  setAssignMethod(m.key);
                  setMethodPickerVisible(false);
                }}
              >
                <Text style={styles.pickerItemTitle}>{m.label}</Text>
                {assignMethod === m.key && <Text style={styles.checkIcon}>✓</Text>}
              </TouchableOpacity>
            ))}
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
    paddingHorizontal: 16,
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
  addHeaderBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addHeaderBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FDF2F8',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 2,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  createBtnInline: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  createBtnInlineText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
  packageCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 8,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextActive: {
    color: '#16A34A',
  },
  statusTextInactive: {
    color: '#64748B',
  },
  packageLeadsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  perLeadRate: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  packageDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    gap: 6,
  },
  detailsBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  quickAssignBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickAssignBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editIconBtn: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editIconText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  deleteIconBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteIconText: {
    fontSize: 11,
  },
  assignFormCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  formSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  pickerTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerTriggerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  pickerArrow: {
    fontSize: 10,
    color: colors.textMuted,
    marginLeft: 8,
  },
  submitAssignBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitAssignBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  subCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  subCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  subHospitalName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subCity: {
    fontSize: 11,
    color: colors.textMuted,
  },
  subDetailsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
  },
  subDetailItem: {
    flex: 1,
  },
  subDetailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 2,
  },
  subDetailVal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  subFooterDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  subGateway: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  primaryActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textMuted,
  },
  twoCol: {
    flexDirection: 'row',
  },
  statusToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  statusToggleBtnActive: {
    backgroundColor: '#DCFCE7',
  },
  statusToggleBtnInactive: {
    backgroundColor: '#F1F5F9',
  },
  statusToggleBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
  },
  statusToggleBtnTextActive: {
    color: '#16A34A',
  },
  statusToggleBtnTextInactive: {
    color: '#64748B',
  },
  saveModalBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
  saveModalBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  pickerItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pickerItemSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
});
