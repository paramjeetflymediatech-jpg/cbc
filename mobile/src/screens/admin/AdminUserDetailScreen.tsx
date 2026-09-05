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
import {
  AdminUserItem,
  AdminUserDetailResponse,
  AdminUserLeadItem,
  AdminUserHospitalInfo,
  AdminUserStats,
} from '../../types/admin';

interface AdminUserDetailScreenProps {
  navigation?: any;
  route?: {
    params?: {
      userId?: string | number;
      userName?: string;
    };
  };
}


export const AdminUserDetailScreen: React.FC<AdminUserDetailScreenProps> = ({ navigation, route }) => {
  const userId = route?.params?.userId;


  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [user, setUser] = useState<AdminUserItem | null>(null);
  const [leads, setLeads] = useState<AdminUserLeadItem[]>([]);
  const [contactedHospitals, setContactedHospitals] = useState<AdminUserHospitalInfo[]>([]);
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [stats, setStats] = useState<AdminUserStats>({
    totalEnquiries: 0,
    totalHospitalsContacted: 0,
    activeEnquiries: 0,
    convertedEnquiries: 0,
  });

  const [activeTab, setActiveTab] = useState<'queries' | 'hospitals' | 'profile'>('queries');
  const [copied, setCopied] = useState<boolean>(false);

  // Edit User Modal State
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editRole, setEditRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'HOSPITAL' | 'PATIENT'>('PATIENT');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [editCity, setEditCity] = useState<string>('');
  const [editState, setEditState] = useState<string>('');
  const [editAddress, setEditAddress] = useState<string>('');
  const [editPincode, setEditPincode] = useState<string>('');
  const [editHospitalId, setEditHospitalId] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');

  const fetchUserDetail = useCallback(async () => {
    if (!userId) return;
    try {
      const [userRes, hospRes] = await Promise.allSettled([
        api.get<AdminUserDetailResponse>(`/admin/users/${userId}`),
        api.get('/admin/hospitals'),
      ]);

      if (userRes.status === 'fulfilled' && userRes.value?.data?.success && userRes.value.data.user) {
        setUser(userRes.value.data.user);
        setLeads(userRes.value.data.leads || []);
        setContactedHospitals(userRes.value.data.contactedHospitals || []);
        if (userRes.value.data.stats) {
          setStats(userRes.value.data.stats);
        }

        // Pre-populate edit form state
        setEditName(userRes.value.data.user.name || '');
        setEditPhone(userRes.value.data.user.phone || '');
        setEditRole(userRes.value.data.user.role || 'PATIENT');
        setEditStatus(userRes.value.data.user.status || 'ACTIVE');
        setEditCity(userRes.value.data.user.city || '');
        setEditState(userRes.value.data.user.state || '');
        setEditAddress(userRes.value.data.user.address || '');
        setEditPincode(userRes.value.data.user.pincode || '');
        setEditHospitalId(userRes.value.data.user.hospitalId ? String(userRes.value.data.user.hospitalId) : '');
      }

      if (hospRes.status === 'fulfilled' && hospRes.value?.data?.hospitals) {
        setHospitalsList(hospRes.value.data.hospitals);
      }
    } catch (err: any) {
      console.log('Error fetching admin user detail:', err);
      Alert.alert('Error', err?.response?.data?.error || 'Failed to load user details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserDetail();
  }, [fetchUserDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserDetail();
  };

  const handleCopyUid = () => {
    if (!user?.id) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('User ID', `CBC-USER-${String(user.id).padStart(5, '0')}`);
  };

  const handleOpenEditModal = () => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditRole(user.role || 'PATIENT');
      setEditStatus(user.status || 'ACTIVE');
      setEditCity(user.city || '');
      setEditState(user.state || '');
      setEditAddress(user.address || '');
      setEditPincode(user.pincode || '');
      setEditHospitalId(user.hospitalId ? String(user.hospitalId) : '');
      setEditPassword('');
    }
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!user) return;
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.put('/admin/users', {
        id: user.id,
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        role: editRole,
        status: editStatus,
        city: editCity.trim() || undefined,
        state: editState.trim() || undefined,
        address: editAddress.trim() || undefined,
        pincode: editPincode.trim() || undefined,
        hospitalId: editHospitalId ? Number(editHospitalId) : null,
        ...(editPassword.trim() ? { newPassword: editPassword.trim() } : {}),
      });

      if (res.data?.success) {
        setEditModalVisible(false);
        setEditPassword('');
        Alert.alert('Success', 'User details updated successfully.');
        fetchUserDetail();
      }
    } catch (err: any) {
      Alert.alert('Update Failed', err?.response?.data?.error || 'Could not update user.');
    } finally {
      setSaving(false);
    }
  };


  const handleToggleStatus = () => {
    if (!user) return;
    const isCurrentlyActive = user.status === 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    const actionTitle = isCurrentlyActive ? 'Deactivate User Account' : 'Activate User Account';
    const actionMessage = isCurrentlyActive
      ? `Are you sure you want to deactivate the account for "${user.name || user.email}"? The user will be unable to sign in.`
      : `Activate the account for "${user.name || user.email}"?`;
    const confirmBtnText = isCurrentlyActive ? 'Deactivate' : 'Activate';

    Alert.alert(
      actionTitle,
      actionMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: confirmBtnText,
          style: isCurrentlyActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const res = await api.put('/admin/users', {
                id: user.id,
                status: newStatus,
              });
              if (res.data?.success) {
                setUser((prev) => (prev ? { ...prev, status: newStatus } : prev));
                Alert.alert('Status Updated', `User account is now ${newStatus.toLowerCase()}.`);
              }
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to update user status.');
            }
          },
        },
      ]
    );
  };


  const handleDeleteUser = () => {
    if (!user) return;
    if (user.role === 'SUPER_ADMIN') {
      Alert.alert('Protected Account', 'Super Admin accounts cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete User Account',
      `Permanently delete account for "${user.email}"? All associated data will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/admin/users?id=${user.id}`);
              if (res.data?.success) {
                Alert.alert('Deleted', 'User account has been permanently removed.', [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              }
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to delete user.');
            }
          },
        },
      ]
    );
  };

  const handleCall = async (phoneNumber?: string) => {
    if (!phoneNumber || !phoneNumber.trim()) {
      Alert.alert('No Phone Number', 'No contact phone number is available for this record.');
      return;
    }
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    if (!cleanNumber) {
      Alert.alert('Invalid Number', `Phone number "${phoneNumber}" is invalid.`);
      return;
    }

    const telUrl = `tel:${cleanNumber}`;
    try {
      const supported = await Linking.canOpenURL(telUrl);
      if (supported) {
        await Linking.openURL(telUrl);
      } else {
        Alert.alert(
          'Contact Phone',
          `Phone Number: ${phoneNumber}\n\n(Direct calling is not available on this simulator/device.)`,
          [{ text: 'OK' }]
        );
      }
    } catch {
      Linking.openURL(telUrl).catch(() => {
        Alert.alert(
          'Contact Phone',
          `Phone Number: ${phoneNumber}`,
          [{ text: 'OK' }]
        );
      });
    }
  };

  const getRoleBadge = (r?: string) => {
    switch (r) {
      case 'SUPER_ADMIN':
        return { bg: '#FDF2F8', text: '#BE185D', label: '🛡️ SUPER ADMIN' };
      case 'ADMIN':
        return { bg: '#F3E8FF', text: '#7E22CE', label: '👑 STAFF ADMIN' };
      case 'HOSPITAL':
        return { bg: '#EFF6FF', text: '#1D4ED8', label: '🏥 HOSPITAL' };
      default:
        return { bg: '#F1F5F9', text: '#475569', label: '👤 PATIENT' };
    }
  };

  const getLeadStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return { bg: '#EFF6FF', text: '#1D4ED8', label: 'Received' };
      case 'CONTACTED':
        return { bg: '#FEF3C7', text: '#B45309', label: 'Contacted' };
      case 'IN_PROGRESS':
        return { bg: '#F3E8FF', text: '#7E22CE', label: 'In Progress' };
      case 'CONVERTED':
        return { bg: '#DCFCE7', text: '#15803D', label: 'Confirmed' };
      case 'CLOSED':
        return { bg: '#F1F5F9', text: '#475569', label: 'Completed' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', label: status };
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading full user profile & records...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <Text style={styles.notFoundIcon}>👤</Text>
        <Text style={styles.notFoundTitle}>User Not Found</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackBtnText}>← Return to Users Directory</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const roleBadge = getRoleBadge(user.role);
  const isActive = user.status === 'ACTIVE';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          User Details
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerEditBtn} onPress={handleOpenEditModal}>
            <Text style={styles.headerEditBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Hero Identity Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTopRow}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>
                {user.name ? user.name.trim()[0].toUpperCase() : 'U'}
              </Text>
            </View>

            <View style={styles.heroInfo}>
              <View style={styles.heroNameRow}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {user.name || 'Unnamed User'}
                </Text>
              </View>

              <View style={styles.badgesRow}>
                <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
                  <Text style={[styles.roleBadgeText, { color: roleBadge.text }]}>
                    {roleBadge.label}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    isActive ? styles.statusActiveBadge : styles.statusInactiveBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isActive ? styles.statusActiveText : styles.statusInactiveText,
                    ]}
                  >
                    {user.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroEmail} numberOfLines={1}>
                ✉️ {user.email}
              </Text>
              {user.phone ? (
                <TouchableOpacity
                  style={styles.heroPhoneTouchable}
                  activeOpacity={0.7}
                  onPress={() => handleCall(user.phone)}
                >
                  <Text style={styles.heroPhone}>📞 {user.phone}</Text>
                  <View style={styles.heroPhoneCallPill}>
                    <Text style={styles.heroPhoneCallPillText}>Call</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
              {user.city ? (
                <Text style={styles.heroLocation}>
                  📍 {user.city}
                  {user.state ? `, ${user.state}` : ''}
                  {user.pincode ? ` - ${user.pincode}` : ''}
                </Text>
              ) : null}
            </View>
          </View>


          {/* Linked Hospital Banner in Hero */}
          {user.hospital?.name ? (
            <TouchableOpacity
              style={styles.heroHospitalBanner}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('HospitalDetail', { hospital: user.hospital })}
            >
              <View style={styles.heroHospitalLeft}>
                <Text style={styles.heroHospitalIcon}>🏥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroHospitalTitle}>Associated Hospital Partner</Text>
                  <Text style={styles.heroHospitalName} numberOfLines={1}>{user.hospital.name}</Text>
                </View>
              </View>
              <View style={styles.heroHospitalArrowBadge}>
                <Text style={styles.heroHospitalArrowText}>View Details ➔</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {/* User ID & Registration Date Row */}
          <View style={styles.heroMetaRow}>
            <TouchableOpacity style={styles.uidPill} onPress={handleCopyUid}>
              <Text style={styles.uidText}>
                UID: CBC-USER-{String(user.id).padStart(5, '0')} {copied ? '✓' : '📋'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.joinDateText}>
              Joined: {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.actionsBar}>
          <TouchableOpacity style={styles.primaryActionBtn} onPress={handleOpenEditModal}>
            <Text style={styles.primaryActionBtnText}>✏️ Edit User</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryActionBtn, isActive ? styles.deactBtn : styles.actBtn]}
            onPress={handleToggleStatus}
          >
            <Text style={[styles.secondaryActionBtnText, isActive ? styles.deactText : styles.actText]}>
              {isActive ? '⏸️ Deactivate' : '▶️ Activate'}
            </Text>
          </TouchableOpacity>

          {user.role !== 'SUPER_ADMIN' && (
            <TouchableOpacity style={styles.deleteActionBtn} onPress={handleDeleteUser}>
              <Text style={styles.deleteActionBtnText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* KPI Metrics */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TOTAL ENQUIRIES</Text>
            <Text style={[styles.kpiValue, { color: colors.primary }]}>{stats.totalEnquiries}</Text>
            <Text style={styles.kpiSub}>Submitted queries</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>HOSPITALS CONTACTED</Text>
            <Text style={[styles.kpiValue, { color: '#4F46E5' }]}>{stats.totalHospitalsContacted}</Text>
            <Text style={styles.kpiSub}>Partner clinics reached</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ACTIVE CONSULTATIONS</Text>
            <Text style={[styles.kpiValue, { color: '#D97706' }]}>{stats.activeEnquiries}</Text>
            <Text style={styles.kpiSub}>In progress / pending</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>APPOINTMENTS</Text>
            <Text style={[styles.kpiValue, { color: '#16A34A' }]}>{stats.convertedEnquiries}</Text>
            <Text style={styles.kpiSub}>Confirmed / Done</Text>
          </View>
        </View>

        {/* Segmented Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'queries' && styles.tabItemActive]}
            onPress={() => setActiveTab('queries')}
          >
            <Text style={[styles.tabItemText, activeTab === 'queries' && styles.tabItemTextActive]}>
              💬 Queries ({leads.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'hospitals' && styles.tabItemActive]}
            onPress={() => setActiveTab('hospitals')}
          >
            <Text style={[styles.tabItemText, activeTab === 'hospitals' && styles.tabItemTextActive]}>
              🏥 Hospitals ({contactedHospitals.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={[styles.tabItemText, activeTab === 'profile' && styles.tabItemTextActive]}>
              📋 Profile Info
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: Consultations & Queries */}
        {activeTab === 'queries' && (
          <View style={styles.tabContentSection}>
            {leads.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <Text style={styles.emptyTabIcon}>📝</Text>
                <Text style={styles.emptyTabTitle}>No Enquiries Submitted</Text>
                <Text style={styles.emptyTabSub}>This user has not submitted any hospital consultation requests yet.</Text>
              </View>
            ) : (
              leads.map((lead) => {
                const leadStatus = getLeadStatusBadge(lead.status);
                const hospital = lead.hospital;
                const service = lead.service;
                const hasNotes = lead.notes && lead.notes.length > 0;

                return (
                  <View key={lead.id} style={styles.leadCard}>
                    <View style={styles.leadCardHeader}>
                      <TouchableOpacity
                        style={styles.leadHospitalInfo}
                        activeOpacity={hospital ? 0.7 : 1}
                        onPress={() => hospital && navigation.navigate('HospitalDetail', { hospital })}
                      >
                        <Text style={styles.leadHospitalName}>
                          {hospital?.name || 'General Consultation'} {hospital ? '➔' : ''}
                        </Text>
                        {hospital?.city ? (
                          <Text style={styles.leadHospitalLocation}>
                            📍 {hospital.city}{hospital.state ? `, ${hospital.state}` : ''}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                      <View style={[styles.leadStatusBadge, { backgroundColor: leadStatus.bg }]}>
                        <Text style={[styles.leadStatusText, { color: leadStatus.text }]}>
                          {leadStatus.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.leadDetailsGrid}>
                      <View style={styles.leadDetailBlock}>
                        <Text style={styles.leadDetailLabel}>MEDICAL SPECIALTY</Text>
                        <Text style={styles.leadDetailValue}>{service?.name || 'General Medical Consultation'}</Text>
                        {lead.preferredContactTime ? (
                          <Text style={styles.leadPreferredTime}>
                            Preferred: {lead.preferredContactTime}
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.leadDetailBlock}>
                        <Text style={styles.leadDetailLabel}>CONTACT DETAILS</Text>
                        <Text style={styles.leadDetailValue}>{lead.patientName}</Text>
                        <Text style={styles.leadContactSub}>{lead.phone}</Text>
                      </View>
                    </View>

                    {lead.message ? (
                      <View style={styles.leadMessageBox}>
                        <Text style={styles.leadMessageLabel}>PATIENT QUERY MESSAGE</Text>
                        <Text style={styles.leadMessageText}>&quot;{lead.message}&quot;</Text>
                      </View>
                    ) : null}

                    {/* Hospital Actions - View Details on Top, Call Hospital Below */}
                    <View style={styles.leadActionButtonsCol}>
                      {hospital ? (
                        <TouchableOpacity
                          style={styles.viewLeadHospitalBtn}
                          activeOpacity={0.7}
                          onPress={() => navigation.navigate('HospitalDetail', { hospital })}
                        >
                          <Text style={styles.viewLeadHospitalBtnText}>🏥 View Hospital Details ➔</Text>
                        </TouchableOpacity>
                      ) : null}

                      {hospital?.phone ? (
                        <TouchableOpacity
                          style={styles.callHospitalBtn}
                          activeOpacity={0.7}
                          onPress={() => handleCall(hospital.phone)}
                        >
                          <Text style={styles.callHospitalBtnText}>📞 Call Hospital ({hospital.phone})</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {hasNotes && (
                      <View style={styles.notesContainer}>
                        <Text style={styles.notesTitle}>💬 Coordinator Notes ({lead.notes!.length})</Text>
                        {lead.notes!.map((note, idx) => (
                          <View key={idx} style={styles.noteItem}>
                            <View style={styles.noteTop}>
                              <Text style={styles.noteAuthor}>{note.author || 'Medical Staff'}</Text>
                              <Text style={styles.noteDate}>
                                {new Date(note.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </Text>
                            </View>
                            <Text style={styles.noteContent}>{note.content}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.leadFooter}>
                      <Text style={styles.leadFooterText}>
                        Lead #{lead.id} • {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 2: Associated Hospitals */}
        {activeTab === 'hospitals' && (
          <View style={styles.tabContentSection}>
            {contactedHospitals.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <Text style={styles.emptyTabIcon}>🏥</Text>
                <Text style={styles.emptyTabTitle}>No Associated Hospitals</Text>
                <Text style={styles.emptyTabSub}>This user has not established any hospital relationships or enquiries.</Text>
              </View>
            ) : (
              contactedHospitals.map((h) => (
                <View key={h.id} style={styles.hospitalCard}>
                  <TouchableOpacity
                    style={styles.hospitalCardTop}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('HospitalDetail', { hospital: h })}
                  >
                    <View style={styles.hospitalAvatar}>
                      <Text style={styles.hospitalAvatarText}>🏥</Text>
                    </View>
                    <View style={styles.hospitalInfo}>
                      <Text style={styles.hospitalName}>{h.name}</Text>
                      {h.city ? (
                        <Text style={styles.hospitalCity}>
                          📍 {h.city}{h.state ? `, ${h.state}` : ''}
                        </Text>
                      ) : null}
                      {h.rating ? (
                        <Text style={styles.hospitalRating}>⭐ {h.rating} Rating</Text>
                      ) : null}
                    </View>
                    <View style={styles.cardArrow}>
                      <Text style={styles.cardArrowText}>➔</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.hospitalStatsRow}>
                    <View style={styles.hospitalStat}>
                      <Text style={styles.hospitalStatLabel}>Total Queries</Text>
                      <Text style={styles.hospitalStatValue}>{h.enquiryCount || 1}</Text>
                    </View>
                    {h.phone ? (
                      <TouchableOpacity
                        style={styles.hospitalStat}
                        activeOpacity={0.7}
                        onPress={() => handleCall(h.phone)}
                      >
                        <Text style={styles.hospitalStatLabel}>Phone (Tap to Call)</Text>
                        <Text style={styles.hospitalStatValuePhone}>📞 {h.phone}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Hospital Actions - View Profile on Top, Call Button Below */}
                  <View style={styles.hospitalActionButtonsCol}>
                    <TouchableOpacity
                      style={styles.hospitalDetailActionBtn}
                      activeOpacity={0.7}
                      onPress={() => navigation.navigate('HospitalDetail', { hospital: h })}
                    >
                      <Text style={styles.hospitalDetailActionBtnText}>🏥 View Hospital Profile ➔</Text>
                    </TouchableOpacity>

                    {h.phone ? (
                      <TouchableOpacity
                        style={styles.hospitalCallBtn}
                        activeOpacity={0.7}
                        onPress={() => handleCall(h.phone)}
                      >
                        <Text style={styles.hospitalCallBtnText}>📞 Call Hospital ({h.phone})</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        )}


        {/* TAB 3: Full Profile Info */}
        {activeTab === 'profile' && (
          <View style={styles.tabContentSection}>
            <View style={styles.profileSectionCard}>
              <Text style={styles.profileSectionTitle}>User Identity & Security Details</Text>

              <View style={styles.profileRow}>
                <Text style={styles.profileFieldLabel}>Full Name</Text>
                <Text style={styles.profileFieldValue}>{user.name || 'Not provided'}</Text>
              </View>

              <View style={styles.profileRow}>
                <Text style={styles.profileFieldLabel}>Email Address</Text>
                <Text style={styles.profileFieldValue}>{user.email}</Text>
              </View>

              <View style={styles.profileRow}>
                <Text style={styles.profileFieldLabel}>Phone Number</Text>
                <Text style={styles.profileFieldValue}>{user.phone || 'Not provided'}</Text>
              </View>

              <View style={styles.profileRow}>
                <Text style={styles.profileFieldLabel}>Account Role</Text>
                <Text style={styles.profileFieldValue}>{user.role}</Text>
              </View>

              <View style={styles.profileRow}>
                <Text style={styles.profileFieldLabel}>Account Status</Text>
                <Text style={styles.profileFieldValue}>{user.status}</Text>
              </View>

              {user.hospital?.name ? (
                <TouchableOpacity
                  style={styles.profileHospitalTouchableRow}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('HospitalDetail', { hospital: user.hospital })}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.profileFieldLabel}>Linked Hospital Partner</Text>
                    <Text style={styles.profileHospitalNameText}>🏥 {user.hospital.name}</Text>
                    {user.hospital.city ? (
                      <Text style={styles.profileHospitalCityText}>
                        📍 {user.hospital.city}{user.hospital.state ? `, ${user.hospital.state}` : ''}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.viewHospitalDetailPill}>
                    <Text style={styles.viewHospitalDetailPillText}>View Details ➔</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>


            <View style={styles.profileSectionCard}>
              <Text style={styles.profileSectionTitle}>Residential & Location Record</Text>

              <View style={styles.profileRow}>
                <Text style={styles.profileFieldLabel}>Street Address</Text>
                <Text style={styles.profileFieldValue}>{user.address || 'Not provided'}</Text>
              </View>

              <View style={styles.profileRow}>
                <Text style={styles.profileFieldLabel}>City</Text>
                <Text style={styles.profileFieldValue}>{user.city || 'Not provided'}</Text>
              </View>

              <View style={styles.profileRow}>
                <Text style={styles.profileFieldLabel}>State</Text>
                <Text style={styles.profileFieldValue}>{user.state || 'Not provided'}</Text>
              </View>

              <View style={styles.profileRow}>
                <Text style={styles.profileFieldLabel}>Pincode</Text>
                <Text style={styles.profileFieldValue}>{user.pincode || 'Not provided'}</Text>
              </View>

              <View style={styles.profileRow}>
                <Text style={styles.profileFieldLabel}>Registration Date</Text>
                <Text style={styles.profileFieldValue}>
                  {new Date(user.createdAt).toLocaleString('en-IN')}
                </Text>
              </View>

              {user.updatedAt ? (
                <View style={styles.profileRow}>
                  <Text style={styles.profileFieldLabel}>Last Updated</Text>
                  <Text style={styles.profileFieldValue}>
                    {new Date(user.updatedAt).toLocaleString('en-IN')}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Edit User Modal */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Edit User Profile</Text>
            <TouchableOpacity onPress={handleSaveEdit} disabled={saving}>
              <Text style={[styles.modalDoneText, saving && { opacity: 0.5 }]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Role Picker */}
            <Text style={styles.formLabel}>User Role</Text>
            <View style={styles.rolePickerRow}>
              {(['PATIENT', 'HOSPITAL', 'ADMIN', 'SUPER_ADMIN'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleOption, editRole === r && styles.roleOptionActive]}
                  onPress={() => setEditRole(r)}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      editRole === r && styles.roleOptionTextActive,
                    ]}
                  >
                    {r === 'SUPER_ADMIN' ? 'SUPER' : r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status Picker */}
            <Text style={styles.formLabel}>Account Status</Text>
            <View style={styles.rolePickerRow}>
              {(['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.roleOption, editStatus === s && styles.roleOptionActive]}
                  onPress={() => setEditStatus(s)}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      editStatus === s && styles.roleOptionTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Hospital Picker when Role is HOSPITAL */}
            {editRole === 'HOSPITAL' && hospitalsList.length > 0 && (
              <View style={styles.hospitalPickerSection}>
                <Text style={styles.formLabel}>Assign to Hospital Partner</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hospitalScroll}>
                  {hospitalsList.map((h) => (
                    <TouchableOpacity
                      key={h.id}
                      style={[
                        styles.hospitalChip,
                        editHospitalId === String(h.id) && styles.hospitalChipActive,
                      ]}
                      onPress={() => setEditHospitalId(String(h.id))}
                    >
                      <Text
                        style={[
                          styles.hospitalChipText,
                          editHospitalId === String(h.id) && styles.hospitalChipTextActive,
                        ]}
                      >
                        🏥 {h.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.formLabel}>Full Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Full Name"
              placeholderTextColor={colors.textMuted}
              value={editName}
              onChangeText={setEditName}
            />


            <Text style={styles.formLabel}>Phone Number</Text>
            <TextInput
              style={styles.formInput}
              placeholder="+91 9876543210"
              placeholderTextColor={colors.textMuted}
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.formLabel}>City</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Chandigarh"
              placeholderTextColor={colors.textMuted}
              value={editCity}
              onChangeText={setEditCity}
            />

            <Text style={styles.formLabel}>State</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Punjab"
              placeholderTextColor={colors.textMuted}
              value={editState}
              onChangeText={setEditState}
            />

            <Text style={styles.formLabel}>Street Address</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Sector 17, Main Road"
              placeholderTextColor={colors.textMuted}
              value={editAddress}
              onChangeText={setEditAddress}
            />

            <Text style={styles.formLabel}>Pincode</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 160017"
              placeholderTextColor={colors.textMuted}
              value={editPincode}
              onChangeText={setEditPincode}
              keyboardType="number-pad"
            />

            <Text style={styles.formLabel}>Reset Password (Optional)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Leave blank to keep unchanged"
              placeholderTextColor={colors.textMuted}
              value={editPassword}
              onChangeText={setEditPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.saveSubmitBtn, saving && { opacity: 0.6 }]}
              onPress={handleSaveEdit}
              disabled={saving}
            >
              <Text style={styles.saveSubmitBtnText}>
                {saving ? 'Saving Changes...' : 'Save User Changes ✓'}
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
    backgroundColor: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  notFoundIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  goBackBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  goBackBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderColor: '#1E293B',
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#38BDF8',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerEditBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerEditBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  scrollContent: {
    backgroundColor: colors.background,
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: '#0F172A',
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarBox: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textWhite,
  },
  heroInfo: {
    flex: 1,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusActiveBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statusInactiveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusActiveText: {
    color: '#86EFAC',
  },
  statusInactiveText: {
    color: '#FCA5A5',
  },
  heroEmail: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 2,
  },
  heroPhoneTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroPhone: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '700',
  },
  heroPhoneCallPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  heroPhoneCallPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroLocation: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },

  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#1E293B',
  },
  uidPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  uidText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  joinDateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  actionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  primaryActionBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  deactBtn: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  actBtn: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  deactText: {
    color: '#B45309',
  },
  actText: {
    color: '#15803D',
  },
  deleteActionBtn: {
    width: 44,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteActionBtnText: {
    fontSize: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
  },
  tabItemText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabItemTextActive: {
    color: colors.textWhite,
  },
  tabContentSection: {
    paddingHorizontal: 16,
  },
  emptyTabBox: {
    backgroundColor: colors.surface,
    padding: 36,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyTabIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTabTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyTabSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  leadCard: {
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
  leadCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingBottom: 10,
    marginBottom: 10,
  },
  leadHospitalInfo: {
    flex: 1,
    marginRight: 8,
  },
  leadHospitalName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  leadHospitalLocation: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  leadStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  leadStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  leadDetailsGrid: {
    gap: 8,
    marginBottom: 10,
  },
  leadDetailBlock: {
    backgroundColor: colors.surfaceSecondary,
    padding: 10,
    borderRadius: 10,
  },
  leadDetailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 2,
  },
  leadDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  leadPreferredTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  leadContactSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  leadMessageBox: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  leadMessageLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  leadMessageText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  notesContainer: {

    backgroundColor: '#FAF5FF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B21A8',
    marginBottom: 6,
  },
  noteItem: {
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#9333EA',
  },
  noteTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  noteAuthor: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7E22CE',
  },
  noteDate: {
    fontSize: 9,
    color: colors.textMuted,
  },
  noteContent: {
    fontSize: 11,
    color: colors.textPrimary,
  },
  leadFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  leadFooterText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  hospitalCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  hospitalCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hospitalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hospitalAvatarText: {
    fontSize: 20,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  hospitalCity: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  hospitalRating: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
    marginTop: 2,
  },
  hospitalStatsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    padding: 10,
    borderRadius: 10,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  hospitalStat: {
    flex: 1,
  },
  hospitalStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  hospitalStatValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  hospitalStatValuePhone: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  heroHospitalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  heroHospitalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  heroHospitalIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  heroHospitalTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7DD3FC',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroHospitalName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F0F9FF',
    marginTop: 1,
  },
  heroHospitalArrowBadge: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  heroHospitalArrowText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  leadActionButtonsCol: {
    gap: 8,
    marginBottom: 10,
  },
  viewLeadHospitalBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  viewLeadHospitalBtnText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '800',
  },

  callHospitalBtn: {
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
  },
  callHospitalBtnText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '800',
  },
  cardArrow: {
    paddingHorizontal: 6,
  },
  cardArrowText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '800',
  },
  hospitalActionButtonsCol: {
    gap: 8,
  },
  hospitalDetailActionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  hospitalDetailActionBtnText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '800',
  },
  hospitalCallBtn: {
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
  },
  hospitalCallBtnText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '800',
  },

  profileHospitalTouchableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginVertical: 4,
  },
  profileHospitalNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
    marginTop: 2,
  },
  profileHospitalCityText: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 1,
  },
  viewHospitalDetailPill: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewHospitalDetailPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textWhite,
  },
  profileSectionCard: {

    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  profileSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingBottom: 8,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  profileFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  profileFieldValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
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
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleOptionText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  roleOptionTextActive: {
    color: colors.textWhite,
  },
  hospitalPickerSection: {
    marginTop: 4,
    marginBottom: 4,
  },
  hospitalScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  hospitalChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hospitalChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  hospitalChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hospitalChipTextActive: {
    color: colors.textWhite,
  },

  formInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveSubmitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  saveSubmitBtnText: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },
});

