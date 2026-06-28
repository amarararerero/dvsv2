<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import authStore from '@/stores/auth';

const router = useRouter();
const countdown = ref(5);
let timerInterval = null;

onMounted(() => {
  timerInterval = setInterval(() => {
    countdown.value--;

    if (countdown.value <= 0) {
      handleLogout();
    }
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};
</script>

<template>
  <div class="flex flex-1 w-full flex-col items-center justify-center px-4 text-center py-20 bg-slate-50 dark:bg-slate-900 transition-colors">

    <div class="mb-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 p-6 ring-1 ring-emerald-100 dark:ring-emerald-800 animate-bounce">
      <i class="ph-fill ph-check-circle text-6xl text-clubGreen dark:text-emerald-400"></i>
    </div>

    <h1 class="mb-4 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
      Vote Submitted!
    </h1>
    <p class="mb-8 max-w-lg text-lg text-slate-600 dark:text-slate-400">
      Thank you for participating in the 2026 Election. Your voice has been securely recorded.
    </p>

    <div class="w-full max-w-xs rounded-xl bg-white dark:bg-slate-800 p-6 shadow-lg ring-1 ring-slate-100 dark:ring-slate-700">
      <p class="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Auto-logout in</p>

      <div class="text-4xl font-black text-slate-900 dark:text-white">
        {{ countdown }}<span class="text-lg text-slate-400">s</span>
      </div>

      <div class="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div class="h-full bg-clubGreen transition-all duration-1000 ease-linear" :style="{ width: `${(countdown / 5) * 100}%` }"></div>
      </div>

      <button @click="handleLogout" class="mt-6 w-full rounded-lg bg-slate-100 dark:bg-slate-700 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
        Return to Home Now
      </button>
    </div>

  </div>
</template>
