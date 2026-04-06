# Act 1 Progression Design

**Goal**
讓目前的急診室 Demo 從「可自由和 NPC 對話」提升為「Act 1 可以完整從 arrival 走到 act1_end」的可玩原型，同時保留既有 persona 與即時 Claude 對話架構。

**Scope**
- 補齊場景推進機制
- 補齊 family meeting 所需的 NPC 與場景佈局
- 補齊開發期可用的 API proxy
- 補齊可自動驗證的純邏輯測試
- 補一份接手說明，讓後續開發知道目前狀態與下一步

**Recommended Approach**
將「劇情完成判定」與「場景配置」抽離成純函式，讓它們可以在 Vitest 下獨立驗證；`ERScene` 僅負責把這些結果映射到 Phaser 畫面、互動提示與淡入淡出轉場。這樣能在不大幅重構的前提下，把目前的原型往穩定 demo 推進。

**Key Decisions**
- 對話完成訊號採用 `"[SCENE_COMPLETE]"` 標記，由 `DialogueEngine` 清洗文字並發出事件。
- `ERScene` 依 `story.json` 的 `required_characters` 與場景 id 載入 NPC，可再用少量場景配置覆蓋位置與房間標籤。
- 等候室先用程式繪製簡單視覺區隔，不引入 Tiled，避免超出目前範圍。
- API 呼叫改走 Vite dev proxy 路徑 `/api/claude/v1/messages`，符合現有 demo 使用方式。

**Testing Strategy**
- 為 `DialogueEngine` 的標記解析與歷史保留撰寫單元測試。
- 為場景配置函式撰寫單元測試，驗證各場景可見 NPC 與座標。
- 保留 `npm run build` 作為整體整合驗證。

**Out of Scope**
- 像素美術、Tiled 地圖、旁白系統、Journal、多案件架構。
