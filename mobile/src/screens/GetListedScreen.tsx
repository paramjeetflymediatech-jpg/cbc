import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import api from '../services/api';

interface GetListedScreenProps {
  navigation: any;
}

export const GetListedScreen: React.FC<GetListedScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState<number>(1);

  // Step 1: Hospital Details
  const [hospitalName, setHospitalName] = useState<string>('');
  const [hospitalType, setHospitalType] = useState<string>('Super Speciality Hospital');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [stateVal, setStateVal] = useState<string>('Maharashtra');
  const [description, setDescription] = useState<string>('');

  // Step 2: Contact, Credentials & Verification
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [contactPersonName, setContactPersonName] = useState<string>('');
  const [contactPersonPhone, setContactPersonPhone] = useState<string>('');
  const [website, setWebsite] = useState<string>('');

  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // Fetch platform services for specialty selection
    api.get('/services')
      .then((res) => {
        if (res.data?.services && Array.isArray(res.data.services)) {
          setAvailableServices(res.data.services);
        }
      })
      .catch(() => {});
  }, []);

  const toggleService = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleNextStep = () => {
    if (!hospitalName.trim() || !city.trim() || !address.trim()) {
      Alert.alert('Required Fields', 'Please enter Hospital Name, City, and Full Address.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!phone.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Official Phone, Login Email, and Account Password are required.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password Length', 'Password must be at least 6 characters long.');
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const finalDescription = description.trim() || `${hospitalType} providing accredited patient healthcare and clinical surgeries in ${city}.`;

    try {
      setSubmitting(true);
      const res = await api.post('/hospitals/register', {
        hospitalName: hospitalName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        password: password.trim(),
        address: address.trim(),
        city: city.trim(),
        state: stateVal.trim() || 'Maharashtra',
        country: 'India',
        description: finalDescription,
        website: website.trim() || null,
        contactPersonName: contactPersonName.trim() || hospitalName.trim(),
        contactPersonPhone: contactPersonPhone.trim() || phone.trim(),
        contactPersonEmail: cleanEmail,
        services: selectedServices,
      });

      if (res.status === 201 || res.data?.hospitalId || res.data?.message) {
        Alert.alert(
          'Registration Submitted! 🎉',
          'Your hospital onboarding application has been submitted successfully to Clinic By Choice. Our team will verify your hospital and activate your dashboard access shortly.',
          [
            {
              text: 'Go to Sign In',
              onPress: () => navigation.navigate('Auth'),
            },
            {
              text: 'Home',
              onPress: () => navigation.navigate('Main'),
            },
          ]
        );
      } else {
        Alert.alert('Registration Failed', res.data?.error || 'Unable to register hospital.');
      }
    } catch (err: any) {
      console.log('Hospital registration error:', err?.response?.data || err.message);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (err.message?.includes('Network') ? 'Network error: Cannot reach server.' : 'Registration failed. Please check details and try again.');
      Alert.alert('Registration Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hospital Registration</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Section */}
        <View style={styles.banner}>
          <Text style={styles.bannerTag}>PARTNER WITH CLINIC BY CHOICE</Text>
          <Text style={styles.bannerTitle}>Grow Your Healthcare Practice</Text>
          <Text style={styles.bannerSubtitle}>
            Connect with patients actively seeking accredited hospitals and specialist care in India.
          </Text>

          <View style={styles.benefitsGrid}>
            {[
              '✓ Direct patient consultation enquiries',
              '✓ Dedicated Hospital Management Mobile Portal',
              '✓ Showcase specialists & treatment capabilities',
              '✓ Verified partner badge on Clinic By Choice',
            ].map((b, idx) => (
              <Text key={idx} style={styles.benefitText}>
                {b}
              </Text>
            ))}
          </View>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step === 1 ? styles.stepDotActive : styles.stepDotDone]}>
            <Text style={styles.stepDotText}>{step > 1 ? '✓' : '1'}</Text>
          </View>
          <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step === 2 && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, step < 2 && { color: colors.textMuted }]}>2</Text>
          </View>
        </View>

        {/* Multi-Step Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {step === 1 ? '1. Hospital Details' : '2. Account Credentials & Contact'}
          </Text>

          {step === 1 ? (
            <View style={styles.fieldsWrap}>
              <Text style={styles.inputLabel}>Hospital / Clinic Name *</Text>
              <TextInput
                style={styles.textInput}
                value={hospitalName}
                onChangeText={setHospitalName}
                placeholder="e.g. Apollo Multi-Specialty Hospital"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Facility Category</Text>
              <View style={styles.typeWrap}>
                {['Super Speciality Hospital', 'Multi Speciality Hospital', 'Specialized Clinic', 'Diagnostic Center'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typePill, hospitalType === type && styles.typePillActive]}
                    onPress={() => setHospitalType(type)}
                  >
                    <Text style={[styles.typeText, hospitalType === type && styles.typeTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={styles.textInput}
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Mumbai, Delhi, Chandigarh"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.textInput}
                value={stateVal}
                onChangeText={setStateVal}
                placeholder="e.g. Maharashtra, Punjab, Haryana"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Full Street Address *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Building, Sector / Area, Landmark, Pincode"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Brief Description / Specialties Overview</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Accredited hospital offering modern operation theaters, ICU, robotic surgery..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          ) : (
            <View style={styles.fieldsWrap}>
              <Text style={styles.inputLabel}>Official Hospital Contact Phone *</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+91 9876543210"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Portal Login Email Address *</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="partner@hospital.com"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Create Portal Password (Min. 6 chars) *</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Set your account password"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🔒'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Coordinator / Contact Person Name</Text>
              <TextInput
                style={styles.textInput}
                value={contactPersonName}
                onChangeText={setContactPersonName}
                placeholder="Full name (e.g. Dr. A. K. Sharma)"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Coordinator Direct Mobile Number</Text>
              <TextInput
                style={styles.textInput}
                value={contactPersonPhone}
                onChangeText={setContactPersonPhone}
                keyboardType="phone-pad"
                placeholder="+91 9876543210"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Hospital Website URL (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://myhospital.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />

              {availableServices.length > 0 && (
                <>
                  <Text style={styles.inputLabel}>Select Offered Specialties</Text>
                  <View style={styles.servicesGrid}>
                    {availableServices.slice(0, 8).map((s) => {
                      const isSelected = selectedServices.includes(Number(s.id));
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[styles.serviceChip, isSelected && styles.serviceChipActive]}
                          onPress={() => toggleService(Number(s.id))}
                        >
                          <Text style={[styles.serviceChipText, isSelected && styles.serviceChipTextActive]}>
                            {isSelected ? '✓ ' : '+ '}{s.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Form Actions */}
          <View style={styles.actionRow}>
            {step === 2 && (
              <TouchableOpacity
                style={styles.backStepBtn}
                onPress={() => setStep(1)}
                disabled={submitting}
              >
                <Text style={styles.backStepText}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={() => (step === 1 ? handleNextStep() : handleSubmit())}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <View style={styles.submittingRow}>
                  <ActivityIndicator size="small" color={colors.textWhite} style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Registering Hospital...</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>
                  {step === 1 ? 'Next: Credentials & Contact →' : 'Complete Hospital Registration ✓'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  banner: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
  },
  bannerTag: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textWhite,
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 14,
  },
  benefitsGrid: {
    gap: 6,
  },
  benefitText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textWhite,
  },
  stepLine: {
    width: 50,
    height: 3,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  fieldsWrap: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  textInput: {
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
    height: 75,
    textAlignVertical: 'top',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  eyeBtn: {
    paddingHorizontal: 12,
  },
  eyeIcon: {
    fontSize: 16,
  },
  typeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typePill: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typePillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  serviceChip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  serviceChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  serviceChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  backStepBtn: {
    flex: 0.35,
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  backStepText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    color: colors.textWhite,
    fontWeight: '800',
    fontSize: 14,
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
