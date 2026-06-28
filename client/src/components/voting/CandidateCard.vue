<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  candidate: Object,
  isSelected: Boolean,
  isDisabled: Boolean
});

const emit = defineEmits(['vote', 'watch-video']);
const isFlipped = ref(false);

watch(() => props.isDisabled, (newVal) => {
  if (newVal) {
    isFlipped.value = false;
  }
});

const resolveImage = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) {
    return url;
  }
  try {
    return new URL(`/src/assets/candidateImage/${url}`, import.meta.url).href;
  } catch (e) {
    console.error("Image resolution failed", e);
    return url;
  }
};
</script>

<template>
  <div class="group w-full perspective-1000 relative">

    <div class="relative w- transition-all duration-700 transform-style-3d shadow-xl rounded-xl bg-white dark:bg-slate-800" :class="[ { 'rotate-y-180': isFlipped }, isSelected ? 'ring-4 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' : '', isDisabled ? 'opacity-60 grayscale-[0.5]' : '' ]">

      <div class="relative w-full backface-hidden rounded-xl overflow-hidden bg-white dark:bg-slate-800">

        <div class="w-full aspect-[4/5] relative overflow-hidden bg-slate-200 dark:bg-slate-700">

           <div v-if="isSelected" class="absolute top-4 right-4 z-20 h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
              <i class="ph-bold ph-check"></i>
           </div>

           <img :src="resolveImage(candidate.photoUrl)" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Candidate Portrait" />
           <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60"></div>

        </div>

        <div class="p-4 flex items-center gap-3 border-t border-slate-100 dark:border-slate-700">

            <button @click.stop="!isDisabled && $emit('vote', candidate._id)" :disabled="isDisabled" class="flex-1 rounded-lg py-2.5 text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2" :class="isSelected ? 'bg-emerald-500 hover:bg-emerald-600' : (isDisabled ? 'bg-slate-300 cursor-not-allowed hidden' : 'bg-presGold hover:bg-orange-500 hover:-translate-y-0.5')">
              <i v-if="isSelected" class="ph-bold ph-check text-lg"></i>
              {{ isSelected ? 'Selected' : 'Vote' }}
            </button>

            <button v-if="isDisabled && !isSelected" class="flex-1 rounded-lg py-2.5 text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed">
              Max Selected
            </button>

            <button v-if="candidate.videoUrl" @click.stop="$emit('watch-video', candidate.videoUrl)" class="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors border-1" title="Watch Campaign Video">
              <i class="ph-fill ph-youtube-logo text-xl"></i>
            </button>

            <button @click.stop="isFlipped = true" class="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title="Read Manifesto">
              <i class="ph-bold ph-read-cv-logo text-xl"></i>
            </button>
        </div>
      </div>

      <div class="absolute inset-0 h-full w-full backface-hidden rotate-y-180 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 flex flex-col shadow-xl overflow-hidden">

        <div class="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{candidate.name}}</span>
            <h4 class="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Manifesto</h4>
          </div>
          <button @click="isFlipped = false" class="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <i class="ph-bold ph-x text-lg text-slate-500 dark:text-slate-400"></i>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto pr-1 text-slate-600 dark:text-slate-300 leading-relaxed text-sm custom-scrollbar">
          <div v-html="candidate.manifesto || 'No manifesto provided.'" class="manifesto-content text-xs space-y-3"></div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.perspective-1000 { perspective: 1000px; }
.transform-style-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
.rotate-y-180 { transform: rotateY(180deg); }

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #475569;
}

.manifesto-content :deep(b),
.manifesto-content :deep(strong) {
  font-weight: 800;
  display: block;
  font-size: 0.875rem;
  color: #0f172a;
}
.dark .manifesto-content :deep(b),
.dark .manifesto-content :deep(strong) {
  color: #ffffff;
}
.manifesto-content :deep(p) {
  font-weight: 700;
  color: #334155;
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
}
.dark .manifesto-content :deep(p) {
  color: #cbd5e1;
}
.manifesto-content :deep(ul) {
  list-style: disc inside !important;
  margin-top: 0.5rem;
  margin-bottom: 0.75rem;
  color: #475569;
  font-size: 0.75rem;
  padding-left: 0.5rem;
}
.dark .manifesto-content :deep(ul) {
  color: #94a3b8;
}
.manifesto-content :deep(li) {
  display: list-item !important;
  list-style-type: disc !important;
  margin-bottom: 0.35rem;
  line-height: 1.4;
  padding-left: 0.25rem;
}
</style>
