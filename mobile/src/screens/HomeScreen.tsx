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
  mockHospitals,
  mockServices,
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
import { useSweetAlert } from '../context/SweetAlertContext';
import { LocationModal } from '../components/LocationModal';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, location, isAuthenticated } = useAuth();
  const { showAlert } = useSweetAlert();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationModalVisible, setLocationModalVisible] = useState<boolean>(false);

  useEffect(() => {
    fetchFeaturedData();
  }, []);

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
          setHospitals(mockHospitals.slice(0, 3));
        }
      } else {
        setHospitals(mockHospitals.slice(0, 3));
      }

      if (servRes.status === 'fulfilled' && servRes.value?.data) {
        const rawServ = servRes.value.data;
        if (Array.isArray(rawServ.services)) {
          setServices(rawServ.services);
        } else if (Array.isArray(rawServ)) {
          setServices(rawServ);
        } else {
          setServices(mockServices.slice(0, 4));
        }
      } else {
        setServices(mockServices.slice(0, 4));
      }
    } catch (error) {
      console.log('Error fetching featured data, using mock fallback:', error);
      setHospitals(mockHospitals.slice(0, 3));
      setServices(mockServices.slice(0, 4));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { initialQuery: searchQuery.trim() });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* App Header */}
      <AppHeader
        userName={user?.name}
        location={location}
        unreadCount={2}
        onLocationPress={() => setLocationModalVisible(true)}
        onNotificationPress={() => {
          if (isAuthenticated) {
            navigation.navigate('Notifications');
          } else {
            showAlert({
              title: 'Login Required',
              message: 'Please login first to view notifications.',
              type: 'warning',
              confirmText: 'Login',
              cancelText: 'Cancel',
              onConfirm: () => navigation.navigate('Auth'),
            });
          }
        }}
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
            placeholder="Search doctors, hospitals, treatments..."
            onSearchSubmit={handleSearchSubmit}
            onPressIn={() => navigation.navigate('Search')}
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

          <Text style={styles.heroSubtitle}>
            Discover trusted NABH accredited hospitals and specialists in one unified platform.
          </Text>

          <View style={styles.heroButtonRow}>
            <TouchableOpacity
              style={styles.heroPrimaryBtn}
              onPress={() => navigation.navigate('Main', { screen: 'Hospitals' })}
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
              <Text style={styles.sectionSubtitle}>Top medical specialties & procedures</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Explore' })}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onPress={() => navigation.navigate('ServiceDetail', { service })}
              />
            ))}
          </ScrollView>
        </View>

        {/* Popular Treatments Quick Pills */}
        <View style={styles.sectionLight}>
          <Text style={styles.sectionTitle}>Popular Treatments</Text>
          <Text style={styles.sectionSubtitle}>Quickly find solutions for common health needs</Text>
          
          <View style={styles.treatmentPillContainer}>
            {['Knee Replacement', 'IVF Cycle', 'Coronary Angioplasty', 'Laser Eye LASIK', 'Dental Implants', 'Hair Transplant'].map((t, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.treatmentPill}
                onPress={() => navigation.navigate('Search', { initialQuery: t })}
                activeOpacity={0.8}
              >
                <Text style={styles.treatmentPillIcon}>🩺</Text>
                <Text style={styles.treatmentPillText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
              const locClean = (location || '').toLowerCase().trim();
              const filtered = hospitals.filter((h) => {
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

              const listToRender = filtered.length > 0 ? filtered : hospitals;

              return listToRender.slice(0, 3).map((hosp) => (
                <HospitalCard
                  key={hosp.id || hosp._id || hosp.name}
                  hospital={hosp}
                  onPress={() => navigation.navigate('HospitalDetail', { hospital: hosp })}
                  onEnquirePress={() => navigation.navigate('Enquiry', { preferredHospital: hosp.name })}
                />
              ));
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
            <TouchableOpacity
              style={styles.getListedBtn}
              onPress={() => navigation.navigate('GetListed')}
              activeOpacity={0.85}
            >
              <Text style={styles.getListedBtnText}>List Your Hospital →</Text>
            </TouchableOpacity>
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
  getListedBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  getListedBtnText: {
    color: colors.textWhite,
    fontWeight: '800',
    fontSize: 13,
  },
});
