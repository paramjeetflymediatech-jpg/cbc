import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockHospitals } from '../data/mockData';
import { colors } from '../theme/colors';
import { HospitalCard } from '../components/HospitalCard';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useSweetAlert } from '../context/SweetAlertContext';

interface SavedHospitalsScreenProps {
  navigation: any;
}

export const SavedHospitalsScreen: React.FC<SavedHospitalsScreenProps> = ({ navigation }) => {
  const { savedHospitalIds, toggleSaveHospital, isAuthenticated } = useAuth();
  const { showAlert } = useSweetAlert();

  useEffect(() => {
    if (!isAuthenticated) {
      showAlert({
        title: 'Login Required',
        message: 'Please login first to view your saved hospitals.',
        type: 'warning',
        confirmText: 'Login',
        cancelText: 'Cancel',
        onConfirm: () => navigation.navigate('Auth'),
        onCancel: () => navigation.navigate('Main', { screen: 'Home' }),
      });
    }
  }, [isAuthenticated, navigation]);

  const savedList = mockHospitals.filter((h) => savedHospitalIds.includes(String(h.id || h._id)));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Hospitals ({savedList.length})</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {savedList.length > 0 ? (
          savedList.map((hosp) => {
            const hId = String(hosp.id || hosp._id);
            return (
              <HospitalCard
                key={hId}
                hospital={hosp}
                onPress={() => navigation.navigate('HospitalDetail', { hospital: hosp })}
                onEnquirePress={() => navigation.navigate('Enquiry', { preferredHospital: hosp.name })}
                onBookmarkPress={() => toggleSaveHospital(hId)}
                isSaved={true}
              />
            );
          })
        ) : (
          <EmptyState
            icon="❤️"
            title="No Saved Hospitals"
            description="Your saved hospitals will appear here. Explore medical centers and tap the heart icon to save them for easy access."
            buttonText="Explore Hospitals"
            onButtonPress={() => navigation.navigate('Main', { screen: 'Hospitals' })}
          />
        )}
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
});
