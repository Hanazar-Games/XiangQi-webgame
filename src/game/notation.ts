import { Move, Side, PIECE_NAMES } from './types.js';

export interface NotationEntry {
  text: string;
  move: Move;
}

export class Notation {
  private entries: NotationEntry[] = [];

  record(move: Move): void {
    const text = this.toNotation(move);
    this.entries.push({ text, move });
  }

  undo(): void {
    this.entries.pop();
  }

  clear(): void {
    this.entries = [];
  }

  getAll(): NotationEntry[] {
    return [...this.entries];
  }

  getMoveAt(index: number): Move | null {
    return this.entries[index]?.move ?? null;
  }

  exportText(): string {
    const lines: string[] = ['[Game "Chinese Chess"]'];
    for (let i = 0; i < this.entries.length; i += 2) {
      const num = Math.floor(i / 2) + 1;
      const red = this.entries[i]?.text || '';
      const black = this.entries[i + 1]?.text || '';
      lines.push(`${num}. ${red} ${black}`);
    }
    return lines.join('\n');
  }

  // 简化的中文记谱法
  private toNotation(move: Move): string {
    const { piece, from, to } = move;
    const name = PIECE_NAMES[piece.side][piece.type];

    // 坐标记谱法 (更简洁且不易歧义)
    const fromFile = piece.side === 'red' ? 9 - from.x : from.x + 1;
    const toFile = piece.side === 'red' ? 9 - to.x : to.x + 1;
    const fromRank = piece.side === 'red' ? 10 - from.y : from.y + 1;
    const toRank = piece.side === 'red' ? 10 - to.y : to.y + 1;

    let action: string;
    if (from.x === to.x) {
      action = to.y > from.y ? '进' : '退';
    } else {
      action = '平';
    }

    const targetNum = action === '平' ? toFile : Math.abs(toRank - fromRank);
    return `${name}${fromFile}${action}${targetNum}`;
  }
}
