import { PIECE_NAMES } from './types.js';
export class Notation {
    constructor() {
        this.entries = [];
    }
    record(move) {
        const text = this.toNotation(move);
        this.entries.push({ text, move });
    }
    undo() {
        this.entries.pop();
    }
    clear() {
        this.entries = [];
    }
    getAll() {
        return [...this.entries];
    }
    getMoveAt(index) {
        return this.entries[index]?.move ?? null;
    }
    exportText() {
        const lines = ['[Game "Chinese Chess"]'];
        for (let i = 0; i < this.entries.length; i += 2) {
            const num = Math.floor(i / 2) + 1;
            const red = this.entries[i]?.text || '';
            const black = this.entries[i + 1]?.text || '';
            lines.push(`${num}. ${red} ${black}`);
        }
        return lines.join('\n');
    }
    // 简化的中文记谱法
    toNotation(move) {
        const { piece, from, to } = move;
        const name = PIECE_NAMES[piece.side][piece.type];
        // 坐标记谱法 (更简洁且不易歧义)
        const fromFile = piece.side === 'red' ? 9 - from.x : from.x + 1;
        const toFile = piece.side === 'red' ? 9 - to.x : to.x + 1;
        const fromRank = piece.side === 'red' ? 10 - from.y : from.y + 1;
        const toRank = piece.side === 'red' ? 10 - to.y : to.y + 1;
        let action;
        if (from.x === to.x) {
            const forward = piece.side === 'red' ? to.y < from.y : to.y > from.y;
            action = forward ? '进' : '退';
        }
        else {
            action = '平';
        }
        const targetNum = action === '平' ? toFile : Math.abs(toRank - fromRank);
        return `${name}${fromFile}${action}${targetNum}`;
    }
}
//# sourceMappingURL=notation.js.map