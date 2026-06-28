<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="bg-slate-900 flex flex-col items-center justify-center min-h-screen p-4 text-center selection:bg-red-500 selection:text-white overflow-hidden relative">

    <div class="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)]"></div>

    <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-red-900/20 blur-[100px]"></div>
        <div class="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-red-900/10 blur-[100px]"></div>
    </div>

    <div class="relative z-10 max-w-lg w-full bg-slate-800/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 shadow-2xl shadow-red-900/20">

        <div class="mb-8 relative inline-flex">
            <div class="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div class="relative bg-gradient-to-b from-red-500 to-red-700 w-24 h-24 rounded-full flex items-center justify-center text-white shadow-inner border border-red-400">
                <i class="ph-fill ph-shield-warning text-5xl"></i>
            </div>
            <div class="absolute -bottom-2 -right-2 bg-slate-900 rounded-full p-1.5 border border-red-500/50">
                <div class="bg-slate-800 rounded-full p-2 text-red-500">
                    <i class="ph-bold ph-lock-key text-xl"></i>
                </div>
            </div>
        </div>

        <h1 class="text-3xl font-black text-white tracking-tight mb-2 uppercase">
            Access Denied
        </h1>
        <p class="text-red-400 font-mono text-sm tracking-widest mb-8 border-y border-red-500/20 py-2 inline-block">
            ERROR CODE: 403_FORBIDDEN
        </p>

        <div class="space-y-4 text-slate-300 mb-8">
            <p class="leading-relaxed">
                <strong class="text-white">System Security Alert:</strong> You do not have the required permissions to access this restricted area.
            </p>
            <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-left flex gap-4">
                <i class="ph-fill ph-warning-octagon text-red-500 text-2xl shrink-0 mt-0.5"></i>
                <div class="space-y-1">
                    <p class="text-red-200 text-sm font-bold">Security Incident Logged</p>
                    <p class="text-red-200/70 text-xs leading-relaxed">
                        This action is unauthorized and has been recorded. Unauthorized attempts are monitored.
                    </p>
                </div>
            </div>
        </div>

        <RouterLink to="/" class="group relative w-full flex items-center justify-center gap-2 bg-white text-slate-900 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-all active:scale-95">
            <i class="ph-bold ph-arrow-u-up-left transition-transform group-hover:-translate-x-1"></i>
            <span>Return to Safety</span>
        </RouterLink>

        <p class="mt-6 text-xs text-slate-500">
            DiSK Voting System v2.0
        </p>

    </div>
  </div>
</template>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
