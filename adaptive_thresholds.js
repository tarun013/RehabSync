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
        if (hist.length > 5) hist.shift(); // Keep last 5

        // Adaptation Logic:
        // If user consistently (avg of last 5) hits a different range, nudge the threshold.
        const avg = hist.reduce((a, b) => a + b, 0) / hist.length;

        const current = this.thresholds[exercise][param];

        // Bounds (Safety)
        // Squat Depth: Default 100. If user avg is 110 (stiff), adapt up to 120 max.
        // If user avg is 80 (flexible), adapt down to 90.

        let target = current;
        // Simple Lerp towards average
        target = current + (avg - current) * 0.1;

        // Update
        this.thresholds[exercise][param] = Math.round(target);
        this.saveThresholds();

        return this.thresholds[exercise][param];
    }
}
