/**
 * Wraps MediaPipe Pose solution.
 */
export class PoseService {
    constructor() {
        // 'Pose' is available globally via the CDN script tag in index.html
        if (typeof window.Pose === 'undefined') {
            console.error('MediaPipe Pose script not loaded.');
            throw new Error('MediaPipe Pose script not loaded');
        }

        this.pose = new window.Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });

        this.pose.setOptions({
            modelComplexity: 1, // 0, 1, or 2. 1 is balanced.
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
    }

    onResults(callback) {
        this.pose.onResults(callback);
    }

    async send(image) {
        await this.pose.send({ image });
    }

    close() {
        this.pose.close();
    }
}
