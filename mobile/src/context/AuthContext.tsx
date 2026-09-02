import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { PatientLead } from '../types';
import { normalizeImageUrl } from '../utils/imageUrl';

export interface User {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  role?: string;
  avatarUrl?: string;
  avatarScale?: number;
  avatarTranslateX?: number;
  avatarTranslateY?: number;
  avatarRotate?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  location: string;
  setLocation: (loc: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  signup: (name: string, email: string, pass: string, phone?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; message?: string }>;
  savedHospitalIds: string[];
  toggleSaveHospital: (id: string | number) => Promise<void>;
  userEnquiries: PatientLead[];
  addEnquiry: (lead: Omit<PatientLead, 'id' | 'createdAt' | 'status'>) => Promise<PatientLead>;
  updateUser: (updatedFields: Partial<User>) => Promise<void>;
  fetchUserEnquiries: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [location, setLocationState] = useState<string>('Chandigarh');
  const [savedHospitalIds, setSavedHospitalIds] = useState<string[]>([]);
  const [userEnquiries, setUserEnquiries] = useState<PatientLead[]>([]);

  useEffect(() => {
    loadPersistedData();
  }, []);

  const loadPersistedData = async () => {
    try {
      setIsLoading(true);
      const storedToken = await AsyncStorage.getItem('user_token');
      const storedUser = await AsyncStorage.getItem('user_data');
      const storedSaved = await AsyncStorage.getItem('saved_hospitals');
      const storedEnquiries = await AsyncStorage.getItem('user_enquiries');
      const storedLocation = await AsyncStorage.getItem('user_location');

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.avatarUrl) {
            parsed.avatarUrl = normalizeImageUrl(parsed.avatarUrl);
          }
          setUser(parsed);
        } catch (parseErr) {
          console.log('Error parsing stored user data:', parseErr);
        }
      }

      if (storedToken) {
        setToken(storedToken);
        setTimeout(() => {
          fetchUserEnquiries();
          fetchUserProfile();
        }, 100);
      }

      if (storedSaved) {
        setSavedHospitalIds(JSON.parse(storedSaved));
      }

      if (storedEnquiries) {
        setUserEnquiries(JSON.parse(storedEnquiries));
      }

