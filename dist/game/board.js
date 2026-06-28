import { Rules } from './rules.js';
export class Board {
    constructor(onStateChange) {
        this.onStateChange = onStateChange;
        this.state = this.createInitialState();
    }
    isInsideBoard(pos) {
        return Number.isInteger(pos.x) && Number.isInteger(pos.y) &&
            pos.x >= 0 && pos.x <= 8 && pos.y >= 0 && pos.y <= 9;
    }
    createInitialState() {
        const board = Array(10)
            .fill(null)
            .map(() => Array(9).fill(null));
        // 黑方（上方）
        const blackPieces = [
            [0, 0, 'rook'], [1, 0, 'horse'], [2, 0, 'elephant'],
            [3, 0, 'advisor'], [4, 0, 'king'], [5, 0, 'advisor'],
            [6, 0, 'elephant'], [7, 0, 'horse'], [8, 0, 'rook'],
            [1, 2, 'cannon'], [7, 2, 'cannon'],
            [0, 3, 'pawn'], [2, 3, 'pawn'], [4, 3, 'pawn'],
            [6, 3, 'pawn'], [8, 3, 'pawn'],
        ];
        // 红方（下方）
        const redPieces = [
            [0, 9, 'rook'], [1, 9, 'horse'], [2, 9, 'elephant'],
            [3, 9, 'advisor'], [4, 9, 'king'], [5, 9, 'advisor'],
            [6, 9, 'elephant'], [7, 9, 'horse'], [8, 9, 'rook'],
            [1, 7, 'cannon'], [7, 7, 'cannon'],
            [0, 6, 'pawn'], [2, 6, 'pawn'], [4, 6, 'pawn'],
            [6, 6, 'pawn'], [8, 6, 'pawn'],
        ];
        for (const [x, y, type] of blackPieces) {
            board[y][x] = { type, side: 'black' };
        }
        for (const [x, y, type] of redPieces) {
            board[y][x] = { type, side: 'red' };
        }
        return {
            board,
            currentSide: 'red',
            moveHistory: [],
            capturedRed: [],
            capturedBlack: [],
            gameOver: false,
            winner: null,
            check: false,
            noCaptureCount: 0,
        };
    }
    // 获取某位置棋子
    getPiece(pos) {
        return this.state.board[pos.y][pos.x];
    }
    // 获取所有合法移动目标
    getValidMoves(pos) {
        const piece = this.getPiece(pos);
        if (!piece || piece.side !== this.state.currentSide || this.state.gameOver) {
            return [];
        }
        const moves = [];
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                if (Rules.isValidMove(this.state.board, pos, { x, y })) {
                    if (!Rules.wouldBeInCheck(this.state.board, pos, { x, y }, piece.side)) {
                        moves.push({ x, y });
                    }
                }
            }
        }
        return moves;
    }
    // 执行移动
    makeMove(from, to) {
        if (this.state.gameOver)
            return false;
        const piece = this.getPiece(from);
        if (!piece || piece.side !== this.state.currentSide)
            return false;
        if (!Rules.isValidMove(this.state.board, from, to))
            return false;
        if (Rules.wouldBeInCheck(this.state.board, from, to, piece.side))
            return false;
        const captured = this.state.board[to.y][to.x] ?? undefined;
        const move = { from, to, piece, captured };
        // 执行移动
        this.state.board[to.y][to.x] = piece;
        this.state.board[from.y][from.x] = null;
        this.state.moveHistory.push(move);
        if (captured) {
            if (captured.side === 'red') {
                this.state.capturedRed.push(captured);
            }
            else {
                this.state.capturedBlack.push(captured);
            }
        }
        // 更新连续不吃子计数
        if (captured) {
            this.state.noCaptureCount = 0;
        }
        else {
            this.state.noCaptureCount++;
        }
        // 切换回合
        this.state.currentSide = this.state.currentSide === 'red' ? 'black' : 'red';
        // 检测对方是否被将军
        const enemySide = this.state.currentSide;
        this.state.check = Rules.isInCheck(this.state.board, enemySide);
        // 检测胜负（先检查将杀/困毙，再检查60回合自然限着）
        if (!Rules.hasLegalMoves(this.state.board, enemySide)) {
            this.state.gameOver = true;
            if (this.state.check) {
                // 将死
                this.state.winner = piece.side;
            }
            else {
                // 困毙，被困毙方输
                this.state.winner = piece.side;
            }
        }
        else if (this.state.noCaptureCount >= 120) {
            // 60回合自然限着（120步不吃子判和）
            this.state.gameOver = true;
            this.state.winner = null;
        }
        this.onStateChange?.();
        return true;
    }
    // 悔棋（回退一步）
    undo() {
        if (this.state.moveHistory.length === 0)
            return false;
        const move = this.state.moveHistory.pop();
        this.state.board[move.from.y][move.from.x] = move.piece;
        this.state.board[move.to.y][move.to.x] = move.captured || null;
        if (move.captured) {
            if (move.captured.side === 'red') {
                this.state.capturedRed.pop();
            }
            else {
                this.state.capturedBlack.pop();
            }
        }
        this.state.currentSide = this.state.currentSide === 'red' ? 'black' : 'red';
        this.state.gameOver = false;
        this.state.winner = null;
        // 重新计算连续不吃子计数
        this.state.noCaptureCount = 0;
        for (const m of this.state.moveHistory) {
            if (m.captured) {
                this.state.noCaptureCount = 0;
            }
            else {
                this.state.noCaptureCount++;
            }
        }
        this.state.check = Rules.isInCheck(this.state.board, this.state.currentSide);
        this.onStateChange?.();
        return true;
    }
    // 设置外部状态（用于联机接收对方移动）
    applyExternalMove(move) {
        if (this.state.gameOver)
            return false;
        if (!this.isInsideBoard(move.from) || !this.isInsideBoard(move.to))
            return false;
        const piece = this.state.board[move.from.y][move.from.x];
        if (!piece || piece.side !== this.state.currentSide)
            return false;
        if (piece.type !== move.piece.type || piece.side !== move.piece.side)
            return false;
        const target = this.state.board[move.to.y][move.to.x] ?? undefined;
        if (target?.type !== move.captured?.type || target?.side !== move.captured?.side)
            return false;
        if (!Rules.isValidMove(this.state.board, move.from, move.to))
            return false;
        if (Rules.wouldBeInCheck(this.state.board, move.from, move.to, piece.side))
            return false;
        this.state.board[move.to.y][move.to.x] = piece;
        this.state.board[move.from.y][move.from.x] = null;
        this.state.moveHistory.push(move);
        if (move.captured) {
            if (move.captured.side === 'red') {
                this.state.capturedRed.push(move.captured);
            }
            else {
                this.state.capturedBlack.push(move.captured);
            }
        }
        if (move.captured) {
            this.state.noCaptureCount = 0;
        }
        else {
            this.state.noCaptureCount++;
        }
        this.state.currentSide = this.state.currentSide === 'red' ? 'black' : 'red';
        const enemySide = this.state.currentSide;
        this.state.check = Rules.isInCheck(this.state.board, enemySide);
        if (!Rules.hasLegalMoves(this.state.board, enemySide)) {
            this.state.gameOver = true;
            if (this.state.check) {
                this.state.winner = move.piece.side;
            }
            else {
                this.state.winner = move.piece.side;
            }
        }
        else if (this.state.noCaptureCount >= 120) {
            this.state.gameOver = true;
            this.state.winner = null;
        }
        this.onStateChange?.();
        return true;
    }
    // 重置棋盘
    reset() {
        this.state = this.createInitialState();
        this.onStateChange?.();
    }
    loadCustomBoard(board, startingSide) {
        this.state = {
            board: board.map(row => [...row]),
            currentSide: startingSide,
            moveHistory: [],
            capturedRed: [],
            capturedBlack: [],
            gameOver: false,
            winner: null,
            check: false,
            noCaptureCount: 0,
        };
        this.state.check = Rules.isInCheck(this.state.board, this.state.currentSide);
        this.onStateChange?.();
    }
    // 序列化移动（用于网络传输）
    static serializeMove(move) {
        return JSON.stringify({
            from: move.from,
            to: move.to,
            piece: move.piece,
            captured: move.captured,
        });
    }
    static deserializeMove(data) {
        return JSON.parse(data);
    }
}
//# sourceMappingURL=board.js.map