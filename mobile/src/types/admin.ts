export interface AdminStats {
  totalHospitals: number;
  pendingHospitals: number;
  approvedHospitals: number;
  totalLeads: number;
  totalRevenue: number;
  activePackagesCount: number;
  activeServicesCount: number;
}

export interface AdminDashboardData {
  stats: AdminStats;
  recentLeads: Array<{
    id: number | string;
    patientName: string;
    phone?: string;
    email?: string;
    status: string;
    createdAt: string;
    hospital?: { name: string; city?: string };
    service?: { name: string };
  }>;
  recentPayments: Array<{
    id: number | string;
    amount: number;
    status: string;
    createdAt: string;
    hospital?: { name: string };
  }>;
}

export interface AdminDoctorReview {
  id?: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface AdminDoctorItem {
  name: string;
  qualification?: string;
  specialty?: string;
  experience?: string;
  image?: string;
  about?: string;
  showOnHomepage?: boolean;
  treatments?: string[];
  reviews?: AdminDoctorReview[];
  rating?: number;
}

export interface AdminHospitalItem {
  id: number | string;
  name: string;
  slug?: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  district?: string;
  address?: string;
  website?: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  accountStatus: 'ACTIVE' | 'INACTIVE';
  leadsRemaining: number;
  totalLeadsPurchased?: number;
  totalLeadsUsed?: number;
  rating?: number;
  googleRating?: number;
  googleReviewsCount?: number;
  isVerifiedPartner?: boolean;
  isNabhAccredited?: boolean;
  doctors?: AdminDoctorItem[];
  createdAt?: string;
}

export interface AdminUserItem {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'HOSPITAL' | 'PATIENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  city?: string;
  state?: string;
  address?: string;
  pincode?: string;
  hospitalId?: number | string;
  hospital?: { id?: number; name: string; city?: string; state?: string; phone?: string; email?: string };
  leadCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminUserStats {
  totalEnquiries: number;
  totalHospitalsContacted: number;
  activeEnquiries: number;
  convertedEnquiries: number;
}

export interface AdminUserLeadItem {
  id: number;
  userId: number;
  patientName: string;
  phone: string;
  email: string;
  city?: string;
  serviceId?: number;
  hospitalId?: number;
  message?: string;
  preferredContactTime?: string;
  status: 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'CONVERTED' | 'CLOSED' | 'UNASSIGNED';
  notes?: Array<{ content: string; author: string; createdAt: string }>;
  createdAt: string;
  updatedAt?: string;
  hospital?: {
    id: number;
    name: string;
    slug?: string;
    city?: string;
    state?: string;
    district?: string;
    address?: string;
    logo?: string;
    coverImage?: string;
    phone?: string;
    email?: string;
    rating?: number;
    isNabhAccredited?: boolean;
    isVerifiedPartner?: boolean;
  };
  service?: {
    id: number;
    name: string;
    slug?: string;
    category?: string;
    image?: string;
    icon?: string;
  };
}

export interface AdminUserHospitalInfo {
  id: number;
  name: string;
  slug?: string;
  city?: string;
  state?: string;
  district?: string;
  address?: string;
  logo?: string;
  coverImage?: string;
  phone?: string;
  email?: string;
  rating?: number;
  isNabhAccredited?: boolean;
  isVerifiedPartner?: boolean;
  enquiryCount?: number;
  lastEnquiryDate?: string;
}

export interface AdminUserDetailResponse {
  success: boolean;
  user: AdminUserItem;
  leads: AdminUserLeadItem[];
  contactedHospitals: AdminUserHospitalInfo[];
  stats: AdminUserStats;
}

export interface AdminPlatformServiceItem {
  id: number | string;
  name: string;
  slug?: string;
  category?: string;
  icon?: string;
  image?: string;
  status?: string;
}

export interface AdminHospitalServiceItem {
  id: number | string;
  hospitalId: number | string;
  serviceId: number | string;
  startingPrice?: number | null;
  description?: string | null;
  treatmentDetails?: string | null;
  subServices?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  service?: AdminPlatformServiceItem;
  createdAt?: string;
  updatedAt?: string;
}

