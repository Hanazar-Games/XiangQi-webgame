// 将坐标编码为单个字符 (0-9, a-z)
function encodeDigit(n) {
    return n.toString(36);
}
function decodeDigit(c) {
    return parseInt(c, 36);
}
export class MoveCodec {
    // 编码移动列表为紧凑字符串
    static encode(moves) {
        return moves.map(m => encodeDigit(m.from.x) +
            encodeDigit(m.from.y) +
            encodeDigit(m.to.x) +
            encodeDigit(m.to.y)).join('');
    }
    // 解码字符串为移动列表（需要初始棋盘来查找棋子）
    static decode(data, initialBoard) {
        const moves = [];
        const board = initialBoard.map(row => [...row]);
        for (let i = 0; i < data.length; i += 4) {
            if (i + 4 > data.length)
                break;
            const fromX = decodeDigit(data[i]);
            const fromY = decodeDigit(data[i + 1]);
            const toX = decodeDigit(data[i + 2]);
            const toY = decodeDigit(data[i + 3]);
            if (fromX > 8 || fromY > 9 || toX > 8 || toY > 9)
                break;
            const piece = board[fromY][fromX];
            if (!piece)
                break;
            const captured = board[toY][toX] || undefined;
            moves.push({ from: { x: fromX, y: fromY }, to: { x: toX, y: toY }, piece, captured });
            board[toY][toX] = piece;
            board[fromY][fromX] = null;
        }
        return moves;
    }
}
//# sourceMappingURL=codec.js.map