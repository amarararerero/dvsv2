<script setup>
import { RouterLink } from 'vue-router';
import authStore from '@/stores/auth';

defineProps(['formattedTime']);
defineEmits(['open-login']);
</script>

<template>
  <div class="flex flex-col items-center justify-center animate-fadeIn w-full text-center py-10">

      <h1 class="text-5xl font-black tracking-tighter text-slate-900 dark:text-white sm:text-7xl mb-4">
        Don't Let Others <br/>
        <span class="text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400">Choose For You.</span>
      </h1>

      <p class="mt-4 max-w-2xl text-xl leading-relaxed text-slate-600 dark:text-slate-300 pb-10">
        The DiSK President Voting System is live. It's faster than the cafeteria line and 100% more influential.
        Pick your president , change the vibe.
      </p>

    <RouterLink v-if="authStore.user" :to="authStore.user.role === 'admin' ? '/admin' : '/vote'" class="w-full sm:w-auto min-w-[280px] rounded-2xl px-10 py-5 text-xl font-black transition-all duration-500 flex items-center justify-center gap-3 group bg-slate-900 dark:bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20 hover:-translate-y-2 hover:scale-105">
        <i class="ph-bold ph-rocket-launch text-2xl group-hover:animate-bounce"></i>
        <span>Back to the Action</span>
    </RouterLink>

    <button v-else @click="$emit('open-login')" class="w-full sm:w-auto min-w-[280px] rounded-2xl px-10 py-5 text-xl font-black transition-all duration-500 flex items-center justify-center gap-3 group bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-2xl shadow-orange-500/30 hover:-translate-y-2 hover:shadow-orange-500/50">
        <i class="ph-bold ph-fingerprint text-2xl"></i>
        <span>Login & Shake Things Up</span>
    </button>

    <div class="mt-10 flex items-center gap-6 text-slate-400 dark:text-slate-500">
        <div class="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
            <i class="ph-fill ph-shield-check text-emerald-500"></i> Encrypted
        </div>
        <div class="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
            <i class="ph-fill ph-ghost text-purple-500"></i> Anonymous
        </div>
        <div class="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
            <i class="ph-fill ph-student text-blue-500"></i> Students Only
        </div>
    </div>
  </div>
</template>
