/**
 * Finite State Machine to track exercise progress.
 */
import { calculateAngle2D } from './geometry.js';

export class ExerciseFSM {
    constructor(thresholdService) {
        this.currentExercise = 'squat'; // 'squat' or 'bicep_curl'
        this.state = 'neutral';
        this.reps = 0;
        this.isValid = true; // Strict mode flag
        this.lastAngle = 180;

        this.holdStartTime = 0; // For static holds
        this.lastRepTime = 0; // For debounce

        this.thresholdService = thresholdService;

        // Fallback if service not ready
        this.defaultThresholds = {
            squat: { stand: 170, depth: 100 }, // Relaxed stand (was 160)
            bicep_curl: { extend: 165, flex: 50 }, // Relaxed extend (was 160)
            shoulder_press: { start: 50, overhead: 150 }, // Relaxed start
            neck: { tilt: 15, duration: 5000 }, // More sensitive tilt
            pushup: { arm_ext: 165, arm_flex: 90 }
        };
    }

    getThresholds(exercise) {
        if (this.thresholdService) {
            // map defaults to service lookups if needed, but service structure matches
            // We can just query specific values or get the whole object
            // For now, let's just use defaults locally or query specific vals
            return this.defaultThresholds[exercise];
        }
        return this.defaultThresholds[exercise];
    }

    // Helper to get a specific threshold value, prioritizing adaptive service
    getT(exercise, param) {
        if (this.thresholdService) {
            return this.thresholdService.get(exercise, param);
        }
        return this.defaultThresholds[exercise][param];
    }

    setExercise(exercise) {
        this.currentExercise = exercise;
        this.reset();
    }

    // Call this when heuristics detect bad form
    invalidateRep() {
        this.isValid = false;
    }

    update(landmarks) {
        if (!landmarks) return { state: this.state, reps: this.reps, isValid: this.isValid };

        if (this.currentExercise === 'squat') {
            return this.updateSquat(landmarks);
        } else if (this.currentExercise === 'bicep_curl') {
            return this.updateCurl(landmarks);
        } else if (this.currentExercise === 'shoulder_press') {
            return this.updatePress(landmarks);
        } else if (this.currentExercise === 'neck_stretch') {
            return this.updateNeck(landmarks);
        } else if (this.currentExercise === 'push_up') {
            return this.updatePushUp(landmarks);
        }
        return { state: this.state, reps: this.reps, isValid: this.isValid };
    }

    getBestSide(landmarks) {
        const leftVis = (landmarks[11].visibility || 0) + (landmarks[23].visibility || 0) + (landmarks[25].visibility || 0);
        const rightVis = (landmarks[12].visibility || 0) + (landmarks[24].visibility || 0) + (landmarks[26].visibility || 0);
        return leftVis > rightVis ? 'left' : 'right';
    }

    updateSquat(landmarks) {
        const side = this.getBestSide(landmarks);
        const isLeft = side === 'left';

        const hip = isLeft ? landmarks[23] : landmarks[24];
        const knee = isLeft ? landmarks[25] : landmarks[26];
        const ankle = isLeft ? landmarks[27] : landmarks[28];
        const shoulder = isLeft ? landmarks[11] : landmarks[12]; // check torso

        if (!hip || !knee || !ankle || !shoulder) return { state: this.state, reps: this.reps, isValid: this.isValid };

        const angle = calculateAngle2D(hip, knee, ankle);

        const standThres = this.getT('squat', 'stand');
        const depthThres = this.getT('squat', 'depth');

        // Stand Check: Hip should be above Knee
        const isStanding = hip.y < knee.y;

        switch (this.state) {
            case 'neutral':
                if (angle < standThres - 10 && isStanding) {
                    this.state = 'descending';
                    this.isValid = true; // New rep starts valid
                }
                break;
            case 'descending':
                if (angle < depthThres) {
                    this.state = 'bottom';
                    // ADAPTATION: Record max depth achieved
                    if (this.thresholdService) this.thresholdService.observe('squat', 'depth', angle);
                }
                else if (angle > standThres) {
                    this.state = 'neutral'; // Aborted
                    this.isValid = true; // Reset validity for next attempt
                }
                break;
            case 'bottom':
                // Track lowest point for adaptation? 
                if (angle < depthThres && this.thresholdService) {
                    this.thresholdService.observe('squat', 'depth', angle);
                }

                if (angle > depthThres + 10) this.state = 'ascending';
                break;
            case 'ascending':
                if (angle > standThres) {
                    this.state = 'neutral';
                    if (this.isValid) {
                        this.reps++;
                    } else {
                        // Rep validation failed previously, do not count
                    }
                } else if (angle < depthThres) this.state = 'bottom';
                break;
        }

        // Global check: if validity is lost, ensure we don't accidentally recover it mid-rep
        // (isValid is set to false by invalidateRep externally, so we just respect it)

        return { state: this.state, reps: this.reps, currentAngle: angle, isValid: this.isValid };
    }

