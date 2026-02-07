/**
 * Handles audio feedback (TTS and beeps).
 */
export class AudioFeedback {
    constructor() {
        this.synth = window.speechSynthesis;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.lastSpokenTime = 0;
        this.cooldown = 3000; // Minimum time between speech to avoid spam
    }

    speak(text) {
        const now = Date.now();
        if (now - this.lastSpokenTime < this.cooldown) return;

        if (this.synth.speaking) {
            console.warn('Speech synthesis busy, skipping:', text);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1; // Slightly faster
        utterance.pitch = 1.0;
        this.synth.speak(utterance);
        this.lastSpokenTime = now;
    }

    playChirp(type = 'good') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        if (type === 'good') {
            osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.1);
        } else {
            osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, this.audioCtx.currentTime + 0.2);
        }

        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.2);
    }

    playError() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.audioCtx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.3);
    }

    resume() {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }
}
