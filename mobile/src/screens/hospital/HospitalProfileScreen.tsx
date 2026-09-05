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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { HospitalProfileData } from '../../types/hospital';
import { RichTextEditor } from '../../components/RichTextEditor';

interface HospitalProfileScreenProps {
  navigation: any;
}

export const HospitalProfileScreen: React.FC<HospitalProfileScreenProps> = ({ navigation }) => {
  const [hospital, setHospital] = useState<HospitalProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [stateVal, setStateVal] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [contactPersonName, setContactPersonName] = useState<string>('');
  const [contactPersonPhone, setContactPersonPhone] = useState<string>('');
  const [contactPersonEmail, setContactPersonEmail] = useState<string>('');
  const [syncingRating, setSyncingRating] = useState<boolean>(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/hospital/profile');
      if (res.data?.hospital) {
        const h: HospitalProfileData = res.data.hospital;
        setHospital(h);
        setName(h.name || '');
        setPhone(h.phone || '');
        setWebsite(h.website || '');
        setAddress(h.address || '');
        setCity(h.city || '');
        setStateVal(h.state || '');
        setDescription(h.description || '');
        setContactPersonName(h.contactPersonName || '');
        setContactPersonPhone(h.contactPersonPhone || '');
        setContactPersonEmail(h.contactPersonEmail || '');
      }
    } catch (err) {
      console.log('Error fetching hospital profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim() || !city.trim() || !address.trim()) {
      Alert.alert('Required Fields', 'Hospital Name, Phone, City, and Address are required.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.put('/hospital/profile', {
        name: name.trim(),
        phone: phone.trim(),
        website: website.trim() || null,
        address: address.trim(),
        city: city.trim(),
        state: stateVal.trim() || 'Maharashtra',
        description: description.trim() || null,
        contactPersonName: contactPersonName.trim() || null,
        contactPersonPhone: contactPersonPhone.trim() || null,
        contactPersonEmail: contactPersonEmail.trim() || null,
      });

      if (res.data?.hospital) {
        setHospital(res.data.hospital);
        Alert.alert('Success', 'Hospital details updated successfully.');
      }
    } catch (err: any) {
      Alert.alert('Update Failed', err?.response?.data?.error || 'Failed to update hospital profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncGoogleRating = async () => {
    try {
      setSyncingRating(true);
      const queryStr = `${name || hospital?.name} ${city || hospital?.city} ${stateVal || hospital?.state || ''}`.trim();
      const res = await api.post('/hospital/fetch-google-rating', {
        query: queryStr,
      });

      if (res.data) {
        const { googleRating, googleReviewsCount } = res.data;
        Alert.alert(
          'Google Rating Synced! ⭐',
          `Synced Live Google Rating:\n\n• Rating: ${googleRating} / 5.0 ⭐\n• Reviews: ${googleReviewsCount} Reviews`
        );
        fetchProfile();
      }
    } catch (err: any) {
      Alert.alert('Sync Failed', err?.response?.data?.error || 'Failed to sync Google rating and reviews.');
    } finally {
      setSyncingRating(false);
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
        <Text style={styles.headerTitle}>Hospital Details</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveHeaderBtnText, saving && { opacity: 0.5 }]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading hospital profile...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {/* Accreditation Card */}
          <View style={styles.partnerCard}>
            <View style={styles.partnerHeader}>
              <Text style={styles.partnerBadge}>🏥 Verified Partner Profile</Text>
              <Text style={styles.ratingBadge}>⭐ {hospital?.rating || 4.8} / 5.0</Text>
            </View>
            <Text style={styles.registeredEmail}>Login Email: {hospital?.email}</Text>
            <Text style={styles.accountStatus}>
              Account Status: <Text style={{ color: colors.success, fontWeight: '800' }}>{hospital?.status || 'APPROVED'}</Text>
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>General Information</Text>

            <Text style={styles.label}>Hospital / Clinic Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Apollo Multi-Specialty Hospital"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Official Contact Phone *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 9876543210"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Official Website URL</Text>
            <TextInput
              style={styles.input}
              value={website}
              onChangeText={setWebsite}
              placeholder="https://myhospital.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Full Street Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Sector, Building No, Landmark..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Mumbai"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  value={stateVal}
                  onChangeText={setStateVal}
                  placeholder="e.g. Maharashtra"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <Text style={styles.label}>Hospital Overview / Description</Text>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Summary of hospital infrastructure, specialties, awards..."
              minHeight={160}
            />

            {/* Google Rating & Reviews Sync Box */}
            <View style={styles.ratingCard}>
              <View style={styles.ratingHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ratingCardTitle}>Google Ratings & Reviews</Text>
                  <Text style={styles.ratingCardSub}>
                    ⭐ {hospital?.googleRating || hospital?.rating || '4.8'} / 5.0 ({hospital?.googleReviewsCount || 50} Reviews)
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.syncBtn, syncingRating && { opacity: 0.6 }]}
                  onPress={handleSyncGoogleRating}
                  disabled={syncingRating}
                >
                  {syncingRating ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.syncBtnText}>🔄 Auto-Fetch Rating</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Contact Person / Hospital Admin</Text>

            <Text style={styles.label}>Coordinator Name</Text>
            <TextInput
              style={styles.input}
              value={contactPersonName}
              onChangeText={setContactPersonName}
              placeholder="e.g. Dr. A. K. Gupta"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Coordinator Direct Phone</Text>
            <TextInput
              style={styles.input}
              value={contactPersonPhone}
              onChangeText={setContactPersonPhone}
              keyboardType="phone-pad"
              placeholder="+91 9876543210"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Coordinator Direct Email</Text>
            <TextInput
              style={styles.input}
              value={contactPersonEmail}
              onChangeText={setContactPersonEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="admin@myhospital.com"
              placeholderTextColor={colors.textMuted}
            />

            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.88}
            >
              <Text style={styles.submitBtnText}>
                {saving ? 'Saving Details...' : 'Update Hospital Profile ✓'}
              </Text>
            </TouchableOpacity>
          </View>
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
  saveHeaderBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  saveHeaderBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textWhite,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  partnerCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  partnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partnerBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  ratingBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FCD34D',
  },
  registeredEmail: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  accountStatus: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 75,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 18,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  submitBtnText: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },
  ratingCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  ratingCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  ratingCardSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
});
