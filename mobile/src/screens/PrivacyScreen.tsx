import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface PrivacyScreenProps {
  navigation: any;
}

export const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ navigation }) => {
  const handleOpenWebPolicy = () => {
    Linking.openURL('https://clinicbychoice.com/privacy-policy').catch((err) => {
      console.error('Failed to open URL:', err);
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: September 2026</Text>

        <Text style={styles.introText}>
          At Clinic By Choice, we prioritize the confidentiality and safety of your personal and medical information. This Privacy Policy details how we collect, protect, and use your data.
        </Text>

        {/* Online Web Policy Button */}
        <TouchableOpacity style={styles.webPolicyBtn} onPress={handleOpenWebPolicy} activeOpacity={0.85}>
          <Text style={styles.webPolicyBtnText}>🌐 View Full Online Privacy Policy</Text>
          <Text style={styles.webPolicySubtext}>clinicbychoice.com/privacy-policy</Text>
        </TouchableOpacity>

        {/* Section 1 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Data We Collect</Text>
          <Text style={styles.bodyText}>
            • <Text style={styles.bold}>Personal Identity:</Text> Name, email address, age, gender, and contact phone numbers.
          </Text>
          <Text style={styles.bodyText}>
            • <Text style={styles.bold}>Medical Consultation Info:</Text> Selected medical specialties, desired procedures, and additional notes or symptoms you provide in forms.
          </Text>
          <Text style={styles.bodyText}>
            • <Text style={styles.bold}>Technical & Device Info:</Text> IP addresses, device types, and operating system versions for analytical diagnostics.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
          <Text style={styles.bodyText}>
            • To process your healthcare discovery request and connect you with your chosen hospitals and medical partners.
          </Text>
          <Text style={styles.bodyText}>
            • To facilitate coordinator callbacks and answer your medical treatment enquiries.
          </Text>
          <Text style={styles.bodyText}>
            • To verify user authentication and provide secure profile login access.
          </Text>
        </View>

        {/* Section 3 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Data Security & Encryption</Text>
          <Text style={styles.bodyText}>
            We deploy advanced AES-256 encryption protocols for all client database transactions. Your personal healthcare information is processed securely in compliance with international patient protection standards.
          </Text>
        </View>

        {/* Section 4 - Retention & Deletion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Account & Data Deletion (Google Play)</Text>
          <Text style={styles.bodyText}>
            In compliance with Google Play Store Developer Policies, you have the right to request full deletion of your account and associated personal and medical data at any time.
          </Text>
          <Text style={styles.bodyText}>
            To request permanent data erasure, please email <Text style={styles.highlightText}>privacy@clinicbychoice.com</Text> with the subject &quot;Data Deletion Request&quot; or tap below to submit an online deletion request.
          </Text>
          <TouchableOpacity
            style={[styles.webPolicyBtn, { marginTop: 8, marginBottom: 0 }]}
            onPress={() => Linking.openURL('https://clinicbychoice.com/data-deletion').catch(() => {})}
            activeOpacity={0.85}
          >
            <Text style={styles.webPolicyBtnText}>🗑️ Open Data Deletion Request Page</Text>
            <Text style={styles.webPolicySubtext}>clinicbychoice.com/data-deletion</Text>
          </TouchableOpacity>
        </View>

        {/* Section 5 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Contact Us</Text>
          <Text style={styles.bodyText}>
            If you have questions about this policy or wish to contact our Data Grievance Officer, please contact us at <Text style={styles.highlightText}>privacy@clinicbychoice.com</Text> or <Text style={styles.highlightText}>info@clinicbychoice.com</Text>.
          </Text>
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
    padding: 24,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  highlightText: {
    color: colors.primary,
    fontWeight: '700',
  },
  webPolicyBtn: {
    backgroundColor: '#fdf2f6',
    borderWidth: 1,
    borderColor: '#f9a8d4',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  webPolicyBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  webPolicySubtext: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});
