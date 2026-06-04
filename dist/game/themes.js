export const CLASSIC_THEME = {
    name: '经典木质',
    boardBg: '#e8c895',
    lineColor: '#5c3a21',
    riverText: '#5c3a21',
    pieceRed: { bg: '#ffeaea', text: '#c84b31', border: '#c84b31' },
    pieceBlack: { bg: '#f0f0f0', text: '#1a1a1a', border: '#2c2c2c' },
    highlight: {
        select: '#4ecc71',
        lastMove: 'rgba(255, 200, 0, 0.4)',
        check: 'rgba(231, 76, 60, 0.5)',
        validMove: 'rgba(78, 204, 113, 0.6)',
    },
};
export const DARK_THEME = {
    name: '现代深色',
    boardBg: '#2d3436',
    lineColor: '#b2bec3',
    riverText: '#b2bec3',
    pieceRed: { bg: '#ff7675', text: '#fff', border: '#d63031' },
    pieceBlack: { bg: '#636e72', text: '#fff', border: '#2d3436' },
    highlight: {
        select: '#00b894',
        lastMove: 'rgba(253, 203, 110, 0.4)',
        check: 'rgba(214, 48, 49, 0.5)',
        validMove: 'rgba(0, 184, 148, 0.6)',
    },
};
export const BLUE_THEME = {
    name: '青花瓷',
    boardBg: '#f0f4f8',
    lineColor: '#2c5282',
    riverText: '#2c5282',
    pieceRed: { bg: '#fed7d7', text: '#c53030', border: '#c53030' },
    pieceBlack: { bg: '#e2e8f0', text: '#1a365d', border: '#1a365d' },
    highlight: {
        select: '#48bb78',
        lastMove: 'rgba(236, 201, 75, 0.4)',
        check: 'rgba(245, 101, 101, 0.5)',
        validMove: 'rgba(72, 187, 120, 0.6)',
    },
};
export const INK_THEME = {
    name: '水墨风',
    boardBg: '#f5f0e8',
    lineColor: '#4a4a4a',
    riverText: '#4a4a4a',
    pieceRed: { bg: '#fff5f5', text: '#c0392b', border: '#c0392b' },
    pieceBlack: { bg: '#f8f8f8', text: '#2c3e50', border: '#2c3e50' },
    highlight: {
        select: '#27ae60',
        lastMove: 'rgba(241, 196, 15, 0.35)',
        check: 'rgba(231, 76, 60, 0.45)',
        validMove: 'rgba(39, 174, 96, 0.55)',
    },
};
export const ALL_THEMES = [CLASSIC_THEME, DARK_THEME, BLUE_THEME, INK_THEME];
//# sourceMappingURL=themes.js.map