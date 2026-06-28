import { Rules } from './rules.js';
import { OpeningBook } from './openings.js';
import { Engine } from './engine.js';
export class AI {
    constructor(side, difficulty = 'normal') {
        this.openingBook = new OpeningBook();
        this.side = side;
        this.engine = new Engine(side);
        if (difficulty === 'easy') {
            this.engine.setTimeLimit(500);
        }
        else if (difficulty === 'normal') {
            this.engine.setTimeLimit(2000);
        }
        else {
            this.engine.setTimeLimit(6000);
        }
    }
    getMove(board) {
        const moves = this.getAllLegalMoves(board);
        if (moves.length === 0)
            return { move: null, info: null };
        if (this.side === 'black') {
            const blackMoveCount = board.state.moveHistory.filter(m => m.piece.side === 'black').length;
            // 开局库只包含黑方应法，红方AI直接进入搜索。
            if (blackMoveCount < 3) {
                const openingMove = this.openingBook.getMove(board.state.board, blackMoveCount);
                if (openingMove)
                    return { move: openingMove, info: null };
            }
        }
        // 使用搜索引擎
        const result = this.engine.search(board.state.board, 5);
        return { move: result.move, info: result };
    }
    getAllLegalMoves(board) {
        const moves = [];
        const state = board.state;
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = state.board[y][x];
                if (piece && piece.side === this.side) {
                    for (let ty = 0; ty < 10; ty++) {
                        for (let tx = 0; tx < 9; tx++) {
                            const from = { x, y };
                            const to = { x: tx, y: ty };
                            if (Rules.isValidMove(state.board, from, to)) {
                                if (!Rules.wouldBeInCheck(state.board, from, to, this.side)) {
                                    const captured = state.board[ty][tx] || undefined;
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
}
//# sourceMappingURL=ai.js.map