<script setup>
defineProps(['message']);
</script>

<template>
  <div class="flex flex-col items-center justify-center p-10 text-center animate-fadeIn backdrop-blur-md bg-white/10 dark:bg-slate-900/20 rounded-3xl">
    <div class="w-24 h-24 bg-amber-100 dark:bg-amber-900/40 text-amber-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-amber-500/20 rotate-3">
      <i class="ph-duotone ph-coffee text-5xl"></i>
    </div>

    <h2 class="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">System Nap Time</h2>
    <p class="text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
       The servers are currently taking a quick espresso break. We're either fixing bugs or CyberX accidentally deleted a semicolon.
       <span class="block mt-2 font-medium italic text-amber-600 dark:text-amber-400">We'll be back before your next class!</span>
    </p>

    <div class="mt-8 inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-slate-900/5 dark:bg-slate-800/60 text-slate-500 text-xs font-mono border border-slate-200 dark:border-slate-700">
       <span class="relative flex h-2 w-2">
         <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
         <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
       </span>
       <span>CODE: 503_BRAIN_OVERLOAD</span>
    </div>
  </div>
</template>
