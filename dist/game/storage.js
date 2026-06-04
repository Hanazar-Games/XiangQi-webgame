const SETTINGS_KEY = 'xiangqi_settings';
const HISTORY_KEY = 'xiangqi_history';
const PUZZLE_KEY = 'xiangqi_puzzles';
const RESUME_KEY = 'xiangqi_resume';
const MAX_HISTORY = 20;
export class Storage {
    static loadSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (raw)
                return JSON.parse(raw);
        }
        catch { }
        return {
            sound: true,
            flipped: false,
            coords: false,
            difficulty: 'normal',
            theme: 0,
        };
    }
    static saveSettings(settings) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        }
        catch { }
    }
    static addHistory(moves, mode, winner) {
        try {
            const history = this.loadHistory();
            history.unshift({
                date: new Date().toISOString(),
                moves,
                mode,
                winner,
            });
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
}
//# sourceMappingURL=storage.js.map