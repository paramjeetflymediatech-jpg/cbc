import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// In development:
// - Android Emulator uses 10.0.2.2 to refer to host machine's localhost
// - iOS Simulator uses localhost
// - Physical device uses your local IP (e.g. 192.168.x.x)
// const DEV_API_URL = Platform.select({
//   android: 'http://10.0.2.2:3000/api',
//   ios: 'http://localhost:3000/api',
//   default: 'http://localhost:3000/api',
// });

// export const API_BASE_URL = DEV_API_URL;
export const API_BASE_URL = 'https://cbc.socialflymediatech.com/api';

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
