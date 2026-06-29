export interface GameSettings {
  sound: boolean;
  bgm: boolean;
  flipped: boolean;
  coords: boolean;
  evaluation: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  theme: number;
}

export interface SavedGame {
  date: string;
  moves: string; // 记谱文本
  movesEncoded?: string; // MoveCodec 编码的紧凑字符串（用于复盘重建）
  initialFen?: string; // 初始局面，旧记录缺省为标准开局
  initialSide?: string;
  mode: string;
  winner: string | null;
}

export interface PuzzleRecord {
  puzzleIndex: number;
  date: string;
  steps: number;
  timeMs: number;
}

const SETTINGS_KEY = 'xiangqi_settings';
const HISTORY_KEY = 'xiangqi_history';
const PUZZLE_KEY = 'xiangqi_puzzles';
const RESUME_KEY = 'xiangqi_resume';
const CUSTOM_PUZZLES_KEY = 'xiangqi_custom_puzzles';
const MAX_HISTORY = 20;

export interface ResumeState {
  mode: string;
  mySide: string;
  moveHistory: string; // JSON string of Move[]
  currentSide: string;
  capturedRed: string;
  capturedBlack: string;
  noCaptureCount: number;
  timestamp: number;
}

export interface CustomPuzzle {
  id: string;
  name: string;
  description: string;
  board: ({ type: string; side: string } | null)[][]; // JSON-safe format
  side: string;
  createdAt: string;
}

export class Storage {
  static loadSettings(): GameSettings {
    const defaults: GameSettings = {
      sound: true,
      bgm: false,
      flipped: false,
      coords: false,
      evaluation: false,
      difficulty: 'normal',
      theme: 0,
    };
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch {}
    return defaults;
  }

  static saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }

  static addHistory(
    moves: string,
    mode: string,
    winner: string | null,
    movesEncoded?: string,
    initialFen?: string,
    initialSide?: string
  ): void {
    try {
      const history = this.loadHistory();
      const entry: SavedGame = {
        date: new Date().toISOString(),
        moves,
        mode,
        winner,
      };
      if (movesEncoded) entry.movesEncoded = movesEncoded;
      if (initialFen) entry.initialFen = initialFen;
      if (initialSide) entry.initialSide = initialSide;
      history.unshift(entry);
      if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {}
  }

  static loadHistory(): SavedGame[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  static clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
  }

  static savePuzzleRecord(index: number, steps: number, timeMs: number): void {
    try {
      const records = this.loadPuzzleRecords();
      records.push({ puzzleIndex: index, date: new Date().toISOString(), steps, timeMs });
      localStorage.setItem(PUZZLE_KEY, JSON.stringify(records));
    } catch {}
  }

  static loadPuzzleRecords(): PuzzleRecord[] {
    try {
      const raw = localStorage.getItem(PUZZLE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  static getBestPuzzleRecord(index: number): PuzzleRecord | null {
    const records = this.loadPuzzleRecords().filter(r => r.puzzleIndex === index);
    if (records.length === 0) return null;
    return records.reduce((best, r) => (r.steps < best.steps ? r : best));
  }

  static saveResumeState(state: ResumeState): void {
    try {
      localStorage.setItem(RESUME_KEY, JSON.stringify(state));
    } catch {}
  }

  static loadResumeState(): ResumeState | null {
    try {
      const raw = localStorage.getItem(RESUME_KEY);
      if (raw) {
        const state = JSON.parse(raw) as ResumeState;
        // 超过30分钟的不恢复
        if (Date.now() - state.timestamp < 30 * 60 * 1000) {
          return state;
        }
        localStorage.removeItem(RESUME_KEY);
      }
    } catch {}
    return null;
  }

  static clearResumeState(): void {
    try {
      localStorage.removeItem(RESUME_KEY);
    } catch {}
  }

  static saveCustomPuzzles(puzzles: CustomPuzzle[]): void {
    try {
      localStorage.setItem(CUSTOM_PUZZLES_KEY, JSON.stringify(puzzles));
    } catch {}
  }

  static loadCustomPuzzles(): CustomPuzzle[] {
    try {
      const raw = localStorage.getItem(CUSTOM_PUZZLES_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  static deleteCustomPuzzle(id: string): void {
    try {
      const puzzles = this.loadCustomPuzzles().filter(p => p.id !== id);
      this.saveCustomPuzzles(puzzles);
    } catch {}
  }
}
