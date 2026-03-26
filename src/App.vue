<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { App } from '@capacitor/app';
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

const router = useRouter();

// Корневые маршруты — на них кнопка назад закрывает приложение
// Только настоящие корневые табы — назад закрывает приложение
const rootPaths = new Set([
  '/tabs/profile', '/tabs/search', '/tabs/friends',
  '/login', '/tabs/', '/tabs',
]);

// Все остальные экраны → куда вести "назад"
const staticParents: Record<string, string> = {
  '/tabs/my-anime': '/tabs/profile',
  '/tabs/lists': '/tabs/profile',
  '/settings': '/tabs/profile',
  '/friends/search': '/tabs/friends',
};

// Определяет родительский маршрут по текущему пути
function getParentRoute(path: string): string {
  // Статические маршруты
  if (staticParents[path]) return staticParents[path];

  // /tabs/lists/:id/anime/:animeId/ratings → /tabs/lists/:id
  const ratingsMatch = path.match(/^\/tabs\/lists\/(\d+)\/anime\/\d+\/ratings$/);
  if (ratingsMatch) return `/tabs/lists/${ratingsMatch[1]}`;

  // /tabs/lists/:id/members → /tabs/lists/:id
  // /tabs/lists/:id/add-members → /tabs/lists/:id
  const listSubMatch = path.match(/^\/tabs\/lists\/(\d+)\/(members|add-members)$/);
  if (listSubMatch) return `/tabs/lists/${listSubMatch[1]}`;

  // /tabs/lists/:id → /tabs/lists
  if (/^\/tabs\/lists\/\d+$/.test(path)) return '/tabs/lists';

  // /anime/:id → /tabs/search
  if (/^\/anime\/\d+$/.test(path)) return '/tabs/search';

  // /users/:id → /tabs/friends
  if (/^\/users\/\d+$/.test(path)) return '/tabs/friends';

  // Fallback — главная
  return '/tabs/profile';
}

onMounted(() => {
  App.addListener('backButton', () => {
    const currentPath = router.currentRoute.value.path;

    if (rootPaths.has(currentPath)) {
      App.exitApp();
    } else {
      const parent = getParentRoute(currentPath);
      router.replace(parent);
    }
  });
});
</script>
