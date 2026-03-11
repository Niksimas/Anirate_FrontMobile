import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anirate.app',
  appName: 'Anirate',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
