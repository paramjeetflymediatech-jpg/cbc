import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Hospital, Service } from '../types';
import { colors } from '../theme/colors';
import { SearchBar } from '../components/SearchBar';
import { ServiceCard } from '../components/ServiceCard';
import { EmptyState } from '../components/EmptyState';
import { LocationModal } from '../components/LocationModal';
import { useAuth } from '../context/AuthContext';
import { isHospitalInLocation, isServiceInLocation } from '../utils/locationHelper';
import api from '../services/api';

interface ServicesScreenProps {
  navigation: any;
  route?: any;
}

export const ServicesScreen: React.FC<ServicesScreenProps> = ({ navigation, route }) => {
  const { location } = useAuth();
  const initialSearch = route?.params?.initialSearch || '';
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [services, setServices] = useState<Service[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [locationModalVisible, setLocationModalVisible] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (route?.params?.initialSearch !== undefined) {
      setSearchQuery(route.params.initialSearch);
    }
  }, [route?.params?.initialSearch]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servRes, hospRes] = await Promise.allSettled([
        api.get('/services'),
        api.get('/hospitals'),
      ]);

      if (servRes.status === 'fulfilled' && servRes.value?.data) {
        const rawServ = servRes.value.data;
        if (Array.isArray(rawServ.services)) {
          setServices(rawServ.services);
        } else if (Array.isArray(rawServ)) {
          setServices(rawServ);
        } else {
          setServices([]);
        }
      }

      if (hospRes.status === 'fulfilled' && hospRes.value?.data) {
        const rawHosp = hospRes.value.data;
        if (Array.isArray(rawHosp.hospitals)) {
          setHospitals(rawHosp.hospitals);
        } else if (Array.isArray(rawHosp)) {
          setHospitals(rawHosp);
        } else {
          setHospitals([]);
        }
      }
    } catch (e) {
      console.log('Error fetching services & hospitals:', e);
    } finally {
      setLoading(false);
    }
  };

  const isAllLocations =
    !location ||
    location.toLowerCase() === 'all' ||
    location.toLowerCase() === 'all locations' ||
    location.toLowerCase() === 'all india';

  const hospitalsInLocation = isAllLocations
    ? hospitals
    : hospitals.filter((h) => isHospitalInLocation(h, location));

  const listToFilter = isAllLocations
    ? services
    : services.filter((s) => isServiceInLocation(s, hospitalsInLocation, location));

  // Dynamically extract categories from loaded database services
  const dbCategories = Array.from(new Set(listToFilter.map((s) => s.category).filter((c): c is string => Boolean(c))));
  const categories = [
    'All',
    ...dbCategories,
  ];

  const filteredServices = listToFilter.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.popularTreatments && s.popularTreatments.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory =
      activeCategoryFilter === 'All' ||
      s.category === activeCategoryFilter ||
      (s.category && s.category.toLowerCase() === activeCategoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Title Bar */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Explore Healthcare</Text>
          <TouchableOpacity
            style={styles.locationPill}
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.locationPillText}>📍 {location} ▾</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Discover accredited medical specialties & procedures in {location}</Text>
      </View>

      {/* Location Modal */}
      <LocationModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />

      {/* Search Input */}
      <View style={styles.searchPadding}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search specialty e.g. Knee, IVF, Heart, LASIK..."
        />
      </View>

      {/* Category Filter Chips Bar */}
      <View style={styles.categoryFilterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, activeCategoryFilter === cat && styles.catChipActive]}
              onPress={() => setActiveCategoryFilter(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.catChipText, activeCategoryFilter === cat && styles.catChipTextActive]}>
                {cat === 'All' ? 'All Specialties' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sub-Header Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerTitle}>Specialist Healthcare Directory</Text>
          <Text style={styles.infoBannerText}>
            Direct access to leading hospital departments, expert surgeons, and comprehensive cost estimates.
          </Text>
        </View>

        <Text style={styles.sectionHeaderTitle}>
          {activeCategoryFilter === 'All' ? 'Medical Specialties' : activeCategoryFilter} ({filteredServices.length})
        </Text>

        <View style={styles.listContainer}>
          {filteredServices.length > 0 ? (
            filteredServices.map((service: Service) => (
              <ServiceCard
                key={service.id}
                service={service}
                variant="full"
                onPress={() => navigation.navigate('ServiceDetail', { service })}
              />
            ))
          ) : (
            <EmptyState
              icon="🩺"
              title="No Specialties Found"
              description={`No medical specialties match "${searchQuery}". Try searching for Orthopaedics, IVF, Cardiology or Dental.`}
              buttonText="Reset Search"
              onButtonPress={() => {
                setSearchQuery('');
                setActiveCategoryFilter('All');
              }}
            />
          )}
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
  categoryFilterBar: {
    backgroundColor: colors.surface,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  catChip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  catChipTextActive: {
    color: colors.textWhite,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  infoBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(253, 29, 116, 0.2)',
  },
  infoBannerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 4,
  },
  infoBannerText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  listContainer: {},
});
