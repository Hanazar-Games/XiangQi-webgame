import { Piece, Side } from './types.js';

// Zobrist 哈希：为每个(位置, 棋子类型, 颜色)组合生成随机64位值
export class Zobrist {
  private table: bigint[][][]; // [y][x][pieceIndex]
  private sideKey: bigint;

  constructor() {
    this.table = Array(10).fill(null).map(() =>
      Array(9).fill(null).map(() =>
        Array(14).fill(null).map(() => this.random64())
      )
    );
    this.sideKey = this.random64();
  }

  private random64(): bigint {
    // 使用简单的伪随机生成64位大整数
    let result = BigInt(0);
    for (let i = 0; i < 4; i++) {
      result = (result << BigInt(32)) | BigInt(Math.floor(Math.random() * 0x100000000));
    }
    return result;
  }

  hash(board: (Piece | null)[][], side: Side): bigint {
    let h = BigInt(0);
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const piece = board[y][x];
        if (piece) {
          h ^= this.table[y][x][this.pieceIndex(piece)];
        }
      }
    }
    if (side === 'black') {
      h ^= this.sideKey;
    }
    return h;
  }

  private pieceIndex(piece: Piece): number {
    const typeMap: Record<string, number> = {
      king: 0, advisor: 1, elephant: 2, horse: 3,
      rook: 4, cannon: 5, pawn: 6,
    };
    const base = typeMap[piece.type] ?? 0;
    return piece.side === 'red' ? base : base + 7;
  }
}
