import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface AboutScreenProps {
  navigation: any;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  const stats = [
    { label: 'Accredited Hospitals', val: '500+' },
    { label: 'Experienced Doctors', val: '2,000+' },
    { label: 'Treatment Cities', val: '25+' },
    { label: 'Happy Patients', val: '100k+' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Clinic By Choice</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Banner */}
        <View style={styles.brandCard}>
          <Text style={styles.logoIcon}>🏥</Text>
          <Text style={styles.brandTitle}>Clinic By Choice</Text>
          <Text style={styles.tagline}>Premium Healthcare Discovery Platform</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Version 1.0.0 (Stable)</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.headingText}>Our Vision & Mission</Text>
        <Text style={styles.bodyText}>
          Clinic By Choice is India’s premium digital gateway that bridges the gap between patient healthcare demands and trusted, accredited medical providers. Our mission is to democratize accessibility to top-tier tertiary care hospitals and certified specialists across India.
        </Text>
        <Text style={styles.bodyText}>
          Whether you are exploring treatment packages, checking cost estimates, or seeking accredited hospital recommendations, Clinic By Choice delivers certified outcomes with absolute data transparency.
        </Text>

        {/* Stats Grid */}
        <Text style={[styles.headingText, { marginTop: 24 }]}>Platform Growth</Text>
        <View style={styles.grid}>
          {stats.map((item, idx) => (
            <View key={idx} style={styles.gridItem}>
              <Text style={styles.statVal}>{item.val}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Partnerships Footer */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🤝 Official Healthcare Partner</Text>
          <Text style={styles.infoBody}>
            Clinic By Choice coordinates directly with major medical organizations and JCI/NABH certified hospital groups to provide official diagnostic diagnostic advice and free consultation support.
          </Text>
        </View>

        <Text style={styles.versionFooter}>© 2026 Clinic By Choice Private Limited. All rights reserved.</Text>
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
  brandCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 24,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  tagline: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 14,
  },
  badgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
  },
  headingText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  infoBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  versionFooter: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 32,
  },
});
