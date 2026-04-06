import Phaser from 'phaser'
import { DialogueEngine } from '../dialogue/DialogueEngine.js'
import { DialogueBox } from '../dialogue/DialogueBox.js'
import storyData from '../dialogue/story.json'

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

    // ---- 場景背景（臨時） ----
    this.add.rectangle(400, 300, 800, 600, 0x1a1a2e)  // 深藍背景

    // 急診室地板
    this.add.rectangle(400, 350, 780, 400, 0x2a2a3e)
    this.add.rectangle(400, 155, 780, 10, 0x4a6fa5)   // 頂部牆線

    // 走廊燈光效果
    for (let x = 100; x <= 700; x += 150) {
      this.add.rectangle(x, 160, 60, 6, 0x7eb8f7, 0.4)
    }

    this.add.text(400, 40, '台大醫院急診室', {
      fontSize: '14px',
      color: '#7eb8f7',
      fontFamily: 'Noto Sans TC, Microsoft JhengHei, sans-serif'
    }).setOrigin(0.5)

    // ---- 玩家（小茜） ----
    this.player = this._createCharSprite(200, 350, 0xe8a87c, '小茜')

    // ---- NPC ----
    this.npcs = {
      robby: this._createNPCObject(550, 320, 0x4a7c59, 'Robby', 'robby'),
      dana:  this._createNPCObject(650, 380, 0x7a5c8a, 'Dana',  'dana'),
    }

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

    // ---- 載入場景 ----
    this._loadScene(this.currentSceneId)
  }

  update() {
    if (this.dialogueBox.isVisible) return  // 對話中不移動

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
    for (const [id, npc] of Object.entries(this.npcs)) {
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
    this.add.text(x, y - 22, name, {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      backgroundColor: '#00000066',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5)
    sprite.charName = name
    sprite.charId = charId
    return sprite
  }

  _loadScene(sceneId) {
    const act = storyData.acts.act1
    const scene = act.scenes.find(s => s.id === sceneId)
    if (!scene) return

    this.currentStoryScene = scene
    this.dialogueEngine.setScene(scene)

    // 顯示場景說明（右上角小字）
    if (this.sceneLabel) this.sceneLabel.destroy()
    this.sceneLabel = this.add.text(790, 10, scene.title || scene.id, {
      fontSize: '11px',
      color: '#4a6fa5',
      fontFamily: 'sans-serif'
    }).setOrigin(1, 0)
  }

  _startDialogue(npc) {
    this.dialogueBox.show(npc.charName)
    this.dialogueBox.onSubmit = async (playerText) => {
      this.dialogueBox.setLoading()
      try {
        const reply = await this.dialogueEngine.generateResponse(
          npc.charId,
          'xiaoqian',
          playerText
        )
        this.dialogueBox.setText(reply)
      } catch (err) {
        console.error(err)
        this.dialogueBox.setError(err.message)
      }
    }

    // ESC 關閉對話
    const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    escKey.once('down', () => {
      this.dialogueBox.hide()
      this.dialogueBox.onSubmit = null
    })
  }
}
