import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockUserLeads } from '../data/mockData';
import { PatientLead } from '../types';
import { colors } from '../theme/colors';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

import { useAuth } from '../context/AuthContext';
import { useSweetAlert } from '../context/SweetAlertContext';

interface MyRequestsScreenProps {
  navigation: any;
}

export const MyRequestsScreen: React.FC<MyRequestsScreenProps> = ({ navigation }) => {
  const { userEnquiries, isAuthenticated } = useAuth();
  const { showAlert } = useSweetAlert();
  const [selectedLead, setSelectedLead] = useState<PatientLead | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      showAlert({
        title: 'Login Required',
        message: 'Please login first to view your requests.',
        type: 'warning',
        confirmText: 'Login',
        cancelText: 'Cancel',
        onConfirm: () => navigation.navigate('Auth'),
        onCancel: () => navigation.navigate('Main', { screen: 'Home' }),
      });
    } else if (userEnquiries.length === 0) {
      showAlert({
        title: 'No Requests',
        message: "You haven't submitted any consultation requests yet.",
        type: 'info',
        confirmText: 'OK',
        onConfirm: () => navigation.navigate('Main', { screen: 'Home' }),
      });
    }
  }, [isAuthenticated, userEnquiries, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Title Bar */}
      <View style={styles.header}>
        <Text style={styles.title}>My Requests</Text>
        <Text style={styles.subtitle}>Track your healthcare consultation enquiries & status</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {userEnquiries.length > 0 ? (
          userEnquiries.map((lead) => (
            <View key={lead.id} style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.reqIdText}>{lead.id}</Text>
                  <Text style={styles.dateText}>{lead.createdAt}</Text>
                </View>
                <StatusBadge status={lead.status} />
              </View>

              <View style={styles.divider} />

              <View style={styles.cardBody}>
                <Text style={styles.serviceTitle}>{lead.serviceName}</Text>
                {lead.treatmentName && <Text style={styles.treatmentText}>Procedure: {lead.treatmentName}</Text>}
                <Text style={styles.hospitalText}>📍 {lead.preferredHospitalName}</Text>
              </View>

              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={() => setSelectedLead(lead)}
                activeOpacity={0.8}
              >
                <Text style={styles.detailsBtnText}>View Details →</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <EmptyState
            icon="📋"
            title="No Active Requests"
            description="You haven't submitted any healthcare consultation requests yet."
            buttonText="Explore Healthcare"
            onButtonPress={() => navigation.navigate('Main', { screen: 'Home' })}
          />
        )}
      </ScrollView>

      {/* Request Details Modal */}
      {selectedLead && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Request Details ({selectedLead.id})</Text>
                <TouchableOpacity onPress={() => setSelectedLead(null)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <StatusBadge status={selectedLead.status} />
                
                <Text style={styles.modalLabel}>Specialty</Text>
                <Text style={styles.modalVal}>{selectedLead.serviceName}</Text>

                <Text style={styles.modalLabel}>Hospital</Text>
                <Text style={styles.modalVal}>{selectedLead.preferredHospitalName}</Text>

                <Text style={styles.modalLabel}>Patient Name</Text>
                <Text style={styles.modalVal}>{selectedLead.patientName} ({selectedLead.patientPhone})</Text>

                <Text style={styles.modalLabel}>Preferred Contact Time</Text>
                <Text style={styles.modalVal}>{selectedLead.preferredContactTime}</Text>

                {selectedLead.additionalMessage ? (
                  <>
                    <Text style={styles.modalLabel}>Notes</Text>
                    <Text style={styles.modalVal}>{selectedLead.additionalMessage}</Text>
                  </>
                ) : null}
              </View>

              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedLead(null)}>
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reqIdText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  cardBody: {
    marginBottom: 14,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 2,
  },
  treatmentText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  hospitalText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  detailsBtn: {
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textMuted,
  },
  modalBody: {
    gap: 8,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 6,
  },
  modalVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalCloseBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: colors.textWhite,
    fontWeight: '800',
    fontSize: 14,
  },
});
