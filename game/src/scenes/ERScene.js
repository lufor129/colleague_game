import Phaser from 'phaser'
import { DialogueEngine } from '../dialogue/DialogueEngine.js'
import {
  appendLoadingTurn,
  appendPlayerTurn,
  appendSystemAction,
  canReleaseMovement,
  DialogueBox,
  replaceLoadingTurn
} from '../dialogue/DialogueBox.js'
import storyData from '../dialogue/story.json'
import { getSceneState } from './sceneConfig.js'
import { canManuallyAdvanceScene, getSuggestedPromptOptions } from '../dialogue/DialogueEngine.js'

/**
 * ERScene — 急診室場景（Act 1 Demo）
 *
 * 玩家操控小茜，在急診室走動，靠近 NPC 時觸發對話
 */
export class ERScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ERScene' })
  }

  init(data) {
    this.apiKey = data.apiKey
    this.currentSceneId = 'arrival'
  }

  preload() {
    // 臨時用純色方塊替代像素美術，開發期先跑起來
    // 之後換成 Tiled 地圖和像素 sprite
  }

  create() {
    this.dialogueEngine = new DialogueEngine(this.apiKey)
    this.dialogueBox = new DialogueBox(this)
    this.activeNPC = null
    this.isTransitioning = false
    this.roomLayer = this.add.layer()
    this.npcLayer = this.add.layer()
    this.npcLabels = []
    this.sceneCompleteHandler = (event) => {
      const { nextSceneId } = event.detail
      if (nextSceneId) {
        this._transitionToScene(nextSceneId)
      }
    }
    this.dialogueEngine.addEventListener('sceneComplete', this.sceneCompleteHandler)
    this.events.once('shutdown', () => this.shutdown())

    this.titleLabel = this.add.text(400, 40, '台大醫院急診室', {
      fontSize: '14px',
      color: '#7eb8f7',
      fontFamily: 'Noto Sans TC, Microsoft JhengHei, sans-serif'
    }).setOrigin(0.5)

    // ---- 玩家（小茜） ----
    this.player = this._createCharSprite(200, 350, 0xe8a87c, '小茜')
    this.npcs = {}

    // ---- 互動提示 ----
    this.interactHint = this.add.text(400, 520, '', {
      fontSize: '12px',
      color: '#aaaacc',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5)

    // ---- 鍵盤 ----
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys('W,A,S,D')
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    this.escKey.on('down', () => {
      if (!this.dialogueBox.isVisible) return
      this.dialogueBox.hide()
      this.dialogueBox.onSubmit = null
    })

    // ---- 載入場景 ----
    this._loadScene(this.currentSceneId)
  }

  update() {
    if (this.isTransitioning || !canReleaseMovement(this.dialogueBox.isVisible, this.dialogueBox.isInputFocused())) return

    const speed = 2
    let vx = 0, vy = 0

    if (this.cursors.left.isDown  || this.wasd.A.isDown) vx = -speed
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed
    if (this.cursors.up.isDown    || this.wasd.W.isDown) vy = -speed
    if (this.cursors.down.isDown  || this.wasd.S.isDown) vy = speed

    this.player.x = Phaser.Math.Clamp(this.player.x + vx, 50, 750)
    this.player.y = Phaser.Math.Clamp(this.player.y + vy, 200, 530)
    this.player.label.x = this.player.x
    this.player.label.y = this.player.y - 22

    // 偵測靠近 NPC
    let nearNPC = null
    for (const npc of Object.values(this.npcs)) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y)
      if (dist < 80) {
        nearNPC = npc
        break
      }
    }

    if (nearNPC) {
      this.interactHint.setText(`靠近 ${nearNPC.charName}，按 [E] 對話`)
      this.activeNPC = nearNPC
    } else {
      this.interactHint.setText('')
      this.activeNPC = null
    }

    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.activeNPC) {
      this._startDialogue(this.activeNPC)
    }
  }

  // ---- 私有方法 ----

  _createCharSprite(x, y, color, name) {
    const sprite = this.add.rectangle(x, y, 24, 32, color)
    const label = this.add.text(x, y - 22, name, {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      backgroundColor: '#00000066',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5)
    sprite.label = label
    return sprite
  }

  _createNPCObject(x, y, color, name, charId) {
    const sprite = this.add.rectangle(x, y, 24, 32, color)
    const label = this.add.text(x, y - 22, name, {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      backgroundColor: '#00000066',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5)
    sprite.charName = name
    sprite.charId = charId
    sprite.label = label
    this.npcLayer.add(sprite)
    this.npcLayer.add(label)
    this.npcLabels.push(label)
    return sprite
  }

  _loadScene(sceneId) {
    const act = storyData.acts.act1
    const scene = act.scenes.find(s => s.id === sceneId)
    if (!scene) return

    this.currentStoryScene = scene
    this.currentSceneId = sceneId
    this.dialogueEngine.setScene(scene)
    this._applySceneState(sceneId)

    // 顯示場景說明（右上角小字）
    if (this.sceneLabel) this.sceneLabel.destroy()
    this.sceneLabel = this.add.text(790, 10, scene.title || scene.id, {
      fontSize: '11px',
      color: '#4a6fa5',
      fontFamily: 'sans-serif'
    }).setOrigin(1, 0)
  }

  _applySceneState(sceneId) {
    const state = getSceneState(sceneId)
    if (!state) return

    this._drawRoom(state)
    this._setPlayerPosition(state.playerSpawn)
    this._renderNPCs(state.npcs)
  }

  _drawRoom(state) {
    this.roomLayer.removeAll(true)

    this.roomLayer.add(this.add.rectangle(400, 300, 800, 600, 0x1a1a2e))

    if (state.room === 'waiting_room') {
      this.roomLayer.add(this.add.rectangle(400, 350, 780, 400, 0x2b2438))
      this.roomLayer.add(this.add.rectangle(400, 155, 780, 10, 0xa58bb7))
      this.roomLayer.add(this.add.rectangle(620, 350, 180, 90, 0x4d425d))
      this.roomLayer.add(this.add.rectangle(620, 350, 150, 56, 0x7f6f8f))
      this.roomLayer.add(this.add.text(115, 118, '等候室', {
        fontSize: '12px',
        color: '#cdbde0',
        fontFamily: 'Noto Sans TC, Microsoft JhengHei, sans-serif'
      }))
    } else {
      this.roomLayer.add(this.add.rectangle(400, 350, 780, 400, 0x2a2a3e))
      this.roomLayer.add(this.add.rectangle(400, 155, 780, 10, 0x4a6fa5))

      for (let x = 100; x <= 700; x += 150) {
        this.roomLayer.add(this.add.rectangle(x, 160, 60, 6, 0x7eb8f7, 0.4))
      }

      this.roomLayer.add(this.add.text(95, 118, '急診走廊', {
        fontSize: '12px',
        color: '#9ebfe7',
        fontFamily: 'Noto Sans TC, Microsoft JhengHei, sans-serif'
      }))
    }
  }

  _setPlayerPosition(playerSpawn) {
    if (!playerSpawn) return
    this.player.x = playerSpawn.x
    this.player.y = playerSpawn.y
    this.player.label.x = playerSpawn.x
    this.player.label.y = playerSpawn.y - 22
  }

  _renderNPCs(npcs) {
    for (const npc of Object.values(this.npcs)) {
      npc.label?.destroy()
      npc.destroy()
    }

    this.npcs = {}
    this.npcLabels = []

    for (const npc of npcs) {
      this.npcs[npc.charId] = this._createNPCObject(
        npc.x,
        npc.y,
        npc.color,
        npc.charName,
        npc.charId
      )
    }
  }

  _startDialogue(npc) {
    this.dialogueBox.show(npc.charName)
    this.dialogueBox.setHistory(this.dialogueEngine.history, npc.charName)
    this.dialogueBox.setOptions(this._getPromptOptionsForCurrentScene())
    this.dialogueBox.setAdvanceAction(this._canAdvanceCurrentScene())
    this.dialogueBox.onAdvance = () => {
      if (!this.currentStoryScene?.next_scene) return
      this.dialogueBox.transcript = appendSystemAction(this.dialogueBox.transcript, '已手動推進到下一幕。')
      this.dialogueBox.renderTranscript()
      this._transitionToScene(this.currentStoryScene.next_scene)
    }
    this.dialogueBox.onSubmit = async (playerText) => {
      this.dialogueBox.transcript = appendPlayerTurn(this.dialogueBox.transcript, playerText)
      this.dialogueBox.transcript = appendLoadingTurn(this.dialogueBox.transcript, npc.charName)
      this.dialogueBox.renderTranscript()
      this.dialogueBox.setOptions([])
      this.dialogueBox.setAdvanceAction(false)
      try {
        const reply = await this.dialogueEngine.generateResponse(
          npc.charId,
          'xiaoqian',
          playerText
        )
        this.dialogueBox.transcript = replaceLoadingTurn(this.dialogueBox.transcript, npc.charName, reply)
        this.dialogueBox.renderTranscript()
        this.dialogueBox.setOptions(this._getPromptOptionsForCurrentScene())
        this.dialogueBox.setAdvanceAction(this._canAdvanceCurrentScene())
      } catch (err) {
        console.error(err)
        this.dialogueBox.setError(err.message)
        this.dialogueBox.setOptions(this._getPromptOptionsForCurrentScene())
        this.dialogueBox.setAdvanceAction(this._canAdvanceCurrentScene())
      }
    }
  }

  _transitionToScene(nextSceneId) {
    if (this.isTransitioning) return

    this.isTransitioning = true
    this.activeNPC = null
    this.interactHint.setText('')
    this.dialogueBox.hide()
    this.dialogueBox.onSubmit = null

    this.cameras.main.fadeOut(500, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this._loadScene(nextSceneId)
      this.cameras.main.fadeIn(500, 0, 0, 0)
    })
    this.cameras.main.once('camerafadeincomplete', () => {
      this.isTransitioning = false
    })
  }

  shutdown() {
    this.dialogueEngine?.removeEventListener('sceneComplete', this.sceneCompleteHandler)
    this.dialogueBox?.destroy()
  }

  _getPromptOptionsForCurrentScene() {
    return getSuggestedPromptOptions(
      getSceneState(this.currentSceneId)?.promptOptions ?? [],
      this.dialogueEngine.history
    )
  }

  _canAdvanceCurrentScene() {
    return canManuallyAdvanceScene(
      this.dialogueEngine.history,
      this.currentStoryScene?.next_scene
    )
  }
}
