export class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.bgmEnabled = false;
        this.bgmGain = null;
        this.bgmOscillators = [];
    }
    getContext() {
        if (!this.ctx) {
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
        }
        return this.ctx;
    }
    setEnabled(v) {
        this.enabled = v;
    }
    setBgmEnabled(v) {
        this.bgmEnabled = v;
        if (v) {
            this.startBgm();
        }
        else {
            this.stopBgm();
        }
    }
    startBgm() {
        if (this.bgmOscillators.length > 0)
            return;
        const ctx = this.getContext();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 1.2);
        gain.connect(ctx.destination);
        const notes = [130.81, 196.00, 261.63];
        this.bgmOscillators = notes.map((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = i === 1 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.connect(gain);
            osc.start();
            return osc;
        });
        this.bgmGain = gain;
    }
    stopBgm() {
        if (this.bgmOscillators.length === 0)
            return;
        const ctx = this.getContext();
        const gain = this.bgmGain;
        if (gain) {
            gain.gain.cancelScheduledValues(ctx.currentTime);
            gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        }
        for (const osc of this.bgmOscillators) {
            try {
                osc.stop(ctx.currentTime + 0.45);
            }
            catch { }
        }
        this.bgmOscillators = [];
        this.bgmGain = null;
    }
    // 落子音：短促的木鱼/敲击声
    playMove() {
        if (!this.enabled)
            return;
        const ctx = this.getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    }
    // 吃子音：更重的敲击
    playCapture() {
        if (!this.enabled)
            return;
        const ctx = this.getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.18);
    }
    // 将军音：警示声
    playCheck() {
        if (!this.enabled)
            return;
        const ctx = this.getContext();
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            const t = ctx.currentTime + i * 0.12;
            osc.frequency.setValueAtTime(880, t);
            osc.frequency.exponentialRampToValueAtTime(440, t + 0.1);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.12);
        }
    }
    // 胜利音：简短和弦
    playWin() {
        if (!this.enabled)
            return;
        const ctx = this.getContext();
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const t = ctx.currentTime + i * 0.1;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.45);
        });
    }
}
//# sourceMappingURL=audio.js.map