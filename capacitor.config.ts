import type { CapacitorConfig } from '@capacitor/cli';
import { config as loadEnv } from 'dotenv';

loadEnv();

const config: CapacitorConfig = {
  appId: 'com.anirates.app',
  appName: 'Anirate',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['email', 'profile'],
      androidClientId: process.env.VITE_GOOGLE_ANDROID_CLIENT_ID,
      serverClientId: process.env.VITE_GOOGLE_CLIENT_ID,
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
