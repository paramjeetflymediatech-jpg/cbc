import React, { useState, useEffect } from 'react';
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
import api from '../services/api';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

interface EnquiryScreenProps {
  navigation: any;
  route: any;
}

export const EnquiryScreen: React.FC<EnquiryScreenProps> = ({ navigation, route }) => {
  const { user, signup, addEnquiry } = useAuth();

  const initialService = route.params?.serviceName || 'Orthopaedics';
  const initialTreatment = route.params?.treatmentName || '';
  const preferredHospital = route.params?.preferredHospital || '';

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Dynamic dropdown lists from DB
  const [dbServices, setDbServices] = useState<{ id: number; name: string }[]>([]);
  const [dbHospitals, setDbHospitals] = useState<{ id: number; name: string; city: string }[]>([]);

  // Selected IDs
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(route.params?.serviceId ? Number(route.params.serviceId) : null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(route.params?.hospitalId ? Number(route.params.hospitalId) : null);
  const [selectedHospitalName, setSelectedHospitalName] = useState<string>(preferredHospital || 'General Health Desk');

  // Form State
  const [serviceName, setServiceName] = useState<string>(initialService);
  const [treatmentName, setTreatmentName] = useState<string>(initialTreatment);

  // Patient / Account Fields
  const [patientName, setPatientName] = useState<string>(user?.name || '');
  const [patientPhone, setPatientPhone] = useState<string>(user?.phone || '');
  const [patientEmail, setPatientEmail] = useState<string>(user?.email || '');
  const [accountPassword, setAccountPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [patientAge, setPatientAge] = useState<string>('45');
  const [patientGender, setPatientGender] = useState<string>('Male');
  const [preferredContactTime, setPreferredContactTime] = useState<string>('Morning (9 AM - 12 PM)');
  const [additionalMessage, setAdditionalMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const servicesList = ['Orthopaedics', 'IVF & Fertility', 'Cardiology', 'Oncology', 'Neurology', 'Dental Surgery', 'Dermatology'];
  const timeSlots = ['Morning (9 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)', 'Evening (4 PM - 7 PM)'];

  useEffect(() => {
    fetchInitData();
  }, []);

  const fetchInitData = async () => {
    try {
      const [servRes, hospRes] = await Promise.all([
        api.get('/services'),
        api.get('/hospitals'),
      ]);

      let servicesData: { id: number; name: string }[] = [];
      if (servRes.data && Array.isArray(servRes.data.services)) {
        servicesData = servRes.data.services.map((s: any) => ({ id: s.id, name: s.name }));
      }
      setDbServices(servicesData);

      let hospitalsData: { id: number; name: string; city: string }[] = [];
      if (hospRes.data && Array.isArray(hospRes.data.hospitals)) {
        hospitalsData = hospRes.data.hospitals.map((h: any) => ({ id: h.id, name: h.name, city: h.city }));
      }
      setDbHospitals(hospitalsData);

      // Auto-resolve Service ID
      if (route.params?.serviceId) {
        setSelectedServiceId(Number(route.params.serviceId));
      } else if (initialService) {
        const found = servicesData.find((s) => s.name.toLowerCase() === initialService.toLowerCase());
        if (found) setSelectedServiceId(found.id);
      }
      
      // Auto-resolve Hospital ID
      if (route.params?.hospitalId) {
        setSelectedHospitalId(Number(route.params.hospitalId));
      } else if (preferredHospital) {
        const found = hospitalsData.find((h) => h.name.toLowerCase() === preferredHospital.toLowerCase());
        if (found) {
          setSelectedHospitalId(found.id);
          setSelectedHospitalName(found.name);
        }
      }
    } catch (err) {
      console.log('Error loading dynamic dropdowns in Enquiry:', err);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !serviceName) {
      Alert.alert('Selection Required', 'Please select a healthcare service specialty.');
      return;
    }
    if (currentStep === 2) {
      if (!patientName.trim() || !patientEmail.trim() || !patientPhone.trim()) {
        Alert.alert('Required Fields', 'Please enter patient name, email address, and phone number.');
        return;
      }
      if (!user && !accountPassword.trim()) {
        Alert.alert('Password Required', 'Please create a password so you can log in to check your request status later.');
        return;
      }
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Auto-register account if user is not logged in
      if (!user && patientEmail.trim() && accountPassword.trim()) {
        await signup(patientName, patientEmail, accountPassword, patientPhone);
      }

      // Add enquiry to persistent storage under active user account
      const newLead = await addEnquiry({
        serviceName,
        treatmentName,
        patientName,
        patientPhone,
        patientEmail,
        patientAge,
        patientGender,
        preferredHospitalName: selectedHospitalName,
        preferredContactTime,
        additionalMessage,
      });

      // Post API enquiry call
      try {
        await api.post('/enquiries', {
          patientName: patientName.trim(),
          phone: patientPhone.trim(),
          email: patientEmail.trim(),
          city: user?.city || 'Mobile App',
          serviceId: selectedServiceId || 2, // Default to Orthopaedics (2)
          hospitalId: selectedHospitalId || 25, // Default to Dr Sonal Jain (25) or fallback
          message: `Procedure: ${treatmentName || 'General'} | Age: ${patientAge} | Gender: ${patientGender} | Preferred Time: ${preferredContactTime} | ${additionalMessage}`,
          preferredContactTime: preferredContactTime,
          isGeneralContact: false,
        });
      } catch (e) {
        console.log('Enquiry API fallback to local storage:', e);
      }

      navigation.replace('Success', {
        requestDetails: {
          requestId: newLead.id,
          serviceName,
          preferredHospital: selectedHospitalName,
          patientName,
          createdAt: newLead.createdAt,
        },
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Free Consultation</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Destination Hospital Banner */}
      <View style={styles.hospitalBanner}>
        <Text style={styles.hospitalTag}>DIRECT CONSULTATION ENQUIRY TO</Text>
        <Text style={styles.hospitalNameText}>🏥 {selectedHospitalName}</Text>
        <Text style={styles.hospitalVerifiedText}>✓ Verified Healthcare Partner</Text>
      </View>

      {/* Step Progress Indicator (3 Steps) */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStepRow}>
          {[
            { num: 1, label: 'Treatment' },
            { num: 2, label: 'Patient & Account' },
            { num: 3, label: 'Submit' },
          ].map((s) => (
            <View key={s.num} style={styles.stepCol}>
              <View
                style={[
                  styles.stepBadgeCircle,
                  currentStep >= s.num && styles.stepBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepBadgeText,
                    currentStep >= s.num && styles.stepBadgeTextActive,
                  ]}
                >
                  {s.num}
                </Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === s.num && styles.stepLabelActive]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentStep - 1) / 2) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 1: Select Service & Treatment */}
        {currentStep === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Select Service & Procedure</Text>
            <Text style={styles.stepSubtitle}>What medical specialty or treatment are you seeking?</Text>

            <Text style={styles.inputLabel}>Healthcare Service Specialty</Text>
            <View style={styles.optionsWrap}>
              {(dbServices.length > 0 ? dbServices : servicesList.map((s, idx) => ({ id: idx + 1, name: s }))).map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.optionPill, (selectedServiceId === s.id || serviceName === s.name) && styles.optionPillActive]}
                  onPress={() => {
                    setSelectedServiceId(s.id);
                    setServiceName(s.name);
                  }}
                >
                  <Text style={[styles.optionText, (selectedServiceId === s.id || serviceName === s.name) && styles.optionTextActive]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {dbHospitals.length > 0 && (
              <>
                <Text style={styles.inputLabel}>Preferred Hospital *</Text>
                <ScrollView style={styles.hospitalSelectScroll} nestedScrollEnabled={true}>
                  {dbHospitals.map((h) => (
                    <TouchableOpacity
                      key={h.id}
                      style={[
                        styles.hospitalSelectItem,
                        selectedHospitalId === h.id && styles.hospitalSelectItemActive,
                      ]}
                      onPress={() => {
                        setSelectedHospitalId(h.id);
                        setSelectedHospitalName(h.name);
                      }}
                    >
                      <Text
                        style={[
                          styles.hospitalSelectText,
                          selectedHospitalId === h.id && styles.hospitalSelectTextActive,
                        ]}
                      >
                        🏥 {h.name} ({h.city})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.inputLabel}>Specific Treatment / Procedure (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={treatmentName}
              onChangeText={setTreatmentName}
              placeholder="e.g. Knee Replacement, IVF, Angioplasty..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        {/* Step 2: Patient & Account Details */}
        {currentStep === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Patient & Account Details</Text>
            <Text style={styles.stepSubtitle}>
              {!user
                ? 'Fill in your details. We will automatically create an account so you can track your request later.'
                : 'Confirm patient contact info for hospital coordinator callback'}
            </Text>

            <Text style={styles.inputLabel}>Patient Full Name *</Text>
            <TextInput
              style={styles.textInput}
              value={patientName}
              onChangeText={setPatientName}
              placeholder="Enter full name"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.inputLabel}>Email Address *</Text>
            <TextInput
              style={styles.textInput}
              value={patientEmail}
              onChangeText={setPatientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter email address"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.inputLabel}>Mobile Phone Number *</Text>
            <TextInput
              style={styles.textInput}
              value={patientPhone}
              onChangeText={setPatientPhone}
              keyboardType="phone-pad"
              placeholder="Enter 10-digit phone number"
              placeholderTextColor={colors.textMuted}
            />

            {/* Password input for new unauthenticated users */}
            {!user && (
              <View style={styles.createAccountSection}>
                <Text style={styles.accountHeadingText}>🔒 Create Account Password</Text>
                <Text style={styles.accountSubText}>Set a password to log in anytime later with {patientEmail || 'your email'}</Text>
                
                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.passwordInput}
                    value={accountPassword}
                    onChangeText={setAccountPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Create a secure password"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🔒'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.rowTwoCols}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={styles.textInput}
                  value={patientAge}
                  onChangeText={setPatientAge}
                  keyboardType="numeric"
                  placeholder="e.g. 45"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.genderRow}>
                  {['Male', 'Female'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderBtn, patientGender === g && styles.genderBtnActive]}
                      onPress={() => setPatientGender(g)}
                    >
                      <Text style={[styles.genderBtnText, patientGender === g && styles.genderBtnTextActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Step 3: Preferred Contact Time & Message */}
        {currentStep === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Finalize Consultation Request</Text>
            <Text style={styles.stepSubtitle}>When should {selectedHospitalName}'s desk contact you?</Text>

            <Text style={styles.inputLabel}>Preferred Callback Time</Text>
            <View style={styles.optionsWrap}>
              {timeSlots.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.optionPill, preferredContactTime === t && styles.optionPillActive]}
                  onPress={() => setPreferredContactTime(t)}
                >
                  <Text style={[styles.optionText, preferredContactTime === t && styles.optionTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Additional Notes / Symptoms (Optional)</Text>
            <TextInput
              style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
              value={additionalMessage}
              onChangeText={setAdditionalMessage}
              multiline
              numberOfLines={4}
              placeholder="Describe any specific symptoms or medical questions..."
              placeholderTextColor={colors.textMuted}
            />

            {/* Summary Box */}
            <View style={styles.summaryBox}>
              <Text style={styles.summaryHeading}>Direct Request Summary</Text>
              <Text style={styles.summaryLine}>• Target Hospital: <Text style={styles.boldVal}>{selectedHospitalName}</Text></Text>
              <Text style={styles.summaryLine}>• Specialty: <Text style={styles.boldVal}>{serviceName}</Text></Text>
              <Text style={styles.summaryLine}>• Patient: <Text style={styles.boldVal}>{patientName} ({patientEmail})</Text></Text>
              {!user && <Text style={styles.summaryLine}>• Account: <Text style={styles.boldVal}>Will be created automatically ✓</Text></Text>}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation Actions Footer */}
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleBack}>
            <Text style={styles.secondaryBtnText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
          onPress={handleNext}
          disabled={submitting}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryBtnText}>
            {submitting ? 'Submitting...' : currentStep === 3 ? 'Submit & Create Account ✓' : 'Next Step →'}
          </Text>
        </TouchableOpacity>
      </View>
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
  hospitalBanner: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  hospitalTag: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hospitalNameText: {
    color: colors.textWhite,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  hospitalVerifiedText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  progressContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  progressStepRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  stepCol: {
    alignItems: 'center',
  },
  stepBadgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepBadgeActive: {
    backgroundColor: colors.primary,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
  },
  stepBadgeTextActive: {
    color: colors.textWhite,
  },
  stepLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 18,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '800',
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
  createAccountSection: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(253, 29, 116, 0.2)',
  },
  accountHeadingText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 2,
  },
  accountSubText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  eyeBtn: {
    paddingHorizontal: 12,
  },
  eyeIcon: {
    fontSize: 16,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  genderBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  genderBtnTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  summaryBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  summaryLine: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  boldVal: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  secondaryBtn: {
    flex: 0.35,
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textWhite,
  },
  hospitalSelectScroll: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    marginVertical: 8,
  },
  hospitalSelectItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  hospitalSelectItemActive: {
    backgroundColor: colors.primaryLight,
  },
  hospitalSelectText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  hospitalSelectTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});
