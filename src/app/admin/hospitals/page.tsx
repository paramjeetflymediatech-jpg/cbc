'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import GoogleAddressMapPicker from '@/components/ui/GoogleAddressMapPicker';
import RichTextEditor from '@/components/ui/RichTextEditor';
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Phone,
  Mail,
  MapPin,
  FileText,
  X,
  Trash2,
  Plus,
  Loader2,
  Edit3,
  Upload,
  Save,
  Stethoscope,
  UserPlus,
  User,
  Activity,
  Sparkles,
  DollarSign,
  Star,
} from 'lucide-react';

interface IDoctorReview {
  id?: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

interface IDoctor {
  name: string;
  qualification?: string;
  specialty?: string;
  experience?: string;
  image?: string;
  treatments?: string[];
  reviews?: IDoctorReview[];
  rating?: number;
}

interface PlatformService {
  id: number;
  name: string;
  slug: string;
  category?: string;
  status: string;
}

interface HospitalServiceData {
  id: number;
  hospitalId: number;
  serviceId: number;
  startingPrice?: number | null;
  description?: string | null;
  treatmentDetails?: string | null;
  status: string;
  service?: PlatformService;
}

interface StateItem {
  id: number;
  name: string;
  code?: string;
  cities?: { id?: number; name: string }[];
}

interface HospitalData {
  id: number;
  name: string;
  email: string;
  phone: string;
  website?: string | null;
  address: string;
  city: string;
  district?: string | null;
  state: string;
  country?: string;
  description?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  gallery?: string[];
  contactPersonName?: string | null;
  contactPersonPhone?: string | null;
  contactPersonEmail?: string | null;
  doctors?: IDoctor[];
  faqs?: { question: string; answer: string }[];
  isNabhAccredited?: boolean;
  isVerifiedPartner?: boolean;
  googleRating?: number;
  googleReviewsCount?: number | null;
  rating?: number;
  leadsRemaining?: number;
  status: string;
  accountStatus?: string;
  rejectionReason?: string | null;
  createdAt: string;
}

export default function AdminHospitalsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  // Dynamic Locations State
  const [statesList, setStatesList] = useState<StateItem[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [editCityOptions, setEditCityOptions] = useState<string[]>([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewHospital, setViewHospital] = useState<HospitalData | null>(null);
  const [deletingHospital, setDeletingHospital] = useState<HospitalData | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Add Hospital Form state
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addState, setAddState] = useState('Maharashtra');
  const [addCity, setAddCity] = useState('Mumbai');
  const [addAddress, setAddAddress] = useState('');
  const [addWebsite, setAddWebsite] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addLeads, setAddLeads] = useState('50');
  const [addStatus, setAddStatus] = useState('APPROVED');
  const [formError, setFormError] = useState('');

