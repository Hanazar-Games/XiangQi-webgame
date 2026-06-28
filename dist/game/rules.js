export class Rules {
    static isInsideBoard(pos) {
        return Number.isInteger(pos.x) && Number.isInteger(pos.y) &&
            pos.x >= 0 && pos.x <= 8 && pos.y >= 0 && pos.y <= 9;
    }
    static isValidMove(board, from, to) {
        if (!this.isInsideBoard(from) || !this.isInsideBoard(to))
            return false;
        const piece = board[from.y][from.x];
        if (!piece)
            return false;
        const target = board[to.y][to.x];
        if (target && target.side === piece.side)
            return false;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        switch (piece.type) {
            case 'king':
                return this.isValidKingMove(board, from, to, piece.side);
            case 'advisor':
                return this.isValidAdvisorMove(from, to, piece.side);
            case 'elephant':
                return this.isValidElephantMove(board, from, to, piece.side);
            case 'horse':
                return this.isValidHorseMove(board, from, to);
            case 'rook':
                return this.isValidRookMove(board, from, to);
            case 'cannon':
                return this.isValidCannonMove(board, from, to);
            case 'pawn':
                return this.isValidPawnMove(from, to, piece.side);
            default:
                return false;
        }
    }
    static kingsFaceEachOther(board, pos, side) {
        const enemySide = side === 'red' ? 'black' : 'red';
        for (let y = 0; y < 10; y++) {
            const piece = board[y][pos.x];
            if (piece && piece.type === 'king' && piece.side === enemySide) {
                // 检查中间是否有子
                const minY = Math.min(pos.y, y);
                const maxY = Math.max(pos.y, y);
                for (let yy = minY + 1; yy < maxY; yy++) {
                    if (board[yy][pos.x])
                        return false;
                }
                return true;
            }
        }
        return false;
    }
    static isValidKingMove(board, from, to, side) {
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        // 只能横竖一步
        if (!((dx === 1 && dy === 0) || (dx === 0 && dy === 1))) {
            // 特殊情况：将帅照面（飞将）
            if (dx === 0) {
                const target = board[to.y][to.x];
                if (target && target.type === 'king' && target.side !== side) {
                    // 检查中间是否有子
                    const minY = Math.min(from.y, to.y);
                    const maxY = Math.max(from.y, to.y);
                    for (let y = minY + 1; y < maxY; y++) {
                        if (board[y][from.x])
                            return false;
                    }
                    return true;
                }
            }
            return false;
        }
        // 不出九宫
        if (side === 'red') {
            if (to.x < 3 || to.x > 5 || to.y < 7 || to.y > 9)
                return false;
        }
        else {
            if (to.x < 3 || to.x > 5 || to.y < 0 || to.y > 2)
                return false;
        }
        // 不能飞将
        if (this.kingsFaceEachOther(board, to, side))
            return false;
        return true;
    }
    static isValidAdvisorMove(from, to, side) {
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        if (dx !== 1 || dy !== 1)
            return false;
        if (side === 'red') {
            if (to.x < 3 || to.x > 5 || to.y < 7 || to.y > 9)
                return false;
        }
        else {
            if (to.x < 3 || to.x > 5 || to.y < 0 || to.y > 2)
                return false;
        }
        return true;
    }
    static isValidElephantMove(board, from, to, side) {
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        if (dx !== 2 || dy !== 2)
            return false;
        // 不能过河
        if (side === 'red' && to.y < 5)
            return false;
        if (side === 'black' && to.y > 4)
            return false;
        // 塞象眼
        const eyeX = (from.x + to.x) / 2;
        const eyeY = (from.y + to.y) / 2;
        if (board[eyeY][eyeX])
            return false;
        return true;
    }
    static isValidHorseMove(board, from, to) {
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        if (!((dx === 2 && dy === 1) || (dx === 1 && dy === 2)))
            return false;
        // 蹩马腿
        let blockX, blockY;
        if (dx === 2) {
            blockX = from.x + (to.x > from.x ? 1 : -1);
            blockY = from.y;
        }
        else {
            blockX = from.x;
            blockY = from.y + (to.y > from.y ? 1 : -1);
        }
        if (board[blockY][blockX])
            return false;
        return true;
    }
    static isValidRookMove(board, from, to) {
        if (from.x !== to.x && from.y !== to.y)
            return false;
        if (from.x === to.x) {
            const minY = Math.min(from.y, to.y);
            const maxY = Math.max(from.y, to.y);
            for (let y = minY + 1; y < maxY; y++) {
                if (board[y][from.x])
                    return false;
            }
        }
        else {
            const minX = Math.min(from.x, to.x);
            const maxX = Math.max(from.x, to.x);
            for (let x = minX + 1; x < maxX; x++) {
                if (board[from.y][x])
                    return false;
            }
        }
        return true;
    }
    static isValidCannonMove(board, from, to) {
        if (from.x !== to.x && from.y !== to.y)
            return false;
        let count = 0;
        if (from.x === to.x) {
            const minY = Math.min(from.y, to.y);
            const maxY = Math.max(from.y, to.y);
            for (let y = minY + 1; y < maxY; y++) {
                if (board[y][from.x])
                    count++;
            }
        }
        else {
            const minX = Math.min(from.x, to.x);
            const maxX = Math.max(from.x, to.x);
            for (let x = minX + 1; x < maxX; x++) {
                if (board[from.y][x])
                    count++;
            }
        }
        const target = board[to.y][to.x];
        if (!target) {
            return count === 0;
        }
        else {
            return count === 1;
        }
    }
    static isValidPawnMove(from, to, side) {
        const dx = Math.abs(to.x - from.x);
        const dy = to.y - from.y;
        if (side === 'red') {
            // 红方在上边(y大)，往前走是y-1
            if (from.y >= 5) {
                // 未过河，只能前进
                return dx === 0 && dy === -1;
            }
            else {
                // 已过河，可以前进或横走
                return (dx === 0 && dy === -1) || (dx === 1 && dy === 0);
            }
        }
        else {
            // 黑方在下边(y小)，往前走是y+1
            if (from.y <= 4) {
                return dx === 0 && dy === 1;
            }
            else {
                return (dx === 0 && dy === 1) || (dx === 1 && dy === 0);
            }
        }
    }
    // 模拟移动后是否被将军
    static wouldBeInCheck(board, from, to, side) {
        if (!this.isInsideBoard(from) || !this.isInsideBoard(to))
            return true;
        const newBoard = board.map(row => [...row]);
        const piece = newBoard[from.y][from.x];
        if (!piece)
            return true;
        newBoard[to.y][to.x] = piece;
        newBoard[from.y][from.x] = null;
        return this.isInCheck(newBoard, side);
    }
    // 检测某一方是否被将军
    static isInCheck(board, side) {
        const kingPos = this.findKing(board, side);
        if (!kingPos)
            return false;
        const enemySide = side === 'red' ? 'black' : 'red';
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = board[y][x];
                if (piece && piece.side === enemySide) {
                    if (this.isValidMoveWithoutCheck(board, { x, y }, kingPos)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    static isValidMoveWithoutCheck(board, from, to) {
        if (!this.isInsideBoard(from) || !this.isInsideBoard(to))
            return false;
        const piece = board[from.y][from.x];
        if (!piece)
            return false;
        const target = board[to.y][to.x];
        if (target && target.side === piece.side)
            return false;
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        switch (piece.type) {
            case 'king': {
                if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                    const inPalace = piece.side === 'red'
                        ? to.x >= 3 && to.x <= 5 && to.y >= 7 && to.y <= 9
                        : to.x >= 3 && to.x <= 5 && to.y >= 0 && to.y <= 2;
                    if (!inPalace)
                        return false;
                    // 不能飞将
                    if (this.kingsFaceEachOther(board, to, piece.side))
                        return false;
                    return true;
                }
                if (dx === 0 && target && target.type === 'king') {
                    const minY = Math.min(from.y, to.y);
                    const maxY = Math.max(from.y, to.y);
                    for (let y = minY + 1; y < maxY; y++) {
                        if (board[y][from.x])
                            return false;
                    }
                    return true;
                }
                return false;
            }
            case 'advisor': {
                if (dx !== 1 || dy !== 1)
                    return false;
                if (piece.side === 'red') {
                    return to.x >= 3 && to.x <= 5 && to.y >= 7 && to.y <= 9;
                }
                else {
                    return to.x >= 3 && to.x <= 5 && to.y >= 0 && to.y <= 2;
                }
            }
            case 'elephant': {
                if (dx !== 2 || dy !== 2)
                    return false;
                if (piece.side === 'red' && to.y < 5)
                    return false;
                if (piece.side === 'black' && to.y > 4)
                    return false;
                const eyeX = (from.x + to.x) / 2;
                const eyeY = (from.y + to.y) / 2;
                return !board[eyeY][eyeX];
            }
            case 'horse': {
                if (!((dx === 2 && dy === 1) || (dx === 1 && dy === 2)))
                    return false;
                let blockX, blockY;
                if (dx === 2) {
                    blockX = from.x + (to.x > from.x ? 1 : -1);
                    blockY = from.y;
                }
                else {
                    blockX = from.x;
                    blockY = from.y + (to.y > from.y ? 1 : -1);
                }
                return !board[blockY][blockX];
            }
            case 'rook':
                return this.isValidRookMove(board, from, to);
            case 'cannon': {
                if (from.x !== to.x && from.y !== to.y)
                    return false;
                let count = 0;
                if (from.x === to.x) {
                    const minY = Math.min(from.y, to.y);
                    const maxY = Math.max(from.y, to.y);
                    for (let y = minY + 1; y < maxY; y++) {
                        if (board[y][from.x])
                            count++;
                    }
                }
                else {
                    const minX = Math.min(from.x, to.x);
                    const maxX = Math.max(from.x, to.x);
                    for (let x = minX + 1; x < maxX; x++) {
                        if (board[from.y][x])
                            count++;
                    }
                }
                const t = board[to.y][to.x];
                return t ? count === 1 : count === 0;
            }
            case 'pawn': {
                const pdx = Math.abs(to.x - from.x);
                const pdy = to.y - from.y;
                if (piece.side === 'red') {
                    if (from.y >= 5) {
                        return pdx === 0 && pdy === -1;
                    }
                    else {
                        return (pdx === 0 && pdy === -1) || (pdx === 1 && pdy === 0);
                    }
                }
                else {
                    if (from.y <= 4) {
                        return pdx === 0 && pdy === 1;
                    }
                    else {
                        return (pdx === 0 && pdy === 1) || (pdx === 1 && pdy === 0);
                    }
                }
            }
            default:
                return false;
        }
    }
    static findKing(board, side) {
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = board[y][x];
                if (piece && piece.type === 'king' && piece.side === side) {
                    return { x, y };
                }
            }
        }
        return null;
    }
    // 检测某方是否有合法移动（用于判断困毙）
    static hasLegalMoves(board, side) {
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = board[y][x];
                if (piece && piece.side === side) {
                    for (let ty = 0; ty < 10; ty++) {
                        for (let tx = 0; tx < 9; tx++) {
                            if (this.isValidMove(board, { x, y }, { x: tx, y: ty })) {
                                if (!this.wouldBeInCheck(board, { x, y }, { x: tx, y: ty }, side)) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    }
}
//# sourceMappingURL=rules.js.map