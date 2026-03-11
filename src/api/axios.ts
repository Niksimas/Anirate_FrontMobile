import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

// 10.0.2.2 — стандартный адрес хоста ПК из Android-эмулятора (AVD)
export const BASE_URL = 'http://10.0.2.2:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const { value } = await Preferences.get({ key: 'access_token' });
  if (value) {
    config.headers.Authorization = `Bearer ${value}`;
  }
  return config;
});
