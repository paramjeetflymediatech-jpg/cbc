import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface SuccessScreenProps {
  navigation: any;
  route: any;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ navigation, route }) => {
  const requestDetails = route.params?.requestDetails || {
    requestId: 'REQ-8902',
    serviceName: 'Orthopaedics',
    preferredHospital: 'Max Super Speciality Hospital',
    patientName: 'Rahul Verma',
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {/* Animated Green Check Badge */}
        <View style={styles.checkCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>

        <Text style={styles.title}>Request Submitted!</Text>
        <Text style={styles.subtitle}>
          Your healthcare enquiry has been successfully submitted to Clinic By Choice.
        </Text>

        {/* Reference Box */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Reference Number:</Text>
            <Text style={styles.reqIdText}>{requestDetails.requestId}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Specialty:</Text>
            <Text style={styles.value}>{requestDetails.serviceName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Hospital:</Text>
            <Text style={styles.value}>{requestDetails.preferredHospital}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>🟢 Request Received</Text>
            </View>
          </View>
        </View>

        <Text style={styles.infoNote}>
          Our senior medical desk will review your request and contact you shortly.
        </Text>
      </View>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Main', { screen: 'Requests' })}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryBtnText}>View My Requests →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Main', { screen: 'Home' })}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.successLight,
    borderWidth: 3,
    borderColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  checkIcon: {
    fontSize: 48,
    color: colors.success,
    fontWeight: '900',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reqIdText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  statusBadge: {
    backgroundColor: colors.infoLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.info,
  },
  infoNote: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.textWhite,
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});
