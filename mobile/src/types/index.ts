export interface DoctorReview {
  id?: string;
  patientName: string;
  rating: number;
  comment: string;
  date?: string;
}

export interface Doctor {
  id: number | string;
  name: string;
  qualification?: string;
  specialty?: string;
  department?: string;
  experience?: string;
  about?: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  showOnHomepage?: boolean;
  procedures?: string[];
  reviews?: DoctorReview[];
}

export interface FAQ {
  id?: number | string;
  question: string;
  answer: string;
}

export interface HospitalServiceItem {
  id?: number | string;
  serviceId?: number | string;
  service?: {
    id?: number | string;
    name: string;
    slug?: string;
    description?: string;
  };
  startingPrice?: number | string;
  description?: string;
  treatmentDetails?: string;
  subServices?: string;
}

export interface Treatment {
  id: string | number;
  name: string;
  description: string;
  estimatedCost?: string;
  recoveryTime?: string;
  serviceCategory?: string;
}

export interface Hospital {
  _id?: string;
  id: string | number;
  name: string;
  slug?: string;
  location?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  rating: number;
  reviewCount?: number;
  isVerified?: boolean;
  logo?: string;
  image?: string;
  specialties: string[];
  description?: string;
  doctors?: Doctor[];
  facilities?: string[];
  faqs?: FAQ[];
  gallery?: string[];
  treatments?: Treatment[];
  hospitalServices?: HospitalServiceItem[];
  accreditations?: string[];
  experienceYears?: number;
  googleReviews?: any[];
  googleRating?: number;
  googlePlaceId?: string;
  googleReviewsCount?: number;
}

export interface Service {
  _id?: string;
  id: string | number;
  name: string;
  slug?: string;
  category?: string;
  description?: string;
  icon?: string;
  image?: string;
  priceRange?: string;
  subServices?: string[];
  popularTreatments?: string[];
}

export type LeadStatus =
  | 'Request Received'
  | 'Submitted'
  | 'Contacted'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export interface PatientLead {
  id: string;
  serviceName: string;
  treatmentName?: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientAge: string;
  patientGender: string;
  preferredHospitalName: string;
  preferredContactTime: string;
  additionalMessage?: string;
  status: LeadStatus;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'status_update' | 'view_update' | 'general';
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  city: string;
  avatarUrl?: string;
}

export interface HospitalRegistrationForm {
  hospitalName: string;
  hospitalType: string;
  address: string;
  city: string;
  state: string;
  contactNumber: string;
  email: string;
  website: string;
  selectedSpecialties: string[];
  selectedFacilities: string[];
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  documentUploaded?: boolean;
}

export interface PlaceSuggestion {
  place_id: number | string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state_district?: string;
    city_district?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
    postcode?: string;
  };
}

