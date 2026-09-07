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
  Modal,
  TextInput,
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
  AdminHospitalItem,
} from '../../types/admin';
import { RichTextEditor } from '../../components/RichTextEditor';

export const AdminPackageDetailScreen: React.FC<any> = ({
  route,
  navigation,
}) => {
  const { packageId, initialPackage } = route?.params || {};
  const { showAlert } = useSweetAlert();

  const [pkg, setPkg] = useState<AdminLeadPackageItem | null>(initialPackage || null);
  const [subscriptions, setSubscriptions] = useState<AdminHospitalPackageSubscription[]>([]);
  const [hospitals, setHospitals] = useState<AdminHospitalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(!initialPackage);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [formName, setFormName] = useState('');
  const [formLeads, setFormLeads] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formValidity, setFormValidity] = useState('30');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  // Assign Modal State
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [assignLeads, setAssignLeads] = useState('');
  const [assignPrice, setAssignPrice] = useState('');
  const [assignValidity, setAssignValidity] = useState('30');
  const [assignMethod, setAssignMethod] = useState('ADMIN_MANUAL');
  const [assignRef, setAssignRef] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [hospitalPickerVisible, setHospitalPickerVisible] = useState(false);

  const fetchPackageDetails = useCallback(async () => {
    try {
      const res = await api.get('/admin/packages');
      if (res.data) {
        if (Array.isArray(res.data.packages)) {
          const found = res.data.packages.find((p: AdminLeadPackageItem) => p.id === Number(packageId));
          if (found) {
            setPkg(found);
          }
        }
        if (Array.isArray(res.data.hospitalPackages)) {
          const packageSubs = res.data.hospitalPackages.filter(
            (sub: AdminHospitalPackageSubscription) => sub.packageId === Number(packageId)
          );
          setSubscriptions(packageSubs);
        }
        if (Array.isArray(res.data.hospitals)) {
          setHospitals(res.data.hospitals);
        }
      }
    } catch (err) {
      console.log('Error fetching package details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [packageId]);

  useEffect(() => {
    fetchPackageDetails();
  }, [fetchPackageDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPackageDetails();
  };

  const openEditModal = () => {
    if (!pkg) return;
    setFormName(pkg.name);
    setFormLeads(String(pkg.leadCount));
    setFormPrice(String(pkg.price));
    setFormValidity(pkg.validityDays ? String(pkg.validityDays) : '30');
    setFormDesc(pkg.description || '');
    setFormStatus(pkg.status || 'ACTIVE');
    setEditModalVisible(true);
  };

  const handleSavePackage = async () => {
    if (!formName.trim()) {
      showAlert({ title: 'Validation Error', message: 'Package name is required.', type: 'warning' });
      return;
    }
    const leads = parseInt(formLeads, 10);
    const price = parseFloat(formPrice);
    const validity = parseInt(formValidity, 10);

    if (isNaN(leads) || leads < 1) {
      showAlert({ title: 'Validation Error', message: 'Enter a valid lead count (min 1).', type: 'warning' });
      return;
    }
    if (isNaN(price) || price < 0) {
      showAlert({ title: 'Validation Error', message: 'Enter a valid price.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        leadCount: leads,
        price,
        validityDays: isNaN(validity) || validity < 1 ? null : validity,
        description: formDesc.trim(),
        status: formStatus,
      };

      const res = await api.put(`/admin/packages?id=${packageId}`, payload);
      if (res.data) {
        showAlert({ title: 'Success', message: 'Package updated successfully.', type: 'success' });
        setEditModalVisible(false);
        fetchPackageDetails();
      }
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err?.response?.data?.error || 'Failed to update package.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!pkg) return;
    const nextStatus = pkg.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.put(`/admin/packages?id=${pkg.id}`, {
        ...pkg,
        status: nextStatus,
      });
      showAlert({
        title: 'Status Updated',
        message: `Package marked as ${nextStatus}.`,
        type: 'success',
      });
      fetchPackageDetails();
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err?.response?.data?.error || 'Failed to change package status.',
        type: 'error',
      });
    }
  };

  const openAssignModal = () => {
    if (!pkg) return;
    setSelectedHospitalId('');
    setAssignLeads(String(pkg.leadCount));
    setAssignPrice(String(pkg.price));
    setAssignValidity(pkg.validityDays ? String(pkg.validityDays) : '30');
    setAssignMethod('ADMIN_MANUAL');
    setAssignRef('');
    setAssignNotes('');
    setAssignModalVisible(true);
  };

  const handleAssignPackage = async () => {
    if (!selectedHospitalId) {
      showAlert({ title: 'Validation Error', message: 'Please select a hospital.', type: 'warning' });
      return;
    }
    const leads = parseInt(assignLeads, 10);
    const price = parseFloat(assignPrice);
    const validity = parseInt(assignValidity, 10);

    if (isNaN(leads) || leads <= 0) {
      showAlert({ title: 'Validation Error', message: 'Enter a valid number of leads.', type: 'warning' });
      return;
    }

    setAssigning(true);
    try {
      const res = await api.post('/admin/packages/assign', {
        hospitalId: parseInt(selectedHospitalId, 10),
        packageId: Number(packageId),
        leadCount: leads,
        pricePaid: isNaN(price) ? 0 : price,
        validityDays: isNaN(validity) ? null : validity,
        paymentMethod: assignMethod,
        transactionRef: assignRef.trim() || undefined,
        notes: assignNotes.trim() || undefined,
      });

      if (res.data) {
        showAlert({
          title: 'Leads Credited!',
          message: res.data.message || `Successfully assigned ${leads} leads to hospital.`,
          type: 'success',
        });
        setAssignModalVisible(false);
        fetchPackageDetails();
      }
    } catch (err: any) {
      showAlert({
        title: 'Assignment Failed',
        message: err?.response?.data?.error || 'Failed to assign package.',
        type: 'error',
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleDeletePackage = () => {
    Alert.alert(
      'Delete Lead Package',
      `Are you sure you want to delete "${pkg?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/packages?id=${packageId}`);
              showAlert({
                title: 'Package Deleted',
                message: 'Lead package deleted successfully.',
                type: 'success',
              });
              navigation.goBack();
            } catch (err: any) {
              showAlert({
                title: 'Deletion Failed',
                message: err?.response?.data?.error || 'Failed to delete package.',
                type: 'error',
              });
            }
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
          No feature description provided for this lead package.
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

  const perLeadRate =
    pkg && pkg.leadCount > 0 ? (Number(pkg.price) / Number(pkg.leadCount)).toFixed(0) : '0';

  const totalRevenue = subscriptions.reduce(
    (sum, s) => sum + (Number(s.purchasePrice || s.payment?.amount) || 0),
    0
  );
  const totalLeadsSold = subscriptions.reduce(
    (sum, s) => sum + (Number(s.leadLimit || s.package?.leadCount) || 0),
    0
  );

  const selectedHospital = hospitals.find((h) => String(h.id) === String(selectedHospitalId));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {pkg?.name || 'Package Detail'}
        </Text>
        <TouchableOpacity style={styles.editHeaderBtn} onPress={openEditModal}>
          <Text style={styles.editHeaderBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading package details...</Text>
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
          {/* Main Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.badgeWrapper}>
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
                    ● {pkg.status}
                  </Text>
                </View>
                <View style={styles.tierPill}>
                  <Text style={styles.tierPillText}>TIER ID #{pkg.id}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.statusToggleBtn} onPress={handleToggleStatus}>
                <Text style={styles.statusToggleBtnText}>
                  {pkg.status === 'ACTIVE' ? 'Pause Tier' : 'Activate'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.heroTitle}>{pkg.name}</Text>

            <View style={styles.priceContainer}>
              <View style={styles.priceLeft}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.mainPrice}>
                  {Number(pkg.price).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.pricePeriod}>
                  / {pkg.validityDays ? `${pkg.validityDays} Days` : 'Lifetime'}
                </Text>
              </View>
              <View style={styles.rateBadge}>
                <Text style={styles.rateBadgeText}>₹{perLeadRate} / Lead</Text>
              </View>
            </View>

            {/* Quick Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricIcon}>⚡</Text>
                <View>
                  <Text style={styles.metricValue}>{pkg.leadCount} Leads</Text>
                  <Text style={styles.metricLabel}>Included Quota</Text>
                </View>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricIcon}>⏱️</Text>
                <View>
                  <Text style={styles.metricValue}>
                    {pkg.validityDays ? `${pkg.validityDays} Days` : 'Unlimited'}
                  </Text>
                  <Text style={styles.metricLabel}>Validity Period</Text>
                </View>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricIcon}>🏥</Text>
                <View>
                  <Text style={styles.metricValue}>{subscriptions.length} Sold</Text>
                  <Text style={styles.metricLabel}>Hospital Buyers</Text>
                </View>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricIcon}>💰</Text>
                <View>
                  <Text style={styles.metricValue}>
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.metricLabel}>Total Revenue</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.heroActionsRow}>
              <TouchableOpacity style={styles.assignPrimaryBtn} onPress={openAssignModal}>
                <Text style={styles.assignPrimaryBtnText}>⚡ Assign to Hospital</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editSecondaryBtn} onPress={openEditModal}>
                <Text style={styles.editSecondaryBtnText}>✏️ Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Features & Description Section (CKEditor formatted output) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>✨ Package Features & Description</Text>
              <View style={styles.ckeditorTag}>
                <Text style={styles.ckeditorTagText}>CKEditor 5</Text>
              </View>
            </View>
            {renderFormattedDescription(pkg.description || '')}
          </View>

          {/* Subscriptions / Purchases History */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                📋 Purchase History ({subscriptions.length})
              </Text>
              <Text style={styles.sectionCountText}>
                {totalLeadsSold} leads delivered
              </Text>
            </View>

            {subscriptions.length === 0 ? (
              <View style={styles.emptySubsBox}>
                <Text style={styles.emptySubsEmoji}>📦</Text>
                <Text style={styles.emptySubsTitle}>No Purchases Yet</Text>
                <Text style={styles.emptySubsSubtitle}>
                  This package has not been purchased or assigned to any hospital yet.
                </Text>
                <TouchableOpacity style={styles.assignFirstBtn} onPress={openAssignModal}>
                  <Text style={styles.assignFirstBtnText}>Assign First Hospital</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.subsList}>
                {subscriptions.map((sub) => (
                  <View key={sub.id} style={styles.subCard}>
                    <View style={styles.subCardTop}>
                      <View style={styles.hospitalInfoCol}>
                        <Text style={styles.subHospitalName}>
                          {sub.hospital?.name || `Hospital #${sub.hospitalId}`}
                        </Text>
                        <Text style={styles.subDate}>
                          {new Date(sub.purchasedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View style={styles.subPriceCol}>
                        <Text style={styles.subPrice}>
                          ₹{Number(sub.purchasePrice || sub.payment?.amount || 0).toLocaleString('en-IN')}
                        </Text>
                        <View style={styles.paymentMethodPill}>
                          <Text style={styles.paymentMethodText}>
                            {sub.payment?.gateway || 'MANUAL'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.subCardBottom}>
                      <Text style={styles.subQuotaInfo}>
                        ⚡ <Text style={{ fontWeight: '700' }}>{sub.leadLimit || sub.package?.leadCount} leads</Text> ({sub.leadsRemaining ?? 0} remaining)
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity
                          style={styles.subInvoiceBtn}
                          onPress={() =>
                            navigation.navigate('HospitalInvoice', {
                              subscriptionId: sub.id,
                              paymentId: sub.payment?.id || sub.paymentId,
                            })
                          }
                        >
                          <Text style={styles.subInvoiceBtnText}>🧾 Invoice</Text>
                        </TouchableOpacity>

                        <View
                          style={[
                            styles.subStatusPill,
                            sub.status === 'ACTIVE' ? styles.subStatusActive : styles.subStatusExpired,
                          ]}
                        >
                          <Text
                            style={[
                              styles.subStatusText,
                              sub.status === 'ACTIVE' ? styles.subStatusTextActive : styles.subStatusTextExpired,
                            ]}
                          >
                            {sub.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Delete Danger Zone */}
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <Text style={styles.dangerSubtitle}>
              Deleting this package will remove it from the hospital purchasing catalog.
            </Text>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeletePackage}>
              <Text style={styles.deleteBtnText}>🗑️ Delete Lead Package</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* EDIT PACKAGE MODAL WITH CKEDITOR */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { maxHeight: '92%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Lead Package</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.inputLabel}>Package Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Starter Pack, Growth Tier"
                placeholderTextColor={colors.textMuted}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Lead Count *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formLeads}
                    onChangeText={setFormLeads}
                    placeholder="e.g. 25"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Price (₹) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formPrice}
                    onChangeText={setFormPrice}
                    placeholder="e.g. 5000"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Validity (Days)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formValidity}
                    onChangeText={setFormValidity}
                    placeholder="30"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Status</Text>
                  <View style={styles.statusToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.statusChoiceBtn,
                        formStatus === 'ACTIVE' && styles.statusChoiceBtnActive,
                      ]}
                      onPress={() => setFormStatus('ACTIVE')}
                    >
                      <Text
                        style={[
                          styles.statusChoiceBtnText,
                          formStatus === 'ACTIVE' && styles.statusChoiceBtnTextActive,
                        ]}
                      >
                        ACTIVE
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.statusChoiceBtn,
                        formStatus === 'INACTIVE' && styles.statusChoiceBtnInactive,
                      ]}
                      onPress={() => setFormStatus('INACTIVE')}
                    >
                      <Text
                        style={[
                          styles.statusChoiceBtnText,
                          formStatus === 'INACTIVE' && styles.statusChoiceBtnTextInactive,
                        ]}
                      >
                        INACTIVE
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={styles.inputLabel}>CKEditor Feature Description</Text>
              <RichTextEditor
                value={formDesc}
                onChange={setFormDesc}
                placeholder="Write detailed package features with CKEditor 5..."
                minHeight={160}
              />

              <TouchableOpacity
                style={[styles.saveModalBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSavePackage}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveModalBtnText}>Update Lead Package</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ASSIGN LEADS MODAL */}
      <Modal visible={assignModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Package to Hospital</Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.inputLabel}>Select Hospital *</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setHospitalPickerVisible(true)}
              >
                <Text
                  style={
                    selectedHospital
                      ? styles.dropdownValueText
                      : styles.dropdownPlaceholderText
                  }
                >
                  {selectedHospital
                    ? `${selectedHospital.name} (${selectedHospital.city || 'Hospital'})`
                    : 'Choose Hospital Partner...'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Leads to Credit *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={assignLeads}
                    onChangeText={setAssignLeads}
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Price Paid (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={assignPrice}
                    onChangeText={setAssignPrice}
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Payment Reference / Txn ID</Text>
              <TextInput
                style={styles.modalInput}
                value={assignRef}
                onChangeText={setAssignRef}
                placeholder="e.g. UPI/NEFT/Cash Ref"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Internal Notes</Text>
              <TextInput
                style={[styles.modalInput, { height: 65 }]}
                value={assignNotes}
                onChangeText={setAssignNotes}
                placeholder="Optional assignment remarks..."
                placeholderTextColor={colors.textMuted}
                multiline
              />

              <TouchableOpacity
                style={[styles.saveModalBtn, assigning && { opacity: 0.6 }]}
                onPress={handleAssignPackage}
                disabled={assigning}
              >
                {assigning ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveModalBtnText}>Credit Leads to Hospital</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* HOSPITAL PICKER */}
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
                    setSelectedHospitalId(String(h.id));
                    setHospitalPickerVisible(false);
                  }}
                >
                  <View>
                    <Text style={styles.pickerItemTitle}>{h.name}</Text>
                    <Text style={styles.pickerItemSub}>
                      {h.city ? `${h.city}, ` : ''}{h.state || 'India'} • Balance: {h.leadsRemaining ?? 0} leads
                    </Text>
                  </View>
                  {String(selectedHospitalId) === String(h.id) && (
                    <Text style={styles.pickerCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  editHeaderBtn: {
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
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
    gap: 16,
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
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextInactive: {
    color: '#B91C1C',
  },
  tierPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  statusToggleBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  pricePeriod: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  rateBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rateBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricIcon: {
    fontSize: 20,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 1,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  assignPrimaryBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  assignPrimaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  editSecondaryBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSecondaryBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  ckeditorTag: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ckeditorTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  emptyDescText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  richTextContainer: {
    gap: 8,
  },
  richH2: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingBottom: 2,
  },
  richH3: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 6,
  },
  richQuoteBox: {
    borderLeftWidth: 3,
    borderColor: colors.primary,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  richQuoteText: {
    fontSize: 13,
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
  emptySubsBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptySubsEmoji: {
    fontSize: 32,
  },
  emptySubsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySubsSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
  assignFirstBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignFirstBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  subsList: {
    gap: 10,
  },
  subCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 8,
  },
  subCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hospitalInfoCol: {
    flex: 1,
  },
  subHospitalName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  subPriceCol: {
    alignItems: 'flex-end',
  },
  subPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  paymentMethodPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  paymentMethodText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E40AF',
  },
  subCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: 6,
  },
  subQuotaInfo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  subStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subStatusActive: {
    backgroundColor: '#DCFCE7',
  },
  subStatusExpired: {
    backgroundColor: '#F1F5F9',
  },
  subStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subStatusTextActive: {
    color: '#166534',
  },
  subStatusTextExpired: {
    color: colors.textMuted,
  },
  subNotesBox: {
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 6,
  },
  subNotesText: {
    fontSize: 11,
    color: '#92400E',
  },
  dangerCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 4,
  },
  dangerSubtitle: {
    fontSize: 12,
    color: '#7F1D1D',
    marginBottom: 12,
    lineHeight: 17,
  },
  deleteBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
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
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textMuted,
    padding: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusToggleRow: {
    flexDirection: 'row',
    height: 42,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  statusChoiceBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  statusChoiceBtnActive: {
    backgroundColor: '#16A34A',
  },
  statusChoiceBtnInactive: {
    backgroundColor: '#DC2626',
  },
  statusChoiceBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
  },
  statusChoiceBtnTextActive: {
    color: '#FFF',
  },
  statusChoiceBtnTextInactive: {
    color: '#FFF',
  },
  saveModalBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  saveModalBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  dropdownSelector: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dropdownPlaceholderText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  dropdownArrow: {
    fontSize: 10,
    color: colors.textMuted,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
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
  pickerCheck: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  subInvoiceBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  subInvoiceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
});
