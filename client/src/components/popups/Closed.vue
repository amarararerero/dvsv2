<script setup>
</script>

<template>
  <div class="flex flex-col items-center justify-center p-10 text-center animate-fadeIn backdrop-blur-lg bg-white/5 dark:bg-slate-800/10 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
    <div class="w-20 h-20 bg-red-100 dark:bg-red-500/30 text-slate-400 rounded-full flex items-center justify-center mb-6 ring-3 ring-red-300 dark:ring-red-900/50">
      <i class="ph-fill ph-hourglass-high text-4xl text-red-500 animate-pulse"></i>
    </div>

    <h2 class="text-3xl font-black text-slate-900 dark:text-white mb-2"><i class="ph-fill ph-megaphone text-slate-500"></i> GG! Voting is Over.<i class="ph-fill ph-megaphone text-slate-500"></i></h2>
    <p class="text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
       The digital vote box is officially taped shut. If you didn't vote in time, there's always next year (or just complain in the group chat).
       <br/><br/>
       <span class="font-bold text-slate-800 dark:text-slate-200">Currently we are encounted with a very big mathematical problem, please be patient to know The results will be announced in Annual Grand Meeting event.</span>
     </p>

    <div class="mt-8">
        <div class="px-8 py-4 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-500 font-mono text-sm border border-slate-300 dark:border-slate-700 select-none">
            <i class="ph-bold ph-prohibit"></i> SESSION_TERMINATED
        </div>
    </div>
  </div>
</template>
