export class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    explode(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                maxLife: 0.3 + Math.random() * 0.5,
                color,
                size: 2 + Math.random() * 4,
            });
        }
    }
    updateAndDraw(ctx) {
        if (this.particles.length === 0)
            return;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= 0.016;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    hasParticles() {
        return this.particles.length > 0;
    }
}
//# sourceMappingURL=particles.js.map