    updateCurl(landmarks) {
        const side = this.getBestSide(landmarks);
        const isLeft = side === 'left';

        const shoulder = isLeft ? landmarks[11] : landmarks[12];
        const elbow = isLeft ? landmarks[13] : landmarks[14];
        const wrist = isLeft ? landmarks[15] : landmarks[16];

        if (!shoulder || !elbow || !wrist) return { state: this.state, reps: this.reps, isValid: this.isValid };

        const angle = calculateAngle2D(shoulder, elbow, wrist);
        const thres = this.getThresholds('bicep_curl');

        // Helper: Check Upper Arm angle relative to vertical (Shoulder-Elbow vs Vertical)
        // atan2(elbow.x - shoulder.x, elbow.y - shoulder.y) -> 0 is down
        const upperArmAngle = Math.abs(Math.atan2(elbow.x - shoulder.x, elbow.y - shoulder.y) * 180 / Math.PI);
        // Should be fairly vertical (< 30 deg swing)

        // State machine for Curl

        switch (this.state) {
            case 'neutral': // Extended position
                if (angle > thres.extend - 10 && upperArmAngle < 40) { // Arm straight down
                    // Only transition if angle decreases
                }
                if (angle < thres.extend - 10) {
                    this.state = 'flexing';
                    this.isValid = true;
                }
                break;
            case 'flexing': // Moving up
                if (upperArmAngle > 50) this.isValid = false; // Too much swing

                if (angle < thres.flex) this.state = 'peak';
                else if (angle > thres.extend) {
                    this.state = 'neutral'; // Aborted rep, went back down
                    this.isValid = true;
                }
                break;
            case 'peak': // Top of the curl
                if (angle > thres.flex + 10) this.state = 'extending';
                break;
            case 'extending': // Moving down
                if (angle > thres.extend) {
                    this.state = 'neutral';
                    if (this.isValid) {
                        this.reps++;
                    }
                } else if (angle < thres.flex) this.state = 'peak'; // Failed to extend, went back up
                break;
        }

        return { state: this.state, reps: this.reps, currentAngle: angle, isValid: this.isValid };
    }

    updatePress(landmarks) {
        // Shoulder Press: Track BOTH arms
        const leftShoulder = landmarks[11];
        const leftElbow = landmarks[13];
        const leftWrist = landmarks[15];

        const rightShoulder = landmarks[12];
        const rightElbow = landmarks[14];
        const rightWrist = landmarks[16];

        const nose = landmarks[0];

        if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist)
            return { state: this.state, reps: this.reps, isValid: this.isValid };

        const leftAngle = calculateAngle2D(leftShoulder, leftElbow, leftWrist);
        const rightAngle = calculateAngle2D(rightShoulder, rightElbow, rightWrist);

        // Average angle for general state, but check individual for validity
        const avgAngle = (leftAngle + rightAngle) / 2;
        const thres = this.getThresholds('shoulder_press');

        // --- STRICT POSITION CHECKS ---
        const leftAbove = leftWrist.y < leftShoulder.y;
        const rightAbove = rightWrist.y < rightShoulder.y;

        const leftAboveNose = nose ? leftWrist.y < nose.y : leftWrist.y < (leftShoulder.y - 0.2);
        const rightAboveNose = nose ? rightWrist.y < nose.y : rightWrist.y < (rightShoulder.y - 0.2);

        // Check symmetry
        const symmetry = Math.abs(leftAngle - rightAngle);
        if (symmetry > 30) this.isValid = false; // Arms uneven

