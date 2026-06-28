import { reactive } from 'vue';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;
const STORAGE_KEY = 'itsNotThatEasy';

const state = reactive({
    user: null,
    token: null,
    isAuthenticated: false
});

const encryptData = (data) => {
    try {
        return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
    } catch (e) {
        console.error("Encryption Failed", e);
        return null;
    }
};

const decryptData = (ciphertext) => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(originalText);
    } catch (e) {
        console.error("Decryption Failed", e);
        return null;
    }
};

const authStore = {
    get user() { return state.user; },
    get token() { return state.token; },
    get isAuthenticated() { return state.isAuthenticated; },
    get isAdmin() { return state.user?.role === 'admin'; },

    initialize() {
        const encryptedData = localStorage.getItem(STORAGE_KEY);
        if (encryptedData) {
            const decrypted = decryptData(encryptedData);
            if (decrypted) {
                state.user = decrypted.user;
                state.token = decrypted.token;
                state.isAuthenticated = true;
            }
        }
    },

    login(token, userData) {
        state.token = token;
        state.user = userData;
        state.isAuthenticated = true;
        this.saveState();
    },

    logout() {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('token');
        localStorage.removeItem('student_data');
    },

    saveState() {
        const dataToSave = {
            user: state.user,
            token: state.token
        };
        const encrypted = encryptData(dataToSave);
        if (encrypted) {
            localStorage.setItem(STORAGE_KEY, encrypted);
            localStorage.removeItem('token');
        }
    }
};

export default authStore;
