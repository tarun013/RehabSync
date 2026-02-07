/**
 * Handles webcam interaction and frame serving.
 */
export class Camera {
    constructor(videoElement, options = {}) {
        this.video = videoElement;
        this.onFrame = options.onFrame || (() => { });
        this.width = options.width || 1280;
        this.height = options.height || 720;
        this.fps = 30; // Updated to 30 FPS per user request
        this.frameInterval = 1000 / this.fps;
        this.lastFrameTime = 0;
        this.isActive = false;
        this.animationId = null;
    }

    async start() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: this.width },
                    height: { ideal: this.height }
                },
                audio: false
            });
            this.video.srcObject = stream;

            return new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    this.isActive = true;
                    this.loop();
                    resolve();
                };
            });
        } catch (error) {
            console.error('Error accessing camera:', error);
            throw error;
        }
    }

    stop() {
        this.isActive = false;
        if (this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    loop(timestamp) {
        if (!this.isActive) return;

        this.animationId = requestAnimationFrame(this.loop.bind(this));

        if (!this.lastFrameTime) {
            this.lastFrameTime = timestamp;
        }

        const elapsed = timestamp - this.lastFrameTime;

        if (elapsed >= this.frameInterval) {
            // Adjust for drift
            this.lastFrameTime = timestamp - (elapsed % this.frameInterval);

            if (this.video.readyState >= 2) { // HAVE_CURRENT_DATA
                this.onFrame(this.video);
            }
        }
    }
}
