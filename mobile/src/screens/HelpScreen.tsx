import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface HelpScreenProps {
  navigation: any;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({ navigation }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How do I book a healthcare consultation?',
      a: 'Browse healthcare specialty categories, choose your preferred doctor or hospital center, fill out the free consultation enquiry form, and click submit. Our medical desk coordinator will call you back shortly.',
    },
    {
      q: 'Is Clinic By Choice free to use?',
      a: 'Yes, our platform is 100% free of charge for patients. We do not charge patients any discovery or referral fees.',
    },
    {
      q: 'Are the listed medical providers verified?',
      a: 'Absolutely. We only list accredited healthcare centers (such as NABH and JCI certified clinics and hospitals) with verified medical professionals.',
    },
    {
      q: 'How can I change my preferred city location?',
      a: 'Tap the location text pinned at the top-left of your Home page header. You can select your city from the popup selector modal or search for an address.',
    },
  ];

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Support Cards */}
        <Text style={styles.subHeading}>Get In Touch</Text>
        <View style={styles.contactRow}>
          <View style={styles.contactCard}>
            <Text style={styles.contactIcon}>📞</Text>
            <Text style={styles.contactType}>Call Support</Text>
            <Text style={styles.contactVal}>+91 172 5000000</Text>
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.contactIcon}>✉️</Text>
            <Text style={styles.contactType}>Email Us</Text>
            <Text style={styles.contactVal}>support@cbc.com</Text>
          </View>
        </View>

        {/* FAQs */}
        <Text style={[styles.subHeading, { marginTop: 28 }]}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {faqs.map((faq, idx) => (
            <View key={idx} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => toggleFaq(idx)}
                activeOpacity={0.7}
              >
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Text style={styles.faqToggleText}>{activeFaq === idx ? '▾' : '▸'}</Text>
              </TouchableOpacity>
              {activeFaq === idx ? (
                <View style={styles.faqBody}>
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                </View>
              ) : null}
            </View>
          ))}
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
  subHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  contactIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  contactType: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  faqList: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 0.92,
  },
  faqToggleText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '800',
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.surface,
  },
  faqAnswer: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
