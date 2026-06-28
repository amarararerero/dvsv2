<script setup>
import { RouterView } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import Footer from '@/components/layout/Footer.vue'
import { onMounted } from 'vue';
import authStore from '@/stores/auth';

onMounted(() => {
  authStore.initialize();
});
</script>

<template>
  <div class="bgg min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">

    <NavBar />

    <main class="min-h-[80vh] flex flex-col">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
  <Footer />
  </div>
</template>

<style>

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
