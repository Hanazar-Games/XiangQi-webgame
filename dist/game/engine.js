import { Rules } from './rules.js';
import { Zobrist } from './zobrist.js';
// MVV-LVA: Most Valuable Victim - Least Valuable Aggressor
const PIECE_VALUES = {
    king: 10000, rook: 900, cannon: 450, horse: 400,
    elephant: 200, advisor: 200, pawn: 100,
};
// 位置价值表 (Piece-Square Tables)
const PSQ = {
    pawn: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [20, 20, 20, 30, 30, 30, 20, 20, 20],
        [30, 30, 40, 50, 50, 50, 40, 30, 30],
        [40, 40, 50, 60, 60, 60, 50, 40, 40],
        [50, 50, 60, 70, 70, 70, 60, 50, 50],
        [60, 60, 70, 80, 80, 80, 70, 60, 60],
        [70, 80, 90, 100, 100, 100, 90, 80, 70],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    horse: [
        [20, 20, 20, 20, 20, 20, 20, 20, 20],
        [20, 40, 40, 50, 50, 50, 40, 40, 20],
        [20, 40, 60, 70, 80, 70, 60, 40, 20],
        [20, 50, 70, 80, 90, 80, 70, 50, 20],
        [20, 50, 80, 90, 100, 90, 80, 50, 20],
        [20, 50, 70, 80, 90, 80, 70, 50, 20],
        [20, 40, 60, 70, 80, 70, 60, 40, 20],
        [20, 40, 40, 50, 50, 50, 40, 40, 20],
        [20, 20, 20, 20, 20, 20, 20, 20, 20],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    cannon: [
        [20, 20, 20, 20, 20, 20, 20, 20, 20],
        [20, 40, 40, 40, 40, 40, 40, 40, 20],
        [20, 40, 60, 60, 60, 60, 60, 40, 20],
        [20, 40, 60, 80, 80, 80, 60, 40, 20],
        [20, 40, 60, 80, 100, 80, 60, 40, 20],
        [20, 40, 60, 80, 80, 80, 60, 40, 20],
        [20, 40, 60, 60, 60, 60, 60, 40, 20],
        [20, 40, 40, 40, 40, 40, 40, 40, 20],
        [20, 20, 20, 20, 20, 20, 20, 20, 20],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    rook: [
        [20, 20, 20, 30, 30, 30, 20, 20, 20],
        [30, 30, 30, 40, 40, 40, 30, 30, 30],
        [30, 30, 30, 40, 40, 40, 30, 30, 30],
        [40, 40, 50, 60, 60, 60, 50, 40, 40],
        [40, 40, 50, 60, 70, 60, 50, 40, 40],
        [40, 40, 50, 60, 60, 60, 50, 40, 40],
        [30, 30, 30, 40, 40, 40, 30, 30, 30],
        [30, 30, 30, 40, 40, 40, 30, 30, 30],
        [20, 20, 20, 30, 30, 30, 20, 20, 20],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    advisor: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 10, 20, 10, 0, 0, 0],
        [0, 0, 0, 20, 30, 20, 0, 0, 0],
        [0, 0, 0, 10, 20, 10, 0, 0, 0],
    ],
    elephant: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 10, 0, 0, 0, 10, 0, 0],
        [0, 0, 0, 0, 20, 0, 0, 0, 0],
        [0, 0, 10, 0, 0, 0, 10, 0, 0],
    ],
    king: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 20, 30, 20, 0, 0, 0],
        [0, 0, 0, 10, 20, 10, 0, 0, 0],
    ],
};
function getPieceValue(piece, pos) {
    let val = PIECE_VALUES[piece.type];
    const table = PSQ[piece.type];
    const tableY = piece.side === 'red' ? pos.y : 9 - pos.y;
    if (table && table[tableY] && table[tableY][pos.x] !== undefined) {
        val += table[tableY][pos.x];
    }
    if (piece.type === 'pawn') {
        if (piece.side === 'red' && pos.y <= 4)
            val += 40;
        if (piece.side === 'black' && pos.y >= 5)
            val += 40;
    }
    return val;
}
// 杀手启发: 每个深度记录2个杀手走法
class KillerTable {
    constructor() {
        this.table = [];
    }
    get(depth) {
        return this.table[depth] ?? [null, null];
    }
    add(move, depth) {
        if (!this.table[depth])
            this.table[depth] = [null, null];
        const [k1, k2] = this.table[depth];
        const sameAsK1 = k1 && move.from.x === k1.from.x && move.from.y === k1.from.y && move.to.x === k1.to.x && move.to.y === k1.to.y;
        const sameAsK2 = k2 && move.from.x === k2.from.x && move.from.y === k2.from.y && move.to.x === k2.to.x && move.to.y === k2.to.y;
        if (sameAsK1 || sameAsK2)
            return;
        this.table[depth] = [move, k1];
    }
}
// 历史启发表
class HistoryTable {
    constructor() {
        this.table = [];
        for (let side = 0; side < 2; side++) {
            this.table[side] = [];
            for (let y = 0; y < 10; y++) {
                this.table[side][y] = [];
                for (let x = 0; x < 9; x++) {
                    this.table[side][y][x] = Array(100).fill(0);
                }
            }
        }
    }
    score(move, side) {
        const s = side === 'red' ? 0 : 1;
        const idx = move.to.y * 9 + move.to.x;
        return this.table[s][move.from.y][move.from.x][idx] ?? 0;
    }
    add(move, side, depth) {
        const s = side === 'red' ? 0 : 1;
        const idx = move.to.y * 9 + move.to.x;
        const bonus = depth * depth;
        this.table[s][move.from.y][move.from.x][idx] += bonus;
        if (this.table[s][move.from.y][move.from.x][idx] > 1000000) {
            // 防止溢出，定期衰减
            for (let y = 0; y < 10; y++) {
                for (let x = 0; x < 9; x++) {
                    for (let i = 0; i < 90; i++) {
                        this.table[s][y][x][i] = Math.floor(this.table[s][y][x][i] / 2);
                    }
                }
            }
        }
    }
}
export class Engine {
    constructor(side) {
        this.zobrist = new Zobrist();
        this.transpositionTable = new Map();
        this.killerTable = new KillerTable();
        this.historyTable = new HistoryTable();
        this.nodesSearched = 0;
        this.startTime = 0;
        this.timeLimit = 5000;
        this.stopSearch = false;
        this.side = side;
    }
    setTimeLimit(ms) {
        this.timeLimit = ms;
    }
    search(board, maxDepth) {
        this.nodesSearched = 0;
        this.stopSearch = false;
        this.startTime = performance.now();
        this.transpositionTable.clear();
        let bestMove = null;
        let bestScore = -Infinity;
        let lastCompletedDepth = 0;
        // 迭代加深
        for (let depth = 1; depth <= maxDepth; depth++) {
            if (this.shouldStop())
                break;
            const score = this.minimax(board, depth, -Infinity, Infinity, true);
            if (!this.stopSearch) {
                bestScore = score;
                lastCompletedDepth = depth;
                // 从置换表获取最佳走法
                const hash = this.zobrist.hash(board, this.side);
                const entry = this.transpositionTable.get(hash);
                if (entry && entry.bestMove) {
                    bestMove = entry.bestMove;
                }
            }
        }
        // 保底：如果超时导致 bestMove 为 null，回退到第一个合法走法
        if (!bestMove && this.stopSearch) {
            const fallbackMoves = this.getAllLegalMoves(board, this.side);
            if (fallbackMoves.length > 0) {
                bestMove = fallbackMoves[0];
            }
        }
        const timeMs = performance.now() - this.startTime;
        return { move: bestMove, score: bestScore, nodes: this.nodesSearched, depth: lastCompletedDepth, timeMs };
    }
    shouldStop() {
        if (this.stopSearch)
            return true;
        if (performance.now() - this.startTime > this.timeLimit) {
            this.stopSearch = true;
            return true;
        }
        return false;
    }
    minimax(board, depth, alpha, beta, isMaximizing) {
        this.nodesSearched++;
        if (this.shouldStop())
            return isMaximizing ? alpha : beta;
        const side = isMaximizing ? this.side : (this.side === 'red' ? 'black' : 'red');
        const hash = this.zobrist.hash(board, side);
        // 置换表查询
        const ttEntry = this.transpositionTable.get(hash);
        if (ttEntry && ttEntry.depth >= depth) {
            if (ttEntry.flag === 'exact')
                return ttEntry.score;
            if (ttEntry.flag === 'lower' && ttEntry.score >= beta)
                return ttEntry.score;
            if (ttEntry.flag === 'upper' && ttEntry.score <= alpha)
                return ttEntry.score;
        }
        // 叶子节点评估（静态搜索消除地平线效应）
        if (depth === 0) {
            return this.quiescence(board, alpha, beta, isMaximizing, 0);
        }
        const moves = this.getAllLegalMoves(board, side);
        if (moves.length === 0) {
            if (Rules.isInCheck(board, side)) {
                return isMaximizing ? -99999 + (10 - depth) : 99999 - (10 - depth);
            }
            return 0;
        }
        // 走法排序
        this.orderMoves(moves, board, depth, side, ttEntry);
        const originalAlpha = alpha;
        const originalBeta = beta;
        let bestScore = isMaximizing ? -Infinity : Infinity;
        let bestMove = null;
        let flag = 'upper';
        for (const move of moves) {
            if (this.shouldStop())
                break;
            const newBoard = this.simulateMove(board, move);
            const score = this.minimax(newBoard, depth - 1, alpha, beta, !isMaximizing);
            if (isMaximizing) {
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                alpha = Math.max(alpha, score);
                if (score >= beta) {
                    this.killerTable.add(move, depth);
                    this.historyTable.add(move, side, depth);
                    flag = 'lower';
                    break;
                }
            }
            else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                beta = Math.min(beta, score);
                if (score <= alpha) {
                    this.killerTable.add(move, depth);
                    this.historyTable.add(move, side, depth);
                    flag = 'upper';
                    break;
                }
            }
        }
        if (!this.stopSearch && bestMove) {
            if (flag !== 'lower') {
                if (bestScore <= originalAlpha)
                    flag = 'upper';
                else if (bestScore >= originalBeta)
                    flag = 'lower';
                else
                    flag = 'exact';
            }
            if (this.transpositionTable.size > 500000) {
                this.transpositionTable.clear();
            }
            this.transpositionTable.set(hash, { depth, score: bestScore, flag, bestMove });
        }
        return bestScore;
    }
    getAllLegalMoves(board, side) {
        const moves = [];
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = board[y][x];
                if (piece && piece.side === side) {
                    for (let ty = 0; ty < 10; ty++) {
                        for (let tx = 0; tx < 9; tx++) {
                            if (this.shouldStop())
                                return moves;
                            const from = { x, y };
                            const to = { x: tx, y: ty };
                            if (Rules.isValidMove(board, from, to)) {
                                if (!Rules.wouldBeInCheck(board, from, to, side)) {
                                    const captured = board[ty][tx] || undefined;
                                    moves.push({ from, to, piece, captured });
                                }
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }
    getCaptureMoves(board, side) {
        const moves = [];
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = board[y][x];
                if (piece && piece.side === side) {
                    for (let ty = 0; ty < 10; ty++) {
                        for (let tx = 0; tx < 9; tx++) {
                            if (this.shouldStop())
                                return moves;
                            if (!board[ty][tx] || board[ty][tx].side === side)
                                continue;
                            const from = { x, y };
                            const to = { x: tx, y: ty };
                            if (Rules.isValidMove(board, from, to)) {
                                if (!Rules.wouldBeInCheck(board, from, to, side)) {
                                    moves.push({ from, to, piece, captured: board[ty][tx] });
                                }
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }
    orderMoves(moves, board, depth, side, ttEntry) {
        const [killer1, killer2] = this.killerTable.get(depth);
        moves.sort((a, b) => {
            // 1. 置换表最佳走法
            if (ttEntry?.bestMove) {
                const tt = ttEntry.bestMove;
                const isA = a.from.x === tt.from.x && a.from.y === tt.from.y && a.to.x === tt.to.x && a.to.y === tt.to.y;
                const isB = b.from.x === tt.from.x && b.from.y === tt.from.y && b.to.x === tt.to.x && b.to.y === tt.to.y;
                if (isA && !isB)
                    return -1;
                if (!isA && isB)
                    return 1;
            }
            // 2. MVV-LVA 吃子排序
            const captureA = a.captured ? this.mvvLva(a) : 0;
            const captureB = b.captured ? this.mvvLva(b) : 0;
            if (captureA !== captureB)
                return captureB - captureA;
            // 3. 杀手启发
            const isKillerA = this.isKiller(a, killer1, killer2);
            const isKillerB = this.isKiller(b, killer1, killer2);
            if (isKillerA !== isKillerB)
                return isKillerB ? 1 : -1;
            // 4. 历史启发
            return this.historyTable.score(b, side) - this.historyTable.score(a, side);
        });
    }
    mvvLva(move) {
        if (!move.captured)
            return 0;
        const victim = PIECE_VALUES[move.captured.type];
        const attacker = PIECE_VALUES[move.piece.type];
        return victim * 10 - attacker;
    }
    isKiller(move, k1, k2) {
        if (!k1)
            return false;
        if (move.from.x === k1.from.x && move.from.y === k1.from.y && move.to.x === k1.to.x && move.to.y === k1.to.y)
            return true;
        if (!k2)
            return false;
        return move.from.x === k2.from.x && move.from.y === k2.from.y && move.to.x === k2.to.x && move.to.y === k2.to.y;
    }
    simulateMove(board, move) {
        const newBoard = board.map(row => [...row]);
        newBoard[move.to.y][move.to.x] = move.piece;
        newBoard[move.from.y][move.from.x] = null;
        return newBoard;
    }
    quiescence(board, alpha, beta, isMaximizing, qDepth) {
        const standPat = this.evaluate(board);
        if (isMaximizing) {
            if (standPat >= beta)
                return beta;
            if (standPat > alpha)
                alpha = standPat;
        }
        else {
            if (standPat <= alpha)
                return alpha;
            if (standPat < beta)
                beta = standPat;
        }
        if (qDepth >= 8)
            return isMaximizing ? alpha : beta;
        const side = isMaximizing ? this.side : (this.side === 'red' ? 'black' : 'red');
        const moves = this.getCaptureMoves(board, side);
        for (const move of moves) {
            if (this.shouldStop())
                break;
            const newBoard = this.simulateMove(board, move);
            const score = this.quiescence(newBoard, alpha, beta, !isMaximizing, qDepth + 1);
            if (isMaximizing) {
                if (score >= beta)
                    return beta;
                if (score > alpha)
                    alpha = score;
            }
            else {
                if (score <= alpha)
                    return alpha;
                if (score < beta)
                    beta = score;
            }
        }
        return isMaximizing ? alpha : beta;
    }
    evaluate(board) {
        let score = 0;
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = board[y][x];
                if (piece) {
                    const val = getPieceValue(piece, { x, y });
                    if (piece.side === this.side) {
                        score += val;
                    }
                    else {
                        score -= val;
                    }
                }
            }
        }
        return score;
    }
}
//# sourceMappingURL=engine.js.map