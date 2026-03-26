import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { IonicVue } from '@ionic/vue';
import { setupRefreshInterceptor } from '@/api/interceptors';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Dark mode — always dark, regardless of system theme */
import '@ionic/vue/css/palettes/dark.always.css';

/* Theme variables */
import './theme/variables.css';

const pinia = createPinia();
const app = createApp(App).use(IonicVue).use(pinia).use(router);

// Setup token refresh interceptor — redirect to login on refresh failure
setupRefreshInterceptor(() => {
  router.replace('/login');
});

router.isReady().then(() => {
  app.mount('#app');
});
