import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Modal,
  Alert,
  Linking,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import {
  AdminHospitalItem,
  AdminPlatformServiceItem,
  AdminHospitalServiceItem,
  AdminDoctorItem,
} from '../../types/admin';
import { RichTextEditor } from '../../components/RichTextEditor';

interface AdminHospitalsScreenProps {
  navigation: any;
  route?: any;
}

const STATUS_FILTERS = ['ALL', 'APPROVED', 'PENDING', 'SUSPENDED'];

const htmlToPlainText = (html?: string): string => {
  if (!html) return '';
  return html
    .replace(/<\/(p|div|h[1-6]|blockquote|section|article)>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const plainTextToHtml = (text?: string): string => {
  if (!text) return '';
  const trimmed = text.trim();
  if (/<(p|div|h[1-6]|ul|ol|li|table|section|br)\b/i.test(trimmed)) {
    return trimmed;
  }
  return trimmed
    .split(/\n\s*\n/)
    .map((para) => `<p>${para.replace(/\n/g, '<br />')}</p>`)
    .join('');
};

const parseDoctors = (rawDocs: any): AdminDoctorItem[] => {
  if (!rawDocs) return [];
  if (Array.isArray(rawDocs)) return rawDocs;
  if (typeof rawDocs === 'string') {
    try {
      const parsed = JSON.parse(rawDocs);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const AdminHospitalsScreen: React.FC<AdminHospitalsScreenProps> = ({ navigation, route }) => {
  const initialFilter = route?.params?.filter || 'ALL';
  const [hospitals, setHospitals] = useState<AdminHospitalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter);

  // Add Hospital Modal
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [adding, setAdding] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [initialLeads, setInitialLeads] = useState<string>('50');

  // Edit Hospital Modal
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [selectedHospital, setSelectedHospital] = useState<AdminHospitalItem | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editWebsite, setEditWebsite] = useState<string>('');
  const [editAddress, setEditAddress] = useState<string>('');
  const [editCity, setEditCity] = useState<string>('');
  const [editState, setEditState] = useState<string>('');
  const [editDistrict, setEditDistrict] = useState<string>('');
  const [editLeadsRemaining, setEditLeadsRemaining] = useState<string>('0');
  const [editRating, setEditRating] = useState<string>('4.8');
  const [editReviewsCount, setEditReviewsCount] = useState<string>('50');
  const [editStatus, setEditStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'>('APPROVED');
  const [editAccountStatus, setEditAccountStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editIsNabhAccredited, setEditIsNabhAccredited] = useState<boolean>(false);
  const [editIsVerifiedPartner, setEditIsVerifiedPartner] = useState<boolean>(true);
  const [editDescription, setEditDescription] = useState<string>('');
  const [fetchingRating, setFetchingRating] = useState<boolean>(false);

  // Credit Adjustment Modal
  const [creditModalVisible, setCreditModalVisible] = useState<boolean>(false);
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [adjusting, setAdjusting] = useState<boolean>(false);

  // Hospital Services Management Modal State
  const [servicesModalVisible, setServicesModalVisible] = useState<boolean>(false);
  const [loadingHospitalServices, setLoadingHospitalServices] = useState<boolean>(false);
  const [serviceHospital, setServiceHospital] = useState<AdminHospitalItem | null>(null);
  const [allPlatformServices, setAllPlatformServices] = useState<AdminPlatformServiceItem[]>([]);
  const [linkedHospitalServices, setLinkedHospitalServices] = useState<AdminHospitalServiceItem[]>([]);

  // Link / Edit Service Modal State
  const [editServiceModalVisible, setEditServiceModalVisible] = useState<boolean>(false);
  const [editingServiceSaving, setEditingServiceSaving] = useState<boolean>(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [svcStartingPrice, setSvcStartingPrice] = useState<string>('');
  const [svcSubServices, setSvcSubServices] = useState<string>('');
  const [svcDescription, setSvcDescription] = useState<string>('');
  const [svcTreatmentDetails, setSvcTreatmentDetails] = useState<string>('');
  const [svcStatus, setSvcStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isEditingExistingLink, setIsEditingExistingLink] = useState<boolean>(false);

  // Hospital Doctors Management Modal State
  const [doctorsModalVisible, setDoctorsModalVisible] = useState<boolean>(false);
  const [loadingHospitalDoctors, setLoadingHospitalDoctors] = useState<boolean>(false);
  const [doctorHospital, setDoctorHospital] = useState<AdminHospitalItem | null>(null);
  const [hospitalDoctors, setHospitalDoctors] = useState<AdminDoctorItem[]>([]);

  // Add / Edit Doctor Modal State
  const [editDoctorModalVisible, setEditDoctorModalVisible] = useState<boolean>(false);
  const [editingDoctorSaving, setEditingDoctorSaving] = useState<boolean>(false);
  const [editingDoctorIndex, setEditingDoctorIndex] = useState<number | null>(null);
  const [docName, setDocName] = useState<string>('');
  const [docSpecialty, setDocSpecialty] = useState<string>('');
  const [docQualification, setDocQualification] = useState<string>('');
  const [docExperience, setDocExperience] = useState<string>('');
  const [docImage, setDocImage] = useState<string>('');
  const [docAbout, setDocAbout] = useState<string>('');
  const [docTreatments, setDocTreatments] = useState<string>('');
  const [docShowOnHomepage, setDocShowOnHomepage] = useState<boolean>(false);
  const [docRating, setDocRating] = useState<string>('4.9');

  const fetchHospitals = useCallback(async () => {
    try {
      const res = await api.get('/admin/hospitals');
      if (res.data?.hospitals) {
        setHospitals(res.data.hospitals);
      }
    } catch (err) {
      console.log('Error fetching admin hospitals:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHospitals();
  };

  const handleCall = async (phoneNumber?: string) => {
    if (!phoneNumber || !phoneNumber.trim()) {
      Alert.alert('No Phone', 'No contact phone number is recorded for this hospital.');
      return;
    }
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    const telUrl = `tel:${cleanNumber}`;
    try {
      const supported = await Linking.canOpenURL(telUrl);
      if (supported) {
        await Linking.openURL(telUrl);
      } else {
        Alert.alert('Hospital Phone', `Phone Number: ${phoneNumber}`, [{ text: 'OK' }]);
      }
    } catch {
      Linking.openURL(telUrl).catch(() => {
        Alert.alert('Hospital Phone', `Phone Number: ${phoneNumber}`, [{ text: 'OK' }]);
      });
    }
  };

  const handleOpenWebsite = (url?: string) => {
    if (!url || !url.trim()) return;
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }
    Linking.openURL(finalUrl).catch(() => {
      Alert.alert('Invalid URL', `Could not open website: ${url}`);
    });
  };

  const handleApprove = async (h: AdminHospitalItem) => {
    try {
      const res = await api.put(`/admin/hospitals/${h.id}`, {
        status: 'APPROVED',
        accountStatus: 'ACTIVE',
      });
      if (res.data?.hospital) {
        Alert.alert('Approved', `Hospital "${h.name}" has been approved.`);
        fetchHospitals();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to approve hospital.');
    }
  };

  const handleToggleStatus = (h: AdminHospitalItem) => {
    const isCurrentlyActive = h.accountStatus === 'ACTIVE' && h.status !== 'SUSPENDED';
    const newAccountStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'SUSPENDED' : 'APPROVED';

    const actionTitle = isCurrentlyActive ? 'Suspend Hospital Partner' : 'Activate Hospital Partner';
    const actionMessage = isCurrentlyActive
      ? `Are you sure you want to suspend "${h.name}"? The hospital will be hidden from patient searches and partner logins will be disabled.`
      : `Activate partner account and listing for "${h.name}"?`;

    Alert.alert(
      actionTitle,
      actionMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isCurrentlyActive ? 'Suspend Partner' : 'Activate Partner',
          style: isCurrentlyActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const res = await api.put(`/admin/hospitals/${h.id}`, {
                accountStatus: newAccountStatus,
                status: newStatus,
              });
              if (res.data?.hospital) {
                Alert.alert('Success', `Hospital is now ${isCurrentlyActive ? 'suspended' : 'active'}.`);
                fetchHospitals();
              }
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to update hospital status.');
            }
          },
        },
      ]
    );
  };

  const openCreditModal = (h: AdminHospitalItem) => {
    setSelectedHospital(h);
    setCreditAmount(String(h.leadsRemaining || 0));
    setCreditModalVisible(true);
  };

  const handleSaveCredits = async () => {
    if (!selectedHospital) return;
    try {
      setAdjusting(true);
      const res = await api.put(`/admin/hospitals/${selectedHospital.id}`, {
        leadsRemaining: Number(creditAmount),
      });
      if (res.data?.hospital) {
        setCreditModalVisible(false);
        Alert.alert('Updated', `Lead balance for "${selectedHospital.name}" set to ${creditAmount} credits.`);
        fetchHospitals();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update lead credits.');
    } finally {
      setAdjusting(false);
    }
  };

  const handleOpenEditModal = (h: AdminHospitalItem) => {
    setSelectedHospital(h);
    setEditName(h.name || '');
    setEditEmail(h.email || '');
    setEditPhone(h.phone || '');
    setEditWebsite(h.website || '');
    setEditAddress(h.address || '');
    setEditCity(h.city || '');
    setEditState(h.state || '');
    setEditDistrict(h.district || '');
    setEditLeadsRemaining(String(h.leadsRemaining ?? 0));
    setEditRating(String(h.googleRating || h.rating || 4.8));
    setEditReviewsCount(String(h.googleReviewsCount || 50));
    setEditStatus(h.status || 'APPROVED');
    setEditAccountStatus(h.accountStatus || 'ACTIVE');
    setEditIsNabhAccredited(Boolean(h.isNabhAccredited));
    setEditIsVerifiedPartner(h.isVerifiedPartner !== undefined ? Boolean(h.isVerifiedPartner) : true);
    setEditDescription(h.description || '');
    setEditModalVisible(true);
  };

  const handleSaveEditHospital = async () => {
    if (!selectedHospital) return;
    if (!editName.trim() || !editEmail.trim() || !editPhone.trim() || !editCity.trim() || !editAddress.trim()) {
      Alert.alert('Required Fields', 'Hospital Name, Email, Phone, City, and Address are required.');
      return;
    }

    try {
      setEditing(true);
      const res = await api.put(`/admin/hospitals/${selectedHospital.id}`, {
        name: editName.trim(),
        email: editEmail.toLowerCase().trim(),
        phone: editPhone.trim(),
        website: editWebsite.trim() || undefined,
        address: editAddress.trim(),
        city: editCity.trim(),
        state: editState.trim() || undefined,
        district: editDistrict.trim() || undefined,
        leadsRemaining: Number(editLeadsRemaining) || 0,
        googleRating: Number(editRating) || 4.8,
        rating: Number(editRating) || 4.8,
        googleReviewsCount: Number(editReviewsCount) || 50,
        status: editStatus,
        accountStatus: editAccountStatus,
        isNabhAccredited: editIsNabhAccredited,
        isVerifiedPartner: editIsVerifiedPartner,
        description: editDescription.trim() || undefined,
      });

      if (res.data?.hospital) {
        setEditModalVisible(false);
        Alert.alert('Saved', `Hospital details for "${editName}" have been updated.`);
        fetchHospitals();
      }
    } catch (err: any) {
      Alert.alert('Update Failed', err?.response?.data?.error || 'Failed to update hospital details.');
    } finally {
      setEditing(false);
    }
  };

  const handleFetchGoogleRating = async () => {
    if (!selectedHospital) return;
    try {
      setFetchingRating(true);
      const queryStr = `${editName || selectedHospital.name} ${editCity || selectedHospital.city} ${editState || selectedHospital.state || ''}`.trim();
      const res = await api.post('/hospital/fetch-google-rating', {
        hospitalId: selectedHospital.id,
        query: queryStr,
      });

      if (res.data) {
        const { googleRating, googleReviewsCount } = res.data;
        if (googleRating) setEditRating(String(googleRating));
        if (googleReviewsCount) setEditReviewsCount(String(googleReviewsCount));

        Alert.alert(
          'Google Ratings Synced! ⭐',
          `Successfully fetched rating and reviews for "${selectedHospital.name}":\n\n• Rating: ${googleRating} / 5.0 ⭐\n• Reviews: ${googleReviewsCount} Google Reviews`,
          [{ text: 'Awesome!' }]
        );
        fetchHospitals();
      }
    } catch (err: any) {
      Alert.alert('Sync Failed', err?.response?.data?.error || 'Failed to fetch Google rating and reviews.');
    } finally {
      setFetchingRating(false);
    }
  };

  const handleCardFetchGoogleRating = async (h: AdminHospitalItem) => {
    try {
      const queryStr = `${h.name} ${h.city} ${h.state || ''}`.trim();
      const res = await api.post('/hospital/fetch-google-rating', {
        hospitalId: h.id,
        query: queryStr,
      });

      if (res.data) {
        const { googleRating, googleReviewsCount } = res.data;
        Alert.alert(
          'Google Ratings Synced! ⭐',
          `Synced "${h.name}":\n• Rating: ${googleRating} ⭐\n• Total Reviews: ${googleReviewsCount}`
        );
        fetchHospitals();
      }
    } catch (err: any) {
      Alert.alert('Sync Error', err?.response?.data?.error || 'Could not fetch Google reviews.');
    }
  };

  // Hospital Services CRUD Handlers
  const fetchHospitalServices = async (hospitalId: number | string) => {
    try {
      setLoadingHospitalServices(true);
      const res = await api.get(`/admin/hospitals/${hospitalId}/services`);
      setAllPlatformServices(Array.isArray(res.data?.allPlatformServices) ? res.data.allPlatformServices : []);
      setLinkedHospitalServices(Array.isArray(res.data?.hospitalServices) ? res.data.hospitalServices : []);
    } catch {
      setAllPlatformServices([]);
      setLinkedHospitalServices([]);
    } finally {
      setLoadingHospitalServices(false);
    }
  };

  const handleOpenServicesModal = (h: AdminHospitalItem) => {
    setServiceHospital(h);
    setServicesModalVisible(true);
    fetchHospitalServices(h.id);
  };

  const handleOpenAddService = () => {
    setIsEditingExistingLink(false);
    setSelectedServiceId('');
    setSvcStartingPrice('');
    setSvcSubServices('');
    setSvcDescription('');
    setSvcTreatmentDetails('');
    setSvcStatus('ACTIVE');
    setEditServiceModalVisible(true);
  };

  const handleOpenEditService = (hs: AdminHospitalServiceItem) => {
    setIsEditingExistingLink(true);
    setSelectedServiceId(String(hs.serviceId));
    setSvcStartingPrice(hs.startingPrice !== undefined && hs.startingPrice !== null ? String(hs.startingPrice) : '');
    setSvcSubServices(hs.subServices || '');
    setSvcDescription(hs.description || '');
    setSvcTreatmentDetails(hs.treatmentDetails || '');
    setSvcStatus(hs.status || 'ACTIVE');
    setEditServiceModalVisible(true);
  };

  const handleSaveHospitalService = async () => {
    if (!serviceHospital) return;
    if (!selectedServiceId) {
      Alert.alert('Selection Required', 'Please select a platform medical service to link.');
      return;
    }

    try {
      setEditingServiceSaving(true);
      const res = await api.post(`/admin/hospitals/${serviceHospital.id}/services`, {
        serviceId: Number(selectedServiceId),
        startingPrice: svcStartingPrice ? Number(svcStartingPrice) : null,
        subServices: svcSubServices.trim() || null,
        description: svcDescription.trim() || null,
        treatmentDetails: svcTreatmentDetails.trim() || null,
        status: svcStatus,
      });

      if (res.data?.hospitalServices) {
        setLinkedHospitalServices(res.data.hospitalServices);
        setEditServiceModalVisible(false);
        Alert.alert(
          'Success',
          isEditingExistingLink
            ? 'Hospital service updated successfully.'
            : 'Service linked to hospital successfully.'
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to save hospital service.');
    } finally {
      setEditingServiceSaving(false);
    }
  };

  const handleRemoveHospitalService = (hs: AdminHospitalServiceItem) => {
    if (!serviceHospital) return;
    const serviceName = hs.service?.name || 'this service';
    Alert.alert(
      'Remove Hospital Service',
      `Are you sure you want to remove and unlink "${serviceName}" from "${serviceHospital.name}"? Patients will no longer see this service under this hospital.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Service',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(
                `/admin/hospitals/${serviceHospital.id}/services?hospitalServiceId=${hs.id}`
              );
              if (res.data?.hospitalServices) {
                setLinkedHospitalServices(res.data.hospitalServices);
                Alert.alert('Removed', `Service "${serviceName}" unlinked from hospital.`);
              }
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to remove hospital service.');
            }
          },
        },
      ]
    );
  };

  // Hospital Doctors CRUD Handlers
  const fetchHospitalDoctors = async (hospitalId: number | string, fallbackDocs: AdminDoctorItem[] = []) => {
    try {
      setLoadingHospitalDoctors(true);
      let fetchedDocs: AdminDoctorItem[] | null = null;

      // 1. Try dedicated doctor endpoint
      try {
        const res = await api.get(`/admin/hospitals/${hospitalId}/doctors`);
        if (res.data?.doctors && Array.isArray(res.data.doctors)) {
          fetchedDocs = res.data.doctors;
        }
      } catch {
        // Fallback to hospital details endpoint
      }

      // 2. If null, try fetching hospital record directly
      if (fetchedDocs === null) {
        try {
          const res = await api.get(`/admin/hospitals/${hospitalId}`);
          if (res.data?.hospital?.doctors) {
            fetchedDocs = parseDoctors(res.data.hospital.doctors);
          }
        } catch {
          // Keep null
        }
      }

      if (fetchedDocs !== null) {
        setHospitalDoctors(fetchedDocs);
        setHospitals((prev) =>
          prev.map((h) => (h.id === hospitalId ? { ...h, doctors: fetchedDocs || [] } : h))
        );
      } else {
        setHospitalDoctors(fallbackDocs);
      }
    } catch {
      setHospitalDoctors(fallbackDocs);
    } finally {
      setLoadingHospitalDoctors(false);
    }
  };

  const handleOpenDoctorsModal = (h: AdminHospitalItem) => {
    setDoctorHospital(h);
    const initialDocs = parseDoctors(h.doctors);
    setHospitalDoctors(initialDocs);
    setDoctorsModalVisible(true);
    fetchHospitalDoctors(h.id, initialDocs);
  };

  const handleOpenAddDoctor = () => {
    setEditingDoctorIndex(null);
    setDocName('');
    setDocSpecialty('');
    setDocQualification('');
    setDocExperience('');
    setDocImage('');
    setDocAbout('');
    setDocTreatments('');
    setDocShowOnHomepage(false);
    setDocRating('4.9');
    setEditDoctorModalVisible(true);
  };

  const handleOpenEditDoctor = (doc: AdminDoctorItem, index: number) => {
    setEditingDoctorIndex(index);
    setDocName(doc.name || '');
    setDocSpecialty(doc.specialty || '');
    setDocQualification(doc.qualification || '');
    setDocExperience(doc.experience || '');
    setDocImage(doc.image || '');
    setDocAbout(doc.about || '');
    setDocTreatments(Array.isArray(doc.treatments) ? doc.treatments.join(', ') : (doc.treatments || ''));
    setDocShowOnHomepage(Boolean(doc.showOnHomepage));
    setDocRating(doc.rating !== undefined ? String(doc.rating) : '4.9');
    setEditDoctorModalVisible(true);
  };

  const handleSaveDoctor = async () => {
    if (!doctorHospital) return;
    if (!docName.trim() || !docSpecialty.trim()) {
      Alert.alert('Required Fields', 'Doctor Name and Specialty/Department are required.');
      return;
    }

    try {
      setEditingDoctorSaving(true);
      const parsedTreatments = docTreatments
        ? docTreatments.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const doctorPayload: AdminDoctorItem = {
        name: docName.trim(),
        specialty: docSpecialty.trim(),
        qualification: docQualification.trim() || undefined,
        experience: docExperience.trim() || undefined,
        image: docImage.trim() || undefined,
        about: docAbout.trim() || undefined,
        treatments: parsedTreatments,
        showOnHomepage: docShowOnHomepage,
        rating: docRating ? Number(docRating) : 4.9,
      };

      const currentDocs = [...hospitalDoctors];
      let updatedDocs: AdminDoctorItem[];
      if (editingDoctorIndex === null) {
        updatedDocs = [...currentDocs, doctorPayload];
      } else {
        updatedDocs = currentDocs.map((doc, idx) =>
          idx === editingDoctorIndex ? { ...doc, ...doctorPayload } : doc
        );
      }

      // Save via PUT /admin/hospitals/:id (universal) and fallback to /doctors
      try {
        const res = await api.put(`/admin/hospitals/${doctorHospital.id}`, {
          doctors: updatedDocs,
        });
        if (res.data?.hospital?.doctors) {
          updatedDocs = parseDoctors(res.data.hospital.doctors);
        }
      } catch {
        try {
          if (editingDoctorIndex === null) {
            const res = await api.post(`/admin/hospitals/${doctorHospital.id}/doctors`, doctorPayload);
            if (res.data?.doctors) updatedDocs = res.data.doctors;
          } else {
            const res = await api.put(`/admin/hospitals/${doctorHospital.id}/doctors`, {
              index: editingDoctorIndex,
              ...doctorPayload,
            });
            if (res.data?.doctors) updatedDocs = res.data.doctors;
          }
        } catch (e: any) {
          throw new Error(e?.response?.data?.error || 'Failed to save doctor details.');
        }
      }

      setHospitalDoctors(updatedDocs);
      setHospitals((prev) =>
        prev.map((h) => (h.id === doctorHospital.id ? { ...h, doctors: updatedDocs } : h))
      );
      setDoctorHospital((prev) => (prev ? { ...prev, doctors: updatedDocs } : null));
      setEditDoctorModalVisible(false);
      Alert.alert(
        'Success',
        editingDoctorIndex !== null
          ? `Doctor "${docName}" updated successfully.`
          : `Doctor "${docName}" added to ${doctorHospital.name}.`
      );
      fetchHospitals();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Failed to save doctor details.');
    } finally {
      setEditingDoctorSaving(false);
    }
  };

  const handleRemoveDoctor = (doc: AdminDoctorItem, index: number) => {
    if (!doctorHospital) return;
    Alert.alert(
      'Remove Doctor',
      `Are you sure you want to remove Dr. ${doc.name} from "${doctorHospital.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Doctor',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedDocs = hospitalDoctors.filter((_, idx) => idx !== index);
              try {
                await api.put(`/admin/hospitals/${doctorHospital.id}`, {
                  doctors: updatedDocs,
                });
              } catch {
                await api.delete(`/admin/hospitals/${doctorHospital.id}/doctors?index=${index}`);
              }
              setHospitalDoctors(updatedDocs);
              setHospitals((prev) =>
                prev.map((h) => (h.id === doctorHospital.id ? { ...h, doctors: updatedDocs } : h))
              );
              setDoctorHospital((prev) => (prev ? { ...prev, doctors: updatedDocs } : null));
              Alert.alert('Removed', `Dr. ${doc.name} has been removed.`);
              fetchHospitals();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to remove doctor.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteHospital = (h: AdminHospitalItem) => {
    Alert.alert(
      'Delete Hospital Partner',
      `Permanently delete "${h.name}" and all associated user accounts and leads? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/hospitals/${h.id}`);
              Alert.alert('Deleted', `Hospital "${h.name}" deleted.`);
              fetchHospitals();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to delete hospital.');
            }
          },
        },
      ]
    );
  };

  const handleAddHospital = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim() || !city.trim() || !address.trim()) {
      Alert.alert('Required Fields', 'Name, Email, Phone, Password, City, and Address are required.');
      return;
    }

    try {
      setAdding(true);
      const res = await api.post('/admin/hospitals', {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: password.trim(),
        city: city.trim(),
        state: state.trim() || undefined,
        address: address.trim(),
        website: website.trim() || undefined,
        leadsRemaining: Number(initialLeads) || 50,
        status: 'APPROVED',
      });

      if (res.data?.hospital) {
        setAddModalVisible(false);
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setCity('');
        setState('');
        setAddress('');
        setWebsite('');
        Alert.alert('Success', `Hospital "${name}" onboarded successfully.`);
        fetchHospitals();
      }
    } catch (err: any) {
      Alert.alert('Creation Failed', err?.response?.data?.error || 'Failed to onboard hospital.');
    } finally {
      setAdding(false);
    }
  };

  // KPI Calculations
  const totalCount = hospitals.length;
  const approvedCount = hospitals.filter((h) => h.status === 'APPROVED' && h.accountStatus === 'ACTIVE').length;
  const pendingCount = hospitals.filter((h) => h.status === 'PENDING').length;
  const suspendedCount = hospitals.filter((h) => h.status === 'SUSPENDED' || h.accountStatus === 'INACTIVE').length;

  const filtered = hospitals.filter((h) => {
    let matchStatus = true;
    if (selectedStatus === 'APPROVED') {
      matchStatus = h.status === 'APPROVED' && h.accountStatus === 'ACTIVE';
    } else if (selectedStatus === 'PENDING') {
      matchStatus = h.status === 'PENDING';
    } else if (selectedStatus === 'SUSPENDED') {
      matchStatus = h.status === 'SUSPENDED' || h.accountStatus === 'INACTIVE';
    }

    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      h.name?.toLowerCase().includes(q) ||
      h.city?.toLowerCase().includes(q) ||
      h.state?.toLowerCase().includes(q) ||
      h.email?.toLowerCase().includes(q) ||
      h.phone?.toLowerCase().includes(q);

    return matchStatus && matchSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Hospital Directory</Text>
          <Text style={styles.headerSub}>{totalCount} Registered Partners</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Onboard</Text>
        </TouchableOpacity>
      </View>

      {/* Search Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search hospital by name, city, email, phone..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* KPI Stats Strip */}
      <View style={styles.kpiContainer}>
        <TouchableOpacity
          style={[styles.kpiCard, selectedStatus === 'ALL' && styles.kpiCardActive]}
          onPress={() => setSelectedStatus('ALL')}
        >
          <Text style={styles.kpiValue}>{totalCount}</Text>
          <Text style={styles.kpiLabel}>Total</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, selectedStatus === 'APPROVED' && styles.kpiCardActive]}
          onPress={() => setSelectedStatus('APPROVED')}
        >
          <Text style={[styles.kpiValue, { color: '#15803D' }]}>{approvedCount}</Text>
          <Text style={styles.kpiLabel}>Approved</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, selectedStatus === 'PENDING' && styles.kpiCardActive]}
          onPress={() => setSelectedStatus('PENDING')}
        >
          <Text style={[styles.kpiValue, { color: '#B45309' }]}>{pendingCount}</Text>
          <Text style={styles.kpiLabel}>Pending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, selectedStatus === 'SUSPENDED' && styles.kpiCardActive]}
          onPress={() => setSelectedStatus('SUSPENDED')}
        >
          <Text style={[styles.kpiValue, { color: '#BE185D' }]}>{suspendedCount}</Text>
          <Text style={styles.kpiLabel}>Suspended</Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter Scroll */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {STATUS_FILTERS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.filterPill, selectedStatus === s && styles.filterPillActive]}
              onPress={() => setSelectedStatus(s)}
            >
              <Text style={[styles.filterPillText, selectedStatus === s && styles.filterPillTextActive]}>
                {s === 'ALL' ? 'ALL HOSPITALS' : s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading hospital partners...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🏥</Text>
              <Text style={styles.emptyTitle}>No hospitals found</Text>
              <Text style={styles.emptySub}>Try adjusting your filter or search criteria.</Text>
            </View>
          ) : (
            filtered.map((h) => {
              const isPending = h.status === 'PENDING';
              const isSuspended = h.accountStatus === 'INACTIVE' || h.status === 'SUSPENDED';

              return (
                <View key={h.id} style={styles.hospitalCard}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.nameCol}>
                      <View style={styles.nameTitleRow}>
                        <Text style={styles.hospName}>{h.name}</Text>
                        {h.isVerifiedPartner && (
                          <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                          </View>
                        )}
                        {h.isNabhAccredited && (
                          <View style={styles.nabhBadge}>
                            <Text style={styles.nabhBadgeText}>🏅 NABH</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.hospLocation}>
                        📍 {h.address ? `${h.address}, ` : ''}{h.city}{h.state ? `, ${h.state}` : ''}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        h.status === 'APPROVED' && h.accountStatus === 'ACTIVE'
                          ? styles.statusApproved
                          : isPending
                          ? styles.statusPending
                          : styles.statusSuspended,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {h.accountStatus === 'INACTIVE' ? 'INACTIVE' : h.status}
                      </Text>
                    </View>
                  </View>

                  {/* Metadata & Leads Grid */}
                  <View style={styles.metaGrid}>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>✉️ Contact Email</Text>
                      <Text style={styles.metaVal} numberOfLines={1}>{h.email}</Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>📞 Phone</Text>
                      <TouchableOpacity onPress={() => handleCall(h.phone)}>
                        <Text style={[styles.metaVal, styles.phoneLink]} numberOfLines={1}>
                          {h.phone || 'No phone'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Rating & Leads Row */}
                  <View style={styles.infoPillRow}>
                    <TouchableOpacity
                      style={styles.ratingPill}
                      onPress={() => handleCardFetchGoogleRating(h)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.ratingText}>⭐ {h.googleRating || h.rating || '4.8'}</Text>
                      {h.googleReviewsCount ? (
                        <Text style={styles.ratingCount}> ({h.googleReviewsCount} reviews)</Text>
                      ) : null}
                      <Text style={styles.syncIcon}> 🔄</Text>
                    </TouchableOpacity>

                    <View style={styles.leadPill}>
                      <Text style={styles.leadPillText}>
                        ⚡ <Text style={{ fontWeight: '900' }}>{h.leadsRemaining ?? 0}</Text> Leads
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons Row */}
                  <View style={styles.actionRow}>
                    {isPending ? (
                      <TouchableOpacity
                        style={[styles.btn, styles.approveBtn]}
                        onPress={() => handleApprove(h)}
                      >
                        <Text style={styles.approveBtnText}>✓ Approve Registration</Text>
                      </TouchableOpacity>
                    ) : null}

                    {/* Edit Hospital Button (Pink Primary) */}
                    <TouchableOpacity
                      style={[styles.btn, styles.editHospitalBtn]}
                      onPress={() => handleOpenEditModal(h)}
                    >
                      <Text style={styles.editHospitalBtnText}>✏️ Edit</Text>
                    </TouchableOpacity>

                    {/* Manage Services Button */}
                    <TouchableOpacity
                      style={[styles.btn, styles.servicesBtn]}
                      onPress={() => handleOpenServicesModal(h)}
                    >
                      <Text style={styles.servicesBtnText}>🩺 Services</Text>
                    </TouchableOpacity>

                    {/* Manage Doctors Button */}
                    <TouchableOpacity
                      style={[styles.btn, styles.doctorsBtn]}
                      onPress={() => handleOpenDoctorsModal(h)}
                    >
                      <Text style={styles.doctorsBtnText}>
                        👨‍⚕️ Doctors{h.doctors?.length ? ` (${h.doctors.length})` : ''}
                      </Text>
                    </TouchableOpacity>

                    {/* View Profile */}
                    <TouchableOpacity
                      style={[styles.btn, styles.viewProfileBtn]}
                      onPress={() => navigation.navigate('HospitalDetail', { hospitalId: h.id, id: h.id, hospital: h })}
                    >
                      <Text style={styles.viewProfileBtnText}>👁️ View</Text>
                    </TouchableOpacity>

                    {/* Credits Adjust */}
                    <TouchableOpacity
                      style={[styles.btn, styles.creditBtn]}
                      onPress={() => openCreditModal(h)}
                    >
                      <Text style={styles.creditBtnText}>⚡ Credits</Text>
                    </TouchableOpacity>

                    {/* Suspend / Activate Toggle */}
                    <TouchableOpacity
                      style={[styles.btn, isSuspended ? styles.activateBtn : styles.suspendBtn]}
                      onPress={() => handleToggleStatus(h)}
                    >
                      <Text style={isSuspended ? styles.activateBtnText : styles.suspendBtnText}>
                        {isSuspended ? 'Activate' : 'Suspend'}
                      </Text>
                    </TouchableOpacity>

                    {/* Delete */}
                    <TouchableOpacity
                      style={[styles.btn, styles.deleteBtn]}
                      onPress={() => handleDeleteHospital(h)}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ======================================================== */}
      {/* EDIT HOSPITAL MODAL */}
      {/* ======================================================== */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} disabled={editing}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalHeaderTitle}>Edit Hospital Partner</Text>
              <Text style={styles.modalHeaderSub}>{selectedHospital?.name}</Text>
            </View>
            <TouchableOpacity onPress={handleSaveEditHospital} disabled={editing}>
              <Text style={[styles.modalDoneText, editing && { opacity: 0.5 }]}>
                {editing ? 'Saving...' : 'Save ✓'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Status Selector */}
            <Text style={styles.formLabel}>Registration Status</Text>
            <View style={styles.rolePickerRow}>
              {(['APPROVED', 'PENDING', 'SUSPENDED', 'REJECTED'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.roleOption, editStatus === s && styles.roleOptionActive]}
                  onPress={() => setEditStatus(s)}
                >
                  <Text style={[styles.roleOptionText, editStatus === s && styles.roleOptionTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Account Status Selector */}
            <Text style={styles.formLabel}>Account Status</Text>
            <View style={styles.rolePickerRow}>
              {(['ACTIVE', 'INACTIVE'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.roleOption, editAccountStatus === s && styles.roleOptionActive]}
                  onPress={() => setEditAccountStatus(s)}
                >
                  <Text style={[styles.roleOptionText, editAccountStatus === s && styles.roleOptionTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Toggle Switches Row */}
            <View style={styles.togglesCard}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Verified Partner Badge</Text>
                  <Text style={styles.toggleSubtitle}>Display trusted blue checkmark on listings</Text>
                </View>
                <Switch
                  value={editIsVerifiedPartner}
                  onValueChange={setEditIsVerifiedPartner}
                  trackColor={{ false: '#E2E8F0', true: colors.primaryLight }}
                  thumbColor={editIsVerifiedPartner ? colors.primary : '#94A3B8'}
                />
              </View>

              <View style={[styles.toggleRow, { borderTopWidth: 1, borderColor: colors.borderLight, paddingTop: 12, marginTop: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>NABH Accredited</Text>
                  <Text style={styles.toggleSubtitle}>Highlight official healthcare accreditation</Text>
                </View>
                <Switch
                  value={editIsNabhAccredited}
                  onValueChange={setEditIsNabhAccredited}
                  trackColor={{ false: '#E2E8F0', true: colors.primaryLight }}
                  thumbColor={editIsNabhAccredited ? colors.primary : '#94A3B8'}
                />
              </View>
            </View>

            {/* Name */}
            <Text style={styles.formLabel}>Hospital Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Fortis Healthcare"
              placeholderTextColor={colors.textMuted}
              value={editName}
              onChangeText={setEditName}
            />

            {/* Email */}
            <Text style={styles.formLabel}>Contact / Login Email *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="partner@hospital.com"
              placeholderTextColor={colors.textMuted}
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Phone */}
            <Text style={styles.formLabel}>Phone Number *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="+91 9876543210"
              placeholderTextColor={colors.textMuted}
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
            />

            {/* Website */}
            <Text style={styles.formLabel}>Official Website URL</Text>
            <TextInput
              style={styles.formInput}
              placeholder="https://www.hospital.com"
              placeholderTextColor={colors.textMuted}
              value={editWebsite}
              onChangeText={setEditWebsite}
              autoCapitalize="none"
            />

            {/* City & State Grid */}
            <View style={styles.formGridRow}>
              <View style={styles.formGridCol}>
                <Text style={styles.formLabel}>City *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. New Delhi"
                  placeholderTextColor={colors.textMuted}
                  value={editCity}
                  onChangeText={setEditCity}
                />
              </View>
              <View style={styles.formGridCol}>
                <Text style={styles.formLabel}>State</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Delhi"
                  placeholderTextColor={colors.textMuted}
                  value={editState}
                  onChangeText={setEditState}
                />
              </View>
            </View>

            {/* District */}
            <Text style={styles.formLabel}>District</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. South Delhi"
              placeholderTextColor={colors.textMuted}
              value={editDistrict}
              onChangeText={setEditDistrict}
            />

            {/* Address */}
            <Text style={styles.formLabel}>Street Address *</Text>
            <TextInput
              style={[styles.formInput, { minHeight: 64 }]}
              placeholder="Sector, Landmark, Full Address"
              placeholderTextColor={colors.textMuted}
              value={editAddress}
              onChangeText={setEditAddress}
              multiline
            />

            {/* Leads Remaining & Rating Grid */}
            <View style={styles.formGridRow}>
              <View style={styles.formGridCol}>
                <Text style={styles.formLabel}>Lead Balance (Credits)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="50"
                  placeholderTextColor={colors.textMuted}
                  value={editLeadsRemaining}
                  onChangeText={setEditLeadsRemaining}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formGridCol}>
                <Text style={styles.formLabel}>Rating (1.0 - 5.0)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="4.8"
                  placeholderTextColor={colors.textMuted}
                  value={editRating}
                  onChangeText={setEditRating}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Reviews Count & Fetch Button Row */}
            <View style={styles.formGridRow}>
              <View style={styles.formGridCol}>
                <Text style={styles.formLabel}>Reviews Count</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 120"
                  placeholderTextColor={colors.textMuted}
                  value={editReviewsCount}
                  onChangeText={setEditReviewsCount}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGridCol, { justifyContent: 'flex-end' }]}>
                <TouchableOpacity
                  style={[styles.fetchRatingBtn, fetchingRating && { opacity: 0.6 }]}
                  onPress={handleFetchGoogleRating}
                  disabled={fetchingRating}
                >
                  {fetchingRating ? (
                    <ActivityIndicator size="small" color="#1D4ED8" />
                  ) : (
                    <Text style={styles.fetchRatingBtnText}>⭐ Auto-Fetch Google Rating</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Description with Rich Editor */}
            <Text style={styles.formLabel}>About Hospital / Overview & Description</Text>
            <Text style={styles.formSubLabel}>
              Rich editor with B, I, U, Headings, Lists, Quotes, Links, and live HTML Preview
            </Text>
            <RichTextEditor
              value={editDescription}
              onChange={setEditDescription}
              placeholder="Write detailed hospital overview, specialty departments, and patient care standards..."
              minHeight={180}
            />

            <TouchableOpacity
              style={[styles.saveSubmitBtn, editing && { opacity: 0.6 }]}
              onPress={handleSaveEditHospital}
              disabled={editing}
            >
              <Text style={styles.saveSubmitBtnText}>
                {editing ? 'Saving Changes...' : 'Save Hospital Details ✓'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ======================================================== */}
      {/* CREDIT ADJUSTMENT MODAL */}
      {/* ======================================================== */}
      <Modal visible={creditModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adjust Lead Credits</Text>
            <Text style={styles.modalSub}>Set remaining balance for {selectedHospital?.name}:</Text>

            <TextInput
              style={styles.creditInput}
              value={creditAmount}
              onChangeText={setCreditAmount}
              keyboardType="numeric"
              placeholder="e.g. 50"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCreditModalVisible(false)}
                disabled={adjusting}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, adjusting && { opacity: 0.6 }]}
                onPress={handleSaveCredits}
                disabled={adjusting}
              >
                <Text style={styles.modalSaveBtnText}>
                  {adjusting ? 'Saving...' : 'Set Credits ✓'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* ADD HOSPITAL MODAL */}
      {/* ======================================================== */}
      <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Onboard Hospital Partner</Text>
            <TouchableOpacity onPress={handleAddHospital} disabled={adding}>
              <Text style={[styles.modalDoneText, adding && { opacity: 0.5 }]}>
                {adding ? 'Saving...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.formLabel}>Hospital Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Fortis Healthcare"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.formLabel}>Login Email Address *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="partner@fortis.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.formLabel}>Phone Number *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="+91 9876543210"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.formLabel}>Account Password *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Initial account password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
            />

            <View style={styles.formGridRow}>
              <View style={styles.formGridCol}>
                <Text style={styles.formLabel}>City *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Delhi"
                  placeholderTextColor={colors.textMuted}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={styles.formGridCol}>
                <Text style={styles.formLabel}>State</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Delhi NCR"
                  placeholderTextColor={colors.textMuted}
                  value={state}
                  onChangeText={setState}
                />
              </View>
            </View>

            <Text style={styles.formLabel}>Address *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Full physical address"
              placeholderTextColor={colors.textMuted}
              value={address}
              onChangeText={setAddress}
            />

            <Text style={styles.formLabel}>Official Website</Text>
            <TextInput
              style={styles.formInput}
              placeholder="https://fortishealthcare.com"
              placeholderTextColor={colors.textMuted}
              value={website}
              onChangeText={setWebsite}
              autoCapitalize="none"
            />

            <Text style={styles.formLabel}>Initial Lead Balance Credits</Text>
            <TextInput
              style={styles.formInput}
              placeholder="50"
              placeholderTextColor={colors.textMuted}
              value={initialLeads}
              onChangeText={setInitialLeads}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.saveSubmitBtn, adding && { opacity: 0.6 }]}
              onPress={handleAddHospital}
              disabled={adding}
            >
              <Text style={styles.saveSubmitBtnText}>
                {adding ? 'Creating Hospital Partner...' : 'Onboard Hospital & Issue Account ✓'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ======================================================== */}
      {/* HOSPITAL SERVICES MANAGEMENT MODAL */}
      {/* ======================================================== */}
      <Modal visible={servicesModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setServicesModalVisible(false)}>
              <Text style={styles.modalCancelText}>✕ Close</Text>
            </TouchableOpacity>
            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalHeaderTitle}>Hospital Services</Text>
              <Text style={styles.modalHeaderSub} numberOfLines={1}>
                {serviceHospital?.name}
              </Text>
            </View>
            <TouchableOpacity style={styles.headerAddServiceBtn} onPress={handleOpenAddService}>
              <Text style={styles.headerAddServiceBtnText}>+ Link Service</Text>
            </TouchableOpacity>
          </View>

          {loadingHospitalServices ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading hospital services...</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.servicesScroll} showsVerticalScrollIndicator={false}>
              {/* Info Banner */}
              <View style={styles.serviceBanner}>
                <Text style={styles.serviceBannerIcon}>🩺</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceBannerTitle}>
                    {linkedHospitalServices.length} Services Offered at {serviceHospital?.name}
                  </Text>
                  <Text style={styles.serviceBannerSub}>
                    Link medical specialties, customize starting pricing, and manage available procedures.
                  </Text>
                </View>
              </View>

              {linkedHospitalServices.length === 0 ? (
                <View style={styles.emptyServicesBox}>
                  <Text style={styles.emptyServicesIcon}>📋</Text>
                  <Text style={styles.emptyServicesTitle}>No services linked yet</Text>
                  <Text style={styles.emptyServicesSub}>
                    Link medical services to this hospital so patients can browse procedures and request appointments.
                  </Text>
                  <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenAddService}>
                    <Text style={styles.emptyAddBtnText}>+ Link First Medical Service</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                linkedHospitalServices.map((hs) => {
                  const sName = hs.service?.name || `Service #${hs.serviceId}`;
                  const sCat = hs.service?.category;
                  const isActive = hs.status === 'ACTIVE';
                  const subList = hs.subServices
                    ? hs.subServices.split(',').map((s) => s.trim()).filter(Boolean)
                    : [];

                  return (
                    <View key={hs.id} style={styles.serviceCard}>
                      <View style={styles.serviceCardHeader}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View style={styles.serviceTitleRow}>
                            <Text style={styles.serviceName}>{sName}</Text>
                            {sCat && (
                              <View style={styles.serviceCategoryBadge}>
                                <Text style={styles.serviceCategoryBadgeText}>{sCat}</Text>
                              </View>
                            )}
                          </View>
                          {hs.startingPrice !== undefined && hs.startingPrice !== null ? (
                            <Text style={styles.servicePriceText}>
                              Starting from{' '}
                              <Text style={styles.servicePriceHighlight}>
                                ₹{Number(hs.startingPrice).toLocaleString('en-IN')}
                              </Text>
                            </Text>
                          ) : (
                            <Text style={styles.servicePriceMuted}>Price on consultation</Text>
                          )}
                        </View>

                        <View style={[styles.statusBadge, isActive ? styles.statusApproved : styles.statusSuspended]}>
                          <Text style={styles.statusBadgeText}>{hs.status || 'ACTIVE'}</Text>
                        </View>
                      </View>

                      {/* Sub-services pills */}
                      {subList.length > 0 && (
                        <View style={styles.subServicesContainer}>
                          <Text style={styles.subServicesLabel}>Procedures / Treatments:</Text>
                          <View style={styles.subPillsWrap}>
                            {subList.map((sub, idx) => (
                              <View key={idx} style={styles.subPill}>
                                <Text style={styles.subPillText}>{sub}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Description / Treatment Details */}
                      {hs.description ? (
                        <Text style={styles.serviceDesc} numberOfLines={2}>
                          {hs.description}
                        </Text>
                      ) : null}

                      {/* Action buttons */}
                      <View style={styles.serviceActionRow}>
                        <TouchableOpacity
                          style={styles.serviceEditBtn}
                          onPress={() => handleOpenEditService(hs)}
                        >
                          <Text style={styles.serviceEditBtnText}>✏️ Edit Pricing & Details</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.serviceDeleteBtn}
                          onPress={() => handleRemoveHospitalService(hs)}
                        >
                          <Text style={styles.serviceDeleteBtnText}>🗑️ Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ======================================================== */}
      {/* ADD / EDIT SERVICE LINK MODAL */}
      {/* ======================================================== */}
      <Modal visible={editServiceModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setEditServiceModalVisible(false)}
              disabled={editingServiceSaving}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalHeaderTitle}>
                {isEditingExistingLink ? 'Edit Service Link' : 'Link Medical Service'}
              </Text>
              <Text style={styles.modalHeaderSub} numberOfLines={1}>
                {serviceHospital?.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSaveHospitalService}
              disabled={editingServiceSaving}
            >
              <Text style={[styles.modalDoneText, editingServiceSaving && { opacity: 0.5 }]}>
                {editingServiceSaving ? 'Saving...' : 'Save ✓'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Service Selector (Only when adding a new link) */}
            {!isEditingExistingLink ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.formLabel}>Select Medical Specialty / Service *</Text>
                <Text style={styles.formSubLabel}>
                  Choose which platform service to make available at {serviceHospital?.name}
                </Text>
                <View style={styles.serviceSelectWrap}>
                  {allPlatformServices.map((ps) => {
                    const isLinked = linkedHospitalServices.some((lhs) => lhs.serviceId === ps.id);
                    const isSelected = selectedServiceId === String(ps.id);

                    return (
                      <TouchableOpacity
                        key={ps.id}
                        style={[
                          styles.serviceSelectItem,
                          isSelected && styles.serviceSelectItemActive,
                          isLinked && styles.serviceSelectItemLinked,
                        ]}
                        onPress={() => setSelectedServiceId(String(ps.id))}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.serviceSelectName,
                              isSelected && styles.serviceSelectNameActive,
                            ]}
                          >
                            {ps.name} {isLinked ? ' (Already Linked)' : ''}
                          </Text>
                          {ps.category ? (
                            <Text style={styles.serviceSelectCat}>{ps.category}</Text>
                          ) : null}
                        </View>
                        {isSelected && <Text style={styles.serviceSelectCheck}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.editingServiceBanner}>
                <Text style={styles.editingServiceTitle}>
                  🩺 {linkedHospitalServices.find((lhs) => String(lhs.serviceId) === selectedServiceId)?.service?.name || 'Service Link'}
                </Text>
                <Text style={styles.editingServiceSub}>
                  Updating service offerings and starting pricing for {serviceHospital?.name}
                </Text>
              </View>
            )}

            {/* Starting Price */}
            <Text style={styles.formLabel}>Starting Price (₹ INR)</Text>
            <Text style={styles.formSubLabel}>
              Minimum estimated procedure or consultation cost (e.g. 25000)
            </Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 50000"
              placeholderTextColor={colors.textMuted}
              value={svcStartingPrice}
              onChangeText={setSvcStartingPrice}
              keyboardType="numeric"
            />

            {/* Status Selector */}
            <Text style={styles.formLabel}>Service Availability Status</Text>
            <View style={styles.rolePickerRow}>
              {(['ACTIVE', 'INACTIVE'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.roleOption, svcStatus === st && styles.roleOptionActive]}
                  onPress={() => setSvcStatus(st)}
                >
                  <Text style={[styles.roleOptionText, svcStatus === st && styles.roleOptionTextActive]}>
                    {st === 'ACTIVE' ? '✓ ACTIVE (Visible to Patients)' : '✕ INACTIVE (Hidden)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sub-services */}
            <Text style={styles.formLabel}>Procedures / Sub-Services (Comma Separated)</Text>
            <Text style={styles.formSubLabel}>
              e.g. Angioplasty, Coronary Bypass, Valve Replacement, Pacemaker Implant
            </Text>
            <TextInput
              style={[styles.formInput, { minHeight: 64 }]}
              placeholder="Angioplasty, Valve Replacement, Bypass..."
              placeholderTextColor={colors.textMuted}
              value={svcSubServices}
              onChangeText={setSvcSubServices}
              multiline
            />

            {/* Description / Overview */}
            <Text style={styles.formLabel}>Service Overview & Department Details</Text>
            <TextInput
              style={[styles.formInput, { minHeight: 80 }]}
              placeholder="Highlight equipment (e.g. Cath Lab), surgeon expertise, and treatment package specifics..."
              placeholderTextColor={colors.textMuted}
              value={svcDescription}
              onChangeText={setSvcDescription}
              multiline
            />

            {/* Treatment Details */}
            <Text style={styles.formLabel}>Special Notes / Instructions (Optional)</Text>
            <TextInput
              style={[styles.formInput, { minHeight: 64 }]}
              placeholder="Pre-op tests required, insurance coverage notes..."
              placeholderTextColor={colors.textMuted}
              value={svcTreatmentDetails}
              onChangeText={setSvcTreatmentDetails}
              multiline
            />

            <TouchableOpacity
              style={[styles.saveSubmitBtn, editingServiceSaving && { opacity: 0.6 }]}
              onPress={handleSaveHospitalService}
              disabled={editingServiceSaving}
            >
              <Text style={styles.saveSubmitBtnText}>
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

      {/* ======================================================== */}
      {/* HOSPITAL DOCTORS MANAGEMENT MODAL */}
      {/* ======================================================== */}
      <Modal visible={doctorsModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDoctorsModalVisible(false)}>
              <Text style={styles.modalCancelText}>✕ Close</Text>
            </TouchableOpacity>
            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalHeaderTitle}>Hospital Doctors</Text>
              <Text style={styles.modalHeaderSub} numberOfLines={1}>
                {doctorHospital?.name}
              </Text>
            </View>
            <TouchableOpacity style={styles.headerAddServiceBtn} onPress={handleOpenAddDoctor}>
              <Text style={styles.headerAddServiceBtnText}>+ Add Doctor</Text>
            </TouchableOpacity>
          </View>

          {loadingHospitalDoctors ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading doctors & specialists...</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.servicesScroll} showsVerticalScrollIndicator={false}>
              {/* Info Banner */}
              <View style={[styles.serviceBanner, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <Text style={styles.serviceBannerIcon}>👨‍⚕️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.serviceBannerTitle, { color: '#15803D' }]}>
                    {hospitalDoctors.length} Specialists & Doctors at {doctorHospital?.name}
                  </Text>
                  <Text style={[styles.serviceBannerSub, { color: '#16A34A' }]}>
                    Manage doctor qualifications, department specialties, experience, and profile bios.
                  </Text>
                </View>
              </View>

              {hospitalDoctors.length === 0 ? (
                <View style={styles.emptyServicesBox}>
                  <Text style={styles.emptyServicesIcon}>👨‍⚕️</Text>
                  <Text style={styles.emptyServicesTitle}>No doctors added yet</Text>
                  <Text style={styles.emptyServicesSub}>
                    Add medical specialists and doctors for this hospital so patients can view profiles and book consultations.
                  </Text>
                  <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenAddDoctor}>
                    <Text style={styles.emptyAddBtnText}>+ Add First Doctor</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                hospitalDoctors.map((doc, idx) => {
                  const treatmentList = Array.isArray(doc.treatments)
                    ? doc.treatments
                    : typeof doc.treatments === 'string'
                    ? (doc.treatments as string).split(',').map((t) => t.trim()).filter(Boolean)
                    : [];

                  return (
                    <View key={idx} style={styles.doctorCard}>
                      <View style={styles.doctorCardHeader}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View style={styles.doctorTitleRow}>
                            <Text style={styles.doctorName}>
                              {doc.name.toLowerCase().startsWith('dr') ? doc.name : `Dr. ${doc.name}`}
                            </Text>
                            {doc.showOnHomepage && (
                              <View style={styles.docFeaturedBadge}>
                                <Text style={styles.docFeaturedBadgeText}>✨ Featured</Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.docSpecialtyRow}>
                            <View style={styles.docSpecialtyBadge}>
                              <Text style={styles.docSpecialtyBadgeText}>{doc.specialty}</Text>
                            </View>
                            {doc.rating !== undefined ? (
                              <View style={styles.docRatingBadge}>
                                <Text style={styles.docRatingBadgeText}>⭐ {doc.rating}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </View>

                      {/* Qualification & Experience */}
                      <View style={styles.docMetaBox}>
                        {doc.qualification ? (
                          <Text style={styles.docMetaItem}>
                            🎓 <Text style={{ fontWeight: '700' }}>{doc.qualification}</Text>
                          </Text>
                        ) : null}
                        {doc.experience ? (
                          <Text style={styles.docMetaItem}>
                            ⏳ <Text style={{ fontWeight: '700' }}>{doc.experience}</Text>
                          </Text>
                        ) : null}
                      </View>

                      {/* Treatments pills */}
                      {treatmentList.length > 0 && (
                        <View style={styles.subServicesContainer}>
                          <Text style={styles.subServicesLabel}>Key Procedures & Treatments:</Text>
                          <View style={styles.subPillsWrap}>
                            {treatmentList.map((t, tIdx) => (
                              <View key={tIdx} style={styles.subPill}>
                                <Text style={styles.subPillText}>{t}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* About snippet */}
                      {doc.about ? (
                        <Text style={styles.serviceDesc} numberOfLines={2}>
                          {doc.about}
                        </Text>
                      ) : null}

                      {/* Action buttons */}
                      <View style={styles.serviceActionRow}>
                        <TouchableOpacity
                          style={styles.serviceEditBtn}
                          onPress={() => handleOpenEditDoctor(doc, idx)}
                        >
                          <Text style={styles.serviceEditBtnText}>✏️ Edit Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.serviceDeleteBtn}
                          onPress={() => handleRemoveDoctor(doc, idx)}
                        >
                          <Text style={styles.serviceDeleteBtnText}>🗑️ Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ======================================================== */}
      {/* ADD / EDIT DOCTOR MODAL */}
      {/* ======================================================== */}
      <Modal visible={editDoctorModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setEditDoctorModalVisible(false)}
              disabled={editingDoctorSaving}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalHeaderTitle}>
                {editingDoctorIndex !== null ? 'Edit Doctor Profile' : 'Add Doctor / Specialist'}
              </Text>
              <Text style={styles.modalHeaderSub} numberOfLines={1}>
                {doctorHospital?.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSaveDoctor}
              disabled={editingDoctorSaving}
            >
              <Text style={[styles.modalDoneText, editingDoctorSaving && { opacity: 0.5 }]}>
                {editingDoctorSaving ? 'Saving...' : 'Save ✓'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Doctor Name */}
            <Text style={styles.formLabel}>Doctor Full Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Dr. Rajesh Sharma"
              placeholderTextColor={colors.textMuted}
              value={docName}
              onChangeText={setDocName}
            />

            {/* Specialty */}
            <Text style={styles.formLabel}>Primary Specialty / Department *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Cardiology, Orthopaedics, Neurology..."
              placeholderTextColor={colors.textMuted}
              value={docSpecialty}
              onChangeText={setDocSpecialty}
            />

            {/* Qualification */}
            <Text style={styles.formLabel}>Medical Qualification</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. MBBS, MS, MCh (Cardio-Thoracic)"
              placeholderTextColor={colors.textMuted}
              value={docQualification}
              onChangeText={setDocQualification}
            />

            {/* Experience & Rating Grid */}
            <View style={styles.formGridRow}>
              <View style={styles.formGridCol}>
                <Text style={styles.formLabel}>Years of Experience</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 15+ Years"
                  placeholderTextColor={colors.textMuted}
                  value={docExperience}
                  onChangeText={setDocExperience}
                />
              </View>
              <View style={styles.formGridCol}>
                <Text style={styles.formLabel}>Rating (1.0 - 5.0)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="4.9"
                  placeholderTextColor={colors.textMuted}
                  value={docRating}
                  onChangeText={setDocRating}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Photo URL */}
            <Text style={styles.formLabel}>Doctor Photo URL (Optional)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="https://images.example.com/doctor.jpg"
              placeholderTextColor={colors.textMuted}
              value={docImage}
              onChangeText={setDocImage}
              autoCapitalize="none"
            />

            {/* Procedures / Treatments */}
            <Text style={styles.formLabel}>Key Procedures & Treatments (Comma Separated)</Text>
            <Text style={styles.formSubLabel}>
              e.g. Angioplasty, Coronary Bypass, Heart Valve Surgery
            </Text>
            <TextInput
              style={[styles.formInput, { minHeight: 64 }]}
              placeholder="Angioplasty, Valve Replacement, Pacemaker..."
              placeholderTextColor={colors.textMuted}
              value={docTreatments}
              onChangeText={setDocTreatments}
              multiline
            />

            {/* About Doctor */}
            <Text style={styles.formLabel}>About Doctor / Professional Biography</Text>
            <TextInput
              style={[styles.formInput, { minHeight: 80 }]}
              placeholder="Write doctor's professional background, awards, fellowships, and clinical expertise..."
              placeholderTextColor={colors.textMuted}
              value={docAbout}
              onChangeText={setDocAbout}
              multiline
            />

            {/* Show on Homepage Switch */}
            <View style={[styles.togglesCard, { marginTop: 14 }]}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Feature on Homepage</Text>
                  <Text style={styles.toggleSubtitle}>Highlight doctor profile in Homepage Testimonial Carousel</Text>
                </View>
                <Switch
                  value={docShowOnHomepage}
                  onValueChange={setDocShowOnHomepage}
                  trackColor={{ false: '#E2E8F0', true: colors.primaryLight }}
                  thumbColor={docShowOnHomepage ? colors.primary : '#94A3B8'}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveSubmitBtn, editingDoctorSaving && { opacity: 0.6 }]}
              onPress={handleSaveDoctor}
              disabled={editingDoctorSaving}
            >
              <Text style={styles.saveSubmitBtnText}>
                {editingDoctorSaving
                  ? 'Saving Doctor Profile...'
                  : editingDoctorIndex !== null
                  ? 'Update Doctor Details ✓'
                  : 'Save & Add Doctor ✓'}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textWhite,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: colors.surface,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.textPrimary,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.textMuted,
    padding: 4,
  },
  kpiContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  kpiCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF1F2',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 1,
  },
  filtersContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingBottom: 10,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.textWhite,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  hospitalCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  nameCol: {
    flex: 1,
    marginRight: 10,
  },
  nameTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  hospName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  verifiedBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  nabhBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  nabhBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  hospLocation: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusSuspended: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metaGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    gap: 10,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  metaVal: {
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 2,
    fontWeight: '600',
  },
  phoneLink: {
    color: colors.primary,
    fontWeight: '700',
  },
  infoPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  ratingCount: {
    fontSize: 10,
    color: '#B45309',
  },
  websitePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  websiteText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  leadPill: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  leadPillText: {
    fontSize: 11,
    color: colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  btn: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editHospitalBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
  },
  editHospitalBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textWhite,
  },
  servicesBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
  },
  servicesBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  doctorsBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
  },
  doctorsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  viewProfileBtn: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  approveBtn: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  creditBtn: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  creditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activateBtn: {
    backgroundColor: '#DCFCE7',
  },
  activateBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  suspendBtn: {
    backgroundColor: '#FEF3C7',
  },
  suspendBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
  },
  deleteBtnText: {
    fontSize: 13,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 14,
    marginTop: 2,
  },
  creditInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textWhite,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  modalHeaderCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  modalCancelText: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '600',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalHeaderSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  modalDoneText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  headerAddServiceBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerAddServiceBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textWhite,
  },
  formScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  roleOptionTextActive: {
    color: colors.textWhite,
  },
  togglesCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  toggleSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
    marginTop: 10,
  },
  formSubLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: '500',
  },
  formInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGridCol: {
    flex: 1,
  },
  saveSubmitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  saveSubmitBtnText: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },
  fetchRatingBtn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  fetchRatingBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
    textAlign: 'center',
  },
  syncIcon: {
    fontSize: 10,
    color: '#92400E',
  },
  // Services Management Styles
  servicesScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  serviceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 12,
  },
  serviceBannerIcon: {
    fontSize: 24,
  },
  serviceBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  serviceBannerSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  emptyServicesBox: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyServicesIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyServicesTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyServicesSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  emptyAddBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textWhite,
  },
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  serviceCategoryBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  serviceCategoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7E22CE',
  },
  servicePriceText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  servicePriceHighlight: {
    fontWeight: '800',
    color: '#047857',
  },
  servicePriceMuted: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
    fontStyle: 'italic',
  },
  subServicesContainer: {
    backgroundColor: colors.surfaceSecondary,
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  subServicesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
  },
  subPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  serviceDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 6,
  },
  serviceActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: 10,
  },
  serviceEditBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  serviceEditBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  serviceDeleteBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  serviceDeleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  serviceSelectWrap: {
    gap: 8,
    marginTop: 6,
  },
  serviceSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceSelectItemActive: {
    backgroundColor: '#FFF1F2',
    borderColor: colors.primary,
  },
  serviceSelectItemLinked: {
    opacity: 0.7,
  },
  serviceSelectName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  serviceSelectNameActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  serviceSelectCat: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  serviceSelectCheck: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
    marginLeft: 8,
  },
  editingServiceBanner: {
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
  },
  editingServiceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  editingServiceSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  // Doctor Management Styles
  doctorCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  doctorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  doctorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  docSpecialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  docSpecialtyBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  docSpecialtyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  docRatingBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  docRatingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  docFeaturedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  docFeaturedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  docMetaBox: {
    backgroundColor: colors.surfaceSecondary,
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 6,
    gap: 2,
  },
  docMetaItem: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});


