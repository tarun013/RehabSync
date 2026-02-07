/**
 * Authentication Service
 */
import { firebaseConfig } from './firebase_config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const AuthService = {
    // Sign Up
    register: async (email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            return { user: userCredential.user, error: null };
        } catch (error) {
            return { user: null, error: error.message };
        }
    },

    // Login
    login: async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { user: userCredential.user, error: null };
        } catch (error) {
            return { user: null, error: error.message };
        }
    },

    // Google Login
    loginWithGoogle: async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return { user: result.user, error: null };
        } catch (error) {
            return { user: null, error: error.message };
        }
    },

    // Logout
    logout: async () => {
        try {
            await signOut(auth);
            return { error: null };
        } catch (error) {
            return { error: error.message };
        }
    },

    // Auth Observer
    observe: (callback) => {
        onAuthStateChanged(auth, (user) => {
            callback(user);
        });
    }
};
