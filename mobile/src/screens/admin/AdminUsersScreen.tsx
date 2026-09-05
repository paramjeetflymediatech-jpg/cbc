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
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { AdminUserItem, AdminHospitalItem } from '../../types/admin';

interface AdminUsersScreenProps {
  navigation: any;
}

const ROLE_FILTERS = ['ALL', 'PATIENT', 'ADMIN', 'SUPER_ADMIN'];

export const AdminUsersScreen: React.FC<AdminUsersScreenProps> = ({ navigation }) => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [hospitals, setHospitals] = useState<AdminHospitalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  // Add User Modal State
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [adding, setAdding] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'PATIENT' | 'ADMIN' | 'SUPER_ADMIN'>('PATIENT');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [hospitalId, setHospitalId] = useState<string>('');

  // Edit User Modal State
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editRole, setEditRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'PATIENT'>('PATIENT');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [editCity, setEditCity] = useState<string>('');
  const [editState, setEditState] = useState<string>('');
  const [editAddress, setEditAddress] = useState<string>('');
  const [editPincode, setEditPincode] = useState<string>('');
  const [editHospitalId, setEditHospitalId] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');

  const fetchUsers = useCallback(async () => {
    try {
      const [usersRes, hospitalsRes] = await Promise.allSettled([
        api.get('/admin/users?limit=100'),
        api.get('/admin/hospitals'),
      ]);

      if (usersRes.status === 'fulfilled' && usersRes.value?.data?.users) {
        setUsers(usersRes.value.data.users);
      }
      if (hospitalsRes.status === 'fulfilled' && hospitalsRes.value?.data?.hospitals) {
        setHospitals(hospitalsRes.value.data.hospitals);
      }
    } catch (err) {
      console.log('Error fetching admin users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const resetAddForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('PATIENT');
    setStatus('ACTIVE');
    setCity('');
    setState('');
    setAddress('');
    setPincode('');
    setHospitalId('');
  };

  const handleOpenAddModal = () => {
    resetAddForm();
    setAddModalVisible(true);
  };

  const handleCreateUser = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Full Name, Email Address, and Initial Password are required.');
      return;
    }

    try {
      setAdding(true);
      const res = await api.post('/admin/users', {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password.trim(),
        role,
        status,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        address: address.trim() || undefined,
        pincode: pincode.trim() || undefined,
        hospitalId: hospitalId ? Number(hospitalId) : undefined,
      });

      if (res.data?.success) {
        setAddModalVisible(false);
        resetAddForm();
        Alert.alert('Success', 'User created successfully.');
        fetchUsers();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to create user.');
    } finally {
      setAdding(false);
    }
  };

  const handleOpenEditModal = (user: AdminUserItem) => {
    setSelectedUser(user);
    setEditName(user.name || '');
    setEditPhone(user.phone || '');
    setEditRole(user.role === 'HOSPITAL' ? 'PATIENT' : (user.role || 'PATIENT'));
    setEditStatus(user.status || 'ACTIVE');
    setEditCity(user.city || '');
    setEditState(user.state || '');
    setEditAddress(user.address || '');
    setEditPincode(user.pincode || '');
    setEditHospitalId(user.hospitalId ? String(user.hospitalId) : '');
    setEditPassword('');
    setEditModalVisible(true);
  };

  const handleSaveEditUser = async () => {
    if (!selectedUser) return;
    if (!editName.trim()) {
      Alert.alert('Required Field', 'Full Name is required.');
      return;
    }

    try {
      setEditing(true);
      const res = await api.put('/admin/users', {
        id: selectedUser.id,
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
        Alert.alert('Success', 'User details updated successfully.');
        fetchUsers();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update user.');
    } finally {
      setEditing(false);
    }
  };

  const handleToggleUserStatus = (user: AdminUserItem) => {
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
                setUsers((prev) =>
                  prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
                );
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


  const handleCall = async (phoneNumber?: string) => {
    if (!phoneNumber || !phoneNumber.trim()) {
      Alert.alert('No Phone', 'No contact phone number is available for this user.');
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

  const handleDeleteUser = (user: AdminUserItem) => {
    if (user.role === 'SUPER_ADMIN') {
      Alert.alert('Protected', 'Super Admin accounts cannot be deleted.');
      return;
    }
    Alert.alert(
      'Delete User',
      `Permanently delete account for "${user.email}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/users?id=${user.id}`);
              fetchUsers();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to delete user.');
            }
          },
        },
      ]
    );
  };


  const filtered = users.filter((u) => {
    // Only show user accounts (exclude hospital partner accounts)
    if (u.role === 'HOSPITAL') return false;

    const matchRole = selectedRole === 'ALL' || u.role === selectedRole;
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.city?.toLowerCase().includes(q);

    return matchRole && matchSearch;
  });

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'SUPER_ADMIN': return { bg: '#FDF2F8', text: '#BE185D', label: 'SUPER ADMIN' };
      case 'ADMIN': return { bg: '#F3E8FF', text: '#7E22CE', label: 'STAFF ADMIN' };
      case 'HOSPITAL': return { bg: '#EFF6FF', text: '#1D4ED8', label: 'HOSPITAL' };
      default: return { bg: '#F1F5F9', text: '#475569', label: 'PATIENT' };
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
        <Text style={styles.headerTitle}>User Directory</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddModal}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name, email, phone, city..."
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

      {/* Role Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {ROLE_FILTERS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.filterPill, selectedRole === r && styles.filterPillActive]}
              onPress={() => setSelectedRole(r)}
            >
              <Text style={[styles.filterPillText, selectedRole === r && styles.filterPillTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading user directory...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptySub}>No user accounts match your filters.</Text>
            </View>
          ) : (
            filtered.map((user) => {
              const roleBadge = getRoleBadge(user.role);
              const isActive = user.status === 'ACTIVE';

              return (
                <TouchableOpacity
                  key={user.id}
                  style={styles.userCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('AdminUserDetail', { userId: user.id, userName: user.name })}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.nameCol}>
                      <Text style={styles.userName}>{user.name || 'Unnamed User'}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                    </View>

                    <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
                      <Text style={[styles.roleBadgeText, { color: roleBadge.text }]}>
                        {roleBadge.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    {user.phone ? (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleCall(user.phone);
                        }}
                      >
                        <Text style={styles.phoneText}>📞 {user.phone}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.phoneText}>📞 No phone</Text>
                    )}
                    <View style={[styles.statusPill, isActive ? styles.statusActive : styles.statusInactive]}>
                      <Text style={[styles.statusPillText, isActive ? styles.statusActiveText : styles.statusInactiveText]}>
                        {user.status}
                      </Text>
                    </View>
                  </View>


                  {user.city ? (
                    <Text style={styles.locationText}>
                      📍 {user.city}{user.state ? `, ${user.state}` : ''}
                    </Text>
                  ) : null}

                  {user.hospital?.name ? (
                    <TouchableOpacity
                      style={styles.hospitalLinkedBtn}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        navigation.navigate('HospitalDetail', { hospital: user.hospital });
                      }}
                    >
                      <Text style={styles.hospitalLinked}>🏥 Linked: {user.hospital.name} ➔</Text>
                    </TouchableOpacity>
                  ) : null}

                  {/* Badges / Metrics */}

                  <View style={styles.statsMiniRow}>
                    <View style={styles.uidBadge}>
                      <Text style={styles.uidBadgeText}>UID: #{user.id}</Text>
                    </View>
                    {user.leadCount !== undefined && user.leadCount > 0 ? (
                      <View style={styles.leadCountBadge}>
                        <Text style={styles.leadCountBadgeText}>📋 {user.leadCount} Enquiries</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Actions */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.viewDetailBtn}
                      onPress={() => navigation.navigate('AdminUserDetail', { userId: user.id, userName: user.name })}
                    >
                      <Text style={styles.viewDetailBtnText}>👁️ View Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => handleOpenEditModal(user)}
                    >
                      <Text style={styles.editBtnText}>✏️ Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.statusToggleBtn, isActive ? styles.deactivateBtn : styles.activateBtn]}
                      onPress={() => handleToggleUserStatus(user)}
                    >
                      <Text style={[styles.statusToggleBtnText, isActive ? styles.deactivateBtnText : styles.activateBtnText]}>
                        {isActive ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>

                    {user.role !== 'SUPER_ADMIN' && (
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteUser(user)}
                      >
                        <Text style={styles.deleteBtnText}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ======================================================== */}
      {/* ADD USER MODAL (With all fields) */}
      {/* ======================================================== */}
      <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Create New User</Text>
            <TouchableOpacity onPress={handleCreateUser} disabled={adding}>
              <Text style={[styles.modalDoneText, adding && { opacity: 0.5 }]}>
                {adding ? 'Saving...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* User Role */}
            <Text style={styles.formLabel}>User Role *</Text>
            <View style={styles.rolePickerRow}>
              {(['PATIENT', 'ADMIN', 'SUPER_ADMIN'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleOption, role === r && styles.roleOptionActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleOptionText, role === r && styles.roleOptionTextActive]}>
                    {r === 'SUPER_ADMIN' ? 'SUPER' : r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Account Status */}
            <Text style={styles.formLabel}>Account Status *</Text>
            <View style={styles.rolePickerRow}>
              {(['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.roleOption, status === s && styles.roleOptionActive]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.roleOptionText, status === s && styles.roleOptionTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Full Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. John Doe"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.formLabel}>Email Address *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="user@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.formLabel}>Initial Password *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Min 6 characters"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={styles.formLabel}>Phone Number</Text>
            <TextInput
              style={styles.formInput}
              placeholder="+91 9876543210"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.formLabel}>City</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Chandigarh"
              placeholderTextColor={colors.textMuted}
              value={city}
              onChangeText={setCity}
            />

            <Text style={styles.formLabel}>State</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Punjab"
              placeholderTextColor={colors.textMuted}
              value={state}
              onChangeText={setState}
            />

            <Text style={styles.formLabel}>Street Address</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Sector 17, Main Road"
              placeholderTextColor={colors.textMuted}
              value={address}
              onChangeText={setAddress}
            />

            <Text style={styles.formLabel}>Pincode</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 160017"
              placeholderTextColor={colors.textMuted}
              value={pincode}
              onChangeText={setPincode}
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={[styles.saveSubmitBtn, adding && { opacity: 0.6 }]}
              onPress={handleCreateUser}
              disabled={adding}
            >
              <Text style={styles.saveSubmitBtnText}>
                {adding ? 'Creating User...' : 'Create Account ✓'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ======================================================== */}
      {/* EDIT USER MODAL (With all fields) */}
      {/* ======================================================== */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Edit User</Text>
            <TouchableOpacity onPress={handleSaveEditUser} disabled={editing}>
              <Text style={[styles.modalDoneText, editing && { opacity: 0.5 }]}>
                {editing ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.formLabel}>User Role</Text>
            <View style={styles.rolePickerRow}>
              {(['PATIENT', 'ADMIN', 'SUPER_ADMIN'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleOption, editRole === r && styles.roleOptionActive]}
                  onPress={() => setEditRole(r)}
                >
                  <Text style={[styles.roleOptionText, editRole === r && styles.roleOptionTextActive]}>
                    {r === 'SUPER_ADMIN' ? 'SUPER' : r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Account Status</Text>
            <View style={styles.rolePickerRow}>
              {(['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.roleOption, editStatus === s && styles.roleOptionActive]}
                  onPress={() => setEditStatus(s)}
                >
                  <Text style={[styles.roleOptionText, editStatus === s && styles.roleOptionTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Full Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. John Doe"
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

            <Text style={styles.formLabel}>Change Password (Optional)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Leave empty to keep current password"
              placeholderTextColor={colors.textMuted}
              value={editPassword}
              onChangeText={setEditPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.saveSubmitBtn, editing && { opacity: 0.6 }]}
              onPress={handleSaveEditUser}
              disabled={editing}
            >
              <Text style={styles.saveSubmitBtnText}>
                {editing ? 'Updating User...' : 'Save User Changes ✓'}
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
  userCard: {
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
    marginBottom: 6,
  },
  nameCol: {
    flex: 1,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  phoneText: {
    fontSize: 12,
    color: colors.textSecondary,
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
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusActiveText: {
    color: '#15803D',
  },
  statusInactiveText: {
    color: '#DC2626',
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  hospitalLinkedBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 6,
  },
  hospitalLinked: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '800',
  },

  statsMiniRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  uidBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  uidBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  leadCountBadge: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  leadCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7E22CE',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: 10,
  },
  viewDetailBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textWhite,
  },
  editBtn: {
    flex: 1.2,
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusToggleBtn: {
    flex: 1.5,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusToggleBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  deactivateBtn: {
    backgroundColor: '#FEF3C7',
  },
  deactivateBtnText: {
    color: '#B45309',
  },
  activateBtn: {
    backgroundColor: '#DCFCE7',
  },
  activateBtnText: {
    color: '#15803D',
  },
  deleteBtn: {
    width: 34,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 13,
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
    marginTop: 12,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
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
