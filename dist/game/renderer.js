import { PIECE_NAMES } from './types.js';
import { Animator } from './animation.js';
import { ParticleSystem } from './particles.js';
import { CLASSIC_THEME } from './themes.js';
export class Renderer {
    constructor(canvas) {
        this.cellSize = 60;
        this.padding = 30;
        this.flipped = false;
        this.showCoords = false;
        this.theme = CLASSIC_THEME;
        this.particles = new ParticleSystem();
        this.currentDpr = 1;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.setupHiDPI();
    }
    setupHiDPI() {
        const dpr = window.devicePixelRatio || 1;
        this.currentDpr = dpr;
        const cssWidth = 540;
        const cssHeight = 600;
        this.canvas.width = cssWidth * dpr;
        this.canvas.height = cssHeight * dpr;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = cssWidth + 'px';
        this.canvas.style.height = cssHeight + 'px';
    }
    handleResize() {
        const dpr = window.devicePixelRatio || 1;
        if (dpr !== this.currentDpr) {
            this.setupHiDPI();
            return true;
        }
        return false;
    }
    setFlipped(v) {
        this.flipped = v;
    }
    setShowCoords(v) {
        this.showCoords = v;
    }
    setTheme(theme) {
        this.theme = { ...CLASSIC_THEME, ...theme };
    }
    // 将棋盘坐标转换为canvas坐标
    toCanvas(pos) {
        const bx = this.flipped ? 8 - pos.x : pos.x;
        const by = this.flipped ? 9 - pos.y : pos.y;
        return {
            x: this.padding + bx * this.cellSize,
            y: this.padding + by * this.cellSize,
        };
    }
    // 将canvas坐标转换为棋盘坐标
    toBoard(canvasX, canvasY) {
        const bx = Math.round((canvasX - this.padding) / this.cellSize);
        const by = Math.round((canvasY - this.padding) / this.cellSize);
        if (bx >= 0 && bx <= 8 && by >= 0 && by <= 9) {
            const cx = this.padding + bx * this.cellSize;
            const cy = this.padding + by * this.cellSize;
            const dist = Math.sqrt((canvasX - cx) ** 2 + (canvasY - cy) ** 2);
            if (dist < this.cellSize * 0.4) {
                const x = this.flipped ? 8 - bx : bx;
                const y = this.flipped ? 9 - by : by;
                return { x, y };
            }
        }
        return null;
    }
    render(state, selectedPos, validMoves, animator, hintMove) {
        this.ctx.clearRect(0, 0, 540, 600);
        this.drawBoard();
        this.drawMarkers();
        if (selectedPos) {
            this.drawHighlight(selectedPos, this.theme.highlight.select);
            for (const move of validMoves) {
                this.drawMoveIndicator(move);
            }
        }
        // 绘制最后一步的标记
        const lastMove = state.moveHistory[state.moveHistory.length - 1];
        if (lastMove) {
            this.drawHighlight(lastMove.from, this.theme.highlight.lastMove);
            this.drawHighlight(lastMove.to, this.theme.highlight.lastMove);
        }
        // 如果被将军，高亮将/帅（闪烁效果）
        if (state.check && !state.gameOver) {
            const kingPos = this.findKing(state);
            if (kingPos) {
                const blink = 0.3 + 0.7 * Math.abs(Math.sin(performance.now() / 200));
                this.ctx.save();
                this.ctx.globalAlpha = blink;
                this.drawHighlight(kingPos, this.theme.highlight.check);
                this.ctx.restore();
            }
        }
        // AI提示走法
        if (hintMove) {
            this.drawHintArrow(hintMove);
        }
        // 粒子特效
        this.particles.updateAndDraw(this.ctx);
        const anim = animator?.getCurrent();
        const animSet = anim ? new Set([`${anim.from.x},${anim.from.y}`, `${anim.to.x},${anim.to.y}`]) : null;
        // 绘制棋子
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                if (animSet && animSet.has(`${x},${y}`))
                    continue;
                const piece = state.board[y][x];
                if (piece) {
                    this.drawPiece({ x, y }, piece);
                }
            }
        }
        // 绘制动画中的棋子
        if (anim) {
            const elapsed = performance.now() - anim.startTime;
            const t = Math.min(1, elapsed / (anim.duration || 1));
            const ease = Animator.easeOut(t);
            const fromCanvas = this.toCanvas(anim.from);
            const toCanvas = this.toCanvas(anim.to);
            const cx = fromCanvas.x + (toCanvas.x - fromCanvas.x) * ease;
            const cy = fromCanvas.y + (toCanvas.y - fromCanvas.y) * ease;
            this.drawPieceAt(cx, cy, anim.piece);
        }
    }
    drawBoard() {
        const { ctx, cellSize, padding } = this;
        const width = cellSize * 8;
        const height = cellSize * 9;
        // 背景
        ctx.fillStyle = this.theme.boardBg;
        ctx.fillRect(0, 0, 540, 600);
        ctx.strokeStyle = this.theme.lineColor;
        ctx.lineWidth = 1.5;
        // 横线
        for (let y = 0; y < 10; y++) {
            const cy = padding + y * cellSize;
            ctx.beginPath();
            ctx.moveTo(padding, cy);
            ctx.lineTo(padding + width, cy);
            ctx.stroke();
        }
        // 竖线（上下两部分，中间楚河汉界不画）
        for (let x = 0; x < 9; x++) {
            const cx = padding + x * cellSize;
            ctx.beginPath();
            ctx.moveTo(cx, padding);
            ctx.lineTo(cx, padding + cellSize * 4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx, padding + cellSize * 5);
            ctx.lineTo(cx, padding + height);
            ctx.stroke();
        }
        // 边框加粗
        ctx.lineWidth = 2.5;
        ctx.strokeRect(padding - 2, padding - 2, width + 4, height + 4);
        ctx.lineWidth = 1.5;
        // 九宫斜线 - 黑方
        ctx.beginPath();
        ctx.moveTo(padding + 3 * cellSize, padding);
        ctx.lineTo(padding + 5 * cellSize, padding + 2 * cellSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(padding + 5 * cellSize, padding);
        ctx.lineTo(padding + 3 * cellSize, padding + 2 * cellSize);
        ctx.stroke();
        // 九宫斜线 - 红方
        ctx.beginPath();
        ctx.moveTo(padding + 3 * cellSize, padding + 7 * cellSize);
        ctx.lineTo(padding + 5 * cellSize, padding + 9 * cellSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(padding + 5 * cellSize, padding + 7 * cellSize);
        ctx.lineTo(padding + 3 * cellSize, padding + 9 * cellSize);
        ctx.stroke();
        // 楚河汉界文字
        ctx.fillStyle = this.theme.riverText;
        ctx.font = 'bold 22px "SimHei", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const riverY = padding + 4.5 * cellSize;
        if (this.flipped) {
            ctx.fillText('汉 界', padding + 2 * cellSize, riverY);
            ctx.fillText('楚 河', padding + 6 * cellSize, riverY);
        }
        else {
            ctx.fillText('楚 河', padding + 2 * cellSize, riverY);
            ctx.fillText('汉 界', padding + 6 * cellSize, riverY);
        }
        // 坐标标注
        if (this.showCoords) {
            ctx.fillStyle = this.theme.lineColor;
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let x = 0; x < 9; x++) {
                const cx = padding + x * cellSize;
                const num = this.flipped ? x + 1 : 9 - x;
                ctx.fillText(num.toString(), cx, padding - 14);
                ctx.fillText(num.toString(), cx, padding + height + 14);
            }
            for (let y = 0; y < 10; y++) {
                const cy = padding + y * cellSize;
                const num = this.flipped ? 10 - y : y + 1;
                ctx.fillText(num.toString(), padding - 14, cy);
                ctx.fillText(num.toString(), padding + width + 14, cy);
            }
        }
    }
    drawMarkers() {
        const { ctx, cellSize, padding } = this;
        ctx.strokeStyle = this.theme.lineColor;
        ctx.lineWidth = 1.2;
        const markLen = 6;
        const positions = [
            [1, 2], [7, 2],
            [0, 3], [2, 3], [4, 3], [6, 3], [8, 3],
            [1, 7], [7, 7],
            [0, 6], [2, 6], [4, 6], [6, 6], [8, 6],
        ];
        for (const [x, y] of positions) {
            const cx = padding + x * cellSize;
            const cy = padding + y * cellSize;
            if (x > 0) {
                ctx.beginPath();
                ctx.moveTo(cx - markLen - 2, cy - markLen);
                ctx.lineTo(cx - 2, cy - markLen);
                ctx.lineTo(cx - 2, cy - markLen - 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx - markLen - 2, cy + markLen);
                ctx.lineTo(cx - 2, cy + markLen);
                ctx.lineTo(cx - 2, cy + markLen + 2);
                ctx.stroke();
            }
            if (x < 8) {
                ctx.beginPath();
                ctx.moveTo(cx + markLen + 2, cy - markLen);
                ctx.lineTo(cx + 2, cy - markLen);
                ctx.lineTo(cx + 2, cy - markLen - 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + markLen + 2, cy + markLen);
                ctx.lineTo(cx + 2, cy + markLen);
                ctx.lineTo(cx + 2, cy + markLen + 2);
                ctx.stroke();
            }
        }
    }
    drawPiece(pos, piece) {
        const { x, y } = this.toCanvas(pos);
        this.drawPieceAt(x, y, piece);
    }
    drawPieceAt(x, y, piece) {
        const radius = this.cellSize * 0.42;
        const { ctx } = this;
        const style = piece.side === 'red' ? this.theme.pieceRed : this.theme.pieceBlack;
        // 阴影
        ctx.beginPath();
        ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fill();
        // 外圈
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(x - 5, y - 5, radius * 0.2, x, y, radius);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(1, style.bg);
        ctx.fillStyle = grad;
        ctx.fill();
        // 边框
        ctx.strokeStyle = style.border;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // 内圈装饰线
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.78, 0, Math.PI * 2);
        ctx.strokeStyle = style.border + '4d'; // 30% opacity hex
        ctx.lineWidth = 1;
        ctx.stroke();
        // 文字
        const name = PIECE_NAMES[piece.side][piece.type];
        ctx.fillStyle = style.text;
        ctx.font = `bold ${Math.floor(radius * 1.1)}px "SimHei", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, x, y + 1);
    }
    drawHighlight(pos, color) {
        const { x, y } = this.toCanvas(pos);
        const size = this.cellSize * 0.5;
        const { ctx } = this;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    drawMoveIndicator(pos) {
        const { x, y } = this.toCanvas(pos);
        const { ctx } = this;
        ctx.fillStyle = this.theme.highlight.validMove;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    drawHintArrow(move) {
        const from = this.toCanvas(move.from);
        const to = this.toCanvas(move.to);
        const { ctx } = this;
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.setLineDash([]);
        // 箭头
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const headLen = 12;
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = '#f1c40f';
        ctx.fill();
        // 高亮起点和终点
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(from.x, from.y, this.cellSize * 0.45, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(to.x, to.y, this.cellSize * 0.45, 0, Math.PI * 2);
        ctx.stroke();
    }
    findKing(state) {
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = state.board[y][x];
                if (piece && piece.type === 'king' && piece.side === state.currentSide) {
                    return { x, y };
                }
            }
        }
        return null;
    }
    resize() {
        // 保持固定大小，但可在移动端缩放
    }
    triggerCaptureEffect(pos, side) {
        const { x, y } = this.toCanvas(pos);
        const color = side === 'red' ? '#e74c3c' : '#3498db';
        this.particles.explode(x, y, color, 24);
    }
}
//# sourceMappingURL=renderer.js.map