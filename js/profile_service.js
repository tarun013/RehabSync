/**
 * Profile Service (LocalStorage)
 * Manages user profiles and workout data locally.
 */

const STORAGE_KEY_PROFILES = 'rehabsync_profiles';
const STORAGE_KEY_SESSIONS = 'rehabsync_sessions';

export const ProfileService = {
    // Get all profiles
    getProfiles: () => {
        const profiles = localStorage.getItem(STORAGE_KEY_PROFILES);
        return profiles ? JSON.parse(profiles) : [];
    },

    // Create a new profile
    createProfile: (name, color = '#00ff88') => {
        const profiles = ProfileService.getProfiles();
        const newProfile = {
            id: 'p_' + Date.now(),
            name: name,
            color: color,
            dailyGoal: 3, // Default goal (exercises)
            joined: new Date().toISOString()
        };
        profiles.push(newProfile);
        localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
        return newProfile;
    },

    // Get a specific profile
    getProfile: (id) => {
        const profiles = ProfileService.getProfiles();
        return profiles.find(p => p.id === id);
    },

    updateGoal: (profileId, newGoal) => {
        const profiles = ProfileService.getProfiles();
        const profile = profiles.find(p => p.id === profileId);
        if (profile) {
            profile.dailyGoal = parseInt(newGoal);
            localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
            return true;
        }
        return false;
    },

    // Save a completed workout session
    saveSession: (profileId, exercise, reps, score) => {
        const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY_SESSIONS) || '[]');
        const newSession = {
            id: 's_' + Date.now(),
            profileId,
            exercise,
            reps,
            score,
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
        };
        sessions.push(newSession);
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
        return true;
    },

    // Get stats for a profile (Today)
    getTodayStats: (profileId) => {
        const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY_SESSIONS) || '[]');
        const today = new Date().toISOString().split('T')[0];

        const todaySessions = sessions.filter(s => s.profileId === profileId && s.date === today);

        let totalReps = 0;
        let exercises = new Set();

        todaySessions.forEach(s => {
            totalReps += s.reps;
            exercises.add(s.exercise);
        });

        // Get profile to find goal
        const profile = ProfileService.getProfile(profileId);
        const goal = profile ? (profile.dailyGoal || 50) : 50;

        return {
            reps: totalReps,
            uniqueExercises: exercises.size,
            sessionCount: todaySessions.length,
            goal: goal
        };
    },

    // Get stats for a profile (All Time / Streak logic)
    getStreak: (profileId) => {
        const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY_SESSIONS) || '[]');
        const today = new Date().toISOString().split('T')[0];

        // Get unique dates for this profile
        const dates = new Set(
            sessions
                .filter(s => s.profileId === profileId)
                .map(s => s.date)
        );

        if (dates.size === 0) return { count: 0, active: false };

        // Check if user worked out today
        const hasToday = dates.has(today);

        // Calculate streak
        let streak = hasToday ? 1 : 0;
        let d = new Date();

        // If not today, check if yesterday exists to keep streak alive
        if (!hasToday) {
            d.setDate(d.getDate() - 1);
            const yesterday = d.toISOString().split('T')[0];
            if (dates.has(yesterday)) {
                streak = 1;
            } else {
                return { count: 0, active: false };
            }
        }

        // Count backwards
        while (true) {
            d.setDate(d.getDate() - 1);
            const dateStr = d.toISOString().split('T')[0];
            if (dates.has(dateStr)) {
                streak++;
            } else {
                break;
            }
        }

        return { count: streak, active: hasToday };
    },

    // Delete profile and all associated data
    deleteProfile: (id) => {
        let profiles = ProfileService.getProfiles();
        profiles = profiles.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));

        // Cleanup sessions
        let sessions = JSON.parse(localStorage.getItem(STORAGE_KEY_SESSIONS) || '[]');
        sessions = sessions.filter(s => s.profileId !== id);
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    }
};
