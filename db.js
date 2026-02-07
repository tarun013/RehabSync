/**
 * Database Service (Firestore)
 */
import { db } from './firebase_config.js';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const DbService = {
    // Save a completed workout session
    saveSession: async (userId, exercise, reps, score) => {
        try {
            await addDoc(collection(db, "sessions"), {
                userId,
                exercise,
                reps,
                score,
                timestamp: serverTimestamp(),
                date: new Date().toISOString().split('T')[0] // YYYY-MM-DD for easy filtering
            });
            console.log("Session saved!");
            return true;
        } catch (e) {
            console.error("Error adding document: ", e);
            return false;
        }
    },

    // Get user's recent sessions
    getRecentSessions: async (userId, limitCount = 5) => {
        const q = query(
            collection(db, "sessions"),
            where("userId", "==", userId),
            orderBy("timestamp", "desc"),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const sessions = [];
        querySnapshot.forEach((doc) => {
            sessions.push(doc.data());
        });
        return sessions;
    },

    // Get stats for today
    getTodayStats: async (userId) => {
        const today = new Date().toISOString().split('T')[0];
        const q = query(
            collection(db, "sessions"),
            where("userId", "==", userId),
            where("date", "==", today)
        );

        const querySnapshot = await getDocs(q);
        let totalReps = 0;
        let exercises = new Set();

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            totalReps += data.reps;
            exercises.add(data.exercise);
        });

        return {
            reps: totalReps,
            uniqueExercises: exercises.size,
            sessionCount: querySnapshot.size
        };
    }
};
