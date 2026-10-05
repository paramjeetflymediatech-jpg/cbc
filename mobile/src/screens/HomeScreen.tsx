import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { Hospital, Service } from '../types';
import {
  whyChooseCBCData,
  howItWorksData,
} from '../data/mockData';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { SearchBar } from '../components/SearchBar';
import { HospitalCard } from '../components/HospitalCard';
import { ServiceCard } from '../components/ServiceCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

import { useAuth } from '../context/AuthContext';
import { LocationModal } from '../components/LocationModal';
import { isHospitalInLocation } from '../utils/locationHelper';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, location, isAuthenticated, savedHospitalIds, toggleSaveHospital } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationModalVisible, setLocationModalVisible] = useState<boolean>(false);

  useEffect(() => {
    fetchFeaturedData();
  }, [location]);

  const fetchFeaturedData = async () => {
    try {
      setLoading(true);
      const [hospRes, servRes] = await Promise.allSettled([
        api.get('/hospitals'),
        api.get('/services'),
      ]);

      if (hospRes.status === 'fulfilled' && hospRes.value?.data) {
        const rawHosp = hospRes.value.data;
        if (Array.isArray(rawHosp.hospitals)) {
          setHospitals(rawHosp.hospitals);
        } else if (Array.isArray(rawHosp)) {
          setHospitals(rawHosp);
        } else {
          setHospitals([]);
        }
      } else {
        setHospitals([]);
      }

      if (servRes.status === 'fulfilled' && servRes.value?.data) {
        const rawServ = servRes.value.data;
        if (Array.isArray(rawServ.services)) {
          setServices(rawServ.services);
        } else if (Array.isArray(rawServ)) {
          setServices(rawServ);
        } else {
          setServices([]);
        }
      } else {
        setServices([]);
      }
    } catch (error) {
      console.log('Error fetching featured dynamic data:', error);
      setHospitals([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    navigation.navigate('Search', { initialQuery: searchQuery.trim(), location });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* App Header */}
      <AppHeader
        userName={user?.name}
        avatarUrl={user?.avatarUrl}
        avatarScale={user?.avatarScale}
        avatarTranslateX={user?.avatarTranslateX}
        avatarTranslateY={user?.avatarTranslateY}
        avatarRotate={user?.avatarRotate}
        location={location}
        onLocationPress={() => setLocationModalVisible(true)}
        onProfilePress={() => navigation.navigate('Profile')}
      />

      {/* Location Selector Modal */}
      <LocationModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar Section */}
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search services & hospitals in ${location || 'your city'}...`}
            onSearchSubmit={handleSearchSubmit}
            onPressIn={() =>
              navigation.navigate('Search', { initialQuery: searchQuery.trim(), location })
            }
          />
        </View>

        {/* Hero Section */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>⚡ CLINIC BY CHOICE</Text>
            </View>
          </View>
          
          <Text style={styles.heroTitle}>
            Your Health.{'\n'}
            <Text style={styles.heroHighlight}>Your Choice.</Text>
          </Text>

          

          <View style={styles.heroButtonRow}>
            <TouchableOpacity
              style={styles.heroPrimaryBtn}
              onPress={() => navigation.navigate('Main', { screen: 'Explore' })}
              activeOpacity={0.85}
            >
              <Text style={styles.heroPrimaryBtnText}>Explore Healthcare →</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.heroSecondaryBtn}
              onPress={() => navigation.navigate('Enquiry')}
              activeOpacity={0.85}
            >
              <Text style={styles.heroSecondaryBtnText}>Book Consultation</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Healthcare Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Explore Healthcare</Text>
              <Text style={styles.sectionSubtitle}>
                Top medical specialties & procedures {location ? `in ${location}` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Explore' })}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          {(() => {
            const hospitalsInCity = hospitals.filter((h) => isHospitalInLocation(h, location));
            const isAllLocations = !location || location.toLowerCase() === 'all' || location.toLowerCase() === 'all locations' || location.toLowerCase() === 'all india';
            const citySpecialties = Array.from(
              new Set(
                hospitalsInCity.flatMap((h) => [
                  ...(h.specialties || []),
                  ...((h.hospitalServices || []).map((hs: any) => hs.service?.name).filter(Boolean)),
                ]).map((s) => s.toLowerCase().trim())
              )
            );

            const servicesToRender =
              isAllLocations || citySpecialties.length === 0
                ? services
                : services.filter((s) =>
                    citySpecialties.some(
                      (spec) =>
                        spec.includes(s.name.toLowerCase().trim()) ||
                        s.name.toLowerCase().trim().includes(spec)
                    )
                  );

            const finalServices = servicesToRender.length > 0 ? servicesToRender : services;

            return (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {finalServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onPress={() => navigation.navigate('ServiceDetail', { service, location })}
                  />
                ))}
              </ScrollView>
            );
          })()}
        </View>

        {/* Top Hospitals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Top Hospitals in {location}</Text>
              <Text style={styles.sectionSubtitle}>Trusted healthcare providers in {location}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Hospitals' })}>
              <Text style={styles.seeAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <LoadingSkeleton type="card" />
          ) : (
            (() => {
              const hospitalsInLocation = hospitals.filter((h) => isHospitalInLocation(h, location));

              if (hospitalsInLocation.length === 0) {
                return (
                  <View style={styles.emptyLocationBox}>
                    <Text style={styles.emptyLocationIcon}>🏥</Text>
                    <Text style={styles.emptyLocationTitle}>No hospitals found in {location}</Text>
                    <Text style={styles.emptyLocationSub}>
                      We haven't onboarded accredited hospitals in {location} yet. You can change your location to explore nearby cities or browse all hospitals.
                    </Text>
                    <View style={styles.emptyLocationBtnRow}>
                      <TouchableOpacity
                        style={styles.emptyChangeCityBtn}
                        onPress={() => setLocationModalVisible(true)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.emptyChangeCityBtnText}>📍 Change City</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.emptyBrowseAllBtn}
                        onPress={() => navigation.navigate('Main', { screen: 'Hospitals' })}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.emptyBrowseAllBtnText}>Explore All</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }

              return hospitalsInLocation.slice(0, 3).map((hosp) => {
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
              });
            })()
          )}
        </View>

        {/* Why Choose Clinic By Choice? */}
        <View style={styles.whyChooseSection}>
          <Text style={styles.whyTitle}>Why Choose Clinic By Choice?</Text>
          <Text style={styles.whySubtitle}>Simplifying medical discovery with transparent guidance</Text>

          <View style={styles.whyGrid}>
            {whyChooseCBCData.map((item, idx) => (
              <View key={idx} style={styles.whyCard}>
                <Text style={styles.whyIcon}>{item.icon}</Text>
                <Text style={styles.whyCardTitle}>{item.title}</Text>
                <Text style={styles.whyCardDesc}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works Section */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.howTitle}>How It Works</Text>
          <Text style={styles.howSubtitle}>Connect with expert medical care in 3 easy steps</Text>

          <View style={styles.stepList}>
            {howItWorksData.map((item, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{item.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{item.title}</Text>
                  <Text style={styles.stepDesc}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Get Listed / Hospital Provider CTA Banner */}
        <View style={styles.getListedBanner}>
          <View style={styles.getListedContent}>
            <Text style={styles.getListedTag}>FOR HEALTHCARE PROVIDERS</Text>
            <Text style={styles.getListedTitle}>Grow Your Healthcare Practice</Text>
            <Text style={styles.getListedDesc}>
              List your hospital or clinic on Clinic By Choice and connect with thousands of patients.
            </Text>
            <View style={styles.getListedButtonsRow}>
              <TouchableOpacity
                style={styles.getListedBtn}
                onPress={() => navigation.navigate('GetListed')}
                activeOpacity={0.85}
              >
                <Text style={styles.getListedBtnText}>List Your Hospital →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pricingBtn}
                onPress={() => navigation.navigate('Pricing')}
                activeOpacity={0.85}
              >
                <Text style={styles.pricingBtnText}>⚡ View Pricing</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  scrollContent: {
    paddingBottom: 32,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  heroBanner: {
    backgroundColor: colors.secondary,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  heroBadge: {
    backgroundColor: 'rgba(253, 29, 116, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(253, 29, 116, 0.4)',
  },
  heroBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textWhite,
    lineHeight: 36,
    marginBottom: 8,
  },
  heroHighlight: {
    color: colors.primary,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 20,
  },
  heroButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroPrimaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  heroPrimaryBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '800',
  },
  heroSecondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroSecondaryBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLight: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    marginBottom: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  horizontalScroll: {
    paddingRight: 20,
  },
  treatmentPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  treatmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  treatmentPillIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  treatmentPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  whyChooseSection: {
    backgroundColor: colors.surface,
    padding: 24,
    marginBottom: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  whyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  whySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  whyCard: {
    width: '48%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  whyIcon: {
    fontSize: 26,
    marginBottom: 8,
  },
  whyCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  whyCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  howItWorksSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  howTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  howSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  stepList: {
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  stepBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  getListedBanner: {
    marginHorizontal: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(253, 29, 116, 0.2)',
  },
  getListedContent: {},
  getListedTag: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  getListedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  getListedDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  getListedButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  getListedBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  getListedBtnText: {
    color: colors.textWhite,
    fontWeight: '800',
    fontSize: 13,
  },
  pricingBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  pricingBtnText: {
    color: '#FF4D8D',
    fontWeight: '800',
    fontSize: 13,
  },
  emptyLocationBox: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: 8,
  },
  emptyLocationIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyLocationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyLocationSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyLocationBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyChangeCityBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  emptyChangeCityBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyBrowseAllBtn: {
    backgroundColor: colors.background,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyBrowseAllBtnText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});
