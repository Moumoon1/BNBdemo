# 泡泡堂 BNB Demo

![泡泡堂 BNB 开始界面](public/assets/ui/bnb-start-screen.png)

一个可嵌入个人作品集的泡泡堂风格网页小游戏。玩家需要在 90 秒内利用泡泡、地形和道具击败两名机器人。

项目使用 Phaser 3、TypeScript 和 Vite 开发，全部游戏逻辑在浏览器本地运行，不需要后端、账号或联网服务。

> 这是用于个人作品集和技术学习的非商业同人 Demo，与《泡泡堂》官方及其权利方不存在隶属或合作关系。

## 游戏内容

- 15 × 13 的单屏网格地图；
- 1 名玩家对战 2 名自动行动的机器人；
- 平滑移动、独立 X/Y 轴碰撞与贴墙滑动；
- 泡泡放置、倒计时、十字爆炸和连锁伤害；
- 可破坏建筑、可推动箱子和随机道具；
- 炸弹数量、爆炸范围和移动速度成长；
- 角色四方向行走、静止和死亡动画；
- 根据角色脚底位置进行动态纵深排序；
- 开始界面、游戏界面、倒计时、结算与重新开始；
- Menu 和 Village 两套背景音乐。

## 操作方式

| 操作 | 按键 |
| --- | --- |
| 向上移动 | `W` 或 `↑` |
| 向下移动 | `S` 或 `↓` |
| 向左移动 | `A` 或 `←` |
| 向右移动 | `D` 或 `→` |
| 放置泡泡 | `Space` |

浏览器通常要求用户先进行一次点击，之后才允许播放背景音乐。

## 技术栈

- [Phaser 3](https://phaser.io/)：游戏场景、渲染、动画、输入与音频；
- TypeScript：游戏逻辑与类型约束；
- Vite：本地开发与生产构建；
- Vitest：规则、机器人、箱子、爆炸和 UI 逻辑测试；
- Sharp：仅用于维护角色精灵图的素材处理脚本，不参与游戏运行。

## 本地运行

请先安装 Node.js 和 npm，然后执行：

```bash
git clone https://github.com/Moumoon1/BNBdemo.git
cd BNBdemo
npm install
npm run dev
```

浏览器打开终端中显示的本地地址即可试玩。

## 测试与构建

运行自动化测试：

```bash
npm test
```

生成生产环境静态文件：

```bash
npm run build
```

构建结果位于 `dist/`。可以将该目录部署到 Vercel、Netlify 或其他静态托管服务，也可以嵌入现有网站。

## 项目结构

```text
BNBdemo/
├── public/assets/       # 图片、精灵图和背景音乐
├── scripts/             # 素材处理脚本
├── src/
│   ├── ai/              # 机器人决策
│   ├── config/          # Phaser 游戏配置
│   ├── data/            # 地图与动态参数配置
│   ├── domain/          # 坐标、方向和规则等纯逻辑
│   ├── entities/        # 玩家、机器人、泡泡、道具和箱子
│   ├── scenes/          # 启动、菜单和游戏场景
│   ├── systems/         # 移动、碰撞、爆炸、AI 和渲染系统
│   └── ui/              # 计时器、侧栏和结算组件
├── index.html
└── vite.config.ts
```

代码按实体、规则、系统、场景与 UI 分层，动态参数集中在 `src/data/`，尽量保持高内聚、低耦合，避免把玩法数值散落在渲染代码中。

## 素材与参考

本项目由 [Moumoon1](https://github.com/Moumoon1) 与 Codex 协作开发。部分视觉素材来自 GitHub 开源项目或由 AI 辅助生成；实现过程中参考了以下项目和文章：

- [visolleon/bnb](https://github.com/visolleon/bnb)：地图、角色和 UI 素材，以及原版风格表现参考；
- [tpoisonooo/BnB](https://github.com/tpoisonooo/BnB)：泡泡堂玩法与机器人逻辑参考；
- [85bits — Bomberman Part 6: Bomb Rules](https://85bits.pages.dev/posts/bomberman-part-6-bomb-rules/)：分轴碰撞与墙面滑行思路。

相关素材和原始项目的权利及许可归各自作者所有。使用或再发布前，请同时检查对应来源仓库的许可证与素材授权范围。

## 当前定位

这是面向个人作品集的可玩 Demo，重点展示网页游戏架构、角色移动手感、碰撞处理、纵深遮挡、爆炸规则与基础机器人决策，不以完整复刻商业游戏为目标。

