import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

export const BASE_URL = 'http://localhost:8000';

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
