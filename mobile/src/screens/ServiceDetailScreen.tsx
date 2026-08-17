import React from 'react';
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
import { Service } from '../types';
import { mockHospitals } from '../data/mockData';
import { colors } from '../theme/colors';
import { HospitalCard } from '../components/HospitalCard';

interface ServiceDetailScreenProps {
  navigation: any;
  route: any;
}

export const ServiceDetailScreen: React.FC<ServiceDetailScreenProps> = ({ navigation, route }) => {
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

  const recommendedHospitals = mockHospitals.filter((h) =>
    Array.isArray(h.specialties) && h.specialties.some((s) => s.toLowerCase().includes(service.name.toLowerCase()))
  );

  const displayHospitals = recommendedHospitals.length > 0 ? recommendedHospitals : mockHospitals.slice(0, 2);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Top Banner */}
      <View style={styles.heroSection}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <Image source={{ uri: service.image }} style={styles.heroImage} />
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
        {/* Description Box */}
        <View style={styles.cardBox}>
          <Text style={styles.sectionHeading}>About {service.name}</Text>
          <Text style={styles.descriptionText}>
            {service.description ||
              `Find leading hospital departments, expert surgeons, and comprehensive treatment options for ${service.name}.`}
          </Text>
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

        {/* Recommended Hospitals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Recommended Hospitals</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Main', { screen: 'Hospitals', params: { initialSpecialty: service.name } })}
            >
              <Text style={styles.seeAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {displayHospitals.map((hosp) => (
            <HospitalCard
              key={hosp.id || hosp.name}
              hospital={hosp}
              onPress={() => navigation.navigate('HospitalDetail', { hospital: hosp })}
              onEnquirePress={() =>
                navigation.navigate('Enquiry', {
                  serviceName: service.name,
                  preferredHospital: hosp.name,
                })
              }
            />
          ))}
        </View>
      </ScrollView>

      {/* Floating CTA Footer */}
      <View style={styles.footer}>
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
});
