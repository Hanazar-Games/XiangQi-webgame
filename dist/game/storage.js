const SETTINGS_KEY = 'xiangqi_settings';
const HISTORY_KEY = 'xiangqi_history';
const PUZZLE_KEY = 'xiangqi_puzzles';
const RESUME_KEY = 'xiangqi_resume';
const CUSTOM_PUZZLES_KEY = 'xiangqi_custom_puzzles';
const MAX_HISTORY = 20;
export class Storage {
    static loadSettings() {
        const defaults = {
            sound: true,
            bgm: false,
            flipped: false,
            coords: false,
            evaluation: false,
            difficulty: 'normal',
            theme: 0,
            timeLimitMinutes: 30,
        };
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (raw) {
                const settings = { ...defaults, ...JSON.parse(raw) };
                settings.timeLimitMinutes = Number.isFinite(settings.timeLimitMinutes)
                    ? Math.min(180, Math.max(1, Math.round(settings.timeLimitMinutes)))
                    : defaults.timeLimitMinutes;
                return settings;
            }
        }
        catch { }
        return defaults;
    }
    static saveSettings(settings) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        }
        catch { }
    }
    static addHistory(moves, mode, winner, movesEncoded, initialFen, initialSide) {
        try {
            const history = this.loadHistory();
            const entry = {
                date: new Date().toISOString(),
                moves,
                mode,
                winner,
            };
            if (movesEncoded)
                entry.movesEncoded = movesEncoded;
            if (initialFen)
                entry.initialFen = initialFen;
            if (initialSide)
                entry.initialSide = initialSide;
            history.unshift(entry);
            if (history.length > MAX_HISTORY)
                history.length = MAX_HISTORY;
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        }
        catch { }
    }
    static loadHistory() {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            if (raw)
                return JSON.parse(raw);
        }
        catch { }
        return [];
    }
    static clearHistory() {
        try {
            localStorage.removeItem(HISTORY_KEY);
        }
        catch { }
    }
    static savePuzzleRecord(index, steps, timeMs) {
        try {
            const records = this.loadPuzzleRecords();
            records.push({ puzzleIndex: index, date: new Date().toISOString(), steps, timeMs });
            localStorage.setItem(PUZZLE_KEY, JSON.stringify(records));
        }
        catch { }
    }
    static loadPuzzleRecords() {
        try {
            const raw = localStorage.getItem(PUZZLE_KEY);
            if (raw)
                return JSON.parse(raw);
        }
        catch { }
        return [];
    }
    static getBestPuzzleRecord(index) {
        const records = this.loadPuzzleRecords().filter(r => r.puzzleIndex === index);
        if (records.length === 0)
            return null;
        return records.reduce((best, r) => (r.steps < best.steps ? r : best));
    }
    static saveResumeState(state) {
        try {
            localStorage.setItem(RESUME_KEY, JSON.stringify(state));
        }
        catch { }
    }
    static loadResumeState() {
        try {
            const raw = localStorage.getItem(RESUME_KEY);
            if (raw) {
                const state = JSON.parse(raw);
                // 超过30分钟的不恢复
                if (Date.now() - state.timestamp < 30 * 60 * 1000) {
                    return state;
                }
                localStorage.removeItem(RESUME_KEY);
            }
        }
        catch { }
        return null;
    }
    static clearResumeState() {
        try {
            localStorage.removeItem(RESUME_KEY);
        }
        catch { }
    }
    static saveCustomPuzzles(puzzles) {
        try {
            localStorage.setItem(CUSTOM_PUZZLES_KEY, JSON.stringify(puzzles));
        }
        catch { }
    }
    static loadCustomPuzzles() {
        try {
            const raw = localStorage.getItem(CUSTOM_PUZZLES_KEY);
            if (raw)
                return JSON.parse(raw);
        }
        catch { }
        return [];
    }
    static deleteCustomPuzzle(id) {
        try {
            const puzzles = this.loadCustomPuzzles().filter(p => p.id !== id);
            this.saveCustomPuzzles(puzzles);
        }
        catch { }
    }
}
//# sourceMappingURL=storage.js.map