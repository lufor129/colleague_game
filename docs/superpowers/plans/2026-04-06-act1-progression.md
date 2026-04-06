# Act 1 Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Act 1 fully playable from `arrival` through `act1_end` while keeping the codebase testable and easy to hand off.

**Architecture:** Move progression rules into testable helpers, let `DialogueEngine` emit a scene-complete signal, and have `ERScene` react by swapping room layout, visible NPCs, and player placement with a fade transition. Keep DOM dialogue UI intact and limit scope to the current Phaser prototype.

**Tech Stack:** Phaser 3, Vite 5, Vitest, browser fetch, DOM overlay UI

---

### Task 1: Add test harness and failing coverage for progression logic

**Files:**
- Modify: `game/package.json`
- Modify: `game/vite.config.js`
- Create: `game/src/dialogue/DialogueEngine.test.js`
- Create: `game/src/scenes/sceneConfig.test.js`

- [ ] Step 1: Write failing tests for scene-complete parsing and scene config lookups.
- [ ] Step 2: Run `npm test -- --run` in `game/` and confirm failures are about missing exports/functions.
- [ ] Step 3: Add the minimal Vitest setup required to execute the tests.
- [ ] Step 4: Re-run `npm test -- --run` and keep the suite red for the intended missing logic.

### Task 2: Implement progression helpers and make tests pass

**Files:**
- Modify: `game/src/dialogue/DialogueEngine.js`
- Create: `game/src/scenes/sceneConfig.js`

- [ ] Step 1: Implement helper functions for parsing completion markers and scene configuration lookup.
- [ ] Step 2: Update `DialogueEngine` to emit completion events and use the proxy endpoint.
- [ ] Step 3: Run `npm test -- --run` and confirm the new tests pass.

### Task 3: Wire progression into Phaser scene flow

**Files:**
- Modify: `game/src/scenes/ERScene.js`

- [ ] Step 1: Update `ERScene` to subscribe to the dialogue completion event.
- [ ] Step 2: Render room-specific layout and NPC visibility from scene configuration.
- [ ] Step 3: Add fade transitions and scene-based player repositioning.
- [ ] Step 4: Run `npm test -- --run` and `npm run build`.

### Task 4: Refresh handoff documentation and perform review

**Files:**
- Modify: `README.md`
- Modify: `IMPLEMENTATION.md`

- [ ] Step 1: Update docs so they match the actual implementation status after Task 3.
- [ ] Step 2: Review the final diff for bugs, regressions, and missing tests.
- [ ] Step 3: Run final verification with `npm test -- --run` and `npm run build`.
