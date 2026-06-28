<script setup>
defineProps(['formattedTime']);
</script>

<template>
  <div class="flex flex-col items-center justify-center p-10 text-center animate-fadeIn backdrop-blur-lg bg-white/10 dark:bg-slate-900/30 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
    <div class="w-24 h-24 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-blue-500/10 -rotate-6">
      <i class="ph-duotone ph-timer text-5xl animate-pulse"></i>
    </div>

    <h2 class="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
        Patience, Young Voter.
    </h2>

    <p class="text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
       The digital pens are being sharpened and the candidates are still practicing their "trust me" faces in the mirror. Feel free to read through the <RouterLink to="/about" class="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">About Us page</RouterLink> :)
       <br/><br/>
       <span class="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            The gates open at: {{formattedTime}}       </span>
    </p>

    <div class="mt-10 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900/5 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs font-mono border border-slate-200 dark:border-slate-700">
       <span class="relative flex h-3 w-3">
         <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
         <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
       </span>
       <span>STATUS: 403_WAIT_YOUR_TURN</span>
     </div>
  </div>
</template>
