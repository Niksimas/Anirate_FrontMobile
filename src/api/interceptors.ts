import { api } from './axios';
import { Preferences } from '@capacitor/preferences';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { Token } from '@/types';

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((item) => {
    if (error) {
      item.reject(error);
    } else {
      item.resolve(token!);
    }
  });
  failedQueue = [];
}

export function setupRefreshInterceptor(onLogout: () => void) {
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { value: refreshToken } = await Preferences.get({ key: 'refresh_token' });
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await api.post<Token>('/api/v1/auth/refresh', {
          refresh_token: refreshToken,
        });

        await Preferences.set({ key: 'access_token', value: data.access_token });
        await Preferences.set({ key: 'refresh_token', value: data.refresh_token });

        api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
        processQueue(null, data.access_token);

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await Preferences.remove({ key: 'access_token' });
        await Preferences.remove({ key: 'refresh_token' });
        onLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
}
