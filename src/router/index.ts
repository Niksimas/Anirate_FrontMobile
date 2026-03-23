import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { Preferences } from '@capacitor/preferences';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/splash' },

  // Auth flow
  { path: '/splash', component: () => import('@/views/SplashView.vue') },
  { path: '/onboarding', component: () => import('@/views/OnboardingView.vue') },
  { path: '/login', component: () => import('@/views/LoginView.vue') },
  { path: '/setup', component: () => import('@/views/SetupView.vue'), meta: { requiresAuth: true } },

  // Main app (tabs)
  {
    path: '/tabs/',
    component: () => import('@/views/TabsPage.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/tabs/profile' },
      { path: 'search', component: () => import('@/views/SearchView.vue') },
      { path: 'profile', component: () => import('@/views/ProfileView.vue') },
      { path: 'my-anime', component: () => import('@/views/MyAnimeView.vue') },
      { path: 'friends', component: () => import('@/views/FriendsView.vue') },
      // Shared Lists (inside tabs to keep tab bar)
      { path: 'lists', component: () => import('@/views/ListsView.vue') },
      { path: 'lists/:id', component: () => import('@/views/ListDetailView.vue') },
      { path: 'lists/:id/members', component: () => import('@/views/ListMembersView.vue') },
      { path: 'lists/:id/add-members', component: () => import('@/views/ListAddMembersView.vue') },
      { path: 'lists/:id/anime/:animeId/ratings', component: () => import('@/views/ListAnimeRatingsView.vue') },
    ],
  },

  // Anime
  { path: '/anime/:id', component: () => import('@/views/AnimeView.vue'), meta: { requiresAuth: true } },

  // Friends
  { path: '/friends/search', component: () => import('@/views/FriendSearchView.vue'), meta: { requiresAuth: true } },
  { path: '/users/:id', component: () => import('@/views/UserView.vue'), meta: { requiresAuth: true } },

  // Settings
  { path: '/settings', component: () => import('@/views/SettingsView.vue'), meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Navigation guard
router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    const { value } = await Preferences.get({ key: 'access_token' });
    if (!value) {
      return '/login';
    }
  }
});

export default router;
