import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { Hospital } from '../types';
import { colors } from '../theme/colors';
import { SearchBar } from '../components/SearchBar';
import { HospitalCard } from '../components/HospitalCard';
import { FilterBottomSheet } from '../components/FilterBottomSheet';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';

import { useAuth } from '../context/AuthContext';
import { LocationModal } from '../components/LocationModal';

interface HospitalsScreenProps {
  navigation: any;
  route: any;
}

export const HospitalsScreen: React.FC<HospitalsScreenProps> = ({ navigation, route }) => {
  const { savedHospitalIds, toggleSaveHospital, location } = useAuth();

  const initialSearch = route.params?.initialSearch || '';
  const initialSpecialty = route.params?.initialSpecialty || '';

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [locationModalVisible, setLocationModalVisible] = useState<boolean>(false);

  // Filter chips state
  const [activeChip, setActiveChip] = useState<'All' | 'Near Me' | 'Verified' | '4+ Rating'>('All');
  const [sortOption, setSortOption] = useState<'Recommended' | 'Highest Rated' | 'Nearest'>('Recommended');

  // Applied filters from sheet
  const [appliedFilters, setAppliedFilters] = useState<{
    location: string;
    specialty: string;
    minRating: number;
    verifiedOnly: boolean;
  }>({
    location: 'All Locations',
    specialty: initialSpecialty || 'All Specialties',
    minRating: 0,
    verifiedOnly: false,
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    applyFilterLogic();
  }, [searchQuery, activeChip, sortOption, appliedFilters, hospitals, location]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hospitals');
      if (res.data && Array.isArray(res.data.hospitals)) {
        setHospitals(res.data.hospitals);
      } else if (Array.isArray(res.data)) {
        setHospitals(res.data);
      } else {
        setHospitals([]);
      }
    } catch (e) {
      console.log('Error fetching hospitals:', e);
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilterLogic = () => {
    let result = [...hospitals];

    // Global Selected Location Filter (e.g. Ludhiana, Chandigarh, Amritsar, Delhi NCR)
    const locClean = (location || '').toLowerCase().trim();
    if (locClean && locClean !== 'all' && locClean !== 'all locations') {
      result = result.filter((h) => {
        const city = (h.city || '').toLowerCase();
        const area = (h.location || '').toLowerCase();
        const address = (h.address || '').toLowerCase();
        const state = (h.state || '').toLowerCase();

        if (locClean.includes('ludhiana')) {
          return city.includes('ludhiana') || area.includes('ludhiana') || address.includes('ludhiana');
        }
        if (locClean.includes('chandigarh') || locClean.includes('tricity')) {
          return city.includes('chandigarh') || area.includes('mohali') || area.includes('panchkula') || city.includes('mohali');
        }
        if (locClean.includes('amritsar')) {
          return city.includes('amritsar') || area.includes('amritsar');
        }
        if (locClean.includes('jalandhar')) {
          return city.includes('jalandhar') || area.includes('jalandhar');
        }
        if (locClean.includes('delhi') || locClean.includes('ncr') || locClean.includes('gurugram')) {
          return city.includes('delhi') || city.includes('ncr') || area.includes('gurugram') || area.includes('noida');
        }
        return city.includes(locClean) || area.includes(locClean) || address.includes(locClean) || state.includes(locClean);
      });
    }

    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (h) =>
          (h.name && h.name.toLowerCase().includes(q)) ||
          (h.location && h.location.toLowerCase().includes(q)) ||
          (h.city && h.city.toLowerCase().includes(q)) ||
          (Array.isArray(h.specialties) && h.specialties.some((s) => s.toLowerCase().includes(q)))
      );
    }

    // Horizontal Chip Filter
    if (activeChip === 'Near Me') {
      result = result.filter((h) => h.city?.includes('Chandigarh') || h.location?.includes('Mohali'));
    } else if (activeChip === 'Verified') {
      result = result.filter((h) => h.isVerified);
    } else if (activeChip === '4+ Rating') {
      result = result.filter((h) => (h.rating || 0) >= 4.0);
    }

    // Applied Filters from Bottom Sheet
    if (appliedFilters.location !== 'All Locations') {
      result = result.filter(
        (h) =>
          h.location?.toLowerCase().includes(appliedFilters.location.toLowerCase()) ||
          h.city?.toLowerCase().includes(appliedFilters.location.toLowerCase())
      );
    }

    if (appliedFilters.specialty !== 'All Specialties') {
      result = result.filter((h) =>
        Array.isArray(h.specialties) && h.specialties.some((s) => s.toLowerCase().includes(appliedFilters.specialty.toLowerCase()))
      );
    }

    if (appliedFilters.minRating > 0) {
      result = result.filter((h) => (h.rating || 0) >= appliedFilters.minRating);
    }

    if (appliedFilters.verifiedOnly) {
      result = result.filter((h) => h.isVerified);
    }

    // Sorting
    if (sortOption === 'Highest Rated') {
      result.sort((a, b) => b.rating - a.rating);
    }

    setFilteredHospitals(result);
  };

  const handleBookmarkToggle = (id: string) => {
    toggleSaveHospital(id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Title Bar */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Find a Hospital</Text>
          <TouchableOpacity
            style={styles.locationPill}
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.locationPillText}>📍 {location} ▾</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Discover & compare trusted medical centers</Text>
      </View>

      {/* Location Selector Modal */}
      <LocationModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />

      {/* Search Bar */}
      <View style={styles.searchPadding}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search hospitals by name, city or specialty..."
        />
      </View>

      {/* Horizontal Quick Filter Chips */}
      <View style={styles.chipBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {(['All', 'Near Me', 'Verified', '4+ Rating'] as const).map((chip) => (
            <TouchableOpacity
              key={chip}
              style={[styles.chip, activeChip === chip && styles.activeChip]}
              onPress={() => setActiveChip(chip)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, activeChip === chip && styles.activeChipText]}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sorting Bar */}
      <View style={styles.sortBar}>
        <Text style={styles.resultCountText}>{filteredHospitals.length} Hospitals found</Text>
        
        <View style={styles.sortTabs}>
          {(['Recommended', 'Highest Rated'] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setSortOption(opt)}
              style={[styles.sortTab, sortOption === opt && styles.activeSortTab]}
            >
              <Text style={[styles.sortTabText, sortOption === opt && styles.activeSortTabText]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Hospital List Content */}
      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <LoadingSkeleton type="card" />
        ) : filteredHospitals.length > 0 ? (
          filteredHospitals.map((hosp) => {
            const hId = String(hosp.id || hosp._id || hosp.slug);
            const isSaved =
              savedHospitalIds.includes(hId) ||
              (hosp.id ? savedHospitalIds.includes(String(hosp.id)) : false) ||
              (hosp.slug ? savedHospitalIds.includes(String(hosp.slug)) : false);
            return (
              <HospitalCard
                key={hId}
                hospital={hosp}
                onPress={() => navigation.navigate('HospitalDetail', { hospital: hosp })}
                onEnquirePress={() => navigation.navigate('Enquiry', { preferredHospital: hosp.name, hospitalId: hosp.id })}
                onBookmarkPress={() => toggleSaveHospital(hId)}
                isSaved={isSaved}
              />
            );
          })
        ) : (
          <EmptyState
            icon="📍"
            title={`No Hospitals in ${location}`}
            description={`We couldn't find accredited hospitals matching your search in ${location}. Try changing location or resetting filters.`}
            buttonText="Select Another Location 📍"
            onButtonPress={() => setLocationModalVisible(true)}
          />
        )}
      </ScrollView>

      {/* Bottom Sheet Filter Modal */}
      <FilterBottomSheet
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(f) => setAppliedFilters(f)}
        initialLocation={appliedFilters.location}
        initialSpecialty={appliedFilters.specialty}
      />
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
    paddingBottom: 4,
    backgroundColor: colors.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  locationPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(253, 29, 116, 0.2)',
  },
  locationPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  searchPadding: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  chipBar: {
    backgroundColor: colors.surface,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  chipScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeChipText: {
    color: colors.textWhite,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resultCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sortTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 2,
  },
  sortTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeSortTab: {
    backgroundColor: colors.surface,
  },
  sortTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activeSortTabText: {
    color: colors.primary,
    fontWeight: '800',
  },
  scrollList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
});
