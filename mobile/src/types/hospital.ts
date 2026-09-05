export interface HospitalProfileData {
  id: number | string;
  name: string;
  slug?: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  city: string;
  district?: string;
  state: string;
  country?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  gallery?: string[];
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  leadsRemaining: number;
  totalLeadsPurchased: number;
  totalLeadsUsed: number;
  status: string;
  isNabhAccredited?: boolean;
  isVerifiedPartner?: boolean;
  rating?: number;
  googleRating?: number;
  googleReviewsCount?: number;
  doctors?: HospitalDoctorItem[];
}

export interface HospitalDoctorItem {
  name: string;
  specialty: string;
  qualification?: string;
  experience?: string;
  image?: string;
  about?: string;
  treatments?: string[];
}

export interface HospitalLeadItem {
  id: number | string;
  hospitalId: number | string;
  serviceId?: number | string;
  patientName: string;
  phone: string;
  email: string;
  city?: string;
  preferredContactTime?: string;
  message?: string;
  status: 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'CONVERTED' | 'CANCELLED' | 'UNASSIGNED' | 'EXPIRED';
  createdAt: string;
  service?: {
    id: number | string;
    name: string;
    slug?: string;
  };
}

export interface HospitalPackageItem {
  id: number | string;
  name: string;
  leadsCount: number;
  price: number;
  pricePerLead?: number;
  description?: string;
  isPopular?: boolean;
}
