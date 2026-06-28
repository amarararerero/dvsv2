<script setup>
import { ref } from 'vue';

const props = defineProps({
    isLoading: Boolean
});

const emit = defineEmits(['confirm']);

const isChecked = ref(false);

const handleConfirm = () => {
    if (isChecked.value) {
        emit('confirm');
    }
};
</script>

<template>
    <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">

        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

        <div class="relative w-full max-w-lg max-h-[90vh] flex flex-col transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-2xl animate-bounce-in">

            <div class="bg-emerald-500 px-6 py-4 flex items-center gap-3">
                <div class="bg-white/20 p-2 rounded-full text-white flex items-center justify-center h-10 w-10">
                    <i class="ph-bold ph-hand-palm text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-white tracking-wide">Voter's Promise</h3>
            </div>

            <div class="p-8 overflow-y-auto">

                <div class="space-y-4 mb-8">
                    <div class="flex gap-3">
                        <i class="ph-fill ph-user text-emerald-500 text-xl mt-1"></i>
                        <p class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            <strong>My Identity:</strong> I confirm this Student ID belongs to me. I am voting for myself.
                        </p>
                    </div>

                    <div class="flex gap-3">
                        <i class="ph-fill ph-database text-blue-500 text-xl mt-1"></i>
                        <p class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            <strong>My Data:</strong> I understand my ID is only used to check if I can vote. My vote choice remains secret.
                        </p>
                    </div>

                    <div class="flex gap-3">
                        <i class="ph-fill ph-shield-warning text-red-500 text-xl mt-1"></i>
                        <p class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            <strong>System Security:</strong> I will not try to hack, break, or manipulate this voting system in any way.
                        </p>
                    </div>

                    <span class="text-slate-300 dark:text-slate-500 text-xs w-full flex justify-center py-2">
                        ~ Remember Allah Is Always Watching You ~
                    </span>
                </div>

                <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-8 transition-colors hover:border-emerald-500/50 cursor-pointer" @click="isChecked = !isChecked">
                    <label class="flex items-center gap-3 cursor-pointer select-none pointer-events-none">
                        <div class="relative flex items-center">
                            <input type="checkbox" :checked="isChecked" class="peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-slate-300 dark:border-slate-600 checked:border-emerald-500 checked:bg-emerald-500 transition-all pointer-events-auto" />
                            <i class="ph-bold ph-check absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 text-sm"></i>
                        </div>
                        <span class="text-sm font-bold text-slate-700 dark:text-white">
                            I agree to these terms.
                        </span>
                    </label>
                </div>

                <div class="flex gap-4">
                    <button @click="handleConfirm" :disabled="!isChecked || isLoading" class="w-full px-4 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2" :class="isChecked && !isLoading ? 'bg-presGold hover:bg-orange-600 shadow-orange-500/20 hover:-translate-y-1 cursor-pointer' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'">
                        <span v-if="isLoading" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                        <span v-else>Confirm & Vote</span>
                        <i v-if="!isLoading" class="ph-bold ph-arrow-right"></i>
                    </button>
                </div>

            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-bounce-in {
  animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.9) translateY(20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
