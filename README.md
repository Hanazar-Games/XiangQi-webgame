# 中国象棋 - XiangQi WebGame

基于 TypeScript + Canvas 的中国象棋网页游戏，支持单机双人对战、人机对战和局域网联机对战。

## 功能特性

- **本地双人对战**：同一设备上两人轮流对弈
- **人机对战**：内置 AI 对手（基于 Minimax + Alpha-Beta 剪枝）
- **局域网联机**：通过 WebRTC 点对点连接，无需服务器，同一 WiFi 下即可对战
  - 创建房间（执红先行）
  - 加入房间（执黑后行）
  - 手动交换连接码即可建立 P2P 连接
- **完整规则**：支持中国象棋所有标准走法规则，包括将军检测、胜负判定
- **悔棋功能**：单机和人人模式支持悔棋（人机模式自动撤回双方各一步）

## 项目结构

```
├── index.html          # 入口页面
├── css/
│   └── style.css       # 样式
├── src/                # TypeScript 源码
│   ├── main.ts         # 主程序入口
│   ├── game/
│   │   ├── types.ts    # 类型定义
│   │   ├── rules.ts    # 走法规则与胜负判定
│   │   ├── board.ts    # 棋盘状态管理
│   │   ├── renderer.ts # Canvas 渲染
│   │   └── ai.ts       # AI 对手
│   └── network/
│       └── webrtc.ts   # P2P 联机
├── dist/               # 编译后的 JavaScript（已提交，用于部署）
├── package.json
└── tsconfig.json
```

## 本地运行

无需构建工具，直接用浏览器打开即可：

```bash
# 方式一：Python HTTP 服务器
python3 -m http.server 8080
# 然后访问 http://localhost:8080

# 方式二：Node.js HTTP 服务器
npx serve .
```

如需修改源码并重新编译：

```bash
npm install
npm run build
```

## 部署到 GitHub Pages

1. 将代码推送到 GitHub 仓库
2. 进入仓库 **Settings → Pages**
3. **Source** 选择 **Deploy from a branch**
4. 选择 **main** 分支，文件夹选 **/(root)**
5. 保存后即可通过 `https://<用户名>.github.io/<仓库名>` 访问

> `dist/` 目录已包含编译后的文件，确保一并提交。

## 联机对战说明

1. 一方点击**创建房间**，复制生成的连接码发给对方
2. 另一方点击**加入房间**，粘贴连接码后点击**获取应答码**
3. 将应答码发回给创建房间的一方，对方粘贴后点击**连接**
4. 双方建立 P2P 直连后即可开始对弈

## 技术栈

- TypeScript 5.x
- ES Modules
- Canvas 2D 渲染
- WebRTC DataChannel（P2P 联机）
