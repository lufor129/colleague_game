# 台大醫院急診室

像素風格的敘事對話遊戲 Demo。玩家扮演法醫實習生，在台大醫院急診室裡與醫護角色和家屬互動，透過對話逐步回顧死者的一生。

這個專案目前是「可玩的 AI 敘事遊戲原型」：已經有 Act 1 劇情流程、角色 persona、場景切換、聊天式對話介面，以及用 MiniMax API 驅動的 NPC 即時回應。

## Demo

![雙欄對話與遊戲主畫面](PNG/截圖%202026-04-06%2011.49.06.png)

![聊天式對話欄與劇情互動](PNG/截圖%202026-04-06%2011.52.23.png)

## 專案特色

- 小茜、Robby、Dana、陳美珠等角色都有獨立 persona 設定
- 對話採用聊天視窗形式，支援歷史訊息、讀取動畫、自由輸入
- 左側固定對話欄，右側保留完整遊戲畫面，避免遮擋主畫面
- 提供符合小茜個性的動態劇情選項，同時保留玩家自由輸入
- 已有 Act 1 場景切換：`arrival -> first_patient -> family_meeting -> act1_end`
- 內建手動 `繼續主線` fallback，避免劇情卡死

## 世界觀

地點是台大醫院急診室，劇情原型改編自 *The Pitt* 並移植到台灣場景。

核心敘事張力是：

- Robby 是急診主治醫師，職責是救人、往前看
- 小茜是法醫實習生，職責是替死者回顧、往後看
- 他們都會問家屬「他是什麼樣的人」，但理由完全不同

## 角色資料

所有角色資料都放在 `colleagues/{slug}/`。

目前已建立：

- `xiaoqian`
- `robby`
- `dana`
- `santos`
- `whitaker`

每位角色至少有：

- `persona.md`：5 層人格與說話風格
- `work.md`：工作能力設定
- `SKILL.md`：給 LLM 使用的整合版設定

## 目前玩法

啟動遊戲後：

1. 輸入 MiniMax API Key
2. 進入急診室場景
3. 用 `WASD` / 方向鍵移動
4. 靠近 NPC 按 `E` 對話
5. 在左側聊天欄中：
   - 點選動態劇情選項
   - 或自由輸入台詞
6. 若模型沒有自動推進劇情，可按 `繼續主線`

補充：

- 對話框開著但沒有在輸入時，仍可繼續移動角色
- `ESC` 可關閉對話欄

## Demo 劇情

目前實作的是 Act 1：第一個病人。

場景流程：

- `arrival`：小茜第一次進入急診室，和 Robby 碰面
- `first_patient`：確認死亡病患陳文雄的基本資訊
- `family_meeting`：小茜與女兒陳美珠對話
- `act1_end`：Robby 問小茜「你問她什麼？」

第一位病患設定：

- 姓名：陳文雄
- 年齡：65
- 身分：退休國小老師
- 死因：心肌梗塞
- 家屬：女兒陳美珠

## 技術架構

### 遊戲端

- `Phaser.js 3`
- `Vite`
- DOM-based 對話 UI

### 對話端

- `MiniMax-M2.7`
- 採用 MiniMax 的 Anthropic-compatible API
- 透過 Vite dev proxy 呼叫本地路徑：
  - `/api/minimax/anthropic/v1/messages`

### 專案結構

```text
colleague_game/
├── README.md
├── IMPLEMENTATION.md
├── PNG/
├── colleagues/
└── game/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.js
        ├── scenes/
        │   ├── BootScene.js
        │   ├── ERScene.js
        │   └── sceneConfig.js
        └── dialogue/
            ├── DialogueEngine.js
            └── DialogueBox.js
```

## 快速啟動

```bash
cd game
npm install
npm run dev
```

然後開啟：

```text
http://localhost:3000
```

進入遊戲後輸入 MiniMax API Key 即可。

## 測試與建置

```bash
cd game
npm test -- --run
npm run build
```

## 目前狀態

目前這個專案已經具備：

- 可遊玩的 AI 對話原型
- 左右雙欄 UI
- 聊天式對話體驗
- 動態選項 + 自由輸入
- 基礎劇情推進

但它仍然是 Demo，還沒有完成：

- 正式像素美術
- 更多案件 / 更多章節
- 更穩定的自動劇情推進條件
- 生產環境後端代理

## 已知限制

- 目前仍依賴模型輸出與對話內容來輔助劇情推進
- 生產環境不能只靠 Vite proxy，之後需要正式後端
- 前端 bundle 仍偏大，build 會出現 chunk size warning

## 開發補充

更細的開發狀態、接手筆記與待辦清單在：

- [IMPLEMENTATION.md](IMPLEMENTATION.md)
