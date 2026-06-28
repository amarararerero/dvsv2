<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import authStore from '@/stores/auth';

const emit = defineEmits(['close', 'login-success']);
const router = useRouter();

const inputId = ref('');
const inputPassword = ref('');
const isAdminMode = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const isElectionEnded = ref(false);
const isElectionNotStarted = ref(false);

watch(inputId, (newVal) => {
  if (newVal.toUpperCase() === 'ADMIN') {
    isAdminMode.value = true;
    errorMessage.value = "";
  } else {
    isAdminMode.value = false;
  }
});

onMounted(async () => {
  try {
    const status = await api.checkStatus();
    if (status) {
      const startDate = new Date(status.election_start);
      const endDate = new Date(status.election_end);
      const now = new Date();

      if (now < startDate) {
        isElectionNotStarted.value = true;
        inputId.value = 'ADMIN';
      }
      else if (now > endDate || status.maintenance_mode) {
        isElectionEnded.value = true;
        inputId.value = 'ADMIN';
      }
    }
  } catch (e) {
    console.error("Status check failed", e);
  }
});

import PledgeModal from '@/components/shared/PledgeModal.vue';

const showPledgeModal = ref(false);
const pledgeLoading = ref(false);
const pendingStudent = ref(null);
const pendingToken = ref('');

const finalizeLogin = (studentData) => {
    if (pendingToken.value) {
        authStore.login(pendingToken.value, { ...studentData, role: 'student' });
    } else if (authStore.user) {
        authStore.login(authStore.token, { ...authStore.user, ...studentData, role: 'student' });
    }

    emit('login-success', { ...studentData, role: 'student' });
    emit('close');
    router.push('/vote');
};

const handlePledgeConfirmed = async () => {
    if (!pendingStudent.value) return;

    pledgeLoading.value = true;
    try {
        const result = await api.acceptPledge(pendingStudent.value.studentId, pendingToken.value);
        if (result.success) {
            pendingStudent.value.acceptPledge = true;
            finalizeLogin(pendingStudent.value);
            showPledgeModal.value = false;
        } else {
            errorMessage.value = "Failed to accept pledge. Please try again.";
            showPledgeModal.value = false;
        }
    } catch (e) {
        errorMessage.value = "System error during pledge.";
    } finally {
        pledgeLoading.value = false;
    }
};

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    if (isAdminMode.value) {
      const response = await api.adminLogin(inputPassword.value);

      if (response.success) {
         const adminUser = { name: 'Administrator', role: 'admin' };
         emit('login-success', adminUser);
         emit('close');
         router.push('/admin');
      } else {
         errorMessage.value = "Invalid Admin Password";
      }
    }
    else {
      if (isElectionEnded.value) {
        errorMessage.value = "Election has ended. Student login is closed.";
        return;
      }

      const response = await api.login(inputId.value);

      if (response.success) {
        const student = response.student;
        pendingToken.value = response.token;

        if (student.acceptPledge) {
             finalizeLogin(student);
        } else {
             pendingStudent.value = student;
             showPledgeModal.value = true;
        }

      } else {
         errorMessage.value = response.message || "Login Failed";
      }
    }
  } catch (err) {
    errorMessage.value = "System Error. Please try again.";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>

  <PledgeModal v-if="showPledgeModal" :is-loading="pledgeLoading" @confirm="handlePledgeConfirmed" />

  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity" v-if="!showPledgeModal">
    <div class="w-full animate-fadeIn max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-slate-900/5 dark:ring-slate-700 transform transition-all">

      <div class=" px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <h3 class="text-lg font-bold text-slate-800 dark:text-white">
          <span v-if="isElectionEnded" class="text-amber-600 dark:text-amber-500">Election Ended</span>
          <span v-else-if="isElectionNotStarted" class="text-amber-600 dark:text-amber-500">Election Not Started</span>
          <span v-else-if="isAdminMode">Administrator Access</span>
          <span v-else>Student Authentication</span>
        </h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-red-500 transition-colors">
          <i class="ph-bold ph-x text-xl"></i>
        </button>
      </div>

      <div class="p-6">
        <p class="text-sm text-slate-600 dark:text-slate-400 mb-5">
          <span v-if="isElectionEnded || isElectionNotStarted">
            Student voting is currently closed. <br>
            <strong>Admin access only</strong> for results and management.
          </span>
          <span v-else>
            {{ isAdminMode ? 'Enter the secure system password.' : 'Enter your unique Student ID.' }}
          </span>
        </p>

        <div class="mb-4">
          <label class="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
            {{ isAdminMode ? 'System User' : 'Student ID' }}
          </label>
          <input v-model="inputId" type="text" placeholder="e.g. STU001" :disabled="isElectionEnded || isElectionNotStarted" class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none uppercase placeholder:normal-case disabled:opacity-60 disabled:cursor-not-allowed" @keyup.enter="!isAdminMode && handleLogin()" />
        </div>

        <div class="mb-4" :class="isAdminMode ? 'block animate-fadeIn' : 'hidden'">
          <label class="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Password</label>
          <input v-model="inputPassword" type="password" placeholder="••••••••" class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" @keyup.enter="handleLogin" />
        </div>

        <div v-if="errorMessage" class="mb-4 flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
          <i class="ph-fill ph-warning-circle text-lg"></i> {{ errorMessage }}
        </div>

        <button @click="handleLogin" :disabled="isLoading || !inputId" class="w-full flex justify-center items-center gap-2 rounded-lg py-3 font-bold text-white transition-all disabled:opacity-50" :class="isAdminMode ? 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600' : 'bg-amber-500 hover:bg-orange-600'">
          <span v-if="isLoading" class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          <span v-else>{{ isAdminMode ? 'Access Dashboard' : 'Authenticate' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
</style>
