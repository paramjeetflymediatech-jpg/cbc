import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockHospitals, mockServices } from '../data/mockData';
import { colors } from '../theme/colors';
import { SearchBar } from '../components/SearchBar';
import { HospitalCard } from '../components/HospitalCard';

interface SearchScreenProps {
  navigation: any;
  route: any;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation, route }) => {
  const initialQuery = route.params?.initialQuery || '';
  const [query, setQuery] = useState<string>(initialQuery);

  const recentSearches = ['IVF Fertility', 'Orthopaedics', 'Chandigarh Hospitals', 'Knee Replacement'];
  const popularSearches = ['Best IVF Hospitals', 'Top Joint Replacement', 'Dental Implants', 'Max Hospital Mohali'];

  const matchedHospitals = query.trim()
    ? mockHospitals.filter(
        (h) =>
          (h.name && h.name.toLowerCase().includes(query.toLowerCase())) ||
          (h.location && h.location.toLowerCase().includes(query.toLowerCase())) ||
          (Array.isArray(h.specialties) && h.specialties.some((s) => s.toLowerCase().includes(query.toLowerCase())))
      )
    : [];

  const matchedServices = query.trim()
    ? mockServices.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          (s.description && s.description.toLowerCase().includes(query.toLowerCase()))
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
            placeholder="Search hospitals, treatments, doctors..."
          />
        </View>
      </View>

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
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Browse Categories</Text>
              <View style={styles.catGrid}>
                {mockServices.slice(0, 6).map((cat) => (
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
          </>
        ) : (
          <>
            {/* Search Results */}
            <Text style={styles.resultsTitle}>
              Search Results for "{query}"
            </Text>

            {matchedServices.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.subHeading}>Specialties & Services</Text>
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

            {matchedHospitals.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.subHeading}>Hospitals ({matchedHospitals.length})</Text>
                {matchedHospitals.map((hosp) => (
                  <HospitalCard
                    key={hosp.id || hosp._id}
                    hospital={hosp}
                    onPress={() => navigation.navigate('HospitalDetail', { hospital: hosp })}
                    onEnquirePress={() => navigation.navigate('Enquiry', { preferredHospital: hosp.name })}
                  />
                ))}
              </View>
            )}

            {matchedHospitals.length === 0 && matchedServices.length === 0 && (
              <View style={styles.noResultsBox}>
                <Text style={styles.noResultsTitle}>No results found for "{query}"</Text>
                <Text style={styles.noResultsSub}>Try searching for Orthopaedics, IVF, Max Hospital, or Chandigarh.</Text>
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
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
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
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
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
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  subHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMuted,
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
  },
});
