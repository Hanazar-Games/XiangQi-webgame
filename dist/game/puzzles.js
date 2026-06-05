function emptyBoard() {
    return Array(10).fill(null).map(() => Array(9).fill(null));
}
function R(type) { return { type, side: 'red' }; }
function B(type) { return { type, side: 'black' }; }
const ALL = [
    // ========== 杀法类 (1-20) ==========
    {
        name: '马后炮', description: '马定将位，炮将军', side: 'red', target: 'checkmate', category: '杀法', difficulty: 1,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[7][4] = R('cannon'); b[6][3] = R('horse'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); return b; })(),
    },
    {
        name: '双车错', description: '双车交替将军绝杀', side: 'red', target: 'checkmate', category: '杀法', difficulty: 1,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[3][0] = R('rook'); b[2][8] = R('rook'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[2][4] = B('elephant'); return b; })(),
    },
    {
        name: '白脸将', description: '将帅照面牵杀', side: 'red', target: 'checkmate', category: '杀法', difficulty: 1,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[7][4] = R('rook'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[0][7] = B('rook'); return b; })(),
    },
    {
        name: '铁门栓', description: '车占中路配合将炮', side: 'red', target: 'checkmate', category: '杀法', difficulty: 1,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][4] = R('rook'); b[1][4] = R('cannon'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); return b; })(),
    },
    {
        name: '重炮杀', description: '双炮重叠一炮当架', side: 'red', target: 'checkmate', category: '杀法', difficulty: 1,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[3][4] = R('cannon'); b[5][4] = R('cannon'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); return b; })(),
    },
    {
        name: '闷宫杀', description: '炮困九宫士象自堵', side: 'red', target: 'checkmate', category: '杀法', difficulty: 1,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][4] = R('cannon'); b[1][3] = R('horse'); b[0][4] = B('king'); b[1][5] = B('advisor'); b[0][6] = B('elephant'); return b; })(),
    },
    {
        name: '大胆穿心', description: '弃车破士直捣黄龙', side: 'red', target: 'checkmate', category: '杀法', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[3][4] = R('rook'); b[6][4] = R('pawn'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[0][0] = B('rook'); return b; })(),
    },
    {
        name: '海底捞月', description: '车炮巧胜单车', side: 'red', target: 'checkmate', category: '杀法', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[8][0] = R('rook'); b[8][4] = R('cannon'); b[0][4] = B('king'); b[0][0] = B('rook'); b[2][4] = B('elephant'); return b; })(),
    },
    {
        name: '立马车', description: '马定将位车从侧面杀', side: 'red', target: 'checkmate', category: '杀法', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][5] = R('horse'); b[2][0] = R('rook'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[0][0] = B('rook'); return b; })(),
    },
    {
        name: '困毙', description: '限制将路不将军绝杀', side: 'red', target: 'checkmate', category: '杀法', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][4] = R('rook'); b[1][3] = R('horse'); b[0][4] = B('king'); b[1][5] = B('advisor'); b[0][2] = B('elephant'); b[0][6] = B('elephant'); return b; })(),
    },
    {
        name: '钓鱼马', description: '马在士角位将军', side: 'red', target: 'checkmate', category: '杀法', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][2] = R('horse'); b[2][4] = R('rook'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); return b; })(),
    },
    {
        name: '卧槽马', description: '马卧将侧配合车杀', side: 'red', target: 'checkmate', category: '杀法', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[1][2] = R('horse'); b[2][8] = R('rook'); b[0][4] = B('king'); b[1][5] = B('advisor'); return b; })(),
    },
    {
        name: '送佛归殿', description: '兵步步紧逼逼将归位', side: 'red', target: 'checkmate', category: '杀法', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][4] = R('pawn'); b[1][3] = R('rook'); b[0][4] = B('king'); b[1][5] = B('advisor'); return b; })(),
    },
    {
        name: '二鬼拍门', description: '双兵锁九宫配合将帅', side: 'red', target: 'checkmate', category: '杀法', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[1][3] = R('pawn'); b[1][5] = R('pawn'); b[0][4] = B('king'); b[1][4] = B('advisor'); return b; })(),
    },
    {
        name: '空头炮', description: '中路无遮挡炮将军', side: 'red', target: 'checkmate', category: '杀法', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[3][4] = R('cannon'); b[7][4] = R('rook'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[2][4] = B('elephant'); return b; })(),
    },
    {
        name: '天地炮', description: '中炮底炮配合车杀', side: 'red', target: 'checkmate', category: '杀法', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[3][4] = R('cannon'); b[8][4] = R('cannon'); b[2][0] = R('rook'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[2][4] = B('elephant'); return b; })(),
    },
    {
        name: '夹车炮', description: '车炮夹攻将无处逃', side: 'red', target: 'checkmate', category: '杀法', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][4] = R('cannon'); b[2][6] = R('rook'); b[2][2] = R('rook'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); return b; })(),
    },
    {
        name: '八角马', description: '马控将八点位配合车', side: 'red', target: 'checkmate', category: '杀法', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[1][3] = R('horse'); b[2][0] = R('rook'); b[0][4] = B('king'); b[1][5] = B('advisor'); return b; })(),
    },
    {
        name: '三子归边', description: '三进攻子力集中一侧', side: 'red', target: 'checkmate', category: '杀法', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][0] = R('rook'); b[3][1] = R('horse'); b[1][0] = R('cannon'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[0][2] = B('elephant'); return b; })(),
    },
    {
        name: '侧面虎', description: '马占将侧配合车绝杀', side: 'red', target: 'checkmate', category: '杀法', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[1][4] = R('horse'); b[2][8] = R('rook'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); return b; })(),
    },
    // ========== 巧胜类 (21-25) ==========
    {
        name: '车马冷着', description: '车马巧胜士象全', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[4][2] = R('horse'); b[2][0] = R('rook'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[2][4] = B('elephant'); b[0][2] = B('elephant'); return b; })(),
    },
    {
        name: '炮碾丹砂', description: '炮横向碾碎士象', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[1][1] = R('cannon'); b[2][0] = R('rook'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[0][2] = B('elephant'); b[0][6] = B('elephant'); return b; })(),
    },
    {
        name: '老卒搜山', description: '老兵 slowly推进取胜', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][4] = R('pawn'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[0][2] = B('elephant'); return b; })(),
    },
    {
        name: '千里照面', description: '远炮照面配合车斩杀', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[7][4] = R('cannon'); b[2][8] = R('rook'); b[0][4] = B('king'); b[1][5] = B('advisor'); b[2][4] = B('elephant'); return b; })(),
    },
    {
        name: '三车闹士', description: '三车（含借用）攻士', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][0] = R('rook'); b[2][8] = R('rook'); b[4][4] = R('cannon'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[0][0] = B('rook'); return b; })(),
    },
    // ========== 和棋类 (26-30) ==========
    {
        name: '单马和士象全', description: '劣势方巧妙求和', side: 'black', target: 'checkmate', category: '和棋', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[8][1] = R('horse'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[0][2] = B('elephant'); b[0][6] = B('elephant'); return b; })(),
    },
    {
        name: '老兵搜山求和', description: '老兵对士象巧妙和棋', side: 'black', target: 'checkmate', category: '和棋', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[1][4] = R('pawn'); b[0][4] = B('king'); b[0][3] = B('advisor'); b[1][5] = B('advisor'); b[0][2] = B('elephant'); return b; })(),
    },
    {
        name: '炮士难胜单象', description: '利用象的灵活性求和', side: 'black', target: 'checkmate', category: '和棋', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[7][4] = R('cannon'); b[7][3] = R('advisor'); b[0][4] = B('king'); b[2][4] = B('elephant'); return b; })(),
    },
    {
        name: '单炮和双士', description: '士象配合巧和炮方', side: 'black', target: 'checkmate', category: '和棋', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[5][4] = R('cannon'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); return b; })(),
    },
    {
        name: '马双象和单车', description: '双象连环巧和单车', side: 'black', target: 'checkmate', category: '和棋', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[5][4] = R('rook'); b[0][4] = B('king'); b[0][2] = B('elephant'); b[0][6] = B('elephant'); b[1][4] = B('horse'); return b; })(),
    },
    // ========== 扩展残局 (31-50) ==========
    {
        name: '单车胜单士', description: '单车巧破单士', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][0] = R('rook'); b[0][4] = B('king'); b[1][3] = B('advisor'); return b; })(),
    },
    {
        name: '单马胜单士', description: '马擒单士技巧', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[3][2] = R('horse'); b[0][4] = B('king'); b[1][3] = B('advisor'); return b; })(),
    },
    {
        name: '双炮胜双士', description: '双炮破双士防线', side: 'red', target: 'checkmate', category: '杀法', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[3][4] = R('cannon'); b[5][4] = R('cannon'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); return b; })(),
    },
    {
        name: '马炮胜士象全', description: '马炮巧胜士象全', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[4][3] = R('horse'); b[3][5] = R('cannon'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[0][2] = B('elephant'); b[0][6] = B('elephant'); return b; })(),
    },
    {
        name: '车马胜车双士', description: '车马对车双士的攻法', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[3][0] = R('rook'); b[4][2] = R('horse'); b[0][4] = B('king'); b[0][0] = B('rook'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); return b; })(),
    },
    {
        name: '炮高兵胜单象', description: '炮高兵巧胜单象', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[3][4] = R('cannon'); b[4][4] = R('pawn'); b[0][4] = B('king'); b[2][4] = B('elephant'); return b; })(),
    },
    {
        name: '双车胜车士象全', description: '双车攻车士象全', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][0] = R('rook'); b[2][8] = R('rook'); b[0][4] = B('king'); b[0][0] = B('rook'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[0][2] = B('elephant'); b[0][6] = B('elephant'); return b; })(),
    },
    {
        name: '车马冷着 II', description: '车+马冷着攻击', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[3][0] = R('rook'); b[2][3] = R('horse'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[0][2] = B('elephant'); return b; })(),
    },
    {
        name: '双炮双士胜单车', description: '双炮士胜单车', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[3][3] = R('cannon'); b[3][5] = R('cannon'); b[9][3] = R('advisor'); b[9][5] = R('advisor'); b[0][4] = B('king'); b[0][0] = B('rook'); return b; })(),
    },
    {
        name: '马双兵胜炮士', description: '马双兵巧胜炮士', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[3][3] = R('horse'); b[4][4] = R('pawn'); b[5][4] = R('pawn'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[0][0] = B('cannon'); return b; })(),
    },
    {
        name: '车马炮联攻', description: '车马炮三子联攻', side: 'red', target: 'checkmate', category: '杀法', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][0] = R('rook'); b[3][2] = R('horse'); b[1][4] = R('cannon'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[0][0] = B('rook'); return b; })(),
    },
    {
        name: '双车胁士', description: '双车胁士破防', side: 'red', target: 'checkmate', category: '杀法', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][3] = R('rook'); b[2][5] = R('rook'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); return b; })(),
    },
    {
        name: '马后炮 II', description: '马后炮进阶杀法', side: 'red', target: 'checkmate', category: '杀法', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[6][3] = R('horse'); b[7][4] = R('cannon'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[2][4] = B('elephant'); return b; })(),
    },
    {
        name: '炮打中营', description: '炮击中营绝杀', side: 'red', target: 'checkmate', category: '杀法', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[3][4] = R('cannon'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[0][0] = B('rook'); return b; })(),
    },
    {
        name: '车马冷着 III', description: '车马冷着第三式', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[3][0] = R('rook'); b[4][3] = R('horse'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[0][6] = B('elephant'); return b; })(),
    },
    {
        name: '双马饮泉', description: '双马连环攻击', side: 'red', target: 'checkmate', category: '杀法', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][3] = R('horse'); b[2][5] = R('horse'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); return b; })(),
    },
    {
        name: '车炮兵联攻', description: '车炮兵三子配合', side: 'red', target: 'checkmate', category: '杀法', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][0] = R('rook'); b[3][4] = R('cannon'); b[4][4] = R('pawn'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); b[0][0] = B('rook'); return b; })(),
    },
    {
        name: '单炮和单车', description: '炮方巧妙求和单车', side: 'black', target: 'checkmate', category: '和棋', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[5][4] = R('rook'); b[0][4] = B('king'); b[3][4] = B('cannon'); return b; })(),
    },
    {
        name: '单象和单兵', description: '象方巧妙求和单兵', side: 'black', target: 'checkmate', category: '和棋', difficulty: 1,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[3][4] = R('pawn'); b[0][4] = B('king'); b[2][4] = B('elephant'); return b; })(),
    },
    {
        name: '单车和炮双士', description: '单车巧妙求和炮双士', side: 'black', target: 'checkmate', category: '和棋', difficulty: 3,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[5][0] = R('rook'); b[0][4] = B('king'); b[3][4] = B('cannon'); b[1][3] = B('advisor'); b[1][5] = B('advisor'); return b; })(),
    },
    {
        name: '老兵搜山 II', description: '老兵推进巧胜', side: 'red', target: 'checkmate', category: '巧胜', difficulty: 2,
        board: (() => { const b = emptyBoard(); b[9][4] = R('king'); b[2][4] = R('pawn'); b[0][4] = B('king'); b[1][3] = B('advisor'); b[0][2] = B('elephant'); return b; })(),
    },
];
export const ALL_PUZZLES = ALL;
//# sourceMappingURL=puzzles.js.map