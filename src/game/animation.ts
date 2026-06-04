import { Position } from './types.js';

export interface AnimatingPiece {
  piece: import('./types.js').Piece;
  from: Position;
  to: Position;
  startTime: number;
  duration: number;
}

export class Animator {
  private current: AnimatingPiece | null = null;
  private onUpdate: () => void;
  private rafId = 0;

  constructor(onUpdate: () => void) {
    this.onUpdate = onUpdate;
  }

  animate(piece: AnimatingPiece['piece'], from: Position, to: Position, duration = 200): void {
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

  private tick = (): void => {
    if (!this.current) return;
    const elapsed = performance.now() - this.current.startTime;
    if (elapsed >= this.current.duration) {
      this.current = null;
    }
    this.onUpdate();
    if (this.current) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.current = null;
  }

  getCurrent(): AnimatingPiece | null {
    return this.current;
  }

  // ease-out cubic
  static easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}
