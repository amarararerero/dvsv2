<script setup>
import { ref, onMounted, computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import LoginModal from '@/components/shared/LoginModal.vue';
import authStore from '@/stores/auth';

const router = useRouter();
const showLogin = ref(false);
const isMenuOpen = ref(false);

const truncatedName = computed(() => {
  if (!authStore.user || !authStore.user.name) return '';
  const name = authStore.user.name;
  return name.length > 10 ? name.substring(0, 10) + '...' : name;
});

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};

const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  }
});
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-300">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

      <RouterLink to="/" class="flex items-center gap-2 group">
        <img src="@/assets/Logo.png" alt="DiSK Vote Logo" class="h-12 w-auto p-[5px] bg-slate-900 dark:bg-slate-900 rounded-lg object-contain transition-transform duration-500 ease-out group-hover:scale-105 group-hover:drop-shadow-md" />
      </RouterLink>

      <nav class="hidden md:flex items-center gap-8">
        <RouterLink to="/" class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-clubGreen transition-colors">Home</RouterLink>
        <RouterLink to="/about" class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-clubGreen transition-colors">About</RouterLink>
        <RouterLink to="/rules" class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-clubGreen transition-colors">Rules</RouterLink>

        <RouterLink v-if="authStore.user?.role === 'student'" to="/vote" class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-clubGreen transition-colors">
          Dashboard
        </RouterLink>

        <RouterLink v-if="authStore.user?.role === 'admin'" to="/admin" class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-clubGreen transition-colors">
          Dashboard
        </RouterLink>
      </nav>

      <div class="flex items-center gap-3 sm:gap-4">

        <button @click="toggleTheme" class="flex p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors" title="Toggle Theme">
          <i v-if="isDark" class="ph-bold ph-sun text-xl text-yellow-400"></i>
          <i v-else class="ph-bold ph-moon text-xl"></i>
        </button>

        <div v-if="authStore.user" class="flex items-center gap-2 sm:gap-3">
          <span class="text-sm font-bold text-slate-700 dark:text-slate-200 hidden lg:block" :title="authStore.user.name">
            {{ truncatedName }}
          </span>
          <button @click="handleLogout" class="rounded-full bg-slate-100 dark:bg-slate-800 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Logout
          </button>
        </div>

        <button v-else @click="showLogin = true" class="rounded-full bg-presGold px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-amber-200 dark:shadow-none hover:bg-emerald-500 hover:shadow-emerald-200 transition-colors whitespace-nowrap">
          Login
        </button>

        <button @click="isMenuOpen = !isMenuOpen" class="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <i :class="isMenuOpen ? 'ph-bold ph-x' : 'ph-bold ph-list'" class="text-2xl"></i>
        </button>
      </div>
    </div>

    <div v-if="isMenuOpen" class="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-fadeIn">
      <div class="px-4 py-6 space-y-4 flex flex-col">
        <RouterLink @click="isMenuOpen = false" to="/" class="text-base font-bold text-slate-600 dark:text-slate-300 hover:text-clubGreen hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors">Home</RouterLink>
        <RouterLink @click="isMenuOpen = false" to="/about" class="text-base font-bold text-slate-600 dark:text-slate-300 hover:text-clubGreen hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors">About</RouterLink>
        <RouterLink @click="isMenuOpen = false" to="/rules" class="text-base font-bold text-slate-600 dark:text-slate-300 hover:text-clubGreen hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors">Rules</RouterLink>

        <RouterLink v-if="authStore.user?.role === 'student'" @click="isMenuOpen = false" to="/vote" class="text-base font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-lg transition-colors">
          Student Dashboard
        </RouterLink>

        <RouterLink v-if="authStore.user?.role === 'admin'" @click="isMenuOpen = false" to="/admin" class="text-base font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-lg transition-colors">
          Admin Dashboard
        </RouterLink>
      </div>
    </div>
  </header>
  <LoginModal v-if="showLogin" @close="showLogin = false" />
</template>
