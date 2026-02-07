/**
 * AdaptiveThresholdService
 * 
 * Learns user flexibility limits locally.
 * Adjusts exercise thresholds based on moving averages of successful reps.
 */
export class AdaptiveThresholdService {
    constructor(profileId) {
        this.profileId = profileId;
        this.thresholds = this.loadThresholds() || this.getDefaults();
        this.history = {}; // Runtime history for moving average
    }

    getDefaults() {
        return {
            squat: { stand: 160, depth: 100 },
            bicep_curl: { extend: 160, flex: 50 },
            shoulder_press: { start: 60, overhead: 150 },
            push_up: { arm_ext: 160, arm_flex: 90 },
            neck_stretch: { tilt: 25 }
        };
    }

    loadThresholds() {
        if (!this.profileId) return null;
        const data = localStorage.getItem(`rehabsync_thresholds_${this.profileId}`);
        return data ? JSON.parse(data) : null;
    }

    saveThresholds() {
        if (!this.profileId) return;
        localStorage.setItem(`rehabsync_thresholds_${this.profileId}`, JSON.stringify(this.thresholds));
    }

    get(exercise, param) {
        if (this.thresholds[exercise] && this.thresholds[exercise][param]) {
            return this.thresholds[exercise][param];
        }
        return this.getDefaults()[exercise][param];
    }

    getSafetyBounds(exercise) {
        const bounds = {
            squat: { depth: { min: 70, max: 130 } },
            bicep_curl: { flex: { min: 30, max: 70 } },
            shoulder_press: { overhead: { min: 140, max: 175 } },
            push_up: { arm_flex: { min: 70, max: 100 } },
            neck_stretch: { tilt: { min: 15, max: 45 } }
        };
        return bounds[exercise] || {};
    }

    /**
     * Feed back observed metrics to adapt thresholds.
     * @param {string} exercise 
     * @param {string} param - e.g., 'depth'
     * @param {number} value - observed value
     */
    observe(exercise, param, value) {
        if (!this.history[exercise]) this.history[exercise] = {};
        if (!this.history[exercise][param]) this.history[exercise][param] = [];

        const hist = this.history[exercise][param];
        hist.push(value);
        if (hist.length > 5) hist.shift();

        // Need at least 3 reps to adapt
        if (hist.length < 3) return this.thresholds[exercise][param];

        const avg = hist.reduce((a, b) => a + b, 0) / hist.length;
        let current = this.thresholds[exercise][param] || this.getDefaults()[exercise][param];

        // Determine Direction
        // specific per exercise: For Squat/Pushup/Curl, LOWER is harder. For Press, HIGHER is harder.
        // Let's assume generic "Difficulty" maps to "Lower Angle" for most flex-based moves.
        // Squat (depth): Lower is harder.
        // Curl (flex): Lower is harder.
        // Pushup (arm_flex): Lower is harder.
        // Press (overhead): Higher is harder.

        const isLowerHarder = ['squat', 'bicep_curl', 'push_up'].includes(exercise);

        // Check improvement
        let isImproving = false;
        if (isLowerHarder) {
            isImproving = avg < current;
        } else {
            isImproving = avg > current;
        }

        // Asymmetric Adaptation Rate
        // If improving, adapt fast (0.2). If regressing, adapt slow/lazy (0.05).
        const rate = isImproving ? 0.2 : 0.05;

        // Prevent lazy drift: If regressing, only adapt if significantly off (e.g. > 5 degrees)
        if (!isImproving && Math.abs(avg - current) < 5) {
            return current; // Ignore minor laziness
        }

        let target = current + (avg - current) * rate;

        // CLAMPING
        const bounds = this.getSafetyBounds(exercise)[param];
        if (bounds) {
            target = Math.max(bounds.min, Math.min(bounds.max, target));
        }

        // Update
        this.thresholds[exercise][param] = Math.round(target);
        this.saveThresholds();

        return this.thresholds[exercise][param];
    }
}
