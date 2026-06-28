<script setup>
import { ref, onMounted, computed } from 'vue';
import LoginModal from '@/components/shared/LoginModal.vue';
import api from '@/services/api';

import MaintenancePopup from '@/components/popups/Maintenance.vue';
import OpenPopup from '@/components/popups/Open.vue';
import ClosedPopup from '@/components/popups/Closed.vue';
import NotStartedPopup from '@/components/popups/NotStarted.vue';

const electionTimeStart = ref("");
const showLogin = ref(false);
const isLoading = ref(true);
const systemStatus = ref({ status: 'MAINTENANCE', message: 'Election 2026 is under Maintenance' });

const activePopup = computed(() => {
    switch (systemStatus.value.status) {
        case 'MAINTENANCE': return MaintenancePopup;
        case 'ENDED': return ClosedPopup;
        case 'NOT_STARTED': return NotStartedPopup;
        default: return OpenPopup;
    }
});

onMounted(async () => {
  try {
    const result = await api.checkStatus();
    if (result) {
      const dateObj = new Date(result.election_start);

      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      electionTimeStart.value = `${day}/${month}/${year} ${hours}:${minutes}`;

      if (result.maintenance_mode) {
        systemStatus.value = { status: 'MAINTENANCE', message: 'System Maintenance' };
      } else if (new Date(result.election_end) < new Date()) {
        systemStatus.value = { status: 'ENDED', message: 'Election Ended' };
      } else if (new Date(result.election_start) > new Date()) {
        systemStatus.value = { status: 'NOT_STARTED', message: 'Election Not Started' };
      } else {
        systemStatus.value = { status: 'LIVE', message: 'Election 2026 is Live' };
      }
    }
  } catch (err) {
    console.error("Failed to load status:", err);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex-1 w-full flex flex-col justify-center">
    <div class="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-200 dark:bg-emerald-900 blur-3xl opacity-50"></div>
    <div class="absolute top-1/2 right-[-80px] h-96 w-96 rounded-full bg-orange-300 dark:bg-orange-900 blur-3xl opacity-50"></div>

    <div class="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center sm:py-32 lg:px-8 w-full">

      <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
        <div class="relative flex items-center justify-center">
          <div class="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <div class="absolute w-10 h-10 border-4 border-orange-500/20 border-b-orange-500 rounded-full animate-spin" style="animation-direction: reverse; animation-duration: 1s;"></div>
        </div>
        <p class="mt-6 text-sm font-semibold tracking-widest text-slate-400 dark:text-slate-500 uppercase animate-pulse">
          Please Wait for a second ...
        </p>
      </div>

      <div v-else class="flex flex-col items-center w-full">
        <div class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset transition-colors" :class="systemStatus.status === 'LIVE' ? 'bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-900/30 dark:ring-emerald-800 dark:text-emerald-400' : 'bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400'">
          <span class="relative flex h-2 w-2">
            <span v-if="systemStatus.status === 'LIVE'" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2" :class="systemStatus.status === 'LIVE' ? 'bg-emerald-500' : 'bg-slate-500'"></span>
          </span>
          {{ systemStatus.message }}
        </div>

        <div class="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center items-center w-full">

          <component :is="activePopup" :formattedTime="electionTimeStart" @open-login="showLogin = true" />
        </div>
      </div>
    </div>

    <LoginModal v-if="showLogin" @close="showLogin = false" />
  </div>
</template>
