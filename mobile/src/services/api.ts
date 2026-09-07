import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// In development:
// - iOS Simulator connects via localhost (http://localhost:3000/api)
// - Android Emulator connects via 10.0.2.2 (http://10.0.2.2:3000/api)
// - Physical device on local WiFi uses machine IP (http://192.168.1.116:3000/api)
// - Production uses https://clinicbychoice.com/api

const LOCAL_IP = '192.168.1.116'; // Your Mac's local network IP

const DEV_API_URL = Platform.select({
  ios: 'http://localhost:3000/api',
  android: 'http://10.0.2.2:3000/api',
  default: `http://${LOCAL_IP}:3000/api`,
});

// Use local dev server by default, or change to production when deploying
export const API_BASE_URL = DEV_API_URL || `http://${LOCAL_IP}:3000/api`;
// export const API_BASE_URL = 'https://clinicbychoice.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach Authorization header if token exists
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Failed to fetch auth token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
