<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import CandidateCard from '@/components/voting/CandidateCard.vue';
import api from '@/services/api';
import authStore from '@/stores/auth';
import Swal from 'sweetalert2';

const router = useRouter();
const candidates = ref([]);
const selectedCandidates = ref([]);
const currentUser = ref(null);
const isLoading = ref(true);

onMounted(async () => {
  if (!authStore.user) {
    authStore.initialize();
  }

  if (!authStore.user) {
     router.push('/');
     return;
  }

  currentUser.value = authStore.user;

  try {
    const status = await api.checkStatus();
    if (status) {
      const now = new Date();
      if (status.maintenance_mode || now < new Date(status.election_start) || now > new Date(status.election_end)) {
        authStore.logout();
        router.push('/');
        return;
      }
    }
    const response = await api.getCandidates();
    candidates.value = response || [];
  } catch (e) {
    candidates.value = [];
  } finally {
    isLoading.value = false;
  }
});

const toggleSelection = (id) => {
  const index = selectedCandidates.value.indexOf(id);

  if (index > -1) {
    selectedCandidates.value.splice(index, 1);
  } else {
    if (selectedCandidates.value.length < 2) {
      selectedCandidates.value.push(id);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Limit Reached',
        text: 'You can only select exactly 2 candidates.',
        timer: 2000,
        showConfirmButton: false
      });
    }
  }
};

const isSelected = (id) => selectedCandidates.value.includes(id);
const isDisabled = (id) => !isSelected(id) && selectedCandidates.value.length >= 2;

const handleWatchVideo = (url) => {
  window.open(url, '_blank');
};

const submitvote = async () => {
  if (selectedCandidates.value.length !== 2) return;

  const result = await Swal.fire({
    title: 'Confirm Vote?',
    text: "You are about to cast your official vote. This cannot be undone.",
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10B981',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Yes, Cast Vote!'
  });

  if (!result.isConfirmed) return;

  let attempt = 1;
  const maxAttempts = 5;
  let apiResult = null;
  let isRetrying = false;

  // Show processing/submitting state initially
  Swal.fire({
    title: 'Casting Vote...',
    html: `
      <div class="flex flex-col items-center justify-center p-2">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"></div>
        <p class="text-sm text-slate-600 dark:text-slate-300 text-center">
          Please wait while we secure and record your vote.
        </p>
      </div>
    `,
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false
  });

  while (attempt <= maxAttempts) {
    try {
      apiResult = await api.vote({
        studentId: currentUser.value.studentId,
        votes: selectedCandidates.value
      });

      if (apiResult.success) {
        break; // Vote cast successfully!
      }

      // If it failed, but is not a database crash (e.g. "You have already voted" or invalid data)
      if (!apiResult.isDbCrash) {
        break; // Stop retrying for non-db-crash issues
      }
    } catch (err) {
      // Treat network exceptions as DB crashes/offline
      apiResult = { success: false, isDbCrash: true, message: err.message };
    }

    if (attempt < maxAttempts) {
      isRetrying = true;
      let countdown = 3 + attempt * 2; // Progressive delay: 5s, 7s, 9s, 11s...
      
      // Update Swal modal to show retry countdown
      Swal.update({
        icon: 'warning',
        title: 'Database Crash Detected!',
        html: `
          <div class="flex flex-col items-center justify-center p-2">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
            <p class="text-sm text-slate-600 dark:text-slate-300 text-center">
              The database crashed or is offline. Retrying to secure your vote automatically.
            </p>
            <p class="mt-4 font-bold text-orange-600 dark:text-orange-400">
              Attempt ${attempt} of ${maxAttempts}... Retrying in ${countdown}s
            </p>
          </div>
        `,
        showConfirmButton: false
      });

      // Countdown loop to update UI every second
      while (countdown > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        countdown--;
        Swal.update({
          html: `
            <div class="flex flex-col items-center justify-center p-2">
              <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
              <p class="text-sm text-slate-600 dark:text-slate-300 text-center">
                The database crashed or is offline. Retrying to secure your vote automatically.
              </p>
              <p class="mt-4 font-bold text-orange-600 dark:text-orange-400">
                Attempt ${attempt} of ${maxAttempts}... Retrying in ${countdown}s
              </p>
            </div>
          `
        });
      }
      attempt++;
    } else {
      break; // Reached max attempts
    }
  }

  if (apiResult && apiResult.success) {
    if (authStore.user) {
        authStore.user.hasVoted = true;
        authStore.saveState();
    }
    if (currentUser.value) currentUser.value.hasVoted = true;

    await Swal.fire({
      icon: 'success',
      title: isRetrying ? 'Vote Saved!' : 'Vote Cast!',
      text: isRetrying ? 'We successfully recovered and cast your vote!' : 'Thank you for voting.',
      timer: 2000,
      showConfirmButton: false
    });

    router.push('/success');
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Voting Failed',
      text: apiResult?.message || "We encountered a database failure and could not cast your vote. Please contact the administrator.",
      confirmButtonText: 'Understood'
    });
  }
};
</script>

<template>
  <div class="flex-1 w-full py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors pb-32">

    <div class="max-w-7xl mx-auto mb-8 text-center">
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Voting Dashboard</h1>
      <p class="mt-2 text-slate-600 dark:text-slate-400">
        You must select <span class="font-bold text-emerald-600 dark:text-emerald-400">exactly 2 candidates</span>.
      </p>

      <div class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
        <span class="text-sm font-medium text-slate-500">Selected:</span>
        <span class="text-lg font-bold" :class="selectedCandidates.length === 2 ? 'text-emerald-500' : 'text-slate-900 dark:text-white'">
          {{ selectedCandidates.length }} / 2
        </span>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>

    <div v-else class="max-w-7xl mx-auto grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      <CandidateCard v-for="candidate in candidates" :key="candidate._id" :candidate="candidate" :is-selected="isSelected(candidate._id)" :is-disabled="isDisabled(candidate._id)" @vote="toggleSelection" @watch-video="handleWatchVideo" />
    </div>

    <div class="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 transition-all duration-500 animate-slideUp" :class="selectedCandidates.length === 2 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'">
      <button @click="submitvote" class="w-full bg-presGold text-white font-bold py-4 rounded-full shadow-xl shadow-orange-500/20 hover:bg-orange-600 hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer">
        <i class="ph-bold ph-paper-plane-right text-xl"></i>
        Submit Official vote
      </button>
    </div>

  </div>
</template>