      if (storedLocation) {
        setLocationState(storedLocation);
      }
    } catch (e) {
      console.log('Error loading persisted auth data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/user/profile');
      if (res.data && res.data.user) {
        const u = res.data.user;
        setUser((prev) => {
          const updated: User = {
            ...(prev || {}),
            id: u.id,
            name: u.name || prev?.name || '',
            email: u.email || prev?.email || '',
            phone: u.phone || prev?.phone || '',
            address: u.address || prev?.address || '',
            city: u.city || prev?.city || '',
            state: u.state || prev?.state || '',
            pincode: u.pincode || prev?.pincode || '',
            role: u.role || prev?.role || 'PATIENT',
            avatarUrl: u.avatar ? normalizeImageUrl(u.avatar) : prev?.avatarUrl,
            avatarScale: prev?.avatarScale || 1,
            avatarTranslateX: prev?.avatarTranslateX || 0,
            avatarTranslateY: prev?.avatarTranslateY || 0,
            avatarRotate: prev?.avatarRotate || 0,
          };
          AsyncStorage.setItem('user_data', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.log('Error fetching live user profile:', err);
    }
  };

  const fetchUserEnquiries = async () => {
    try {
      const res = await api.get('/enquiries');
      if (res.data && Array.isArray(res.data.leads)) {
        const mapBackendStatus = (status: string): any => {
          switch (status) {
            case 'NEW': return 'Request Received';
            case 'UNASSIGNED': return 'Submitted';
            case 'CONTACTED': return 'Contacted';
            case 'IN_PROGRESS': return 'In Progress';
            case 'CONVERTED': return 'Completed';
            default: return 'Cancelled';
          }
        };

        const mappedLeads: PatientLead[] = res.data.leads.map((l: any) => ({
          id: `REQ-${l.id}`,
          serviceName: l.service?.name || 'General Health',
          treatmentName: l.message && l.message.includes('Procedure:') ? l.message.split('Procedure: ')[1].split(' |')[0] : (l.message && l.message.includes('Treatment:') ? l.message.split('Treatment: ')[1].split(' |')[0] : ''),
          patientName: l.patientName,
          patientPhone: l.phone,
          patientEmail: l.email,
          patientAge: l.message && l.message.includes('Age:') ? l.message.split('Age: ')[1].split(' |')[0] : '45',
          patientGender: l.message && l.message.includes('Gender:') ? l.message.split('Gender: ')[1].split(' |')[0] : 'Male',
          preferredHospitalName: l.hospital?.name || 'Clinic By Choice',
          preferredContactTime: l.preferredContactTime || 'Anytime',
          additionalMessage: l.message || '',
          status: mapBackendStatus(l.status),
          createdAt: new Date(l.createdAt).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
        }));
        setUserEnquiries(mappedLeads);
        await AsyncStorage.setItem('user_enquiries', JSON.stringify(mappedLeads));
      }
    } catch (e) {
      console.log('Error fetching user enquiries from API:', e);
    }
  };

  const setLocation = async (newLoc: string) => {
    try {
      setLocationState(newLoc);
      await AsyncStorage.setItem('user_location', newLoc);
    } catch (e) {
      console.log('Error setting location:', e);
    }
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const cleanEmail = email.toLowerCase().trim();

      const res = await api.post('/auth/login', {
        email: cleanEmail,
        password: pass,
      });

      if (res.data && res.data.user) {
        const rawAvatar = res.data.user.avatar || res.data.user.avatarUrl;
        const userObj: User = {
          id: res.data.user.id,
          name: res.data.user.name || cleanEmail.split('@')[0],
          email: res.data.user.email || cleanEmail,
          role: res.data.user.role || 'PATIENT',
          phone: res.data.user.phone || '',
          city: res.data.user.city || '',
          avatarUrl: rawAvatar ? normalizeImageUrl(rawAvatar) : undefined,
        };

        const authToken = res.data.token || ('cbc_jwt_token_' + Date.now());

        await AsyncStorage.setItem('user_token', authToken);
        await AsyncStorage.setItem('user_data', JSON.stringify(userObj));

        setToken(authToken);
        setUser(userObj);
        setTimeout(() => {
          fetchUserEnquiries();
          fetchUserProfile();
        }, 100);
        return { success: true };
      } else {
        return { success: false, message: res.data?.error || 'Invalid credentials.' };
      }
    } catch (apiErr: any) {
      console.log('Backend API login error:', apiErr?.response?.data || apiErr.message);
      const errMsg =
        apiErr?.response?.data?.error ||
        apiErr?.response?.data?.message ||
        (apiErr.message?.includes('Network') ? 'Network error: Cannot reach server.' : 'Invalid email or password.');
      return { success: false, message: errMsg };
    }
  };

  const signup = async (
    name: string,
    email: string,
    pass: string,
    phone: string = ''
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const cleanEmail = email.toLowerCase().trim();

      const res = await api.post('/auth/register', {
        name: name.trim(),
        email: cleanEmail,
        password: pass,
        phone: phone.trim(),
      });

      if (res.data && res.data.user) {
        const rawAvatar = res.data.user.avatar || res.data.user.avatarUrl;
        const userObj: User = {
          id: res.data.user.id,
          name: res.data.user.name || name.trim(),
          email: res.data.user.email || cleanEmail,
          phone: res.data.user.phone || phone.trim() || '',
          role: res.data.user.role || 'PATIENT',
          avatarUrl: rawAvatar ? normalizeImageUrl(rawAvatar) : undefined,
        };

        const authToken = res.data.token || ('cbc_jwt_token_' + Date.now());

        await AsyncStorage.setItem('user_token', authToken);
        await AsyncStorage.setItem('user_data', JSON.stringify(userObj));

        setToken(authToken);
        setUser(userObj);

        setTimeout(() => {
          fetchUserEnquiries();
          fetchUserProfile();
        }, 100);

        return { success: true };
      } else {
        return { success: false, message: res.data?.error || 'Registration failed.' };
      }
    } catch (apiErr: any) {
      console.log('Backend API registration error:', apiErr?.response?.data || apiErr.message);
      const errMsg =
        apiErr?.response?.data?.error ||
        apiErr?.response?.data?.message ||
        (apiErr.message?.includes('Network') ? 'Network error: Cannot reach server.' : 'Registration failed.');
      return { success: false, message: errMsg };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user_token');
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('user_enquiries');
      setToken(null);
      setUser(null);
      setUserEnquiries([]);
    } catch (e) {
      console.log('Logout error:', e);
    }
  };

  const deleteAccount = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.delete('/user/profile');
      if (res.data?.success) {
        await logout();
        return { success: true, message: res.data.message || 'Account deleted successfully.' };
      }
      return { success: false, message: res.data?.error || 'Failed to delete account.' };
    } catch (err: any) {
      console.log('Delete account error:', err?.response?.data || err.message);
      const errMsg = err?.response?.data?.error || err?.response?.data?.message || 'Server error while deleting account.';
      return { success: false, message: errMsg };
    }
  };

  const toggleSaveHospital = async (id: string | number) => {
    const strId = String(id);
    let updated: string[];
    if (savedHospitalIds.includes(strId)) {
      updated = savedHospitalIds.filter((item) => item !== strId);
    } else {
      updated = [...savedHospitalIds, strId];
    }
    setSavedHospitalIds(updated);
    await AsyncStorage.setItem('saved_hospitals', JSON.stringify(updated));
  };

  const addEnquiry = async (leadData: Omit<PatientLead, 'id' | 'createdAt' | 'status'>): Promise<PatientLead> => {
    const newLead: PatientLead = {
      ...leadData,
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Request Received',
      createdAt: new Date().toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const updatedList = [newLead, ...userEnquiries];
    setUserEnquiries(updatedList);
    await AsyncStorage.setItem('user_enquiries', JSON.stringify(updatedList));
    return newLead;
  };

  const updateUser = async (updatedFields: Partial<User>) => {
    const baseUser: User = user || {
      id: 'u_' + Date.now(),
      name: 'User',
      email: 'user@clinicbychoice.com',
      role: 'PATIENT',
      phone: '+91 9876543210',
    };
    const updatedUser = { ...baseUser, ...updatedFields };
    if (updatedUser.avatarUrl) {
      updatedUser.avatarUrl = normalizeImageUrl(updatedUser.avatarUrl);
    }
    setUser(updatedUser);
    await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));

    if (token) {
      try {
        await api.put('/user/profile', {
          name: updatedFields.name ?? baseUser.name,
          phone: updatedFields.phone ?? baseUser.phone,
          avatar: updatedFields.avatarUrl ?? baseUser.avatarUrl,
          address: updatedFields.address ?? baseUser.address,
          city: updatedFields.city ?? baseUser.city,
          state: updatedFields.state ?? baseUser.state,
          pincode: updatedFields.pincode ?? baseUser.pincode,
        });
      } catch (err) {
        console.log('Error syncing profile update to backend:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token || !!user,
        isLoading,
        location,
        setLocation,
        login,
        signup,
        logout,
        deleteAccount,
        savedHospitalIds,
        toggleSaveHospital,
        userEnquiries,
        addEnquiry,
        updateUser,
        fetchUserEnquiries,
        fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const defaultContext: AuthContextType = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  location: 'Chandigarh',
  setLocation: async () => {},
  login: async () => ({ success: true }),
  signup: async () => ({ success: true }),
  logout: async () => {},
  deleteAccount: async () => ({ success: true }),
  savedHospitalIds: [],
  toggleSaveHospital: async () => {},
  userEnquiries: [],
  addEnquiry: async (data) => ({
    ...data,
    id: 'REQ-1234',
    status: 'Request Received',
    createdAt: 'Just now',
  }),
  updateUser: async () => {},
  fetchUserEnquiries: async () => {},
  fetchUserProfile: async () => {},
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || defaultContext;
};
