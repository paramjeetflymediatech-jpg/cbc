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
import api from '../services/api';
import { Hospital, Service } from '../types';
import { colors } from '../theme/colors';
import { SearchBar } from '../components/SearchBar';
import { HospitalCard } from '../components/HospitalCard';
import { useAuth } from '../context/AuthContext';
import { isHospitalInLocation } from '../utils/locationHelper';
import { LocationModal } from '../components/LocationModal';

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
  const [filterByLocation, setFilterByLocation] = useState<boolean>(true);
  const [locationModalVisible, setLocationModalVisible] = useState<boolean>(false);

  useEffect(() => {
    fetchSearchData();
  }, []);

  const fetchSearchData = async () => {
    try {
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
        setAllHospitals(fetchedList);
      }

      if (servRes.status === 'fulfilled' && servRes.value?.data) {
        const rawServ = servRes.value.data;
        if (Array.isArray(rawServ.services)) {
          setAllServices(rawServ.services);
        } else if (Array.isArray(rawServ)) {
          setAllServices(rawServ);
        }
      }
    } catch (e) {
      console.log('Error fetching dynamic search data:', e);
    }
  };

  const recentSearches = ['IVF Fertility', 'Orthopaedics', `${location || 'Chandigarh'} Hospitals`, 'Knee Replacement'];
  const popularSearches = ['Best IVF Hospitals', 'Top Joint Replacement', 'Dental Implants', `Hospitals in ${location || 'Punjab'}`];

  const matchedQueryHospitals = query.trim()
    ? allHospitals.filter(
        (h) =>
          (h.name && h.name.toLowerCase().includes(query.toLowerCase())) ||
          (h.location && h.location.toLowerCase().includes(query.toLowerCase())) ||
          (h.city && h.city.toLowerCase().includes(query.toLowerCase())) ||
          (Array.isArray(h.specialties) && h.specialties.some((s) => s.toLowerCase().includes(query.toLowerCase())))
      )
    : [];

  const matchedHospitalsInLocation = matchedQueryHospitals.filter((h) => isHospitalInLocation(h, location));
  const otherMatchedHospitals = matchedQueryHospitals.filter((h) => !isHospitalInLocation(h, location));

  const matchedServices = query.trim()
    ? allServices.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          (s.description && s.description.toLowerCase().includes(query.toLowerCase())) ||
          (Array.isArray(s.popularTreatments) && s.popularTreatments.some((t) => t.toLowerCase().includes(query.toLowerCase())))
      )
    : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Top Search Input */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={`Search in ${location || 'your city'}...`}
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

      {/* Location Picker Modal */}
      <LocationModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!query.trim() ? (
          <>
            {/* Recent Searches */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <View style={styles.tagWrap}>
                {recentSearches.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.tagPill}
                    onPress={() => setQuery(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.tagIcon}>🕒</Text>
                    <Text style={styles.tagText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Popular Searches */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Healthcare Searches</Text>
              <View style={styles.tagWrap}>
                {popularSearches.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.popularPill}
                    onPress={() => setQuery(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.popularIcon}>🔥</Text>
                    <Text style={styles.popularText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Categories */}
            {allServices.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Browse Categories</Text>
                <View style={styles.catGrid}>
                  {allServices.slice(0, 6).map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.catCard}
                      onPress={() => navigation.navigate('ServiceDetail', { service: cat })}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.catIcon}>{cat.icon || '🩺'}</Text>
                      <Text style={styles.catName}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Search Results */}
            <Text style={styles.resultsTitle}>
              Search Results for "{query}"
            </Text>

            {/* Specialties & Services matching query */}
            {matchedServices.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.subHeading}>Specialties & Services ({matchedServices.length})</Text>
                {matchedServices.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.serviceRow}
                    onPress={() => navigation.navigate('ServiceDetail', { service: s })}
                  >
                    <Text style={styles.serviceRowIcon}>{s.icon || '🩺'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceRowName}>{s.name}</Text>
                      <Text style={styles.serviceRowDesc}>{s.category}</Text>
                    </View>
                    <Text style={styles.arrowText}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* If Filter by Selected Location is Enabled */}
            {filterByLocation ? (
              <>
                {/* 1. Hospitals in Selected Location */}
                {matchedHospitalsInLocation.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.locationSectionHeader}>
                      <Text style={styles.subHeading}>
                        Hospitals in {location} ({matchedHospitalsInLocation.length})
                      </Text>
                      <View style={styles.activeLocationBadge}>
                        <Text style={styles.activeLocationBadgeText}>📍 {location}</Text>
                      </View>
                    </View>

                    {matchedHospitalsInLocation.map((hosp) => {
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
                          onEnquirePress={() => navigation.navigate('Enquiry', { preferredHospital: hosp.name, hospitalId: hosp.id })}
                          onBookmarkPress={() => toggleSaveHospital(hId)}
                          isSaved={isSaved}
                        />
                      );
                    })}
                  </View>
                )}

                {/* 2. When no local hospitals match, but other cities have matches */}
                {matchedHospitalsInLocation.length === 0 && otherMatchedHospitals.length > 0 && (
                  <View style={styles.locationNoticeBox}>
                    <Text style={styles.locationNoticeTitle}>
                      📍 No matching hospitals found in {location}
                    </Text>
                    <Text style={styles.locationNoticeSub}>
                      Showing {otherMatchedHospitals.length} result(s) from other cities across India:
                    </Text>
                  </View>
                )}

                {/* 3. Other Cities Hospitals */}
                {otherMatchedHospitals.length > 0 && (
                  <View style={styles.section}>
                    {matchedHospitalsInLocation.length > 0 && (
                      <Text style={[styles.subHeading, { marginTop: 12 }]}>
                        Other Hospitals Across India ({otherMatchedHospitals.length})
                      </Text>
                    )}
                    {otherMatchedHospitals.map((hosp) => {
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
                          onEnquirePress={() => navigation.navigate('Enquiry', { preferredHospital: hosp.name, hospitalId: hosp.id })}
                          onBookmarkPress={() => toggleSaveHospital(hId)}
                          isSaved={isSaved}
                        />
                      );
                    })}
                  </View>
                )}
              </>
            ) : (
              /* All India Search Results */
              matchedQueryHospitals.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.subHeading}>All Matching Hospitals ({matchedQueryHospitals.length})</Text>
                  {matchedQueryHospitals.map((hosp) => {
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
                        onEnquirePress={() => navigation.navigate('Enquiry', { preferredHospital: hosp.name, hospitalId: hosp.id })}
                        onBookmarkPress={() => toggleSaveHospital(hId)}
                        isSaved={isSaved}
                      />
                    );
                  })}
                </View>
              )
            )}

            {matchedQueryHospitals.length === 0 && matchedServices.length === 0 && (
              <View style={styles.noResultsBox}>
                <Text style={styles.noResultsTitle}>No results found for "{query}"</Text>
                <Text style={styles.noResultsSub}>
                  Try searching for Orthopaedics, IVF, Cardiology, or check your spelling.
                </Text>
                <TouchableOpacity
                  style={styles.noResultsBtn}
                  onPress={() => setLocationModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.noResultsBtnText}>Change City ({location})</Text>
                </TouchableOpacity>
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
    paddingRight: 10,
    paddingLeft: 4,
  },
  backBtnText: {
    fontSize: 22,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
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
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  popularPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(253, 29, 116, 0.2)',
  },
  popularIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  popularText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catCard: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  catIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  catName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  locationSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  activeLocationBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    marginBottom: 8,
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
    fontSize: 22,
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
  },
  arrowText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  locationNoticeBox: {
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  locationNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  locationNoticeSub: {
    fontSize: 12,
    color: '#78350F',
  },
  noResultsBox: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  noResultsSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  noResultsBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  noResultsBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

