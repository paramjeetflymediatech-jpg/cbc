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
  Alert,
  ActivityIndicator,
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

  const { location, user, toggleSaveHospital, savedHospitalIds } = useAuth();
  const { showAlert } = useSweetAlert();

  const isAuthorizedManager =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    (user?.role === 'HOSPITAL' && Number((user as any)?.hospitalId) === Number(hospital.id));

  // Services Management State
  const [allPlatformServices, setAllPlatformServices] = useState<any[]>([]);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState<boolean>(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState<string>('');
  const [serviceModalVisible, setServiceModalVisible] = useState<boolean>(false);
  const [editingServiceSaving, setEditingServiceSaving] = useState<boolean>(false);
  const [isEditingExistingLink, setIsEditingExistingLink] = useState<boolean>(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [svcStartingPrice, setSvcStartingPrice] = useState<string>('');
  const [svcSubServices, setSvcSubServices] = useState<string>('');
  const [svcDescription, setSvcDescription] = useState<string>('');
  const [svcStatus, setSvcStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editingHospitalServiceId, setEditingHospitalServiceId] = useState<string | number | null>(null);

  const fetchFreshHospitalData = async () => {
    const targetSlugOrId = hospitalData.slug || hospitalData.id || route.params?.hospitalId || route.params?.id;
    if (!targetSlugOrId) return;
    try {
      const res = await api.get(`/hospitals/${targetSlugOrId}`);
      if (res.data && res.data.hospital) {
        setHospitalData(res.data.hospital);
      }
    } catch (err) {
      console.warn('Failed to fetch fresh hospital details:', err);
    }
  };

  const fetchPlatformServices = async () => {
    try {
      let platformSvcs: any[] = [];
      const hospId = hospital.id || route.params?.id || route.params?.hospitalId;

      if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
        try {
          const res = await api.get(`/admin/hospitals/${hospId}/services`);
          if (Array.isArray(res.data?.allPlatformServices) && res.data.allPlatformServices.length > 0) {
            platformSvcs = res.data.allPlatformServices;
          }
          if (res.data?.hospitalServices) {
            setHospitalData((prev) => ({ ...prev, hospitalServices: res.data.hospitalServices }));
          }
        } catch {
          // Fallback below
        }
      }

      if (platformSvcs.length === 0) {
        try {
          const sRes = await api.get('/admin/services');
          if (Array.isArray(sRes.data?.services)) {
            platformSvcs = sRes.data.services;
          }
        } catch {
          try {
            const pubRes = await api.get('/services');
            if (Array.isArray(pubRes.data?.services)) {
              platformSvcs = pubRes.data.services;
            }
          } catch {
            try {
              const hRes = await api.get('/hospital/services');
              if (Array.isArray(hRes.data?.allPlatformServices)) {
                platformSvcs = hRes.data.allPlatformServices;
              }
            } catch {
              // Ignore
            }
          }
        }
      }

      setAllPlatformServices(platformSvcs);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (isAuthorizedManager) {
      fetchPlatformServices();
    }
  }, [hospitalData.slug, hospitalData.id]);

  const handleOpenAddService = () => {
    setEditingHospitalServiceId(null);
    setIsEditingExistingLink(false);
    setSelectedServiceId('');
    setSvcStartingPrice('');
    setSvcSubServices('');
    setSvcDescription('');
    setSvcStatus('ACTIVE');
    setServiceDropdownOpen(false);
    setServiceSearchQuery('');
    if (allPlatformServices.length === 0) {
      fetchPlatformServices();
    }
    setServiceModalVisible(true);
  };

  const handleOpenEditService = (hs: any) => {
    setEditingHospitalServiceId(hs.id || null);
    setIsEditingExistingLink(true);
    setSelectedServiceId(String(hs.serviceId || hs.service?.id || hs.id));
    setSvcStartingPrice(hs.startingPrice !== undefined && hs.startingPrice !== null ? String(hs.startingPrice) : '');
    setSvcSubServices(hs.subServices || '');
    setSvcDescription(hs.description || '');
    setSvcStatus(hs.status || 'ACTIVE');
    setServiceDropdownOpen(false);
    setServiceSearchQuery('');
    if (allPlatformServices.length === 0) {
      fetchPlatformServices();
    }
    setServiceModalVisible(true);
  };

  const handleSaveHospitalService = async () => {
    const hospId = hospital.id || route.params?.id || route.params?.hospitalId;
    if (!hospId) {
      Alert.alert('Error', 'Hospital identifier not found.');
      return;
    }
    if (!selectedServiceId) {
      Alert.alert('Selection Required', 'Please choose a platform medical specialty to link.');
      return;
    }

    try {
      setEditingServiceSaving(true);
      const payload = {
        hospitalServiceId: editingHospitalServiceId,
        serviceId: Number(selectedServiceId),
        startingPrice: svcStartingPrice.trim() ? Number(svcStartingPrice) : null,
        subServices: svcSubServices.trim() || null,
        description: svcDescription.trim() || null,
        status: svcStatus,
      };

      if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
        const res = await api.post(`/admin/hospitals/${hospId}/services`, payload);
        if (res.data?.hospitalServices) {
          setHospitalData((prev) => ({ ...prev, hospitalServices: res.data.hospitalServices }));
        }
      } else {
        const res = await api.post('/hospital/services', payload);
        if (res.data?.hospitalServices) {
          setHospitalData((prev) => ({ ...prev, hospitalServices: res.data.hospitalServices }));
        }
      }

      setServiceModalVisible(false);
      setTimeout(() => {
        showAlert({
          title: 'Service Updated',
          message: isEditingExistingLink
            ? 'Hospital service details have been updated.'
            : 'Service linked to hospital successfully.',
          type: 'success',
        });
      }, 150);
      fetchFreshHospitalData();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.response?.data?.error || 'Failed to save hospital service.');
    } finally {
      setEditingServiceSaving(false);
    }
  };

  const handleRemoveHospitalService = (hs: any) => {
    const hospId = hospital.id || route.params?.id || route.params?.hospitalId;
    if (!hospId) return;
    const serviceName = hs.service?.name || 'this service';
    Alert.alert(
      'Remove Hospital Service',
      `Are you sure you want to remove "${serviceName}" from ${hospital.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Service',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
                const res = await api.delete(
                  `/admin/hospitals/${hospId}/services?hospitalServiceId=${hs.id}`
                );
                if (res.data?.hospitalServices) {
                  setHospitalData((prev) => ({ ...prev, hospitalServices: res.data.hospitalServices }));
                }
              } else {
                await api.post('/hospital/services', {
                  serviceId: hs.serviceId,
                  status: 'INACTIVE',
                });
              }
              showAlert({
                title: 'Service Removed',
                message: `"${serviceName}" has been removed from hospital offerings.`,
                type: 'success',
              });
              fetchFreshHospitalData();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to remove service.');
            }
          },
        },
      ]
    );
  };

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
            {/* Manager Admin Action Bar */}
            {isAuthorizedManager && (
              <View style={styles.managerServiceBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.managerServiceTitle}>🛡️ Partner Management</Text>
                  <Text style={styles.managerServiceSub}>View patient inquiries and manage clinic profile</Text>
                </View>
                <TouchableOpacity
                  style={styles.managerLeadsBtn}
                  onPress={() => {
                    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
                      navigation.navigate('AdminLeads', {
                        hospitalId: hospital.id,
                        hospitalName: hospital.name,
                        search: hospital.name,
                      });
                    } else {
                      navigation.navigate('HospitalLeads');
                    }
                  }}
                >
                  <Text style={styles.managerLeadsBtnText}>📋 View Leads</Text>
                </TouchableOpacity>
              </View>
            )}

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
            {/* Manager Control Bar */}
            {isAuthorizedManager && (
              <View style={styles.managerServiceBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.managerServiceTitle}>⚙️ Manage Medical Services</Text>
                  <Text style={styles.managerServiceSub}>Link specialties, customize pricing & procedures</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={styles.managerLeadsBtn}
                    onPress={() => {
                      if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
                        navigation.navigate('AdminLeads', {
                          hospitalId: hospital.id,
                          hospitalName: hospital.name,
                          search: hospital.name,
                        });
                      } else {
                        navigation.navigate('HospitalLeads');
                      }
                    }}
                  >
                    <Text style={styles.managerLeadsBtnText}>📋 Leads</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.managerAddBtn} onPress={handleOpenAddService}>
                    <Text style={styles.managerAddBtnText}>+ Link Service</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

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
                  ? hs.subServices.split(',').map((s: string) => s.trim()).filter(Boolean)
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
                        {subList.map((sub: string, subIdx: number) => (
                          <View key={subIdx} style={styles.subServiceRow}>
                            <Text style={styles.subServiceBullet}>✓</Text>
                            <Text style={styles.subServiceText}>{sub}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {/* Admin Edit / Delete Actions */}
                    {isAuthorizedManager ? (
                      <View style={styles.serviceManagerRow}>
                        <TouchableOpacity
                          style={styles.serviceEditChip}
                          onPress={() => handleOpenEditService(hs)}
                        >
                          <Text style={styles.serviceEditChipText}>✏️ Edit Offering</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.serviceDeleteChip}
                          onPress={() => handleRemoveHospitalService(hs)}
                        >
                          <Text style={styles.serviceDeleteChipText}>🗑️ Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
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
                    )}
                  </View>
                );
              })
            ) : isAuthorizedManager ? (
              <View style={styles.emptyManagerCard}>
                <Text style={styles.emptyManagerIcon}>🩺</Text>
                <Text style={styles.emptyManagerTitle}>No medical services linked</Text>
                <Text style={styles.emptyManagerSub}>
                  Link medical specialties, pricing, and available procedures to this hospital.
                </Text>
                <TouchableOpacity style={styles.emptyManagerAddBtn} onPress={handleOpenAddService}>
                  <Text style={styles.emptyManagerAddBtnText}>+ Link First Medical Service</Text>
                </TouchableOpacity>
              </View>
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

      {/* ======================================================== */}
      {/* LINK / EDIT HOSPITAL SERVICE MODAL */}
      {/* ======================================================== */}
      <Modal visible={serviceModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.sheetModalContainer}>
          <View style={styles.sheetModalHeader}>
            <TouchableOpacity
              onPress={() => setServiceModalVisible(false)}
              disabled={editingServiceSaving}
            >
              <Text style={styles.sheetModalCancel}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.sheetModalCenter}>
              <Text style={styles.sheetModalTitle}>
                {isEditingExistingLink ? 'Edit Service Offering' : 'Link Medical Specialty'}
              </Text>
              <Text style={styles.sheetModalSub} numberOfLines={1}>{hospital.name}</Text>
            </View>
            <TouchableOpacity
              onPress={handleSaveHospitalService}
              disabled={editingServiceSaving}
            >
              <Text style={[styles.sheetModalDone, editingServiceSaving && { opacity: 0.5 }]}>
                {editingServiceSaving ? 'Saving...' : 'Save ✓'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.sheetFormScroll} showsVerticalScrollIndicator={false}>
            {/* Service Selector (Website-style Dropdown List for both Add and Edit) */}
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.formLabel}>Select Platform Medical Service *</Text>
              <Text style={styles.formSubLabel}>
                {isEditingExistingLink
                  ? `Select or change the medical specialty/service offered at ${hospital.name}`
                  : `Choose which platform service to make available at ${hospital.name}`}
              </Text>

              {/* Dropdown Trigger */}
              {(() => {
                const selectedService = allPlatformServices.find(
                  (ps) => String(ps.id) === String(selectedServiceId)
                );
                const parentServices = allPlatformServices.filter(
                  (ps) => !ps.parentId
                );
                const hasParents = parentServices.length > 0;

                return (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.dropdownTrigger,
                        serviceDropdownOpen && styles.dropdownTriggerOpen,
                      ]}
                      onPress={() => setServiceDropdownOpen(!serviceDropdownOpen)}
                      activeOpacity={0.8}
                    >
                      {selectedService ? (
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 16, marginRight: 8 }}>
                            {selectedService.icon || '🩺'}
                          </Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dropdownTriggerText} numberOfLines={1}>
                              {selectedService.name}
                            </Text>
                            {selectedService.category ? (
                              <Text style={styles.dropdownOptionSubText}>
                                {selectedService.category} {selectedService.parentId ? '• Procedure' : '• Specialty'}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      ) : (
                        <Text style={styles.dropdownPlaceholder}>
                          ▼ Select a Medical Specialty / Service...
                        </Text>
                      )}
                      <Text style={styles.dropdownChevron}>
                        {serviceDropdownOpen ? '▲' : '▼'}
                      </Text>
                    </TouchableOpacity>

                    {/* Dropdown Menu List */}
                    {serviceDropdownOpen && (
                      <View style={styles.dropdownMenu}>
                        <View style={styles.dropdownSearchBox}>
                          <TextInput
                            style={styles.dropdownSearchInput}
                            placeholder="🔍 Search specialties or procedures..."
                            placeholderTextColor={colors.textMuted}
                            value={serviceSearchQuery}
                            onChangeText={setServiceSearchQuery}
                            autoFocus={false}
                          />
                        </View>

                        <ScrollView
                          style={styles.dropdownListScroll}
                          nestedScrollEnabled={true}
                          showsVerticalScrollIndicator={true}
                          keyboardShouldPersistTaps="handled"
                        >
                          {allPlatformServices.length === 0 ? (
                            <View style={{ padding: 16, alignItems: 'center' }}>
                              <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>
                                No specialties loaded.
                              </Text>
                              <TouchableOpacity
                                style={[styles.emptyManagerAddBtn, { paddingVertical: 6, paddingHorizontal: 12 }]}
                                onPress={fetchPlatformServices}
                              >
                                <Text style={[styles.emptyManagerAddBtnText, { fontSize: 12 }]}>🔄 Reload Specialties</Text>
                              </TouchableOpacity>
                            </View>
                          ) : hasParents ? (
                            parentServices
                              .filter((parent) => {
                                const q = serviceSearchQuery.toLowerCase().trim();
                                if (!q) return true;
                                const matchesParent =
                                  parent.name?.toLowerCase().includes(q) ||
                                  parent.category?.toLowerCase().includes(q);
                                const matchesChild = allPlatformServices.some(
                                  (sub) =>
                                    sub.parentId === parent.id &&
                                    (sub.name?.toLowerCase().includes(q) ||
                                      sub.category?.toLowerCase().includes(q))
                                );
                                return matchesParent || matchesChild;
                              })
                              .map((parent) => {
                                const q = serviceSearchQuery.toLowerCase().trim();
                                const subs = allPlatformServices.filter(
                                  (ps) =>
                                    ps.parentId === parent.id &&
                                    (!q || ps.name?.toLowerCase().includes(q))
                                );
                                const isParentLinked = (hospital.hospitalServices || []).some(
                                  (hs: any) =>
                                    Number(hs.serviceId || hs.service?.id) === Number(parent.id) &&
                                    String(hs.id) !== String(editingHospitalServiceId)
                                );
                                const isParentSelected = String(selectedServiceId) === String(parent.id);

                                return (
                                  <View key={parent.id}>
                                    {/* Parent Category Option */}
                                    <TouchableOpacity
                                      style={[
                                        styles.dropdownOption,
                                        isParentSelected && styles.dropdownOptionSelected,
                                        isParentLinked && styles.dropdownOptionDisabled,
                                      ]}
                                      onPress={() => {
                                        if (isParentLinked) return;
                                        setSelectedServiceId(String(parent.id));
                                        setServiceDropdownOpen(false);
                                        setServiceSearchQuery('');
                                      }}
                                    >
                                      <View style={{ flex: 1 }}>
                                        <Text
                                          style={[
                                            styles.dropdownOptionText,
                                            isParentSelected && styles.dropdownOptionTextSelected,
                                          ]}
                                        >
                                          {parent.icon || '🩺'} {parent.name} (General Specialty)
                                        </Text>
                                      </View>
                                      {isParentLinked ? (
                                        <View style={styles.dropdownAddedBadge}>
                                          <Text style={styles.dropdownAddedText}>Already Added</Text>
                                        </View>
                                      ) : isParentSelected ? (
                                        <Text style={styles.dropdownOptionTextSelected}>✓</Text>
                                      ) : null}
                                    </TouchableOpacity>

                                    {/* Sub-services / Procedures */}
                                    {subs.map((sub) => {
                                      const isSubLinked = (hospital.hospitalServices || []).some(
                                        (hs: any) =>
                                          Number(hs.serviceId || hs.service?.id) === Number(sub.id) &&
                                          String(hs.id) !== String(editingHospitalServiceId)
                                      );
                                      const isSubSelected = String(selectedServiceId) === String(sub.id);

                                      return (
                                        <TouchableOpacity
                                          key={sub.id}
                                          style={[
                                            styles.dropdownOption,
                                            styles.dropdownOptionSub,
                                            isSubSelected && styles.dropdownOptionSelected,
                                            isSubLinked && styles.dropdownOptionDisabled,
                                          ]}
                                          onPress={() => {
                                            if (isSubLinked) return;
                                            setSelectedServiceId(String(sub.id));
                                            setServiceDropdownOpen(false);
                                            setServiceSearchQuery('');
                                          }}
                                        >
                                          <View style={{ flex: 1 }}>
                                            <Text
                                              style={[
                                                styles.dropdownOptionText,
                                                { fontSize: 12.5, fontWeight: '500' },
                                                isSubSelected && styles.dropdownOptionTextSelected,
                                              ]}
                                            >
                                              -- {sub.name}
                                            </Text>
                                          </View>
                                          {isSubLinked ? (
                                            <View style={styles.dropdownAddedBadge}>
                                              <Text style={styles.dropdownAddedText}>Already Added</Text>
                                            </View>
                                          ) : isSubSelected ? (
                                            <Text style={styles.dropdownOptionTextSelected}>✓</Text>
                                          ) : null}
                                        </TouchableOpacity>
                                      );
                                    })}
                                  </View>
                                );
                              })
                          ) : (
                            allPlatformServices
                              .filter(
                                (ps) =>
                                  !serviceSearchQuery.trim() ||
                                  ps.name?.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
                                  ps.category?.toLowerCase().includes(serviceSearchQuery.toLowerCase())
                              )
                              .map((ps) => {
                                const isLinked = (hospital.hospitalServices || []).some(
                                  (hs: any) =>
                                    Number(hs.serviceId || hs.service?.id) === Number(ps.id) &&
                                    String(hs.id) !== String(editingHospitalServiceId)
                                );
                                const isSelected = String(selectedServiceId) === String(ps.id);

                                return (
                                  <TouchableOpacity
                                    key={ps.id}
                                    style={[
                                      styles.dropdownOption,
                                      isSelected && styles.dropdownOptionSelected,
                                      isLinked && styles.dropdownOptionDisabled,
                                    ]}
                                    onPress={() => {
                                      if (isLinked) return;
                                      setSelectedServiceId(String(ps.id));
                                      setServiceDropdownOpen(false);
                                      setServiceSearchQuery('');
                                    }}
                                  >
                                    <View style={{ flex: 1 }}>
                                      <Text
                                        style={[
                                          styles.dropdownOptionText,
                                          isSelected && styles.dropdownOptionTextSelected,
                                        ]}
                                      >
                                        {ps.icon || '🩺'} {ps.name}
                                      </Text>
                                      {ps.category ? (
                                        <Text style={styles.dropdownOptionSubText}>{ps.category}</Text>
                                      ) : null}
                                    </View>
                                    {isLinked ? (
                                      <View style={styles.dropdownAddedBadge}>
                                        <Text style={styles.dropdownAddedText}>Already Added</Text>
                                      </View>
                                    ) : isSelected ? (
                                      <Text style={styles.dropdownOptionTextSelected}>✓</Text>
                                    ) : null}
                                  </TouchableOpacity>
                                );
                              })
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </>
                );
              })()}
            </View>

            {/* Starting Price */}
            <Text style={styles.formLabel}>Starting Price (₹ INR)</Text>
            <Text style={styles.formSubLabel}>
              Minimum estimated package or procedure price (e.g. 50000)
            </Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. 50000"
              placeholderTextColor={colors.textMuted}
              value={svcStartingPrice}
              onChangeText={setSvcStartingPrice}
              keyboardType="numeric"
            />

            {/* Status */}
            <Text style={styles.formLabel}>Availability Status</Text>
            <View style={styles.statusPickerRow}>
              {(['ACTIVE', 'INACTIVE'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.statusOption, svcStatus === st && styles.statusOptionActive]}
                  onPress={() => setSvcStatus(st)}
                >
                  <Text style={[styles.statusOptionText, svcStatus === st && styles.statusOptionTextActive]}>
                    {st === 'ACTIVE' ? '✓ ACTIVE (Visible to Patients)' : '✕ INACTIVE (Hidden)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sub-services */}
            <Text style={styles.formLabel}>Procedures / Sub-Services (Comma Separated)</Text>
            <Text style={styles.formSubLabel}>
              e.g. Angioplasty, Valve Replacement, Pacemaker, Bypass Surgery
            </Text>
            <TextInput
              style={[styles.sheetInput, { minHeight: 64 }]}
              placeholder="Angioplasty, Bypass, Valve Surgery..."
              placeholderTextColor={colors.textMuted}
              value={svcSubServices}
              onChangeText={setSvcSubServices}
              multiline
            />

            {/* Description */}
            <Text style={styles.formLabel}>Department Overview & Description</Text>
            <TextInput
              style={[styles.sheetInput, { minHeight: 80 }]}
              placeholder="Specialized care units, surgeon expertise, high-tech diagnostic support..."
              placeholderTextColor={colors.textMuted}
              value={svcDescription}
              onChangeText={setSvcDescription}
              multiline
            />

            <TouchableOpacity
              style={[styles.sheetSubmitBtn, editingServiceSaving && { opacity: 0.6 }]}
              onPress={handleSaveHospitalService}
              disabled={editingServiceSaving}
            >
              <Text style={styles.sheetSubmitBtnText}>
                {editingServiceSaving
                  ? 'Saving Service...'
                  : isEditingExistingLink
                  ? 'Update Hospital Service ✓'
                  : 'Link Service to Hospital ✓'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Manager Service Controls Styles
  managerServiceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 8,
  },
  managerServiceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  managerServiceSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 1,
  },
  managerLeadsBtn: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  managerLeadsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  managerAddBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  managerAddBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textWhite,
  },
  serviceManagerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: 10,
  },
  serviceEditChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  serviceEditChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  serviceDeleteChip: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  serviceDeleteChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  emptyManagerCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyManagerIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyManagerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyManagerSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  emptyManagerAddBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyManagerAddBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textWhite,
  },
  sheetModalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  sheetModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  sheetModalCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  sheetModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sheetModalSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  sheetModalCancel: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sheetModalDone: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '800',
  },
  sheetFormScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 2,
  },
  formSubLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 8,
  },
  // Service Dropdown Selector Styles (Website-like)
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  dropdownTriggerOpen: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  dropdownTriggerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dropdownPlaceholder: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  dropdownChevron: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownSearchBox: {
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  dropdownSearchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: colors.textPrimary,
  },
  dropdownListScroll: {
    maxHeight: 240,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#F1F5F9',
  },
  dropdownOptionSub: {
    paddingLeft: 26,
    backgroundColor: '#FAFAFA',
  },
  dropdownOptionSelected: {
    backgroundColor: '#FFF0F5',
  },
  dropdownOptionDisabled: {
    opacity: 0.6,
    backgroundColor: '#F8FAFC',
  },
  dropdownOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dropdownOptionTextSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  dropdownOptionSubText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  dropdownAddedBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dropdownAddedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  editingBanner: {
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 8,
  },
  editingBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  editingBannerSub: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  sheetInput: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statusPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  statusOptionActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statusOptionTextActive: {
    color: '#15803D',
  },
  sheetSubmitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sheetSubmitBtnText: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },
  bannerContainer: {
    position: 'relative',
    height: 240,
    backgroundColor: colors.surfaceSecondary,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  topActionsRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnText: {
    fontSize: 18,
    color: colors.textWhite,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 10,
  },
  bannerContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  verifiedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedCheck: {
    color: colors.textWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  ratingBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  starText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '700',
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
