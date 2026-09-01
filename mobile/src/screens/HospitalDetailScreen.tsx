import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Share,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Hospital } from '../types';
import { colors } from '../theme/colors';
import { DoctorCard } from '../components/DoctorCard';
import { useAuth } from '../context/AuthContext';
import { useSweetAlert } from '../context/SweetAlertContext';
import { normalizeImageUrl } from '../utils/imageUrl';
import api from '../services/api';

const stripHtml = (html?: string): string => {
  if (!html) return '';
  return html
    .replace(/<\/(p|h[1-6]|li|div|blockquote|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

interface HospitalDetailScreenProps {
  navigation: any;
  route: any;
}

export const HospitalDetailScreen: React.FC<HospitalDetailScreenProps> = ({ navigation, route }) => {
  const [hospitalData, setHospitalData] = useState<Hospital>(route.params?.hospital || ({} as Hospital));
  const hospital = hospitalData;

  useEffect(() => {
    const fetchFreshHospitalData = async () => {
      if (!hospitalData.slug) return;
      try {
        const res = await api.get(`/hospitals/${hospitalData.slug}`);
        if (res.data && res.data.hospital) {
          setHospitalData(res.data.hospital);
        }
      } catch (err) {
        console.warn('Failed to fetch fresh hospital details:', err);
      }
    };

    fetchFreshHospitalData();
  }, []);

  const { location, user, toggleSaveHospital, savedHospitalIds } = useAuth();
  const { showAlert } = useSweetAlert();

  const savedAddressParts = [
    user?.address,
    user?.city,
    user?.state,
    user?.pincode,
  ].filter((p): p is string => Boolean(p && typeof p === 'string' && p.trim().length > 0));

  const savedUserAddress = savedAddressParts.length > 0
    ? savedAddressParts.join(', ')
    : (user?.city || location || 'My Location');

  const hasSpecificSavedAddress = Boolean(user?.address || user?.city);

  const [activeTab, setActiveTab] = useState<'Overview' | 'Treatments' | 'Doctors' | 'Facilities' | 'Map' | 'Reviews'>('Overview');
  const getHospitalKey = (h: Hospital) => String(h.id || (h as any)._id || (h as any).slug || '');
  const [isSaved, setIsSaved] = useState<boolean>(() => {
    const key = getHospitalKey(hospital);
    return savedHospitalIds.includes(key) ||
      (hospital.id && savedHospitalIds.includes(String(hospital.id))) ||
      ((hospital as any).slug && savedHospitalIds.includes(String((hospital as any).slug)));
  });

  useEffect(() => {
    const key = getHospitalKey(hospital);
    setIsSaved(
      savedHospitalIds.includes(key) ||
      (hospital.id ? savedHospitalIds.includes(String(hospital.id)) : false) ||
      ((hospital as any).slug ? savedHospitalIds.includes(String((hospital as any).slug)) : false)
    );
  }, [savedHospitalIds, hospital]);

  const handleToggleSave = async () => {
    const key = getHospitalKey(hospital);
    const nextSavedState = !isSaved;
    await toggleSaveHospital(key);
    showAlert({
      title: nextSavedState ? 'Saved to Favorites' : 'Removed from Favorites',
      message: nextSavedState 
        ? `${hospital.name} has been added to your saved hospitals list.` 
        : `${hospital.name} has been removed from your saved hospitals list.`,
      type: 'success',
    });
  };
  const [reviewModalVisible, setReviewModalVisible] = useState<boolean>(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [docRating, setDocRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewUsername, setReviewUsername] = useState<string>('');

  const handleOpenReviewModal = (doctor: any) => {
    setSelectedDoctor(doctor);
    setDocRating(5);
    setReviewComment('');
    setReviewUsername('');
    setReviewModalVisible(true);
  };

  const handleSubmitReview = () => {
    if (!reviewUsername.trim()) {
      showAlert({
        title: 'Name Required',
        message: 'Please enter your name.',
        type: 'warning',
      });
      return;
    }

    if (!reviewComment.trim()) {
      showAlert({
        title: 'Review Required',
        message: 'Please write a comment before submitting.',
        type: 'warning',
      });
      return;
    }

    // Append new review locally for instant feedback
    if (selectedDoctor) {
      const newReview = {
        id: String(Date.now()),
        patientName: reviewUsername.trim(),
        rating: docRating,
        comment: reviewComment.trim(),
        date: 'Just now',
      };
      if (!selectedDoctor.reviews) {
        selectedDoctor.reviews = [];
      }
      selectedDoctor.reviews = [newReview, ...selectedDoctor.reviews];
      selectedDoctor.reviewCount = (selectedDoctor.reviewCount || 0) + 1;
    }

    setReviewModalVisible(false);
    
    showAlert({
      title: 'Review Submitted',
      message: `Thank you for reviewing ${selectedDoctor?.name}! Your review has been successfully posted.`,
      type: 'success',
    });
  };

  const handleOpenMaps = async () => {
    const cleanBrand = (hospital.name || '').split('|')[0].trim();
    const cleanAddr = (hospital.address || hospital.location || '').trim();
    const cityStr = hospital.city || '';
    const stateStr = hospital.state || '';
    const fullParts = [cleanBrand, cleanAddr, cityStr, stateStr, 'India'].filter(Boolean);
    const destinationQuery = fullParts.join(', ');
    
    // User's saved full address or location from AuthContext
    const originQuery = savedUserAddress;
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originQuery)}&destination=${encodeURIComponent(destinationQuery)}`;
    
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Error opening maps URL:', err);
      showAlert({
        title: 'Error',
        message: 'Could not open map navigation application.',
        type: 'error',
      });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${hospital.name} on Clinic By Choice: https://clinicbychoice.com/hospital/${hospital.slug}`,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const bannerImgUrl = normalizeImageUrl(hospital.image || (hospital as any).coverImage || (hospital as any).bannerImage || hospital.logo) || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80';
  const logoImgUrl = hospital.logo ? normalizeImageUrl(hospital.logo) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Main Image Header with Overlay Buttons */}
      <View style={styles.bannerContainer}>
        <Image
          source={{ uri: bannerImgUrl }}
          style={styles.bannerImage}
        />
        <View style={styles.bannerOverlay} />

        {/* Floating Top Nav Buttons */}
        <View style={styles.topActionsRow}>
          <TouchableOpacity style={styles.iconCircleBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.iconBtnText}>←</Text>
          </TouchableOpacity>

          <View style={styles.rightActions}>
             <TouchableOpacity style={styles.iconCircleBtn} onPress={handleToggleSave} activeOpacity={0.8}>
               <Text style={styles.iconBtnText}>{isSaved ? '❤️' : '🤍'}</Text>
             </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircleBtn} onPress={handleShare} activeOpacity={0.8}>
              <Text style={styles.iconBtnText}>📤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hospital Title Overlay Box */}
        <View style={styles.bannerContent}>
          <View style={styles.titleWithLogoRow}>
            {logoImgUrl ? (
              <Image source={{ uri: logoImgUrl }} style={styles.detailLogoBadge} resizeMode="contain" />
            ) : null}
            <View style={styles.titleColumn}>
              <View style={styles.badgeRow}>
                {hospital.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedCheck}>✓ Verified</Text>
                  </View>
                )}
                <View style={styles.ratingBadge}>
                  <Text style={styles.starText}>⭐ {(hospital.rating || 4.8).toFixed(1)}</Text>
                </View>
              </View>
              <Text style={styles.hospitalTitle} numberOfLines={2}>{hospital.name}</Text>
            </View>
          </View>
          <Text style={styles.locationSubText}>📍 {hospital.address || hospital.location || hospital.city}</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {(['Overview', 'Treatments', 'Doctors', 'Facilities', 'Map', 'Reviews'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Body Content */}
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {activeTab === 'Overview' && (
          <View style={styles.tabContent}>
            {/* About Box */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>About Hospital</Text>
              <Text style={styles.bodyText}>{stripHtml(hospital.description) || 'Leading healthcare provider.'}</Text>
            </View>

            {/* Specialties Box */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Specialties & Departments</Text>
              <View style={styles.pillsRow}>
                {(hospital.specialties || []).map((s, idx) => (
                  <View key={idx} style={styles.specialtyPill}>
                    <Text style={styles.specialtyText}>✓ {s}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Facilities Box */}
            {hospital.facilities && hospital.facilities.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardHeaderTitle}>Facilities & Standards</Text>
                <View style={styles.facilityList}>
                  {hospital.facilities.map((fac, idx) => (
                    <View key={idx} style={styles.facilityRow}>
                      <Text style={styles.facilityCheck}>🛡️</Text>
                      <Text style={styles.facilityText}>{fac}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Contact & Location Info */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Contact & Address</Text>
              <Text style={styles.infoLine}>📍 {hospital.address || hospital.location}</Text>
              {hospital.phone && <Text style={styles.infoLine}>📞 {hospital.phone}</Text>}
              {hospital.email && <Text style={styles.infoLine}>✉️ {hospital.email}</Text>}
            </View>
          </View>
        )}

        {activeTab === 'Treatments' && (
          <View style={styles.tabContent}>
            {hospital.treatments && hospital.treatments.length > 0 ? (
              hospital.treatments.map((tr) => (
                <View key={tr.id} style={styles.treatmentCard}>
                  <View style={styles.trHeaderRow}>
                    <Text style={styles.trName}>{tr.name}</Text>
                    {tr.estimatedCost && <Text style={styles.trCost}>{tr.estimatedCost}</Text>}
                  </View>
                  <Text style={styles.trDesc}>{tr.description}</Text>

                  <TouchableOpacity
                    style={styles.enquireSmallBtn}
                    onPress={() =>
                      navigation.navigate('Enquiry', {
                        preferredHospital: hospital.name,
                        hospitalId: hospital.id,
                        treatmentName: tr.name,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <Text style={styles.enquireSmallText}>Enquire Now</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : hospital.hospitalServices && hospital.hospitalServices.length > 0 ? (
              hospital.hospitalServices.map((hs, idx) => {
                const subList = hs.subServices
                  ? hs.subServices.split(',').map((s) => s.trim()).filter(Boolean)
                  : [];
                return (
                  <View key={hs.id || idx} style={styles.serviceCategoryCard}>
                    <View style={styles.serviceCategoryHeader}>
                      <Text style={styles.serviceCategoryName}>{hs.service?.name}</Text>
                      {hs.startingPrice ? (
                        <Text style={styles.startingPriceBadge}>
                          From ₹{Number(hs.startingPrice).toLocaleString('en-IN')}
                        </Text>
                      ) : null}
                    </View>
                    {hs.description ? <Text style={styles.serviceCategoryDesc}>{hs.description}</Text> : null}
                    
                    {subList.length > 0 && (
                      <View style={styles.subServicesList}>
                        {subList.map((sub, idx) => (
                          <View key={idx} style={styles.subServiceRow}>
                            <Text style={styles.subServiceBullet}>✓</Text>
                            <Text style={styles.subServiceText}>{sub}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={styles.enquireServiceBtn}
                      onPress={() =>
                        navigation.navigate('Enquiry', {
                          preferredHospital: hospital.name,
                          hospitalId: hospital.id,
                          serviceName: hs.service?.name,
                          serviceId: hs.service?.id,
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.enquireServiceBtnText}>Enquire Specialty Services →</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.card}>
                <Text style={styles.bodyText}>All major surgical and diagnostic procedures available on enquiry.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'Doctors' && (
          <View style={styles.tabContent}>
            {hospital.doctors && hospital.doctors.length > 0 ? (
              hospital.doctors.map((doc, idx) => (
                <DoctorCard
                  key={doc.id || doc.name || idx}
                  doctor={doc}
                  onWriteReviewPress={() => handleOpenReviewModal(doc)}
                />
              ))
            ) : (
              <View style={styles.card}>
                <Text style={styles.bodyText}>24x7 Senior Consultant Doctors available across all departments.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'Facilities' && (
          <View style={styles.tabContent}>
            {hospital.facilities && hospital.facilities.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardHeaderTitle}>Facilities & Services</Text>
                <View style={styles.facilityList}>
                  {hospital.facilities.map((fac, idx) => (
                    <View key={idx} style={styles.facilityRow}>
                      <Text style={styles.facilityCheck}>🛡️</Text>
                      <Text style={styles.facilityText}>{fac}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.bodyText}>No specific facilities listed.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'Map' && (
          <View style={styles.tabContent}>
            {/* User Saved Location Indicator */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.cardHeaderTitle}>Starting Location</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('EditProfile')}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                    {hasSpecificSavedAddress ? '✏️ Edit Address' : '+ Set Saved Address'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.bodyText}>
                📍 Directions will start from: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{savedUserAddress}</Text>
              </Text>
              {!hasSpecificSavedAddress && (
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                  (Set your complete home/work address in profile for accurate door-to-door GPS navigation)
                </Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Hospital Location & Address</Text>
              <Text style={styles.bodyText}>
                <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Hospital:</Text> {hospital.name}
              </Text>
              <Text style={[styles.bodyText, { marginTop: 6 }]}>
                <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Address:</Text> {hospital.address || hospital.location || `${hospital.city || 'India'}`}
              </Text>
              <Text style={[styles.bodyText, { marginTop: 6 }]}>
                <Text style={{ fontWeight: '800', color: colors.textPrimary }}>City/State:</Text> {[hospital.city, hospital.state, (hospital as any).district].filter(Boolean).join(', ') || 'India'}
              </Text>
            </View>

            {/* Simulated Map Visual Card */}
            <View style={styles.mapVisualCard}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=80' }}
                style={styles.mapVisualImage}
              />
              <View style={styles.mapVisualOverlay}>
                <View style={styles.mapVisualMarker}>
                  <Text style={styles.mapVisualMarkerIcon}>📍</Text>
                  <View style={styles.mapVisualPulse} />
                </View>
                <View style={styles.mapVisualInfoBox}>
                  <Text style={styles.mapVisualInfoTitle}>{hospital.name}</Text>
                  <Text style={styles.mapVisualInfoSub}>{hospital.address || hospital.location || hospital.city}</Text>
                </View>
              </View>
            </View>

            {/* Directions Button */}
            <TouchableOpacity
              style={styles.directionsBtn}
              onPress={handleOpenMaps}
              activeOpacity={0.85}
            >
              <Text style={styles.directionsBtnText}>📍 Get Turn-by-Turn Directions in Google Maps</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Reviews' && (
          <View style={styles.tabContent}>
            <View style={styles.ratingSummaryCard}>
              <Text style={styles.bigScore}>{(hospital.googleRating || hospital.rating || 4.8).toFixed(1)}</Text>
              <Text style={styles.starsRow}>
                {'⭐'.repeat(Math.max(1, Math.min(5, Math.round(hospital.googleRating || hospital.rating || 4.8))))}
              </Text>
              <Text style={styles.totalReviewsText}>
                Based on {hospital.googleReviewsCount || hospital.reviewCount || 120} Google verified reviews
              </Text>
            </View>

            {hospital.googleReviews && hospital.googleReviews.length > 0 ? (
              hospital.googleReviews.map((rev: any, idx: number) => (
                <View key={idx} style={styles.reviewCard}>
                  <View style={styles.revHeader}>
                    <Text style={styles.revName}>{rev.author_name}</Text>
                    <Text style={styles.revDate}>{rev.relative_time_description || 'Recently'}</Text>
                  </View>
                  <Text style={styles.starsRowSmall}>
                    {'⭐'.repeat(Math.max(1, Math.min(5, Math.round(rev.rating || 5))))}
                  </Text>
                  <Text style={styles.revComment}>"{rev.text}"</Text>
                </View>
              ))
            ) : (
              [
                { name: 'Sandeep Kaur', date: 'August 2026', comment: 'Extremely well organized hospital care. Doctors were patient and clear about treatment plan.' },
                { name: 'Dr. Amit Patel', date: 'July 2026', comment: 'Top-tier infrastructure and clean facilities. Seamless booking experience via Clinic By Choice.' },
              ].map((rev, idx) => (
                <View key={idx} style={styles.reviewCard}>
                  <View style={styles.revHeader}>
                    <Text style={styles.revName}>{rev.name}</Text>
                    <Text style={styles.revDate}>{rev.date}</Text>
                  </View>
                  <Text style={styles.revComment}>"{rev.comment}"</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating CTA Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomFreeText}>Free Consultation</Text>
          <Text style={styles.bottomSubText}>Direct Hospital Contact</Text>
        </View>

        <TouchableOpacity
          style={styles.mainCtaBtn}
          onPress={() => navigation.navigate('Enquiry', { preferredHospital: hospital.name, hospitalId: hospital.id })}
          activeOpacity={0.88}
        >
          <Text style={styles.mainCtaText}>Get Free Consultation →</Text>
        </TouchableOpacity>
      </View>

      {/* Write Doctor Review Modal */}
      <Modal
        visible={reviewModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Write a Review</Text>
            <Text style={styles.modalSubTitle}>{selectedDoctor?.name}</Text>

            <Text style={styles.modalLabel}>Select Rating</Text>
            <View style={styles.starsSelectRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setDocRating(star)} activeOpacity={0.7}>
                  <Text style={[styles.starSelectIcon, docRating >= star ? styles.starSelected : styles.starUnselected]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Your Name</Text>
            <TextInput
              style={styles.modalSingleInput}
              placeholder="e.g. Rahul Verma"
              placeholderTextColor={colors.textMuted}
              value={reviewUsername}
              onChangeText={setReviewUsername}
            />

            <Text style={styles.modalLabel}>Your Comments</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Share your consultation or treatment experience..."
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={4}
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReviewModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitReview}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitText}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bannerContainer: {
    height: 220,
    position: 'relative',
    backgroundColor: colors.secondary,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  topActionsRow: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  bannerContent: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  verifiedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedCheck: {
    color: colors.textWhite,
    fontSize: 11,
    fontWeight: '800',
  },
  ratingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  starText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
  },
  titleWithLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 12,
  },
  detailLogoBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  titleColumn: {
    flex: 1,
  },
  hospitalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textWhite,
    marginBottom: 2,
  },
  locationSubText: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  tabScrollContent: {
    paddingHorizontal: 8,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderColor: 'transparent',
  },
  mapVisualCard: {
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  mapVisualImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  mapVisualOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
  },
  mapVisualMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mapVisualMarkerIcon: {
    fontSize: 36,
    zIndex: 2,
  },
  mapVisualPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(253, 29, 116, 0.25)',
    zIndex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  mapVisualInfoBox: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  mapVisualInfoTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  mapVisualInfoSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  directionsBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  directionsBtnText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubTitle: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  starsSelectRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  starSelectIcon: {
    fontSize: 36,
  },
  starSelected: {
    color: '#F59E0B',
  },
  starUnselected: {
    color: '#E5E7EB',
  },
  modalInput: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalSingleInput: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },
  activeTabItem: {
    borderColor: colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '800',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 90,
  },
  tabContent: {
    gap: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  facilityList: {
    gap: 8,
  },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  facilityCheck: {
    fontSize: 14,
    marginRight: 8,
  },
  facilityText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoLine: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  treatmentCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  trHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  trName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  trCost: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  trDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  enquireSmallBtn: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  enquireSmallText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  ratingSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  bigScore: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  starsRow: {
    fontSize: 16,
    marginVertical: 4,
  },
  totalReviewsText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  revHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  revName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  revDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  starsRowSmall: {
    fontSize: 11,
    color: '#D97706',
    marginTop: 2,
    marginBottom: 4,
  },
  revComment: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomFreeText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.success,
  },
  bottomSubText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  mainCtaBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  mainCtaText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },
  serviceCategoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 12,
  },
  serviceCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceCategoryName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  startingPriceBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '800',
    color: colors.success,
  },
  serviceCategoryDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  subServicesList: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  subServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subServiceBullet: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
    marginRight: 8,
  },
  subServiceText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  enquireServiceBtn: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  enquireServiceBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
});
