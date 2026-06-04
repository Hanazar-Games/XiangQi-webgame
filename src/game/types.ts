export type Side = 'red' | 'black';

export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  type: PieceType;
  side: Side;
}

export type PieceType = 
  | 'king'    // 帅/将
  | 'advisor' // 士/仕
  | 'elephant'// 象/相
  | 'horse'   // 马
  | 'rook'    // 车
  | 'cannon'  // 炮
  | 'pawn';   // 兵/卒

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
}

export interface GameState {
  board: (Piece | null)[][];
  currentSide: Side;
  moveHistory: Move[];
  capturedRed: Piece[];
  capturedBlack: Piece[];
  gameOver: boolean;
  winner: Side | null;
  check: boolean;
  noCaptureCount: number; // 连续不吃子的步数（双方合计）
}

export const PIECE_NAMES: Record<Side, Record<PieceType, string>> = {
  red: {
    king: '帅',
    advisor: '仕',
    elephant: '相',
    horse: '马',
    rook: '车',
    cannon: '炮',
    pawn: '兵',
  },
  black: {
    king: '将',
    advisor: '士',
    elephant: '象',
    horse: '马',
    rook: '车',
    cannon: '炮',
    pawn: '卒',
  },
};
