import React, { useState, useEffect, useMemo } from 'react';
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
import { Hospital, Service } from '../types';
import { mockHospitals, mockServices } from '../data/mockData';
import { colors } from '../theme/colors';
import { SearchBar } from '../components/SearchBar';
import { HospitalCard } from '../components/HospitalCard';
import { useAuth } from '../context/AuthContext';
import {
  isHospitalInLocation,
  isServiceInLocation,
  doesHospitalMatchKeyword,
  doesServiceMatchKeyword,
} from '../utils/locationHelper';
import { LocationModal } from '../components/LocationModal';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

interface SearchScreenProps {
  navigation: any;
  route: any;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation, route }) => {
  const { savedHospitalIds, toggleSaveHospital, location } = useAuth();
  const initialQuery = route.params?.initialQuery || '';
  const [query, setQuery] = useState<string>(initialQuery);
  const [allHospitals, setAllHospitals] = useState<Hospital[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterByLocation, setFilterByLocation] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Hospitals' | 'Services'>('All');
  const [locationModalVisible, setLocationModalVisible] = useState<boolean>(false);

  useEffect(() => {
    fetchSearchData();
  }, []);

  useEffect(() => {
    if (route.params?.initialQuery !== undefined) {
      setQuery(route.params.initialQuery);
    }
  }, [route.params?.initialQuery]);

  const fetchSearchData = async () => {
    try {
      setLoading(true);
      const [hospRes, servRes] = await Promise.allSettled([
        api.get('/hospitals'),
        api.get('/services'),
      ]);

      if (hospRes.status === 'fulfilled' && hospRes.value?.data) {
        const rawHosp = hospRes.value.data;
        let fetchedList: Hospital[] = [];
        if (Array.isArray(rawHosp.hospitals)) {
          fetchedList = rawHosp.hospitals;
        } else if (Array.isArray(rawHosp)) {
          fetchedList = rawHosp;
        }
        setAllHospitals(fetchedList.length > 0 ? fetchedList : mockHospitals);
      } else {
        setAllHospitals(mockHospitals);
      }

      if (servRes.status === 'fulfilled' && servRes.value?.data) {
        const rawServ = servRes.value.data;
        let fetchedServices: Service[] = [];
        if (Array.isArray(rawServ.services)) {
          fetchedServices = rawServ.services;
        } else if (Array.isArray(rawServ)) {
          fetchedServices = rawServ;
        }
        setAllServices(fetchedServices.length > 0 ? fetchedServices : mockServices);
      } else {
        setAllServices(mockServices);
      }
    } catch (e) {
      console.log('Error fetching dynamic search data:', e);
      setAllHospitals(mockHospitals);
      setAllServices(mockServices);
    } finally {
      setLoading(false);
    }
  };

  const isAllLocationsMode =
    !filterByLocation ||
    !location ||
    location.toLowerCase() === 'all' ||
    location.toLowerCase() === 'all locations' ||
    location.toLowerCase() === 'all india';

  // 1. Filter hospitals strictly by selected location (if not in All India mode)
  const locationHospitals = useMemo(() => {
    if (isAllLocationsMode) {
      return allHospitals;
    }
    return allHospitals.filter((h) => isHospitalInLocation(h, location));
  }, [allHospitals, location, isAllLocationsMode]);

  // 2. Filter services strictly by what is available in the selected location
  const locationServices = useMemo(() => {
    if (isAllLocationsMode) {
      return allServices;
    }
    // Only services available at hospitals in this location
    const matched = allServices.filter((s) => isServiceInLocation(s, locationHospitals, location));
    // If no hospitals exist in that location yet, don't show services for that location
    return matched;
  }, [allServices, locationHospitals, location, isAllLocationsMode]);

  // 3. Match keyword against location-filtered hospitals (Only when search query is entered)
  const matchingHospitals = useMemo(() => {
    if (!query.trim()) {
      return [];
    }
    return locationHospitals.filter((h) => doesHospitalMatchKeyword(h, query));
  }, [locationHospitals, query]);

  // 4. Match keyword against location-filtered services (Only when search query is entered)
  const matchingServices = useMemo(() => {
    if (!query.trim()) {
      return [];
    }
    return locationServices.filter((s) => doesServiceMatchKeyword(s, query));
  }, [locationServices, query]);

  const totalResultsCount = matchingHospitals.length + matchingServices.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header with Back Button and Unified Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={`Search services & hospitals in ${location || 'your city'}...`}
          />
        </View>
      </View>

      {/* Location Filter & Selector Strip */}
      <View style={styles.locationBar}>
        <View style={styles.locationChipsRow}>
          <TouchableOpacity
            style={[styles.locationChip, filterByLocation && styles.locationChipActive]}
            onPress={() => setFilterByLocation(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.locationChipText, filterByLocation && styles.locationChipTextActive]}>
              📍 In {location}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.locationChip, !filterByLocation && styles.locationChipActive]}
            onPress={() => setFilterByLocation(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.locationChipText, !filterByLocation && styles.locationChipTextActive]}>
              🌐 All India
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.changeLocBtn}
          onPress={() => setLocationModalVisible(true)}
          activeOpacity={0.75}
        >
          <Text style={styles.changeLocBtnText}>Change City ▾</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs: All, Hospitals, Services (Rendered only when actively searching) */}
      {query.trim().length > 0 && (
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'All' && styles.tabButtonActive]}
            onPress={() => setActiveTab('All')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'All' && styles.tabButtonTextActive]}>
              All ({totalResultsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Hospitals' && styles.tabButtonActive]}
            onPress={() => setActiveTab('Hospitals')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'Hospitals' && styles.tabButtonTextActive]}>
              🏥 Hospitals ({matchingHospitals.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Services' && styles.tabButtonActive]}
            onPress={() => setActiveTab('Services')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'Services' && styles.tabButtonTextActive]}>
              🩺 Services ({matchingServices.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Location Selector Modal */}
      <LocationModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <LoadingSkeleton type="card" />
        ) : !query.trim() ? (
          /* Empty query state: guide user to start searching */
          <View style={styles.initialSearchPromptBox}>
            <View style={styles.initialSearchIconCircle}>
              <Text style={styles.initialSearchIcon}>🔍</Text>
            </View>
            <Text style={styles.initialSearchTitle}>
              Search Healthcare in {filterByLocation ? location : 'All India'}
            </Text>
            <Text style={styles.initialSearchSub}>
              Type any keyword (e.g. hospital name, specialty like Orthopaedics, IVF, Cardiology, or doctor/procedure) to find verified healthcare in {location}.
            </Text>

            <TouchableOpacity
              style={styles.initialSearchCityPill}
              onPress={() => setLocationModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.initialSearchCityText}>
                📍 Location: <Text style={{ fontWeight: '800', color: colors.primary }}>{location}</Text> • Tap to change ▾
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* When user is actively searching */
          <>
            <View style={styles.resultsInfoRow}>
              <Text style={styles.resultsTitle}>
                Results for "{query}"
              </Text>
              <View style={styles.activeLocationBadge}>
                <Text style={styles.activeLocationBadgeText}>
                  {filterByLocation ? `📍 ${location}` : '🌐 All India'}
                </Text>
              </View>
            </View>

            {/* TAB: ALL OR SERVICES -> Render Services */}
            {(activeTab === 'All' || activeTab === 'Services') && matchingServices.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.subHeading}>
                  🩺 Specialties & Procedures ({matchingServices.length})
                </Text>
                {matchingServices.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.serviceRow}
                    onPress={() => navigation.navigate('ServiceDetail', { service: s, location })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.serviceRowIcon}>{s.icon || '🩺'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceRowName}>{s.name}</Text>
                      <Text style={styles.serviceRowDesc}>{s.category}</Text>
                      {s.popularTreatments && s.popularTreatments.length > 0 && (
                        <Text style={styles.serviceRowTreatments} numberOfLines={1}>
                          Treatments: {s.popularTreatments.slice(0, 3).join(', ')}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.arrowText}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* TAB: ALL OR HOSPITALS -> Render Hospitals */}
            {(activeTab === 'All' || activeTab === 'Hospitals') && matchingHospitals.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.subHeading}>
                  🏥 Hospitals ({matchingHospitals.length})
                </Text>
                {matchingHospitals.map((hosp) => {
                  const hId = String(hosp.id || (hosp as any)._id || (hosp as any).slug);
                  const isSaved =
                    savedHospitalIds.includes(hId) ||
                    (hosp.id ? savedHospitalIds.includes(String(hosp.id)) : false) ||
                    ((hosp as any).slug ? savedHospitalIds.includes(String((hosp as any).slug)) : false);

                  return (
                    <HospitalCard
                      key={hId}
                      hospital={hosp}
                      onPress={() => navigation.navigate('HospitalDetail', { hospital: hosp })}
                      onEnquirePress={() =>
                        navigation.navigate('Enquiry', { preferredHospital: hosp.name, hospitalId: hosp.id })
                      }
                      onBookmarkPress={() => toggleSaveHospital(hId)}
                      isSaved={isSaved}
                    />
                  );
                })}
              </View>
            )}

            {/* NO RESULTS IN LOCATION */}
            {totalResultsCount === 0 && (
              <View style={styles.noResultsBox}>
                <Text style={styles.noResultsIcon}>🔍</Text>
                <Text style={styles.noResultsTitle}>
                  No results in {filterByLocation ? location : 'All India'}
                </Text>
                <Text style={styles.noResultsSub}>
                  No services or hospitals match "{query}" in {filterByLocation ? location : 'our database'}. Try checking your spelling, switching cities, or exploring all locations.
                </Text>

                <View style={styles.noResultsBtnRow}>
                  {filterByLocation && (
                    <TouchableOpacity
                      style={styles.searchAllBtn}
                      onPress={() => setFilterByLocation(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.searchAllBtnText}>🌐 Search All India</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.changeCityBtn}
                    onPress={() => setLocationModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.changeCityBtnText}>📍 Change City</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: colors.surface,
  },
  backBtn: {
    paddingRight: 12,
    paddingLeft: 4,
    paddingVertical: 4,
  },
  backBtnText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  searchWrap: {
    flex: 1,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  locationChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  locationChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  locationChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  changeLocBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  changeLocBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.textWhite,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  locationHeaderBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 20,
  },
  locationHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  locationHeaderSub: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceMiniCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  serviceMiniIcon: {
    fontSize: 26,
    marginBottom: 8,
  },
  serviceMiniName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  serviceMiniCat: {
    fontSize: 11,
    color: colors.textMuted,
  },
  resultsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  activeLocationBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activeLocationBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  subHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  serviceRowIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  serviceRowName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  serviceRowDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  serviceRowTreatments: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  arrowText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: 8,
  },
  noResultsBox: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: 12,
  },
  noResultsIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  noResultsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  noResultsSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  noResultsBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchAllBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchAllBtnText: {
    color: colors.textWhite,
    fontWeight: '800',
    fontSize: 13,
  },
  changeCityBtn: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeCityBtnText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  initialSearchPromptBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  initialSearchIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  initialSearchIcon: {
    fontSize: 32,
  },
  initialSearchTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  initialSearchSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  initialSearchCityPill: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  initialSearchCityText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
