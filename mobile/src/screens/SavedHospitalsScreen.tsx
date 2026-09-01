import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { Hospital } from '../types';
import { colors } from '../theme/colors';
import { HospitalCard } from '../components/HospitalCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';
import { useSweetAlert } from '../context/SweetAlertContext';

interface SavedHospitalsScreenProps {
  navigation: any;
}

export const SavedHospitalsScreen: React.FC<SavedHospitalsScreenProps> = ({ navigation }) => {
  const { savedHospitalIds, toggleSaveHospital, isAuthenticated } = useAuth();
  const { showAlert } = useSweetAlert();

  const [allHospitals, setAllHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hospitals');
      let fetchedList: Hospital[] = [];

      if (res.data && Array.isArray(res.data.hospitals) && res.data.hospitals.length > 0) {
        fetchedList = res.data.hospitals;
      } else if (Array.isArray(res.data) && res.data.length > 0) {
        fetchedList = res.data;
      }

      setAllHospitals(fetchedList);
    } catch (e) {
      console.log('Error fetching hospitals for saved list:', e);
      setAllHospitals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHospitals();
  };

  const savedList = allHospitals.filter((h) => {
    const idStr = String(h.id);
    const _idStr = (h as any)._id ? String((h as any)._id) : '';
    const slugStr = (h as any).slug ? String((h as any).slug) : '';
    return (
      savedHospitalIds.includes(idStr) ||
      (_idStr && savedHospitalIds.includes(_idStr)) ||
      (slugStr && savedHospitalIds.includes(slugStr))
    );
  });

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {loading ? (
          <LoadingSkeleton type="card" />
        ) : savedList.length > 0 ? (
          savedList.map((hosp) => {
            const hId = String(hosp.id || (hosp as any)._id || (hosp as any).slug);
            return (
              <HospitalCard
                key={hId}
                hospital={hosp}
                onPress={() => navigation.navigate('HospitalDetail', { hospital: hosp })}
                onEnquirePress={() => navigation.navigate('Enquiry', { preferredHospital: hosp.name, hospitalId: hosp.id })}
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
