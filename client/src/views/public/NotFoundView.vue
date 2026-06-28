<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors px-4 text-center font-mono">

    <div class="mb-8">
      <h1 class="text-9xl font-black text-slate-200 dark:text-slate-800 tracking-tighter select-none">
        404
      </h1>
      <div class="bg-clubGreen/10 dark:bg-clubGreen/20 px-4 py-1.5 rounded-full inline-block mt-[-2rem] relative z-10 backdrop-blur-sm border border-clubGreen/20">
        <span class="text-clubGreen font-bold text-sm uppercase tracking-widest">Page Not Found</span>
      </div>
    </div>

    <h2 class="text-3xl font-bold text-slate-900 dark:text-white mb-4">
      Oops! Looks like you have been lost in da wood yah ?
    </h2>
    <p class="text-slate-600 dark:text-slate-400 max-w-md mb-10 leading-relaxed">
      The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
    </p>

    <RouterLink to="/" class="inline-flex items-center gap-2 bg-presGold text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
      <i class="ph-bold ph-house text-lg"></i>
      Return Home
    </RouterLink>

  </div>
</template>
