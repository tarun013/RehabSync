/**
 * Simple Exponential Weighted Moving Average (EWMA) filter 
 * to smooth landmark coordinates and reduce jitter.
 */
export class LandmarkSmoother {
    constructor(alpha = 0.5) {
        this.alpha = alpha;
        this.previousLandmarks = null;
    }

    smooth(landmarks) {
        if (!landmarks) return null;
        if (!this.previousLandmarks) {
            this.previousLandmarks = landmarks;
            return landmarks;
        }

        const smoothed = landmarks.map((lm, index) => {
            const prev = this.previousLandmarks[index];
            if (!prev) return lm;

            return {
                x: this.alpha * lm.x + (1 - this.alpha) * prev.x,
                y: this.alpha * lm.y + (1 - this.alpha) * prev.y,
                z: this.alpha * (lm.z || 0) + (1 - this.alpha) * (prev.z || 0),
                visibility: lm.visibility // Keep visibility as is
            };
        });

        this.previousLandmarks = smoothed;
        return smoothed;
    }

    reset() {
        this.previousLandmarks = null;
    }
}
