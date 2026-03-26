<template>
  <ion-page>
    <ion-content class="create-sheet-content">
      <div class="drag-handle-row"><div class="drag-handle" /></div>

      <p class="sheet-title">Новый список</p>

      <div class="field-group">
        <label class="field-label">Название</label>
        <input
          v-model="name"
          class="field-input"
          placeholder="Название списка"
          maxlength="60"
        />
        <span class="field-counter">{{ name.length }}/60</span>
      </div>

      <div class="field-group">
        <label class="field-label">Описание</label>
        <textarea
          v-model="desc"
          class="field-input field-textarea"
          placeholder="Необязательно"
          rows="2"
          maxlength="200"
        />
      </div>

      <div class="sheet-actions">
        <button class="save-btn" :disabled="!name.trim() || saving" @click="create">
          {{ saving ? 'Создаём...' : 'Создать' }}
        </button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { listsApi } from '@/api/lists';
import type { SharedListResponse } from '@/types';

const emit = defineEmits<{
  close: [];
  created: [SharedListResponse];
}>();

const name = ref('');
const desc = ref('');
const saving = ref(false);

async function create() {
  saving.value = true;
  try {
    const { data } = await listsApi.create({
      name: name.value.trim(),
      description: desc.value.trim() || null,
    });
    try { Haptics.impact({ style: ImpactStyle.Light }); } catch { /* */ }
    emit('created', data);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.create-sheet-content {
  --background: #1E1E1E;
  --padding-start: 20px;
  --padding-end: 20px;
  --padding-top: 0;
}

.drag-handle-row {
  display: flex;
  justify-content: center;
  padding: 10px 0 4px;
}

.drag-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
}

.sheet-title {
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 12px 0 20px;
}

.field-group {
  margin-bottom: 16px;
  position: relative;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.field-input {
  width: 100%;
  background: #2D2D3A;
  border: none;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 15px;
  font-family: inherit;
  color: #FFFFFF;
  outline: none;
}

.field-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.field-input:focus {
  box-shadow: 0 0 0 1px rgba(167, 184, 217, 0.4);
}

.field-textarea {
  resize: none;
  line-height: 1.4;
}

.field-counter {
  position: absolute;
  right: 12px;
  bottom: -18px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
}

.sheet-actions {
  margin-top: 24px;
  padding-bottom: env(safe-area-inset-bottom, 8px);
}

.save-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #A7B8D9 0%, #FF9E9E 100%);
  color: #1E1E1E;
  font-size: 16px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.save-btn:active { opacity: 0.85; }
.save-btn:disabled { opacity: 0.4; }
</style>
