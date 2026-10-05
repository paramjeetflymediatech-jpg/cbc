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
import { Service, Hospital } from '../types';
import { colors } from '../theme/colors';
import { HospitalCard } from '../components/HospitalCard';
import { useAuth } from '../context/AuthContext';
import { isHospitalInLocation } from '../utils/locationHelper';
import { LocationModal } from '../components/LocationModal';
import { getServiceImageUrl } from '../utils/serviceImageHelper';

/**
 * Converts HTML from the rich-text editor to clean plain text.
 * Block-level elements (p, h1-h6, li, br, div, blockquote) are converted to
 * newlines so words don't smash together after tag removal.
 */
const stripHtml = (html?: string): string => {
  if (!html) return '';
  return html
    // Replace common block / line-break tags with a newline
    .replace(/<\/(p|h[1-6]|li|div|blockquote|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip all remaining tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Collapse multiple blank lines to at most two
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

interface ServiceDetailScreenProps {
  navigation: any;
  route: any;
}

export const ServiceDetailScreen: React.FC<ServiceDetailScreenProps> = ({ navigation, route }) => {
  const { savedHospitalIds, toggleSaveHospital, location } = useAuth();
  const [allHospitals, setAllHospitals] = useState<Hospital[]>([]);
  const [locationModalVisible, setLocationModalVisible] = useState<boolean>(false);

  const service: Service = route.params?.service || {
    id: 's1',
    name: 'Orthopaedics',
    slug: 'orthopaedics',
    category: 'Surgical & Rehabilitation',
    description: 'Find trusted hospitals and specialists for orthopaedic care, joint replacement, and sports medicine.',
    icon: '🦴',
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=80',
    popularTreatments: ['Knee Replacement', 'Hip Replacement', 'Sports Injury', 'Joint Pain Relief', 'Spine Surgery'],
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const res = await api.get('/hospitals');
      let fetchedList: Hospital[] = [];
      if (res.data && Array.isArray(res.data.hospitals)) {
        fetchedList = res.data.hospitals;
      } else if (Array.isArray(res.data)) {
        fetchedList = res.data;
      }
      setAllHospitals(fetchedList);
    } catch (e) {
      console.log('Error fetching dynamic hospitals in ServiceDetailScreen:', e);
      setAllHospitals([]);
    }
  };

  const matchingServiceHospitals = allHospitals.filter((h) => {
    const sName = (service.name || '').toLowerCase().trim();
    const sSlug = (service.slug || '').toLowerCase().trim();

    // 1. Match in hospital specialties
    const inSpecialties =
      Array.isArray(h.specialties) &&
      h.specialties.some((s) => {
        const item = s.toLowerCase().trim();
        return item.includes(sName) || sName.includes(item) || (sSlug && item.includes(sSlug));
      });

    // 2. Match in hospitalServices relation
    const inHospitalServices =
      Array.isArray((h as any).hospitalServices) &&
      (h as any).hospitalServices.some((hs: any) => {
        const hsName = (hs.service?.name || '').toLowerCase().trim();
        const hsSlug = (hs.service?.slug || '').toLowerCase().trim();
        const hsId = hs.serviceId || hs.service?.id;
        return (
          (service.id && hsId && String(hsId) === String(service.id)) ||
          (hsSlug && sSlug && hsSlug === sSlug) ||
          (hsName && sName && (hsName.includes(sName) || sName.includes(hsName)))
        );
      });

    // 3. Match in treatments
    const inTreatments =
      Array.isArray(h.treatments) &&
      h.treatments.some((t: any) => {
        const tName = (typeof t === 'string' ? t : t.name || '').toLowerCase();
        return tName.includes(sName) || (sSlug && tName.includes(sSlug));
      });

    // 4. Match in name or description
    const inNameOrDesc =
      (h.name && h.name.toLowerCase().includes(sName)) ||
      (h.description && h.description.toLowerCase().includes(sName));

    return inSpecialties || inHospitalServices || inTreatments || inNameOrDesc;
  });

  const localServiceHospitals = matchingServiceHospitals.filter((h) => isHospitalInLocation(h, location));
  const otherServiceHospitals = matchingServiceHospitals.filter((h) => !isHospitalInLocation(h, location));

  const hasLocal = localServiceHospitals.length > 0;
  const bannerImageUrl = getServiceImageUrl(service);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Top Banner */}
      <View style={styles.heroSection}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <Image source={{ uri: bannerImageUrl }} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroOverlay} />

        <View style={styles.heroContent}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>{service.icon || '🩺'}</Text>
          </View>
          <Text style={styles.serviceCategory}>{service.category || 'Specialized Medical Care'}</Text>
          <Text style={styles.serviceTitle}>{service.name}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Recommended Hospitals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.sectionHeading}>
                {hasLocal ? `Recommended in ${location}` : `Recommended ${service.name} Hospitals`}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={styles.locationPillBtn}
                onPress={() => setLocationModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.locationPillBtnText}>📍 {location} ▾</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Selector Modal */}
          <LocationModal
            visible={locationModalVisible}
            onClose={() => setLocationModalVisible(false)}
          />

          {/* Local Hospitals offering this service */}
          {hasLocal && (
            <View>
              {localServiceHospitals.map((hosp) => {
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
                      navigation.navigate('Enquiry', {
                        serviceName: service.name,
                        serviceId: service.id,
                        preferredHospital: hosp.name,
                        hospitalId: hosp.id,
                      })
                    }
                    onBookmarkPress={() => toggleSaveHospital(hId)}
                    isSaved={isSaved}
                  />
                );
              })}

              {/* Other Cities Hospitals offering this service */}
              {otherServiceHospitals.length > 0 && (
                <View style={{ marginTop: 18 }}>
                  <View style={styles.otherCentersBanner}>
                    <View style={styles.otherCentersHeaderRow}>
                      <Text style={styles.otherCentersIcon}>🌐</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.otherCentersTitle}>
                          Other {service.name} Centers in India
                        </Text>
                        <Text style={styles.otherCentersSub}>
                          Verified partner hospitals and specialized centers across India
                        </Text>
                      </View>
                      <View style={styles.otherCentersCountBadge}>
                        <Text style={styles.otherCentersCountText}>{otherServiceHospitals.length}</Text>
                      </View>
                    </View>
                  </View>
                  {otherServiceHospitals.map((hosp) => {
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
                          navigation.navigate('Enquiry', {
                            serviceName: service.name,
                            serviceId: service.id,
                            preferredHospital: hosp.name,
                            hospitalId: hosp.id,
                          })
                        }
                        onBookmarkPress={() => toggleSaveHospital(hId)}
                        isSaved={isSaved}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* When no local hospitals, but other cities have matching hospitals */}
          {!hasLocal && otherServiceHospitals.length > 0 && (
            <View>
              <View style={styles.otherCentersBanner}>
                <View style={styles.otherCentersHeaderRow}>
                  <Text style={styles.otherCentersIcon}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.otherCentersTitle}>
                      No {service.name} hospitals found directly in {location}
                    </Text>
                    <Text style={styles.otherCentersSub}>
                      Showing {otherServiceHospitals.length} verified {service.name} provider(s) across India:
                    </Text>
                  </View>
                  <View style={styles.otherCentersCountBadge}>
                    <Text style={styles.otherCentersCountText}>{otherServiceHospitals.length}</Text>
                  </View>
                </View>
              </View>

              {otherServiceHospitals.map((hosp) => {
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
                      navigation.navigate('Enquiry', {
                        serviceName: service.name,
                        serviceId: service.id,
                        preferredHospital: hosp.name,
                        hospitalId: hosp.id,
                      })
                    }
                    onBookmarkPress={() => toggleSaveHospital(hId)}
                    isSaved={isSaved}
                  />
                );
              })}
            </View>
          )}

          {/* When NO hospitals anywhere provide this service */}
          {matchingServiceHospitals.length === 0 && (
            <View style={styles.noHospitalsForServiceBox}>
              <Text style={styles.noHospIcon}>🩺</Text>
              <Text style={styles.noHospTitle}>Looking for {service.name} Care?</Text>
              <Text style={styles.noHospSubtitle}>
                We can connect you with certified {service.name} specialists and treatment packages across our partner network.
              </Text>
              <TouchableOpacity
                style={styles.bookConsultBtn}
                onPress={() =>
                  navigation.navigate('Enquiry', {
                    serviceName: service.name,
                    serviceId: service.id,
                  })
                }
                activeOpacity={0.85}
              >
                <Text style={styles.bookConsultBtnText}>Request {service.name} Consultation →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Popular Treatments Section */}
        {service.popularTreatments && service.popularTreatments.length > 0 && (
          <View style={styles.cardBox}>
            <Text style={styles.sectionHeading}>Popular Treatments & Procedures</Text>
            <Text style={styles.subHeadingText}>Select a procedure to enquire or find hospitals</Text>

            <View style={styles.treatmentList}>
              {service.popularTreatments.map((treatment, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.treatmentItem}
                  onPress={() =>
                    navigation.navigate('Enquiry', {
                      serviceName: service.name,
                      serviceId: service.id,
                      treatmentName: treatment,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.treatmentIconBox}>
                    <Text style={styles.checkIcon}>✓</Text>
                  </View>
                  <Text style={styles.treatmentTitle}>{treatment}</Text>
                  <Text style={styles.enquireArrow}>Enquire →</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Description & Content Details Box (Below Recommended Hospitals) */}
        <View style={styles.cardBox}>
          <Text style={styles.sectionHeading}>About {service.name}</Text>
          <Text style={styles.descriptionText}>
            {stripHtml(service.description) ||
              `Find leading hospital departments, expert surgeons, and comprehensive treatment options for ${service.name}.`}
          </Text>

          {service.subServices && service.subServices.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.subHeadingText, { fontWeight: '700', marginBottom: 8, color: colors.textPrimary }]}>
                Specialized Services & Coverage:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {service.subServices.map((sub, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: '#F8FAFC',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600' }}>
                      • {sub}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {service.priceRange && (
            <View
              style={{
                marginTop: 14,
                padding: 12,
                backgroundColor: '#F0FDF4',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#BBF7D0',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={{ fontSize: 11, color: '#166534', fontWeight: '700', textTransform: 'uppercase' }}>
                  Estimated Price Range
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#15803D', marginTop: 2 }}>
                  {service.priceRange}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Enquiry', {
                    serviceName: service.name,
                    serviceId: service.id,
                  })
                }
                style={{
                  backgroundColor: '#16A34A',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Get Exact Quote</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating CTA Footer */}
      <View style={[styles.footer, { display: 'none' }]}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() =>
            navigation.navigate('Main', { screen: 'Hospitals', params: { initialSpecialty: service.name } })
          }
          activeOpacity={0.88}
        >
          <Text style={styles.ctaButtonText}>Find {service.name} Hospitals</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroSection: {
    height: 200,
    position: 'relative',
    backgroundColor: colors.secondary,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  backBtn: {
    position: 'absolute',
    top: 12,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  backBtnText: {
    color: colors.textWhite,
    fontWeight: '700',
    fontSize: 13,
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 22,
  },
  serviceCategory: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  serviceTitle: {
    color: colors.textWhite,
    fontSize: 26,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  cardBox: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subHeadingText: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 14,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  treatmentList: {
    gap: 10,
  },
  treatmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  treatmentIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkIcon: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '900',
  },
  treatmentTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  enquireArrow: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '800',
  },
  serviceNoticeBox: {
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  serviceNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  serviceNoticeSub: {
    fontSize: 12,
    color: '#78350F',
  },
  noHospitalsForServiceBox: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: 6,
  },
  noHospIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  noHospTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  noHospSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  bookConsultBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  bookConsultBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  locationPillBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(253, 29, 116, 0.2)',
  },
  locationPillBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  otherCentersBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  otherCentersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  otherCentersIcon: {
    fontSize: 22,
  },
  otherCentersTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  otherCentersSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  otherCentersCountBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  otherCentersCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
