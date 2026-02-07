export class VisualGuide {
    constructor(canvas) {
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }

    draw(exercise, state) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Style
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#ffffff';

        const cx = this.width / 2;
        const cy = this.height / 2 + 10;
        const scale = this.height / 3.5;

        // Draw based on exercise
        if (exercise === 'squat') {
            if (state === 'neutral') {
                this.drawBody(cx, cy, 0, 0, 0, scale);
                this.drawArrow(cx + 40, cy - 20, 'down');
            } else if (state === 'bottom') {
                this.drawBody(cx, cy + 20, 70, 110, -30, scale);
                this.drawArrow(cx + 40, cy + 20, 'up');
            } else {
                this.drawBody(cx, cy + 10, 30, 60, -15, scale); // Mid
            }
        }
        else if (exercise === 'bicep_curl') {
            if (state === 'neutral') {
                this.drawBody(cx, cy, 0, 0, 0, scale, { arm: 0 });
                this.drawArrow(cx + 30, cy + 20, 'up-curve');
            } else if (state === 'peak') {
                this.drawBody(cx, cy, 0, 0, 0, scale, { arm: 130 });
                this.drawArrow(cx + 30, cy - 10, 'down-curve');
            } else {
                this.drawBody(cx, cy, 0, 0, 0, scale, { arm: 90 }); // Mid
            }
        }
        else if (exercise === 'shoulder_press') {
            // Front view
            if (state === 'neutral') {
                this.drawFrontBody(cx, cy, scale, { arm: 90 });
                this.drawArrow(cx - 50, cy - 50, 'up');
                this.drawArrow(cx + 50, cy - 50, 'up');
            } else if (state === 'peak') {
                this.drawFrontBody(cx, cy, scale, { arm: 170, raised: true });
                this.drawArrow(cx - 50, cy - 80, 'down');
                this.drawArrow(cx + 50, cy - 80, 'down');
            } else {
                this.drawFrontBody(cx, cy, scale, { arm: 130 });
            }
        }
        else if (exercise === 'push_up') {
            // Plank view
            if (state === 'neutral') {
                this.drawPlank(cx, cy, 0, scale);
                this.drawArrow(cx, cy - 30, 'down');
            } else if (state === 'bottom') {
                this.drawPlank(cx, cy, 90, scale);
                this.drawArrow(cx, cy - 30, 'up');
            } else {
                this.drawPlank(cx, cy, 45, scale);
            }
        }
        else if (exercise === 'neck_stretch') {
            if (state === 'neutral') {
                this.drawFrontBody(cx, cy, scale, { headTilt: 0 });
                this.drawArrow(cx + 30, cy - 80, 'right-curve');
            } else if (state === 'holding') {
                this.drawFrontBody(cx, cy, scale, { headTilt: 25 });
                // Timer icon or something?
                this.ctx.fillStyle = '#00ff88';
                this.ctx.font = '14px sans-serif';
                this.ctx.fillText("HOLD", cx + 30, cy - 60);
            } else {
                this.drawFrontBody(cx, cy, scale, { headTilt: 10 });
            }
        }
    }

    drawArrow(x, y, type) {
        this.ctx.save();
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        if (type === 'up') {
            this.ctx.moveTo(x, y + 20);
            this.ctx.lineTo(x, y - 20);
            this.ctx.lineTo(x - 5, y - 15);
            this.ctx.moveTo(x, y - 20);
            this.ctx.lineTo(x + 5, y - 15);
        } else if (type === 'down') {
            this.ctx.moveTo(x, y - 20);
            this.ctx.lineTo(x, y + 20);
            this.ctx.lineTo(x - 5, y + 15);
            this.ctx.moveTo(x, y + 20);
            this.ctx.lineTo(x + 5, y + 15);
        } else if (type === 'up-curve') {
            this.ctx.arc(x - 10, y, 15, 0, -Math.PI / 2, true);
            // Arrowhead needs math, keep simple
        }

        this.ctx.stroke();
        this.ctx.restore();
    }

    // Standard Side View
    drawBody(x, y, hipA, kneeA, torsoA, s, opts = {}) {
        // Convert deg to rad
        const tr = (torsoA - 90) * Math.PI / 180;
        const hr = (hipA + 90) * Math.PI / 180;
        const kr = (hipA + kneeA + 90) * Math.PI / 180;

        const torsoL = s;
        const thighL = s * 0.9;
        const shinL = s * 0.9;

        // Torso
        const shX = x + Math.cos(tr) * torsoL;
        const shY = y + Math.sin(tr) * torsoL;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(shX, shY);
        this.ctx.stroke();

        // Head
        this.ctx.beginPath();
        const hRad = s * 0.2;
        const hX = shX + Math.cos(tr) * hRad * 1.3;
        const hY = shY + Math.sin(tr) * hRad * 1.3;
        this.ctx.arc(hX, hY, hRad, 0, Math.PI * 2);
        this.ctx.stroke();

        // Legs
        const kX = x + Math.cos(hr) * thighL;
        const kY = y + Math.sin(hr) * thighL;
        const aX = kX + Math.cos(kr) * shinL;
        const aY = kY + Math.sin(kr) * shinL;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(kX, kY);
        this.ctx.lineTo(aX, aY);
        this.ctx.stroke();

        // Arms
        const armA = opts.arm || 0;
        this.ctx.beginPath();
        this.ctx.moveTo(shX, shY);
        if (armA > 45) {
            this.ctx.lineTo(shX, shY + s * 0.4);
            this.ctx.lineTo(shX + s * 0.3, shY - s * 0.1); // Up
        } else {
            this.ctx.lineTo(shX, shY + s * 0.8);
        }
        this.ctx.stroke();
    }

    // Front View
    drawFrontBody(x, y, s, opts = {}) {
        const torsoL = s;
        const shW = s * 0.4;

        // Torso
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y - torsoL);
        this.ctx.stroke();

        // Shoulders
        const shY = y - torsoL * 0.9;
        this.ctx.beginPath();
        this.ctx.moveTo(x - shW, shY);
        this.ctx.lineTo(x + shW, shY);
        this.ctx.stroke();

        // Head
        const hRad = s * 0.2;
        this.ctx.beginPath();
        this.ctx.arc(x, y - torsoL - hRad, hRad, 0, Math.PI * 2);
        this.ctx.stroke();

        // Arms
        this.ctx.beginPath();
        if (opts.raised) {
            // Up
            this.ctx.moveTo(x - shW, shY);
            this.ctx.lineTo(x - shW - 10, shY - s);
            this.ctx.moveTo(x + shW, shY);
            this.ctx.lineTo(x + shW + 10, shY - s);
        } else if (opts.arm > 90) {
            // Cactus
            this.ctx.moveTo(x - shW, shY);
            this.ctx.lineTo(x - shW * 1.5, shY);
            this.ctx.lineTo(x - shW * 1.5, shY - s * 0.5);

            this.ctx.moveTo(x + shW, shY);
            this.ctx.lineTo(x + shW * 1.5, shY);
            this.ctx.lineTo(x + shW * 1.5, shY - s * 0.5);
        } else {
            // Down
            this.ctx.moveTo(x - shW, shY);
            this.ctx.lineTo(x - shW - 10, shY + s * 0.8);
            this.ctx.moveTo(x + shW, shY);
            this.ctx.lineTo(x + shW + 10, shY + s * 0.8);
        }
        this.ctx.stroke();

        // Legs
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - s * 0.4, y + s);
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + s * 0.4, y + s);
        this.ctx.stroke();

        // Head Tilt
        if (opts.headTilt) {
            // Draw tilted head override
            this.ctx.clearRect(x - hRad * 1.5, y - torsoL - hRad * 2.5, hRad * 3, hRad * 3);
            const tilt = opts.headTilt * Math.PI / 180;
            const hCX = x + Math.sin(tilt) * 20;
            this.ctx.beginPath();
            this.ctx.arc(hCX, y - torsoL - hRad, hRad, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawPlank(cx, cy, bend, s) {
        const headX = cx - s;
        const footX = cx + s;
        let bodyY = cy;

        if (bend > 45) bodyY += 20;

        this.ctx.beginPath();
        this.ctx.moveTo(headX, bodyY);
        this.ctx.lineTo(footX, bodyY);
        this.ctx.stroke();

        // Arms
        this.ctx.beginPath();
        this.ctx.moveTo(headX + 20, bodyY);
        if (bend > 45) {
            this.ctx.lineTo(headX, bodyY + 20);
            this.ctx.lineTo(headX - 20, bodyY);
        } else {
            this.ctx.lineTo(headX + 20, bodyY + s * 0.6);
        }
        this.ctx.stroke();
    }
}
