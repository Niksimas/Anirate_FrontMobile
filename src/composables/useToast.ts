import { toastController } from '@ionic/vue';

export function useToast() {
  async function showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' | 'primary' = 'primary',
    duration = 2500
  ) {
    const toast = await toastController.create({
      message,
      duration,
      color,
      position: 'top',
      buttons: [{ role: 'cancel', icon: 'close' }],
    });
    await toast.present();
  }

  return { showToast };
}
