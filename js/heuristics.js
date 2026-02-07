/**
 * Logic for analyzing posture and generating feedback.
 */
import { calculateAngle, calculateAngle2D } from './geometry.js';

export class PostureHeuristics {
    constructor() {
        this.lastFeedback = null;
    }

    analyze(landmarks, state, exercise = 'squat') {
        if (exercise === 'squat') {
            return this.analyzeSquat(landmarks, state);
        } else if (exercise === 'bicep_curl') {
            return this.analyzeCurl(landmarks, state);
        } else if (exercise === 'shoulder_press') {
            return this.analyzePress(landmarks, state);
        } else if (exercise === 'neck_stretch') {
            return this.analyzeNeck(landmarks, state);
        } else if (exercise === 'push_up') {
            return this.analyzePushUp(landmarks, state);
        }
        return { isGood: true, message: '' };
    }

    // ... (existing methods) ...

    analyzePushUp(landmarks, state) {
        // Push-up Analysis
        // 1. Plank: Shoulder(11), Hip(23), Ankle(27) should be straight line (~180 deg)
        // 2. Depth: Measured in FSM mostly, but can add check here if needed.

        const shoulder = landmarks[11];
        const hip = landmarks[23];
        const ankle = landmarks[27];

        if (!shoulder || !hip || !ankle) return { isGood: true, message: '' };

        const bodyAngle = calculateAngle2D(shoulder, hip, ankle);

        let feedback = { isGood: true, message: '' };

        // Allow some pike or sag, but not too much. Ideal is 180.
        // Sag < 160 (hips down), Pike > 200 (hips up) - logic depends on 360 calcs.
        // calculateAngle2D usually returns inner angle 0-180.
        // So we expect close to 180.

        if (bodyAngle < 160) {
            feedback.isGood = false;
            feedback.message = 'Don\'t sag your hips';
        }

        return feedback;
    }

    analyzeSquat(landmarks, state) {
        // Simple Squat Analysis
        // Landmarks: 23(Hip), 25(Knee), 27(Ankle), 11(Shoulder) - Left side

        const leftHip = landmarks[23];
        const leftKnee = landmarks[25];
        const leftAnkle = landmarks[27];
        const leftShoulder = landmarks[11];

        if (!leftHip || !leftKnee || !leftAnkle) return { isGood: true, message: '' };

        const kneeAngle = calculateAngle2D(leftHip, leftKnee, leftAnkle);
        const hipAngle = calculateAngle2D(leftShoulder, leftHip, leftKnee); // Torso alignment

        let feedback = {
            isGood: true,
            message: '',
            angles: { knee: kneeAngle, hip: hipAngle }
        };

        // Deep Squat check
        if (state === 'bottom') {
            if (kneeAngle > 110) { // Not deep enough
                feedback.isGood = false;
                feedback.message = 'Go lower';
            }
        }

        // Back check (Torso lean)
        if (hipAngle < 45) {
            feedback.isGood = false;
            feedback.message = 'Keep your chest up';
        }

        return feedback;
    }

    analyzePress(landmarks, state) {
        // Shoulder Press
        // Check for back Arching?
        // 11(Shoulder), 23(Hip), 25(Knee) -> Torso-Leg angle?
        // Or 11-23 line vs vertical.

        const shoulder = landmarks[11];
        const hip = landmarks[23];
        const knee = landmarks[25];

        if (!shoulder || !hip || !knee) return { isGood: true, message: '' };

        const torsoAngle = calculateAngle2D(shoulder, hip, knee);

        let feedback = { isGood: true, message: '' };

        // If torso angle < 150, might be leaning back too much or sitting weirdly
        // (Assuming standing press 180 is straight)
        if (torsoAngle < 150) {
            feedback.isGood = false;
            feedback.message = 'Don\'t arch your back';
        }

        return feedback;
    }

    analyzeNeck(landmarks, state) {
        // Neck Stretch
        // Ensure shoulders are level
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];

        if (!leftShoulder || !rightShoulder) return { isGood: true, message: '' };

        const shoulderSlope = Math.abs(leftShoulder.y - rightShoulder.y);

        let feedback = { isGood: true, message: '' };

        if (shoulderSlope > 0.1) { // Normalized coordinate diff
            feedback.isGood = false;
            feedback.message = 'Keep shoulders level';
        }

        return feedback;
    }

    analyzeCurl(landmarks, state) {
        // Bicep Curl Analysis
        // 11(Shoulder), 13(Elbow), 15(Wrist)
        const shoulder = landmarks[11];
        const elbow = landmarks[13];
        const hip = landmarks[23];

        if (!shoulder || !elbow || !hip) return { isGood: true, message: '' };

        // Check for swinging: Elbow should stay close to the torso
        // We can measure the angle between Shoulder-Hip and Shoulder-Elbow
        // Ideally, upper arm vector shouldn't move much relative to torso vector

        const elbowFlaring = calculateAngle2D(hip, shoulder, elbow);
        // 0 would be arm straight down, 90 arm straight out.
        // During curl, upper arm should remain roughly vertical (close to 0-20 deg relative to torso vertical)

        let feedback = {
            isGood: true,
            message: ''
        };

        if (elbowFlaring > 30) {
            feedback.isGood = false;
            feedback.message = 'Keep elbows pinned';
        }

        return feedback;
    }
}
