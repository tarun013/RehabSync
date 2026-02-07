export class PersonalizationEngine {
    constructor(profileId) {
        this.profileId = profileId;
        this.exercise = 'squat'; // Currently only supports squat
        this.calibrationReps = 5;
        this.history = []; // Stores depths of calibration reps
        this.state = 'CALIBRATING'; // CALIBRATING | ACTIVE
        this.calibratedThreshold = null;

        // Load saved threshold if available
        this.loadThreshold();
    }

    reset() {
        this.history = [];
        this.state = 'CALIBRATING'; // Always re-calibrate per session? Or only if not saved?
        // Requirement: "State A: Calibration (Reps 1-5)". Implies every session starts with calibration?
        // "Save this value to localStorage key user_squat_threshold."
        // If we save it, we probably load it.
        // However, the prompt implies a flow: Reps 1-5 -> Calibration -> Active.
        // Let's assume we re-calibrate every session for "Flexibility Analysis" unless we implement a dedicated "Calibration Mode".
        // But re-reading: "State A: Calibration (Reps 1-5)" suggests it happens at the start of the exercise.
        // Let's stick to the prompt: Reps 1-5 are calibration.
        // If we already have a saved threshold, maybe we use it as a baseline but still calibrate for *this* session?
        // Or maybe we skip calibration if saved? 
        // "Update the UI status text to: 'Analyzing Flexibility: Rep [x]/5'" strongly suggests we do it now.
        // I will implement it such that we calibrate every time we start the exercise in this "mode".
        // To be safe, I'll allow loading, but `reset` will clear it for the current session to force the flow.
    }

    loadThreshold() {
        if (!this.profileId) return;
        const saved = localStorage.getItem(`squat_threshold_${this.profileId}`);
        if (saved) {
            this.calibratedThreshold = parseFloat(saved);
        }
    }

    saveThreshold(value) {
        if (!this.profileId) return;
        localStorage.setItem(`squat_threshold_${this.profileId}`, value);
    }

    // Called when a rep is completed (or bottom is reached)
    // Actually, we need to track the *minimum angle* achieved during the rep.
    // The FSM tracks "bottom" state.

    // We need to receive the "min depth" of the current rep.
    addCalibrationData(minDepthAngle) {
        if (this.state !== 'CALIBRATING') return;

        console.log(`[Personalization] Recorded rep ${this.history.length + 1} depth: ${Math.round(minDepthAngle)}°`);
        this.history.push(minDepthAngle);

        if (this.history.length >= this.calibrationReps) {
            this.finalizeCalibration();
        }
    }

    finalizeCalibration() {
        // Sort ascending
        const sorted = [...this.history].sort((a, b) => a - b);
        // Take best 3 (lowest angles = deepest squats). 
        // "lowest 3 angles ... to exclude outliers" (assuming outliers are "not deep enough" reps?)
        // Actually, normally outliers in flexibility are the "too deep" ones (falling) or "too high" (lazy).
        // If we want "true flexibility", we want the lowest angles.
        // If we want to exclude "outliers" (e.g. 0 degrees error), we might want to trim extremes.
        // Prompt says: "Calculate the average of the lowest 3 angles".
        // So we take the 3 smallest values.

        const best3 = sorted.slice(0, 3);
        const avg = best3.reduce((a, b) => a + b, 0) / best3.length;

        // "Set the new SquatTargetAngle to (UserAverage - 10 degrees). Logic: Challenge them."
        this.calibratedThreshold = Math.round(avg - 10);

        // Safety clamps?
        // If avg is 50 (ass to grass), target 40 might be impossible/unsafe. 
        // If avg is 120 (quarter squat), target 110 is good.
        // Let's verify bounds later if needed.

        this.saveThreshold(this.calibratedThreshold);
        this.state = 'ACTIVE';
        console.log(`[Personalization] Calibration Complete. Avg: ${Math.round(avg)}, Target: ${this.calibratedThreshold}`);
    }

    isCalibrating() {
        return this.state === 'CALIBRATING';
    }

    getThreshold() {
        if (this.state === 'ACTIVE' && this.calibratedThreshold !== null) {
            return this.calibratedThreshold;
        }
        return 100; // Default generic threshold
    }

    getProgress() {
        return {
            reps: this.history.length,
            target: this.calibrationReps,
            state: this.state
        };
    }
}
