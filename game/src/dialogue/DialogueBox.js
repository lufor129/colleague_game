/**
 * DialogueBox — Phaser 對話框 UI
 * 顯示 NPC 對話 + 玩家輸入框
 */

export class DialogueBox {
  constructor(scene) {
    this.scene = scene
    this.container = null
    this.nameText = null
    this.bodyText = null
    this.inputField = null   // HTML input element（覆蓋在 canvas 上）
    this.onSubmit = null
    this.isVisible = false

    this._createDOM()
  }

  _createDOM() {
    // 用 DOM overlay 做輸入框（比 Phaser 內建輸入好用）
    const overlay = document.createElement('div')
    overlay.id = 'dialogue-overlay'
    overlay.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 800px;
      padding: 0 0 20px 0;
      display: none;
      flex-direction: column;
      gap: 8px;
      font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
    `

    // NPC 對話框
    const npcBox = document.createElement('div')
    npcBox.id = 'npc-box'
    npcBox.style.cssText = `
      background: rgba(10, 10, 30, 0.92);
      border: 2px solid #4a6fa5;
      border-radius: 8px;
      padding: 12px 16px;
      color: #e8e8f0;
      min-height: 80px;
    `

    this.nameDom = document.createElement('div')
    this.nameDom.style.cssText = `
      color: #7eb8f7;
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 6px;
    `

    this.bodyDom = document.createElement('div')
    this.bodyDom.style.cssText = `
      font-size: 15px;
      line-height: 1.6;
      white-space: pre-wrap;
    `

    npcBox.appendChild(this.nameDom)
    npcBox.appendChild(this.bodyDom)

    // 玩家輸入列
    const inputRow = document.createElement('div')
    inputRow.style.cssText = `display: flex; gap: 8px;`

    this.inputField = document.createElement('input')
    this.inputField.type = 'text'
    this.inputField.placeholder = '輸入你想說的話...'
    this.inputField.style.cssText = `
      flex: 1;
      background: rgba(10, 10, 30, 0.85);
      border: 1px solid #4a6fa5;
      border-radius: 6px;
      color: #e8e8f0;
      font-size: 14px;
      padding: 8px 12px;
      outline: none;
    `

    const sendBtn = document.createElement('button')
    sendBtn.textContent = '說'
    sendBtn.style.cssText = `
      background: #2a4a7f;
      color: #e8e8f0;
      border: 1px solid #4a6fa5;
      border-radius: 6px;
      padding: 8px 18px;
      font-size: 14px;
      cursor: pointer;
    `

    const handleSend = () => {
      const text = this.inputField.value.trim()
      if (text && this.onSubmit) {
        this.onSubmit(text)
        this.inputField.value = ''
      }
    }

    sendBtn.addEventListener('click', handleSend)
    this.inputField.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleSend()
    })

    inputRow.appendChild(this.inputField)
    inputRow.appendChild(sendBtn)

    overlay.appendChild(npcBox)
    overlay.appendChild(inputRow)
    document.body.appendChild(overlay)

    this.overlay = overlay
  }

  show(characterName) {
    this.overlay.style.display = 'flex'
    this.nameDom.textContent = characterName
    this.bodyDom.textContent = '...'
    this.isVisible = true
    this.inputField.focus()
  }

  hide() {
    this.overlay.style.display = 'none'
    this.isVisible = false
  }

  setLoading() {
    this.bodyDom.textContent = '⋯'
  }

  setText(text) {
    this.bodyDom.textContent = text
  }

  setError(msg) {
    this.bodyDom.textContent = `[錯誤：${msg}]`
    this.bodyDom.style.color = '#ff6b6b'
  }

  destroy() {
    this.overlay.remove()
  }
}
