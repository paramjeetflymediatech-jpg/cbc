import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface GetListedScreenProps {
  navigation: any;
}

export const GetListedScreen: React.FC<GetListedScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState<number>(1);

  // Form State
  const [hospitalName, setHospitalName] = useState<string>('');
  const [hospitalType, setHospitalType] = useState<string>('Super Speciality Hospital');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('Chandigarh');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [contactPersonName, setContactPersonName] = useState<string>('');
  const [docUploaded, setDocUploaded] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = () => {
    if (!hospitalName.trim() || !contactNumber.trim() || !contactPersonName.trim()) {
      Alert.alert('Required Fields', 'Please complete hospital name, contact number, and contact person details.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        'Submission Successful!',
        'Your hospital registration request has been received. Our provider partnership team will reach out for verification.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1200);
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
              '✓ Reach thousands of active patients',
              '✓ Receive qualified consultation requests',
              '✓ Showcase facilities & accredited doctors',
              '✓ Manage your hospital profile digitally',
            ].map((b, idx) => (
              <Text key={idx} style={styles.benefitText}>
                {b}
              </Text>
            ))}
          </View>
        </View>

        {/* Multi-Step Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {step === 1 ? '1. Hospital Information' : '2. Contact & Verification'}
          </Text>

          {step === 1 ? (
            <View style={styles.fieldsWrap}>
              <Text style={styles.inputLabel}>Hospital / Clinic Name *</Text>
              <TextInput
                style={styles.textInput}
                value={hospitalName}
                onChangeText={setHospitalName}
                placeholder="e.g. City General Hospital"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Hospital Category</Text>
              <View style={styles.typeWrap}>
                {['Super Speciality', 'Multi Speciality', 'Specialized Clinic'].map((type) => (
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

              <Text style={styles.inputLabel}>Full Address</Text>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Street address & landmark"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.textInput}
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Chandigarh, Mohali"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          ) : (
            <View style={styles.fieldsWrap}>
              <Text style={styles.inputLabel}>Official Contact Number *</Text>
              <TextInput
                style={styles.textInput}
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
                placeholder="Landline or mobile phone"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Official Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="contact@hospital.com"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Authorized Contact Person *</Text>
              <TextInput
                style={styles.textInput}
                value={contactPersonName}
                onChangeText={setContactPersonName}
                placeholder="Full name & designation"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>NABH / Medical License Document</Text>
              <TouchableOpacity
                style={[styles.uploadBox, docUploaded && styles.uploadBoxDone]}
                onPress={() => setDocUploaded(!docUploaded)}
              >
                <Text style={styles.uploadIcon}>{docUploaded ? '📄' : '📤'}</Text>
                <Text style={styles.uploadText}>
                  {docUploaded ? 'NABH_Accreditation_Certificate.pdf Attached ✓' : 'Upload Accreditation Certificate (PDF / JPG)'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Form Actions */}
          <View style={styles.actionRow}>
            {step === 2 && (
              <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(1)}>
                <Text style={styles.backStepText}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={() => (step === 1 ? setStep(2) : handleSubmit())}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'Submitting...' : step === 1 ? 'Next: Verification →' : 'Submit for Verification ✓'}
              </Text>
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
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  fieldsWrap: {
    gap: 6,
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
  uploadBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  uploadBoxDone: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
    borderStyle: 'solid',
  },
  uploadIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
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
    fontSize: 15,
  },
});
