# IMPLEMENTATION.md — 開發細節與 Codex 接手清單

本文件供 Codex 接手開發使用。記錄現有實作狀態、待辦事項、設計決策與注意事項。

---

## 現有實作狀態

### ✅ 已完成

1. **角色 persona 資料庫**（`colleagues/`）
   - 5 位角色全部建立：xiaoqian, robby, dana, santos, whitaker
   - 每位角色有 persona.md（5層格式）、work.md、SKILL.md
   - 角色互相關係已寫入各自 Layer 4，含「你沒說的」內心獨白

2. **Phaser.js 專案骨架**（`game/`）
   - Vite + Phaser 3.80.1
   - BootScene：API Key 輸入畫面
   - ERScene：基本場景（純色方塊佔位，WASD 移動，靠近 NPC 按 E 對話）

3. **Claude API 對話引擎**（`game/src/dialogue/DialogueEngine.js`）
   - 呼叫 `claude-haiku-4-5-20251001`
   - 每個角色有 persona prompt 摘要（從 persona.md 精簡，控制 token）
   - 自動注入場景 context（地點、情況、目標）
   - 對話歷史保留最近 10 輪（避免 token 爆炸）
   - 支援 `setScene()` 切換場景

4. **對話框 UI**（`game/src/dialogue/DialogueBox.js`）
   - DOM overlay（覆蓋在 Phaser canvas 上）
   - 顯示 NPC 名稱 + 回應文字
   - 玩家輸入框 + 送出按鈕（Enter 鍵觸發）
   - Loading 狀態（「⋯」）與錯誤狀態

5. **劇情狀態機**（`game/src/dialogue/story.json`）
   - Act 1 四個場景定義
   - 包含死亡病患資料（陳文雄）與家屬資料（陳美珠）

---

## 待辦事項（優先順序）

### P0 — 讓 Demo 可以完整跑通

#### 1. 劇情推進邏輯

**問題：** 現在場景切換完全沒有實作。玩家可以和 Robby / Dana 聊天，但不知道何時進入下一個場景。

**設計決策：**
- 採用「關鍵字觸發」而非「特定對話輪數」
- DialogueEngine 分析 NPC 回應內容，偵測劇情推進信號

**實作方向：**

```javascript
// DialogueEngine.js 新增
async generateResponse(speakerCharId, listenerCharId, playerInput) {
  // ... 現有邏輯 ...

  // 在 system prompt 加入：
  // 「如果這段對話完成了場景目標，在回應末尾加上 [SCENE_COMPLETE]」
  // 然後在這裡偵測並 emit 事件

  if (reply.includes('[SCENE_COMPLETE]')) {
    const cleanReply = reply.replace('[SCENE_COMPLETE]', '').trim()
    this.emit('sceneComplete', this.currentScene.next_scene)
    return cleanReply
  }
  return reply
}
```

DialogueEngine 需要繼承 `Phaser.Events.EventEmitter` 或自建 EventEmitter。

ERScene 監聽 `sceneComplete` 事件，呼叫 `this._loadScene(nextSceneId)`。

#### 2. 新增家屬 NPC（陳美珠）

**現況：** story.json 有陳美珠資料，但 ERScene 沒有她的 NPC 物件，DialogueEngine 也沒有她的 persona prompt。

**待辦：**

a) `DialogueEngine.js` 的 `PERSONA_PROMPTS` 加入：
```javascript
chen_meizhu: `你是陳美珠，38歲，陳文雄的女兒。
父親今天早上在公園心肌梗塞去世，你剛哭過一輪，現在只是坐著。
你跟父親的關係：他退休後你擔心他獨居，但他說他有晨跑習慣很健康。你上個月才回家吃飯。
說話：疲憊、偶爾語句不完整、對陌生人的問題會遲疑一下才回答。`
```

b) `ERScene.js` 新增場景：等候室（waiting_room）。等候室是獨立房間，玩家走到螢幕右邊觸發場景切換。

c) ERScene 根據 `currentSceneId` 決定顯示哪些 NPC：
```javascript
const SCENE_NPCS = {
  arrival:        ['robby'],
  first_patient:  ['robby', 'dana'],
  family_meeting: ['chen_meizhu'],
  act1_end:       ['robby']
}
```

#### 3. 場景切換動畫

最簡單的做法：黑色遮罩 fade in/out。

```javascript
// ERScene.js
_transitionToScene(nextSceneId) {
  this.cameras.main.fadeOut(500, 0, 0, 0)
  this.cameras.main.once('camerafadeoutcomplete', () => {
    this._loadScene(nextSceneId)
    this._repositionNPCs()
    this.cameras.main.fadeIn(500, 0, 0, 0)
  })
}
```

---

### P1 — 完善 Demo 體驗

#### 4. 解決 CORS 問題（正式 Demo 必須）

**問題：** 直接從瀏覽器 fetch Anthropic API 會被 CORS 擋住（現在 dev 模式下用 Vite proxy 可以繞過）。

**解決方案：** 加入 Vite proxy 設定：

```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api/claude': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, '')
      }
    }
  }
})
```

然後 DialogueEngine.js 的 fetch URL 改為 `/api/claude/v1/messages`。

**注意：** Build 後部署到靜態主機（GitHub Pages 等）就沒有 proxy 了，需要另外建 serverless function 或後端。Demo 階段用 Vite dev server 跑就好。

#### 5. 對話框改善

- 加入打字機效果（逐字顯示）
- NPC 說話時玩家輸入框 disable
- 顯示對話歷史（可捲動）

