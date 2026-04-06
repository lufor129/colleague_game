/**
 * DialogueBox — Phaser 對話框 UI
 * 顯示 NPC 對話 + 玩家輸入框
 */

export function shouldStopDialogueKeyPropagation(key) {
  if (!key) return false

  return key === ' ' ||
    key === 'Enter' ||
    key.startsWith('Arrow') ||
    ['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(key)
}

export function normalizeDialogueHistory(history, characterName) {
  return (history ?? []).map((entry) => ({
    role: entry.speakerId === 'xiaoqian' ? 'player' : 'npc',
    label: entry.speakerId === 'xiaoqian' ? '你' : characterName,
    content: entry.content
  }))
}

export function appendPlayerTurn(history, content) {
  return [
    ...(history ?? []),
    { role: 'player', label: '你', content }
  ]
}

export function appendLoadingTurn(history, characterName) {
  return [
    ...(history ?? []),
    { role: 'npc', label: characterName, content: '⋯', isLoading: true }
  ]
}

export function replaceLoadingTurn(history, characterName, content) {
  const nextHistory = [...(history ?? [])]
  const loadingIndex = nextHistory.findLastIndex((entry) => entry.isLoading)

  if (loadingIndex === -1) {
    return [...nextHistory, { role: 'npc', label: characterName, content, isLoading: false }]
  }

  nextHistory[loadingIndex] = {
    role: 'npc',
    label: characterName,
    content,
    isLoading: false
  }

  return nextHistory
}

export function appendSystemAction(history, content) {
  return [
    ...(history ?? []),
    { role: 'system', label: '系統', content }
  ]
}

export function canReleaseMovement(isDialogueVisible, isInputFocused) {
  if (!isDialogueVisible) return true
  return !isInputFocused
}

export function getDialogueLayoutMode(viewportWidth) {
  return viewportWidth <= 1100 ? 'stacked' : 'split'
}

export class DialogueBox {
  constructor(scene) {
    this.scene = scene
    this.container = null
    this.nameText = null
    this.bodyText = null
    this.inputField = null   // HTML input element（覆蓋在 canvas 上）
    this.historyDom = null
    this.optionsDom = null
    this.metaDom = null
    this.transcript = []
    this.onSubmit = null
    this.onAdvance = null
    this.isVisible = false

    this._createDOM()
  }

  _createDOM() {
    // 用 DOM overlay 做輸入框（比 Phaser 內建輸入好用）
    const overlay = document.createElement('div')
    overlay.id = 'dialogue-overlay'
    overlay.dataset.layoutMode = getDialogueLayoutMode(window.innerWidth)
    overlay.style.cssText = `
      width: 100%;
      height: 100%;
      display: none;
      flex-direction: column;
      gap: 10px;
      min-height: 0;
    `

    // NPC 對話框
    const npcBox = document.createElement('div')
    npcBox.id = 'npc-box'
    npcBox.style.cssText = `
      background: rgba(10, 10, 30, 0.92);
      border: 2px solid #4a6fa5;
      border-radius: 8px;
      padding: 14px 18px;
      color: #e8e8f0;
      min-height: 220px;
      flex: 1;
      display: flex;
      flex-direction: column;
    `

    this.historyDom = document.createElement('div')
    this.historyDom.style.cssText = `
      flex: 1;
      min-height: 140px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
      padding-right: 4px;
    `

    npcBox.appendChild(this.historyDom)

    this.optionsDom = document.createElement('div')
    this.optionsDom.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    `

    this.metaDom = document.createElement('div')
    this.metaDom.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    `

    // 玩家輸入列
    const inputRow = document.createElement('div')
    inputRow.style.cssText = `display: flex; gap: 8px; align-items: stretch;`

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
      if (shouldStopDialogueKeyPropagation(e.key)) {
        e.stopPropagation()
      }
      if (e.key === 'Enter') handleSend()
    })
    this.inputField.addEventListener('keyup', e => {
      if (shouldStopDialogueKeyPropagation(e.key)) {
        e.stopPropagation()
      }
    })

    inputRow.appendChild(this.inputField)
    inputRow.appendChild(sendBtn)

    overlay.appendChild(npcBox)
    overlay.appendChild(this.optionsDom)
    overlay.appendChild(this.metaDom)
    overlay.appendChild(inputRow)
    const sidebarRoot = document.getElementById('dialogue-sidebar') ?? document.body
    sidebarRoot.appendChild(overlay)

    this.overlay = overlay
  }

  show(characterName) {
    this.overlay.style.display = 'flex'
    this.transcript = []
    this.renderTranscript()
    this.optionsDom.innerHTML = ''
    this.isVisible = true
    this.inputField.focus()
  }

  hide() {
    this.overlay.style.display = 'none'
    this.isVisible = false
  }

  isInputFocused() {
    return document.activeElement === this.inputField
  }

  setLoading() {
    return undefined
  }

  setText(text) {
    return text
  }

  setHistory(history, characterName) {
    this.transcript = normalizeDialogueHistory(history, characterName)
    this.renderTranscript()
  }

  renderTranscript() {
    this.historyDom.innerHTML = ''

    for (const entry of this.transcript) {
      const item = document.createElement('div')
      item.style.cssText = `
        align-self: ${entry.role === 'player' ? 'flex-end' : 'flex-start'};
        max-width: 82%;
        background: ${entry.role === 'player' ? 'rgba(74, 111, 165, 0.42)' : 'rgba(255, 255, 255, 0.06)'};
        border: 1px solid ${entry.role === 'player' ? 'rgba(126, 184, 247, 0.45)' : 'rgba(255, 255, 255, 0.08)'};
        border-radius: 10px;
        padding: 8px 10px;
      `

      const label = document.createElement('div')
      label.textContent = entry.label
      label.style.cssText = `
        font-size: 11px;
        color: ${entry.role === 'player' ? '#bcd8ff' : '#aab3c7'};
        margin-bottom: 4px;
      `

      const body = document.createElement('div')
      body.textContent = entry.content
      body.style.cssText = `
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-wrap;
        opacity: ${entry.isLoading ? 0.7 : 1};
      `

      item.appendChild(label)
      item.appendChild(body)
      this.historyDom.appendChild(item)
    }

    this.historyDom.scrollTop = this.historyDom.scrollHeight
  }

  setOptions(options) {
    this.optionsDom.innerHTML = ''

    for (const option of options ?? []) {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = option.label
      button.style.cssText = `
        background: rgba(42, 74, 127, 0.85);
        color: #e8e8f0;
        border: 1px solid #4a6fa5;
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 13px;
        cursor: pointer;
      `
      button.addEventListener('click', () => {
        if (this.onSubmit) {
          this.onSubmit(option.text)
        }
      })
      this.optionsDom.appendChild(button)
    }
  }

  setAdvanceAction(enabled) {
    this.metaDom.innerHTML = ''
    if (!enabled) return

    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = '繼續主線'
    button.style.cssText = `
      background: rgba(126, 184, 247, 0.12);
      color: #bcd8ff;
      border: 1px solid rgba(126, 184, 247, 0.45);
      border-radius: 999px;
      padding: 7px 12px;
      font-size: 12px;
      cursor: pointer;
    `
    button.addEventListener('click', () => {
      if (this.onAdvance) this.onAdvance()
    })
    this.metaDom.appendChild(button)
  }

  setError(msg) {
    this.transcript = replaceLoadingTurn(this.transcript, '系統', `[錯誤：${msg}]`)
    this.renderTranscript()
  }

  destroy() {
    this.overlay.remove()
  }
}