        switch (this.state) {
            case 'neutral': // Hands at shoulders
                // Ready to press?
                if (avgAngle > thres.start + 10 && leftAbove && rightAbove) {
                    this.state = 'pressing';
                    this.isValid = true;
                }
                break;
            case 'pressing':
                if (avgAngle > thres.overhead && leftAboveNose && rightAboveNose) this.state = 'peak';
                else if (avgAngle < thres.start) {
                    this.state = 'neutral';
                    this.isValid = true;
                }
                break;
            case 'peak': // Arms extended overhead
                if (avgAngle < thres.overhead - 10) this.state = 'lowering';
                break;
            case 'lowering':
                if (avgAngle < thres.start) {
                    // Must end near shoulders
                    if (Math.abs(leftWrist.y - leftShoulder.y) < 0.4 && Math.abs(rightWrist.y - rightShoulder.y) < 0.4) {
                        this.state = 'neutral';
                        if (this.isValid) this.reps++;
                    }
                } else if (avgAngle > thres.overhead) this.state = 'peak';
                break;
        }
        return { state: this.state, reps: this.reps, currentAngle: avgAngle, isValid: this.isValid };
    }

    updateNeck(landmarks) {
        // Neck Stretch: Ear to Shoulder
        // 7(Ear), 11(Shoulder) -> Check angle of Head-Neck vector relative to vertical?
        // Simpler: 0(Nose), 11(Shoulder), 12(Right Shoulder)
        // Let's use Nose to midpoint of shoulders for vertical alignment

        const nose = landmarks[0];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];

        if (!nose || !leftShoulder || !rightShoulder) return { state: this.state, reps: this.reps, isValid: true };

        // Calculate mid shoulder
        const midShoulder = {
            x: (leftShoulder.x + rightShoulder.x) / 2,
            y: (leftShoulder.y + rightShoulder.y) / 2
        };

        // Calculate angle of Nose-MidShoulder vector relative to vertical
        const angleRad = Math.atan2(nose.x - midShoulder.x, midShoulder.y - nose.y);
        const angleDeg = angleRad * (180 / Math.PI); // 0 is vertical
        const absAngle = Math.abs(angleDeg);

        const thres = this.getThresholds('neck');

        if (absAngle > thres.tilt) {
            if (this.state !== 'holding') {
                this.state = 'holding';
                this.holdStartTime = Date.now();
            } else {
                // Check timer
                const elapsed = Date.now() - this.holdStartTime;
                if (elapsed > thres.duration) {
                    this.state = 'completed';
                    this.reps++; // Count completed holds
                    this.holdStartTime = Date.now() + 1000; // Cooldown
                }
            }
        } else {
            this.state = 'neutral';
            this.holdStartTime = 0;
        }

        return { state: this.state == 'holding' ? `Hold ${(5 - (Date.now() - this.holdStartTime) / 1000).toFixed(1)}s` : this.state, reps: this.reps, isValid: true, currentAngle: absAngle };
    }

    updatePushUp(landmarks) {
        // Detect best side based on visibility
        const leftVis = (landmarks[11].visibility || 0) + (landmarks[13].visibility || 0) + (landmarks[15].visibility || 0);
        const rightVis = (landmarks[12].visibility || 0) + (landmarks[14].visibility || 0) + (landmarks[16].visibility || 0);

        const isLeft = leftVis > rightVis;

        const shoulder = isLeft ? landmarks[11] : landmarks[12];
        const elbow = isLeft ? landmarks[13] : landmarks[14];
        const wrist = isLeft ? landmarks[15] : landmarks[16];
        const hip = isLeft ? landmarks[23] : landmarks[24]; // Use corresponding hip

        if (!shoulder || !elbow || !wrist || !hip) return { state: this.state, reps: this.reps, isValid: this.isValid };

        const armAngle = calculateAngle2D(shoulder, elbow, wrist);
        const thres = this.getThresholds('pushup');

        // Strict Checks
        const handsOnFloor = wrist.y > shoulder.y;

        switch (this.state) {
            case 'neutral': // Top of pushup (arms extended)
                if (armAngle > thres.arm_ext - 10) {
                    // Wait
                }

                // Must be in position
                if (armAngle < thres.arm_ext - 10 && handsOnFloor) {
                    this.state = 'descending';
                    this.isValid = true;
                }
                break;
            case 'descending': // Going down
                if (!handsOnFloor) this.isValid = false;

                if (armAngle < thres.arm_flex) this.state = 'bottom';
                else if (armAngle > thres.arm_ext) this.state = 'neutral';
                break;
            case 'bottom': // At bottom
                // Require deeper bend? 90 deg is standard.
                if (armAngle > thres.arm_flex + 10) this.state = 'ascending';
                break;
            case 'ascending': // Coming up
                if (armAngle > thres.arm_ext) {
                    this.state = 'neutral';
                    // Debounce: Prevent double counting if noise triggers multiple transitions quickly
                    const now = Date.now();
                    if (this.isValid && (now - this.lastRepTime > 1000)) {
                        this.reps++;
                        this.lastRepTime = now;
                    }
                } else if (armAngle < thres.arm_flex) this.state = 'bottom';
                break;
        }

        return { state: this.state, reps: this.reps, currentAngle: armAngle, isValid: this.isValid };
    }

    reset() {
        this.reps = 0;
        this.state = 'neutral';
        this.isValid = true;
        this.lastRepTime = 0;
        this.holdStartTime = 0;
    }
}