打字機效果參考：
```javascript
setText(text) {
  this.bodyDom.textContent = ''
  let i = 0
  const interval = setInterval(() => {
    this.bodyDom.textContent += text[i]
    i++
    if (i >= text.length) clearInterval(interval)
  }, 30)
}
```

#### 6. 旁白系統

部分場景需要旁白（不是 NPC 對話，是場景描述）。例如 act1_end 的「Robby 碰巧看見小茜推著病床」。

建一個獨立的 `NarratorBox.js`，樣式不同於對話框（居中、斜體、半透明背景）。

---

### P2 — 像素美術

#### 7. 地圖（Tiled）

工具：[Tiled Map Editor](https://www.mapeditor.org/)（免費）

建議流程：
1. 用 Tiled 畫急診室地圖（走廊、等候室、護理站）
2. 匯出 JSON 格式
3. Phaser 用 `this.make.tilemap({ key: 'er_map' })` 載入

免費像素醫院 tileset 來源：
- [itch.io 搜尋 "hospital tileset pixel"](https://itch.io/game-assets/tag-pixel-art/tag-hospital)
- LPC（Liberated Pixel Cup）開源資源

#### 8. 角色 Sprite

每個角色最少需要：
- 站立（4方向各1幀，共4張）
- 行走（4方向各4幀，共16張）
- 說話（1幀，嘴巴動畫可選）

建議用 [Aseprite](https://www.aseprite.org/)（USD 20，業界標準）或 Libresprite（免費 fork）。

角色顏色建議：
- 小茜：米色外套（她是法醫，穿便服）
- Robby：深藍色刷手服
- Dana：護理師白色制服
- Santos：刷手服（深綠）
- Whitaker：刷手服（淺藍）

---

### P3 — 遊戲系統擴充

#### 9. 案件記錄本（Journal）

玩家按 `J` 開啟記錄本，顯示：
- 本案死亡病患資料（陳文雄）
- 與家屬對話中收集到的關鍵資訊
- Robby 告訴你的醫療細節

實作建議：DOM overlay，類似 DialogueBox 的做法。

#### 10. 多案件架構

story.json 加入 `act2`、`act3`，每個 act 有不同的死亡病患和家屬。每個 act 結束時，玩家收到新的卷宗。

#### 11. 記憶系統（可選）

DialogueEngine 跨場景保留部分記憶，讓 NPC 記得之前說過的話。例如 Robby 在 act1_end 時能提到你在等候室問了什麼。

實作：localStorage 儲存對話摘要，每個場景結束時用 Claude 生成一句摘要存起來，下個場景開始時注入 system prompt。

---

## 重要設計規則

### 對話生成規則（DialogueEngine system prompt）

所有角色對話必須遵守：
1. 繁體中文
2. 一次 2-4 句，像 LINE 訊息不是作文
3. 嚴格保持角色說話風格（口頭禪、語氣）
4. 不要解釋自己的情緒，把情緒放在行動和停頓裡
5. 不要離開角色

### Persona 優先級

每個 `persona.md` 有 5 層，**Layer 0 最高優先**（任何情況下不得違背）。  
修改 persona prompt 時務必保留 Layer 0 的核心性格規則。

### Token 預算

- System prompt per character：約 200-300 tokens
- 對話歷史上限：20 條（約 500-800 tokens）
- NPC 回應上限：300 tokens
- 總計每次 API 呼叫：約 1000-1500 tokens
- 使用 claude-haiku-4-5（最便宜，適合即時對話）

---

## 檔案索引

```
colleague_game/
├── README.md                           ← 專案概覽
├── IMPLEMENTATION.md                   ← 本文件
├── colleagues/
│   ├── xiaoqian/
│   │   ├── persona.md                  ← 玩家角色性格（5層）
│   │   ├── work.md                     ← 法醫工作能力
│   │   └── SKILL.md                    ← 合併版
│   ├── robby/
│   │   ├── persona.md
│   │   ├── work.md
│   │   └── SKILL.md
│   ├── dana/
│   ├── santos/
│   └── whitaker/
└── game/
    ├── index.html
    ├── package.json                    ← phaser 3.80.1, vite 5
    ├── vite.config.js
    └── src/
        ├── main.js                     ← Phaser.Game 設定，載入 BootScene → ERScene
        ├── scenes/
        │   ├── BootScene.js            ← API Key 輸入畫面（DOM overlay）
        │   └── ERScene.js              ← 主場景：移動、NPC互動、場景狀態
        └── dialogue/
            ├── DialogueEngine.js       ← Claude API 呼叫，含各角色 persona prompt
            ├── DialogueBox.js          ← NPC對話框 + 玩家輸入（DOM overlay）
            └── story.json              ← Act 1 劇情狀態機（4個場景定義）
```

---

## 已知問題

1. **CORS**：直接 fetch Anthropic API 在生產環境會失敗，需要 proxy（見 P1-4）
2. **場景切換未實作**：ERScene 只有 `arrival` 場景，沒有自動推進到 `first_patient` 等
3. **陳美珠 NPC 未放入場景**：story.json 有她的資料但 ERScene 沒有對應的遊戲物件
4. **純色方塊美術**：所有角色和背景都是純色矩形，尚未換成像素 sprite

---

## 開發環境

```
Node.js >= 18
npm install
npm run dev    # http://localhost:3000
```

需要 Anthropic API Key（`sk-ant-...`）才能使用對話功能。
