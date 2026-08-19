import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { PatientLead } from '../types';

export interface User {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
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
  savedHospitalIds: string[];
  toggleSaveHospital: (id: string | number) => Promise<void>;
  userEnquiries: PatientLead[];
  addEnquiry: (lead: Omit<PatientLead, 'id' | 'createdAt' | 'status'>) => Promise<PatientLead>;
  updateUser: (updatedFields: Partial<User>) => Promise<void>;
  fetchUserEnquiries: () => Promise<void>;
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

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setTimeout(() => {
          fetchUserEnquiries();
        }, 100);
      } else {
        setUser(null);
        setToken(null);
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

      try {
        const res = await api.post('/auth/login', {
          email: cleanEmail,
          password: pass,
        });

        if (res.data) {
          const userObj: User = {
            id: res.data.user?.id || 'u_' + Date.now(),
            name: res.data.user?.name || cleanEmail.split('@')[0],
            email: res.data.user?.email || cleanEmail,
            role: res.data.user?.role || 'PATIENT',
            phone: res.data.user?.phone || '+91 9876543210',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          };

          const authToken = res.data.token || 'cbc_jwt_token_' + Date.now();

          await AsyncStorage.setItem('user_token', authToken);
          await AsyncStorage.setItem('user_data', JSON.stringify(userObj));

          setToken(authToken);
          setUser(userObj);
          setTimeout(() => {
            fetchUserEnquiries();
          }, 100);
          return { success: true };
        }
      } catch (apiErr: any) {
        console.log('Backend API login error/offline mode:', apiErr?.response?.data || apiErr.message);

        if (cleanEmail && pass.length >= 4) {
          const storedRegisteredUsers = await AsyncStorage.getItem('registered_users');
          let registeredList: any[] = storedRegisteredUsers ? JSON.parse(storedRegisteredUsers) : [];

          const existing = registeredList.find((u) => u.email === cleanEmail);
          const userName = existing ? existing.name : cleanEmail.split('@')[0].toUpperCase();
          const userPhone = existing ? existing.phone : '+91 9876543210';

          const fallbackUser: User = {
            id: existing ? existing.id : 'u_' + Date.now(),
            name: userName,
            email: cleanEmail,
            phone: userPhone,
            role: 'PATIENT',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          };

          const fallbackToken = 'token_' + Date.now();

          await AsyncStorage.setItem('user_token', fallbackToken);
          await AsyncStorage.setItem('user_data', JSON.stringify(fallbackUser));

          setToken(fallbackToken);
          setUser(fallbackUser);
          return { success: true };
        }

        const errMsg = apiErr?.response?.data?.error || 'Invalid email or password.';
        return { success: false, message: errMsg };
      }
    } catch (err: any) {
      return { success: false, message: 'Authentication error.' };
    }

    return { success: false, message: 'Failed to authenticate.' };
  };

  const signup = async (
    name: string,
    email: string,
    pass: string,
    phone: string = ''
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const cleanEmail = email.toLowerCase().trim();

      const userObj: User = {
        id: 'u_' + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim() || '+91 9876543210',
        role: 'PATIENT',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      };

      const authToken = 'token_' + Date.now();

      const storedRegisteredUsers = await AsyncStorage.getItem('registered_users');
      let registeredList: any[] = storedRegisteredUsers ? JSON.parse(storedRegisteredUsers) : [];
      registeredList.push({ id: userObj.id, name: userObj.name, email: userObj.email, phone: userObj.phone, password: pass });
      await AsyncStorage.setItem('registered_users', JSON.stringify(registeredList));

      await AsyncStorage.setItem('user_token', authToken);
      await AsyncStorage.setItem('user_data', JSON.stringify(userObj));

      setToken(authToken);
      setUser(userObj);

      try {
        await api.post('/auth/register', {
          name,
          email: cleanEmail,
          password: pass,
          phone,
        });
      } catch (e) {
        console.log('Backend signup offline/fallback handled locally');
      }

      setTimeout(() => {
        fetchUserEnquiries();
      }, 100);

      return { success: true };
    } catch (e) {
      return { success: false, message: 'Registration failed.' };
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
    if (!user) return;
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
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
        savedHospitalIds,
        toggleSaveHospital,
        userEnquiries,
        addEnquiry,
        updateUser,
        fetchUserEnquiries,
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
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || defaultContext;
};
