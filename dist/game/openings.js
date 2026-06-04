import { Rules } from './rules.js';
const OPENINGS = [
    // 1. 屏风马应对中炮
    [
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
        { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } },
        { from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
    ],
    // 2. 反宫马
    [
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
        { from: { x: 7, y: 2 }, to: { x: 4, y: 2 } },
    ],
    // 3. 顺手炮
    [
        { from: { x: 1, y: 2 }, to: { x: 4, y: 2 } },
        { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } },
    ],
    // 4. 列手炮
    [
        { from: { x: 7, y: 2 }, to: { x: 4, y: 2 } },
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
    ],
    // 5. 起马局
    [
        { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } },
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
    ],
    // 6. 飞相局应对
    [
        { from: { x: 6, y: 0 }, to: { x: 4, y: 2 } },
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
    ],
    // 7. 进三兵应对
    [
        { from: { x: 2, y: 3 }, to: { x: 2, y: 4 } },
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
    ],
    // 8. 士角炮
    [
        { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } },
        { from: { x: 1, y: 2 }, to: { x: 0, y: 2 } },
    ],
    // 9. 过宫炮
    [
        { from: { x: 1, y: 2 }, to: { x: 5, y: 2 } },
        { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } },
    ],
    // 10. 金钩炮
    [
        { from: { x: 7, y: 2 }, to: { x: 6, y: 2 } },
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
    ],
    // 11. 仙人指路对卒底炮
    [
        { from: { x: 2, y: 3 }, to: { x: 2, y: 4 } },
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
    ],
    // 12. 中炮对三步虎
    [
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
        { from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
    ],
    // 13. 龟背炮
    [
        { from: { x: 4, y: 0 }, to: { x: 4, y: 1 } },
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
    ],
    // 14. 边马局
    [
        { from: { x: 7, y: 0 }, to: { x: 8, y: 2 } },
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
    ],
    // 15. 单提马
    [
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
        { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } },
    ],
    // 16. 鸳鸯炮
    [
        { from: { x: 1, y: 2 }, to: { x: 2, y: 2 } },
        { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } },
    ],
    // 17. 横车将路
    [
        { from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
    ],
    // 18. 屏风马双炮过河
    [
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
        { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } },
        { from: { x: 1, y: 2 }, to: { x: 4, y: 2 } },
    ],
    // 19. 左炮封车
    [
        { from: { x: 1, y: 2 }, to: { x: 4, y: 2 } },
        { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } },
    ],
    // 20. 右炮封车
    [
        { from: { x: 7, y: 2 }, to: { x: 4, y: 2 } },
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } },
    ],
];
export class OpeningBook {
    constructor() {
        this.chosenOpening = null;
        this.currentStep = 0;
        this.reset();
    }
    reset() {
        this.chosenOpening = OPENINGS[Math.floor(Math.random() * OPENINGS.length)];
        this.currentStep = 0;
    }
    getMove(board, blackMoveCount) {
        if (!this.chosenOpening)
            return null;
        if (blackMoveCount >= 3)
            return null;
        if (this.currentStep >= this.chosenOpening.length) {
            this.chosenOpening = OPENINGS[Math.floor(Math.random() * OPENINGS.length)];
            this.currentStep = 0;
            if (blackMoveCount >= 3)
                return null;
        }
        const candidate = this.chosenOpening[this.currentStep];
        const piece = board[candidate.from.y][candidate.from.x];
        if (!piece || piece.side !== 'black') {
            this.currentStep++;
            return this.getMove(board, blackMoveCount);
        }
        if (!Rules.isValidMove(board, candidate.from, candidate.to)) {
            this.currentStep++;
            return this.getMove(board, blackMoveCount);
        }
        if (Rules.wouldBeInCheck(board, candidate.from, candidate.to, 'black')) {
            this.currentStep++;
            return this.getMove(board, blackMoveCount);
        }
        const captured = board[candidate.to.y][candidate.to.x] || undefined;
        this.currentStep++;
        return {
            from: candidate.from,
            to: candidate.to,
            piece,
            captured,
        };
    }
}
//# sourceMappingURL=openings.js.map