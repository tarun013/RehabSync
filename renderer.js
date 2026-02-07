/**
 * Handles canvas drawing and visual feedback.
 */
export class Renderer {
    constructor(canvasElement, videoElement) {
        this.canvas = canvasElement;
        this.video = videoElement;
        this.ctx = this.canvas.getContext('2d');

        // Use global MediaPipe drawing utils if available
        this.drawingUtils = window; // accessing global drawConnectors etc
    }

    setSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    drawVideo(videoElement) {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    drawLandmarks(results, isGood = true) {
        if (!results.poseLandmarks) return;

        const color = isGood ? '#00FF88' : '#FF0000';

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'source-over';

        if (this.drawingUtils.drawConnectors) {
            this.drawingUtils.drawConnectors(this.ctx, results.poseLandmarks, this.drawingUtils.POSE_CONNECTIONS,
                { color: color, lineWidth: 4 });
        }

        if (this.drawingUtils.drawLandmarks) {
            this.drawingUtils.drawLandmarks(this.ctx, results.poseLandmarks,
                { color: '#FFFFFF', lineWidth: 2, radius: 4 });
        }
        this.ctx.restore();
    }

    drawFeedback(feedbackData) {
        // Draw additional lines or angles based on feedback
        // Example: Draw red line for bad knee angle
        // detailed implementation depends on specific heuristic output
    }
}
