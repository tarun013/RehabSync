/**
 * Geometric utilities for calculating angles and vectors.
 */

// Helper to calculate dot product
function dotProduct(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

// Helper to calculate vector magnitude
function magnitude(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

// Convert landmarks (which might lack z or have visibility) to pure vector objects
function toVector(landmark) {
    return {
        x: landmark.x,
        y: landmark.y,
        z: landmark.z || 0
    };
}

/**
 * Calculates the angle (in degrees) at point B given points A, B, C.
 * Angle is formed by vectors BA and BC.
 * @param {Object} a - First point {x, y, z}
 * @param {Object} b - Middle point (vertex) {x, y, z}
 * @param {Object} c - Last point {x, y, z}
 * @returns {number} Angle in degrees (0-180)
 */
export function calculateAngle(a, b, c) {
    if (!a || !b || !c) return 0;

    // Create vectors BA and BC
    const v1 = {
        x: a.x - b.x,
        y: a.y - b.y,
        z: a.z - b.z // 3D angle
    };

    const v2 = {
        x: c.x - b.x,
        y: c.y - b.y,
        z: c.z - b.z
    };

    const dot = dotProduct(v1, v2);
    const mag1 = magnitude(v1);
    const mag2 = magnitude(v2);

    if (mag1 === 0 || mag2 === 0) return 0;

    // Clamp cosine to [-1, 1] to avoid FP errors
    let cosine = dot / (mag1 * mag2);
    cosine = Math.max(-1, Math.min(1, cosine));

    const radian = Math.acos(cosine);
    return (radian * 180) / Math.PI;
}

/**
 * Calculates 2D angle (ignoring Z) which is often more stable for 
 * exercises viewed from the side (like squats).
 */
export function calculateAngle2D(a, b, c) {
    if (!a || !b || !c) return 0;

    const val_a = Math.atan2(c.y - b.y, c.x - b.x);
    const val_b = Math.atan2(a.y - b.y, a.x - b.x);

    let angle = Math.abs(val_a - val_b);
    angle = angle * 180 / Math.PI;

    if (angle > 180) {
        angle = 360 - angle;
    }

    return angle;
}
