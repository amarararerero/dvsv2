import axios from 'axios';
import CryptoJS from 'crypto-js';
import authStore from '@/stores/auth';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

const apiClient = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  const token = authStore.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

apiClient.interceptors.response.use(response => {
  if (response.data && response.data.payload) {
    try {
      const bytes = CryptoJS.AES.decrypt(response.data.payload, ENCRYPTION_KEY);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      response.data = JSON.parse(originalText);
    } catch (e) {
      console.error("Decryption Failed:", e);
    }
  }
  return response;
}, error => {
  if (error.response) {
    if (error.response.data && error.response.data.payload) {
      try {
        const bytes = CryptoJS.AES.decrypt(error.response.data.payload, ENCRYPTION_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        error.response.data = JSON.parse(originalText);
      } catch (e) {
      }
    }

    if (error.response.status === 401 || error.response.status === 403) {
      window.location.href = '/warning';
    } else if (error.response.status === 503) {
      authStore.logout();
      window.location.href = '/';
    }
  }
  return Promise.reject(error);
});

export default {

  async checkStatus() {
    try {
      const response = await apiClient.get('/api/status');
      return response.data;
    } catch (error) {
      console.error("Status check failed", error);
      return null;
    }
  },

  async login(studentId) {
    try {
      const response = await apiClient.post('/auth', { studentId });
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Login failed" };
    }
  },

  async acceptPledge(studentId, token = null) {
    try {
      const config = {};
      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }
      const response = await apiClient.post('/api/pledge', { studentId }, config);
      return response.data;
    } catch (error) {
      return { success: false, message: "Failed to accept pledge" };
    }
  },

  async getCandidates() {
    try {
      const response = await apiClient.get('/api/candidates');
      return response.data;
    } catch (error) {
      console.error("Failed to fetch candidates", error);
      return [];
    }
  },

  async vote(voteData) {
    try {
      const response = await apiClient.post('/api/vote', voteData);
      return response.data;
    } catch (error) {
      const isDbCrash = !error.response || error.response.status >= 500 || error.response.data?.isDbCrash;
      return { 
        success: false, 
        message: error.response?.data?.message || "Voting failed due to connection error.",
        isDbCrash: !!isDbCrash
      };
    }
  },

  async adminLogin(password) {
    try {
      const response = await apiClient.post('/api/auth/admin-login', { password });
      if (response.data.success && response.data.token) {
        authStore.login(response.data.token, { role: 'admin' });
      }
      return response.data;
    } catch (error) {
      return { success: false, message: "Invalid Password" };
    }
  },

  async getStats() {
    try {
      const response = await apiClient.get('/api/admin/stats');
      return response.data;
    } catch (error) {
      return null;
    }
  },

  async getTurnout() {
    try {
      const response = await apiClient.get('/api/admin/turnout');
      return response.data;
    } catch (error) {
      return null;
    }
  },

  async getStudents(semester, hasVoted = null) {
    try {
      const params = {};
      if (semester) params.semester = semester;
      if (hasVoted !== null) params.hasVoted = hasVoted;
      const response = await apiClient.get('/api/admin/students', { params });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch students", error);
      return [];
    }
  },

  async importStudentsBulk(students) {
    try {
      const response = await apiClient.post('/api/admin/students/bulk', { students });
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Bulk import failed" };
    }
  },

  async updateSettings(settings) {
    try {
      const response = await apiClient.put('/api/admin/settings', settings);
      return response.data;
    } catch (error) {
      return { success: false };
    }
  },

  async resetSystem() {
    try {
      const response = await apiClient.post('/api/admin/reset');
      return response.data;
    } catch (error) {
      return { success: false };
    }
  },

  async importCandidatesBulk(candidates) {
    try {
      const response = await apiClient.post('/api/admin/candidates/bulk', { candidates });
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Candidates bulk import failed" };
    }
  },

  async factoryResetSystem() {
    try {
      const response = await apiClient.post('/api/admin/factory-reset');
      return response.data;
    } catch (error) {
      return { success: false, message: "Factory Reset Failed" };
    }
  }
};
