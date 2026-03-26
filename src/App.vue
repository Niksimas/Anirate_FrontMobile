<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { App } from '@capacitor/app';
import { useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';
import { toastController } from '@ionic/vue';

const router = useRouter();

// Корневые маршруты — на них кнопка назад сворачивает приложение
const rootPaths = new Set([
  '/tabs/profile', '/tabs/search', '/tabs/friends',
  '/login', '/tabs/', '/tabs',
]);

// Все остальные экраны → куда вести "назад"
const staticParents: Record<string, string> = {
  '/tabs/my-anime': '/tabs/profile',
  '/settings': '/tabs/profile',
  '/friends/search': '/tabs/friends',
};

// Определяет родительский маршрут по текущему пути
function getParentRoute(path: string): string {
  if (staticParents[path]) return staticParents[path];

  const ratingsMatch = path.match(/^\/tabs\/lists\/(\d+)\/anime\/\d+\/ratings$/);
  if (ratingsMatch) return `/tabs/lists/${ratingsMatch[1]}`;

  const listSubMatch = path.match(/^\/tabs\/lists\/(\d+)\/(members|add-members)$/);
  if (listSubMatch) return `/tabs/lists/${listSubMatch[1]}`;

  if (/^\/tabs\/lists\/\d+$/.test(path)) return '/tabs/profile';
  if (/^\/anime\/\d+$/.test(path)) return '/tabs/search';
  if (/^\/users\/\d+$/.test(path)) return '/tabs/friends';

  return '/tabs/profile';
}

// Двойное нажатие для сворачивания
let lastBackPress = 0;

onMounted(() => {
  App.addListener('backButton', async () => {
    // If a modal/action-sheet/alert is open, dismiss it first
    const overlay = document.querySelector('ion-modal[is-open="true"], ion-modal.show-modal, ion-action-sheet.show-sheet, ion-alert.show-alert');
    if (overlay) {
      (overlay as HTMLIonModalElement | HTMLIonActionSheetElement | HTMLIonAlertElement).dismiss();
      return;
    }

    const currentPath = router.currentRoute.value.path;

    if (rootPaths.has(currentPath)) {
      const now = Date.now();
      if (now - lastBackPress < 2000) {
        App.minimizeApp();
      } else {
        lastBackPress = now;
        const toast = await toastController.create({
          message: 'Нажмите ещё раз для сворачивания',
          duration: 2000,
          position: 'bottom',
        });
        await toast.present();
      }
    } else {
      const parent = getParentRoute(currentPath);
      router.replace(parent);
    }
  });
});
</script>
