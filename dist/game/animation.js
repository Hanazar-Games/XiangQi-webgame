export class Animator {
    constructor(onUpdate) {
        this.current = null;
        this.rafId = 0;
        this.tick = () => {
            if (!this.current)
                return;
            const elapsed = performance.now() - this.current.startTime;
            if (elapsed >= this.current.duration) {
                this.current = null;
            }
            this.onUpdate();
            if (this.current) {
                this.rafId = requestAnimationFrame(this.tick);
            }
        };
        this.onUpdate = onUpdate;
    }
    animate(piece, from, to, duration = 200) {
        this.stop();
        this.current = {
            piece,
            from,
            to,
            startTime: performance.now(),
            duration,
        };
        this.tick();
    }
    stop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
        this.current = null;
    }
    getCurrent() {
        return this.current;
    }
    // ease-out cubic
    static easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }
}
//# sourceMappingURL=animation.js.map