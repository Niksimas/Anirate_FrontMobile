import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Preferences } from '@capacitor/preferences';
import { api } from '@/api/axios';
import type { UserResponse, Token } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserResponse | null>(null);
  const isAuthenticated = ref(false);

  async function setTokens(tokens: Token) {
    await Preferences.set({ key: 'access_token', value: tokens.access_token });
    await Preferences.set({ key: 'refresh_token', value: tokens.refresh_token });
    isAuthenticated.value = true;
  }

  async function loadTokens(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'access_token' });
    if (value) {
      isAuthenticated.value = true;
      return true;
    }
    return false;
  }

  async function fetchMe() {
    const { data } = await api.get<UserResponse>('/api/v1/auth/me');
    user.value = data;
    return data;
  }

  async function logout() {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // ignore errors on logout
    }
    await Preferences.remove({ key: 'access_token' });
    await Preferences.remove({ key: 'refresh_token' });
    user.value = null;
    isAuthenticated.value = false;
  }

  return { user, isAuthenticated, setTokens, loadTokens, fetchMe, logout };
});
