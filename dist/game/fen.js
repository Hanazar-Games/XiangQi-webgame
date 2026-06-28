const FEN_MAP = {
    'K': ['king', 'red'], 'A': ['advisor', 'red'], 'B': ['elephant', 'red'],
    'N': ['horse', 'red'], 'R': ['rook', 'red'], 'C': ['cannon', 'red'],
    'P': ['pawn', 'red'],
    'k': ['king', 'black'], 'a': ['advisor', 'black'], 'b': ['elephant', 'black'],
    'n': ['horse', 'black'], 'r': ['rook', 'black'], 'c': ['cannon', 'black'],
    'p': ['pawn', 'black'],
};
const REV_FEN_MAP = {
    'king:red': 'K', 'advisor:red': 'A', 'elephant:red': 'B',
    'horse:red': 'N', 'rook:red': 'R', 'cannon:red': 'C', 'pawn:red': 'P',
    'king:black': 'k', 'advisor:black': 'a', 'elephant:black': 'b',
    'horse:black': 'n', 'rook:black': 'r', 'cannon:black': 'c', 'pawn:black': 'p',
};
export class FenCodec {
    static encode(board) {
        const rows = [];
        for (let y = 0; y < 10; y++) {
            let row = '';
            let empty = 0;
            for (let x = 0; x < 9; x++) {
                const piece = board[y][x];
                if (!piece) {
                    empty++;
                }
                else {
                    if (empty > 0) {
                        row += empty.toString();
                        empty = 0;
                    }
                    const key = `${piece.type}:${piece.side}`;
                    row += REV_FEN_MAP[key] ?? '?';
                }
            }
            if (empty > 0)
                row += empty.toString();
            rows.push(row);
        }
        return rows.join('/');
    }
    static decode(fen) {
        const parts = fen.trim().split(/\s+/);
        const rows = parts[0].split('/');
        if (rows.length !== 10)
            return null;
        const board = [];
        for (let y = 0; y < 10; y++) {
            const row = [];
            for (const char of rows[y]) {
                if (char >= '1' && char <= '9') {
                    for (let i = 0; i < parseInt(char, 10); i++) {
                        row.push(null);
                    }
                }
                else {
                    const mapped = FEN_MAP[char];
                    if (mapped) {
                        row.push({ type: mapped[0], side: mapped[1] });
                    }
                    else {
                        return null;
                    }
                }
            }
            if (row.length !== 9)
                return null;
            board.push(row);
        }
        const side = parts[1] === 'b' ? 'black' : 'red';
        return { board, side };
    }
}
//# sourceMappingURL=fen.js.map