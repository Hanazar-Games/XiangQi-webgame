import { Board } from './game/board.js';
import { Renderer } from './game/renderer.js';
import { AI } from './game/ai.js';
import { Engine } from './game/engine.js';
import { P2PConnection, wrapMessage, parseMessage } from './network/webrtc.js';
import { AudioManager } from './game/audio.js';
import { Animator } from './game/animation.js';
import { Notation } from './game/notation.js';
import { Storage } from './game/storage.js';
import { ALL_PUZZLES } from './game/puzzles.js';
import { ALL_THEMES } from './game/themes.js';
import { MoveCodec } from './game/codec.js';
import { FenCodec } from './game/fen.js';
import { PIECE_NAMES } from './game/types.js';
import { Rules } from './game/rules.js';
import { createEmptyBoard, createStandardBoard, BRUSH_PIECES, validateBoard } from './game/editor.js';
const DEFAULT_TIME_LIMIT_SECONDS = 30 * 60;
const MIN_TIME_LIMIT_MINUTES = 1;
const MAX_TIME_LIMIT_MINUTES = 180;
class GameApp {
    constructor() {
        this.mode = null;
        this.selectedPos = null;
        this.validMoves = [];
        this.hintMove = null;
        this.ai = null;
        this.mySide = null;
        this.p2p = null;
        this.isThinking = false;
        this.audio = new AudioManager();
        this.animator = new Animator(() => this.renderBoard());
        this.notation = new Notation();
        this.difficulty = 'normal';
        this.handicap = 'none';
        this.showEvaluation = false;
        this.lastEvalScore = 0;
        this.gameOverShown = false;
        this.reviewIndex = null;
        this.isReplaying = false;
        this.savedSettings = Storage.loadSettings();
        this.timeRed = DEFAULT_TIME_LIMIT_SECONDS;
        this.timeBlack = DEFAULT_TIME_LIMIT_SECONDS;
        this.timerInterval = null;
        this.aiVsAiInterval = null;
        this.aiRed = null;
        this.aiBlack = null;
        this.puzzleStartTime = 0;
        this.editorBrush = null;
        this.editorBoard = createEmptyBoard();
        this.editorSide = 'red';
        this.editorCanvasParent = null;
        this.initialSide = 'red';
        this.currentPuzzleIndex = null;
        this.canvas = document.getElementById('board-canvas');
        this.renderer = new Renderer(this.canvas);
        this.board = new Board(() => this.onStateChange());
        this.initialBoard = this.cloneBoard(this.board.state.board);
        this.initialSide = this.board.state.currentSide;
        this.screens = {
            menu: document.getElementById('main-menu'),
            game: document.getElementById('game-screen'),
            lan: document.getElementById('lan-screen'),
            rules: document.getElementById('rules-screen'),
            puzzle: document.getElementById('puzzle-screen'),
            history: document.getElementById('history-screen'),
            editor: document.getElementById('editor-screen'),
            announcements: document.getElementById('announcements-screen'),
        };
        this.notationEl = document.getElementById('notation-list');
        this.soundToggle = document.getElementById('sound-toggle');
        this.bgmToggle = document.getElementById('bgm-toggle');
        this.setupEventListeners();
        this.loadSettings();
        this.parseUrlParams();
        this.setupKeyboardShortcuts();
        this.checkResumeState();
        this.renderBoard();
        window.addEventListener('resize', () => {
            if (this.renderer.handleResize()) {
                this.renderBoard();
            }
        });
    }
    setupEventListeners() {
        // 菜单
        document.getElementById('btn-local-pvp').addEventListener('click', () => this.startGame('local-pvp'));
        document.getElementById('btn-local-ai').addEventListener('click', () => this.startGame('local-ai'));
        document.getElementById('btn-puzzles').addEventListener('click', () => this.showPuzzles());
        document.getElementById('btn-ai-vs-ai').addEventListener('click', () => this.startAiVsAi());
        document.getElementById('btn-lan-host').addEventListener('click', () => this.showLanHost());
        document.getElementById('btn-lan-join').addEventListener('click', () => this.showLanJoin());
        document.getElementById('btn-rules').addEventListener('click', () => this.showScreen('rules'));
        document.getElementById('btn-history').addEventListener('click', () => this.showHistory());
        document.getElementById('btn-announcements').addEventListener('click', () => this.showScreen('announcements'));
        document.getElementById('btn-announcements-back').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('btn-history-back').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('btn-clear-history').addEventListener('click', () => {
            if (confirm('确定要清空所有历史对局吗？')) {
                Storage.clearHistory();
                this.showHistory();
            }
        });
        // 主题选择
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                const el = e.currentTarget;
                el.classList.add('active');
                const themeIdx = parseInt(el.dataset.theme, 10);
                this.renderer.setTheme(ALL_THEMES[themeIdx]);
                this.renderBoard();
                this.saveSettings();
            });
        });
        // 难度选择
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.difficulty = e.currentTarget.dataset.diff;
                this.saveSettings();
            });
        });
        // 让子选择
        document.querySelectorAll('.handicap-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.handicap-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.handicap = e.currentTarget.dataset.handicap;
            });
        });
        // 游戏界面
        document.getElementById('btn-back').addEventListener('click', () => this.backToMenu());
        document.getElementById('btn-undo').addEventListener('click', () => this.undo());
        document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
        document.getElementById('btn-ai-pause').addEventListener('click', () => this.toggleAiPause());
        document.getElementById('ai-speed').addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            document.getElementById('ai-speed-label').textContent = (val / 1000).toFixed(1) + 's';
            if (this.aiVsAiInterval) {
                this.stopAiVsAi();
                this.startAiVsAiLoop();
            }
        });
        document.getElementById('btn-export').addEventListener('click', () => this.exportNotation());
        document.getElementById('btn-share').addEventListener('click', () => this.shareGame());
        document.getElementById('btn-hint').addEventListener('click', () => this.showHint());
        document.getElementById('btn-copy-fen').addEventListener('click', () => this.copyFen());
        document.getElementById('btn-import-fen').addEventListener('click', () => this.importFen());
        document.getElementById('btn-screenshot').addEventListener('click', () => this.takeScreenshot());
        document.getElementById('btn-return-game').addEventListener('click', () => this.returnToGame());
        document.getElementById('btn-review-prev').addEventListener('click', () => this.reviewStep(-1));
        document.getElementById('btn-review-next').addEventListener('click', () => this.reviewStep(1));
        document.getElementById('btn-send-chat').addEventListener('click', () => this.sendChat());
        document.getElementById('chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter')
                this.sendChat();
        });
        document.getElementById('btn-draw').addEventListener('click', () => this.requestDraw());
        document.getElementById('btn-resign').addEventListener('click', () => this.resign());
        document.getElementById('btn-modal-restart').addEventListener('click', () => {
            this.hideModal();
            this.restartGame();
        });
        document.getElementById('btn-modal-menu').addEventListener('click', () => {
            this.hideModal();
            this.backToMenu();
        });
        document.getElementById('btn-modal-analysis').addEventListener('click', () => {
            this.hideModal();
            this.startAnalysisFromCurrentGame();
        });
        document.getElementById('btn-analyze').addEventListener('click', () => this.analyzeCurrentPosition());
        this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        // 音效开关
        this.soundToggle.addEventListener('change', () => {
            this.audio.setEnabled(this.soundToggle.checked);
            this.saveSettings();
        });
        this.bgmToggle.addEventListener('change', () => {
            this.audio.setBgmEnabled(this.bgmToggle.checked);
            this.saveSettings();
        });
        // 翻转棋盘
        const flipToggle = document.getElementById('flip-toggle');
        flipToggle.addEventListener('change', () => {
            this.renderer.setFlipped(flipToggle.checked);
            this.renderBoard();
        });
        // 坐标显示
        const coordsToggle = document.getElementById('coords-toggle');
        coordsToggle.addEventListener('change', () => {
            this.renderer.setShowCoords(coordsToggle.checked);
            this.renderBoard();
            this.saveSettings();
        });
        // 评估显示
        const evalToggle = document.getElementById('eval-toggle');
        if (evalToggle) {
            evalToggle.addEventListener('change', () => {
                this.showEvaluation = evalToggle.checked;
                this.updateGameInfo();
                this.saveSettings();
            });
        }
        const timeLimitInput = document.getElementById('time-limit-minutes');
        timeLimitInput.addEventListener('change', () => {
            timeLimitInput.value = String(this.getTimeLimitMinutesFromInput());
            this.saveSettings();
            this.savedSettings = Storage.loadSettings();
            this.resetTimers();
            this.updateGameInfo();
        });
        // 联机
        document.getElementById('btn-lan-back').addEventListener('click', () => this.backToMenu());
        document.getElementById('btn-copy-offer').addEventListener('click', () => this.copyText('host-offer'));
        document.getElementById('btn-connect-host').addEventListener('click', () => this.hostConnect());
        document.getElementById('btn-get-answer').addEventListener('click', () => this.joinGetAnswer());
        document.getElementById('btn-copy-answer').addEventListener('click', () => this.copyText('join-answer'));
        // 残局
        document.getElementById('btn-puzzle-back').addEventListener('click', () => this.backToMenu());
        // 规则
        document.getElementById('btn-rules-back').addEventListener('click', () => this.backToMenu());
        // 记谱列表事件委托（只绑定一次）
        this.notationEl.addEventListener('click', (e) => {
            const target = e.target.closest('[data-index]');
            if (target) {
                const idx = parseInt(target.dataset.index, 10);
                this.jumpToMove(idx);
            }
        });
        // 历史对局列表事件委托（只绑定一次）
        document.getElementById('history-list').addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-analysis');
            if (!btn || btn.disabled)
                return;
            e.stopPropagation();
            const idx = parseInt(btn.dataset.index, 10);
            this.startAnalysisFromHistory(idx);
        });
        // 残局列表事件委托（只绑定一次）
        document.getElementById('puzzle-list').addEventListener('click', (e) => {
            const target = e.target;
            const deleteBtn = target.closest('.puzzle-delete-btn');
            if (deleteBtn) {
                e.stopPropagation();
                const id = deleteBtn.dataset.deleteId;
                if (confirm('确定要删除这个自定义残局吗？')) {
                    Storage.deleteCustomPuzzle(id);
                    this.showPuzzles();
                }
                return;
            }
            const card = target.closest('.puzzle-card');
            if (card) {
                const idx = parseInt(card.dataset.index, 10);
                this.startPuzzle(idx);
            }
        });
        // 摆盘模式事件
        document.getElementById('btn-editor').addEventListener('click', () => this.showEditor());
        document.getElementById('btn-editor-back').addEventListener('click', () => this.exitEditor());
        document.getElementById('btn-editor-clear').addEventListener('click', () => {
            this.editorBoard = createEmptyBoard();
            this.renderEditorBoard();
            this.validateEditor();
        });
        document.getElementById('btn-editor-standard').addEventListener('click', () => {
            this.editorBoard = createStandardBoard();
            this.renderEditorBoard();
            this.validateEditor();
        });
        document.getElementById('btn-editor-save').addEventListener('click', () => this.saveCustomPuzzle());
        document.getElementById('btn-editor-import-fen').addEventListener('click', () => this.importFenEditor());
        document.getElementById('btn-editor-copy-fen').addEventListener('click', () => this.exportFenEditor());
        document.getElementById('btn-editor-from-game').addEventListener('click', () => this.importFromCurrentGame());
        document.getElementById('btn-editor-play').addEventListener('click', () => this.startFromEditor());
        document.getElementById('btn-editor-side-red').addEventListener('click', () => {
            this.editorSide = 'red';
            this.updateEditorSideUI();
        });
        document.getElementById('btn-editor-side-black').addEventListener('click', () => {
            this.editorSide = 'black';
            this.updateEditorSideUI();
        });
        document.getElementById('editor-palette').addEventListener('click', (e) => {
            const target = e.target.closest('.piece-brush');
            if (!target)
                return;
            const type = target.dataset.type;
            const side = target.dataset.side;
            this.editorBrush = { type, side };
            this.updateEditorPaletteUI();
        });
        document.getElementById('btn-editor-erase').addEventListener('click', () => {
            this.editorBrush = 'erase';
            this.updateEditorPaletteUI();
        });
    }
    checkResumeState() {
        const resume = Storage.loadResumeState();
        if (!resume || resume.mode !== 'lan')
            return;
        if (!confirm('检测到上次未完成的联机对局，是否恢复查看？\n（注：需要重新创建房间才能继续对战）')) {
            Storage.clearResumeState();
            return;
        }
        try {
            const moves = JSON.parse(resume.moveHistory);
            this.mode = null; // 恢复查看模式，不关联任何对战模式
            this.mySide = resume.mySide;
            this.isReplaying = true;
            this.board.reset();
            for (const move of moves) {
                if (!this.board.applyExternalMove(move))
                    break;
                this.notation.record(move);
            }
            this.isReplaying = false;
            this.board.state.currentSide = resume.currentSide;
            this.board.state.noCaptureCount = resume.noCaptureCount;
            this.board.state.capturedRed = JSON.parse(resume.capturedRed);
            this.board.state.capturedBlack = JSON.parse(resume.capturedBlack);
            this.board.state.check = Rules.isInCheck(this.board.state.board, this.board.state.currentSide);
            // 如果已终局，同步终局状态
            if (this.board.state.gameOver) {
                this.gameOverShown = true;
            }
            Storage.clearResumeState(); // 加载成功后清除，避免重复恢复
            // 进入只读查看模式
            this.reviewIndex = this.board.state.moveHistory.length - 1;
            this.showScreen('game');
            this.updateGameInfo();
            this.renderBoard();
            this.updateCaptured();
            this.updateNotation();
            document.getElementById('review-overlay').classList.remove('hidden');
        }
        catch {
            Storage.clearResumeState();
            alert('恢复对局失败，记录可能已损坏');
        }
    }
    saveResumeState() {
        if (!this.mode?.startsWith('lan-'))
            return;
        if (this.board.state.gameOver) {
            Storage.clearResumeState();
            return;
        }
        const state = {
            mode: 'lan',
            mySide: this.mySide || 'red',
            moveHistory: JSON.stringify(this.board.state.moveHistory),
            currentSide: this.board.state.currentSide,
            capturedRed: JSON.stringify(this.board.state.capturedRed),
            capturedBlack: JSON.stringify(this.board.state.capturedBlack),
            noCaptureCount: this.board.state.noCaptureCount,
            timestamp: Date.now(),
        };
        Storage.saveResumeState(state);
    }
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
                return;
            switch (e.key.toLowerCase()) {
                case 'u':
                    this.undo();
                    break;
                case 'h':
                    if (!this.screens.game.classList.contains('active'))
                        return;
                    this.showHint();
                    break;
                case 'r':
                    if (!this.screens.game.classList.contains('active'))
                        return;
                    this.restartGame();
                    break;
                case 'escape':
                    this.backToMenu();
                    break;
                case 'arrowleft':
                    if (this.reviewIndex !== null) {
                        e.preventDefault();
                        this.reviewStep(-1);
                    }
                    break;
                case 'arrowright':
                case ' ':
                    if (this.reviewIndex !== null) {
                        e.preventDefault();
                        this.reviewStep(1);
                    }
                    break;
            }
        });
    }
    showScreen(name) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        this.screens[name]?.classList.add('active');
    }
    cloneBoard(board) {
        return board.map(row => row.map(piece => piece ? { ...piece } : null));
    }
    rememberInitialPosition() {
        this.initialBoard = this.cloneBoard(this.board.state.board);
        this.initialSide = this.board.state.currentSide;
    }
    resetToInitialPosition() {
        this.board.loadCustomBoard(this.cloneBoard(this.initialBoard), this.initialSide);
    }
    backToMenu() {
        this.hideModal();
        this.gameOverShown = false;
        this.reviewIndex = null;
        this.isThinking = false;
        this.hintMove = null;
        this.stopTimer();
        this.stopAiVsAi();
        this.p2p?.close();
        this.p2p = null;
        this.mode = null;
        this.ai = null;
        this.mySide = null;
        this.currentPuzzleIndex = null;
        this.board.reset();
        this.notation.clear();
        this.selectedPos = null;
        this.validMoves = [];
        this.animator.stop();
        this.editorBrush = null;
        // 将 canvas 移回游戏区域（如果它在编辑器中）
        if (this.editorCanvasParent && this.canvas.parentElement !== this.editorCanvasParent) {
            this.editorCanvasParent.appendChild(this.canvas);
        }
        this.editorCanvasParent = null;
        // 清空聊天消息和输入
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer)
            chatContainer.innerHTML = '';
        const chatInput = document.getElementById('chat-input');
        if (chatInput)
            chatInput.value = '';
        Storage.clearResumeState();
        this.showScreen('menu');
        this.loadSettings();
        this.rememberInitialPosition();
    }
    loadSettings() {
        this.savedSettings = Storage.loadSettings();
        this.audio.setEnabled(this.savedSettings.sound);
        this.audio.setBgmEnabled(this.savedSettings.bgm);
        this.renderer.setFlipped(this.savedSettings.flipped);
        this.renderer.setShowCoords(this.savedSettings.coords);
        this.renderer.setTheme(ALL_THEMES[this.savedSettings.theme ?? 0]);
        this.difficulty = this.savedSettings.difficulty;
        this.showEvaluation = this.savedSettings.evaluation;
        document.getElementById('sound-toggle').checked = this.savedSettings.sound;
        document.getElementById('bgm-toggle').checked = this.savedSettings.bgm;
        document.getElementById('flip-toggle').checked = this.savedSettings.flipped;
        document.getElementById('coords-toggle').checked = this.savedSettings.coords;
        document.getElementById('eval-toggle').checked = this.savedSettings.evaluation;
        document.getElementById('time-limit-minutes').value = String(this.savedSettings.timeLimitMinutes);
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.theme, 10) === (this.savedSettings.theme ?? 0));
        });
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.diff === this.difficulty);
        });
    }
    saveSettings() {
        Storage.saveSettings({
            sound: document.getElementById('sound-toggle').checked,
            bgm: document.getElementById('bgm-toggle').checked,
            flipped: document.getElementById('flip-toggle').checked,
            coords: document.getElementById('coords-toggle').checked,
            evaluation: document.getElementById('eval-toggle').checked,
            difficulty: this.difficulty,
            theme: parseInt(document.querySelector('.theme-btn.active')?.getAttribute('data-theme') || '0', 10),
            timeLimitMinutes: this.getTimeLimitMinutesFromInput(),
        });
    }
    getTimeLimitMinutesFromInput() {
        const input = document.getElementById('time-limit-minutes');
        const minutes = parseInt(input.value, 10);
        if (!Number.isFinite(minutes))
            return this.savedSettings.timeLimitMinutes;
        return Math.min(MAX_TIME_LIMIT_MINUTES, Math.max(MIN_TIME_LIMIT_MINUTES, minutes));
    }
    getTimeLimitSeconds() {
        const minutes = this.savedSettings.timeLimitMinutes;
        if (!Number.isFinite(minutes))
            return DEFAULT_TIME_LIMIT_SECONDS;
        return Math.min(MAX_TIME_LIMIT_MINUTES, Math.max(MIN_TIME_LIMIT_MINUTES, minutes)) * 60;
    }
    resetTimers() {
        const seconds = this.getTimeLimitSeconds();
        this.timeRed = seconds;
        this.timeBlack = seconds;
    }
    showHistory() {
        this.showScreen('history');
        const container = document.getElementById('history-list');
        const history = Storage.loadHistory();
        if (history.length === 0) {
            container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">暂无历史对局</p>';
            return;
        }
        container.innerHTML = history.map((h, i) => {
            const date = new Date(h.date).toLocaleString('zh-CN');
            const modeText = h.mode === 'local-pvp' ? '本地双人' : h.mode === 'local-ai' ? '人机对战' : h.mode === 'ai-vs-ai' ? 'AI观战' : '联机对战';
            const winnerText = h.winner === 'red' ? '红方胜' : h.winner === 'black' ? '黑方胜' : '和棋';
            const canAnalyze = !!h.movesEncoded;
            return `<div class="history-item" data-index="${i}">
        <div class="history-meta">${this.escapeHtml(date)} · ${modeText} · ${winnerText}</div>
        <div class="history-moves">${this.escapeHtml(h.moves.slice(0, 80))}${h.moves.length > 80 ? '...' : ''}</div>
        <div class="history-actions">
          <button class="btn-small btn-analysis" data-index="${i}" ${!canAnalyze ? 'disabled title="旧格式记录不支持分析"' : ''}>复盘分析</button>
        </div>
      </div>`;
        }).join('');
        // 事件委托已在构造函数中绑定
    }
    restartGame() {
        if (!this.mode)
            return;
        this.hideModal();
        this.gameOverShown = false;
        this.reviewIndex = null;
        this.isThinking = false;
        this.resetTimers();
        this.stopTimer();
        this.stopAiVsAi();
        this.board.reset();
        this.notation.clear();
        this.selectedPos = null;
        this.validMoves = [];
        this.animator.stop();
        if (this.currentPuzzleIndex !== null) {
            const puzzle = this.getPuzzlePosition(this.currentPuzzleIndex);
            if (!puzzle)
                return;
            this.board.loadCustomBoard(puzzle.board, puzzle.side);
            this.puzzleStartTime = performance.now();
        }
        if (this.mode === 'local-ai') {
            if (this.currentPuzzleIndex !== null) {
                const puzzle = this.getPuzzlePosition(this.currentPuzzleIndex);
                if (!puzzle)
                    return;
                this.ai = new AI(puzzle.side === 'red' ? 'black' : 'red', this.difficulty);
                this.mySide = puzzle.side;
            }
            else {
                this.ai = new AI('black', this.difficulty);
                this.mySide = 'red';
                this.applyHandicap();
            }
        }
        this.rememberInitialPosition();
        if (this.mode === 'ai-vs-ai') {
            this.startAiVsAiLoop();
        }
        if (this.mode !== 'lan-join') {
            this.renderer.setFlipped(false);
            document.getElementById('flip-toggle').checked = false;
        }
        this.updateGameInfo();
        this.renderBoard();
        this.updateCaptured();
        this.updateNotation();
        if (this.mode === 'local-ai' && this.currentPuzzleIndex !== null) {
            const puzzle = this.getPuzzlePosition(this.currentPuzzleIndex);
            if (puzzle && this.board.state.currentSide !== puzzle.side) {
                this.checkAI();
            }
        }
    }
    showPuzzles() {
        this.showScreen('puzzle');
        const container = document.getElementById('puzzle-list');
        const categories = ['杀法', '巧胜', '和棋', '自定义'];
        let html = '';
        for (const cat of categories) {
            const customPuzzles = cat === '自定义' ? Storage.loadCustomPuzzles() : [];
            let items = cat === '自定义' ? customPuzzles : ALL_PUZZLES.filter(p => p.category === cat);
            if (items.length === 0)
                continue;
            html += `<h3 class="puzzle-category">${cat} (${items.length}道)</h3>`;
            html += `<div class="puzzle-grid">`;
            for (let i = 0; i < items.length; i++) {
                const p = items[i];
                const idx = cat === '自定义' ? 1000 + i : ALL_PUZZLES.indexOf(p);
                const diff = p.difficulty ?? 1;
                const stars = '★'.repeat(diff) + '☆'.repeat(3 - diff);
                const best = cat === '自定义' ? null : Storage.getBestPuzzleRecord(idx);
                const recordHtml = best
                    ? `<span class="puzzle-best">最佳: ${best.steps}步 / ${(best.timeMs / 1000).toFixed(1)}秒</span>`
                    : '';
                const deleteBtn = cat === '自定义'
                    ? `<button class="puzzle-delete-btn" data-delete-id="${this.escapeAttr(String(p.id ?? ''))}" title="删除">✕</button>`
                    : '';
                html += `<div class="puzzle-card" data-index="${idx}">
          <div class="puzzle-card-header">
            <div class="puzzle-name">${this.escapeHtml(String(p.name ?? '未命名残局'))}</div>
            ${deleteBtn}
          </div>
          <div class="puzzle-stars">${stars} ${recordHtml}</div>
          <div class="puzzle-desc">${this.escapeHtml(String(p.description ?? ''))}</div>
        </div>`;
            }
            html += `</div>`;
        }
        container.innerHTML = html;
        // 事件委托已在构造函数中绑定
    }
    getPuzzlePosition(index) {
        if (index >= 1000) {
            const custom = Storage.loadCustomPuzzles();
            const p = custom[index - 1000];
            if (!p)
                return null;
            if (!Array.isArray(p.board) || p.board.length !== 10 || p.board.some(row => !Array.isArray(row) || row.length !== 9)) {
                return null;
            }
            const side = p.side === 'black' ? 'black' : 'red';
            const board = p.board.map(row => row.map(cell => {
                if (!cell)
                    return null;
                if (!['king', 'advisor', 'elephant', 'horse', 'rook', 'cannon', 'pawn'].includes(cell.type))
                    return null;
                if (cell.side !== 'red' && cell.side !== 'black')
                    return null;
                return { type: cell.type, side: cell.side };
            }));
            if (!validateBoard(board).valid)
                return null;
            return {
                board,
                side,
            };
        }
        const p = ALL_PUZZLES[index];
        if (!p)
            return null;
        return {
            board: this.cloneBoard(p.board),
            side: p.side,
        };
    }
    applyHandicap() {
        if (this.handicap === 'none')
            return;
        const board = this.board.state.board;
        const removals = [];
        if (this.handicap === 'horse') {
            removals.push([1, 0], [7, 0]);
        }
        else if (this.handicap === 'cannon') {
            removals.push([1, 2], [7, 2]);
        }
        else if (this.handicap === 'rook') {
            removals.push([0, 0], [8, 0]);
        }
        for (const [x, y] of removals) {
            if (board[y][x]?.side === 'black') {
                board[y][x] = null;
            }
        }
        this.renderBoard();
    }
    startPuzzle(index) {
        const puzzle = this.getPuzzlePosition(index);
        if (!puzzle)
            return;
        this.mode = 'local-ai';
        this.currentPuzzleIndex = index;
        this.puzzleStartTime = performance.now();
        this.gameOverShown = false;
        this.reviewIndex = null;
        this.resetTimers();
        this.stopTimer();
        this.board.loadCustomBoard(puzzle.board, puzzle.side);
        this.rememberInitialPosition();
        this.notation.clear();
        this.selectedPos = null;
        this.validMoves = [];
        this.animator.stop();
        const aiSide = puzzle.side === 'red' ? 'black' : 'red';
        this.ai = new AI(aiSide, this.difficulty);
        this.mySide = puzzle.side;
        this.showScreen('game');
        this.updateGameInfo();
        this.renderBoard();
        this.updateCaptured();
        this.updateNotation();
        if (this.board.state.currentSide === aiSide) {
            this.checkAI();
        }
    }
    startAiVsAi() {
        this.stopAiVsAi();
        this.mode = 'ai-vs-ai';
        this.gameOverShown = false;
        this.reviewIndex = null;
        this.resetTimers();
        this.stopTimer();
        this.board.reset();
        this.notation.clear();
        this.selectedPos = null;
        this.validMoves = [];
        this.animator.stop();
        this.mySide = null;
        this.aiRed = new AI('red', this.difficulty);
        this.aiBlack = new AI('black', this.difficulty);
        this.rememberInitialPosition();
        this.showScreen('game');
        this.updateGameInfo();
        this.renderBoard();
        this.updateCaptured();
        this.updateNotation();
        this.startAiVsAiLoop();
    }
    startAiVsAiLoop() {
        const speed = parseInt(document.getElementById('ai-speed').value, 10);
        const step = () => {
            if (!this.aiVsAiInterval || this.board.state.gameOver) {
                this.stopAiVsAi();
                return;
            }
            const side = this.board.state.currentSide;
            const ai = side === 'red' ? this.aiRed : this.aiBlack;
            if (!ai) {
                this.stopAiVsAi();
                return;
            }
            const result = ai.getMove(this.board);
            const move = result.move;
            if (move) {
                if (!this.board.makeMove(move.from, move.to)) {
                    this.stopAiVsAi();
                    return;
                }
                this.notation.record(move);
                if (move.captured) {
                    this.renderer.triggerCaptureEffect(move.to, move.piece.side);
                }
                this.renderBoard();
                this.updateGameInfo();
                this.updateCaptured();
                this.updateNotation();
                this.playMoveSound(move);
            }
            else if (!this.board.state.gameOver) {
                // AI无合法移动：判负
                this.board.state.gameOver = true;
                this.board.state.winner = side === 'red' ? 'black' : 'red';
                this.updateGameInfo();
                this.renderBoard();
                this.stopAiVsAi();
                return;
            }
            if (!this.board.state.gameOver) {
                this.aiVsAiInterval = setTimeout(step, speed);
            }
        };
        this.aiVsAiInterval = setTimeout(step, speed);
    }
    toggleAiPause() {
        if (this.aiVsAiInterval) {
            this.stopAiVsAi();
            document.getElementById('btn-ai-pause').textContent = '继续';
        }
        else if (this.mode === 'ai-vs-ai' && !this.board.state.gameOver) {
            this.startAiVsAiLoop();
            document.getElementById('btn-ai-pause').textContent = '暂停';
        }
    }
    stopAiVsAi() {
        if (this.aiVsAiInterval) {
            clearTimeout(this.aiVsAiInterval);
            this.aiVsAiInterval = null;
        }
    }
    // ==================== 摆盘模式 ====================
    showEditor() {
        this.mode = 'editor';
        this.editorBoard = createStandardBoard();
        this.editorSide = 'red';
        this.editorBrush = null;
        this.selectedPos = null;
        this.validMoves = [];
        // 移动 canvas 到编辑器区域
        this.editorCanvasParent = this.canvas.parentElement;
        const wrapper = document.getElementById('editor-board-wrapper');
        wrapper.appendChild(this.canvas);
        this.showScreen('editor');
        this.renderEditorPalette();
        this.updateEditorPaletteUI();
        this.updateEditorSideUI();
        this.renderEditorBoard();
        this.validateEditor();
    }
    exitEditor() {
        // 将 canvas 移回游戏区域
        if (this.editorCanvasParent) {
            this.editorCanvasParent.appendChild(this.canvas);
            this.editorCanvasParent = null;
        }
        this.mode = null;
        this.editorBrush = null;
        this.showScreen('menu');
        this.renderBoard();
    }
    renderEditorBoard() {
        // 构造临时 GameState 用于渲染
        const state = this.createEditorGameState();
        this.renderer.render(state, null, []);
    }
    createEditorGameState() {
        return {
            board: this.editorBoard,
            currentSide: this.editorSide,
            moveHistory: [],
            capturedRed: [],
            capturedBlack: [],
            gameOver: false,
            winner: null,
            check: false,
            noCaptureCount: 0,
        };
    }
    renderEditorPalette() {
        const palette = document.getElementById('editor-palette');
        let html = '';
        for (const p of BRUSH_PIECES) {
            const colorClass = p.side === 'red' ? 'red' : 'black';
            html += `<button class="piece-brush ${colorClass}" data-type="${p.type}" data-side="${p.side}">${p.label}</button>`;
        }
        palette.innerHTML = html;
    }
    updateEditorPaletteUI() {
        document.querySelectorAll('.piece-brush').forEach(el => {
            const btn = el;
            const isSelected = this.editorBrush && this.editorBrush !== 'erase' &&
                btn.dataset.type === this.editorBrush.type &&
                btn.dataset.side === this.editorBrush.side;
            btn.classList.toggle('active', !!isSelected);
        });
        const eraseBtn = document.getElementById('btn-editor-erase');
        eraseBtn.classList.toggle('active', this.editorBrush === 'erase');
    }
    updateEditorSideUI() {
        document.getElementById('btn-editor-side-red').classList.toggle('active', this.editorSide === 'red');
        document.getElementById('btn-editor-side-black').classList.toggle('active', this.editorSide === 'black');
    }
    validateEditor() {
        const result = validateBoard(this.editorBoard);
        const el = document.getElementById('editor-validation');
        if (result.valid) {
            el.className = 'editor-validation ok';
            el.textContent = '✓ 局面合法';
        }
        else {
            el.className = 'editor-validation error';
            el.innerHTML = result.errors.map(e => `<div>✗ ${e}</div>`).join('');
        }
    }
    saveCustomPuzzle() {
        const result = validateBoard(this.editorBoard);
        if (!result.valid) {
            alert('局面不合法，无法保存：\n' + result.errors.join('\n'));
            return;
        }
        const name = prompt('请输入残局名称：', '自定义残局')?.trim();
        if (!name)
            return;
        const boardForStorage = this.editorBoard.map(row => row.map(p => p ? { type: p.type, side: p.side } : null));
        const puzzle = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name,
            description: '用户自定义残局',
            board: boardForStorage,
            side: this.editorSide,
            createdAt: new Date().toISOString(),
        };
        const puzzles = Storage.loadCustomPuzzles();
        puzzles.push(puzzle);
        Storage.saveCustomPuzzles(puzzles);
        alert('保存成功！');
    }
    importFenEditor() {
        const fen = prompt('请输入 FEN 字符串：');
        if (!fen)
            return;
        try {
            const decoded = FenCodec.decode(fen);
            if (!decoded) {
                alert('FEN 解析失败：格式错误');
                return;
            }
            this.editorBoard = decoded.board;
            this.editorSide = decoded.side;
            this.renderEditorBoard();
            this.updateEditorSideUI();
            this.validateEditor();
        }
        catch (e) {
            alert('FEN 解析失败：' + (e instanceof Error ? e.message : String(e)));
        }
    }
    importFromCurrentGame() {
        // 从当前 board state 导入到编辑器
        this.editorBoard = this.board.state.board.map(row => [...row]);
        this.editorSide = this.board.state.currentSide;
        this.editorBrush = null;
        this.selectedPos = null;
        this.validMoves = [];
        this.renderEditorBoard();
        this.updateEditorSideUI();
        this.updateEditorPaletteUI();
        this.validateEditor();
    }
    exportFenEditor() {
        try {
            const boardFen = FenCodec.encode(this.editorBoard);
            const sidePart = this.editorSide === 'black' ? 'b' : 'r';
            const fen = `${boardFen} ${sidePart}`;
            navigator.clipboard.writeText(fen).then(() => alert('FEN 已复制到剪贴板')).catch(() => { prompt('FEN：', fen); });
        }
        catch (e) {
            alert('FEN 导出失败');
        }
    }
    startFromEditor() {
        const result = validateBoard(this.editorBoard);
        if (!result.valid) {
            alert('局面不合法，无法开始对局：\n' + result.errors.join('\n'));
            return;
        }
        // 将 canvas 移回游戏区域
        if (this.editorCanvasParent) {
            this.editorCanvasParent.appendChild(this.canvas);
            this.editorCanvasParent = null;
        }
        this.mode = 'local-ai';
        this.currentPuzzleIndex = null;
        this.hintMove = null;
        this.gameOverShown = false;
        this.reviewIndex = null;
        this.resetTimers();
        this.stopTimer();
        this.notation.clear();
        this.board.loadCustomBoard(this.editorBoard.map(row => [...row]), this.editorSide);
        this.rememberInitialPosition();
        this.selectedPos = null;
        this.validMoves = [];
        this.animator.stop();
        const aiSide = this.editorSide === 'red' ? 'black' : 'red';
        this.ai = new AI(aiSide, this.difficulty);
        this.mySide = this.editorSide;
        this.showScreen('game');
        this.updateGameInfo();
        this.renderBoard();
        this.updateCaptured();
        this.updateNotation();
        if (this.board.state.currentSide === aiSide) {
            this.checkAI();
        }
    }
    showModal(title, message) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('game-over-modal').classList.remove('hidden');
    }
    hideModal() {
        document.getElementById('game-over-modal').classList.add('hidden');
    }
    startGame(mode) {
        this.mode = mode;
        this.currentPuzzleIndex = null;
        this.hintMove = null;
        this.gameOverShown = false;
        this.reviewIndex = null;
        this.resetTimers();
        this.stopTimer();
        this.board.reset();
        this.notation.clear();
        this.selectedPos = null;
        this.validMoves = [];
        this.animator.stop();
        if (mode === 'local-ai') {
            this.ai = new AI('black', this.difficulty);
            this.mySide = 'red';
            this.applyHandicap();
        }
        else if (mode === 'lan-host') {
            this.mySide = 'red';
            // 红方恢复用户设置的翻转状态
            this.renderer.setFlipped(this.savedSettings.flipped);
            document.getElementById('flip-toggle').checked = this.savedSettings.flipped;
        }
        else if (mode === 'lan-join') {
            this.mySide = 'black';
            // 黑方自动翻转棋盘
            this.renderer.setFlipped(true);
            document.getElementById('flip-toggle').checked = true;
        }
        else {
            this.mySide = null;
        }
        this.rememberInitialPosition();
        this.showScreen('game');
        this.updateGameInfo();
        this.renderBoard();
        this.updateCaptured();
        this.updateNotation();
    }
    // ========== 联机 ==========
    async showLanHost() {
        this.p2p?.close();
        this.mode = 'lan-host';
        this.showScreen('lan');
        document.getElementById('lan-title').textContent = '创建房间（红方）';
        document.getElementById('lan-host-panel').classList.remove('hidden');
        document.getElementById('lan-join-panel').classList.add('hidden');
        document.getElementById('host-offer').value = '正在生成...';
        document.getElementById('lan-status').textContent = '';
        this.p2p = new P2PConnection((data) => this.onP2PMessage(data), (state) => this.onP2PStateChange(state));
        try {
            const offer = await this.p2p.createOffer();
            document.getElementById('host-offer').value = offer;
        }
        catch (e) {
            document.getElementById('lan-status').textContent = '生成失败: ' + e.message;
        }
    }
    async hostConnect() {
        if (!this.p2p)
            return;
        const answer = document.getElementById('host-answer').value.trim();
        if (!answer) {
            document.getElementById('lan-status').textContent = '请输入应答码';
            return;
        }
        try {
            await this.p2p.acceptAnswer(answer);
            document.getElementById('lan-status').textContent = '正在连接...';
        }
        catch (e) {
            document.getElementById('lan-status').textContent = '连接失败: ' + e.message;
        }
    }
    showLanJoin() {
        this.p2p?.close();
        this.mode = 'lan-join';
        this.showScreen('lan');
        document.getElementById('lan-title').textContent = '加入房间（黑方）';
        document.getElementById('lan-host-panel').classList.add('hidden');
        document.getElementById('lan-join-panel').classList.remove('hidden');
        document.getElementById('lan-status').textContent = '';
        this.p2p = new P2PConnection((data) => this.onP2PMessage(data), (state) => this.onP2PStateChange(state));
    }
    async joinGetAnswer() {
        if (!this.p2p)
            return;
        const offer = document.getElementById('join-offer').value.trim();
        if (!offer) {
            document.getElementById('lan-status').textContent = '请输入连接码';
            return;
        }
        try {
            const answer = await this.p2p.join(offer);
            document.getElementById('join-answer').value = answer;
            document.getElementById('lan-status').textContent = '请把应答码发给对方，等待连接...';
        }
        catch (e) {
            document.getElementById('lan-status').textContent = '生成失败: ' + e.message;
        }
    }
    onP2PMessage(data) {
        const msg = parseMessage(data);
        if (msg.type === 'invalid') {
            console.warn('Received invalid message:', data.slice(0, 200));
            return;
        }
        if (msg.type === 'move') {
            try {
                const move = JSON.parse(msg.payload);
                // 基本结构校验
                if (!this.isValidMoveShape(move)) {
                    console.error('Invalid move shape:', move);
                    this.showSystemChat('对方发送了格式错误的走子数据');
                    return;
                }
                if (!this.board.applyExternalMove(move)) {
                    console.error('Illegal move rejected:', move);
                    this.showSystemChat('对方发送了非法走子，已拒绝');
                    return;
                }
                this.notation.record(move);
                this.selectedPos = null;
                this.validMoves = [];
                this.renderBoard();
                this.updateGameInfo();
                this.updateCaptured();
                this.updateNotation();
                if (move.captured) {
                    this.renderer.triggerCaptureEffect(move.to, move.piece.side);
                }
                this.playMoveSound(move);
                this.saveResumeState();
            }
            catch (e) {
                console.error('Invalid move data:', e);
                this.showSystemChat('收到无法解析的走子数据');
            }
        }
        else if (msg.type === 'chat') {
            this.receiveChat(msg.payload, false);
        }
        else if (msg.type === 'draw-request') {
            this.handleDrawRequest();
        }
        else if (msg.type === 'draw-accept') {
            this.acceptDraw();
        }
        else if (msg.type === 'draw-decline') {
            alert('对方拒绝了和棋请求');
        }
        else if (msg.type === 'resign') {
            this.handleOpponentResign();
        }
    }
    isValidMoveShape(move) {
        if (!move || typeof move !== 'object')
            return false;
        const m = move;
        if (!m.from || !m.to || !m.piece)
            return false;
        const from = m.from;
        const to = m.to;
        const piece = m.piece;
        if (typeof from.x !== 'number' || typeof from.y !== 'number')
            return false;
        if (typeof to.x !== 'number' || typeof to.y !== 'number')
            return false;
        if (typeof piece.type !== 'string' || typeof piece.side !== 'string')
            return false;
        if (!Number.isInteger(from.x) || !Number.isInteger(from.y))
            return false;
        if (!Number.isInteger(to.x) || !Number.isInteger(to.y))
            return false;
        if (!['king', 'advisor', 'elephant', 'horse', 'rook', 'cannon', 'pawn'].includes(piece.type))
            return false;
        if (piece.side !== 'red' && piece.side !== 'black')
            return false;
        if (from.x < 0 || from.x > 8 || from.y < 0 || from.y > 9)
            return false;
        if (to.x < 0 || to.x > 8 || to.y < 0 || to.y > 9)
            return false;
        return true;
    }
    showSystemChat(text) {
        const container = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = 'chat-msg system';
        div.innerHTML = `<div class="sender" style="color:#f1c40f">系统</div><div>${this.escapeHtml(text)}</div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }
    onP2PStateChange(state) {
        const status = document.getElementById('lan-status');
        if (state === 'connected') {
            status.textContent = '连接成功！即将进入游戏...';
            setTimeout(() => {
                if (this.p2p?.isConnected()) {
                    this.startGame(this.mode === 'lan-host' ? 'lan-host' : 'lan-join');
                }
            }, 500);
        }
        else if (state === 'disconnected') {
            status.textContent = '连接已断开';
            if (this.screens.game.classList.contains('active')) {
                alert('对方已断开连接');
                this.backToMenu();
            }
        }
    }
    copyText(elementId) {
        const el = document.getElementById(elementId);
        el.select();
        document.execCommand('copy');
        const status = document.getElementById('lan-status');
        status.textContent = '已复制到剪贴板';
        setTimeout(() => status.textContent = '', 1500);
    }
    sendChat() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text || !this.p2p?.isConnected())
            return;
        this.p2p.send(wrapMessage('chat', text));
        this.receiveChat(text, true);
        input.value = '';
    }
    receiveChat(text, isSelf) {
        const container = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = `chat-msg ${isSelf ? 'self' : 'peer'}`;
        const sideLabel = isSelf
            ? (this.mySide === 'red' ? '红方' : '黑方')
            : (this.mySide === 'red' ? '黑方' : '红方');
        div.innerHTML = `<div class="sender">${sideLabel}</div><div>${this.escapeHtml(text)}</div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    escapeAttr(text) {
        return this.escapeHtml(text).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    // ========== 游戏交互 ==========
    onPointerDown(e) {
        // 使用 offsetX/offsetY（CSS像素，与canvas逻辑坐标一致）
        this.handleBoardClick(e.offsetX, e.offsetY);
    }
    handleBoardClick(x, y) {
        // 编辑器模式：放置/擦除棋子
        if (this.mode === 'editor') {
            const pos = this.renderer.toBoard(x, y);
            if (!pos)
                return;
            if (this.editorBrush === 'erase') {
                this.editorBoard[pos.y][pos.x] = null;
            }
            else if (this.editorBrush) {
                this.editorBoard[pos.y][pos.x] = this.editorBrush;
            }
            this.renderEditorBoard();
            this.validateEditor();
            return;
        }
        if (this.mode === 'ai-vs-ai')
            return; // AI观战模式禁止下棋
        if (this.reviewIndex !== null)
            return; // 回放模式禁止下棋
        if (this.board.state.gameOver)
            return;
        if (this.isThinking)
            return;
        // 点击棋盘清除提示
        this.hintMove = null;
        if (this.mode?.startsWith('lan-') && this.board.state.currentSide !== this.mySide) {
            return;
        }
        const pos = this.renderer.toBoard(x, y);
        if (!pos)
            return;
        if (this.selectedPos) {
            const isValid = this.validMoves.some(m => m.x === pos.x && m.y === pos.y);
            if (isValid) {
                this.executeMove(this.selectedPos, pos);
                return;
            }
        }
        const piece = this.board.getPiece(pos);
        if (piece && piece.side === this.board.state.currentSide) {
            this.selectedPos = pos;
            this.validMoves = this.board.getValidMoves(pos);
            this.renderBoard();
        }
        else {
            this.selectedPos = null;
            this.validMoves = [];
            this.renderBoard();
        }
    }
    executeMove(from, to) {
        const moveData = this.board.state.board[to.y][to.x];
        const move = {
            from,
            to,
            piece: this.board.getPiece(from),
            captured: moveData || undefined,
        };
        const success = this.board.makeMove(from, to);
        if (!success)
            return;
        this.notation.record(move);
        this.selectedPos = null;
        this.validMoves = [];
        // 动画
        this.animator.animate(move.piece, from, to, 180);
        this.renderBoard();
        this.updateGameInfo();
        this.updateCaptured();
        this.updateNotation();
        if (move.captured) {
            this.renderer.triggerCaptureEffect(move.to, move.piece.side);
        }
        this.playMoveSound(move);
        if (this.mode?.startsWith('lan-') && this.p2p) {
            const sent = this.p2p.send(wrapMessage('move', JSON.stringify(move)));
            if (!sent) {
                this.showSystemChat('走子数据发送失败，对方可能未收到');
            }
        }
        this.saveResumeState();
        this.checkAI();
    }
    playMoveSound(move) {
        if (this.board.state.gameOver && this.board.state.winner) {
            this.audio.playWin();
        }
        else if (this.board.state.check) {
            this.audio.playCheck();
        }
        else if (move.captured) {
            this.audio.playCapture();
        }
        else {
            this.audio.playMove();
        }
    }
    checkAI() {
        if (this.mode !== 'local-ai' || this.board.state.gameOver || !this.ai)
            return;
        if (this.board.state.currentSide !== this.ai.side)
            return;
        this.isThinking = true;
        this.updateGameInfo();
        setTimeout(() => {
            if (!this.ai || this.board.state.gameOver) {
                this.isThinking = false;
                this.updateGameInfo();
                return;
            }
            const result = this.ai.getMove(this.board);
            const aiMove = result.move;
            if (aiMove) {
                if (!this.board.makeMove(aiMove.from, aiMove.to)) {
                    this.isThinking = false;
                    this.updateGameInfo();
                    return;
                }
                this.notation.record(aiMove);
                this.animator.animate(aiMove.piece, aiMove.from, aiMove.to, 180);
                this.renderBoard();
                this.updateGameInfo();
                this.updateCaptured();
                this.updateNotation();
                this.playMoveSound(aiMove);
            }
            else {
                // AI 无合法走法：触发终局检测，或尝试快速重搜
                const currentSide = this.board.state.currentSide;
                if (!Rules.hasLegalMoves(this.board.state.board, currentSide)) {
                    this.board.state.gameOver = true;
                    this.board.state.winner = currentSide === 'red' ? 'black' : 'red';
                    this.updateGameInfo();
                    this.renderBoard();
                }
                else {
                    // AI 超时未找到走法，但有合法走法：使用快速引擎搜索保底
                    try {
                        const engine = new Engine(currentSide);
                        engine.setTimeLimit(500);
                        const fallback = engine.search(this.board.state.board, 3);
                        if (fallback.move) {
                            if (!this.board.makeMove(fallback.move.from, fallback.move.to))
                                return;
                            this.notation.record(fallback.move);
                            this.animator.animate(fallback.move.piece, fallback.move.from, fallback.move.to, 180);
                            this.renderBoard();
                            this.updateGameInfo();
                            this.updateCaptured();
                            this.updateNotation();
                            this.playMoveSound(fallback.move);
                        }
                    }
                    catch {
                        // 快速搜索也失败，静默处理等待下次调用
                    }
                }
            }
            this.isThinking = false;
            this.updateGameInfo();
        }, 100);
    }
    undo() {
        if (this.mode?.startsWith('lan-'))
            return;
        if (this.isThinking)
            return;
        if (this.reviewIndex !== null)
            this.returnToGame();
        if (this.mode === 'local-ai') {
            this.board.undo();
            this.board.undo();
            this.notation.undo();
            this.notation.undo();
        }
        else {
            this.board.undo();
            this.notation.undo();
        }
        this.gameOverShown = false;
        this.selectedPos = null;
        this.validMoves = [];
        this.animator.stop();
        this.renderBoard();
        this.updateGameInfo();
        this.updateCaptured();
        this.updateNotation();
    }
    jumpToMove(index) {
        const entries = this.notation.getAll();
        if (index < 0 || index >= entries.length)
            return;
        this.reviewIndex = index;
        this.isReplaying = true;
        this.resetToInitialPosition();
        this.selectedPos = null;
        this.validMoves = [];
        this.animator.stop();
        for (let i = 0; i <= index; i++) {
            const move = entries[i].move;
            if (!this.board.applyExternalMove(move))
                break;
        }
        this.isReplaying = false;
        this.renderBoard();
        this.updateGameInfo();
        this.updateCaptured();
        this.updateNotation();
        document.getElementById('review-overlay').classList.remove('hidden');
        this.resetAnalysisPanel();
    }
    returnToGame() {
        if (this.reviewIndex === null)
            return;
        const entries = this.notation.getAll();
        this.isReplaying = true;
        this.resetToInitialPosition();
        for (const entry of entries) {
            if (!this.board.applyExternalMove(entry.move))
                break;
        }
        this.isReplaying = false;
        this.reviewIndex = null;
        this.selectedPos = null;
        this.validMoves = [];
        this.animator.stop();
        document.getElementById('review-overlay').classList.add('hidden');
        this.resetAnalysisPanel();
        this.renderBoard();
        this.updateGameInfo();
        this.updateCaptured();
        this.updateNotation();
    }
    reviewStep(delta) {
        if (this.reviewIndex === null)
            return;
        const entries = this.notation.getAll();
        const newIndex = this.reviewIndex + delta;
        if (newIndex < 0 || newIndex >= entries.length)
            return;
        this.jumpToMove(newIndex);
    }
    // ==================== 复盘分析 ====================
    startAnalysisFromCurrentGame() {
        if (this.board.state.moveHistory.length === 0) {
            alert('当前对局没有可走记录');
            return;
        }
        this.mode = null;
        this.isThinking = false;
        this.reviewIndex = this.board.state.moveHistory.length - 1;
        this.selectedPos = null;
        this.validMoves = [];
        this.animator.stop();
        this.showScreen('game');
        this.updateGameInfo();
        this.renderBoard();
        this.updateCaptured();
        this.updateNotation();
        document.getElementById('review-overlay').classList.remove('hidden');
        this.resetAnalysisPanel();
    }
    startAnalysisFromHistory(index) {
        const history = Storage.loadHistory();
        const entry = history[index];
        if (!entry)
            return;
        if (!entry.movesEncoded) {
            alert('该历史记录不支持复盘分析（旧格式记录）');
            return;
        }
        // 重建棋局
        this.isReplaying = true;
        this.notation.clear();
        if (entry.initialFen) {
            const side = entry.initialSide === 'black' ? 'b' : 'w';
            const decoded = FenCodec.decode(`${entry.initialFen} ${side}`);
            if (decoded) {
                this.board.loadCustomBoard(decoded.board, decoded.side);
            }
            else {
                this.board.reset();
            }
        }
        else {
            this.board.reset();
        }
        this.rememberInitialPosition();
        const moves = MoveCodec.decode(entry.movesEncoded, this.cloneBoard(this.initialBoard));
        let appliedMoves = 0;
        for (const move of moves) {
            if (!this.board.applyExternalMove(move))
                break;
            this.notation.record(move);
            appliedMoves++;
        }
        this.isReplaying = false;
        this.mode = null;
        this.mySide = null;
        this.currentPuzzleIndex = null;
        this.gameOverShown = false;
        this.isThinking = false;
        this.reviewIndex = appliedMoves > 0 ? appliedMoves - 1 : null;
        this.selectedPos = null;
        this.validMoves = [];
        this.animator.stop();
        this.showScreen('game');
        this.updateGameInfo();
        this.renderBoard();
        this.updateCaptured();
        this.updateNotation();
        document.getElementById('review-overlay').classList.toggle('hidden', this.reviewIndex === null);
        this.resetAnalysisPanel();
    }
    async analyzeCurrentPosition() {
        const loading = document.getElementById('analysis-loading');
        const scoreEl = document.getElementById('analysis-score');
        const verdictEl = document.getElementById('analysis-verdict');
        const suggestionEl = document.getElementById('analysis-suggestion');
        loading.classList.remove('hidden');
        scoreEl.textContent = '--';
        verdictEl.textContent = 'AI 正在思考...';
        suggestionEl.textContent = '';
        try {
            const engine = new Engine(this.board.state.currentSide);
            engine.setTimeLimit(2000);
            const result = engine.search(this.board.state.board, 5);
            const score = result.score;
            // 分数显示（红方视角）
            let displayScore = score;
            let scoreText;
            let verdict;
            let scoreClass;
            if (Math.abs(score) > 9000) {
                scoreText = score > 0 ? '红胜势' : '黑胜势';
                verdict = score > 0 ? '红方即将获胜' : '黑方即将获胜';
                scoreClass = score > 0 ? 'red-adv' : 'black-adv';
            }
            else if (score > 300) {
                scoreText = `+${score}`;
                verdict = '红方明显优势';
                scoreClass = 'red-adv';
            }
            else if (score < -300) {
                scoreText = `${score}`;
                verdict = '黑方明显优势';
                scoreClass = 'black-adv';
            }
            else if (score > 80) {
                scoreText = `+${score}`;
                verdict = '红方稍优';
                scoreClass = 'red-adv';
            }
            else if (score < -80) {
                scoreText = `${score}`;
                verdict = '黑方稍优';
                scoreClass = 'black-adv';
            }
            else {
                scoreText = `${score > 0 ? '+' : ''}${score}`;
                verdict = '双方均势';
                scoreClass = 'even';
            }
            scoreEl.textContent = scoreText;
            scoreEl.className = `analysis-score ${scoreClass}`;
            verdictEl.textContent = verdict;
            if (result.move) {
                const side = this.board.state.currentSide;
                const pieceName = PIECE_NAMES[side][result.move.piece.type];
                const fromFile = side === 'red' ? 9 - result.move.from.x : result.move.from.x + 1;
                const toFile = side === 'red' ? 9 - result.move.to.x : result.move.to.x + 1;
                const action = result.move.from.x === result.move.to.x
                    ? ((side === 'red' ? result.move.to.y < result.move.from.y : result.move.to.y > result.move.from.y) ? '进' : '退')
                    : '平';
                const targetNum = action === '平' ? toFile : Math.abs((side === 'red' ? 10 - result.move.to.y : result.move.to.y + 1) -
                    (side === 'red' ? 10 - result.move.from.y : result.move.from.y + 1));
                suggestionEl.textContent = `推荐：${pieceName}${fromFile}${action}${targetNum}`;
            }
            else {
                suggestionEl.textContent = '无合法走法';
            }
        }
        catch (e) {
            verdictEl.textContent = '分析出错，请重试';
            console.error('Analysis error:', e);
        }
        finally {
            loading.classList.add('hidden');
        }
    }
    resetAnalysisPanel() {
        const scoreEl = document.getElementById('analysis-score');
        const verdictEl = document.getElementById('analysis-verdict');
        const suggestionEl = document.getElementById('analysis-suggestion');
        scoreEl.textContent = '--';
        scoreEl.className = 'analysis-score';
        verdictEl.textContent = '点击分析按钮查看AI建议';
        suggestionEl.textContent = '';
    }
    onStateChange() {
        if (this.isReplaying)
            return;
        this.renderBoard();
        this.updateGameInfo();
        this.updateCaptured();
        this.updateNotation();
    }
    renderBoard() {
        this.renderer.render(this.board.state, this.selectedPos, this.validMoves, this.animator, this.hintMove ?? undefined);
    }
    async showHint() {
        if (this.board.state.gameOver)
            return;
        if (this.mode?.startsWith('lan-')) {
            alert('联机模式不支持提示');
            return;
        }
        const engine = new Engine(this.board.state.currentSide);
        engine.setTimeLimit(1500);
        const result = engine.search(this.board.state.board, 4);
        if (result.move) {
            this.hintMove = result.move;
            this.renderBoard();
            setTimeout(() => {
                this.hintMove = null;
                this.renderBoard();
            }, 2500);
        }
    }
    updateGameInfo() {
        const turnEl = document.getElementById('turn-indicator');
        const statusEl = document.getElementById('game-status');
        const stepEl = document.getElementById('step-counter');
        const waitingOverlay = document.getElementById('waiting-overlay');
        const timerRed = document.getElementById('timer-red');
        const timerBlack = document.getElementById('timer-black');
        const state = this.board.state;
        stepEl.textContent = `${state.moveHistory.length}步`;
        // 局面评估显示
        const evalBar = document.getElementById('eval-bar');
        if (evalBar) {
            if (this.showEvaluation && !state.gameOver && state.moveHistory.length > 0) {
                evalBar.classList.remove('hidden');
                this.computeEvaluation();
            }
            else {
                evalBar.classList.add('hidden');
            }
        }
        // 更新计时器显示
        timerRed.textContent = this.formatTime(this.timeRed);
        timerBlack.textContent = this.formatTime(this.timeBlack);
        timerRed.classList.toggle('active', state.currentSide === 'red' && !state.gameOver);
        timerBlack.classList.toggle('active', state.currentSide === 'black' && !state.gameOver);
        timerRed.classList.toggle('danger', this.timeRed <= 30);
        timerBlack.classList.toggle('danger', this.timeBlack <= 30);
        // 联机等待提示
        if (this.mode?.startsWith('lan-') && !state.gameOver && state.currentSide !== this.mySide) {
            waitingOverlay.classList.remove('hidden');
        }
        else {
            waitingOverlay.classList.add('hidden');
        }
        const chatPanel = document.getElementById('chat-panel');
        if (this.mode?.startsWith('lan-')) {
            chatPanel.classList.remove('hidden');
        }
        else {
            chatPanel.classList.add('hidden');
        }
        // 复盘分析面板
        const analysisPanel = document.getElementById('analysis-panel');
        if (this.reviewIndex !== null) {
            analysisPanel.classList.remove('hidden');
        }
        else {
            analysisPanel.classList.add('hidden');
        }
        const aiControl = document.getElementById('ai-control');
        if (this.mode === 'ai-vs-ai') {
            aiControl.classList.remove('hidden');
        }
        else {
            aiControl.classList.add('hidden');
        }
        this.startTimer();
        // 控制按钮可见性
        const isLan = this.mode?.startsWith('lan-') ?? false;
        const btnHint = document.getElementById('btn-hint');
        const btnUndo = document.getElementById('btn-undo');
        const btnDraw = document.getElementById('btn-draw');
        const btnResign = document.getElementById('btn-resign');
        const isReview = this.reviewIndex !== null;
        btnHint.classList.toggle('hidden', isLan || isReview);
        btnUndo.classList.toggle('hidden', isLan || isReview);
        btnDraw.classList.toggle('hidden', !isLan || state.gameOver || isReview);
        btnResign.classList.toggle('hidden', !isLan || state.gameOver || isReview);
        if (state.gameOver && this.reviewIndex === null) {
            this.stopTimer();
            if (state.winner) {
                turnEl.textContent = state.winner === 'red' ? '红方胜利' : '黑方胜利';
                turnEl.style.color = state.winner === 'red' ? '#e74c3c' : '#3498db';
                if (!this.gameOverShown) {
                    this.gameOverShown = true;
                    this.saveHistory();
                    const title = state.winner === 'red' ? '红方胜利！' : '黑方胜利！';
                    const msg = state.check ? '将杀对方，赢得本局！' : '对方被困毙，赢得本局！';
                    setTimeout(() => this.showModal(title, msg), 400);
                }
            }
            else {
                turnEl.textContent = '和棋';
                turnEl.style.color = '#aaa';
                if (!this.gameOverShown) {
                    this.gameOverShown = true;
                    this.saveHistory();
                    setTimeout(() => this.showModal('和棋', '双方均无取胜可能。'), 400);
                }
            }
            statusEl.textContent = '游戏结束';
        }
        else {
            if (state.gameOver) {
                // 复盘模式下显示终局信息（不弹窗）
                if (state.winner) {
                    turnEl.textContent = state.winner === 'red' ? '红方胜利' : '黑方胜利';
                    turnEl.style.color = state.winner === 'red' ? '#e74c3c' : '#3498db';
                }
                else {
                    turnEl.textContent = '和棋';
                    turnEl.style.color = '#aaa';
                }
                statusEl.textContent = '游戏结束';
            }
            else if (this.isThinking) {
                turnEl.textContent = '电脑思考中...';
                turnEl.style.color = '#aaa';
            }
            else {
                turnEl.textContent = state.currentSide === 'red' ? '红方回合' : '黑方回合';
                turnEl.style.color = state.currentSide === 'red' ? '#e74c3c' : '#3498db';
            }
            if (!state.gameOver && state.check) {
                statusEl.textContent = '将军！';
            }
            else if (!state.gameOver && state.noCaptureCount >= 100) {
                const remaining = 120 - state.noCaptureCount;
                statusEl.textContent = `和棋倒计时 ${remaining}`;
            }
            else if (!state.gameOver) {
                statusEl.textContent = '';
            }
        }
    }
    updateCaptured() {
        const blackEl = document.getElementById('captured-black');
        const redEl = document.getElementById('captured-red');
        blackEl.innerHTML = this.board.state.capturedBlack
            .map(p => `<span class="captured-piece black">${PIECE_NAMES[p.side][p.type]}</span>`)
            .join('');
        redEl.innerHTML = this.board.state.capturedRed
            .map(p => `<span class="captured-piece red">${PIECE_NAMES[p.side][p.type]}</span>`)
            .join('');
    }
    updateNotation() {
        const entries = this.notation.getAll();
        const html = [];
        for (let i = 0; i < entries.length; i += 2) {
            const num = Math.floor(i / 2) + 1;
            const red = entries[i];
            const black = entries[i + 1];
            const redCls = this.reviewIndex !== null && this.reviewIndex === i ? 'red-move active' : 'red-move';
            const blackCls = this.reviewIndex !== null && this.reviewIndex === i + 1 ? 'black-move active' : 'black-move';
            html.push(`<div class="notation-move">` +
                `<span class="num">${num}.</span>` +
                `<span class="${redCls}" data-index="${i}">${red?.text ?? ''}</span>` +
                `<span class="${blackCls}" data-index="${i + 1}">${black?.text ?? ''}</span>` +
                `</div>`);
        }
        this.notationEl.innerHTML = html.join('');
        if (this.reviewIndex === null) {
            // 正常模式下滚动到底部
            this.notationEl.scrollTop = this.notationEl.scrollHeight;
        }
        else {
            // 回放/分析模式下滚动到当前步
            const activeEl = this.notationEl.querySelector('.red-move.active, .black-move.active');
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
    exportNotation() {
        const text = this.notation.exportText();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `xiangqi_${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
    shareGame() {
        if (this.board.state.moveHistory.length === 0) {
            alert('暂无棋谱可分享');
            return;
        }
        const encoded = MoveCodec.encode(this.board.state.moveHistory);
        const params = new URLSearchParams();
        params.set('fen', FenCodec.encode(this.initialBoard));
        params.set('side', this.initialSide);
        params.set('moves', encoded);
        const url = `${window.location.origin}${window.location.pathname}#${params.toString()}`;
        navigator.clipboard.writeText(url).then(() => {
            alert('分享链接已复制到剪贴板！');
        }).catch(() => {
            prompt('复制以下链接分享：', url);
        });
    }
    copyFen() {
        const fen = FenCodec.encode(this.board.state.board);
        const side = this.board.state.currentSide === 'red' ? 'w' : 'b';
        const fullFen = `${fen} ${side} - - 0 1`;
        navigator.clipboard.writeText(fullFen).then(() => {
            alert('FEN已复制：' + fullFen.slice(0, 40) + '...');
        }).catch(() => {
            prompt('FEN：', fullFen);
        });
    }
    importFen() {
        const input = prompt('请输入FEN局面字符串：');
        if (!input)
            return;
        const result = FenCodec.decode(input);
        if (!result) {
            alert('FEN格式错误，无法导入');
            return;
        }
        this.board.loadCustomBoard(result.board, result.side);
        this.rememberInitialPosition();
        this.notation.clear();
        this.selectedPos = null;
        this.validMoves = [];
        this.animator.stop();
        this.mode = 'local-pvp';
        this.mySide = null;
        this.reviewIndex = null;
        // 检测导入局面是否已终局
        const currentSide = this.board.state.currentSide;
        if (!Rules.hasLegalMoves(this.board.state.board, currentSide)) {
            this.board.state.gameOver = true;
            this.board.state.winner = this.board.state.check ? (currentSide === 'red' ? 'black' : 'red') : null;
        }
        this.updateGameInfo();
        this.renderBoard();
        this.updateCaptured();
        this.updateNotation();
    }
    takeScreenshot() {
        const canvas = document.getElementById('board-canvas');
        const link = document.createElement('a');
        link.download = `xiangqi_${new Date().toISOString().slice(0, 10)}_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
    parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const puzzleIdx = params.get('puzzle');
        if (puzzleIdx !== null) {
            const idx = parseInt(puzzleIdx, 10);
            if (idx >= 0 && idx < ALL_PUZZLES.length) {
                setTimeout(() => this.startPuzzle(idx), 500);
                // 清除URL参数避免刷新重复加载
                history.replaceState(null, '', window.location.pathname);
                return;
            }
        }
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
        const encoded = hashParams.get('moves') ?? hash.match(/moves=([0-9a-z]+)/)?.[1];
        if (encoded) {
            const initialFen = hashParams.get('fen');
            const initialSide = hashParams.get('side') === 'black' ? 'black' : 'red';
            const decodedInitial = initialFen ? FenCodec.decode(`${initialFen} ${initialSide === 'black' ? 'b' : 'w'}`) : null;
            const initialBoard = decodedInitial ? decodedInitial.board : this.cloneBoard(this.board.state.board);
            const moves = MoveCodec.decode(encoded, initialBoard);
            if (moves.length > 0) {
                setTimeout(() => {
                    this.startGame('local-pvp');
                    if (decodedInitial) {
                        this.board.loadCustomBoard(decodedInitial.board, decodedInitial.side);
                        this.rememberInitialPosition();
                        this.notation.clear();
                    }
                    this.isReplaying = true;
                    for (const move of moves) {
                        if (!this.board.applyExternalMove(move))
                            break;
                        this.notation.record(move);
                    }
                    this.isReplaying = false;
                    this.renderBoard();
                    this.updateGameInfo();
                    this.updateCaptured();
                    this.updateNotation();
                }, 800);
            }
            // 清除URL hash避免刷新重复加载
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }
    resign() {
        if (this.board.state.gameOver || !this.mySide || this.reviewIndex !== null)
            return;
        if (!confirm('确定要认输吗？'))
            return;
        this.board.state.gameOver = true;
        this.board.state.winner = this.mySide === 'red' ? 'black' : 'red';
        this.stopTimer();
        this.updateGameInfo();
        this.renderBoard();
        if (this.mode?.startsWith('lan-') && this.p2p?.isConnected()) {
            this.p2p.send(wrapMessage('resign', ''));
        }
    }
    handleOpponentResign() {
        if (this.board.state.gameOver)
            return;
        this.board.state.gameOver = true;
        this.board.state.winner = this.mySide || null;
        this.stopTimer();
        this.updateGameInfo();
        this.renderBoard();
    }
    requestDraw() {
        if (this.board.state.gameOver)
            return;
        if (this.reviewIndex !== null) {
            alert('复盘模式下不支持和棋');
            return;
        }
        if (this.mode?.startsWith('lan-')) {
            if (!this.p2p?.isConnected()) {
                alert('当前未连接，无法发送和棋请求');
                return;
            }
            const sent = this.p2p.send(wrapMessage('draw-request', ''));
            if (sent) {
                alert('已发送和棋请求，等待对方回应...');
            }
            else {
                alert('和棋请求发送失败，请检查连接');
            }
        }
        else {
            // 单机模式直接和棋
            if (confirm('请求和棋？')) {
                this.acceptDraw();
            }
        }
    }
    handleDrawRequest() {
        if (this.board.state.gameOver)
            return;
        if (confirm('对方请求和棋，是否同意？')) {
            if (this.p2p?.isConnected()) {
                this.p2p.send(wrapMessage('draw-accept', ''));
            }
            this.acceptDraw();
        }
        else {
            if (this.p2p?.isConnected()) {
                this.p2p.send(wrapMessage('draw-decline', ''));
            }
        }
    }
    acceptDraw() {
        if (this.board.state.gameOver)
            return;
        this.board.state.gameOver = true;
        this.board.state.winner = null;
        this.gameOverShown = true;
        this.stopTimer();
        this.updateGameInfo();
        this.renderBoard();
        this.saveHistory();
    }
    saveHistory() {
        const moves = this.notation.exportText();
        const mode = this.mode || 'local-pvp';
        const winner = this.board.state.winner;
        const movesEncoded = MoveCodec.encode(this.board.state.moveHistory);
        const initialFen = FenCodec.encode(this.initialBoard);
        Storage.addHistory(moves, mode, winner, movesEncoded, initialFen, this.initialSide);
        // 保存残局成绩
        if (this.currentPuzzleIndex !== null && this.currentPuzzleIndex < 1000 && winner === this.mySide) {
            const steps = this.board.state.moveHistory.length;
            const timeMs = Math.floor(performance.now() - this.puzzleStartTime);
            Storage.savePuzzleRecord(this.currentPuzzleIndex, steps, timeMs);
        }
    }
    startTimer() {
        if (this.timerInterval || this.board.state.gameOver || this.reviewIndex !== null)
            return;
        this.timerInterval = setInterval(() => {
            if (this.board.state.gameOver) {
                this.stopTimer();
                return;
            }
            if (this.board.state.currentSide === 'red') {
                this.timeRed--;
                if (this.timeRed <= 0) {
                    this.timeRed = 0;
                    this.stopTimer();
                    // 超时判负
                    this.board.state.gameOver = true;
                    this.board.state.winner = 'black';
                    this.updateGameInfo();
                    this.renderBoard();
                }
            }
            else {
                this.timeBlack--;
                if (this.timeBlack <= 0) {
                    this.timeBlack = 0;
                    this.stopTimer();
                    this.board.state.gameOver = true;
                    this.board.state.winner = 'red';
                    this.updateGameInfo();
                    this.renderBoard();
                }
            }
            this.updateGameInfo();
        }, 1000);
    }
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    async computeEvaluation() {
        if (this.board.state.gameOver)
            return;
        const evalFill = document.getElementById('eval-fill');
        const evalText = document.getElementById('eval-text');
        if (!evalFill || !evalText)
            return;
        const engine = new Engine('red');
        engine.setTimeLimit(300);
        const result = engine.search(this.board.state.board, 2);
        const score = result.score;
        this.lastEvalScore = score;
        const maxScore = 2000;
        const clamped = Math.max(-maxScore, Math.min(maxScore, score));
        const pct = (clamped / maxScore) * 50; // -50% to +50%
        if (pct >= 0) {
            evalFill.style.left = '50%';
            evalFill.style.width = `${pct}%`;
            evalFill.classList.remove('negative');
        }
        else {
            evalFill.style.left = `${50 + pct}%`;
            evalFill.style.width = `${-pct}%`;
            evalFill.classList.add('negative');
        }
        if (Math.abs(score) > 9000) {
            evalText.textContent = score > 0 ? '红胜' : '黑胜';
        }
        else {
            evalText.textContent = score > 0 ? `+${score}` : `${score}`;
        }
    }
    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}
// 启动
document.addEventListener('DOMContentLoaded', () => {
    new GameApp();
    setTimeout(() => {
        const intro = document.getElementById('intro-screen');
        if (intro)
            intro.remove();
    }, 3000);
});
//# sourceMappingURL=main.js.map