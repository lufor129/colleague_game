# 台大醫院急診室 — 辦公室對話遊戲 Demo

像素風格的辦公室敘事遊戲。玩家扮演法醫實習生小茜，在台大醫院急診室與 NPC 互動，幫助死亡病患的家屬回顧他們的一生。NPC 對話由 Claude API 即時生成，每位角色有完整的性格設定（persona）。

---

## 世界觀

地點：台大醫院急診室  
劇情原型：改編自美劇 *The Pitt*，移植至台灣場景

**核心敘事張力：**  
Robby 是急診主治醫師，職責是救人、往前看。  
小茜是法醫實習生，職責是替死者回顧、往後看。  
他們都會問家屬「他是什麼樣的人」——但原因相反。

---

## 角色設定

所有角色 persona 放在 `colleagues/{slug}/` 目錄下，分為三個檔案：

| 角色 | slug | 身份 | persona.md |
|------|------|------|------------|
| 小茜（子茜） | xiaoqian | 台大醫學院博士生，法醫實習生，玩家角色 | ✅ |
| Robby | robby | 急診室資深主治醫師，PTSD，嘴硬心軟 | ✅ |
| Dana | dana | 護理長，30年資歷，急診室的錨 | ✅ |
| Santos | santos | R2 住院醫師，菲律賓人，無濾網直接 | ✅ |
| Whitaker | whitaker | R1 住院醫師，內布拉斯加農場長大，自我懷疑 | ✅ |

### 角色關係網（重要，影響對話生成）

```
Robby ←────────── 30年老戰友 ──────────→ Dana
  │  嚴格=在乎 (Adamson投影)             │ busting chops=信任
  ↓                                      ↓
Whitaker ←──── 室友/都有傷未說 ────→ Santos
  │         (Huckleberry外號)             │
  └──────── 小茜（局外人視角，帶來Robby不想面對的問題）────┘
```

每個角色在 `Layer 4` 都有對其他每位角色的具體互動規則，以及 **「你沒說的」** 內心獨白（供 AI 生成對話時使用）。

---

## 技術架構

```
colleague_game/
├── README.md               ← 本文件
├── IMPLEMENTATION.md       ← 開發細節（見下方）
├── colleagues/             ← 角色 persona 資料庫
│   ├── xiaoqian/
│   │   ├── persona.md      ← 5層性格設定
│   │   ├── work.md         ← 工作能力設定
│   │   └── SKILL.md        ← 合併版（供 Claude 呼叫）
│   ├── robby/
│   ├── dana/
│   ├── santos/
│   └── whitaker/
└── game/                   ← Phaser.js 遊戲本體
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.js
        ├── scenes/
        │   ├── BootScene.js    ← 啟動畫面（API Key 輸入）
        │   └── ERScene.js      ← 急診室場景
        └── dialogue/
            ├── DialogueEngine.js   ← Claude API 串接核心
            ├── DialogueBox.js      ← 對話框 DOM UI
            └── story.json          ← 劇情狀態機
```

### 技術選型

| 項目 | 選擇 | 原因 |
|------|------|------|
| 遊戲引擎 | Phaser.js 3 | JavaScript，AI 生成程式碼品質高，無需學習新語言 |
| 建構工具 | Vite | 快速 HMR，ES module 支援 |
| 對話生成 | Claude API (claude-haiku-4-5) | 低延遲，token 效率高，適合即時對話 |
| 美術（目標） | Tiled + 像素 sprite | 標準像素遊戲工作流 |
| 美術（現況） | 純色方塊佔位 | 先跑通邏輯再補美術 |

---

## 快速啟動

```bash
cd game
npm install
npm run dev
# 開啟 http://localhost:3000
# 輸入 Anthropic API Key（sk-ant-...）進入遊戲
```

操作：
- `WASD` / 方向鍵移動
- 靠近 NPC 按 `E` 開始對話
- 在輸入框輸入台詞，Claude 即時生成 NPC 回應
- `ESC` 關閉對話框

---

## Demo 劇情大綱（Act 1）

| 場景 ID | 地點 | 觸發條件 | 目標 |
|---------|------|---------|------|
| `arrival` | 急診室入口 | 遊戲開始 | 小茜與 Robby 第一次碰面，建立世界觀 |
| `first_patient` | 急診走廊 | 離開入口 | Dana 告知案件：陳文雄（65歲，心肌梗塞）；小茜向 Robby 確認死亡細節 |
| `family_meeting` | 等候室 | 確認細節後 | 小茜獨自面對女兒陳美珠，問「他是什麼樣的人」 |
| `act1_end` | 急診走廊 | 會談結束 | Robby 碰見小茜，問「你問她什麼？」——留下懸念 |

### 第一位死亡病患

**陳文雄**，65歲，退休國小老師  
死因：心肌梗塞  
背景：獨居，每天晨跑，被鄰居發現倒在公園  
家屬：女兒陳美珠（38歲），上個月才回家吃飯

---

## 尚未完成的功能（Codex 接手清單）

詳見 `IMPLEMENTATION.md`