  // Super Admin Edit Hospital Profile state
  const [editHospital, setEditHospital] = useState<HospitalData | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editState, setEditState] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [editCoverImage, setEditCoverImage] = useState('');
  const [editGallery, setEditGallery] = useState<string[]>([]);
  const [editContactPersonName, setEditContactPersonName] = useState('');
  const [editContactPersonPhone, setEditContactPersonPhone] = useState('');
  const [editContactPersonEmail, setEditContactPersonEmail] = useState('');
  const [editIsNabhAccredited, setEditIsNabhAccredited] = useState(true);
  const [editIsVerifiedPartner, setEditIsVerifiedPartner] = useState(true);
  const [editGoogleRating, setEditGoogleRating] = useState<number | string>(4.8);
  const [editGoogleReviewsCount, setEditGoogleReviewsCount] = useState<number | string>('');
  const [editLeadsRemaining, setEditLeadsRemaining] = useState<number | string>(50);
  const [editStatus, setEditStatus] = useState('APPROVED');
  const [editAccountStatus, setEditAccountStatus] = useState('ACTIVE');
  const [editFormError, setEditFormError] = useState('');
  const [editSuccessMessage, setEditSuccessMessage] = useState('');

  // Super Admin Hospital FAQs state
  const [editFaqs, setEditFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [newEditFaqQ, setNewEditFaqQ] = useState('');
  const [newEditFaqA, setNewEditFaqA] = useState('');

  const handleAddEditFaq = () => {
    if (!newEditFaqQ.trim() || !newEditFaqA.trim()) return;
    setEditFaqs([...editFaqs, { question: newEditFaqQ.trim(), answer: newEditFaqA.trim() }]);
    setNewEditFaqQ('');
    setNewEditFaqA('');
  };

  const handleRemoveEditFaq = (index: number) => {
    setEditFaqs(editFaqs.filter((_, idx) => idx !== index));
  };

  // Super Admin Doctor Management State
  const [doctorModalHospital, setDoctorModalHospital] = useState<HospitalData | null>(null);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [editingDocIndex, setEditingDocIndex] = useState<number | null>(null);
  const [docName, setDocName] = useState('');
  const [docQualification, setDocQualification] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docExperience, setDocExperience] = useState('');
  const [docImage, setDocImage] = useState('');
  const [docTreatmentsInput, setDocTreatmentsInput] = useState('');
  const [uploadingDocImage, setUploadingDocImage] = useState(false);
  const [docSaving, setDocSaving] = useState(false);
  const [viewingReviewsDoc, setViewingReviewsDoc] = useState<{ doc: IDoctor; docIndex: number } | null>(null);

  const handleDeleteDoctorReview = async (reviewId?: string, reviewIndex?: number) => {
    if (!doctorModalHospital || !viewingReviewsDoc) return;
    if (!confirm('Are you sure you want to delete this patient review?')) return;

    const { doc, docIndex } = viewingReviewsDoc;
    const currentReviews = doc.reviews || [];
    const updatedReviews = currentReviews.filter((r, idx) => (reviewId ? r.id !== reviewId : idx !== reviewIndex));

    const totalRating = updatedReviews.reduce((sum, r) => sum + (r.rating || 5), 0);
    const avgRating = updatedReviews.length > 0 ? Math.round((totalRating / updatedReviews.length) * 10) / 10 : 5.0;

    const currentDoctors = [...(doctorModalHospital.doctors || [])];
    currentDoctors[docIndex] = {
      ...doc,
      reviews: updatedReviews,
      rating: avgRating,
    };

    try {
      const res = await fetch(`/api/admin/hospitals/${doctorModalHospital.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctors: currentDoctors }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete review');

      const updatedHospital = { ...doctorModalHospital, doctors: currentDoctors };
      setDoctorModalHospital(updatedHospital);
      setViewingReviewsDoc({ doc: currentDoctors[docIndex], docIndex });
      setHospitals((prev) =>
        prev.map((h) => (h.id === doctorModalHospital.id ? { ...h, doctors: currentDoctors } : h))
      );
    } catch (err) {
      alert((err as Error).message || 'Error deleting review.');
    }
  };

  const resetDocForm = () => {
    setDocName('');
    setDocQualification('');
    setDocSpecialty('');
    setDocExperience('');
    setDocImage('');
    setDocTreatmentsInput('');
  };

  const handleOpenDoctorModal = (h: HospitalData) => {
    setDoctorModalHospital(h);
    setShowAddDocModal(false);
    setEditingDocIndex(null);
    resetDocForm();
  };

  const handleStartAddDoctor = () => {
    resetDocForm();
    setEditingDocIndex(null);
    setShowAddDocModal(true);
  };

  const handleStartEditDoctor = (doc: IDoctor, index: number) => {
    setDocName(doc.name || '');
    setDocQualification(doc.qualification || '');
    setDocSpecialty(doc.specialty || '');
    setDocExperience(doc.experience || '');
    setDocImage(doc.image || '');
    setDocTreatmentsInput((doc.treatments || []).join(', '));
    setEditingDocIndex(index);
    setShowAddDocModal(true);
  };

  const handleDocImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'doctors');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setDocImage(data.url);
      } else {
        alert(data.error || 'Photo upload failed');
      }
    } catch {
      alert('Error uploading doctor photo');
    } finally {
      setUploadingDocImage(false);
    }
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorModalHospital || !docName.trim()) return;

    setDocSaving(true);
    try {
      const currentDoctors = doctorModalHospital.doctors || [];
      const updatedDoctors = [...currentDoctors];

      const parsedTreatments = docTreatmentsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const newDoc: IDoctor = {
        name: docName.trim(),
        qualification: docQualification.trim(),
        specialty: docSpecialty.trim(),
        experience: docExperience.trim(),
        image: docImage || undefined,
        treatments: parsedTreatments,
      };

      if (editingDocIndex !== null) {
        updatedDoctors[editingDocIndex] = newDoc;
      } else {
        updatedDoctors.push(newDoc);
      }

      const res = await fetch(`/api/admin/hospitals/${doctorModalHospital.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctors: updatedDoctors }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update doctors');

      const updatedHospital = { ...doctorModalHospital, doctors: updatedDoctors };
      setDoctorModalHospital(updatedHospital);
      setHospitals((prev) =>
        prev.map((h) => (h.id === doctorModalHospital.id ? { ...h, doctors: updatedDoctors } : h))
      );

      setShowAddDocModal(false);
      setEditingDocIndex(null);
      resetDocForm();
    } catch (err: unknown) {
      alert((err as Error).message || 'Error saving doctor.');
    } finally {
      setDocSaving(false);
    }
  };

  const handleDeleteDoctor = async (index: number) => {
    if (!doctorModalHospital || !confirm('Are you sure you want to remove this doctor?')) return;

    const updatedDoctors = (doctorModalHospital.doctors || []).filter((_, idx) => idx !== index);
    setDocSaving(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${doctorModalHospital.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctors: updatedDoctors }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove doctor');

      const updatedHospital = { ...doctorModalHospital, doctors: updatedDoctors };
      setDoctorModalHospital(updatedHospital);
      setHospitals((prev) =>
        prev.map((h) => (h.id === doctorModalHospital.id ? { ...h, doctors: updatedDoctors } : h))
      );
    } catch (err: unknown) {
      alert((err as Error).message || 'Error deleting doctor.');
    } finally {
      setDocSaving(false);
    }
  };

  // Super Admin Hospital Services State
  const [serviceModalHospital, setServiceModalHospital] = useState<HospitalData | null>(null);
  const [platformServices, setPlatformServices] = useState<PlatformService[]>([]);
  const [linkedServices, setLinkedServices] = useState<HospitalServiceData[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);

  const [svcSelectedServiceId, setSvcSelectedServiceId] = useState<number | string>('');
  const [svcStartingPrice, setSvcStartingPrice] = useState('');
  const [svcStatus, setSvcStatus] = useState('ACTIVE');
  const [svcDescription, setSvcDescription] = useState('');
  const [svcTreatmentDetails, setSvcTreatmentDetails] = useState('');
  const [svcSaving, setSvcSaving] = useState(false);

  const resetServiceForm = () => {
    setEditingServiceId(null);
    setSvcSelectedServiceId('');
    setSvcStartingPrice('');
    setSvcStatus('ACTIVE');
    setSvcDescription('');
    setSvcTreatmentDetails('');
  };

  const handleOpenServiceModal = async (h: HospitalData) => {
    setServiceModalHospital(h);
    setShowAddServiceModal(false);
    resetServiceForm();
    setLoadingServices(true);

    try {
      const res = await fetch(`/api/admin/hospitals/${h.id}/services`);
      const data = await res.json();
      if (res.ok) {
        setPlatformServices(data.allPlatformServices || []);
        setLinkedServices(data.hospitalServices || []);
      } else {
        alert(data.error || 'Failed to fetch hospital services');
      }
    } catch {
      alert('Error fetching hospital services');
    } finally {
      setLoadingServices(false);
    }
  };

  const handleStartAddService = () => {
    resetServiceForm();
    if (platformServices.length > 0) {
      const linkedIds = new Set(linkedServices.map((ls) => ls.serviceId));
      const firstAvailable = platformServices.find((ps) => !linkedIds.has(ps.id));
      if (firstAvailable) {
        setSvcSelectedServiceId(firstAvailable.id);
      } else if (platformServices[0]) {
        setSvcSelectedServiceId(platformServices[0].id);
      }
    }
    setShowAddServiceModal(true);
  };

  const handleStartEditService = (hs: HospitalServiceData) => {
    setEditingServiceId(hs.serviceId);
    setSvcSelectedServiceId(hs.serviceId);
    setSvcStartingPrice(hs.startingPrice ? String(hs.startingPrice) : '');
    setSvcStatus(hs.status || 'ACTIVE');
    setSvcDescription(hs.description || '');
    setSvcTreatmentDetails(hs.treatmentDetails || '');
    setShowAddServiceModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceModalHospital || !svcSelectedServiceId) return;

    setSvcSaving(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${serviceModalHospital.id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: Number(svcSelectedServiceId),
          startingPrice: svcStartingPrice,
          status: svcStatus,
          description: svcDescription,
          treatmentDetails: svcTreatmentDetails,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save service');

      if (data.hospitalServices) {
        setLinkedServices(data.hospitalServices);
      }
      setShowAddServiceModal(false);
      resetServiceForm();
    } catch (err: unknown) {
      alert((err as Error).message || 'Error saving service.');
    } finally {
      setSvcSaving(false);
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!serviceModalHospital || !confirm('Are you sure you want to remove this service from the hospital?')) return;

    setSvcSaving(true);
    try {
      const res = await fetch(
        `/api/admin/hospitals/${serviceModalHospital.id}/services?serviceId=${serviceId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove service');

      if (data.hospitalServices) {
        setLinkedServices(data.hospitalServices);
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Error removing service.');
    } finally {
      setSvcSaving(false);
    }
  };
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  const fetchHospitals = () => {
    const url = statusFilter ? `/api/admin/hospitals?status=${statusFilter}` : '/api/admin/hospitals';
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.hospitals) setHospitals(data.hospitals);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const url = statusFilter ? `/api/admin/hospitals?status=${statusFilter}` : '/api/admin/hospitals';
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.hospitals) setHospitals(data.hospitals);
      })
      .finally(() => setLoading(false));

    // Fetch States & Cities
    fetch('/api/locations')
      .then((res) => res.json())
      .then((data) => {
        if (data.states && data.states.length > 0) {
          setStatesList(data.states);
          const defaultSt = data.states.find((s: StateItem) => s.name === 'Maharashtra') || data.states[0];
          setAddState(defaultSt.name);
          if (defaultSt.cities && defaultSt.cities.length > 0) {
            const cities = defaultSt.cities.map((c: { name: string }) => c.name);
            setCityOptions(cities);
            setAddCity(cities[0]);
          }
        }
      })
      .catch(() => {});
  }, [statusFilter]);

  const handleAddStateChange = (newStateName: string) => {
    setAddState(newStateName);
    const selectedStateObj = statesList.find((s: StateItem) => s.name === newStateName);
    if (selectedStateObj && selectedStateObj.cities && selectedStateObj.cities.length > 0) {
      const cities = selectedStateObj.cities.map((c: { name: string }) => c.name);
      setCityOptions(cities);
      setAddCity(cities[0]);
    } else {
      setCityOptions([]);
      setAddCity('');
    }
  };

  const handleEditStateChange = (newStateName: string) => {
    setEditState(newStateName);
    const selectedStateObj = statesList.find((s: StateItem) => s.name === newStateName);
    if (selectedStateObj && selectedStateObj.cities && selectedStateObj.cities.length > 0) {
      const cities = selectedStateObj.cities.map((c: { name: string }) => c.name);
      setEditCityOptions(cities);
      setEditCity(cities[0]);
    } else {
      setEditCityOptions([]);
    }
  };

  const handleGoogleAddressSelected = (data: {
    address: string;
    city: string;
    state: string;
    country: string;
  }) => {
    if (data.address) setAddAddress(data.address);
    if (data.state) {
      const matchedState = statesList.find((s: StateItem) =>
        s.name.toLowerCase().includes(data.state.toLowerCase())
      );
      if (matchedState) {
        handleAddStateChange(matchedState.name);
      }
    }
    if (data.city) {
      setAddCity(data.city);
    }
  };

  const handleEditGoogleAddressSelected = (data: {
    address: string;
    city: string;
    state: string;
    country: string;
  }) => {
    if (data.address) setEditAddress(data.address);
    if (data.state) {
      const matchedState = statesList.find((s: StateItem) =>
        s.name.toLowerCase().includes(data.state.toLowerCase())
      );
      if (matchedState) {
        handleEditStateChange(matchedState.name);
      }
    }
    if (data.city) {
      setEditCity(data.city);
    }
  };

  const handleStartEditHospital = (h: HospitalData) => {
    setEditHospital(h);
    setEditName(h.name || '');
    setEditEmail(h.email || '');
    setEditPhone(h.phone || '');
    setEditWebsite(h.website || '');
    setEditAddress(h.address || '');
    setEditCity(h.city || '');
    setEditDistrict(h.district || '');
    setEditState(h.state || 'Maharashtra');
    setEditDescription(h.description || '');
    setEditLogo(h.logo || '');
    setEditCoverImage(h.coverImage || '');
    setEditGallery(h.gallery || []);
    setEditFaqs(h.faqs || []);
    setEditContactPersonName(h.contactPersonName || '');
    setEditContactPersonPhone(h.contactPersonPhone || '');
    setEditContactPersonEmail(h.contactPersonEmail || '');
    setEditIsNabhAccredited(Boolean(h.isNabhAccredited));
    setEditIsVerifiedPartner(Boolean(h.isVerifiedPartner));
    setEditGoogleRating(h.googleRating || h.rating || 4.8);
    setEditGoogleReviewsCount(h.googleReviewsCount || '');
    setEditLeadsRemaining(h.leadsRemaining ?? 50);
    setEditStatus(h.status || 'APPROVED');
    setEditAccountStatus(h.accountStatus || 'ACTIVE');
    setEditFormError('');
    setEditSuccessMessage('');

    // Populate city options for edit state
    const matchedState = statesList.find((s: StateItem) => s.name === (h.state || 'Maharashtra'));
    if (matchedState && matchedState.cities) {
      setEditCityOptions(matchedState.cities.map((c: { name: string }) => c.name));
    }
  };

  const handleSaveEditHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editHospital) return;

    setEditFormError('');
    setEditSuccessMessage('');
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/hospitals/${editHospital.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
          website: editWebsite,
          address: editAddress,
          city: editCity,
          district: editDistrict,
          state: editState,
          description: editDescription,
          logo: editLogo,
          coverImage: editCoverImage,
          gallery: editGallery,
          faqs: editFaqs,
          contactPersonName: editContactPersonName,
          contactPersonPhone: editContactPersonPhone,
          contactPersonEmail: editContactPersonEmail,
          isNabhAccredited: editIsNabhAccredited,
          isVerifiedPartner: editIsVerifiedPartner,
          googleRating: Number(editGoogleRating),
          googleReviewsCount: editGoogleReviewsCount ? Number(editGoogleReviewsCount) : null,
          leadsRemaining: Number(editLeadsRemaining),
          status: editStatus,
          accountStatus: editAccountStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditFormError(data.error || 'Failed to update hospital profile.');
      } else {
        setEditSuccessMessage('Hospital profile updated successfully!');
        fetchHospitals();
        setTimeout(() => {
          setEditHospital(null);
        }, 1200);
      }
    } catch {
      setEditFormError('Server error updating hospital profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'logo' | 'cover' | 'gallery'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTarget(target);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'hospitals');
    if (editName) formData.append('hospitalFolder', editName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        if (target === 'logo') setEditLogo(data.url);
        if (target === 'cover') setEditCoverImage(data.url);
        if (target === 'gallery') setEditGallery((prev) => [...prev, data.url]);
      } else {
        alert(data.error || 'Failed to upload image file.');
      }
    } catch {
      alert('Error uploading image file.');
    } finally {
      setUploadingTarget(null);
      e.target.value = '';
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        setViewHospital(null);
        fetchHospitals();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId || !rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${rejectingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });

      if (res.ok) {
        setRejectingId(null);
        setViewHospital(null);
        setRejectionReason('');
        fetchHospitals();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteHospital = async () => {
    if (!deletingHospital) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/hospitals/${deletingHospital.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeletingHospital(null);
        setViewHospital(null);
        fetchHospitals();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddHospitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    try {
      const res = await fetch('/api/admin/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName,
          email: addEmail,
          phone: addPhone,
          password: addPassword,
          city: addCity,
          state: addState,
          address: addAddress,
          website: addWebsite,
          description: addDescription,
          leadsRemaining: Number(addLeads),
          status: addStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to create hospital.');
      } else {
        setShowAddModal(false);
        setAddName('');
        setAddEmail('');
        setAddPhone('');
        setAddPassword('');
        setAddAddress('');
        setAddWebsite('');
        setAddDescription('');
        fetchHospitals();
      }
    } catch {
      setFormError('Server error creating hospital.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Hospital Approvals & Management</h1>
          <p className="text-xs text-gray-500">Inspect hospital applications, add new hospitals, edit profiles, or purge data.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#b02151] hover:bg-[#921941] text-white text-xs font-extrabold px-4 py-2 rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hospital</span>
          </button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#ec2c6c]"
          >
            <option value="">All Registrations</option>
            <option value="PENDING">PENDING APPROVAL</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {/* Hospital Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500 font-semibold flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#b02151]" />
            <span>Loading hospitals...</span>
          </div>
        ) : (
          hospitals.map((h) => (
            <div key={h.id} className="cbc-card p-6 border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full ${
                      h.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : h.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {h.status}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">Registered: {new Date(h.createdAt).toLocaleDateString('en-IN')}</span>
                  <span className="text-xs text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-full">
                    Leads: {h.leadsRemaining ?? 0}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900">{h.name}</h3>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" /> {h.city}, {h.state}</span>
                  <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1 text-gray-400" /> {h.phone}</span>
                  <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1 text-gray-400" /> {h.email}</span>
                </div>

                {h.description && (
                  <div
                    className="text-xs text-gray-600 line-clamp-2 pt-1"
                    dangerouslySetInnerHTML={{ __html: h.description }}
                  />
                )}

                {h.rejectionReason && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                    <strong>Rejection Reason:</strong> {h.rejectionReason}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                <button
                  onClick={() => setViewHospital(h)}
                  className="px-3.5 py-2 bg-pink-50 hover:bg-pink-100 text-[#b02151] rounded-full text-xs font-extrabold transition-all flex items-center space-x-1.5 border border-pink-100 shadow-sm cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>

                <button
                  onClick={() => handleStartEditHospital(h)}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-xs font-extrabold transition-all flex items-center space-x-1.5 border border-indigo-100 shadow-sm cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => handleOpenDoctorModal(h)}
                  className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full text-xs font-extrabold transition-all flex items-center space-x-1.5 border border-purple-100 shadow-sm cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Doctors ({h.doctors?.length || 0})</span>
                </button>

                <button
                  onClick={() => handleOpenServiceModal(h)}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-xs font-extrabold transition-all flex items-center space-x-1.5 border border-emerald-100 shadow-sm cursor-pointer"
                >
                  <Activity className="w-4 h-4" />
                  <span>Services</span>
                </button>

                {h.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleApprove(h.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all flex items-center space-x-1 shadow-md cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => setRejectingId(h.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all flex items-center space-x-1 shadow-md cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </>
                )}

                {h.status === 'APPROVED' && (
                  <button
                    onClick={() => setRejectingId(h.id)}
                    className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-full text-xs font-bold cursor-pointer"
                  >
                    Suspend
                  </button>
                )}

                <button
                  onClick={() => setDeletingHospital(h)}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 rounded-full text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                  title="Delete Hospital & Purge Data"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Hospital Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-extrabold text-gray-900">Add New Partner Hospital</h2>
              <p className="text-xs text-gray-500">Create a hospital account and grant initial lead credits.</p>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddHospitalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hospital Name *</label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Apollo Hospital"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#fd1d74]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Login Email Address *</label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="admin@hospital.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#fd1d74]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mobile / Phone *</label>
                  <input
                    type="tel"
                    required
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#fd1d74]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Portal Login Password *</label>
                  <input
                    type="password"
                    required
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="Create account password"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#fd1d74]"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-gray-200 rounded-2xl">
                <GoogleAddressMapPicker
                  initialAddress={addAddress}
                  initialCity={addCity}
                  initialState={addState}
                  onAddressSelect={handleGoogleAddressSelected}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select State *</label>
                  <select
                    required
                    value={addState}
                    onChange={(e) => handleAddStateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#fd1d74] cursor-pointer"
                  >
                    {statesList.map((st: StateItem) => (
                      <option key={st.id} value={st.name}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select City *</label>
                  {cityOptions.length > 0 ? (
                    <select
                      required
                      value={addCity}
                      onChange={(e) => setAddCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#fd1d74] cursor-pointer"
                    >
                      {cityOptions.map((cityName) => (
                        <option key={cityName} value={cityName}>
                          {cityName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={addCity}
                      onChange={(e) => setAddCity(e.target.value)}
                      placeholder="Enter City"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#fd1d74]"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Initial Lead Package Balance</label>
                  <input
                    type="number"
                    value={addLeads}
                    onChange={(e) => setAddLeads(e.target.value)}
                    placeholder="50"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#b02151] focus:outline-none focus:border-[#fd1d74]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Initial Status</label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#fd1d74]"
                  >
                    <option value="APPROVED">APPROVED (Active Live)</option>
                    <option value="PENDING">PENDING (Require Review)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Website URL</label>
                  <input
                    type="url"
                    value={addWebsite}
                    onChange={(e) => setAddWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#fd1d74]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hospital Description & Overview</label>
                <RichTextEditor
                  value={addDescription}
                  onChange={setAddDescription}
                  placeholder="Overview of hospital facilities, specialty departments, and doctor team..."
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#b02151] hover:bg-[#921941] text-white text-xs font-extrabold px-6 py-2.5 rounded-full uppercase tracking-wider transition-all shadow-lg flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Save & Create Hospital</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Edit Hospital Profile Modal */}
      {editHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 border border-indigo-100 max-h-[90vh] overflow-y-auto text-gray-900">
            <button
              onClick={() => setEditHospital(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-gray-100 pb-4 flex items-center justify-between pr-8">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center space-x-2">
                  <Edit3 className="w-5 h-5 text-indigo-600" />
                  <span>Edit Hospital Profile — {editHospital.name}</span>
                </h2>
                <p className="text-xs text-gray-500">Modify hospital credentials, branding photos, address, badges, and lead balance.</p>
              </div>
              <span className="text-xs font-mono text-gray-400 bg-gray-100 px-3 py-1 rounded-full">ID: #{editHospital.id}</span>
            </div>

            {editSuccessMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">{editSuccessMessage}</span>
              </div>
            )}

            {editFormError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-2xl flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="font-semibold">{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditHospital} className="space-y-6">
              {/* Section 1: Basic Info & Credentials */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 border-b border-gray-100 pb-2">
                  1. Basic Information & Account Credentials
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hospital Name *</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Login Email *</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Official Phone *</label>
                    <input
                      type="tel"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Website URL</label>
                    <input
                      type="url"
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Leads Balance</label>
                    <input
                      type="number"
                      value={editLeadsRemaining}
                      onChange={(e) => setEditLeadsRemaining(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-pink-50 border border-pink-200 text-pink-700 font-extrabold rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Approval Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="APPROVED">APPROVED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Account Status</label>
                    <select
                      value={editAccountStatus}
                      onChange={(e) => setEditAccountStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Location & Map Address */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 border-b border-gray-100 pb-2">
                  2. Location & Street Address
                </h4>

                <div className="p-4 bg-slate-50 border border-gray-200 rounded-2xl">
                  <GoogleAddressMapPicker
                    initialAddress={editAddress}
                    initialCity={editCity}
                    initialState={editState}
                    onAddressSelect={handleEditGoogleAddressSelected}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">State *</label>
                    <select
                      required
                      value={editState}
                      onChange={(e) => handleEditStateChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      {statesList.map((st: StateItem) => (
                        <option key={st.id} value={st.name}>
                          {st.name} ({st.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City *</label>
                    {editCityOptions.length > 0 ? (
                      <select
                        required
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                      >
                        {editCityOptions.map((cityName) => (
                          <option key={cityName} value={cityName}>
                            {cityName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        placeholder="Enter City"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">District / Region</label>
                    <input
                      type="text"
                      value={editDistrict}
                      onChange={(e) => setEditDistrict(e.target.value)}
                      placeholder="e.g. Central District"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Address *</label>
                  <textarea
                    rows={2}
                    required
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Full street address..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 resize-none"
                  />
                </div>
              </div>

              {/* Section 3: Branding & Photos */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 border-b border-gray-100 pb-2">
                  3. Branding Images & Photos
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Logo Upload */}
                  <div className="p-4 border border-gray-200 rounded-2xl space-y-3 bg-gray-50/50">
                    <label className="block text-xs font-bold text-gray-700 uppercase">Hospital Logo</label>
                    {editLogo ? (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 bg-white">
                        <img src={editLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                        <button
                          type="button"
                          onClick={() => setEditLogo('')}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full text-xs"
                          title="Remove Logo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                        <Building2 className="w-8 h-8" />
                      </div>
                    )}
                    <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer shadow-2xs">
                      {uploadingTarget === 'logo' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Upload className="w-3.5 h-3.5 text-indigo-600" />}
                      <span>Upload Logo Photo</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, 'logo')} className="hidden" />
                    </label>
                  </div>

                  {/* Cover Image Upload */}
                  <div className="p-4 border border-gray-200 rounded-2xl space-y-3 bg-gray-50/50">
                    <label className="block text-xs font-bold text-gray-700 uppercase">Cover Banner Image</label>
                    {editCoverImage ? (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-gray-200 bg-white">
                        <img src={editCoverImage} alt="Cover" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditCoverImage('')}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full text-xs"
                          title="Remove Cover"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                        <span className="text-xs">No Cover Image Uploaded</span>
                      </div>
                    )}
                    <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer shadow-2xs">
                      {uploadingTarget === 'cover' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Upload className="w-3.5 h-3.5 text-indigo-600" />}
                      <span>Upload Cover Image</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, 'cover')} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Gallery Photos */}
                <div className="p-4 border border-gray-200 rounded-2xl space-y-3 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-700 uppercase">Hospital Photo Gallery ({editGallery.length})</label>
                    <label className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-xs">
                      {uploadingTarget === 'gallery' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>Add Photo</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, 'gallery')} className="hidden" />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-1">
                    {editGallery.map((imgUrl, idx) => (
                      <div key={idx} className="relative group h-20 rounded-xl overflow-hidden border border-gray-200 bg-white">
                        <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditGallery(editGallery.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full text-xs opacity-90 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 4: Overview & Description */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 border-b border-gray-100 pb-2">
                  4. Hospital Overview & Medical Description
                </h4>
                <RichTextEditor
                  value={editDescription}
                  onChange={setEditDescription}
                  placeholder="Write detailed hospital overview, specialty departments, and patient care standards..."
                />
              </div>

              {/* Section 5: Trust Badges & Ratings */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 border-b border-gray-100 pb-2">
                  5. Quality Accreditation & Google Ratings
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                  <label className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsNabhAccredited}
                      onChange={(e) => setEditIsNabhAccredited(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-gray-800">NABH Accredited</span>
                  </label>

                  <label className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsVerifiedPartner}
                      onChange={(e) => setEditIsVerifiedPartner(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-gray-800">Verified Partner</span>
                  </label>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Google Rating (1-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={editGoogleRating}
                      onChange={(e) => setEditGoogleRating(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Google Reviews Count</label>
                    <input
                      type="number"
                      value={editGoogleReviewsCount}
                      onChange={(e) => setEditGoogleReviewsCount(e.target.value)}
                      placeholder="e.g. 140"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Contact Representative */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 border-b border-gray-100 pb-2">
                  6. Designated Contact Person
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      value={editContactPersonName}
                      onChange={(e) => setEditContactPersonName(e.target.value)}
                      placeholder="Dr. S. Sharma"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={editContactPersonPhone}
                      onChange={(e) => setEditContactPersonPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={editContactPersonEmail}
                      onChange={(e) => setEditContactPersonEmail(e.target.value)}
                      placeholder="contact@hospital.com"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 7: Patient FAQs */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 border-b border-gray-100 pb-2">
                  7. Patient Frequently Asked Questions (FAQs)
                </h4>

                <div className="space-y-3 p-4 bg-gray-50/70 border border-gray-200 rounded-2xl">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Question</label>
                    <input
                      type="text"
                      value={newEditFaqQ}
                      onChange={(e) => setNewEditFaqQ(e.target.value)}
                      placeholder="e.g. What insurance plans are accepted?"
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Answer</label>
                    <textarea
                      rows={2}
                      value={newEditFaqA}
                      onChange={(e) => setNewEditFaqA(e.target.value)}
                      placeholder="e.g. We accept all major TPA cashless health insurance plans including Star Health, HDFC Ergo, etc."
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleAddEditFaq}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl uppercase tracking-wider cursor-pointer"
                    >
                      + Add FAQ
                    </button>
                  </div>
                </div>

                {editFaqs.length > 0 && (
                  <div className="space-y-2">
                    {editFaqs.map((faq, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-gray-200 rounded-xl space-y-1">
                        <div className="flex items-start justify-between">
                          <h5 className="font-extrabold text-gray-900 text-xs flex-1">{faq.question}</h5>
                          <button
                            type="button"
                            onClick={() => handleRemoveEditFaq(idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove FAQ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditHospital(null)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-6 py-2.5 rounded-full uppercase tracking-wider transition-all shadow-lg flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Hospital Details Modal */}
      {viewHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewHospital(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full ${
                    viewHospital.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : viewHospital.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {viewHospital.status}
                </span>
                <span className="text-xs text-gray-400">ID: #{viewHospital.id} • Registered {new Date(viewHospital.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">{viewHospital.name}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="bg-gray-50 p-4 rounded-2xl space-y-2 border border-gray-100">
                <h4 className="font-extrabold text-xs uppercase text-[#b02151] tracking-wider flex items-center">
                  <Mail className="w-4 h-4 mr-1.5" /> Contact Details
                </h4>
                <p className="text-xs text-gray-700"><strong>Official Email:</strong> {viewHospital.email}</p>
                <p className="text-xs text-gray-700"><strong>Phone Number:</strong> {viewHospital.phone}</p>
                {viewHospital.website && (
                  <p className="text-xs text-gray-700 truncate">
                    <strong>Website:</strong> <a href={viewHospital.website} target="_blank" rel="noreferrer" className="text-pink-600 underline">{viewHospital.website}</a>
                  </p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl space-y-2 border border-gray-100">
                <h4 className="font-extrabold text-xs uppercase text-[#b02151] tracking-wider flex items-center">
                  <MapPin className="w-4 h-4 mr-1.5" /> Location & Address
                </h4>
                <p className="text-xs text-gray-700"><strong>State:</strong> {viewHospital.state}</p>
                <p className="text-xs text-gray-700"><strong>City:</strong> {viewHospital.city}</p>
                <p className="text-xs text-gray-700"><strong>Address:</strong> {viewHospital.address}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl space-y-2 border border-gray-100">
              <h4 className="font-extrabold text-xs uppercase text-[#b02151] tracking-wider flex items-center">
                <FileText className="w-4 h-4 mr-1.5" /> Overview & Description
              </h4>
              <div
                className="text-xs text-gray-700 leading-relaxed font-medium"
                dangerouslySetInnerHTML={{ __html: viewHospital.description || 'No description provided.' }}
              />
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => {
                  const target = viewHospital;
                  setViewHospital(null);
                  handleStartEditHospital(target);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-extrabold transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Full Profile</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewHospital(null)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50"
                >
                  Close
                </button>

                {viewHospital.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => setRejectingId(viewHospital.id)}
                      disabled={actionLoading}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold shadow-md flex items-center space-x-1"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Request</span>
                    </button>

                    <button
                      onClick={() => handleApprove(viewHospital.id)}
                      disabled={actionLoading}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-extrabold shadow-lg flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Grant Access</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete & Clear Data Modal */}
      {deletingHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-red-100">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-gray-900">Delete Hospital & Clear Data</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to permanently delete <strong>{deletingHospital.name}</strong>?
              </p>
            </div>

            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-800 space-y-1">
              <p className="font-extrabold">Warning: Permanent Action</p>
              <p className="text-[11px] leading-relaxed text-red-700">
                This will permanently purge all user credentials, hospital leads, transaction logs, and service linkages associated with this hospital.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingHospital(null)}
                className="px-5 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteHospital}
                disabled={actionLoading}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-full shadow-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete & Clear Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Reject Hospital Registration</h3>
            <p className="text-xs text-gray-600">Please provide a reason for rejecting this hospital application.</p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection (e.g. Invalid medical license or missing verification details)..."
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
              />

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 border border-gray-200 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Doctor Management Modal */}
      {doctorModalHospital && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center space-x-2 text-purple-600 font-bold text-xs uppercase tracking-wider mb-1">
                  <Stethoscope className="w-4 h-4" />
                  <span>Doctor Management</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Doctors for {doctorModalHospital.name}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Add, edit, or remove specialists and doctors associated with this hospital.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleStartAddDoctor}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Doctor</span>
                </button>
                <button
                  onClick={() => setDoctorModalHospital(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Doctors Grid / Empty State */}
            {(!doctorModalHospital.doctors || doctorModalHospital.doctors.length === 0) && !showAddDocModal ? (
              <div className="py-12 text-center bg-purple-50/50 rounded-2xl border border-dashed border-purple-200">
                <User className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-gray-800">No Doctors Added Yet</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Click the &quot;Add Doctor&quot; button above to create doctor profiles for {doctorModalHospital.name}.
                </p>
                <button
                  onClick={handleStartAddDoctor}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-full shadow-sm hover:bg-purple-700"
                >
                  Add First Doctor
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctorModalHospital.doctors?.map((doc, idx) => {
                  const revCount = doc.reviews?.length || 0;
                  const docRating = doc.rating || (revCount > 0 ? (doc.reviews!.reduce((sum, r) => sum + (r.rating || 5), 0) / revCount).toFixed(1) : 5.0);

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between hover:bg-white hover:shadow-md transition-all space-y-3"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 border border-purple-200 flex-shrink-0 flex items-center justify-center">
                          {doc.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-gray-900 truncate">{doc.name}</h4>
                            <div className="flex items-center space-x-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span className="text-[10px] font-black text-amber-800">{docRating}</span>
                            </div>
                          </div>

                          {doc.specialty && (
                            <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 font-bold text-[10px] rounded-full">
                              {doc.specialty}
                            </span>
                          )}
                          {doc.qualification && (
                            <p className="text-xs text-gray-600 truncate">{doc.qualification}</p>
                          )}
                          {doc.experience && (
                            <p className="text-[11px] text-gray-500 font-medium">Exp: {doc.experience}</p>
                          )}
                          {doc.treatments && doc.treatments.length > 0 && (
                            <div className="pt-1 flex flex-wrap gap-1">
                              {doc.treatments.map((tr, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="px-1.5 py-0.5 bg-purple-100 text-purple-800 font-semibold text-[9px] rounded-md"
                                >
                                  {tr}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setViewingReviewsDoc({ doc, docIndex: idx })}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Patient Reviews ({revCount})</span>
                        </button>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleStartEditDoctor(doc, idx)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Doctor"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(idx)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Doctor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Super Admin Patient Reviews Modal Overlay */}
            {viewingReviewsDoc && (
              <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 space-y-5 max-h-[85vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-lg font-extrabold text-gray-900 flex items-center">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500 mr-2" />
                        Patient Reviews for {viewingReviewsDoc.doc.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {viewingReviewsDoc.doc.specialty} • {doctorModalHospital?.name}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewingReviewsDoc(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {viewingReviewsDoc.doc.reviews && viewingReviewsDoc.doc.reviews.length > 0 ? (
                      viewingReviewsDoc.doc.reviews.map((rev, rIdx) => (
                        <div key={rev.id || rIdx} className="p-4 bg-slate-50 border border-gray-200 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-extrabold text-xs flex items-center justify-center">
                                {rev.patientName ? rev.patientName[0].toUpperCase() : 'P'}
                              </div>
                              <div>
                                <span className="font-extrabold text-gray-900 text-xs block">{rev.patientName}</span>
                                <span className="text-[10px] text-gray-400">
                                  {rev.date ? new Date(rev.date).toLocaleDateString() : 'Patient Review'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-0.5">
                                {Array.from({ length: 5 }).map((_, s) => (
                                  <Star
                                    key={s}
                                    className={`w-3.5 h-3.5 ${
                                      s < (rev.rating || 5) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteDoctorReview(rev.id, rIdx)}
                                className="p-1 text-red-500 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                title="Delete Review"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-gray-700 leading-relaxed pl-9">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        No patient reviews recorded yet for {viewingReviewsDoc.doc.name}.
                      </div>
                    )}
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => setViewingReviewsDoc(null)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add / Edit Doctor Sub-Modal Overlay */}
            {showAddDocModal && (
              <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h4 className="text-base font-extrabold text-gray-900 flex items-center space-x-2">
                      <Stethoscope className="w-5 h-5 text-purple-600" />
                      <span>{editingDocIndex !== null ? 'Edit Doctor Profile' : 'Add New Doctor'}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddDocModal(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveDoctor} className="space-y-4">
                    {/* Photo Uploader */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Doctor Photo</label>
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                          {docImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={docImage} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-7 h-7 text-gray-400" />
                          )}
                        </div>
                        <label className="cursor-pointer px-3.5 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5 shadow-xs">
                          {uploadingDocImage ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-purple-600" />
                          )}
                          <span>{uploadingDocImage ? 'Uploading...' : 'Upload Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleDocImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Doctor Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dr. Rajiv Sharma"
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Specialty</label>
                        <input
                          type="text"
                          placeholder="e.g. Cardiologist / Neurologist"
                          value={docSpecialty}
                          onChange={(e) => setDocSpecialty(e.target.value)}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Qualification</label>
                        <input
                          type="text"
                          placeholder="e.g. MBBS, MD, DM (Cardiology)"
                          value={docQualification}
                          onChange={(e) => setDocQualification(e.target.value)}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Experience</label>
                        <input
                          type="text"
                          placeholder="e.g. 15+ Years Experience"
                          value={docExperience}
                          onChange={(e) => setDocExperience(e.target.value)}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Treatments Provided / Procedures (Comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Knee Replacement, Hip Arthroplasty, ACL Surgery"
                        value={docTreatmentsInput}
                        onChange={(e) => setDocTreatmentsInput(e.target.value)}
                        className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:bg-white"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setShowAddDocModal(false)}
                        className="px-4 py-2 border border-gray-200 text-gray-600 rounded-full text-xs font-bold hover:bg-gray-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={docSaving}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {docSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{editingDocIndex !== null ? 'Save Changes' : 'Add Doctor'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setDoctorModalHospital(null)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Hospital Services Management Modal */}
      {serviceModalHospital && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
                  <Activity className="w-4 h-4" />
                  <span>Hospital Services & Pricing</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Services for {serviceModalHospital.name}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Link medical services, update starting prices, procedure details, and toggle active status.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleStartAddService}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Link New Service</span>
                </button>
                <button
                  onClick={() => setServiceModalHospital(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Services Loading State */}
            {loadingServices ? (
              <div className="py-12 text-center text-xs text-gray-500 font-semibold flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                <span>Loading hospital services...</span>
              </div>
            ) : linkedServices.length === 0 && !showAddServiceModal ? (
              <div className="py-12 text-center bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-200">
                <Sparkles className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-gray-800">No Services Linked Yet</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Click the &quot;Link New Service&quot; button above to assign medical specialties and pricing to {serviceModalHospital.name}.
                </p>
                <button
                  onClick={handleStartAddService}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-sm hover:bg-emerald-700"
                >
                  Link First Service
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {linkedServices.map((hs) => (
                  <div
                    key={hs.id}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between space-y-3 hover:bg-white hover:shadow-md transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-900">
                          {hs.service?.name || `Service #${hs.serviceId}`}
                        </h4>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            hs.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {hs.status}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-emerald-700 flex items-center">
                        <DollarSign className="w-3.5 h-3.5 mr-0.5 text-emerald-600" />
                        <span>Starting Price: {hs.startingPrice ? `₹ ${Number(hs.startingPrice).toLocaleString('en-IN')}` : 'Not set'}</span>
                      </div>

                      {hs.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">{hs.description}</p>
                      )}

                      {hs.treatmentDetails && (
                        <p className="text-[11px] text-gray-500 italic line-clamp-2">
                          <strong>Details:</strong> {hs.treatmentDetails}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end space-x-2 border-t border-gray-100 pt-2">
                      <button
                        onClick={() => handleStartEditService(hs)}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteService(hs.serviceId)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Unlink</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add / Edit Service Sub-Modal Overlay */}
            {showAddServiceModal && (
              <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h4 className="text-base font-extrabold text-gray-900 flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-emerald-600" />
                      <span>{editingServiceId !== null ? 'Edit Service Details & Pricing' : 'Link New Specialty Service'}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddServiceModal(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveService} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Select Platform Medical Service *</label>
                        <select
                          value={svcSelectedServiceId}
                          onChange={(e) => setSvcSelectedServiceId(e.target.value)}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        >
                          {platformServices.map((ps) => {
                            const isAlreadyLinked =
                              linkedServices.some((ls) => ls.serviceId === ps.id) &&
                              ps.id !== Number(svcSelectedServiceId);

                            return (
                              <option key={ps.id} value={ps.id} disabled={isAlreadyLinked}>
                                {ps.name} {ps.category ? `(${ps.category})` : ''}{isAlreadyLinked ? ' — Already Added' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Starting Price (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 35000"
                          value={svcStartingPrice}
                          onChange={(e) => setSvcStartingPrice(e.target.value)}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                      <select
                        value={svcStatus}
                        onChange={(e) => setSvcStatus(e.target.value)}
                        className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Service Description</label>
                      <textarea
                        rows={2}
                        placeholder="Short description of clinical procedure or department offerings..."
                        value={svcDescription}
                        onChange={(e) => setSvcDescription(e.target.value)}
                        className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Procedure / Treatment Details</label>
                      <textarea
                        rows={2}
                        placeholder="Comprehensive pre-op evaluation, surgery steps, post-op care, recovery time..."
                        value={svcTreatmentDetails}
                        onChange={(e) => setSvcTreatmentDetails(e.target.value)}
                        className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setShowAddServiceModal(false)}
                        className="px-4 py-2 border border-gray-200 text-gray-600 rounded-full text-xs font-bold hover:bg-gray-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={svcSaving}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {svcSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{editingServiceId !== null ? 'Update Service' : 'Link Service'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setServiceModalHospital(null)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
