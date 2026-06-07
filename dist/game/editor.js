export function createEmptyBoard() {
    return Array(10).fill(null).map(() => Array(9).fill(null));
}
export function createStandardBoard() {
    const board = createEmptyBoard();
    const blackPieces = [
        [0, 0, 'rook'], [1, 0, 'horse'], [2, 0, 'elephant'],
        [3, 0, 'advisor'], [4, 0, 'king'], [5, 0, 'advisor'],
        [6, 0, 'elephant'], [7, 0, 'horse'], [8, 0, 'rook'],
        [1, 2, 'cannon'], [7, 2, 'cannon'],
        [0, 3, 'pawn'], [2, 3, 'pawn'], [4, 3, 'pawn'],
        [6, 3, 'pawn'], [8, 3, 'pawn'],
    ];
    const redPieces = [
        [0, 9, 'rook'], [1, 9, 'horse'], [2, 9, 'elephant'],
        [3, 9, 'advisor'], [4, 9, 'king'], [5, 9, 'advisor'],
        [6, 9, 'elephant'], [7, 9, 'horse'], [8, 9, 'rook'],
        [1, 7, 'cannon'], [7, 7, 'cannon'],
        [0, 6, 'pawn'], [2, 6, 'pawn'], [4, 6, 'pawn'],
        [6, 6, 'pawn'], [8, 6, 'pawn'],
    ];
    for (const [x, y, type] of blackPieces)
        board[y][x] = { type, side: 'black' };
    for (const [x, y, type] of redPieces)
        board[y][x] = { type, side: 'red' };
    return board;
}
export function cloneBoard(board) {
    return board.map(row => [...row]);
}
export function placePiece(board, pos, piece) {
    board[pos.y][pos.x] = piece;
}
const VALID_TYPES = ['king', 'advisor', 'elephant', 'horse', 'rook', 'cannon', 'pawn'];
const VALID_SIDES = ['red', 'black'];
export function validateBoard(board) {
    const errors = [];
    let redKing = 0;
    let blackKing = 0;
    let redKingPos = null;
    let blackKingPos = null;
    // 棋盘结构校验
    if (!Array.isArray(board) || board.length !== 10) {
        errors.push('棋盘数据结构错误：必须为10行');
        return { valid: false, errors };
    }
    for (let y = 0; y < 10; y++) {
        if (!Array.isArray(board[y]) || board[y].length !== 9) {
            errors.push(`棋盘数据结构错误：第${y + 1}行必须为9列`);
            continue;
        }
        for (let x = 0; x < 9; x++) {
            const piece = board[y][x];
            if (!piece)
                continue;
            // 非法棋子数据校验
            if (!VALID_TYPES.includes(piece.type)) {
                errors.push(`位置(${x},${y})存在非法棋子类型`);
            }
            if (!VALID_SIDES.includes(piece.side)) {
                errors.push(`位置(${x},${y})存在非法阵营`);
            }
            if (piece.type === 'king') {
                if (piece.side === 'red') {
                    redKing++;
                    redKingPos = { x, y };
                    if (x < 3 || x > 5 || y < 7 || y > 9) {
                        errors.push('红帅不在九宫范围内');
                    }
                }
                else {
                    blackKing++;
                    blackKingPos = { x, y };
                    if (x < 3 || x > 5 || y < 0 || y > 2) {
                        errors.push('黑将不在九宫范围内');
                    }
                }
            }
            else if (piece.type === 'advisor') {
                if (piece.side === 'red' && (x < 3 || x > 5 || y < 7 || y > 9)) {
                    errors.push(`红仕(${x},${y})不在九宫范围内`);
                }
                if (piece.side === 'black' && (x < 3 || x > 5 || y < 0 || y > 2)) {
                    errors.push(`黑士(${x},${y})不在九宫范围内`);
                }
            }
            else if (piece.type === 'elephant') {
                if (piece.side === 'red' && y < 5) {
                    errors.push(`红相(${x},${y})不能过河`);
                }
                if (piece.side === 'black' && y > 4) {
                    errors.push(`黑象(${x},${y})不能过河`);
                }
            }
        }
    }
    if (redKing === 0)
        errors.push('红方缺少帅');
    else if (redKing > 1)
        errors.push(`红方有 ${redKing} 个帅，只能有1个`);
    if (blackKing === 0)
        errors.push('黑方缺少将');
    else if (blackKing > 1)
        errors.push(`黑方有 ${blackKing} 个将，只能有1个`);
    if (redKingPos && blackKingPos) {
        if (redKingPos.x === blackKingPos.x) {
            let clear = true;
            const minY = Math.min(redKingPos.y, blackKingPos.y);
            const maxY = Math.max(redKingPos.y, blackKingPos.y);
            for (let y = minY + 1; y < maxY; y++) {
                if (board[y][redKingPos.x]) {
                    clear = false;
                    break;
                }
            }
            if (clear)
                errors.push('将帅不能直接照面');
        }
    }
    return { valid: errors.length === 0, errors };
}
export const BRUSH_PIECES = [
    { side: 'red', type: 'king', label: '帅' },
    { side: 'red', type: 'advisor', label: '仕' },
    { side: 'red', type: 'elephant', label: '相' },
    { side: 'red', type: 'horse', label: '马' },
    { side: 'red', type: 'rook', label: '车' },
    { side: 'red', type: 'cannon', label: '炮' },
    { side: 'red', type: 'pawn', label: '兵' },
    { side: 'black', type: 'king', label: '将' },
    { side: 'black', type: 'advisor', label: '士' },
    { side: 'black', type: 'elephant', label: '象' },
    { side: 'black', type: 'horse', label: '马' },
    { side: 'black', type: 'rook', label: '车' },
    { side: 'black', type: 'cannon', label: '炮' },
    { side: 'black', type: 'pawn', label: '卒' },
];
//# sourceMappingURL=editor.js.map